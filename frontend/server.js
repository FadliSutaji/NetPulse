const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;
const HTML_PATH = path.join(__dirname, "demo-prototype.html");

const server = http.createServer((req, res) => {
  fs.readFile(HTML_PATH, "utf8", (err, content) => {
    if (err) {
      res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Gagal membaca demo-prototype.html: " + err.message);
      return;
    }
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(content);
  });
});

server.listen(PORT, () => {
  console.log("====================================================");
  console.log("  NetPulse Web Dashboard Aktif!");
  console.log("  Buka di Browser: http://localhost:" + PORT);
  console.log("  Login Default  : admin / admin123");
  console.log("====================================================");
});
