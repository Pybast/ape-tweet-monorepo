interface TxStatusProps {
  txHash?: string;
  status: "idle" | "pending" | "success" | "error";
  error?: string;
}

export const TxStatus = ({ txHash, status, error }: TxStatusProps) => {
  if (status === "idle") {
    return null;
  }

  const statusColors = {
    pending: "bg-yellow-50 border-yellow-200 text-yellow-800",
    success: "bg-green-50 border-green-200 text-green-800",
    error: "bg-red-50 border-red-200 text-red-800",
  };

  const statusMessages = {
    pending: "Transaction Pending",
    success: "Transaction Successful",
    error: "Transaction Failed",
  };

  return (
    <div className={`p-4 mb-4 rounded-lg border ${statusColors[status]}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {status === "pending" && (
            <svg
              className="h-5 w-5 text-yellow-400 animate-spin"
              viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          )}
          {status === "success" && (
            <svg
              className="h-5 w-5 text-green-400"
              viewBox="0 0 20 20"
              fill="currentColor">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          )}
          {status === "error" && (
            <svg
              className="h-5 w-5 text-red-400"
              viewBox="0 0 20 20"
              fill="currentColor">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium">{statusMessages[status]}</h3>
          {txHash && (
            <div className="mt-2 text-sm">
              <p>
                Transaction Hash:{" "}
                <a
                  href={`https://etherscan.io/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono underline">
                  {txHash.slice(0, 6)}...{txHash.slice(-4)}
                </a>
              </p>
            </div>
          )}
          {error && <p className="mt-2 text-sm">{error}</p>}
        </div>
      </div>
    </div>
  );
};
