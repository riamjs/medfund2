import { rpc, Contract } from "@stellar/stellar-sdk";
import dotenv from "dotenv";
dotenv.config();

export const server = new rpc.Server(process.env.STELLAR_RPC_URL!);
export const contract = new Contract(process.env.CONTRACT_ID!);

export async function verifyTransactionOnChain(txHash: string) {
  const tx = await server.getTransaction(txHash);
  if (tx.status !== "SUCCESS") {
    throw new Error(`Transaction ${txHash} not successful on-chain (status: ${tx.status})`);
  }
  return tx;
}