export interface TokenData {
  symbol: string;
  amount: string;
  address?: string;
}

export interface TokenInfo {
  fromToken: TokenData;
  toToken: TokenData;
}
