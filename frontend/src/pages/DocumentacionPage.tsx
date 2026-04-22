import { Book, Zap, Workflow, LifeBuoy, HelpCircle, Code, Users, ExternalLink, ShieldCheck, Info, ChevronRight } from "lucide-react";
import { cn } from "../lib/utils";

export function DocumentacionPage(): JSX.Element {
  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in duration-700 pb-20">
      {/* Hero Section */}
      <div className="bg-slate-900 rounded-[2.5rem] p-10 md:p-16 text-white shadow-2xl relative overflow-hidden group">
        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[10px] font-black uppercase tracking-widest text-white">
            <Book className="h-3 w-3" /> Guía Oficial
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-none">Documentación de Uso</h1>
          <p className="text-slate-400 text-sm md:text-base max-w-xl leading-relaxed">
            TraDeck es una dApp descentralizada para tokenizar cartas TCG como NFTs. Descubre cómo operar de forma segura en la blockchain.
          </p>
        </div>
        {/* Background blobs */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[100px] rounded-full -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 blur-[100px] rounded-full -ml-32 -mb-32" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Quick Start */}
        <div className="bg-white p-8 rounded-3xl border shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Zap className="h-5 w-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 uppercase tracking-tight">Inicio Rápido</h2>
          </div>
          <ol className="space-y-4">
            {[
              "Instala MetaMask en tu navegador.",
              "Crea o importa una cuenta.",
              "Selecciona la red Sepolia en el selector de TraDeck.",
              "Consigue ETH de prueba en un faucet de Sepolia.",
              "Conecta tu wallet y empieza a operar."
            ].map((step, idx) => (
              <li key={idx} className="flex gap-4">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900 text-[10px] font-bold text-white leading-none">
                  {idx + 1}
                </span>
                <p className="text-sm text-slate-600 leading-snug">{step}</p>
              </li>
            ))}
          </ol>
        </div>

        {/* Workflows */}
        <div className="bg-white p-8 rounded-3xl border shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-50 rounded-lg">
              <Workflow className="h-5 w-5 text-purple-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 uppercase tracking-tight">Flujos Core</h2>
          </div>
          <div className="space-y-4">
            {[
              { t: "Minting", d: "Sube metadata a IPFS y genera tu NFT." },
              { t: "Listado", d: "Define el precio en TDC y publica en el mercado." },
              { t: "Escrow", d: "El pago queda bloqueado hasta la recepción." },
              { t: "Swaps", d: "Intercambios atómicos directos entre usuarios." }
            ].map((f, idx) => (
              <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-100 transition-colors hover:bg-white hover:border-slate-200">
                <p className="text-xs font-bold text-slate-900">{f.t}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Troubleshooting & FAQ */}
      <div className="space-y-8">
        <div className="bg-white p-8 rounded-3xl border shadow-sm">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-rose-50 rounded-lg">
              <LifeBuoy className="h-5 w-5 text-rose-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 uppercase tracking-tight">Resolución de Problemas</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { t: "Red incorrecta", d: "Acepta el cambio de red en MetaMask si el chainId no coincide." },
              { t: "Error IPFS/Pinata", d: "Asegúrate de que el proxy local esté en ejecución (start-local.cmd)." },
              { t: "Transacción Fallida", d: "Confirma que tienes suficiente Sepolia ETH para el gas." },
              { t: "Cartas No Visibles", d: "Verifica que el contrato esté bien desplegado y sincronizado." }
            ].map((p, idx) => (
              <div key={idx} className="space-y-1">
                <p className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                  {p.t}
                </p>
                <p className="text-xs text-slate-500 pl-3.5 leading-relaxed">{p.d}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 rounded-lg">
              <HelpCircle className="h-5 w-5 text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 uppercase tracking-tight">Preguntas Frecuentes</h2>
          </div>
          <div className="space-y-3">
            {[
              { q: "¿Necesito una cuenta?", a: "No. Tu wallet es tu identidad descentralizada." },
              { q: "¿Cuesta dinero real?", a: "No. Usamos redes de prueba (Sepolia) y ETH/TDC gratuitos." },
              { q: "¿Qué pasa si no confirmo?", a: "Los fondos quedan en escrow indefinidamente por seguridad." }
            ].map((faq, idx) => (
              <details key={idx} className="group border rounded-xl overflow-hidden transition-all hover:bg-slate-50">
                <summary className="flex items-center justify-between p-4 cursor-pointer font-bold text-sm text-slate-700">
                  {faq.q}
                  <ChevronRight className="h-4 w-4 transition-transform group-open:rotate-90" />
                </summary>
                <div className="p-4 pt-0 text-xs text-slate-500 border-t border-slate-100 bg-white">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </div>

      {/* Developers & Credits */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        <div className="md:col-span-8 bg-slate-900 p-8 rounded-3xl text-white space-y-4">
          <div className="flex items-center gap-3">
            <Code className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold uppercase tracking-tight">Configuración Técnica</h2>
          </div>
          <p className="text-slate-400 text-xs leading-relaxed">
            Para desarrolladores: despliega en Sepolia configurando tu <code className="text-primary font-mono bg-white/5 px-1 rounded">PRIVATE_KEY</code> en <code className="text-primary font-mono bg-white/5 px-1 rounded">backend/.env</code> y ejecutando:
          </p>
          <div className="bg-black/50 p-4 rounded-xl border border-white/5 font-mono text-xs text-emerald-400">
            npm run deploy:sepolia:sync
          </div>
        </div>

        <div className="md:col-span-4 bg-white p-8 rounded-3xl border shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-slate-900" />
            <h2 className="text-lg font-bold uppercase tracking-tight text-slate-900">Créditos</h2>
          </div>
          <div className="space-y-4">
            {[
              { name: "Rafa Segura", link: "https://github.com/rafseggom" },
              { name: "Javier Luque", link: "https://github.com/Javierluqueruiz" }
            ].map(dev => (
              <a 
                key={dev.name} 
                href={dev.link} 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center justify-between p-3 rounded-xl border bg-slate-50 transition-all hover:bg-slate-900 hover:text-white group"
              >
                <span className="text-xs font-bold">{dev.name}</span>
                <ExternalLink className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
            ))}
            <div className="pt-2 border-t flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase">
              <ShieldCheck className="h-3.5 w-3.5" /> MIT Licensed
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
