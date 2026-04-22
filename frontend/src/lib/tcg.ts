import TCGdex, { Query } from "@tcgdex/sdk";
import type { ResultadoBusquedaCarta } from "./types";

const SCRYFALL_URL = "https://api.scryfall.com/cards/search";
const tcgdex = new TCGdex("en");

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

  try {
    const cartas = await tcgdex.card.list(
      Query.create()
        .contains("name", query)
        .paginate(1, 24)
    );

    return cartas
      .map((carta: any) => ({
        id: String(carta.id ?? ""),
        nombre: String(carta.name ?? "Sin nombre"),
        imagen: String(carta.getImageURL?.("high", "png") ?? ""),
        juego: "POKEMON" as const,
      }))
      .filter((carta: ResultadoBusquedaCarta) => carta.imagen.length > 0);
  } catch (error) {
    console.error("Error buscando cartas Pokémon:", error);
    throw new Error("No se pudo consultar TCGdex");
  }
}

export async function buscarVersionesPokemon(nombreCarta: string): Promise<ResultadoBusquedaCarta[]> {
  const nombre = nombreCarta.trim();

  if (!nombre) {
    return [];
  }

  try {
    const cartas = await tcgdex.card.list(
      Query.create()
        .equal("name", nombre)
        .sort("set.releaseDate", "DESC")
    );

    return cartas
      .map((carta: any) => {
        const setName = carta.set?.name || "Set desconocido";
        const series = carta.set?.serie?.name || "Serie desconocida";
        const cardNumber = carta.localId || "-";

        return {
          id: String(carta.id ?? ""),
          nombre: String(carta.name ?? "Sin nombre"),
          imagen: String(carta.getImageURL?.("high", "png") ?? ""),
          juego: "POKEMON" as const,
          detalle: `${setName} (${series}) #${cardNumber}`,
        } satisfies ResultadoBusquedaCarta;
      })
      .filter((carta: ResultadoBusquedaCarta) => carta.imagen.length > 0);
  } catch (error) {
    console.error("Error buscando versiones Pokémon:", error);
    throw new Error("No se pudo consultar versiones en TCGdex");
  }
}
