import { useMemo, useState } from "react";
import { CardTile } from "../components/CardTile";
import { useAppContext } from "../lib/app-context";
import { EstadoTrade } from "../lib/types";
import { cn } from "../lib/utils";
import { Library, ArrowLeftRight, Coins, Info, Filter, XCircle, AlertCircle } from "lucide-react";

export function ColeccionPage(): JSX.Element {
  const {
    wallet,
    cartas,
    cartasUsuario,
    listarCarta,
    proponerSwap,
    cancelarSwap,
    procesandoTx,
  } = useAppContext();

  const [precios, setPrecios] = useState<Record<number, string>>({});
  const [miTokenId, setMiTokenId] = useState<string>("");
  const [tokenDeseadoId, setTokenDeseadoId] = useState<string>("");
  const [filtroJuego, setFiltroJuego] = useState<"TODOS" | "MTG" | "POKEMON">("TODOS");

  const cartasUsuarioFiltradas = useMemo(() => {
    if (filtroJuego === "TODOS") return cartasUsuario;
    return cartasUsuario.filter((carta) => carta.juego === filtroJuego);
  }, [cartasUsuario, filtroJuego]);

  const cartasNoMias = useMemo(() => {
    if (!wallet.address) return [];
    return cartas.filter((carta) => carta.owner.toLowerCase() !== wallet.address?.toLowerCase());
  }, [cartas, wallet.address]);

  const swapsSalientes = cartasUsuario.filter((carta) => carta.swapOffer.isActive);

  const enviarPropuestaSwap = async () => {
    const propio = Number(miTokenId);
    const deseado = Number(tokenDeseadoId);
    if (!Number.isFinite(propio) || !Number.isFinite(deseado)) return;
    await proponerSwap(propio, deseado);
  };

  if (!wallet.address) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-in fade-in">
        <div className="p-4 bg-slate-100 rounded-full mb-6">
          <Library className="h-12 w-12 text-slate-400" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Tu Colección</h2>
        <p className="text-slate-500 mt-2 max-w-sm text-center px-4">
          Conecta tu wallet para ver tus cartas tokenizadas y empezar a gestionar tus activos.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-900 rounded-lg">
            <Library className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Mi Colección</h1>
          <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-bold border">
            {cartasUsuario.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <select
              className="pl-9 h-9 w-44 rounded-lg border border-input bg-white text-xs font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all"
              value={filtroJuego}
              onChange={(e) => setFiltroJuego(e.target.value as any)}
            >
              <option value="TODOS">Todos los juegos</option>
              <option value="MTG">Magic: The Gathering</option>
              <option value="POKEMON">Pokémon</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
        {/* Main Collection Grid */}
        <div className="xl:col-span-8 space-y-6">
          <div className="flex items-start gap-3 p-4 bg-slate-50 border rounded-xl text-slate-600 text-[11px] leading-relaxed">
            <Info className="h-4 w-4 shrink-0 text-slate-400" />
            <p>
              <span className="font-bold text-slate-900">Limitación actual:</span> Una vez listada en el mercado, la carta queda bloqueada hasta su venta. Asegúrate bien del precio antes de confirmar.
            </p>
          </div>

          {cartasUsuarioFiltradas.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center bg-slate-50/50 border border-dashed rounded-3xl">
              <Library className="h-10 w-10 text-slate-200 mb-2" />
              <p className="text-slate-400 font-medium">No se encontraron cartas en tu colección.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {cartasUsuarioFiltradas.map((carta) => (
                <CardTile key={carta.tokenId} carta={carta}>
                  {carta.trade.state === EstadoTrade.NoListada ? (
                    <div className="mt-3 flex flex-col gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="relative">
                        <Coins className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-amber-500" />
                        <input
                          type="number"
                          className="w-full pl-8 h-9 rounded-lg border border-input bg-white px-3 py-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          placeholder="Precio TDC"
                          value={precios[carta.tokenId] ?? ""}
                          onChange={(e) => setPrecios(prev => ({ ...prev, [carta.tokenId]: e.target.value }))}
                        />
                      </div>
                      <button
                        type="button"
                        className="w-full h-9 rounded-lg bg-slate-900 text-white text-xs font-bold transition-all hover:bg-slate-800 disabled:opacity-50"
                        disabled={procesandoTx || !(precios[carta.tokenId] ?? "").trim()}
                        onClick={() => void listarCarta(carta.tokenId, precios[carta.tokenId])}
                      >
                        Listar en Venta
                      </button>
                    </div>
                  ) : (
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-center gap-2">
                      <AlertCircle className="h-3.5 w-3.5 text-blue-500" />
                      <span className="text-[10px] font-bold text-blue-700">Carta en flujo comercial</span>
                    </div>
                  )}
                </CardTile>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar: Swaps & Actions */}
        <div className="xl:col-span-4 space-y-8">
          {/* Swap Proposer */}
          <div className="bg-white p-8 rounded-3xl border shadow-sm space-y-6">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <ArrowLeftRight className="h-5 w-5" /> Proponer Swap
            </h2>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tu Carta</label>
                <select
                  className="w-full h-11 rounded-xl border border-input bg-slate-50 px-4 text-xs font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={miTokenId}
                  onChange={(e) => setMiTokenId(e.target.value)}
                >
                  <option value="">Selecciona una carta...</option>
                  {cartasUsuario.map((c) => (
                    <option key={c.tokenId} value={c.tokenId}>#{c.tokenId} - {c.nombre}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-center -my-2">
                <div className="h-8 w-8 bg-slate-900 rounded-full flex items-center justify-center border-4 border-white shadow-md z-10">
                  <ArrowLeftRight className="h-4 w-4 text-white" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Carta Objetivo</label>
                <select
                  className="w-full h-11 rounded-xl border border-input bg-slate-50 px-4 text-xs font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={tokenDeseadoId}
                  onChange={(e) => setTokenDeseadoId(e.target.value)}
                >
                  <option value="">Selecciona carta deseada...</option>
                  {cartasNoMias.map((c) => (
                    <option key={c.tokenId} value={c.tokenId}>#{c.tokenId} - {c.nombre}</option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                className="w-full h-12 rounded-xl bg-slate-900 text-white text-sm font-bold shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 mt-2"
                disabled={procesandoTx || !miTokenId || !tokenDeseadoId}
                onClick={() => void enviarPropuestaSwap()}
              >
                Publicar Propuesta
              </button>
            </div>
          </div>

          {/* Active Swaps List */}
          <div className="bg-slate-50/50 p-8 rounded-3xl border border-dashed space-y-6">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Coins className="h-5 w-5 text-amber-500" /> Swaps Salientes
            </h2>
            {swapsSalientes.length === 0 ? (
              <p className="text-xs text-slate-400 font-medium italic">No tienes propuestas activas.</p>
            ) : (
              <div className="space-y-3">
                {swapsSalientes.map((carta) => (
                  <div key={`swap-${carta.tokenId}`} className="bg-white p-4 rounded-xl border shadow-sm flex items-center justify-between gap-3">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Ofreces #{carta.tokenId}</span>
                      <span className="text-[11px] font-bold text-slate-900">Por #{carta.swapOffer.wantedTokenId}</span>
                    </div>
                    <button
                      type="button"
                      className="h-8 w-8 rounded-lg flex items-center justify-center text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors border border-rose-100"
                      disabled={procesandoTx}
                      onClick={() => void cancelarSwap(carta.tokenId)}
                      title="Cancelar"
                    >
                      <XCircle className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
