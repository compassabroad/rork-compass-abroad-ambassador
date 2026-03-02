import { createTRPCRouter } from "./create-context";
import { emailRouter } from "./routes/email";
import { dbSetupRouter } from "./routes/db-setup";
import { authRouter } from "./routes/auth";
import { dashboardRouter } from "./routes/dashboard";
import { studentsRouter } from "./routes/students";
import { withdrawalRouter } from "./routes/withdrawal";
import { networkRouter } from "./routes/network";
import { profileRouter } from "./routes/profile";
import { bankAccountsRouter } from "./routes/bankAccounts";
import { financesRouter } from "./routes/finances";
import { chatRouter } from "./routes/chat";
import { teamRouter } from "./routes/team";
import { adminRouter } from "./routes/admin";
import { programsRouter } from "./routes/programs";
import { announcementsRouter } from "./routes/announcements";
import { notificationsRouter } from "./routes/notifications";

export const appRouter = createTRPCRouter({
  email: emailRouter,
  dbSetup: dbSetupRouter,
  auth: authRouter,
  dashboard: dashboardRouter,
  students: studentsRouter,
  withdrawal: withdrawalRouter,
  network: networkRouter,
  profile: profileRouter,
  bankAccounts: bankAccountsRouter,
  finances: financesRouter,
  chat: chatRouter,
  team: teamRouter,
  admin: adminRouter,
  programs: programsRouter,
  announcements: announcementsRouter,
  notifications: notificationsRouter,
});

export type AppRouter = typeof appRouter;
