export function acortarDireccion(direccion: string): string {
  if (!direccion || direccion.length < 12) {
    return direccion;
  }

  return `${direccion.slice(0, 6)}...${direccion.slice(-4)}`;
}

export function formatoTdc(valor: string | null): string {
  if (!valor) {
    return "-";
  }

  const numero = Number(valor);
  if (!Number.isFinite(numero)) {
    return valor;
  }

  return numero.toLocaleString("es-ES", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  });
}

export function formatoFechaUnix(timestamp: number): string {
  if (!timestamp || timestamp <= 0) {
    return "Sin fecha";
  }

  const fecha = new Date(timestamp * 1000);
  return fecha.toLocaleString("es-ES");
}
