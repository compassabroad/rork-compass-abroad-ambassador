import { createTRPCRouter } from "./create-context";
import { emailRouter } from "./routes/email";
import { dbSetupRouter } from "./routes/db-setup";

export const appRouter = createTRPCRouter({
  email: emailRouter,
  dbSetup: dbSetupRouter,
});

export type AppRouter = typeof appRouter;
