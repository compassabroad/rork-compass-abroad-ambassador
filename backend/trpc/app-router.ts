import { createTRPCRouter } from "./create-context";
import { emailRouter } from "./routes/email";
import { dbSetupRouter } from "./routes/db-setup";
import { authRouter } from "./routes/auth";

export const appRouter = createTRPCRouter({
  email: emailRouter,
  dbSetup: dbSetupRouter,
  auth: authRouter,
});

export type AppRouter = typeof appRouter;
