import { useEffect, useMemo, useState } from "react";
import { keccak256, toUtf8Bytes } from "ethers";
import { useSearchParams } from "react-router-dom";
import { useAppContext } from "../lib/app-context";
import { formatoFechaUnix } from "../lib/formato";
import { cn } from "../lib/utils";
import type { EventoCartaHistorial, VeracidadCartaResultado } from "../lib/types";
import { History, ShieldCheck, Bug, RefreshCw, FileSearch, X, CheckCircle2, AlertCircle, Fingerprint, ChevronRight } from "lucide-react";

function selloCadena(eventos: EventoCartaHistorial[]): string {
  if (eventos.length === 0) return "-";
  const base = eventos
    .map(e => `${e.blockNumber}:${e.blockHash}:${e.parentHash}:${e.txHash}:${e.from}:${e.to}`)
    .join("|");
  return keccak256(toUtf8Bytes(base));
}

export function HistorialPage(): JSX.Element {
  const { cartas, cargarHistorialCarta, verificarVeracidadCarta } = useAppContext();
  const [searchParams, setSearchParams] = useSearchParams();

  const [cargando, setCargando] = useState<boolean>(false);
  const [eventosCadena, setEventosCadena] = useState<EventoCartaHistorial[]>([]);
  const [eventosVista, setEventosVista] = useState<EventoCartaHistorial[]>([]);
  const [modoHackeoManual, setModoHackeoManual] = useState<boolean>(false);
  const [mostrarPopupManual, setMostrarPopupManual] = useState<boolean>(false);
  const [verificando, setVerificando] = useState<boolean>(false);
  const [resultadoVeracidad, setResultadoVeracidad] = useState<VeracidadCartaResultado | null>(null);

  const tokenIdParam = searchParams.get("tokenId");
  const checkParam = searchParams.get("check");

  const tokenSeleccionado = useMemo<number | null>(() => {
    if (!tokenIdParam) return cartas.length > 0 ? cartas[0].tokenId : null;
    const parsed = Number(tokenIdParam);
    return Number.isFinite(parsed) ? parsed : null;
  }, [cartas, tokenIdParam]);

  const cartaActual = useMemo(
    () => cartas.find((c) => c.tokenId === tokenSeleccionado) ?? null,
    [cartas, tokenSeleccionado]
  );

  const selloOnChain = useMemo(() => selloCadena(eventosCadena), [eventosCadena]);
  const selloVista = useMemo(() => selloCadena(eventosVista), [eventosVista]);
  const selloCoincide = selloOnChain !== "-" && selloOnChain === selloVista;
  const eventosAsc = useMemo(
    () => [...eventosCadena].sort((a, b) => a.blockNumber - b.blockNumber),
    [eventosCadena]
  );

  useEffect(() => {
    if (tokenSeleccionado === null) {
      setEventosCadena([]);
      setEventosVista([]);
      return;
    }
    const cargar = async () => {
      setCargando(true);
      const historial = await cargarHistorialCarta(tokenSeleccionado);
      setEventosCadena(historial);
      setEventosVista(historial);
      setModoHackeoManual(false);
      setResultadoVeracidad(null);
      setCargando(false);
    };
    void cargar();
  }, [cargarHistorialCarta, tokenSeleccionado]);

  const compararVistaContraCadena = (): string[] => {
    const inconsistencias: string[] = [];
    if (eventosVista.length !== eventosCadena.length) {
      inconsistencias.push("Número de eventos discrepante.");
      return inconsistencias;
    }
    for (let i = 0; i < eventosCadena.length; i++) {
      const c = eventosCadena[i];
      const v = eventosVista[i];
      if (c.txHash !== v.txHash || c.blockHash !== v.blockHash || c.parentHash !== v.parentHash || c.from !== v.from || c.to !== v.to) {
        inconsistencias.push(`Alteración en bloque ${v.blockNumber}.`);
      }
    }
    return inconsistencias;
  };

  const ejecutarVerificacion = async (): Promise<void> => {
    if (tokenSeleccionado === null) return;
    setVerificando(true);
    const resultadoOnChain = await verificarVeracidadCarta(tokenSeleccionado);
    if (!resultadoOnChain) {
      setVerificando(false);
      return;
    }
    const inconsistenciasVista = compararVistaContraCadena();
    if (inconsistenciasVista.length > 0) {
      setResultadoVeracidad({
        esValida: false,
        resumen: "Se detectó manipulación local de la trazabilidad.",
        detalles: [...inconsistenciasVista, ...resultadoOnChain.detalles],
      });
      setVerificando(false);
      return;
    }
    setResultadoVeracidad(resultadoOnChain);
    setVerificando(false);
  };

  const alternarModoHackeo = (): void => {
    setModoHackeoManual((actual) => !actual);
    setResultadoVeracidad(null);
  };

  const restaurarVistaDesdeBlockchain = (): void => {
    setEventosVista(eventosCadena);
    setResultadoVeracidad(null);
  };

  const editarEvento = (index: number, campo: string, valor: string): void => {
    setEventosVista((actual) => actual.map((ev, i) => (i === index ? { ...ev, [campo]: valor } : ev)));
  };

  useEffect(() => {
    if (checkParam !== "1" || tokenSeleccionado === null || cargando) return;
    void ejecutarVerificacion();
  }, [checkParam, tokenSeleccionado, cargando]);

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-500 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-900 rounded-lg">
              <History className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Trazabilidad NFT</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Token ID</label>
              <select
                className="h-9 w-40 rounded-lg border border-input bg-white px-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-slate-900"
                value={tokenSeleccionado ?? ""}
                onChange={(e) => setSearchParams({ tokenId: e.target.value })}
              >
                {cartas.map((c) => (
                  <option key={c.tokenId} value={c.tokenId}>#{c.tokenId} - {c.nombre}</option>
                ))}
              </select>
            </div>
            <button
              onClick={() => void ejecutarVerificacion()}
              disabled={verificando || cargando || tokenSeleccionado === null}
              className="h-9 px-4 rounded-lg bg-emerald-600 text-white text-xs font-bold shadow-sm transition-all hover:bg-emerald-700 disabled:opacity-50"
            >
              {verificando ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : "Verificar Originalidad"}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={alternarModoHackeo}
            className={cn(
              "h-9 px-4 rounded-lg text-xs font-bold border transition-all",
              modoHackeoManual ? "bg-rose-50 text-rose-600 border-rose-200" : "bg-white text-slate-600 hover:bg-slate-50"
            )}
          >
            <Bug className="inline mr-2 h-3.5 w-3.5" />
            {modoHackeoManual ? "Cerrar Demo" : "Demo Manipulación"}
          </button>
          <button
            onClick={() => setMostrarPopupManual(true)}
            disabled={eventosCadena.length === 0}
            className="h-9 px-4 rounded-lg bg-white text-slate-600 text-xs font-bold border hover:bg-slate-50 disabled:opacity-50"
          >
            <FileSearch className="inline mr-2 h-3.5 w-3.5" />
            Manual
          </button>
        </div>
      </div>

      {/* Analysis Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Timeline */}
        <div className="lg:col-span-8 space-y-6">
          {cargando ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white border rounded-3xl">
              <RefreshCw className="h-10 w-10 text-slate-200 animate-spin" />
              <p className="mt-4 text-slate-400 font-medium">Sincronizando con la cadena...</p>
            </div>
          ) : eventosVista.length === 0 ? (
            <div className="p-12 text-center bg-slate-50 rounded-3xl border border-dashed">
              <p className="text-slate-500 font-medium">No hay eventos registrados para este token.</p>
            </div>
          ) : (
            <div className="relative pl-8 space-y-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-200">
              {eventosVista.map((evento, idx) => (
                <div key={`${evento.txHash}-${idx}`} className="relative animate-in slide-in-from-left-4 fade-in duration-500" style={{ animationDelay: `${idx * 100}ms` }}>
                  <div className="absolute -left-8 top-1 h-6 w-6 rounded-full bg-white border-4 border-slate-900 z-10 shadow-sm" />
                  <div className="bg-white p-6 rounded-2xl border shadow-sm hover:shadow-md transition-shadow group">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">#{eventosVista.length - idx}</span>
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">{evento.tipo}</h3>
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                        Bloque {evento.blockNumber} • {formatoFechaUnix(evento.timestamp)}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px] font-mono leading-relaxed">
                      <div className="space-y-1">
                        <p className="text-slate-400 font-sans font-bold uppercase tracking-tighter text-[9px]">Block Hash</p>
                        <p className="text-slate-600 truncate bg-slate-50 p-1.5 rounded" title={evento.blockHash}>{evento.blockHash}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-slate-400 font-sans font-bold uppercase tracking-tighter text-[9px]">TX Hash</p>
                        <p className="text-slate-600 truncate bg-slate-50 p-1.5 rounded" title={evento.txHash}>{evento.txHash}</p>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="flex flex-col gap-1 min-w-0">
                        <span className="text-[9px] font-bold text-slate-400 uppercase">From</span>
                        <span className="text-[10px] font-mono text-slate-600 truncate">{evento.from}</span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-300 shrink-0" />
                      <div className="flex flex-col gap-1 min-w-0 text-right">
                        <span className="text-[9px] font-bold text-slate-400 uppercase">To</span>
                        <span className="text-[10px] font-mono text-slate-600 truncate">{evento.to}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Integrity Panel */}
        <div className="lg:col-span-4 space-y-6">
          {/* Integrity Badge */}
          <div className={cn(
            "p-8 rounded-3xl border shadow-sm transition-all duration-700",
            selloCoincide ? "bg-emerald-600 text-white shadow-emerald-200" : "bg-rose-600 text-white shadow-rose-200"
          )}>
            <div className="flex items-center gap-3 mb-6">
              <Fingerprint className="h-6 w-6 opacity-80" />
              <h3 className="font-black uppercase tracking-tight">Check de Integridad</h3>
            </div>
            
            <div className="space-y-4 mb-6">
              <div className="p-3 bg-white/10 rounded-xl border border-white/20">
                <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">On-Chain Hash</p>
                <p className="text-[10px] font-mono break-all leading-tight opacity-90">{selloOnChain}</p>
              </div>
              <div className="p-3 bg-white/10 rounded-xl border border-white/20">
                <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">Local View Hash</p>
                <p className="text-[10px] font-mono break-all leading-tight opacity-90">{selloVista}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {selloCoincide ? (
                <>
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="text-sm font-bold">Datos íntegros y verificados</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5" />
                  <span className="text-sm font-bold">Inconsistencia Detectada</span>
                </>
              )}
            </div>
          </div>

          {/* Verification Result */}
          {resultadoVeracidad && (
            <div className={cn(
              "p-6 rounded-3xl border animate-in zoom-in-95 duration-300",
              resultadoVeracidad.esValida ? "bg-white border-emerald-100" : "bg-white border-rose-100"
            )}>
              <div className="flex items-center gap-3 mb-4">
                {resultadoVeracidad.esValida ? (
                  <ShieldCheck className="h-5 w-5 text-emerald-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-rose-600" />
                )}
                <h4 className={cn("font-bold text-sm", resultadoVeracidad.esValida ? "text-emerald-900" : "text-rose-900")}>
                  {resultadoVeracidad.esValida ? "Autenticidad Confirmada" : "Alerta de Veracidad"}
                </h4>
              </div>
              <p className="text-xs text-slate-600 mb-4 leading-relaxed">{resultadoVeracidad.resumen}</p>
              <div className="space-y-2">
                {resultadoVeracidad.detalles.map((d, i) => (
                  <div key={i} className="flex items-start gap-2 text-[10px] font-medium text-slate-500 bg-slate-50 p-2 rounded-lg">
                    <div className="h-1 w-1 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                    {d}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Manual Editor Panel (Demo Only) */}
          {modoHackeoManual && (
            <div className="p-8 rounded-3xl border-2 border-dashed border-rose-200 bg-rose-50/50 space-y-6 animate-in slide-in-from-right-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-rose-900 uppercase">Editor Manual</h3>
                <button onClick={restaurarVistaDesdeBlockchain} className="text-[10px] font-bold text-rose-600 hover:underline">Restaurar</button>
              </div>
              <p className="text-xs text-rose-800 leading-relaxed">
                Cambia los hashes locales para probar cómo el sistema detecta manipulaciones visuales.
              </p>
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {eventosVista.map((ev, idx) => (
                  <div key={idx} className="p-4 bg-white rounded-xl border border-rose-100 space-y-3">
                    <span className="text-[10px] font-bold text-rose-400 uppercase">Evento {idx + 1}</span>
                    <input
                      className="w-full h-8 px-2 text-[10px] font-mono border rounded focus:ring-1 focus:ring-rose-500"
                      value={ev.blockHash}
                      onChange={e => editarEvento(idx, "blockHash", e.target.value)}
                      placeholder="Block Hash"
                    />
                    <input
                      className="w-full h-8 px-2 text-[10px] font-mono border rounded focus:ring-1 focus:ring-rose-500"
                      value={ev.txHash}
                      onChange={e => editarEvento(idx, "txHash", e.target.value)}
                      placeholder="TX Hash"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Manual Verification Modal */}
      {mostrarPopupManual && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-5xl max-height-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95">
            <header className="px-8 py-6 border-b flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <FileSearch className="h-5 w-5 text-slate-900" />
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">Protocolo de Comprobación Manual</h3>
              </div>
              <button onClick={() => setMostrarPopupManual(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                  { step: 1, title: "Anota", desc: "Registra el Bloque N y su hash único." },
                  { step: 2, title: "Enlaza", desc: "El Parent Hash de N debe ser el hash de N-1." },
                  { step: 3, title: "Valida", desc: "La TX debe existir dentro del Bloque N." },
                  { step: 4, title: "Continuidad", desc: "El destinatario debe ser el emisor del siguiente." }
                ].map(s => (
                  <div key={s.step} className="p-4 rounded-2xl bg-slate-50 border space-y-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase">Paso {s.step}</span>
                    <h4 className="text-xs font-bold text-slate-900">{s.title}</h4>
                    <p className="text-[11px] text-slate-500 leading-tight">{s.desc}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                {eventosAsc.map((ev, idx) => (
                  <div key={idx} className="p-6 rounded-2xl border flex flex-col md:flex-row gap-6 bg-white hover:bg-slate-50 transition-colors">
                    <div className="md:w-32 shrink-0">
                      <span className="text-[10px] font-black text-slate-400 uppercase">Bloque N</span>
                      <p className="text-lg font-black text-slate-900 tracking-tighter">{ev.blockNumber}</p>
                    </div>
                    <div className="flex-1 space-y-4 min-w-0">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Current Hash</p>
                          <p className="text-[10px] font-mono break-all text-slate-600 bg-white p-2 rounded-lg border shadow-sm">{ev.blockHash}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Parent Hash (Points to N-1)</p>
                          <p className="text-[10px] font-mono break-all text-slate-600 bg-white p-2 rounded-lg border shadow-sm">{ev.parentHash}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold border shadow-sm",
                          ev.parentHashValido ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-rose-50 text-rose-700 border-rose-100"
                        )}>
                          {ev.parentHashValido ? <CheckCircle2 className="h-3 w-3" /> : <X className="h-3 w-3" />}
                          {ev.parentHashValido ? "Enlace Válido" : "Enlace Corrupto"}
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 truncate max-w-[200px]">Real N-1: {ev.previousBlockHash || "Genesis"}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <footer className="px-8 py-6 border-t bg-slate-50 flex justify-end">
              <button onClick={() => setMostrarPopupManual(false)} className="h-10 px-6 rounded-xl bg-slate-900 text-white font-bold text-sm">
                Finalizar Comprobación
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}
