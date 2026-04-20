import { useAppContext } from "../lib/app-context";

export function ToastStack(): JSX.Element {
  const { notificaciones, quitarNotificacion } = useAppContext();

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
