import { useMemo, useState } from "react";
import { useAppContext } from "../lib/app-context";
import { subirMetadataAIPFS } from "../lib/ipfs";
import { generarSerialPSA } from "../lib/serial";
import { buscarCartasMTG, buscarCartasPokemon, buscarVersionesMTG, buscarVersionesPokemon } from "../lib/tcg";
import type { JuegoCarta, MetadataCarta, ResultadoBusquedaCarta } from "../lib/types";
import { cn } from "../lib/utils";
import { PlusCircle, Search, Image, Type, Hash, ShieldPlus, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

type ModoCreacion = "manual" | "mtg" | "pokemon";

export function CrearCartaPage(): JSX.Element {
  const { wallet, mintearCartaDesdeUri, procesandoTx } = useAppContext();

  const [modo, setModo] = useState<ModoCreacion>("manual");
  const [query, setQuery] = useState<string>("");
  const [buscando, setBuscando] = useState<boolean>(false);
  const [resultados, setResultados] = useState<ResultadoBusquedaCarta[]>([]);
  const [seleccionada, setSeleccionada] = useState<ResultadoBusquedaCarta | null>(null);
  const [versionesMTG, setVersionesMTG] = useState<ResultadoBusquedaCarta[]>([]);
  const [buscandoVersiones, setBuscandoVersiones] = useState<boolean>(false);
  const [versionMTGId, setVersionMTGId] = useState<string>("");
  const [errorBusqueda, setErrorBusqueda] = useState<string>("");

  const [manualNombre, setManualNombre] = useState<string>("");
  const [manualImagen, setManualImagen] = useState<string>("");
  const [manualJuego, setManualJuego] = useState<JuegoCarta>("MANUAL");

  const [serialPreview, setSerialPreview] = useState<string>("");
  const [ultimoResultado, setUltimoResultado] = useState<{
    tokenId: number | null;
    tokenUri: string;
    serial: string;
  } | null>(null);

  const [creando, setCreando] = useState<boolean>(false);

  const versionMTGSeleccionada = useMemo(() => {
    return versionesMTG.find((version) => version.id === versionMTGId) ?? null;
  }, [versionMTGId, versionesMTG]);

  const cartaFuente = useMemo(() => {
    if (modo === "manual") {
      return {
        nombre: manualNombre.trim(),
        imagen: manualImagen.trim(),
        juego: manualJuego,
      };
    }

    if (!seleccionada) {
      return null;
    }

    const cartaElegida =
      modo === "mtg" ? versionMTGSeleccionada ?? seleccionada : seleccionada;

    return {
      nombre: cartaElegida.nombre,
      imagen: cartaElegida.imagen,
      juego: cartaElegida.juego,
    };
  }, [manualImagen, manualJuego, manualNombre, modo, seleccionada, versionMTGSeleccionada]);

  const ejecutarBusqueda = async (): Promise<void> => {
    setBuscando(true);
    setErrorBusqueda("");
    setResultados([]);
    setSeleccionada(null);
    setVersionesMTG([]);
    setVersionMTGId("");

    try {
      const data = modo === "mtg" ? await buscarCartasMTG(query) : await buscarCartasPokemon(query);
      setResultados(data);
    } catch (error: any) {
      setErrorBusqueda(String(error?.message ?? "No se pudo buscar cartas"));
    } finally {
      setBuscando(false);
    }
  };

  const seleccionarResultado = async (resultado: ResultadoBusquedaCarta): Promise<void> => {
    setSeleccionada(resultado);

    if (modo === "manual") {
      return;
    }

    setBuscandoVersiones(true);
    setErrorBusqueda("");
    setVersionesMTG([]);
    setVersionMTGId("");

    try {
      const versiones =
        modo === "mtg" ? await buscarVersionesMTG(resultado.nombre) : await buscarVersionesPokemon(resultado.nombre);
      setVersionesMTG(versiones);
      if (versiones.length > 0) {
        setVersionMTGId(versiones[0].id);
      }
    } catch (error: any) {
      setErrorBusqueda(String(error?.message ?? "No se pudieron cargar las versiones de la carta"));
    } finally {
      setBuscandoVersiones(false);
    }
  };

  const crearCarta = async (): Promise<void> => {
    if (!wallet.address) {
      setErrorBusqueda("Debes conectar MetaMask para crear una carta");
      return;
    }

    if (!cartaFuente || !cartaFuente.nombre || !cartaFuente.imagen) {
      setErrorBusqueda("Completa nombre e imagen antes de crear");
      return;
    }

    setCreando(true);
    setErrorBusqueda("");

    try {
      const serial = generarSerialPSA();
      setSerialPreview(serial);

      const metadata: MetadataCarta = {
        name: cartaFuente.nombre,
        image: cartaFuente.imagen,
        serialNumber: serial,
        description: "Carta TCG tokenizada en TraDeck",
        attributes: [
          {
            trait_type: "Juego",
            value: cartaFuente.juego,
          },
          {
            trait_type: "Origen",
            value: modo.toUpperCase(),
          },
        ],
      };

      const pin = await subirMetadataAIPFS(metadata);
      const tokenId = await mintearCartaDesdeUri(pin.uri);

      setUltimoResultado({
        tokenId,
        tokenUri: pin.uri,
        serial,
      });
    } catch (error: any) {
      setErrorBusqueda(String(error?.message ?? "No se pudo crear la carta"));
    } finally {
      setCreando(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-900 rounded-lg">
            <PlusCircle className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Crear Nueva Carta</h1>
        </div>
        <p className="text-slate-500 text-sm">
          Tokeniza tus cartas físicas o digitales. Sube los metadatos a IPFS de forma segura y genera un NFT único en la blockchain.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left: Wizard */}
        <div className="lg:col-span-7 space-y-8">
          <div className="bg-white p-2 rounded-2xl border shadow-sm inline-flex w-full overflow-hidden">
            {[
              { id: "manual", label: "Manual" },
              { id: "mtg", label: "Magic: The Gathering" },
              { id: "pokemon", label: "Pokémon" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setModo(tab.id as ModoCreacion)}
                className={cn(
                  "flex-1 py-2.5 px-4 text-xs font-bold rounded-xl transition-all",
                  modo === tab.id ? "bg-slate-900 text-white shadow-md" : "text-slate-500 hover:bg-slate-50"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="bg-white p-8 rounded-2xl border shadow-sm space-y-6">
            {modo === "manual" ? (
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Type className="h-4 w-4" /> Nombre de la Carta
                  </label>
                  <input
                    className="w-full h-11 rounded-xl border border-input bg-background px-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={manualNombre}
                    onChange={(e) => setManualNombre(e.target.value)}
                    placeholder="Ej: Black Lotus, Base Set Charizard..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Image className="h-4 w-4" /> URL de la Imagen
                  </label>
                  <input
                    className="w-full h-11 rounded-xl border border-input bg-background px-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={manualImagen}
                    onChange={(e) => setManualImagen(e.target.value)}
                    placeholder="https://imgur.com/..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Sistema / Juego</label>
                  <select
                    className="w-full h-11 rounded-xl border border-input bg-background px-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={manualJuego}
                    onChange={(e) => setManualJuego(e.target.value as JuegoCarta)}
                  >
                    <option value="MANUAL">Personalizado / Otro</option>
                    <option value="MTG">Magic: The Gathering</option>
                    <option value="POKEMON">Pokémon</option>
                  </select>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      className="w-full pl-10 h-11 rounded-xl border border-input bg-background px-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder={modo === "mtg" ? "Busca en Scryfall (ej: Black Lotus)" : "Busca en TCGdex SDK (ej: Pikachu)"}
                      onKeyDown={(e) => e.key === 'Enter' && void ejecutarBusqueda()}
                    />
                  </div>
                  <button
                    onClick={() => void ejecutarBusqueda()}
                    disabled={buscando || !query.trim()}
                    className="px-6 h-11 rounded-xl bg-slate-900 text-white font-bold text-sm shadow-sm transition-all hover:bg-slate-800 disabled:opacity-50"
                  >
                    {buscando ? <Loader2 className="h-4 w-4 animate-spin" /> : "Buscar"}
                  </button>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-[360px] overflow-y-auto pr-2 custom-scrollbar">
                  {resultados.map((resultado) => (
                    <button
                      key={resultado.id}
                      onClick={() => void seleccionarResultado(resultado)}
                      className={cn(
                        "group relative aspect-[3/4] rounded-xl border-2 overflow-hidden transition-all",
                        seleccionada?.id === resultado.id ? "border-slate-900 ring-2 ring-slate-900 ring-offset-2" : "border-transparent hover:border-slate-200"
                      )}
                    >
                      <img src={resultado.imagen} alt={resultado.nombre} className="w-full h-full object-cover" loading="lazy" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                        <span className="text-[10px] text-white font-bold truncate">{resultado.nombre}</span>
                      </div>
                    </button>
                  ))}
                </div>

                {modo === "mtg" && seleccionada && (
                  <div className="p-4 bg-slate-50 border rounded-xl space-y-3">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Edición / Versión</label>
                    <select
                      className="w-full h-10 rounded-lg border border-input bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      value={versionMTGId}
                      onChange={(e) => setVersionMTGId(e.target.value)}
                      disabled={buscandoVersiones || versionesMTG.length === 0}
                    >
                      {versionesMTG.length === 0 ? (
                        <option value="">{buscandoVersiones ? "Cargando versiones..." : "Sin versiones"}</option>
                      ) : (
                        versionesMTG.map((v) => <option key={v.id} value={v.id}>{v.detalle ?? v.nombre}</option>)
                      )}
                    </select>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: Preview & Mint */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden group">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <ShieldPlus className="h-5 w-5 text-emerald-400" /> Vista Previa
            </h3>
            
            <div className="aspect-[3/4] w-full max-w-[240px] mx-auto bg-slate-800 rounded-xl border border-slate-700 shadow-2xl overflow-hidden relative mb-6">
              {cartaFuente?.imagen ? (
                <img src={cartaFuente.imagen} alt={cartaFuente.nombre} className="w-full h-full object-cover" />
              ) : (
                <div className="h-full w-full flex flex-col items-center justify-center text-slate-600 space-y-2">
                  <Image className="h-8 w-8" />
                  <span className="text-xs">Sin imagen</span>
                </div>
              )}
              {serialPreview && (
                <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded border border-white/10">
                  <span className="text-[10px] font-mono font-bold tracking-tighter">PSA {serialPreview}</span>
                </div>
              )}
            </div>

            <div className="space-y-3 mb-8">
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-xs text-slate-500 font-medium">Nombre</span>
                <span className="text-xs font-bold truncate max-w-[180px]">{cartaFuente?.nombre || "N/A"}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-xs text-slate-500 font-medium">Juego</span>
                <span className="text-xs font-bold">{cartaFuente?.juego || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-slate-500 font-medium">Serial</span>
                <span className="text-xs font-mono font-bold text-emerald-400">{serialPreview || "AUTOGEN"}</span>
              </div>
            </div>

            <button
              onClick={() => void crearCarta()}
              disabled={creando || procesandoTx || !cartaFuente?.nombre || !cartaFuente?.imagen}
              className="w-full h-12 rounded-xl bg-white text-slate-900 font-bold text-sm shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:grayscale"
            >
              {creando || procesandoTx ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Minteando...
                </span>
              ) : (
                "Mintear NFT"
              )}
            </button>

            {/* Background pattern */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-3xl -mr-16 -mt-16 rounded-full" />
          </div>

          {ultimoResultado && (
            <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl flex gap-4 animate-in slide-in-from-bottom-4">
              <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-emerald-900">¡Carta Creada!</p>
                <p className="text-xs text-emerald-700">ID: #{ultimoResultado.tokenId} | PSA: {ultimoResultado.serial}</p>
              </div>
            </div>
          )}

          {errorBusqueda && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex gap-3 text-rose-800 text-xs">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <p>{errorBusqueda}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
