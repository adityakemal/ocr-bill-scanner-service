import { Elysia, t } from "elysia";
import { cors } from "@elysiajs/cors";
import { processWithMindee, processMindeeFromUrl } from "./services/mindee";
import { processWithTesseract } from "./services/tesseract";

const app = new Elysia()
  .use(cors())
  .get("/", () => ({
    message: "OCR Service API",
    version: "1.0.0",
    providers: {
      mindee: "Mindee AI OCR",
      tesseract: "Tesseract OCR (manual)",
    },
    endpoints: {
      health: "GET /health",
      mindee: {
        file: "POST /ocr/mindee/file",
        base64: "POST /ocr/mindee/base64",
        url: "POST /ocr/mindee/url",
      },
      tesseract: {
        file: "POST /ocr/tesseract/file",
        base64: "POST /ocr/tesseract/base64",
      },
    },
  }))
  .get("/health", () => ({
    status: "ok",
    timestamp: new Date().toISOString(),
  }));

// ============ Mindee OCR Routes ============

const mindeeFileSchema = { body: t.Any() };

app.post(
  "/ocr/mindee/file",
  async ({ request }) => {
    try {
      const form = await request.formData();
      const file = form.get("file") as File;

      if (!file) {
        return Response.json({ error: "No file provided" }, { status: 400 });
      }

      const buffer = await file.arrayBuffer();
      const result = await processWithMindee(
        file.name || "upload",
        new Uint8Array(buffer),
      );

      return Response.json(result);
    } catch (error) {
      console.error("Mindee file error:", error);
      return Response.json({ error: String(error) }, { status: 500 });
    }
  },
  { schema: mindeeFileSchema },
);

const mindeeBase64Schema = {
  body: t.Object({
    image: t.String(),
    filename: t.Optional(t.String()),
  }),
};

app.post(
  "/ocr/mindee/base64",
  async ({ request }) => {
    try {
      const body = await request.json();
      const { image, filename } = body as { image: string; filename?: string };

      if (!image) {
        return Response.json({ error: "No image provided" }, { status: 400 });
      }

      const buffer = Buffer.from(image, "base64");
      const result = await processWithMindee(
        filename || "upload",
        new Uint8Array(buffer),
      );

      return Response.json(result);
    } catch (error) {
      console.error("Mindee base64 error:", error);
      return Response.json({ error: String(error) }, { status: 500 });
    }
  },
  { schema: mindeeBase64Schema },
);

const mindeeUrlSchema = {
  body: t.Object({
    url: t.String(),
  }),
};

app.post(
  "/ocr/mindee/url",
  async ({ request }) => {
    try {
      const body = await request.json();
      const { url } = body as { url: string };

      if (!url) {
        return Response.json({ error: "No url provided" }, { status: 400 });
      }

      const result = await processMindeeFromUrl(url);
      return Response.json(result);
    } catch (error) {
      console.error("Mindee url error:", error);
      return Response.json({ error: String(error) }, { status: 500 });
    }
  },
  { schema: mindeeUrlSchema },
);

// ============ Tesseract OCR Routes ============

const tesseractFileSchema = { body: t.Any() };

app.post(
  "/ocr/tesseract/file",
  async ({ request }) => {
    try {
      const form = await request.formData();
      const file = form.get("file") as File;

      if (!file) {
        return Response.json({ error: "No file provided" }, { status: 400 });
      }

      const buffer = await file.arrayBuffer();
      const result = await processWithTesseract(
        file.name || "upload",
        new Uint8Array(buffer),
      );

      return Response.json(result);
    } catch (error) {
      console.error("Tesseract file error:", error);
      return Response.json({ error: String(error) }, { status: 500 });
    }
  },
  { schema: tesseractFileSchema },
);

const tesseractBase64Schema = {
  body: t.Object({
    image: t.String(),
    filename: t.Optional(t.String()),
  }),
};

app.post(
  "/ocr/tesseract/base64",
  async ({ request }) => {
    try {
      const body = await request.json();
      const { image, filename } = body as { image: string; filename?: string };

      if (!image) {
        return Response.json({ error: "No image provided" }, { status: 400 });
      }

      const buffer = Buffer.from(image, "base64");
      const result = await processWithTesseract(
        filename || "upload",
        new Uint8Array(buffer),
      );

      return Response.json(result);
    } catch (error) {
      console.error("Tesseract base64 error:", error);
      return Response.json({ error: String(error) }, { status: 500 });
    }
  },
  { schema: tesseractBase64Schema },
);

// Start server
const port = parseInt(process.env.PORT || "3000");
const hostname = process.env.HOST || "0.0.0.0";
app.listen({ port, hostname }, () =>
  console.log(`Server running on http://${hostname}:${port}`),
);

export type App = typeof app;
