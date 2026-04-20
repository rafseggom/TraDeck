export type RedClave = "local" | "sepolia";

export type JuegoCarta = "MTG" | "POKEMON" | "MANUAL" | "DESCONOCIDO";

export enum EstadoTrade {
  NoListada = 0,
  Listada = 1,
  EnEscrow = 2,
}

export interface ConfigRed {
  clave: RedClave;
  nombre: string;
  chainId: number;
  rpcUrl: string;
  nftAddress: string;
  coinAddress: string;
  deployBlock: number;
}

export interface MetadataCarta {
  name: string;
  image: string;
  serialNumber: string;
  description?: string;
  attributes?: Array<{
    trait_type: string;
    value: string;
  }>;
}

export interface EstadoTradeDetalle {
  seller: string;
  buyer: string;
  price: bigint;
  state: EstadoTrade;
}

export interface EstadoSwapDetalle {
  proposer: string;
  proposerTokenId: number;
  wantedTokenId: number;
  isActive: boolean;
}

export interface CartaCadena {
  tokenId: number;
  owner: string;
  tokenUri: string;
  nombre: string;
  imagen: string;
  numeroSerie: string;
  juego: JuegoCarta;
  metadata: MetadataCarta | null;
  trade: EstadoTradeDetalle;
  swapOffer: EstadoSwapDetalle;
  precioTdc: string | null;
}

export interface EstadoLecturaCadena {
  cartas: CartaCadena[];
  cartasMercado: CartaCadena[];
  cartasUsuario: CartaCadena[];
}

export interface EventoCartaHistorial {
  txHash: string;
  blockNumber: number;
  timestamp: number;
  from: string;
  to: string;
  tipo: string;
}

export interface ResultadoBusquedaCarta {
  id: string;
  nombre: string;
  imagen: string;
  juego: JuegoCarta;
  detalle?: string;
}

export interface NotificacionUI {
  id: number;
  tipo: "ok" | "error" | "info";
  mensaje: string;
}
