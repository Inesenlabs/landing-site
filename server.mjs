import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { dirname, extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const publicDir = join(__dirname, "public");
const port = Number(process.env.PORT || 3000);

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webp": "image/webp"
};

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Cache-Control": "no-store",
    "Content-Type": "application/json; charset=utf-8"
  });
  response.end(JSON.stringify(payload));
}

function sendText(response, statusCode, body, contentType = "text/plain; charset=utf-8") {
  response.writeHead(statusCode, {
    "Cache-Control": "no-store",
    "Content-Type": contentType
  });
  response.end(body);
}

function resolvePath(urlPath) {
  const sanitized = urlPath.split("?")[0];
  const pathname = sanitized === "/" ? "/index.html" : sanitized;
  const absolutePath = normalize(join(publicDir, pathname));

  if (!absolutePath.startsWith(publicDir)) {
    return null;
  }

  return absolutePath;
}

async function serveStaticFile(response, filePath) {
  if (!existsSync(filePath) || !statSync(filePath).isFile()) {
    sendText(response, 404, "Not Found");
    return;
  }

  const extension = extname(filePath).toLowerCase();
  const contentType = mimeTypes[extension] || "application/octet-stream";
  const cacheControl =
    extension === ".html"
      ? "no-store"
      : "public, max-age=604800, stale-while-revalidate=86400";

  response.writeHead(200, {
    "Cache-Control": cacheControl,
    "Content-Type": contentType
  });

  createReadStream(filePath).pipe(response);
}

const server = createServer(async (request, response) => {
  if (!request.url) {
    sendText(response, 400, "Bad Request");
    return;
  }

  if (request.url === "/health") {
    sendJson(response, 200, {
      ok: true,
      service: "landing-site",
      timestamp: new Date().toISOString()
    });
    return;
  }

  if (request.url === "/config.js") {
    const config = {
      apiBaseUrl: process.env.PUBLIC_API_BASE_URL || "",
      appEnv: process.env.APP_ENV || "development"
    };

    sendText(
      response,
      200,
      `window.__LANDING_CONFIG__ = Object.freeze(${JSON.stringify(config)});`,
      "application/javascript; charset=utf-8"
    );
    return;
  }

  const filePath = resolvePath(request.url);

  if (!filePath) {
    sendText(response, 403, "Forbidden");
    return;
  }

  try {
    await serveStaticFile(response, filePath);
  } catch (error) {
    sendJson(response, 500, {
      ok: false,
      error: "internal_server_error"
    });
  }
});

server.listen(port, "0.0.0.0", () => {
  console.log(
    JSON.stringify({
      event: "landing-site-started",
      port,
      hasIndex: existsSync(join(publicDir, "index.html"))
    })
  );
});
