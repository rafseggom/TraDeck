import { useMemo, useState } from "react";
import { CardTile } from "../components/CardTile";
import { useAppContext } from "../lib/app-context";
import { EstadoTrade } from "../lib/types";

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
    if (filtroJuego === "TODOS") {
      return cartasUsuario;
    }

    return cartasUsuario.filter((carta) => carta.juego === filtroJuego);
  }, [cartasUsuario, filtroJuego]);

  const cartasNoMias = useMemo(() => {
    if (!wallet.address) {
      return [];
    }

    return cartas.filter((carta) => carta.owner.toLowerCase() !== wallet.address?.toLowerCase());
  }, [cartas, wallet.address]);

  const swapsSalientes = cartasUsuario.filter((carta) => carta.swapOffer.isActive);

  const enviarPropuestaSwap = async () => {
    const propio = Number(miTokenId);
    const deseado = Number(tokenDeseadoId);

    if (!Number.isFinite(propio) || !Number.isFinite(deseado)) {
      return;
    }

    await proponerSwap(propio, deseado);
  };

  if (!wallet.address) {
    return (
      <section className="surface-panel">
        <h2>Mi coleccion</h2>
        <p>Conecta MetaMask para detectar tus cartas automaticamente.</p>
      </section>
    );
  }

  return (
    <section className="page-grid">
      <article className="surface-panel wide-panel">
        <h2>Mis cartas ({cartasUsuarioFiltradas.length})</h2>
        <p className="soft-note">
          Nota de contrato: actualmente no existe funcion para cancelar una venta una vez listada.
        </p>

        <div className="filter-grid">
          <div className="form-stack">
            <label htmlFor="filtro-juego-coleccion">Filtrar por juego</label>
            <select
              id="filtro-juego-coleccion"
              value={filtroJuego}
              onChange={(event) =>
                setFiltroJuego(event.target.value as "TODOS" | "MTG" | "POKEMON")
              }
            >
              <option value="TODOS">Todos</option>
              <option value="MTG">Magic: The Gathering</option>
              <option value="POKEMON">Pokemon</option>
            </select>
          </div>
        </div>

        {cartasUsuarioFiltradas.length === 0 ? (
          <p>No tienes cartas todavia.</p>
        ) : (
          <div className="cards-grid">
            {cartasUsuarioFiltradas.map((carta) => (
              <CardTile key={carta.tokenId} carta={carta}>
                {carta.trade.state === EstadoTrade.NoListada ? (
                  <div className="inline-actions">
                    <input
                      type="number"
                      min="0"
                      step="0.0001"
                      placeholder="Precio en TDC"
                      value={precios[carta.tokenId] ?? ""}
                      onChange={(event) =>
                        setPrecios((actual) => ({
                          ...actual,
                          [carta.tokenId]: event.target.value,
                        }))
                      }
                    />
                    <button
                      type="button"
                      className="btn-primary"
                      disabled={procesandoTx || !(precios[carta.tokenId] ?? "").trim()}
                      onClick={() => void listarCarta(carta.tokenId, precios[carta.tokenId])}
                    >
                      Listar en venta
                    </button>
                  </div>
                ) : (
                  <p className="soft-note">Esta carta ya esta en flujo comercial.</p>
                )}
              </CardTile>
            ))}
          </div>
        )}
      </article>

      <article className="surface-panel">
        <h2>Proponer intercambio</h2>
        <div className="form-stack">
          <label htmlFor="mi-token">Tu carta</label>
          <select
            id="mi-token"
            value={miTokenId}
            onChange={(event) => setMiTokenId(event.target.value)}
          >
            <option value="">Selecciona una carta tuya</option>
            {cartasUsuario.map((carta) => (
              <option key={carta.tokenId} value={carta.tokenId}>
                #{carta.tokenId} - {carta.nombre}
              </option>
            ))}
          </select>

          <label htmlFor="token-deseado">Carta deseada</label>
          <select
            id="token-deseado"
            value={tokenDeseadoId}
            onChange={(event) => setTokenDeseadoId(event.target.value)}
          >
            <option value="">Selecciona una carta objetivo</option>
            {cartasNoMias.map((carta) => (
              <option key={carta.tokenId} value={carta.tokenId}>
                #{carta.tokenId} - {carta.nombre}
              </option>
            ))}
          </select>

          <button
            type="button"
            className="btn-primary"
            disabled={procesandoTx || !miTokenId || !tokenDeseadoId}
            onClick={() => void enviarPropuestaSwap()}
          >
            Publicar propuesta
          </button>
        </div>
      </article>

      <article className="surface-panel">
        <h2>Mis intercambios activos</h2>
        {swapsSalientes.length === 0 ? (
          <p>No tienes propuestas activas.</p>
        ) : (
          <ul className="list-clean">
            {swapsSalientes.map((carta) => (
              <li key={`swap-${carta.tokenId}`}>
                Ofreces #{carta.tokenId} por #{carta.swapOffer.wantedTokenId}
                <button
                  type="button"
                  className="btn-secondary"
                  disabled={procesandoTx}
                  onClick={() => void cancelarSwap(carta.tokenId)}
                >
                  Cancelar
                </button>
              </li>
            ))}
          </ul>
        )}
      </article>
    </section>
  );
}
