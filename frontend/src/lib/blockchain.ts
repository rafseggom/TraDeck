import { ZeroAddress, formatUnits, parseUnits } from "ethers";
import { crearContratos, obtenerBrowserProvider, obtenerReadProvider } from "./contracts";
import { leerMetadataDesdeTokenUri } from "./ipfs";
import {
  EstadoTrade,
  type CartaCadena,
  type ConfigRed,
  type EstadoLecturaCadena,
  type EstadoSwapDetalle,
  type EstadoTradeDetalle,
  type EventoCartaHistorial,
  type JuegoCarta,
  type VeracidadCartaResultado,
} from "./types";

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
  const bloqueActual = await provider.getBlockNumber();
  const bloqueInicio = Math.max(0, red.deployBlock);
  const eventos: any[] = [];

  if (bloqueInicio > bloqueActual) {
    return [];
  }

  // Alchemy Free tier: máximo 10 bloques por eth_getLogs
  // Usamos 5 para ser conservador y evitar timeouts
  const tamanoTramo = 5;
  for (let desde = bloqueInicio; desde <= bloqueActual; desde += tamanoTramo) {
    const hasta = Math.min(desde + tamanoTramo - 1, bloqueActual);
    try {
      const tramo = await nft.queryFilter(nft.filters.Transfer(), desde, hasta);
      eventos.push(...(tramo as any[]));
    } catch (error) {
      console.warn(`[blockchain] Fallo consultando eventos en bloques ${desde}-${hasta}:`, error);
      // Continuamos con el siguiente tramo
    }
  }
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
    // Consultar datos en paralelo pero con manejo independiente de errores
    let owner: string = ZeroAddress;
    let tokenUri: string = "";
    let tradeRaw: any = null;
    let swapRaw: any = null;

    try {
      owner = String(await nft.ownerOf(BigInt(tokenId)));
    } catch (error) {
      console.warn(`[blockchain] Error leyendo owner de tokenId ${tokenId}:`, error);
      return null; // Token probablemente no existe
    }

    try {
      tokenUri = String(await nft.tokenURI(BigInt(tokenId)));
    } catch (error) {
      console.warn(`[blockchain] Error leyendo tokenURI de tokenId ${tokenId}:`, error);
      return null; // No podemos continuar sin tokenURI
    }

    try {
      tradeRaw = await nft.trades(BigInt(tokenId));
    } catch (error) {
      console.warn(`[blockchain] Error leyendo trade de tokenId ${tokenId}:`, error);
      tradeRaw = {};
    }

    try {
      swapRaw = await nft.swapOffers(BigInt(tokenId));
    } catch (error) {
      console.warn(`[blockchain] Error leyendo swap de tokenId ${tokenId}:`, error);
      swapRaw = {};
    }

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
  } catch (error) {
    console.error(`[blockchain] Error construyendo carta ${tokenId}:`, error);
    return null;
  }
}

export async function leerEstadoCadena(red: ConfigRed, walletAddress?: string): Promise<EstadoLecturaCadena> {
  const provider = obtenerReadProvider(red);
  const { nft } = crearContratos(provider, red);

  try {
    // 1. SOLA LLAMADA A ALCHEMY: Trae toda la info de todas las cartas
    const rawCards = await nft.getAllCards();

    // 2. Procesamos y sacamos los metadatos de IPFS
    const cartasPromises = rawCards.map(async (rawCard: any) => {
      const tokenId = Number(rawCard.tokenId);
      const owner = String(rawCard.owner);
      const tokenUri = String(rawCard.tokenUri);
      
      // Si el owner es ZeroAddress, el token no existe (por seguridad)
      if (esAddressIgual(owner, ZeroAddress)) return null;

      const trade = normalizarTrade(rawCard.trade);
      const swapOffer = normalizarSwap(rawCard.swapOffer);

      const metadata = await leerMetadataDesdeTokenUri(tokenUri);
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
        owner,
        tokenUri,
        nombre,
        imagen,
        numeroSerie,
        juego,
        metadata,
        trade,
        swapOffer,
        precioTdc,
      } as CartaCadena;
    });

    const cartasValidas = (await Promise.all(cartasPromises)).filter((c): c is CartaCadena => c !== null);

    // 3. Filtramos para el estado de React
    const cartasMercado = cartasValidas.filter(
      (carta) => carta.trade.state === EstadoTrade.Listada || carta.trade.state === EstadoTrade.EnEscrow,
    );

    const cartasUsuario = walletAddress
      ? cartasValidas.filter((carta) => esAddressIgual(carta.owner, walletAddress))
      : [];

    return {
      cartas: cartasValidas.sort((a, b) => b.tokenId - a.tokenId), // Las más nuevas primero
      cartasMercado,
      cartasUsuario,
    };
  } catch (error) {
    console.error("[blockchain] Error en leerEstadoCadena (¿Has redesplegado el contrato?):", error);
    return { cartas: [], cartasMercado: [], cartasUsuario: [] };
  }
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

  const saldo = BigInt(await coin.balanceOf(walletAddress));
  if (saldo < precio) {
    throw new Error(
      `Saldo TDC insuficiente para comprar. Necesitas ${formatUnits(precio, 18)} TDC y tienes ${formatUnits(saldo, 18)} TDC. Pulsa \"Pedir airdrop\" e intenta de nuevo.`,
    );
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

function decodeErc20InsufficientBalance(data: string): string | null {
  const hex = data.toLowerCase();
  const selector = "0xe450d38c"; // ERC20InsufficientBalance(address sender, uint256 balance, uint256 needed)
  if (!hex.startsWith(selector)) {
    return null;
  }

  const payload = hex.slice(selector.length);
  if (payload.length < 64 * 3) {
    return null;
  }

  const senderWord = payload.slice(0, 64);
  const balanceWord = payload.slice(64, 128);
  const neededWord = payload.slice(128, 192);

  const sender = `0x${senderWord.slice(24)}`;
  const balance = BigInt(`0x${balanceWord}`);
  const needed = BigInt(`0x${neededWord}`);

  return `Saldo TDC insuficiente para completar la compra. Cuenta: ${sender}. Saldo: ${formatUnits(balance, 18)} TDC. Necesario: ${formatUnits(needed, 18)} TDC.`;
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

  const bloqueActual = await provider.getBlockNumber();
  const bloqueInicio = Math.max(0, red.deployBlock);
  const eventos: any[] = [];

  if (bloqueInicio > bloqueActual) {
    return [];
  }

  if (red.clave === "sepolia") {
    try {
      // Alchemy nos limita a 10 bloques. Como Web3 es descentralizado, 
      // saltamos esa restricción conectándonos a un nodo público comunitario 
      // solo para leer la historia inmutable de la carta.
      const { JsonRpcProvider } = await import("ethers");
      const providerPublico = new JsonRpcProvider("https://ethereum-sepolia-rpc.publicnode.com");
      const { nft: nftPublico } = crearContratos(providerPublico, red);

      // En nodos públicos podemos buscar en tramos gigantes de 10.000 bloques
      const tamanoTramo = 10000;
      for (let desde = bloqueInicio; desde <= bloqueActual; desde += tamanoTramo) {
        const hasta = Math.min(desde + tamanoTramo - 1, bloqueActual);
        try {
          const filtro = nftPublico.filters.Transfer(null, null, BigInt(tokenId));
          const tramo = await nftPublico.queryFilter(filtro, desde, hasta);
          eventos.push(...(tramo as any[]));
        } catch (e) {
          console.warn(`[blockchain] Fallo leyendo tramo ${desde}-${hasta}:`, e);
        }
      }
    } catch (error) {
      console.error(`[blockchain] Fallo consultando historial en Sepolia con nodo público:`, error);
    }
  } else {
    const tamanoTramo = 5;
    for (let desde = bloqueInicio; desde <= bloqueActual; desde += tamanoTramo) {
      const hasta = Math.min(desde + tamanoTramo - 1, bloqueActual);
      try {
        const tramo = await nft.queryFilter(nft.filters.Transfer(null, null, BigInt(tokenId)), desde, hasta);
        eventos.push(...(tramo as any[]));
      } catch (error) {
        console.warn(`[blockchain] Fallo consultando eventos en bloques ${desde}-${hasta}:`, error);
      }
    }
  }

  // --- PROCESAMIENTO DE BLOQUES (Funciona igual para ambas) ---
  // Limitar paralelismo a 3 para evitar rate limits
  const bloqueCache = new Map<number, any>();
  const historial: EventoCartaHistorial[] = [];

  for (let i = 0; i < eventos.length; i++) {
    const evento = eventos[i];
    const from = String(evento.args?.from ?? ZeroAddress);
    const to = String(evento.args?.to ?? ZeroAddress);

    // Aquí volvemos a usar tu provider de Alchemy normal, porque leer
    // el hash de 1 solo bloque concreto sí está permitido y es instantáneo.
    let block = bloqueCache.get(evento.blockNumber);
    if (!block) {
      try {
        block = await provider.getBlock(evento.blockNumber);
        bloqueCache.set(evento.blockNumber, block);
      } catch (error) {
        console.warn(`No se pudo consultar bloque ${evento.blockNumber}:`, error);
        block = null;
      }
    }

    let previousBlock = null;
    if (evento.blockNumber > 0) {
      previousBlock = bloqueCache.get(evento.blockNumber - 1);
      if (!previousBlock) {
        try {
          previousBlock = await provider.getBlock(evento.blockNumber - 1);
          bloqueCache.set(evento.blockNumber - 1, previousBlock);
        } catch (error) {
          console.warn(`No se pudo consultar bloque ${evento.blockNumber - 1}:`, error);
        }
      }
    }

    const parentHash = String(block?.parentHash ?? "");
    const previousBlockHash = String(previousBlock?.hash ?? "");

    let tipo = "Transferencia";
    if (esAddressIgual(from, ZeroAddress)) {
      tipo = "Creacion";
    } else if (esAddressIgual(to, red.nftAddress)) {
      tipo = "Listado para venta";
    } else if (esAddressIgual(from, red.nftAddress)) {
      tipo = "Entrega confirmada";
    }

    historial.push({
      txHash: String(evento.transactionHash),
      blockNumber: Number(evento.blockNumber),
      blockHash: String(evento.blockHash ?? block?.hash ?? ""),
      parentHash,
      previousBlockHash,
      parentHashValido:
        parentHash.length > 0 &&
        previousBlockHash.length > 0 &&
        esAddressIgual(parentHash, previousBlockHash),
      timestamp: Number(block?.timestamp ?? 0),
      from,
      to,
      tipo,
    } satisfies EventoCartaHistorial);
  }

  return historial.sort((a, b) => b.blockNumber - a.blockNumber);
}

export async function comprobarVeracidadCarta(
  red: ConfigRed,
  tokenId: number,
): Promise<VeracidadCartaResultado> {
  try {
    const provider = obtenerReadProvider(red);
    const { nft } = crearContratos(provider, red);

    const detalles: string[] = [];
    let esValida = true;

    const historialDesc = await obtenerHistorialCarta(red, tokenId);
    if (historialDesc.length === 0) {
      return {
        esValida: false,
        resumen: "No hay eventos Transfer para este token en blockchain.",
        detalles: ["Sin eventos on-chain, no se puede verificar la autenticidad."],
      };
    }

    const historialAsc = [...historialDesc].sort((a, b) => a.blockNumber - b.blockNumber);

    const primerEvento = historialAsc[0];
    if (!esAddressIgual(primerEvento.from, ZeroAddress)) {
      esValida = false;
      detalles.push("El primer evento no parte de la direccion cero (mint inconsistente).");
    }

    let ownerCalculado = primerEvento.to;

    for (let i = 0; i < historialAsc.length; i += 1) {
      const evento = historialAsc[i];

      try {
        const block = await provider.getBlock(evento.blockNumber);
        if (!block || String(block.hash ?? "") !== evento.blockHash) {
          esValida = false;
          detalles.push(`Bloque ${evento.blockNumber} no coincide con el hash registrado en el evento.`);
        }

        if (String(block?.parentHash ?? "") !== evento.parentHash) {
          esValida = false;
          detalles.push(`Bloque ${evento.blockNumber} no coincide en parentHash con su lectura on-chain.`);
        }

        if (!evento.parentHashValido) {
          esValida = false;
          detalles.push(`Bloque ${evento.blockNumber} no enlaza correctamente al bloque N-1.`);
        }

        const receipt = await provider.getTransactionReceipt(evento.txHash);
        if (!receipt || String(receipt.blockHash ?? "") !== evento.blockHash) {
          esValida = false;
          detalles.push(`Transaccion ${evento.txHash} no cuadra con su bloque de historial.`);
        }

        if (i > 0 && !esAddressIgual(evento.from, ownerCalculado)) {
          esValida = false;
          detalles.push(
            `Cadena de propietario inconsistente en bloque ${evento.blockNumber} (from=${evento.from}, esperado=${ownerCalculado}).`,
          );
        }

        ownerCalculado = evento.to;
      } catch (error) {
        console.warn(`[blockchain] Error verificando evento en bloque ${evento.blockNumber}:`, error);
        esValida = false;
        detalles.push(`No se pudo verificar el bloque ${evento.blockNumber} (RPC error).`);
      }
    }

    const ownerOnChain = String(await nft.ownerOf(BigInt(tokenId)));
    if (!esAddressIgual(ownerOnChain, ownerCalculado)) {
      esValida = false;
      detalles.push("El propietario final calculado no coincide con ownerOf en contrato.");
    }

    const tokenUri = String(await nft.tokenURI(BigInt(tokenId)));
    const metadata = await leerMetadataDesdeTokenUri(tokenUri);
    if (!metadata?.serialNumber || metadata.serialNumber.trim().length === 0) {
      esValida = false;
      detalles.push("La metadata no incluye serialNumber valido.");
    }

    if (esValida) {
      detalles.push("Hash de bloques, receipts, propietario y metadata coinciden en toda la trazabilidad.");
    }

    return {
      esValida,
      resumen: esValida
        ? "Carta autentica: la trazabilidad on-chain es integra."
        : "Carta con inconsistencias detectadas en la trazabilidad on-chain.",
      detalles,
    };
  } catch (error) {
    console.error(`[blockchain] Error comprobando veracidad de carta ${tokenId}:`, error);
    return {
      esValida: false,
      resumen: "No se pudo verificar la autenticidad debido a un error de RPC.",
      detalles: [
        "Si usas Sepolia con Alchemy Free tier, la verificacion completa puede no estar disponible.",
        "Error: " + (error instanceof Error ? error.message : String(error)),
      ],
    };
  }
}

export function formatearErrorBlockchain(error: unknown): string {
  if (typeof error === "string") {
    return error;
  }

  if (error && typeof error === "object") {
    const e = error as any;

    const posiblesData: unknown[] = [e.data, e.error?.data, e.info?.error?.data];
    for (const data of posiblesData) {
      if (typeof data === "string" && data.startsWith("0x")) {
        const decoded = decodeErc20InsufficientBalance(data);
        if (decoded) {
          return decoded;
        }
      }
    }

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
