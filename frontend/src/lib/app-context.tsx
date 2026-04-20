import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import {
  aceptarIntercambio,
  cancelarIntercambio,
  comprarCarta,
  confirmarEntrega,
  formatearErrorBlockchain,
  leerEstadoCadena,
  leerSaldoTDC,
  listarCartaEnVenta,
  mintearCarta,
  obtenerHistorialCarta,
  proponerIntercambio,
  solicitarAirdrop,
} from "./blockchain";
import { redPorClave } from "./config";
import {
  obtenerBrowserProvider,
  resumirDireccion,
  solicitarCambioRed,
  tieneMetaMask,
} from "./contracts";
import type {
  CartaCadena,
  ConfigRed,
  EventoCartaHistorial,
  NotificacionUI,
  RedClave,
} from "./types";

interface WalletEstado {
  address: string | null;
  chainId: number | null;
}

interface AppContextValue {
  redClave: RedClave;
  redConfig: ConfigRed;
  wallet: WalletEstado;
  walletResumen: string;
  saldoTdc: string;
  cartas: CartaCadena[];
  cartasMercado: CartaCadena[];
  cartasUsuario: CartaCadena[];
  notificaciones: NotificacionUI[];
  cargandoDatos: boolean;
  procesandoTx: boolean;
  advertenciaRed: string | null;
  conectarWallet: () => Promise<void>;
  desconectarWallet: () => void;
  cambiarRedObjetivo: (clave: RedClave) => Promise<void>;
  refrescarDatos: () => Promise<void>;
  solicitarAirdrop: () => Promise<void>;
  mintearCartaDesdeUri: (tokenUri: string) => Promise<number | null>;
  listarCarta: (tokenId: number, precioTdc: string) => Promise<void>;
  comprarCarta: (tokenId: number) => Promise<void>;
  confirmarEntrega: (tokenId: number) => Promise<void>;
  proponerSwap: (myTokenId: number, wantedTokenId: number) => Promise<void>;
  aceptarSwap: (proposerTokenId: number) => Promise<void>;
  cancelarSwap: (myTokenId: number) => Promise<void>;
  cargarHistorialCarta: (tokenId: number) => Promise<EventoCartaHistorial[]>;
  quitarNotificacion: (id: number) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

function toCadenaId(chainIdHexOrNum: string | number): number {
  if (typeof chainIdHexOrNum === "number") {
    return chainIdHexOrNum;
  }

  if (chainIdHexOrNum.startsWith("0x")) {
    return Number.parseInt(chainIdHexOrNum, 16);
  }

  return Number(chainIdHexOrNum);
}

export function AppProvider({ children }: PropsWithChildren): JSX.Element {
  const [redClave, setRedClave] = useState<RedClave>("local");
  const redConfig = redPorClave(redClave);

  const [wallet, setWallet] = useState<WalletEstado>({
    address: null,
    chainId: null,
  });

  const [saldoTdc, setSaldoTdc] = useState<string>("0");
  const [cartas, setCartas] = useState<CartaCadena[]>([]);
  const [cartasMercado, setCartasMercado] = useState<CartaCadena[]>([]);
  const [cartasUsuario, setCartasUsuario] = useState<CartaCadena[]>([]);

  const [cargandoDatos, setCargandoDatos] = useState<boolean>(false);
  const [procesandoTx, setProcesandoTx] = useState<boolean>(false);
  const [notificaciones, setNotificaciones] = useState<NotificacionUI[]>([]);

  const pushNotificacion = useCallback((tipo: NotificacionUI["tipo"], mensaje: string) => {
    setNotificaciones((actual) => [{ id: Date.now() + Math.floor(Math.random() * 999), tipo, mensaje }, ...actual].slice(0, 6));
  }, []);

  const quitarNotificacion = useCallback((id: number) => {
    setNotificaciones((actual) => actual.filter((n) => n.id !== id));
  }, []);

  const refrescarDatos = useCallback(async () => {
    setCargandoDatos(true);
    try {
      const estado = await leerEstadoCadena(redConfig, wallet.address ?? undefined);
      setCartas(estado.cartas);
      setCartasMercado(estado.cartasMercado);
      setCartasUsuario(estado.cartasUsuario);

      if (wallet.address) {
        const saldo = await leerSaldoTDC(redConfig, wallet.address);
        setSaldoTdc(saldo);
      } else {
        setSaldoTdc("0");
      }
    } catch (error) {
      pushNotificacion("error", formatearErrorBlockchain(error));
    } finally {
      setCargandoDatos(false);
    }
  }, [pushNotificacion, redConfig, wallet.address]);

  const conectarWallet = useCallback(async () => {
    if (!tieneMetaMask()) {
      pushNotificacion("error", "No se detecto MetaMask en este navegador");
      return;
    }

    try {
      const provider = await obtenerBrowserProvider();
      await provider.send("eth_requestAccounts", []);

      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      const network = await provider.getNetwork();

      setWallet({
        address,
        chainId: Number(network.chainId),
      });

      pushNotificacion("ok", "Cartera conectada correctamente");
    } catch (error) {
      pushNotificacion("error", formatearErrorBlockchain(error));
    }
  }, [pushNotificacion]);

  const desconectarWallet = useCallback(() => {
    setWallet({ address: null, chainId: null });
    setSaldoTdc("0");
    setCartasUsuario([]);
    pushNotificacion("info", "Sesion local de cartera cerrada");
  }, [pushNotificacion]);

  const cambiarRedObjetivo = useCallback(
    async (clave: RedClave) => {
      const redNueva = redPorClave(clave);
      setRedClave(clave);

      if (wallet.address && tieneMetaMask()) {
        try {
          await solicitarCambioRed(redNueva);
        } catch (error) {
          pushNotificacion("error", formatearErrorBlockchain(error));
        }
      }
    },
    [pushNotificacion, wallet.address],
  );

  const ejecutarTx = useCallback(
    async (accion: () => Promise<unknown>, mensajeOk: string) => {
      setProcesandoTx(true);
      try {
        await accion();
        pushNotificacion("ok", mensajeOk);
        await refrescarDatos();
      } catch (error) {
        pushNotificacion("error", formatearErrorBlockchain(error));
      } finally {
        setProcesandoTx(false);
      }
    },
    [pushNotificacion, refrescarDatos],
  );

  const solicitarAirdropAccion = useCallback(async () => {
    await ejecutarTx(async () => solicitarAirdrop(redConfig), "Airdrop recibido en tu cartera");
  }, [ejecutarTx, redConfig]);

  const mintearCartaDesdeUri = useCallback(
    async (tokenUri: string): Promise<number | null> => {
      setProcesandoTx(true);
      try {
        const resultado = await mintearCarta(redConfig, tokenUri);
        pushNotificacion("ok", "Carta creada en blockchain");
        await refrescarDatos();
        return resultado.tokenId;
      } catch (error) {
        pushNotificacion("error", formatearErrorBlockchain(error));
        return null;
      } finally {
        setProcesandoTx(false);
      }
    },
    [pushNotificacion, redConfig, refrescarDatos],
  );

  const listarCarta = useCallback(
    async (tokenId: number, precioTdc: string) => {
      await ejecutarTx(
        async () => listarCartaEnVenta(redConfig, tokenId, precioTdc),
        "Carta listada para venta",
      );
    },
    [ejecutarTx, redConfig],
  );

  const comprarCartaAccion = useCallback(
    async (tokenId: number) => {
      await ejecutarTx(async () => comprarCarta(redConfig, tokenId), "Compra iniciada. Falta confirmar entrega");
    },
    [ejecutarTx, redConfig],
  );

  const confirmarEntregaAccion = useCallback(
    async (tokenId: number) => {
      await ejecutarTx(async () => confirmarEntrega(redConfig, tokenId), "Entrega confirmada y pago liberado");
    },
    [ejecutarTx, redConfig],
  );

  const proponerSwap = useCallback(
    async (myTokenId: number, wantedTokenId: number) => {
      await ejecutarTx(
        async () => proponerIntercambio(redConfig, myTokenId, wantedTokenId),
        "Intercambio propuesto correctamente",
      );
    },
    [ejecutarTx, redConfig],
  );

  const aceptarSwap = useCallback(
    async (proposerTokenId: number) => {
      await ejecutarTx(
        async () => aceptarIntercambio(redConfig, proposerTokenId),
        "Intercambio ejecutado",
      );
    },
    [ejecutarTx, redConfig],
  );

  const cancelarSwap = useCallback(
    async (myTokenId: number) => {
      await ejecutarTx(
        async () => cancelarIntercambio(redConfig, myTokenId),
        "Intercambio cancelado",
      );
    },
    [ejecutarTx, redConfig],
  );

  const cargarHistorialCarta = useCallback(
    async (tokenId: number): Promise<EventoCartaHistorial[]> => {
      try {
        return await obtenerHistorialCarta(redConfig, tokenId);
      } catch (error) {
        pushNotificacion("error", formatearErrorBlockchain(error));
        return [];
      }
    },
    [pushNotificacion, redConfig],
  );

  useEffect(() => {
    const autoconectar = async () => {
      if (!tieneMetaMask()) {
        return;
      }

      try {
        const provider = await obtenerBrowserProvider();
        const cuentas = (await provider.send("eth_accounts", [])) as string[];
        if (cuentas.length === 0) {
          return;
        }

        const network = await provider.getNetwork();
        setWallet({
          address: cuentas[0],
          chainId: Number(network.chainId),
        });
      } catch {
        // Ignorado intencionalmente
      }
    };

    void autoconectar();
  }, []);

  useEffect(() => {
    if (!window.ethereum?.on) {
      return;
    }

    const onAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        setWallet({ address: null, chainId: null });
        return;
      }

      setWallet((actual) => ({ ...actual, address: accounts[0] }));
    };

    const onChainChanged = (chainIdHex: string) => {
      setWallet((actual) => ({ ...actual, chainId: toCadenaId(chainIdHex) }));
    };

    window.ethereum.on("accountsChanged", onAccountsChanged);
    window.ethereum.on("chainChanged", onChainChanged);

    return () => {
      window.ethereum?.removeListener?.("accountsChanged", onAccountsChanged);
      window.ethereum?.removeListener?.("chainChanged", onChainChanged);
    };
  }, []);

  useEffect(() => {
    void refrescarDatos();
  }, [redConfig, wallet.address, refrescarDatos]);

  const advertenciaRed =
    wallet.chainId !== null && wallet.chainId !== redConfig.chainId
      ? `Tu cartera esta en chainId ${wallet.chainId}. Cambia a ${redConfig.nombre} (${redConfig.chainId})`
      : null;

  const value = useMemo<AppContextValue>(
    () => ({
      redClave,
      redConfig,
      wallet,
      walletResumen: resumirDireccion(wallet.address),
      saldoTdc,
      cartas,
      cartasMercado,
      cartasUsuario,
      notificaciones,
      cargandoDatos,
      procesandoTx,
      advertenciaRed,
      conectarWallet,
      desconectarWallet,
      cambiarRedObjetivo,
      refrescarDatos,
      solicitarAirdrop: solicitarAirdropAccion,
      mintearCartaDesdeUri,
      listarCarta,
      comprarCarta: comprarCartaAccion,
      confirmarEntrega: confirmarEntregaAccion,
      proponerSwap,
      aceptarSwap,
      cancelarSwap,
      cargarHistorialCarta,
      quitarNotificacion,
    }),
    [
      redClave,
      redConfig,
      wallet,
      saldoTdc,
      cartas,
      cartasMercado,
      cartasUsuario,
      notificaciones,
      cargandoDatos,
      procesandoTx,
      advertenciaRed,
      conectarWallet,
      desconectarWallet,
      cambiarRedObjetivo,
      refrescarDatos,
      solicitarAirdropAccion,
      mintearCartaDesdeUri,
      listarCarta,
      comprarCartaAccion,
      confirmarEntregaAccion,
      proponerSwap,
      aceptarSwap,
      cancelarSwap,
      cargarHistorialCarta,
      quitarNotificacion,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext(): AppContextValue {
  const value = useContext(AppContext);
  if (!value) {
    throw new Error("useAppContext debe usarse dentro de AppProvider");
  }

  return value;
}
