import { NavLink, Outlet } from "react-router-dom";
import { useAppContext } from "../lib/app-context";
import type { RedClave } from "../lib/types";

function claseNavLink(activo: boolean): string {
  return activo ? "nav-link active" : "nav-link";
}

export function Layout(): JSX.Element {
  const {
    redClave,
    redConfig,
    wallet,
    walletResumen,
    saldoTdc,
    advertenciaRed,
    conectarWallet,
    desconectarWallet,
    cambiarRedObjetivo,
    solicitarAirdrop,
    procesandoTx,
    cargandoDatos,
    refrescarDatos,
  } = useAppContext();

  const chainIdCoincide = wallet.chainId !== null && wallet.chainId === redConfig.chainId;

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <h1>TraDeck</h1>
          <p className="subtitle">Intercambio y compra de cartas TCG en blockchain</p>
        </div>

        <div className="wallet-panel">
          <label htmlFor="selector-red">Red objetivo</label>
          <select
            id="selector-red"
            value={redClave}
            onChange={(event) => void cambiarRedObjetivo(event.target.value as RedClave)}
          >
            <option value="local">Hardhat Local</option>
            <option value="sepolia">Sepolia</option>
          </select>

          <p className="wallet-line">Wallet: {walletResumen}</p>
          <p className="wallet-line">Saldo TDC: {Number(saldoTdc).toLocaleString("es-ES", { maximumFractionDigits: 4 })}</p>

          <div className="wallet-actions">
            {wallet.address ? (
              <>
                <button type="button" className="btn-secondary" onClick={desconectarWallet}>
                  Desconectar
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => void solicitarAirdrop()}
                  disabled={procesandoTx}
                >
                  Pedir airdrop
                </button>
              </>
            ) : (
              <button type="button" className="btn-primary" onClick={() => void conectarWallet()}>
                Conectar MetaMask
              </button>
            )}

            <button
              type="button"
              className="btn-tertiary"
              onClick={() => void refrescarDatos()}
              disabled={cargandoDatos}
            >
              Recargar
            </button>

            {redClave === "sepolia" && wallet.address && (
              <a
                href={`https://sepolia.etherscan.io/address/${wallet.address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-tertiary"
                style={{ textDecoration: "none", display: "inline-block" }}
              >
                Etherscan
              </a>
            )}
          </div>
        </div>
      </header>

      <nav className="main-nav">
        <NavLink to="/" className={({ isActive }) => claseNavLink(isActive)} end>
          Inicio
        </NavLink>
        <NavLink to="/coleccion" className={({ isActive }) => claseNavLink(isActive)}>
          Mi coleccion
        </NavLink>
        <NavLink to="/crear" className={({ isActive }) => claseNavLink(isActive)}>
          Crear carta
        </NavLink>
        <NavLink to="/mercado" className={({ isActive }) => claseNavLink(isActive)}>
          Mercado
        </NavLink>
        <NavLink to="/historial" className={({ isActive }) => claseNavLink(isActive)}>
          Historial
        </NavLink>
        <NavLink to="/documentacion" className={({ isActive }) => claseNavLink(isActive)}>
          Documentacion
        </NavLink>
      </nav>

      {advertenciaRed ? <div className="warning-banner">{advertenciaRed}</div> : null}
      {!wallet.address ? <div className="info-banner">Conecta MetaMask para operar y detectar tus cartas automaticamente.</div> : null}

      <main className="main-content">
        <section className="surface-panel">
          <h2>{redConfig.nombre}</h2>
          <p className="chain-line">
            <span
              className={chainIdCoincide ? "chain-indicator ok" : "chain-indicator fail"}
              aria-hidden="true"
            >
              {chainIdCoincide ? "✓" : "✗"}
            </span>
            Chain ID esperada: {redConfig.chainId} | Chain ID en wallet: {wallet.chainId ?? "sin conectar"}
          </p>
        </section>

        <Outlet />
      </main>
    </div>
  );
}
