import { NextResponse } from "next/server";
import { Token } from "@uniswap/sdk-core";
import { getAddress, toHex } from "viem";
import { base } from "viem/chains";
import { PrivyClient } from "@privy-io/server-auth";
import { WETH_ADDRESS } from "@/lib/constants";
import { executeSwap } from "@/lib/uniswap";
import { TokenInfo } from "@/app/types";
import { db } from "@/lib/db";
import { userWallets } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

if (!process.env.NEXT_PUBLIC_PRIVY_APP_ID)
  throw new Error("NEXT_PUBLIC_PRIVY_APP_ID is not defined");
if (!process.env.PRIVY_APP_SECRET)
  throw new Error("PRIVY_APP_SECRET is not defined");

const privy = new PrivyClient(
  process.env.NEXT_PUBLIC_PRIVY_APP_ID,
  process.env.PRIVY_APP_SECRET
);

type SwapRequest = TokenInfo;

function validateSwapRequest(request: SwapRequest): void {
  if (!request.fromToken || !request.toToken) {
    throw new Error("Missing token information");
  }

  const destinationAddress = request.toToken.address;
  if (!destinationAddress) {
    throw new Error("Missing destination token address");
  }

  try {
    getAddress(destinationAddress);
  } catch (e) {
    throw new Error(
      `Invalid destination token address: ${destinationAddress} - ${e}`
    );
  }

  if (!request.fromToken.amount) {
    throw new Error("Missing swap amount");
  }

  const amount = Number(request.fromToken.amount);
  if (isNaN(amount) || amount <= 0) {
    throw new Error("Invalid swap amount");
  }
}

export async function POST(request: Request) {
  try {
    // Get and verify the access token
    const authHeader = request.headers.get("authorization");
    const accessToken = authHeader?.replace("Bearer ", "");

    if (!accessToken) {
      return NextResponse.json(
        { error: "No authorization token provided" },
        { status: 401 }
      );
    }

    // Verify the token and get user info
    const verifiedClaims = await privy.verifyAuthToken(accessToken);
    const userId = verifiedClaims.userId;

    // Get user's wallet from database
    const userWallet = await db
      .select()
      .from(userWallets)
      .where(eq(userWallets.userId, userId))
      .limit(1);

    if (!userWallet.length) {
      return NextResponse.json(
        { error: "No wallet found for user" },
        { status: 404 }
      );
    }

    const swapRequest: SwapRequest = await request.json();
    validateSwapRequest(swapRequest);

    const { fromToken, toToken } = swapRequest;

    // Create token instances
    const tokenIn = new Token(
      base.id,
      WETH_ADDRESS,
      18,
      "WETH",
      "Wrapped Ether"
    );

    if (!toToken.address) throw new Error("Missing token address");

    const tokenOutAddress = getAddress(toToken.address);
    const tokenOut = new Token(base.id, tokenOutAddress, 18);

    const amountIn = BigInt(fromToken.amount);

    const backendWalletAddressChecksummed = getAddress(userWallet[0].address);

    const txHash = await executeSwap(
      privy,
      userWallet[0].id,
      toHex(amountIn),
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
