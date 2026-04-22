import type { ConfigRed, RedClave } from "./types";

interface VariablesEntorno {
  VITE_LOCAL_RPC_URL?: string;
  VITE_SEPOLIA_RPC_URL?: string;
  VITE_LOCAL_CHAIN_ID?: string;
  VITE_SEPOLIA_CHAIN_ID?: string;
  VITE_LOCAL_TRADECK_NFT?: string;
  VITE_LOCAL_TRADECK_COIN?: string;
  VITE_SEPOLIA_TRADECK_NFT?: string;
  VITE_SEPOLIA_TRADECK_COIN?: string;
  VITE_LOCAL_DEPLOY_BLOCK?: string;
  VITE_SEPOLIA_DEPLOY_BLOCK?: string;
  VITE_PINATA_PROXY_URL?: string;
}

const env = import.meta.env as ImportMetaEnv & VariablesEntorno;

function toNumero(valor: string | undefined, porDefecto: number): number {
  if (!valor || valor.trim().length === 0) {
    return porDefecto;
  }

  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : porDefecto;
}

function toAddress(valor: string | undefined): string {
  return valor && valor.startsWith("0x") ? valor : "0x0000000000000000000000000000000000000000";
}

export const REDES: Record<RedClave, ConfigRed> = {
  local: {
    clave: "local",
    nombre: "Hardhat Local",
    chainId: toNumero(env.VITE_LOCAL_CHAIN_ID, 31337),
    rpcUrl: env.VITE_LOCAL_RPC_URL ?? "http://127.0.0.1:8545",
    nftAddress: toAddress(env.VITE_LOCAL_TRADECK_NFT),
    coinAddress: toAddress(env.VITE_LOCAL_TRADECK_COIN),
    deployBlock: toNumero(env.VITE_LOCAL_DEPLOY_BLOCK, 0),
  },
  sepolia: {
    clave: "sepolia",
    nombre: "Sepolia",
    chainId: toNumero(env.VITE_SEPOLIA_CHAIN_ID, 11155111),
    rpcUrl: env.VITE_SEPOLIA_RPC_URL ?? "https://ethereum-sepolia-rpc.publicnode.com",
    nftAddress: toAddress(env.VITE_SEPOLIA_TRADECK_NFT),
    coinAddress: toAddress(env.VITE_SEPOLIA_TRADECK_COIN),
    deployBlock: toNumero(env.VITE_SEPOLIA_DEPLOY_BLOCK, 0),
  },
};

export const PINATA_PROXY_URL = env.VITE_PINATA_PROXY_URL ?? "http://127.0.0.1:8787";

export function redPorClave(clave: RedClave): ConfigRed {
  return REDES[clave];
}
