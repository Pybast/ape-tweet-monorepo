"use client";

import { useState, useEffect } from "react";
import { usePrivy, useCreateWallet } from "@privy-io/react-auth";
import { ConnectWalletButton } from "../components/ConnectWalletButton";
import { TweetSimulator } from "../components/TweetSimulator";
import { TokenInfoCard } from "../components/TokenInfoCard";
import { SwapButton } from "../components/SwapButton";
import { TxStatus } from "../components/TxStatus";

interface TokenInfo {
  fromToken: {
    symbol: string;
    amount: string;
    address?: string;
  };
  toToken: {
    symbol: string;
    amount: string;
    address?: string;
  };
}

interface WalletInfo {
  frontendWallet?: {
    address: string;
  };
  backendWallet?: {
    id: string;
    address: string;
    chainType: string;
  };
}

export default function Home() {
  const { authenticated, ready, user } = usePrivy();
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [txStatus, setTxStatus] = useState<
    "idle" | "pending" | "success" | "error"
  >("idle");
  const [txHash, setTxHash] = useState<string | undefined>();
  const [error, setError] = useState<string | undefined>();
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [isCheckingWallet, setIsCheckingWallet] = useState(false);

  const { createWallet } = useCreateWallet({
    onSuccess: async ({ wallet }) => {
      try {
        // Create backend wallet
        const response = await fetch("/api/create-wallet", { method: "POST" });
        if (!response.ok) throw new Error("Backend wallet creation failed");

        const backendWallet = await response.json();
        setWalletInfo({
          frontendWallet: { address: wallet.address },
          backendWallet,
        });
      } catch (err) {
        console.error("Failed to create backend wallet:", err);
      }
    },
    onError: (error) => {
      console.error("Failed to create frontend wallet:", error);
    },
  });

  useEffect(() => {
    async function checkAndCreateWallet() {
      if (!ready || !authenticated || walletInfo || isCheckingWallet) return;

      setIsCheckingWallet(true);
      try {
        // Check if user already has a wallet
        if (user?.wallet?.address) {
          // Check if backend wallet exists
          const response = await fetch("/api/create-wallet", {
            method: "POST",
          });
          const backendWallet = await response.json();

          setWalletInfo({
            frontendWallet: { address: user.wallet.address },
            backendWallet,
          });
        } else {
          // Create new wallet if none exists
          createWallet({ createAdditional: false });
        }
      } catch (err) {
        console.error("Error checking/creating wallet:", err);
      } finally {
        setIsCheckingWallet(false);
      }
    }

    checkAndCreateWallet();
  }, [ready, authenticated, walletInfo, user, createWallet, isCheckingWallet]);

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

      const response = await fetch("/api/execute-swap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tokenInfo),
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
            {walletInfo ? (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-medium text-gray-900 mb-4">
                  Your Wallets
                </h2>
                <div className="space-y-4">
                  {walletInfo.frontendWallet && (
                    <div>
                      <p className="text-sm text-gray-500">Frontend Wallet</p>
                      <p className="text-sm font-mono text-gray-900">
                        {walletInfo.frontendWallet.address}
                      </p>
                    </div>
                  )}
                  {walletInfo.backendWallet && (
                    <div>
                      <p className="text-sm text-gray-500">Backend Wallet</p>
                      <p className="text-sm font-mono text-gray-900">
                        {walletInfo.backendWallet.address}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        ID: {walletInfo.backendWallet.id}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            )}

            <TweetSimulator
              onTweetSubmit={handleTweetSubmit}
              isLoading={isLoading}
              error={error}
              tokenData={tokenInfo?.fromToken}
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
