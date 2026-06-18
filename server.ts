import { createServer } from "http";
import next from "next";

const port = parseInt(process.env.PORT || "3000", 10);
const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => {
    handle(req, res);
  })
    .on("upgrade", (req, stream, head) => {
      console.log("[websocket] found");
      stream.write(
        "HTTP/1.1 101 Web Socket Protocol Handshake\r\n" +
          "Upgrade: WebSocket\r\n" +
          "Connection: Upgrade\r\n" +
          "\r\n",
      );
      stream.write("ping");
      stream.pipe(stream);
      console.log("[websocket] handled");
    })
    .listen(port);

  console.log(`Server listening at http://localhost:${port}`);
});
