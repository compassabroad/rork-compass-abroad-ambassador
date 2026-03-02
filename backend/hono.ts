import { trpcServer } from "@hono/trpc-server";
import { Hono } from "hono";
import { cors } from "hono/cors";

import { appRouter } from "./trpc/app-router";
import { createContext } from "./trpc/create-context";

console.log("[Backend] Starting Compass Abroad API v2...");

const app = new Hono();

app.use("*", cors());

app.use(
  "/trpc/*",
  trpcServer({
    endpoint: "/trpc",
    router: appRouter,
    createContext,
  }),
);

app.post("/setup", async (c) => {
  const { dbQueryMultiple } = await import("../lib/db");
  try {
    const res = await dbQueryMultiple("INFO FOR DB;");
    return c.json({ success: true });
  } catch (e) {
    return c.json({ success: false, error: String(e) });
  }
});

app.get("/", (c) => {
  return c.json({ status: "ok", message: "Compass Abroad API is running" });
});

export default app;
