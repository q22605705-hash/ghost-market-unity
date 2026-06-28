import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(process.argv[2] || ".");
const port = Number(process.argv[3] || 8091);
const host = "127.0.0.1";
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".json": "application/json; charset=utf-8"
};

function send(res, status, body, type = "text/plain; charset=utf-8") {
  res.writeHead(status, { "content-type": type, "cache-control": "no-store" });
  res.end(body);
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url || "/", `http://${host}:${port}`);
  const pathname = decodeURIComponent(url.pathname);
  const rel = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
  const file = path.resolve(root, rel);
  if (!file.startsWith(root)) return send(res, 403, "Forbidden");
  fs.readFile(file, (err, data) => {
    if (err) return send(res, 404, "Not found");
    send(res, 200, data, types[path.extname(file).toLowerCase()] || "application/octet-stream");
  });
});

server.listen(port, host, () => {
  const script = path.basename(fileURLToPath(import.meta.url));
  console.log(`${script} serving ${root} at http://${host}:${port}/`);
});
