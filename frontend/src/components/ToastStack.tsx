import { useEffect, useRef } from "react";
import { useAppContext } from "../lib/app-context";

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
    <div className="toast-stack" aria-live="polite">
      {notificaciones.map((notificacion) => (
        <article
          key={notificacion.id}
          className={`toast toast-${notificacion.tipo}`}
          role="status"
        >
          <p>{notificacion.mensaje}</p>
          <button
            type="button"
            className="btn-link"
            onClick={() => quitarNotificacion(notificacion.id)}
          >
            Cerrar
          </button>
        </article>
      ))}
    </div>
  );
}
