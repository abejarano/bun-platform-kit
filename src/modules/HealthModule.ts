import { BaseServerModule, ServerApp, ServerContext } from "../abstract";
import type { ServerResponse } from "../abstract";
import { BunAdapter } from "../adapters";
import { hostname } from "node:os";

export class HealthModule extends BaseServerModule {
  name = "Health";
  priority = 10;

  getModuleName(): string {
    return this.name;
  }

  init(app: ServerApp, context?: ServerContext): void {
    const adapter = context?.adapter ?? new BunAdapter();
    const router = adapter.createRouter();

    router.get("/health", (_req: any, res: ServerResponse) => {
      res.json({
        status: "ok",
        hostname: hostname(),
        timestamp: new Date().toISOString(),
      });
    });

    app.use("/", router);
  }
}
