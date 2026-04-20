import { useAppContext } from "../lib/app-context";

export function InicioPage(): JSX.Element {
  const { cartas, cartasMercado, cartasUsuario, wallet, redConfig } = useAppContext();

  const intercambiosActivos = cartas.filter((carta) => carta.swapOffer.isActive).length;
  const enEscrow = cartasMercado.filter((carta) => carta.trade.state === 2).length;

  return (
    <section className="page-grid">
      <article className="surface-panel metric-panel">
        <h2>Resumen rapido</h2>
        <p>Red activa de lectura: {redConfig.nombre}</p>
        <p>Total de cartas detectadas: {cartas.length}</p>
        <p>Cartas en mercado: {cartasMercado.length}</p>
        <p>Intercambios activos: {intercambiosActivos}</p>
        <p>Operaciones en escrow: {enEscrow}</p>
      </article>

      <article className="surface-panel metric-panel">
        <h2>Tu cuenta</h2>
        {wallet.address ? (
          <>
            <p>Tu wallet esta conectada y la coleccion se detecta automaticamente.</p>
            <p>Cartas asociadas a tu direccion: {cartasUsuario.length}</p>
          </>
        ) : (
          <p>Conecta MetaMask para operar con cartas y ver tus activos en cadena.</p>
        )}
      </article>

      <article className="surface-panel wide-panel">
        <h2>Estado del contrato actual</h2>
        <p>
          Este MVP usa las funciones que ya existen: crear carta, listar para venta, comprar, confirmar entrega,
          proponer intercambio, aceptar intercambio y cancelar intercambio.
        </p>
        <p>
          Importante: si una compra queda en estado escrow, el comprador debe confirmar entrega para liberar pago y NFT.
        </p>
      </article>
    </section>
  );
}
