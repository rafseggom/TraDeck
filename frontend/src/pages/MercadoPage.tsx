import { useMemo, useState } from "react";
import { CardTile } from "../components/CardTile";
import { useAppContext } from "../lib/app-context";
import { EstadoTrade } from "../lib/types";
import { cn } from "../lib/utils";
import { Search, Filter, ShoppingBag, ArrowLeftRight, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";

export function MercadoPage(): JSX.Element {
  const {
    wallet,
    cartas,
    cartasMercado,
    cartasUsuario,
    comprarCarta,
    confirmarEntrega,
    aceptarSwap,
    cancelarSwap,
    procesandoTx,
  } = useAppContext();

  const [texto, setTexto] = useState<string>("");
  const [juego, setJuego] = useState<string>("TODOS");
  const [estado, setEstado] = useState<string>("TODOS");
  const [precioMin, setPrecioMin] = useState<string>("");
  const [precioMax, setPrecioMax] = useState<string>("");

  const idsMios = useMemo(() => new Set(cartasUsuario.map((carta) => carta.tokenId)), [cartasUsuario]);

  const cartasFiltradas = useMemo(() => {
    return cartasMercado.filter((carta) => {
      const textoOk =
        texto.trim().length === 0 ||
        carta.nombre.toLowerCase().includes(texto.toLowerCase()) ||
        carta.numeroSerie.toLowerCase().includes(texto.toLowerCase()) ||
        String(carta.tokenId).includes(texto.trim());

      const juegoOk = juego === "TODOS" || carta.juego === juego;

      const estadoOk =
        estado === "TODOS" ||
        (estado === "LISTADA" && carta.trade.state === EstadoTrade.Listada) ||
        (estado === "ESCROW" && carta.trade.state === EstadoTrade.EnEscrow);

      const precio = Number(carta.precioTdc ?? 0);
      const minOk = !precioMin || precio >= Number(precioMin);
      const maxOk = !precioMax || precio <= Number(precioMax);

      return textoOk && juegoOk && estadoOk && minOk && maxOk;
    });
  }, [cartasMercado, estado, juego, precioMax, precioMin, texto]);

  const ofertasSwap = cartas.filter((carta) => carta.swapOffer.isActive);

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      {/* Header & Warning */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-900 rounded-lg">
            <ShoppingBag className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Mercado de Cartas</h1>
        </div>
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <p>
            <span className="font-bold">Aviso de Seguridad:</span> El sistema de Escrow requiere que confirmes la recepción manualmente para liberar los fondos. No olvides confirmar una vez recibas tu NFT.
          </p>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-900 mb-2">
          <Filter className="h-4 w-4" />
          <span>Filtros de búsqueda</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              className="w-full pl-10 h-10 rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Nombre, serie o token ID..."
            />
          </div>
          <select
            className="h-10 rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={juego}
            onChange={(e) => setJuego(e.target.value)}
          >
            <option value="TODOS">Todos los juegos</option>
            <option value="MTG">Magic: The Gathering</option>
            <option value="POKEMON">Pokémon</option>
            <option value="MANUAL">Manual / Otros</option>
          </select>
          <select
            className="h-10 rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={estado}
            onChange={(e) => setEstado(e.target.value)}
          >
            <option value="TODOS">Todos los estados</option>
            <option value="LISTADA">En venta</option>
            <option value="ESCROW">En escrow</option>
          </select>
          <div className="flex gap-2">
            <input
              type="number"
              className="w-1/2 h-10 rounded-lg border border-input bg-background px-3 py-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={precioMin}
              onChange={(e) => setPrecioMin(e.target.value)}
              placeholder="Mín TDC"
            />
            <input
              type="number"
              className="w-1/2 h-10 rounded-lg border border-input bg-background px-3 py-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={precioMax}
              onChange={(e) => setPrecioMax(e.target.value)}
              placeholder="Máx TDC"
            />
          </div>
        </div>
      </div>

      {/* Grid Section */}
      <div className="space-y-6">
        {cartasFiltradas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-slate-50 border border-dashed rounded-3xl">
            <Search className="h-12 w-12 text-slate-300 mb-4" />
            <p className="text-slate-500 font-medium">No se encontraron cartas con estos filtros.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {cartasFiltradas.map((carta) => {
              const esMia = wallet.address
                ? carta.owner.toLowerCase() === wallet.address.toLowerCase()
                : false;

              return (
                <CardTile key={carta.tokenId} carta={carta}>
                  {carta.trade.state === EstadoTrade.Listada && !esMia ? (
                    <button
                      type="button"
                      className="w-full h-10 mt-2 inline-flex items-center justify-center rounded-lg bg-slate-900 text-white text-sm font-bold shadow-sm transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                      disabled={procesandoTx}
                      onClick={() => void comprarCarta(carta.tokenId)}
                    >
                      Comprar Ahora
                    </button>
                  ) : null}

                  {carta.trade.state === EstadoTrade.EnEscrow &&
                  wallet.address &&
                  carta.trade.buyer.toLowerCase() === wallet.address.toLowerCase() ? (
                    <button
                      type="button"
                      className="w-full h-10 mt-2 inline-flex items-center justify-center rounded-lg bg-emerald-600 text-white text-sm font-bold shadow-sm transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                      disabled={procesandoTx}
                      onClick={() => void confirmarEntrega(carta.tokenId)}
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Confirmar Entrega
                    </button>
                  ) : null}
                </CardTile>
              );
            })}
          </div>
        )}
      </div>

      {/* Swaps Section */}
      <div className="pt-10 border-t space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-900 rounded-lg">
            <ArrowLeftRight className="h-5 w-5 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Intercambios Activos</h2>
        </div>

        {ofertasSwap.length === 0 ? (
          <div className="p-12 text-center bg-slate-50 rounded-3xl border border-dashed">
            <p className="text-slate-500 font-medium">No hay propuestas de intercambio en este momento.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ofertasSwap.map((carta) => {
              const puedoAceptar = idsMios.has(carta.swapOffer.wantedTokenId);
              const soyProponente = wallet.address
                ? carta.swapOffer.proposer.toLowerCase() === wallet.address.toLowerCase()
                : false;

              return (
                <div key={`oferta-${carta.tokenId}`} className="bg-white p-6 rounded-2xl border shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6 transition-all hover:shadow-md">
                  <div className="flex items-center gap-4">
                    <div className="flex -space-x-3">
                      <div className="h-14 w-14 rounded-xl border-2 border-white bg-slate-100 flex items-center justify-center font-bold text-slate-400 shadow-sm overflow-hidden">
                        #{carta.swapOffer.proposerTokenId}
                      </div>
                      <div className="h-14 w-14 rounded-xl border-2 border-white bg-blue-100 flex items-center justify-center font-bold text-blue-600 shadow-sm">
                        <ArrowLeftRight className="h-6 w-6" />
                      </div>
                      <div className="h-14 w-14 rounded-xl border-2 border-white bg-slate-100 flex items-center justify-center font-bold text-slate-400 shadow-sm overflow-hidden">
                        #{carta.swapOffer.wantedTokenId}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">Propuesta de Swap</p>
                      <p className="text-xs text-slate-500">
                        Cambio del token #{carta.swapOffer.proposerTokenId} por el #{carta.swapOffer.wantedTokenId}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {puedoAceptar && !soyProponente ? (
                      <button
                        type="button"
                        className="h-10 px-4 rounded-lg bg-emerald-600 text-white text-xs font-bold shadow-sm transition-transform hover:scale-[1.05] disabled:opacity-50"
                        disabled={procesandoTx}
                        onClick={() => void aceptarSwap(carta.swapOffer.proposerTokenId)}
                      >
                        Aceptar
                      </button>
                    ) : null}

                    {soyProponente ? (
                      <button
                        type="button"
                        className="h-10 px-4 rounded-lg border-2 border-rose-100 text-rose-600 text-xs font-bold hover:bg-rose-50 transition-colors disabled:opacity-50"
                        disabled={procesandoTx}
                        onClick={() => void cancelarSwap(carta.swapOffer.proposerTokenId)}
                      >
                        <XCircle className="inline mr-1.5 h-3.5 w-3.5" />
                        Cancelar
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
