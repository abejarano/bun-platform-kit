import { describe, expect, it } from "bun:test";
import { BunWebSocketAdapter } from "../src/adapters";

describe("BunWebSocketAdapter", () => {
  it("runs raw fetch handling before the normal Bun router", async () => {
    const port = 35_000 + Math.floor(Math.random() * 20_000);
    let receivedServer = false;
    let delegatedToRouter = false;

    const adapter = new BunWebSocketAdapter({
      beforeFetch: (request, server, next) => {
        receivedServer = server !== undefined;
        const url = new URL(request.url);
        if (url.pathname === "/socket.io/") {
          return new Response("socket-handler");
        }

        delegatedToRouter = true;
        return next();
      },
      websocket: {
        message() {},
      },
    });

    const app = adapter.createApp();
    app.set?.("hostname", "127.0.0.1");
    adapter.configure(app, port);

    const server = adapter.listen(app, port, () => undefined);

    try {
      const socketResponse = await fetch(
        `http://127.0.0.1:${port}/socket.io/?EIO=4&transport=polling`,
      );
      expect(socketResponse.status).toBe(200);
      expect(await socketResponse.text()).toBe("socket-handler");
      expect(receivedServer).toBe(true);

      const fallbackResponse = await fetch(
        `http://127.0.0.1:${port}/not-registered`,
      );
      expect(delegatedToRouter).toBe(true);
      expect(fallbackResponse.status).toBe(404);
    } finally {
      await new Promise<void>((resolve) => server.close(resolve));
    }
  });
});
