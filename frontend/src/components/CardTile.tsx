import { Link } from "react-router-dom";
import { EstadoTrade, type CartaCadena } from "../lib/types";
import { acortarDireccion, formatoTdc } from "../lib/formato";
import type { PropsWithChildren } from "react";

interface CardTileProps extends PropsWithChildren {
  carta: CartaCadena;
}

function textoEstado(estado: EstadoTrade): string {
  if (estado === EstadoTrade.Listada) {
    return "Listada";
  }

  if (estado === EstadoTrade.EnEscrow) {
    return "En escrow";
  }

  return "No listada";
}

export function CardTile({ carta, children }: CardTileProps): JSX.Element {
  return (
    <article className="card-tile">
      <div className="card-image-wrap">
        {carta.imagen ? (
          <img src={carta.imagen} alt={carta.nombre} className="card-image" loading="lazy" />
        ) : (
          <div className="card-image-empty">Sin imagen</div>
        )}
      </div>

      <div className="card-body">
        <h3>{carta.nombre}</h3>
        <p className="card-subline">Serie: {carta.numeroSerie}</p>
        <p className="card-subline">Token ID: #{carta.tokenId}</p>
        <p className="card-subline">Juego: {carta.juego}</p>
        <p className="card-subline">Propietario: {acortarDireccion(carta.owner)}</p>
        <p className="badge-state">Estado: {textoEstado(carta.trade.state)}</p>

        {carta.precioTdc ? (
          <p className="price-line">Precio: {formatoTdc(carta.precioTdc)} TDC</p>
        ) : null}

        <div className="card-links">
          <Link to={`/historial?tokenId=${carta.tokenId}`}>Ver historial</Link>
          <Link to={`/historial?tokenId=${carta.tokenId}&check=1`}>Comprobar veracidad</Link>
        </div>

        {children ? <div className="card-actions">{children}</div> : null}
      </div>
    </article>
  );
}
