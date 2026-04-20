import { PINATA_PROXY_URL } from "./config";
import type { MetadataCarta } from "./types";

interface RespuestaPinata {
  cid: string;
  uri: string;
  gatewayUrl: string;
}

export function ipfsAHttp(uri: string): string {
  if (uri.startsWith("ipfs://")) {
    const cid = uri.replace("ipfs://", "");
    return `https://gateway.pinata.cloud/ipfs/${cid}`;
  }

  return uri;
}

export async function subirMetadataAIPFS(metadata: MetadataCarta): Promise<RespuestaPinata> {
  const respuesta = await fetch(`${PINATA_PROXY_URL}/api/pinata/pin-json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      nombre: metadata.name,
      json: metadata,
    }),
  });

  if (!respuesta.ok) {
    const texto = await respuesta.text();
    throw new Error(`No se pudo subir metadata a IPFS: ${texto}`);
  }

  return (await respuesta.json()) as RespuestaPinata;
}

export async function leerMetadataDesdeTokenUri(tokenUri: string): Promise<MetadataCarta | null> {
  const url = ipfsAHttp(tokenUri);

  const respuesta = await fetch(url);
  if (!respuesta.ok) {
    return null;
  }

  const data = await respuesta.json();

  return {
    name: String(data.name ?? "Sin nombre"),
    image: String(data.image ?? ""),
    serialNumber: String(data.serialNumber ?? data.serial ?? "SIN-SERIE"),
    description: typeof data.description === "string" ? data.description : undefined,
    attributes: Array.isArray(data.attributes)
      ? data.attributes
          .filter((x: any) => x && typeof x.trait_type === "string")
          .map((x: any) => ({
            trait_type: String(x.trait_type),
            value: String(x.value ?? ""),
          }))
      : undefined,
  };
}
