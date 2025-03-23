import { Token } from "@uniswap/sdk-core";
import {
  createPublicClient,
  http,
  Address,
  Hex,
  encodeFunctionData,
} from "viem";
import { base } from "viem/chains";
import { UNISWAP_SWAP_ROUTER_ADDRESS } from "./constants";
import { PrivyClient } from "@privy-io/server-auth";

// Create Viem clients
export const publicClient = createPublicClient({
  chain: base,
  transport: http(),
});

// SwapRouter02 ABI for exactInputSingle
const swapRouterAbi = [
  {
    inputs: [
      {
        components: [
          {
            name: "tokenIn",
            type: "address",
          },
          {
            name: "tokenOut",
            type: "address",
          },
          {
            name: "fee",
            type: "uint24",
          },
          {
            name: "recipient",
            type: "address",
          },
          {
            name: "amountIn",
            type: "uint256",
          },
          {
            name: "amountOutMinimum",
            type: "uint256",
          },
          {
            name: "sqrtPriceLimitX96",
            type: "uint160",
          },
        ],
        name: "params",
        type: "tuple",
      },
    ],
    name: "exactInputSingle",
    outputs: [
      {
        name: "amountOut",
        type: "uint256",
      },
    ],
    stateMutability: "payable",
    type: "function",
  },
] as const;

export const executeSwap = async (
  privy: PrivyClient,
  walletId: string,
  amountIn: Hex,
  tokenIn: Token,
  tokenOut: Token,
  recipient: Address
) => {
  // First approve the router to spend tokens
  const approvalData = `0x095ea7b3${UNISWAP_SWAP_ROUTER_ADDRESS.slice(
    2
  ).padStart(64, "0")}${amountIn.slice(2).padStart(64, "0")}` as `0x${string}`;

  const approvalTx = await privy.walletApi.ethereum.sendTransaction({
    walletId,
    caip2: "eip155:8453",
    transaction: {
      to: tokenIn.address as `0x${string}`,
      data: approvalData,
      chainId: 8453,
    },
  });

  // Wait for approval to be mined
  await publicClient.waitForTransactionReceipt({
    hash: approvalTx.hash as `0x${string}`,
  });

  // Encode the swap parameters
  const swapData = encodeFunctionData({
    abi: swapRouterAbi,
    functionName: "exactInputSingle",
    args: [
      {
        tokenIn: tokenIn.address as Address,
        tokenOut: tokenOut.address as Address,
        fee: 3000, // 0.3%
        recipient,
        amountIn: BigInt(amountIn),
        amountOutMinimum: BigInt(0), // No minimum (be careful with this in production!)
        sqrtPriceLimitX96: BigInt(0), // No limit
      },
    ],
  });

  // Execute the swap
  const { hash } = await privy.walletApi.ethereum.sendTransaction({
    walletId,
    caip2: "eip155:8453",
    transaction: {
      to: UNISWAP_SWAP_ROUTER_ADDRESS,
      data: swapData,
      value: tokenIn.isNative ? amountIn : "0x0",
      chainId: 8453,
    },
  });

  return hash;
};
