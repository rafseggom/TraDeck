import { useMemo, useState } from "react";
import { useAppContext } from "../lib/app-context";
import { subirMetadataAIPFS } from "../lib/ipfs";
import { generarSerialPSA } from "../lib/serial";
import { buscarCartasMTG, buscarCartasPokemon, buscarVersionesMTG, buscarVersionesPokemon } from "../lib/tcg";
import type { JuegoCarta, MetadataCarta, ResultadoBusquedaCarta } from "../lib/types";

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
    <section className="page-grid">
      <article className="surface-panel wide-panel">
        <h2>Crear carta</h2>
        <p>Solo guardamos: nombre completo, imagen y numero de serie inventado tipo PSA.</p>

        <div className="tabs">
          <button
            type="button"
            className={modo === "manual" ? "tab active" : "tab"}
            onClick={() => setModo("manual")}
          >
            Manual
          </button>
          <button
            type="button"
            className={modo === "mtg" ? "tab active" : "tab"}
            onClick={() => setModo("mtg")}
          >
            Buscar Magic: The Gathering
          </button>
          <button
            type="button"
            className={modo === "pokemon" ? "tab active" : "tab"}
            onClick={() => setModo("pokemon")}
          >
            Buscar Pokemon
          </button>
        </div>

        {modo === "manual" ? (
          <div className="form-grid">
            <label htmlFor="manual-nombre">Nombre de carta</label>
            <input
              id="manual-nombre"
              value={manualNombre}
              onChange={(event) => setManualNombre(event.target.value)}
              placeholder="Ejemplo: Charizard Shadowless"
            />

            <label htmlFor="manual-imagen">URL de imagen</label>
            <input
              id="manual-imagen"
              value={manualImagen}
              onChange={(event) => setManualImagen(event.target.value)}
              placeholder="https://..."
            />

            <label htmlFor="manual-juego">Juego</label>
            <select
              id="manual-juego"
              value={manualJuego}
              onChange={(event) => setManualJuego(event.target.value as JuegoCarta)}
            >
              <option value="MANUAL">Manual</option>
              <option value="MTG">MTG</option>
              <option value="POKEMON">Pokemon</option>
            </select>
          </div>
        ) : (
          <>
            <div className="inline-actions">
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={modo === "mtg" ? "Busca en Scryfall" : "Busca en TCGdex"}
              />
              <button
                type="button"
                className="btn-primary"
                onClick={() => void ejecutarBusqueda()}
                disabled={buscando || !query.trim()}
              >
                {buscando ? "Buscando..." : "Buscar"}
              </button>
            </div>

            <div className="search-grid">
              {resultados.map((resultado) => (
                <button
                  key={resultado.id}
                  type="button"
                  className={seleccionada?.id === resultado.id ? "result-card active" : "result-card"}
                  onClick={() => void seleccionarResultado(resultado)}
                >
                  <img src={resultado.imagen} alt={resultado.nombre} loading="lazy" />
                  <span>{resultado.nombre}</span>
                </button>
              ))}
            </div>

            {modo === "mtg" && seleccionada ? (
              <div className="form-grid">
                <label htmlFor="mtg-version-select">Version de {seleccionada.nombre}</label>
                <select
                  id="mtg-version-select"
                  value={versionMTGId}
                  onChange={(event) => setVersionMTGId(event.target.value)}
                  disabled={buscandoVersiones || versionesMTG.length === 0}
                >
                  {versionesMTG.length === 0 ? (
                    <option value="">
                      {buscandoVersiones ? "Cargando versiones..." : "Sin versiones detectadas"}
                    </option>
                  ) : (
                    versionesMTG.map((version) => (
                      <option key={version.id} value={version.id}>
                        {version.detalle ?? version.nombre}
                      </option>
                    ))
                  )}
                </select>
              </div>
            ) : null}
          </>
        )}

        {cartaFuente ? (
          <div className="preview-card">
            <h3>Vista previa</h3>
            <p>Nombre: {cartaFuente.nombre || "-"}</p>
            <p>Juego: {cartaFuente.juego}</p>
            <p>PSA Serial Number: {serialPreview || "Se genera al mintear"}</p>
            {cartaFuente.imagen ? <img src={cartaFuente.imagen} alt={cartaFuente.nombre} /> : null}
          </div>
        ) : null}

        <button
          type="button"
          className="btn-primary"
          disabled={creando || procesandoTx || !cartaFuente || !cartaFuente.nombre || !cartaFuente.imagen}
          onClick={() => void crearCarta()}
        >
          {creando || procesandoTx ? "Creando en blockchain..." : "Subir metadata a IPFS y mintear"}
        </button>

        {ultimoResultado ? (
          <div className="success-box">
            <p>Carta creada correctamente.</p>
            <p>Token ID: {ultimoResultado.tokenId ?? "No detectado"}</p>
            <p>Serie: {ultimoResultado.serial}</p>
            <p>Token URI: {ultimoResultado.tokenUri}</p>
          </div>
        ) : null}

        {errorBusqueda ? <p className="error-line">{errorBusqueda}</p> : null}
      </article>
    </section>
  );
}
