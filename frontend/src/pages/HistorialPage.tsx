import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAppContext } from "../lib/app-context";
import { acortarDireccion, formatoFechaUnix } from "../lib/formato";
import type { EventoCartaHistorial } from "../lib/types";

export function HistorialPage(): JSX.Element {
  const { cartas, cargarHistorialCarta } = useAppContext();
  const [searchParams, setSearchParams] = useSearchParams();

  const [cargando, setCargando] = useState<boolean>(false);
  const [eventos, setEventos] = useState<EventoCartaHistorial[]>([]);

  const tokenIdParam = searchParams.get("tokenId");

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

  useEffect(() => {
    if (!tokenSeleccionado) {
      setEventos([]);
      return;
    }

    const cargar = async () => {
      setCargando(true);
      const historial = await cargarHistorialCarta(tokenSeleccionado);
      setEventos(historial);
      setCargando(false);
    };

    void cargar();
  }, [cargarHistorialCarta, tokenSeleccionado]);

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
        </div>

        {cartaActual ? (
          <div className="surface-panel">
            <h3>Verificacion de integridad</h3>
            <p>Nombre actual: {cartaActual.nombre}</p>
            <p>Numero de serie actual: {cartaActual.numeroSerie}</p>
            <p>Token URI actual: {cartaActual.tokenUri}</p>
          </div>
        ) : null}

        {cargando ? <p>Cargando historial...</p> : null}

        {!cargando && eventos.length === 0 ? (
          <p>No hay eventos para esta carta.</p>
        ) : (
          <ol className="timeline">
            {eventos.map((evento) => (
              <li key={`${evento.txHash}-${evento.blockNumber}`}>
                <p>
                  <strong>{evento.tipo}</strong> | Bloque {evento.blockNumber} | {formatoFechaUnix(evento.timestamp)}
                </p>
                <p>
                  De {acortarDireccion(evento.from)} a {acortarDireccion(evento.to)}
                </p>
                <p className="soft-note">Tx: {evento.txHash}</p>
              </li>
            ))}
          </ol>
        )}
      </article>
    </section>
  );
}
