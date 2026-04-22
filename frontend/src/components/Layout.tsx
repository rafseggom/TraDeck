import { NavLink, Outlet } from "react-router-dom";
import { useAppContext } from "../lib/app-context";
import { cn } from "../lib/utils";
import type { RedClave } from "../lib/types";
import { RefreshCw, Wallet, ExternalLink, LogOut, Coins } from "lucide-react";

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
    <div className="min-h-screen bg-slate-50/50">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-8">
            <NavLink to="/" className="flex items-center space-x-2">
              <span className="text-2xl font-bold tracking-tight text-primary">TraDeck</span>
            </NavLink>
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
              {[
                { to: "/", label: "Inicio" },
                { to: "/coleccion", label: "Colección" },
                { to: "/crear", label: "Crear" },
                { to: "/mercado", label: "Mercado" },
                { to: "/historial", label: "Historial" },
                { to: "/documentacion", label: "Docs" },
              ].map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === "/"}
                  className={({ isActive }) =>
                    cn(
                      "transition-colors hover:text-foreground/80",
                      isActive ? "text-foreground font-semibold" : "text-foreground/60"
                    )
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden lg:flex flex-col items-end text-right mr-2">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <Wallet className="h-3 w-3" />
                <span>{walletResumen}</span>
              </div>
              <div className="flex items-center gap-1 text-sm font-bold text-primary">
                <span>{Number(saldoTdc).toLocaleString("es-ES", { maximumFractionDigits: 2 })}</span>
                <span className="text-[10px] font-medium text-muted-foreground">TDC</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <select
                className="h-9 w-32 rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={redClave}
                onChange={(e) => void cambiarRedObjetivo(e.target.value as RedClave)}
              >
                <option value="local">Local</option>
                <option value="sepolia">Sepolia</option>
              </select>

              {wallet.address ? (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => void solicitarAirdrop()}
                    disabled={procesandoTx}
                    className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                  >
                    <Coins className="mr-2 h-3.5 w-3.5" />
                    Airdrop
                  </button>
                  <button
                    onClick={desconectarWallet}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-input bg-background transition-colors hover:bg-accent hover:text-accent-foreground"
                    title="Desconectar"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => void conectarWallet()}
                  className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
                >
                  Conectar
                </button>
              )}

              <button
                onClick={() => void refrescarDatos()}
                disabled={cargandoDatos}
                className={cn(
                  "inline-flex h-9 w-9 items-center justify-center rounded-md border border-input bg-background transition-colors hover:bg-accent hover:text-accent-foreground",
                  cargandoDatos && "animate-spin"
                )}
                title="Sincronizar"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto p-4 md:p-6 lg:p-8 max-w-7xl">
        {advertenciaRed && (
          <div className="mb-6 flex items-center p-4 rounded-lg border border-red-200 bg-red-50 text-red-900 text-sm font-medium animate-in fade-in slide-in-from-top-2">
            {advertenciaRed}
          </div>
        )}
        
        {!wallet.address && (
          <div className="mb-6 flex items-center p-4 rounded-lg border border-blue-100 bg-blue-50 text-blue-900 text-sm font-medium">
            Conecta tu wallet para empezar a operar.
          </div>
        )}

        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
              {redConfig.nombre}
            </h2>
            <div className="mt-1 flex items-center gap-2 text-sm text-slate-500 font-medium">
              <span className={cn(
                "flex h-2 w-2 rounded-full",
                chainIdCoincide ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]"
              )} />
              <span>Chain ID: {redConfig.chainId}</span>
              <span className="text-slate-300">|</span>
              <span>Wallet: {wallet.chainId ?? "n/a"}</span>
              {redClave === "sepolia" && wallet.address && (
                <>
                  <span className="text-slate-300">|</span>
                  <a
                    href={`https://sepolia.etherscan.io/address/${wallet.address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center hover:text-primary underline underline-offset-4"
                  >
                    Etherscan <ExternalLink className="ml-1 h-3 w-3" />
                  </a>
                </>
              )}
            </div>
          </div>
        </div>

        <Outlet />
      </main>
    </div>
  );
}
