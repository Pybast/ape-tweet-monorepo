import { NextResponse } from "next/server";
import { PrivyClient } from "@privy-io/server-auth";
import { db } from "@/lib/db";
import { userWallets } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

if (!process.env.NEXT_PUBLIC_PRIVY_APP_ID) {
  throw new Error("NEXT_PUBLIC_PRIVY_APP_ID is not defined");
}
if (!process.env.PRIVY_APP_SECRET) {
  throw new Error("PRIVY_APP_SECRET is not defined");
}

const privy = new PrivyClient(
  process.env.NEXT_PUBLIC_PRIVY_APP_ID,
  process.env.PRIVY_APP_SECRET
);

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

    // Check if user already has a wallet
    const existingWallet = await db
      .select()
      .from(userWallets)
      .where(eq(userWallets.userId, userId))
      .limit(1);

    if (existingWallet.length > 0) {
      console.log("Found existing wallet for user:", existingWallet[0]);
      return NextResponse.json(existingWallet[0]);
    }

    // Create a new wallet if none exists
    console.log("Creating new wallet for user:", userId);
    const newWallet = await privy.walletApi.create({
      chainType: "ethereum",
    });

    // Save the wallet in the database
    const savedWallet = await db
      .insert(userWallets)
      .values({
        id: newWallet.id,
        userId: userId,
        address: newWallet.address,
      })
      .returning();

    console.log("Created and saved new wallet:", savedWallet[0]);
    return NextResponse.json(savedWallet[0]);
  } catch (error) {
    console.error("Error handling wallet request:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to handle wallet request",
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check wallet status
export async function GET(request: Request) {
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

    // Check if user has a wallet
    const existingWallet = await db
      .select()
      .from(userWallets)
      .where(eq(userWallets.userId, userId))
      .limit(1);

    if (existingWallet.length > 0) {
      return NextResponse.json(existingWallet[0]);
    }

    return NextResponse.json(
      { error: "No wallet found for user" },
      { status: 404 }
    );
  } catch (error) {
    console.error("Error checking wallet:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to check wallet",
      },
      { status: 500 }
    );
  }
}
