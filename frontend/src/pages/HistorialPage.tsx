import { useEffect, useMemo, useState } from "react";
import { keccak256, toUtf8Bytes } from "ethers";
import { useSearchParams } from "react-router-dom";
import { useAppContext } from "../lib/app-context";
import { formatoFechaUnix } from "../lib/formato";
import type { EventoCartaHistorial, VeracidadCartaResultado } from "../lib/types";

function selloCadena(eventos: EventoCartaHistorial[]): string {
  if (eventos.length === 0) {
    return "-";
  }

  const base = eventos
    .map(
      (evento) =>
        `${evento.blockNumber}:${evento.blockHash}:${evento.parentHash}:${evento.txHash}:${evento.from}:${evento.to}`,
    )
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
    if (!tokenIdParam) {
      return cartas.length > 0 ? cartas[0].tokenId : null;
    }

    const parsed = Number(tokenIdParam);
    return Number.isFinite(parsed) ? parsed : null;
  }, [cartas, tokenIdParam]);

  const cartaActual = useMemo(
    () => cartas.find((carta) => carta.tokenId === tokenSeleccionado) ?? null,
    [cartas, tokenSeleccionado],
  );

  const selloOnChain = useMemo(() => selloCadena(eventosCadena), [eventosCadena]);
  const selloVista = useMemo(() => selloCadena(eventosVista), [eventosVista]);
  const selloCoincide = selloOnChain !== "-" && selloOnChain === selloVista;
  const eventosAsc = useMemo(
    () => [...eventosCadena].sort((a, b) => a.blockNumber - b.blockNumber),
    [eventosCadena],
  );

  useEffect(() => {
    // Cambio clave: antes era !tokenSeleccionado, lo cual fallaba si el ID era 0
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
      inconsistencias.push("La vista no tiene el mismo numero de eventos que la cadena.");
      return inconsistencias;
    }

    for (let i = 0; i < eventosCadena.length; i += 1) {
      const cadena = eventosCadena[i];
      const vista = eventosVista[i];

      if (
        cadena.txHash !== vista.txHash ||
        cadena.blockHash !== vista.blockHash ||
        cadena.parentHash !== vista.parentHash ||
        cadena.from !== vista.from ||
        cadena.to !== vista.to
      ) {
        inconsistencias.push(
          `Se detecto alteracion en el evento de bloque ${vista.blockNumber} comparado contra blockchain.`,
        );
      }
    }

    return inconsistencias;
  };

  const ejecutarVerificacion = async (): Promise<void> => {
    // Cambio clave: validamos explícitamente contra null
    if (tokenSeleccionado === null) {
      return;
    }

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
        resumen: "Se detecto manipulacion local de la trazabilidad mostrada.",
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

  const editarEvento = (
    index: number,
    campo: "blockHash" | "parentHash" | "txHash" | "from" | "to",
    valor: string,
  ): void => {
    setEventosVista((actual) =>
      actual.map((evento, eventoIndex) =>
        eventoIndex === index
          ? {
              ...evento,
              [campo]: valor,
            }
          : evento,
      ),
    );
  };

  useEffect(() => {
    // Cambio clave: permitir que el ID 0 pase la validación
    if (checkParam !== "1" || tokenSeleccionado === null || cargando) {
      return;
    }

    void ejecutarVerificacion();
  }, [checkParam, tokenSeleccionado, cargando]);

  return (
    <section className="page-grid">
      <article className="surface-panel wide-panel">
        <h2>Historial por carta</h2>
        <div className="inline-actions">
          <label htmlFor="selector-token">Token</label>
          <select
            id="selector-token"
            value={tokenSeleccionado ?? ""}
            onChange={(event) => setSearchParams({ tokenId: event.target.value })}
          >
            {cartas.map((carta) => (
              <option key={carta.tokenId} value={carta.tokenId}>
                #{carta.tokenId} - {carta.nombre}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="btn-primary"
            onClick={() => void ejecutarVerificacion()}
            // Cambio clave: activar botón aunque el ID sea 0
            disabled={verificando || cargando || tokenSeleccionado === null}
          >
            {verificando ? "Verificando..." : "Comprobar veracidad"}
          </button>
          <button type="button" className="btn-secondary" onClick={alternarModoHackeo}>
            {modoHackeoManual ? "Bloquear edicion manual" : "Hackear cadena (demo local)"}
          </button>
          <button type="button" className="btn-tertiary" onClick={restaurarVistaDesdeBlockchain}>
            Restaurar desde blockchain
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setMostrarPopupManual(true)}
            disabled={eventosCadena.length === 0}
          >
            Comprobacion manual
          </button>
        </div>

        {modoHackeoManual ? (
          <p className="warning-line">
            Modo laboratorio activo: puedes editar manualmente hashes y direcciones de la vista. Esto NO modifica la blockchain real.
          </p>
        ) : null}

        <div className="surface-panel">
          <h3>Sello de integridad de cadena</h3>
          <p className="hash-line">Sello on-chain: {selloOnChain}</p>
          <p className="hash-line">Sello vista local: {selloVista}</p>
          <p className={selloCoincide ? "ok-line" : "error-line"}>
            {selloCoincide
              ? "Coincide con blockchain: cadena visual integra"
              : "No coincide con blockchain: alteracion detectada en la vista"}
          </p>
        </div>

        {cartaActual ? (
          <div className="surface-panel">
            <h3>Verificacion de integridad</h3>
            <p>Nombre actual: {cartaActual.nombre}</p>
            <p>Numero de serie actual: {cartaActual.numeroSerie}</p>
            <p>Token URI actual: {cartaActual.tokenUri}</p>
          </div>
        ) : null}

        {resultadoVeracidad ? (
          <div className={resultadoVeracidad.esValida ? "success-box" : "surface-panel"}>
            <h3>{resultadoVeracidad.esValida ? "Originalidad verificada" : "Inconsistencias detectadas"}</h3>
            <p>{resultadoVeracidad.resumen}</p>
            <ul className="list-clean">
              {resultadoVeracidad.detalles.map((detalle) => (
                <li key={detalle}>{detalle}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {cargando ? <p>Cargando historial...</p> : null}

        {!cargando && eventosVista.length === 0 ? (
          <p>No hay eventos para esta carta.</p>
        ) : (
          <ol className="timeline">
            {eventosVista.map((evento) => (
              <li key={`${evento.txHash}-${evento.blockNumber}`}>
                <p>
                  <strong>{evento.tipo}</strong> | Bloque {evento.blockNumber} | {formatoFechaUnix(evento.timestamp)}
                </p>
                <p className="hash-line">Block hash: {evento.blockHash}</p>
                <p className="hash-line">Parent hash (N-1): {evento.parentHash}</p>
                <p>
                  De {evento.from} a {evento.to}
                </p>
                <p className="hash-line">Tx: {evento.txHash}</p>
              </li>
            ))}
          </ol>
        )}

        {modoHackeoManual && eventosVista.length > 0 ? (
          <div className="surface-panel">
            <h3>Editor manual de cadena (solo vista local)</h3>
            <p className="soft-note">
              Cambia cualquier campo y vuelve a pulsar Comprobar veracidad para ver si la app detecta la manipulacion.
            </p>

            <div className="tamper-grid">
              {eventosVista.map((evento, index) => (
                <article key={`tamper-${evento.txHash}-${evento.blockNumber}`} className="tamper-card">
                  <h4>Evento #{index + 1} | Bloque {evento.blockNumber}</h4>

                  <label htmlFor={`tamper-block-${index}`}>Block hash</label>
                  <input
                    id={`tamper-block-${index}`}
                    value={evento.blockHash}
                    onChange={(event) => editarEvento(index, "blockHash", event.target.value)}
                  />

                  <label htmlFor={`tamper-parent-${index}`}>Parent hash (N-1)</label>
                  <input
                    id={`tamper-parent-${index}`}
                    value={evento.parentHash}
                    onChange={(event) => editarEvento(index, "parentHash", event.target.value)}
                  />

                  <label htmlFor={`tamper-tx-${index}`}>Tx hash</label>
                  <input
                    id={`tamper-tx-${index}`}
                    value={evento.txHash}
                    onChange={(event) => editarEvento(index, "txHash", event.target.value)}
                  />

                  <label htmlFor={`tamper-from-${index}`}>From</label>
                  <input
                    id={`tamper-from-${index}`}
                    value={evento.from}
                    onChange={(event) => editarEvento(index, "from", event.target.value)}
                  />

                  <label htmlFor={`tamper-to-${index}`}>To</label>
                  <input
                    id={`tamper-to-${index}`}
                    value={evento.to}
                    onChange={(event) => editarEvento(index, "to", event.target.value)}
                  />
                </article>
              ))}
            </div>
          </div>
        ) : null}

        {mostrarPopupManual ? (
          <div className="manual-overlay" role="dialog" aria-modal="true" aria-label="Comprobacion manual">
            <article className="manual-modal">
              <header className="manual-header">
                <h3>Comprobacion manual</h3>
                <button type="button" className="btn-link" onClick={() => setMostrarPopupManual(false)}>
                  Cerrar
                </button>
              </header>

              <p>
                Esta vista te permite verificar manualmente que cada bloque de la trazabilidad es consistente con blockchain.
              </p>

              <div className="manual-steps">
                <p><strong>Paso 1.</strong> En cada evento, anota el bloque N y su block hash.</p>
                <p><strong>Paso 2.</strong> Comprueba que el parent hash de N coincide con el hash del bloque N-1.</p>
                <p><strong>Paso 3.</strong> Comprueba que el tx hash pertenece al bloque N.</p>
                <p><strong>Paso 4.</strong> Verifica continuidad de dueños: el to de un evento debe encajar con el from del siguiente.</p>
              </div>

              <div className="manual-chain-list">
                {eventosAsc.map((evento) => (
                  <article key={`manual-${evento.txHash}-${evento.blockNumber}`} className="manual-chain-card">
                    <p className="manual-title">Bloque N = {evento.blockNumber}</p>
                    <p className="hash-line">Block hash: {evento.blockHash}</p>
                    <p className="hash-line">Parent hash (apunta a N-1): {evento.parentHash}</p>
                    <p className="hash-line">Hash bloque N-1 (real): {evento.previousBlockHash || "-"}</p>
                    <p className={evento.parentHashValido ? "ok-line" : "error-line"}>
                      {evento.parentHashValido
                        ? "Enlace N -> N-1 valido"
                        : "Enlace N -> N-1 invalido"}
                    </p>
                    <p className="hash-line">Tx hash: {evento.txHash}</p>
                    <p className="soft-note">
                      {evento.from} {"->"} {evento.to}
                    </p>
                  </article>
                ))}
              </div>
            </article>
          </div>
        ) : null}
      </article>
    </section>
  );
}