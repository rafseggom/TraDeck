import { ZeroAddress, formatUnits, parseUnits } from "ethers";
import { crearContratos, obtenerBrowserProvider, obtenerReadProvider } from "./contracts";
import { leerMetadataDesdeTokenUri } from "./ipfs";
import { EstadoTrade, type CartaCadena, type ConfigRed, type EstadoLecturaCadena, type EstadoSwapDetalle, type EstadoTradeDetalle, type EventoCartaHistorial, type JuegoCarta } from "./types";

function esAddressIgual(a: string, b: string): boolean {
  return a.toLowerCase() === b.toLowerCase();
}

function inferirJuego(metadata: any): JuegoCarta {
  if (!metadata?.attributes || !Array.isArray(metadata.attributes)) {
    return "DESCONOCIDO";
  }

  const atributoJuego = metadata.attributes.find(
    (atributo: any) => String(atributo.trait_type ?? "").toLowerCase() === "juego",
  );

  const valor = String(atributoJuego?.value ?? "").toUpperCase();

  if (valor.includes("MTG")) {
    return "MTG";
  }

  if (valor.includes("POKEMON")) {
    return "POKEMON";
  }

  if (valor.includes("MANUAL")) {
    return "MANUAL";
  }

  return "DESCONOCIDO";
}

function normalizarTrade(data: any): EstadoTradeDetalle {
  return {
    seller: String(data.seller ?? ZeroAddress),
    buyer: String(data.buyer ?? ZeroAddress),
    price: BigInt(data.price ?? 0n),
    state: Number(data.state ?? 0) as EstadoTrade,
  };
}

function normalizarSwap(data: any): EstadoSwapDetalle {
  return {
    proposer: String(data.proposer ?? ZeroAddress),
    proposerTokenId: Number(data.proposerTokenId ?? 0),
    wantedTokenId: Number(data.wantedTokenId ?? 0),
    isActive: Boolean(data.isActive),
  };
}

async function tokenIdsDetectados(red: ConfigRed): Promise<number[]> {
  const provider = obtenerReadProvider(red);
  const { nft } = crearContratos(provider, red);

  const eventos = await nft.queryFilter(nft.filters.Transfer(), red.deployBlock, "latest");
  const ids = new Set<number>();

  for (const evento of eventos as any[]) {
    const valor = evento.args?.tokenId ?? evento.args?.[2];
    const tokenId = Number(valor ?? NaN);
    if (Number.isFinite(tokenId)) {
      ids.add(tokenId);
    }
  }

  return Array.from(ids).sort((a, b) => b - a);
}

async function construirCarta(red: ConfigRed, tokenId: number): Promise<CartaCadena | null> {
  const provider = obtenerReadProvider(red);
  const { nft } = crearContratos(provider, red);

  try {
    const [owner, tokenUri, tradeRaw, swapRaw] = await Promise.all([
      nft.ownerOf(BigInt(tokenId)),
      nft.tokenURI(BigInt(tokenId)),
      nft.trades(BigInt(tokenId)),
      nft.swapOffers(BigInt(tokenId)),
    ]);

    const trade = normalizarTrade(tradeRaw);
    const swapOffer = normalizarSwap(swapRaw);

    const metadata = await leerMetadataDesdeTokenUri(String(tokenUri));
    const nombre = metadata?.name ?? `Carta #${tokenId}`;
    const imagen = metadata?.image ?? "";
    const numeroSerie = metadata?.serialNumber ?? "SIN-SERIE";
    const juego = inferirJuego(metadata);

    const precioTdc =
      trade.state === EstadoTrade.Listada || trade.state === EstadoTrade.EnEscrow
        ? formatUnits(trade.price, 18)
        : null;

    return {
      tokenId,
      owner: String(owner),
      tokenUri: String(tokenUri),
      nombre,
      imagen,
      numeroSerie,
      juego,
      metadata,
      trade,
      swapOffer,
      precioTdc,
    };
  } catch {
    return null;
  }
}

export async function leerEstadoCadena(red: ConfigRed, walletAddress?: string): Promise<EstadoLecturaCadena> {
  const ids = await tokenIdsDetectados(red);
  const cartas = (
    await Promise.all(ids.map(async (id) => construirCarta(red, id)))
  ).filter((carta): carta is CartaCadena => carta !== null);

  const cartasMercado = cartas.filter(
    (carta) => carta.trade.state === EstadoTrade.Listada || carta.trade.state === EstadoTrade.EnEscrow,
  );

  const cartasUsuario = walletAddress
    ? cartas.filter((carta) => esAddressIgual(carta.owner, walletAddress))
    : [];

  return {
    cartas,
    cartasMercado,
    cartasUsuario,
  };
}

export async function leerSaldoTDC(red: ConfigRed, walletAddress: string): Promise<string> {
  const provider = obtenerReadProvider(red);
  const { coin } = crearContratos(provider, red);
  const saldo = await coin.balanceOf(walletAddress);
  return formatUnits(BigInt(saldo), 18);
}

async function contratosConFirma(red: ConfigRed): Promise<{ nft: any; coin: any; walletAddress: string }> {
  const provider = await obtenerBrowserProvider();
  const signer = await provider.getSigner();
  const network = await provider.getNetwork();

  if (Number(network.chainId) !== red.chainId) {
    throw new Error(`Tu cartera esta en otra red. Debe ser ${red.nombre}`);
  }

  const walletAddress = await signer.getAddress();
  const { nft, coin } = crearContratos(signer, red);
  return { nft, coin, walletAddress };
}

export async function solicitarAirdrop(red: ConfigRed): Promise<string> {
  const { coin } = await contratosConFirma(red);
  const tx = await coin.airdrop();
  await tx.wait();
  return String(tx.hash);
}

export async function mintearCarta(red: ConfigRed, tokenUri: string): Promise<{ txHash: string; tokenId: number | null }> {
  const { nft } = await contratosConFirma(red);
  const tx = await nft.mintCard(tokenUri);
  const receipt = await tx.wait();

  let tokenId: number | null = null;
  for (const log of receipt.logs ?? []) {
    try {
      const parsed = nft.interface.parseLog(log);
      if (parsed && parsed.name === "Transfer" && parsed.args.from === ZeroAddress) {
        tokenId = Number(parsed.args.tokenId);
      }
    } catch {
      continue;
    }
  }

  return { txHash: String(tx.hash), tokenId };
}

export async function listarCartaEnVenta(red: ConfigRed, tokenId: number, precioTdc: string): Promise<string> {
  const { nft } = await contratosConFirma(red);
  const precio = parseUnits(precioTdc, 18);
  const tx = await nft.listForSale(BigInt(tokenId), precio);
  await tx.wait();
  return String(tx.hash);
}

export async function comprarCarta(red: ConfigRed, tokenId: number): Promise<string> {
  const { nft, coin, walletAddress } = await contratosConFirma(red);
  const trade = await nft.trades(BigInt(tokenId));
  const precio = BigInt(trade.price ?? 0);

  if (precio <= 0n) {
    throw new Error("La carta no tiene precio valido");
  }

  const allowance = BigInt(await coin.allowance(walletAddress, red.nftAddress));
  if (allowance < precio) {
    const txApprove = await coin.approve(red.nftAddress, precio);
    await txApprove.wait();
  }

  const tx = await nft.buyCard(BigInt(tokenId));
  await tx.wait();
  return String(tx.hash);
}

export async function confirmarEntrega(red: ConfigRed, tokenId: number): Promise<string> {
  const { nft } = await contratosConFirma(red);
  const tx = await nft.confirmDelivery(BigInt(tokenId));
  await tx.wait();
  return String(tx.hash);
}

export async function proponerIntercambio(red: ConfigRed, myTokenId: number, wantedTokenId: number): Promise<string> {
  const { nft } = await contratosConFirma(red);
  const tx = await nft.proposeSwap(BigInt(myTokenId), BigInt(wantedTokenId));
  await tx.wait();
  return String(tx.hash);
}

export async function aceptarIntercambio(red: ConfigRed, proposerTokenId: number): Promise<string> {
  const { nft } = await contratosConFirma(red);
  const tx = await nft.acceptSwap(BigInt(proposerTokenId));
  await tx.wait();
  return String(tx.hash);
}

export async function cancelarIntercambio(red: ConfigRed, myTokenId: number): Promise<string> {
  const { nft } = await contratosConFirma(red);
  const tx = await nft.cancelSwap(BigInt(myTokenId));
  await tx.wait();
  return String(tx.hash);
}

export async function obtenerHistorialCarta(red: ConfigRed, tokenId: number): Promise<EventoCartaHistorial[]> {
  const provider = obtenerReadProvider(red);
  const { nft } = crearContratos(provider, red);

  const eventos = await nft.queryFilter(
    nft.filters.Transfer(null, null, BigInt(tokenId)),
    red.deployBlock,
    "latest",
  );

  const historial = await Promise.all(
    (eventos as any[]).map(async (evento) => {
      const from = String(evento.args?.from ?? ZeroAddress);
      const to = String(evento.args?.to ?? ZeroAddress);
      const block = await provider.getBlock(evento.blockNumber);

      let tipo = "Transferencia";
      if (esAddressIgual(from, ZeroAddress)) {
        tipo = "Creacion";
      } else if (esAddressIgual(to, red.nftAddress)) {
        tipo = "Listado para venta";
      } else if (esAddressIgual(from, red.nftAddress)) {
        tipo = "Entrega confirmada";
      }

      return {
        txHash: String(evento.transactionHash),
        blockNumber: Number(evento.blockNumber),
        timestamp: Number(block?.timestamp ?? 0),
        from,
        to,
        tipo,
      } satisfies EventoCartaHistorial;
    }),
  );

  return historial.sort((a, b) => b.blockNumber - a.blockNumber);
}

export function formatearErrorBlockchain(error: unknown): string {
  if (typeof error === "string") {
    return error;
  }

  if (error && typeof error === "object") {
    const e = error as any;

    if (typeof e.shortMessage === "string" && e.shortMessage.length > 0) {
      return e.shortMessage;
    }

    if (typeof e.reason === "string" && e.reason.length > 0) {
      return e.reason;
    }

    if (typeof e.message === "string" && e.message.length > 0) {
      return e.message;
    }
  }

  return "Error desconocido de blockchain";
}
