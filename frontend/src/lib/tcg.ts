import { POKEMON_TCG_API_KEY } from "./config";
import type { ResultadoBusquedaCarta } from "./types";

const SCRYFALL_URL = "https://api.scryfall.com/cards/search";
const POKEMON_URL = "https://api.pokemontcg.io/v2/cards";

function toTextoValor(valor: unknown): string {
  return typeof valor === "string" ? valor : "";
}

function toImagenScryfall(carta: any): string {
  if (carta.image_uris?.normal) {
    return carta.image_uris.normal;
  }

  if (Array.isArray(carta.card_faces)) {
    return carta.card_faces[0]?.image_uris?.normal ?? "";
  }

  return "";
}

export async function buscarCartasMTG(texto: string): Promise<ResultadoBusquedaCarta[]> {
  const query = texto.trim();

  if (!query) {
    return [];
  }

  const url = `${SCRYFALL_URL}?q=${encodeURIComponent(query)}&unique=cards&order=name&dir=asc&include_extras=true`;
  const respuesta = await fetch(url);

  if (!respuesta.ok) {
    throw new Error("No se pudo consultar Scryfall");
  }

  const data = await respuesta.json();
  const cartas = Array.isArray(data.data) ? data.data : [];

  return cartas
    .map((carta: any) => ({
      id: String(carta.id ?? ""),
      nombre: String(carta.name ?? "Sin nombre"),
      imagen: toImagenScryfall(carta),
      juego: "MTG" as const,
      detalle: "Selecciona para ver versiones",
    }))
    .filter((carta: ResultadoBusquedaCarta) => carta.imagen.length > 0)
    .slice(0, 24);
}

export async function buscarVersionesMTG(nombreCarta: string): Promise<ResultadoBusquedaCarta[]> {
  const nombre = nombreCarta.trim();

  if (!nombre) {
    return [];
  }

  // unique=prints returns all printings/versions for the exact card name.
  const query = `!\"${nombre}\"`;
  const url = `${SCRYFALL_URL}?q=${encodeURIComponent(query)}&unique=prints&order=released&dir=desc&include_extras=true`;
  const respuesta = await fetch(url);

  if (!respuesta.ok) {
    throw new Error("No se pudo consultar versiones de Scryfall");
  }

  const data = await respuesta.json();
  const cartas = Array.isArray(data.data) ? data.data : [];

  return cartas
    .map((carta: any) => {
      const setCode = toTextoValor(carta.set).toUpperCase();
      const setName = toTextoValor(carta.set_name) || "Set desconocido";
      const collectorNumber = toTextoValor(carta.collector_number) || "-";
      const lang = toTextoValor(carta.lang).toUpperCase() || "?";
      const releasedAt = toTextoValor(carta.released_at) || "s/f";

      return {
        id: String(carta.id ?? ""),
        nombre: String(carta.name ?? "Sin nombre"),
        imagen: toImagenScryfall(carta),
        juego: "MTG" as const,
        detalle: `${setName} (${setCode}) #${collectorNumber} | ${lang} | ${releasedAt}`,
      } satisfies ResultadoBusquedaCarta;
    })
    .filter((carta: ResultadoBusquedaCarta) => carta.imagen.length > 0);
}

export async function buscarCartasPokemon(texto: string): Promise<ResultadoBusquedaCarta[]> {
  const query = texto.trim();

  if (!query) {
    return [];
  }

  const headers: Record<string, string> = {};
  if (POKEMON_TCG_API_KEY.trim().length > 0) {
    headers["X-Api-Key"] = POKEMON_TCG_API_KEY;
  }

  const url = `${POKEMON_URL}?q=name:*${encodeURIComponent(query)}*&pageSize=24`;
  const respuesta = await fetch(url, { headers });

  if (!respuesta.ok) {
    throw new Error("No se pudo consultar Pokemon TCG API");
  }

  const data = await respuesta.json();
  const cartas = Array.isArray(data.data) ? data.data : [];

  return cartas
    .map((carta: any) => ({
      id: String(carta.id ?? ""),
      nombre: String(carta.name ?? "Sin nombre"),
      imagen: String(carta.images?.large ?? carta.images?.small ?? ""),
      juego: "POKEMON" as const,
    }))
    .filter((carta: ResultadoBusquedaCarta) => carta.imagen.length > 0);
}
