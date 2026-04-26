import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const port = Number(process.env.PINATA_PROXY_PORT ?? 8787);

const pinataJwt = process.env.PINATA_JWT ?? "";
const allowedOrigin = process.env.PINATA_PROXY_ALLOWED_ORIGIN ?? "*";
const uploadNetwork =
  (process.env.PINATA_UPLOAD_NETWORK ?? "public").toLowerCase() === "private"
    ? "private"
    : "public";

const allowedOrigins = allowedOrigin
  .split(",")
  .map((value) => value.trim())
  .filter((value) => value.length > 0);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow direct calls (no Origin header) and explicit wildcard.
      if (!origin || allowedOrigin === "*") {
        callback(null, true);
        return;
      }

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`Origen no permitido por CORS: ${origin}`));
    },
  }),
);
app.use(express.json({ limit: "2mb" }));

app.get("/", (_req, res) => {
  res.redirect(302, "https://tradeck.vercel.app");
});

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    servicio: "pinata-proxy",
  });
});

app.post("/api/pinata/pin-json", async (req, res) => {
  try {
    if (!pinataJwt || pinataJwt.trim().length === 0) {
      res.status(500).json({ error: "PINATA_JWT no esta configurado en el servidor" });
      return;
    }

    const nombre =
      typeof req.body?.nombre === "string" && req.body.nombre.trim().length > 0
        ? req.body.nombre.trim()
        : `tradeck-${Date.now()}`;

    const json = req.body?.json;

    if (!json || typeof json !== "object") {
      res.status(400).json({ error: "Debe enviarse un objeto JSON en el campo 'json'" });
      return;
    }

    const payload = JSON.stringify(json);
    const data = new FormData();
    data.append("network", uploadNetwork);
    data.append("name", `${nombre}.json`);
    data.append("file", new Blob([payload], { type: "application/json" }), `${nombre}.json`);

    const respuestaPinata = await fetch("https://uploads.pinata.cloud/v3/files", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${pinataJwt}`,
      },
      body: data,
    });

    if (!respuestaPinata.ok) {
      const detalle = await respuestaPinata.text();
      res.status(respuestaPinata.status).json({
        error: "Pinata rechazo la solicitud",
        detalle,
      });
      return;
    }

    const respuesta = await respuestaPinata.json();
    const cid = String(respuesta?.data?.cid ?? "");

    if (!cid) {
      res.status(502).json({ error: "Pinata no devolvio un CID valido" });
      return;
    }

    res.json({
      cid,
      uri: `ipfs://${cid}`,
      gatewayUrl: `https://gateway.pinata.cloud/ipfs/${cid}`,
    });
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : "Error inesperado en proxy";
    res.status(500).json({ error: mensaje });
  }
});

app.listen(port, () => {
  console.log(`[pinata-proxy] Escuchando en http://127.0.0.1:${port}`);
});
