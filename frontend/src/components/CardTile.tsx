import { Link } from "react-router-dom";
import { EstadoTrade, type CartaCadena } from "../lib/types";
import { acortarDireccion, formatoTdc } from "../lib/formato";
import { cn } from "../lib/utils";
import type { PropsWithChildren } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { BadgeCheck, History, ExternalLink, ShieldCheck } from "lucide-react";

interface CardTileProps extends PropsWithChildren {
  carta: CartaCadena;
}

function textoEstado(estado: EstadoTrade): string {
  if (estado === EstadoTrade.Listada) return "En Venta";
  if (estado === EstadoTrade.EnEscrow) return "En Escrow";
  return "Colección";
}

function colorEstado(estado: EstadoTrade): string {
  if (estado === EstadoTrade.Listada) return "bg-amber-100 text-amber-700 border-amber-200";
  if (estado === EstadoTrade.EnEscrow) return "bg-blue-100 text-blue-700 border-blue-200";
  return "bg-slate-100 text-slate-700 border-slate-200";
}

export function CardTile({ carta, children }: CardTileProps): JSX.Element {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["10deg", "-10deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-10deg", "10deg"]);

  const glareX = useTransform(mouseXSpring, [-0.5, 0.5], ["0%", "100%"]);
  const glareY = useTransform(mouseYSpring, [-0.5, 0.5], ["0%", "100%"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <div className="flex flex-col group">
      <div className="perspective-[1000px]">
        <motion.article
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{
            rotateX,
            rotateY,
            transformStyle: "preserve-3d",
          }}
          className="relative flex flex-col bg-white border rounded-xl overflow-hidden shadow-sm transition-shadow hover:shadow-xl"
        >
          {/* Holographic Glare */}
          <motion.div
            style={{
              background: useTransform(
                [glareX, glareY],
                ([gx, gy]) =>
                  `radial-gradient(circle at ${gx} ${gy}, rgba(255,255,255,0.3) 0%, transparent 80%)`
              ),
            }}
            className="absolute inset-0 z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          />

          <div className="relative aspect-[3/4] overflow-hidden bg-slate-100">
            {carta.imagen ? (
              <img
                src={carta.imagen}
                alt={carta.nombre}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                loading="lazy"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 font-medium">
                Sin imagen
              </div>
            )}
            
            <div className="absolute top-3 left-3 flex flex-col gap-2 z-20">
              <span className={cn(
                "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border shadow-sm",
                colorEstado(carta.trade.state)
              )}>
                {textoEstado(carta.trade.state)}
              </span>
            </div>

            {carta.precioTdc ? (
              <div className="absolute bottom-3 right-3 z-20">
                <div className="bg-black/80 backdrop-blur-sm text-white px-3 py-1 rounded-lg border border-white/20 shadow-lg">
                  <span className="text-xs font-medium opacity-70 mr-1">TDC</span>
                  <span className="text-sm font-bold">{formatoTdc(carta.precioTdc)}</span>
                </div>
              </div>
            ) : null}
          </div>

          <div className="p-4 flex flex-col gap-3">
            <div>
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-bold text-slate-900 line-clamp-1 leading-tight" title={carta.nombre}>
                  {carta.nombre}
                </h3>
              </div>
              <p className="text-[11px] font-medium text-slate-500 mt-0.5">
                {carta.juego} • #{carta.tokenId}
              </p>
            </div>

            <div className="space-y-1.5 py-1 border-y border-slate-50">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Propietario</span>
                <span className="font-mono text-slate-600">{acortarDireccion(carta.owner)}</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Serie</span>
                <span className="font-mono text-slate-600 truncate max-w-[120px]" title={carta.numeroSerie}>
                  {carta.numeroSerie}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                to={`/historial?tokenId=${carta.tokenId}`}
                className="flex-1 inline-flex items-center justify-center gap-1.5 text-[10px] font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 py-1.5 rounded-md border transition-colors"
              >
                <History className="h-3 w-3" />
                Historial
              </Link>
              <Link
                to={`/historial?tokenId=${carta.tokenId}&check=1`}
                className="flex-1 inline-flex items-center justify-center gap-1.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 py-1.5 rounded-md border border-emerald-100 transition-colors"
              >
                <ShieldCheck className="h-3 w-3" />
                Verificar
              </Link>
            </div>

            {children ? (
              <div className="pt-1">
                {children}
              </div>
            ) : null}
          </div>
        </motion.article>
      </div>
    </div>
  );
}
