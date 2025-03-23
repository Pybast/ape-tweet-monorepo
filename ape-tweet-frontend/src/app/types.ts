export interface TokenInfo {
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

export interface WalletInfo {
  frontendWallet?: {
    address: string;
  };
  backendWallet?: {
    id: string;
    address: string;
    chainType: string;
  };
}
