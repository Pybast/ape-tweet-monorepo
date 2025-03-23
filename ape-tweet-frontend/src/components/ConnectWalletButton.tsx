import { usePrivy } from "@privy-io/react-auth";

export const ConnectWalletButton = () => {
  const { login, logout, authenticated, user } = usePrivy();

  if (authenticated) {
    return (
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600">
          {user?.wallet?.address?.slice(0, 6)}...
          {user?.wallet?.address?.slice(-4)}
        </span>
        <button
          onClick={logout}
          className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600">
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={login}
      className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-blue-600">
      Connect Wallet
    </button>
  );
};
