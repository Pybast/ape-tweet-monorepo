import { TokenInfo } from "@/app/types";

interface TokenInfoCardProps {
  tokenInfo: TokenInfo | null;
  isLoading?: boolean;
}

export const TokenInfoCard = ({
  tokenInfo,
  isLoading = false,
}: TokenInfoCardProps) => {
  if (isLoading) {
    return (
      <div className="p-4 bg-white rounded-lg shadow">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!tokenInfo) {
    return null;
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Swap Details</h3>
      <div className="space-y-4">
        <div>
          <p className="text-sm text-gray-500">From</p>
          <p className="text-lg font-medium text-gray-900">
            {tokenInfo.fromToken.amount} {tokenInfo.fromToken.symbol}
          </p>
        </div>
        <div className="flex justify-center">
          <svg
            className="h-6 w-6 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
        </div>
        <div>
          <p className="text-sm text-gray-500">To</p>
          <p className="text-lg font-medium text-gray-900">
            {tokenInfo.toToken.amount} {tokenInfo.toToken.symbol}
          </p>
        </div>
      </div>
    </div>
  );
};
