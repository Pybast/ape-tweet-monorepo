import { NextResponse } from "next/server";
import { Token } from "@uniswap/sdk-core";
import { Pool, FeeAmount, Route } from "@uniswap/v3-sdk";
import { Address, getAddress, toHex } from "viem";
import { base } from "viem/chains";
import { PrivyClient } from "@privy-io/server-auth";
import { WETH_ADDRESS, POOL_FACTORY_CONTRACT_ADDRESS } from "@/lib/constants";
import {
  getPoolInfo,
  getOutputQuote,
  executeSwap,
  publicClient,
} from "@/lib/uniswap";
import { TokenInfo } from "@/app/types";

if (!process.env.NEXT_PUBLIC_PRIVY_APP_ID)
  throw new Error("NEXT_PUBLIC_PRIVY_APP_ID is not defined");
if (!process.env.PRIVY_APP_SECRET)
  throw new Error("PRIVY_APP_SECRET is not defined");

const privy = new PrivyClient(
  process.env.NEXT_PUBLIC_PRIVY_APP_ID,
  process.env.PRIVY_APP_SECRET
);

type SwapRequest = TokenInfo & {
  walletId: string;
};

// All possible fee tiers in Uniswap V3
const FEE_TIERS = [
  FeeAmount.LOWEST, // 0.01%
  FeeAmount.LOW, // 0.05%
  FeeAmount.MEDIUM, // 0.3%
  FeeAmount.HIGH, // 1%
];

async function findExistingPool(
  tokenIn: Token,
  tokenOut: Token
): Promise<{ address: Address; feeTier: FeeAmount } | null> {
  for (const feeTier of FEE_TIERS) {
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
      args: [tokenIn.address as Address, tokenOut.address as Address, feeTier],
    });

    // Check if pool exists and has non-zero address
    if (
      poolAddress &&
      poolAddress !== "0x0000000000000000000000000000000000000000"
    ) {
      console.log(`Found pool with fee tier ${feeTier}: ${poolAddress}`);
      return { address: poolAddress as Address, feeTier };
    }
  }

  return null;
}

function validateSwapRequest(request: SwapRequest): void {
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

  if (!request.walletId) {
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

    const { fromToken, toToken, walletId } = swapRequest;

    // Create token instances
    const tokenIn = new Token(
      base.id, // Base chain ID
      WETH_ADDRESS,
      18,
      "WETH",
      "Wrapped Ether"
    );

    // For ETH to token swaps, use the address from fromToken.address as the destination
    const tokenOutAddress = getAddress(toToken.address);
    const tokenOut = new Token(
      base.id,
      tokenOutAddress,
      18 // assuming ERC20 with 18 decimals
    );

    // Find a pool with liquidity across all fee tiers
    const pool = await findExistingPool(tokenIn, tokenOut);

    if (!pool) {
      throw new Error(
        `No liquidity pool found for token at address ${tokenOutAddress} across any fee tier`
      );
    }

    // Get pool info
    const poolInfo = await getPoolInfo(pool.address);

    // Create pool instance
    const poolInstance = new Pool(
      tokenIn,
      tokenOut,
      pool.feeTier,
      poolInfo.sqrtPriceX96,
      poolInfo.liquidity,
      poolInfo.tick
    );

    // Create route
    const route = new Route([poolInstance], tokenIn, tokenOut);

    // Get quote
    const amountIn = BigInt(fromToken.amount) * BigInt(10 ** 18); // Convert to wei
    const amountOut = await getOutputQuote(route, amountIn, tokenIn);

    console.log("amountOut", amountOut);

    if (!amountOut) {
      throw new Error("Failed to get quote for swap");
    }

    if (walletId === undefined) throw new Error("walletId is undefined");

    // Get backend wallet
    const { address: backendWalletAddress } = await privy.walletApi.getWallet({
      id: walletId,
    });

    if (!backendWalletAddress) {
      throw new Error("Backend wallet not found");
    }

    const backendWalletAddressChecksummed = getAddress(backendWalletAddress);

    // Execute swap
    const txHash = await executeSwap(
      privy,
      walletId,
      route,
      toHex(amountIn),
      toHex(amountOut),
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
