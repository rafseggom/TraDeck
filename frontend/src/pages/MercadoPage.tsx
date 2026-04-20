import { useMemo, useState } from "react";
import { CardTile } from "../components/CardTile";
import { useAppContext } from "../lib/app-context";
import { EstadoTrade } from "../lib/types";

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
    <section className="page-grid">
      <article className="surface-panel wide-panel">
        <h2>Cartas disponibles para compra o intercambio</h2>
        <p className="warning-line">
          Aviso: en el contrato actual, si una compra queda en escrow y no se confirma entrega, el proceso queda bloqueado.
        </p>

        <div className="filter-grid">
          <input
            value={texto}
            onChange={(event) => setTexto(event.target.value)}
            placeholder="Buscar por nombre, serie o token"
          />
          <select value={juego} onChange={(event) => setJuego(event.target.value)}>
            <option value="TODOS">Todos los juegos</option>
            <option value="MTG">MTG</option>
            <option value="POKEMON">Pokemon</option>
            <option value="MANUAL">Manual</option>
            <option value="DESCONOCIDO">Desconocido</option>
          </select>
          <select value={estado} onChange={(event) => setEstado(event.target.value)}>
            <option value="TODOS">Todos los estados</option>
            <option value="LISTADA">Solo listadas</option>
            <option value="ESCROW">Solo en escrow</option>
          </select>
          <input
            type="number"
            min="0"
            value={precioMin}
            onChange={(event) => setPrecioMin(event.target.value)}
            placeholder="Precio minimo TDC"
          />
          <input
            type="number"
            min="0"
            value={precioMax}
            onChange={(event) => setPrecioMax(event.target.value)}
            placeholder="Precio maximo TDC"
          />
        </div>

        {cartasFiltradas.length === 0 ? (
          <p>No hay cartas que cumplan el filtro.</p>
        ) : (
          <div className="cards-grid">
            {cartasFiltradas.map((carta) => {
              const esMia = wallet.address
                ? carta.owner.toLowerCase() === wallet.address.toLowerCase()
                : false;

              return (
                <CardTile key={carta.tokenId} carta={carta}>
                  {carta.trade.state === EstadoTrade.Listada && !esMia ? (
                    <button
                      type="button"
                      className="btn-primary"
                      disabled={procesandoTx}
                      onClick={() => void comprarCarta(carta.tokenId)}
                    >
                      Comprar
                    </button>
                  ) : null}

                  {carta.trade.state === EstadoTrade.EnEscrow &&
                  wallet.address &&
                  carta.trade.buyer.toLowerCase() === wallet.address.toLowerCase() ? (
                    <button
                      type="button"
                      className="btn-primary"
                      disabled={procesandoTx}
                      onClick={() => void confirmarEntrega(carta.tokenId)}
                    >
                      Confirmar entrega
                    </button>
                  ) : null}
                </CardTile>
              );
            })}
          </div>
        )}
      </article>

      <article className="surface-panel wide-panel">
        <h2>Intercambios activos</h2>

        {ofertasSwap.length === 0 ? (
          <p>No hay swaps activos.</p>
        ) : (
          <ul className="list-clean">
            {ofertasSwap.map((carta) => {
              const puedoAceptar = idsMios.has(carta.swapOffer.wantedTokenId);
              const soyProponente = wallet.address
                ? carta.swapOffer.proposer.toLowerCase() === wallet.address.toLowerCase()
                : false;

              return (
                <li key={`oferta-${carta.tokenId}`} className="swap-line">
                  <span>
                    Oferta: token #{carta.swapOffer.proposerTokenId} por token #{carta.swapOffer.wantedTokenId}
                  </span>

                  <div className="inline-actions">
                    {puedoAceptar && !soyProponente ? (
                      <button
                        type="button"
                        className="btn-primary"
                        disabled={procesandoTx}
                        onClick={() => void aceptarSwap(carta.swapOffer.proposerTokenId)}
                      >
                        Aceptar intercambio
                      </button>
                    ) : null}

                    {soyProponente ? (
                      <button
                        type="button"
                        className="btn-secondary"
                        disabled={procesandoTx}
                        onClick={() => void cancelarSwap(carta.swapOffer.proposerTokenId)}
                      >
                        Cancelar intercambio
                      </button>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </article>
    </section>
  );
}
