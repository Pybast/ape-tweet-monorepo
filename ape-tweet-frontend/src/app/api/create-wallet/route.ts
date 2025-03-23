import { NextResponse } from "next/server";
import { PrivyClient } from "@privy-io/server-auth";

if (process.env.NEXT_PUBLIC_PRIVY_APP_ID === undefined)
  throw new Error("process.env.NEXT_PUBLIC_PRIVY_APP_ID is undefined");
if (process.env.PRIVY_APP_SECRET === undefined)
  throw new Error("process.env.PRIVY_APP_SECRET is undefined");

const privy = new PrivyClient(
  process.env.NEXT_PUBLIC_PRIVY_APP_ID,
  process.env.PRIVY_APP_SECRET
);

export async function POST() {
  try {
    // Create a backend wallet
    const { id, address, chainType } = await privy.walletApi.create({
      chainType: "ethereum",
    });

    console.log("Wallet created:", { address, chainType });

    return NextResponse.json({
      id,
      address,
      chainType,
    });
  } catch (error) {
    console.error("Error creating wallet:", error);
    return NextResponse.json(
      { error: "Failed to create wallet" },
      { status: 500 }
    );
  }
}
