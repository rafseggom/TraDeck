import { useEffect, useRef } from "react";
import { useAppContext } from "../lib/app-context";
import { cn } from "../lib/utils";
import { X, CheckCircle2, AlertCircle, Info, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function ToastStack(): JSX.Element {
  const { notificaciones, quitarNotificacion } = useAppContext();
  const notificacionesProgramadas = useRef<Set<number>>(new Set());

  useEffect(() => {
    for (const notificacion of notificaciones) {
      if (notificacionesProgramadas.current.has(notificacion.id)) {
        continue;
      }

      notificacionesProgramadas.current.add(notificacion.id);
      window.setTimeout(() => {
        quitarNotificacion(notificacion.id);
        notificacionesProgramadas.current.delete(notificacion.id);
      }, 5000);
    }
  }, [notificaciones, quitarNotificacion]);

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 w-full max-w-sm pointer-events-none" aria-live="polite">
      <AnimatePresence>
        {notificaciones.map((notificacion) => (
          <motion.article
            key={notificacion.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
            layout
            className={cn(
              "pointer-events-auto relative overflow-hidden rounded-2xl border p-4 pr-10 shadow-xl backdrop-blur-md flex gap-3 items-start",
              notificacion.tipo === "ok" && "bg-emerald-50/90 border-emerald-100 text-emerald-900",
              notificacion.tipo === "info" && "bg-white/90 border-slate-200 text-slate-900",
              notificacion.tipo === "error" && "bg-rose-50/90 border-rose-100 text-rose-900"
            )}
            role="status"
          >
            <div className="shrink-0 mt-0.5">
              {notificacion.tipo === "ok" && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
              {notificacion.tipo === "info" && <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />}
              {notificacion.tipo === "error" && <AlertCircle className="h-4 w-4 text-rose-600" />}
            </div>
            
            <div className="space-y-1">
              <p className="text-xs font-bold leading-tight">
                {notificacion.tipo === "ok" ? "Éxito" : notificacion.tipo === "error" ? "Error" : "Procesando"}
              </p>
              <p className="text-xs opacity-80 leading-snug">{notificacion.mensaje}</p>
            </div>

            <button
              onClick={() => quitarNotificacion(notificacion.id)}
              className="absolute top-3 right-3 p-1 rounded-md opacity-50 hover:opacity-100 hover:bg-black/5 transition-all"
            >
              <X className="h-3.5 w-3.5" />
            </button>
            
            {/* Progress bar (simulated) */}
            <div className="absolute bottom-0 left-0 h-1 bg-current opacity-10 w-full animate-shrink" />
          </motion.article>
        ))}
      </AnimatePresence>
    </div>
  );
}
