const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = parseInt(process.env.PORT || "8080", 10);
const DATA = "/data";
const LOG = path.join(DATA, "messages.jsonl");

function record(obj) {
  try { fs.appendFileSync(LOG, JSON.stringify(obj) + "\n"); } catch (e) {}
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://localhost");
  if (req.method === "GET" && url.pathname === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ ok: true, proto: "v1", uptime_s: process.uptime() | 0 }));
  }
  if (req.method === "GET" && url.pathname === "/schedules") {
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end("[]");
  }
  if (req.method === "POST" && url.pathname === "/chat") {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      let msg = "";
      try { msg = JSON.parse(body).message || ""; } catch (e) {}
      const t = Date.now();
      record({ t, msg });
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ reply: "echo: " + msg + " (anchorage-echo)" }));
    });
    return;
  }
  if (req.method === "GET" && url.pathname === "/messages") {
    try {
      const lines = fs.readFileSync(LOG, "utf8").trim().split("\n").filter(Boolean);
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ count: lines.length, last: lines.slice(-3) }));
    } catch (e) {
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ count: 0 }));
    }
  }
  res.writeHead(404);
  res.end("not found");
});

server.listen(PORT, "0.0.0.0", () => {
  record({ t: Date.now(), event: "boot", port: PORT });
  console.log("anchorage-echo listening on 0.0.0.0:" + PORT);
});
