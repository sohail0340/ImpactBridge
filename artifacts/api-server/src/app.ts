import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { UPLOAD_DIR } from "./routes/uploads";
import { logger } from "./lib/logger";

const app: Express = express();

// Disable ETag so API responses are never served from browser cache as 304
app.set("etag", false);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);
// Serve uploaded images under /api/uploads so the platform path proxy routes them to this artifact.
app.use(
  "/api/uploads",
  express.static(UPLOAD_DIR, {
    maxAge: "7d",
    index: false,
    // Defense-in-depth: prevent any served file from being interpreted as a
    // script and force browsers to honor the declared image MIME type.
    setHeaders: (res) => {
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader("Content-Security-Policy", "default-src 'none'; img-src 'self' data:");
    },
  }),
);

// Global error handler
app.use((err: Error & { status?: number }, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error({ err }, "Unhandled error");
  const status = err.status ?? 500;
  res.status(status).json({ error: err.message ?? "Internal server error" });
});

export default app;
