import { useAppContext } from "../lib/app-context";
import { cn } from "../lib/utils";
import { LayoutDashboard, Wallet, ShoppingBag, ArrowLeftRight, ShieldCheck, AlertCircle } from "lucide-react";

export function InicioPage(): JSX.Element {
  const { cartas, cartasMercado, cartasUsuario, wallet, redConfig } = useAppContext();

  const intercambiosActivos = cartas.filter((carta) => carta.swapOffer.isActive).length;
  const enEscrow = cartasMercado.filter((carta) => carta.trade.state === 2).length;

  const stats = [
    { label: "Cartas Totales", value: cartas.length, icon: LayoutDashboard, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "En Mercado", value: cartasMercado.length, icon: ShoppingBag, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Intercambios", value: intercambiosActivos, icon: ArrowLeftRight, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "En Escrow", value: enEscrow, icon: ShieldCheck, color: "text-emerald-600", bg: "bg-emerald-50" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white p-6 rounded-2xl border shadow-sm flex items-center gap-4 transition-all hover:shadow-md">
            <div className={cn("p-3 rounded-xl", stat.bg)}>
              <stat.icon className={cn("h-6 w-6", stat.color)} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">{stat.label}</p>
              <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-2xl border shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-slate-900 rounded-lg">
              <Wallet className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Tu Estado</h2>
          </div>
          
          {wallet.address ? (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
                <p className="text-sm text-emerald-800 font-medium">Wallet conectada y sincronizada</p>
                <p className="text-xs text-emerald-600 mt-1">Tu colección se detecta automáticamente en tiempo real.</p>
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border">
                <span className="text-sm font-medium text-slate-600">Tus Cartas</span>
                <span className="text-xl font-bold text-slate-900">{cartasUsuario.length}</span>
              </div>
            </div>
          ) : (
            <div className="p-6 bg-slate-50 border border-dashed rounded-xl flex flex-col items-center text-center space-y-3">
              <AlertCircle className="h-8 w-8 text-slate-400" />
              <div>
                <p className="font-semibold text-slate-900">Wallet no conectada</p>
                <p className="text-sm text-slate-500 max-w-[280px]">Conecta MetaMask para operar con cartas y ver tus activos en cadena.</p>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white p-8 rounded-2xl border shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-slate-900 rounded-lg">
              <ShieldCheck className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Garantía TraDeck</h2>
          </div>
          <div className="space-y-4">
            <p className="text-slate-600 text-sm leading-relaxed">
              Este MVP implementa un sistema de <span className="font-bold text-slate-900 text-sm">Escrow Seguro</span>. Cuando compras una carta, tus tokens quedan retenidos en el contrato hasta que confirmas la recepción.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                "Minting NFT Seguro",
                "Swaps Atómicos",
                "Escrow Descentralizado",
                "Historial Inmutable",
              ].map((feature) => (
                <div key={feature} className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border text-[11px] font-bold text-slate-700">
                  <div className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                  {feature}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 text-white p-8 rounded-2xl shadow-xl overflow-hidden relative group">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Empieza a coleccionar</h2>
            <p className="text-slate-400 max-w-xl text-sm leading-relaxed">
              Explora el mercado o crea tus propias cartas tokenizadas. TraDeck utiliza Sepolia Testnet para ofrecerte una experiencia real sin costes de gas reales.
            </p>
          </div>
          <div className="flex gap-3">
            <button className="h-11 px-6 rounded-xl bg-white text-slate-900 font-bold transition-transform hover:scale-105 active:scale-95">
              Explorar Mercado
            </button>
          </div>
        </div>
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[100px] rounded-full -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 blur-[100px] rounded-full -ml-32 -mb-32" />
      </div>
    </div>
  );
}
