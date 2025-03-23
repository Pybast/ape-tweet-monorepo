"use client";

import { useState, useEffect } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { ConnectWalletButton } from "../components/ConnectWalletButton";
import { TweetSimulator } from "../components/TweetSimulator";
import { TokenInfoCard } from "../components/TokenInfoCard";
import { SwapButton } from "../components/SwapButton";
import { TxStatus } from "../components/TxStatus";
import { TokenInfo } from "./types";
import { Address } from "viem";

export default function Home() {
  const { authenticated, ready, getAccessToken } = usePrivy();
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [txStatus, setTxStatus] = useState<
    "idle" | "pending" | "success" | "error"
  >("idle");
  const [txHash, setTxHash] = useState<string | undefined>();
  const [error, setError] = useState<string | undefined>();
  const [privyWallet, setPrivyWallet] = useState<Address | null>(null);
  const [isCheckingWallet, setIsCheckingWallet] = useState(false);

  useEffect(() => {
    async function checkAndCreateWallet() {
      if (!ready || !authenticated || privyWallet || isCheckingWallet) return;

      setIsCheckingWallet(true);
      try {
        const accessToken = await getAccessToken();

        // First check if wallet exists
        const response = await fetch("/api/wallet", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (response.ok) {
          const wallet = await response.json();
          setPrivyWallet(wallet.address);
          return;
        }

        if (response.status !== 404) {
          throw new Error("Failed to check wallet status");
        }

        // If no wallet exists (404), create one
        const createResponse = await fetch("/api/wallet", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!createResponse.ok) {
          throw new Error("Failed to create wallet");
        }

        const newWallet = await createResponse.json();
        setPrivyWallet(newWallet.address);
      } catch (err) {
        console.error("Error checking/creating wallet:", err);
        setError(err instanceof Error ? err.message : "Failed to setup wallet");
      } finally {
        setIsCheckingWallet(false);
      }
    }

    checkAndCreateWallet();
  }, [ready, authenticated, privyWallet, getAccessToken, isCheckingWallet]);

  const handleTweetSubmit = async (tweet: string) => {
    setIsLoading(true);
    setError(undefined);
    setTokenInfo(null);

    try {
      const response = await fetch("/api/parse-tweet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tweet }),
      });

      if (!response.ok) {
        throw new Error("Failed to parse tweet");
      }

      const data = await response.json();
      // Convert API response to TokenInfo format
      if (data.address) {
        setTokenInfo({
          fromToken: {
            symbol: "ETH",
            amount: data.amount.toString(),
          },
          toToken: {
            symbol: "???",
            amount: "0",
            address: data.address,
          },
        });
        setTxStatus("idle");
      } else {
        throw new Error("No token address found");
      }
    } catch (err) {
      setError("Failed to parse tweet");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwap = async () => {
    if (!tokenInfo) return;

    try {
      setTxStatus("pending");
      setError(undefined);

      const accessToken = await getAccessToken();

      const response = await fetch("/api/execute-swap", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          ...tokenInfo,
        }),
      });

      if (!response.ok) {
        throw new Error("Swap failed");
      }

      const { txHash } = await response.json();
      setTxHash(txHash);
      setTxStatus("success");
    } catch (err) {
      setTxStatus("error");
      setError(err instanceof Error ? err.message : "Swap failed");
      console.error(err);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">ApeTweet</h1>
          <ConnectWalletButton />
        </div>

        {authenticated && (
          <div className="space-y-6">
            {privyWallet ? (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-medium text-gray-900 mb-4">
                  Your Privy Wallet
                </h2>
                <div>
                  <p className="text-sm font-mono text-gray-900">
                    {privyWallet}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Send ETH to this address
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
            )}

            <TweetSimulator
              onTweetSubmit={handleTweetSubmit}
              isLoading={isLoading}
              error={error}
              tokenData={tokenInfo}
            />

            {tokenInfo && (
              <>
                <TokenInfoCard tokenInfo={tokenInfo} />
                <SwapButton
                  onSwap={handleSwap}
                  disabled={!tokenInfo || txStatus === "pending"}
                  isLoading={txStatus === "pending"}
                />
              </>
            )}

            <TxStatus status={txStatus} txHash={txHash} error={error} />
          </div>
        )}

        {!authenticated && (
          <div className="text-center py-12">
            <h2 className="text-xl font-medium text-gray-900 mb-4">
              Connect your wallet to start swapping
            </h2>
            <p className="text-gray-500">
              Use ApeTweet to easily swap tokens directly from Twitter
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
