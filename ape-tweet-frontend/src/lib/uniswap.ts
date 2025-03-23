import { Token, CurrencyAmount, Percent, TradeType } from "@uniswap/sdk-core";
import { Route, SwapQuoter, SwapRouter, Trade } from "@uniswap/v3-sdk";
import { createPublicClient, http, Address, Hex } from "viem";
import { base } from "viem/chains";
import {
  UNISWAP_QUOTER_ADDRESS,
  UNISWAP_SWAP_ROUTER_ADDRESS,
} from "./constants";
import { PrivyClient } from "@privy-io/server-auth";

// ABI snippets
const poolAbi = [
  {
    inputs: [],
    name: "slot0",
    outputs: [
      { name: "sqrtPriceX96", type: "uint160" },
      { name: "tick", type: "int24" },
      { name: "observationIndex", type: "uint16" },
      { name: "observationCardinality", type: "uint16" },
      { name: "observationCardinalityNext", type: "uint16" },
      { name: "feeProtocol", type: "uint8" },
      { name: "unlocked", type: "bool" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "liquidity",
    outputs: [{ name: "", type: "uint128" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// Create Viem clients
export const publicClient = createPublicClient({
  chain: base,
  transport: http(),
});

export const getPoolInfo = async (poolAddress: Address) => {
  const [slot0, liquidity] = await Promise.all([
    publicClient.readContract({
      address: poolAddress,
      abi: poolAbi,
      functionName: "slot0",
    }),
    publicClient.readContract({
      address: poolAddress,
      abi: poolAbi,
      functionName: "liquidity",
    }),
  ]);

  return {
    liquidity: liquidity.toString(),
    sqrtPriceX96: slot0[0].toString(),
    tick: slot0[1],
  };
};

export const getOutputQuote = async (
  route: Route<Token, Token>,
  amountIn: bigint,
  tokenIn: Token
) => {
  const { calldata } = await SwapQuoter.quoteCallParameters(
    route,
    CurrencyAmount.fromRawAmount(tokenIn, amountIn.toString()),
    TradeType.EXACT_INPUT,
    {
      useQuoterV2: true,
    }
  );

  const quoteCallReturnData = await publicClient.call({
    to: UNISWAP_QUOTER_ADDRESS,
    data: calldata as `0x${string}`,
  });

  return quoteCallReturnData.data;
};

export const executeSwap = async (
  privy: PrivyClient,
  walletId: string,
  route: Route<Token, Token>,
  amountIn: Hex,
  amountOut: Hex,
  tokenIn: Token,
  tokenOut: Token,
  recipient: Address
) => {
  const options = {
    slippageTolerance: new Percent(50, 10_000), // 50 bips, or 0.50%
    deadline: Math.floor(Date.now() / 1000) + 60 * 20, // 20 minutes
    recipient,
  };

  const trade = Trade.createUncheckedTrade({
    route,
    inputAmount: CurrencyAmount.fromRawAmount(tokenIn, amountIn),
    outputAmount: CurrencyAmount.fromRawAmount(tokenOut, amountOut),
    tradeType: TradeType.EXACT_INPUT,
  });

  console.log("trade", trade);

  const methodParameters = SwapRouter.swapCallParameters([trade], options);

  console.log("methodParameters", methodParameters);

  const { hash } = await privy.walletApi.ethereum.sendTransaction({
    walletId,
    caip2: "eip155:8453",
    transaction: {
      to: UNISWAP_SWAP_ROUTER_ADDRESS,
      value: methodParameters.value as Hex,
      data: methodParameters.calldata as Address,
      chainId: 8453,
    },
  });

  return hash;
};
