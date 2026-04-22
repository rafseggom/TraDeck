import {
  BrowserProvider,
  Contract,
  JsonRpcProvider,
  type ContractRunner,
  type Eip1193Provider,
} from "ethers";
import nftAbi from "../abi/TraDeckNFT.json";
import coinAbi from "../abi/TraDeckCoin.json";
import type { ConfigRed } from "./types";

interface EthereumWindowProvider extends Eip1193Provider {
  on?: (event: string, listener: (...args: any[]) => void) => void;
  removeListener?: (event: string, listener: (...args: any[]) => void) => void;
}

declare global {
  interface Window {
    ethereum?: EthereumWindowProvider;
  }
}

export function tieneMetaMask(): boolean {
  return typeof window !== "undefined" && !!window.ethereum;
}

export async function obtenerBrowserProvider(): Promise<BrowserProvider> {
  if (!window.ethereum) {
    throw new Error("MetaMask no esta disponible en el navegador");
  }

  return new BrowserProvider(window.ethereum);
}

export function obtenerReadProvider(red: ConfigRed): JsonRpcProvider {
  if (!red.rpcUrl || red.rpcUrl.trim().length === 0) {
    throw new Error(`No hay RPC configurado para la red ${red.nombre}`);
  }

  return new JsonRpcProvider(red.rpcUrl, red.chainId);
}

export function crearContratos(runner: ContractRunner, red: ConfigRed): {
  nft: Contract;
  coin: Contract;
} {
  const nft = new Contract(red.nftAddress, nftAbi, runner);
  const coin = new Contract(red.coinAddress, coinAbi, runner);
  return { nft, coin };
}

export async function solicitarCambioRed(red: ConfigRed): Promise<void> {
  if (!window.ethereum) {
    throw new Error("MetaMask no esta disponible para cambiar de red");
  }

  const chainHex = `0x${red.chainId.toString(16)}`;

  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: chainHex }],
    });
  } catch (error: any) {
    if (error?.code !== 4902) {
      throw error;
    }

    if (!red.rpcUrl || red.rpcUrl.trim().length === 0) {
      throw new Error(`No hay RPC configurado para agregar la red ${red.nombre} en MetaMask`);
    }

    const parametrosRed =
      red.clave === "sepolia"
        ? {
            chainId: chainHex,
            chainName: "Sepolia",
            rpcUrls: [red.rpcUrl],
            nativeCurrency: {
              name: "Ether",
              symbol: "ETH",
              decimals: 18,
            },
            blockExplorerUrls: ["https://sepolia.etherscan.io"],
          }
        : {
            chainId: chainHex,
            chainName: "Hardhat Local",
            rpcUrls: [red.rpcUrl],
            nativeCurrency: {
              name: "ETH",
              symbol: "ETH",
              decimals: 18,
            },
          };

    await window.ethereum.request({
      method: "wallet_addEthereumChain",
      params: [parametrosRed],
    });
  }
}

export function resumirDireccion(direccion: string | null | undefined): string {
  if (!direccion) {
    return "Sin conectar";
  }

  return `${direccion.slice(0, 6)}...${direccion.slice(-4)}`;
}
