function valorAleatorio(longitud: number): string {
  const caracteres = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let resultado = "";

  for (let i = 0; i < longitud; i += 1) {
    const indice = Math.floor(Math.random() * caracteres.length);
    resultado += caracteres[indice];
  }

  return resultado;
}

export function generarSerialPSA(): string {
  const ahora = new Date();
  const anio = ahora.getFullYear().toString();
  const mes = (ahora.getMonth() + 1).toString().padStart(2, "0");
  const dia = ahora.getDate().toString().padStart(2, "0");

  return `PSA-${anio}${mes}${dia}-${valorAleatorio(5)}`;
}
