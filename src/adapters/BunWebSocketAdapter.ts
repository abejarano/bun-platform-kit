import type { ServerApp, ServerInstance } from "../abstract/ServerTypes";
import { BunAdapter } from "./BunAdapter";

declare const Bun: any;

type BunFetchHandler = (
  request: Request,
  server?: unknown,
) => Response | Promise<Response>;

export type BunBeforeFetchHandler = (
  request: Request,
  server: unknown,
  next: () => Promise<Response>,
) => Response | undefined | Promise<Response | undefined>;

export type BunWebSocketAdapterOptions = {
  beforeFetch: BunBeforeFetchHandler;
  websocket: unknown;
};

export class BunWebSocketAdapter extends BunAdapter {
  constructor(private readonly options: BunWebSocketAdapterOptions) {
    super();
  }

  override listen(
    app: ServerApp,
    port: number,
    onListen: () => void,
  ): ServerInstance {
    const bunApp = app as ServerApp & {
      get?(key: string): unknown;
      createFetchHandler?: () => BunFetchHandler;
    };

    if (typeof bunApp.createFetchHandler !== "function") {
      throw new Error(
        "BunWebSocketAdapter requires the Bun runtime application",
      );
    }

    const appFetch = bunApp.createFetchHandler();
    const hostname = bunApp.get?.("hostname") as string | undefined;
    const server = Bun.serve({
      port,
      hostname,
      fetch: (request: Request, bunServer: unknown) =>
        this.options.beforeFetch(request, bunServer, () =>
          Promise.resolve(appFetch(request, bunServer)),
        ),
      websocket: this.options.websocket,
    });

    onListen();

    return {
      close: (callback?: () => void) => {
        server.stop(true);
        callback?.();
      },
    };
  }
}
