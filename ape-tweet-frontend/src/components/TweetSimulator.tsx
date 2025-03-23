import { useState } from "react";

interface TokenData {
  symbol: string;
  amount: string;
  address?: string;
}

interface TweetSimulatorProps {
  onTweetSubmit: (tweet: string) => void;
  isLoading?: boolean;
  error?: string | null;
  tokenData?: TokenData | null;
}

export const TweetSimulator = ({
  onTweetSubmit,
  isLoading = false,
  error = null,
  tokenData = null,
}: TweetSimulatorProps) => {
  const [tweet, setTweet] = useState(
    "New ticker in town, address is 0x8b67f2E56139cA052a7EC49cBCd1aA9c83F2752a"
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    onTweetSubmit(tweet);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="tweet"
          className="block text-sm font-medium text-gray-700">
          Simulate Tweet
        </label>
        <textarea
          id="tweet"
          rows={3}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm text-gray-900 bg-white"
          placeholder="New ticker in town, address is 0x8b67f2E56139cA052a7EC49cBCd1aA9c83F2752a"
          value={tweet}
          onChange={(e) => setTweet(e.target.value)}
          disabled={isLoading}
        />
      </div>

      {error && <div className="text-red-600 text-sm">{error}</div>}

      {tokenData && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="text-sm text-green-800">
            <div>
              Address: <code className="font-mono">{tokenData.address}</code>
            </div>
            <div className="mt-1">
              Amount: {tokenData.amount} {tokenData.symbol}
            </div>
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading || !tweet.trim()}
        className={`inline-flex justify-center px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary ${
          isLoading || !tweet.trim()
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-primary hover:bg-blue-600"
        }`}>
        {isLoading ? "Processing..." : "Submit Tweet"}
      </button>
    </form>
  );
};
