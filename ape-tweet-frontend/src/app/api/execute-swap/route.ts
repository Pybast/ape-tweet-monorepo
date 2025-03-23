import { NextResponse } from "next/server";
import { Token } from "@uniswap/sdk-core";
import { Pool, FeeAmount, Route } from "@uniswap/v3-sdk";
import { createWalletClient, custom, Address, getAddress } from "viem";
import { base } from "viem/chains";
import { PrivyClient } from "@privy-io/server-auth";
import { WETH_ADDRESS, POOL_FACTORY_CONTRACT_ADDRESS } from "@/lib/constants";
import {
  getPoolInfo,
  getOutputQuote,
  executeSwap,
  publicClient,
} from "@/lib/uniswap";

if (!process.env.NEXT_PUBLIC_PRIVY_APP_ID)
  throw new Error("NEXT_PUBLIC_PRIVY_APP_ID is not defined");
if (!process.env.PRIVY_APP_SECRET)
  throw new Error("PRIVY_APP_SECRET is not defined");

const privy = new PrivyClient(
  process.env.NEXT_PUBLIC_PRIVY_APP_ID,
  process.env.PRIVY_APP_SECRET
);

interface TokenData {
  address: string;
  symbol: string;
  amount: string;
  walletId?: string;
}

interface SwapRequest {
  fromToken: TokenData;
  toToken: TokenData;
}

function validateSwapRequest(request: SwapRequest): void {
  console.log("request", request);
  if (!request.fromToken || !request.toToken) {
    throw new Error("Missing token information");
  }

  // For ETH to token swaps, the destination token address is in fromToken.address
  const destinationAddress = request.toToken.address;
  if (!destinationAddress) {
    throw new Error("Missing destination token address");
  }

  try {
    // Validate the destination address is a proper Ethereum address
    getAddress(destinationAddress);
  } catch (e) {
    throw new Error(
      `Invalid destination token address: ${destinationAddress} - ${e}`
    );
  }

  if (!request.fromToken.amount) {
    throw new Error("Missing swap amount");
  }

  if (!request.fromToken.walletId) {
    throw new Error("Missing wallet ID");
  }

  // Validate amount is a valid number
  const amount = Number(request.fromToken.amount);
  if (isNaN(amount) || amount <= 0) {
    throw new Error("Invalid swap amount");
  }
}

export async function POST(request: Request) {
  try {
    const swapRequest: SwapRequest = await request.json();

    // Validate the swap request
    validateSwapRequest(swapRequest);

    const { fromToken } = swapRequest;

    // Create token instances
    const tokenIn = new Token(
      base.id, // Base chain ID
      WETH_ADDRESS,
      18,
      "WETH",
      "Wrapped Ether"
    );

    // For ETH to token swaps, use the address from fromToken.address as the destination
    const tokenOutAddress = getAddress(fromToken.address);
    const tokenOut = new Token(
      base.id,
      tokenOutAddress,
      18, // assuming ERC20 with 18 decimals
      "TOKEN", // Generic name since we don't have symbol info
      "TOKEN" // Generic name since we don't have symbol info
    );

    // Get pool address
    const poolAddress = await publicClient.readContract({
      address: POOL_FACTORY_CONTRACT_ADDRESS,
      abi: [
        {
          inputs: [
            { name: "tokenA", type: "address" },
            { name: "tokenB", type: "address" },
            { name: "fee", type: "uint24" },
          ],
          name: "getPool",
          outputs: [{ name: "", type: "address" }],
          stateMutability: "view",
          type: "function",
        },
      ] as const,
      functionName: "getPool",
      args: [
        tokenIn.address as Address,
        tokenOut.address as Address,
        FeeAmount.MEDIUM,
      ],
    });

    if (!poolAddress) {
      throw new Error(
        `No liquidity pool found for token at address ${tokenOutAddress}`
      );
    }

    // Get pool info
    const poolInfo = await getPoolInfo(poolAddress as Address);

    // Create pool instance
    const pool = new Pool(
      tokenIn,
      tokenOut,
      FeeAmount.MEDIUM,
      poolInfo.sqrtPriceX96,
      poolInfo.liquidity,
      poolInfo.tick
    );

    // Create route
    const route = new Route([pool], tokenIn, tokenOut);

    // Get quote
    const amountIn = BigInt(fromToken.amount) * BigInt(10 ** 18); // Convert to wei
    const amountOut = await getOutputQuote(route, amountIn, tokenIn);

    if (!amountOut) {
      throw new Error("Failed to get quote for swap");
    }

    if (fromToken.walletId === undefined)
      throw new Error("fromToken.walletId is undefined");

    // Get backend wallet
    const { address: backendWalletAddress } = await privy.walletApi.getWallet({
      id: fromToken.walletId,
    });

    if (!backendWalletAddress) {
      throw new Error("Backend wallet not found");
    }

    const backendWalletAddressChecksummed = getAddress(backendWalletAddress);

    // Create wallet client for backend wallet
    const walletClient = createWalletClient({
      account: backendWalletAddressChecksummed,
      chain: base,
      transport: custom(window.ethereum),
    });

    // Execute swap
    const txHash = await executeSwap(
      walletClient,
      route,
      amountIn,
      BigInt(amountOut?.toString() || "0"),
      tokenIn,
      tokenOut,
      backendWalletAddressChecksummed
    );

    return NextResponse.json({ txHash });
  } catch (error) {
    console.error("Swap execution error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to execute swap",
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
