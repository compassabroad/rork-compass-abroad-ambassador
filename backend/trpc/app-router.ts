import { createTRPCRouter } from "./create-context";
import { emailRouter } from "./routes/email";
import { dbSetupRouter } from "./routes/db-setup";
import { authRouter } from "./routes/auth";
import { studentsRouter } from "./routes/students";
import { networkRouter } from "./routes/network";
import { profileRouter } from "./routes/profile";
import { financesRouter } from "./routes/finances";
import { chatRouter } from "./routes/chat";
import { teamRouter } from "./routes/team";
import { adminRouter } from "./routes/admin";
import { notificationsRouter } from "./routes/notifications";

console.log("[Router] Creating app router...");

export const appRouter = createTRPCRouter({
  email: emailRouter,
  dbSetup: dbSetupRouter,
  auth: authRouter,
  students: studentsRouter,
  network: networkRouter,
  profile: profileRouter,
  finances: financesRouter,
  chat: chatRouter,
  team: teamRouter,
  admin: adminRouter,
  notifications: notificationsRouter,
});

console.log("[Router] App router created successfully");

export type AppRouter = typeof appRouter;
