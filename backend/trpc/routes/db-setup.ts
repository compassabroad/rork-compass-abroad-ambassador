import crypto from 'crypto';
import { createTRPCRouter, publicProcedure } from "../create-context";
import { dbQueryMultiple, nowISO } from "@/lib/db";

const DEFINE_TABLES_SQL = `
DEFINE TABLE IF NOT EXISTS ambassadors SCHEMAFULL;
DEFINE FIELD IF NOT EXISTS email ON ambassadors TYPE string ASSERT string::len($value) > 0;
DEFINE FIELD IF NOT EXISTS password_hash ON ambassadors TYPE string;
DEFINE FIELD IF NOT EXISTS first_name ON ambassadors TYPE string;
DEFINE FIELD IF NOT EXISTS last_name ON ambassadors TYPE string;
DEFINE FIELD IF NOT EXISTS phone ON ambassadors TYPE string;
DEFINE FIELD IF NOT EXISTS city ON ambassadors TYPE option<string>;
DEFINE FIELD IF NOT EXISTS type ON ambassadors TYPE string DEFAULT 'bronze';
DEFINE FIELD IF NOT EXISTS category ON ambassadors TYPE string DEFAULT 'individual';
DEFINE FIELD IF NOT EXISTS sub_type ON ambassadors TYPE string DEFAULT 'other';
DEFINE FIELD IF NOT EXISTS company_name ON ambassadors TYPE option<string>;
DEFINE FIELD IF NOT EXISTS tax_number ON ambassadors TYPE option<string>;
DEFINE FIELD IF NOT EXISTS tax_office ON ambassadors TYPE option<string>;
DEFINE FIELD IF NOT EXISTS parent_id ON ambassadors TYPE option<string>;
DEFINE FIELD IF NOT EXISTS referral_code ON ambassadors TYPE string;
DEFINE FIELD IF NOT EXISTS account_status ON ambassadors TYPE string DEFAULT 'pending_approval';
DEFINE FIELD IF NOT EXISTS role ON ambassadors TYPE string DEFAULT 'ambassador';
DEFINE FIELD IF NOT EXISTS compass_points ON ambassadors TYPE number DEFAULT 0;
DEFINE FIELD IF NOT EXISTS network_commission_rate ON ambassadors TYPE number DEFAULT 10;
DEFINE FIELD IF NOT EXISTS kvkk_consent ON ambassadors TYPE bool DEFAULT false;
DEFINE FIELD IF NOT EXISTS kvkk_consent_date ON ambassadors TYPE option<string>;
DEFINE FIELD IF NOT EXISTS privacy_policy_consent ON ambassadors TYPE bool DEFAULT false;
DEFINE FIELD IF NOT EXISTS terms_consent ON ambassadors TYPE bool DEFAULT false;
DEFINE FIELD IF NOT EXISTS profile_photo ON ambassadors TYPE option<string>;
DEFINE FIELD IF NOT EXISTS pending_first_name ON ambassadors TYPE option<string>;
DEFINE FIELD IF NOT EXISTS pending_last_name ON ambassadors TYPE option<string>;
DEFINE FIELD IF NOT EXISTS name_change_request_date ON ambassadors TYPE option<string>;
DEFINE FIELD IF NOT EXISTS birth_date ON ambassadors TYPE option<string>;
DEFINE FIELD IF NOT EXISTS tc_identity ON ambassadors TYPE option<string>;
DEFINE FIELD IF NOT EXISTS reset_code ON ambassadors TYPE option<string>;
DEFINE FIELD IF NOT EXISTS reset_code_expires ON ambassadors TYPE option<string>;
DEFINE FIELD IF NOT EXISTS created_at ON ambassadors TYPE string DEFAULT time::now();
DEFINE FIELD IF NOT EXISTS updated_at ON ambassadors TYPE string DEFAULT time::now();
DEFINE INDEX IF NOT EXISTS idx_ambassadors_email ON ambassadors COLUMNS email UNIQUE;
DEFINE INDEX IF NOT EXISTS idx_ambassadors_referral_code ON ambassadors COLUMNS referral_code UNIQUE;

DEFINE TABLE IF NOT EXISTS students SCHEMAFULL;
DEFINE FIELD IF NOT EXISTS name ON students TYPE string;
DEFINE FIELD IF NOT EXISTS email ON students TYPE string;
DEFINE FIELD IF NOT EXISTS phone ON students TYPE string;
DEFINE FIELD IF NOT EXISTS program ON students TYPE string;
DEFINE FIELD IF NOT EXISTS stage ON students TYPE string DEFAULT 'pre_payment';
DEFINE FIELD IF NOT EXISTS country ON students TYPE option<string>;
DEFINE FIELD IF NOT EXISTS ambassador_id ON students TYPE string;
DEFINE FIELD IF NOT EXISTS invitation_status ON students TYPE option<string>;
DEFINE FIELD IF NOT EXISTS invitation_token ON students TYPE option<string>;
DEFINE FIELD IF NOT EXISTS invited_at ON students TYPE option<string>;
DEFINE FIELD IF NOT EXISTS notes ON students TYPE option<string>;
DEFINE FIELD IF NOT EXISTS created_at ON students TYPE string DEFAULT time::now();
DEFINE FIELD IF NOT EXISTS updated_at ON students TYPE string DEFAULT time::now();
DEFINE INDEX IF NOT EXISTS idx_students_invitation_token ON students COLUMNS invitation_token UNIQUE;

DEFINE TABLE IF NOT EXISTS student_pipeline_history SCHEMAFULL;
DEFINE FIELD IF NOT EXISTS student_id ON student_pipeline_history TYPE string;
DEFINE FIELD IF NOT EXISTS stage ON student_pipeline_history TYPE string;
DEFINE FIELD IF NOT EXISTS date ON student_pipeline_history TYPE string;
DEFINE FIELD IF NOT EXISTS changed_by ON student_pipeline_history TYPE option<string>;
DEFINE FIELD IF NOT EXISTS created_at ON student_pipeline_history TYPE string DEFAULT time::now();

DEFINE TABLE IF NOT EXISTS bank_accounts SCHEMAFULL;
DEFINE FIELD IF NOT EXISTS ambassador_id ON bank_accounts TYPE string;
DEFINE FIELD IF NOT EXISTS iban ON bank_accounts TYPE string;
DEFINE FIELD IF NOT EXISTS bank_name ON bank_accounts TYPE string;
DEFINE FIELD IF NOT EXISTS is_default ON bank_accounts TYPE bool DEFAULT false;
DEFINE FIELD IF NOT EXISTS status ON bank_accounts TYPE string DEFAULT 'pending';
DEFINE FIELD IF NOT EXISTS submitted_at ON bank_accounts TYPE string DEFAULT time::now();
DEFINE FIELD IF NOT EXISTS approved_at ON bank_accounts TYPE option<string>;

DEFINE TABLE IF NOT EXISTS commissions SCHEMAFULL;
DEFINE FIELD IF NOT EXISTS ambassador_id ON commissions TYPE string;
DEFINE FIELD IF NOT EXISTS student_id ON commissions TYPE string;
DEFINE FIELD IF NOT EXISTS program ON commissions TYPE string;
DEFINE FIELD IF NOT EXISTS amount_usd ON commissions TYPE number;
DEFINE FIELD IF NOT EXISTS stage ON commissions TYPE string;
DEFINE FIELD IF NOT EXISTS status ON commissions TYPE string DEFAULT 'pending';
DEFINE FIELD IF NOT EXISTS created_at ON commissions TYPE string DEFAULT time::now();

DEFINE TABLE IF NOT EXISTS transactions SCHEMAFULL;
DEFINE FIELD IF NOT EXISTS ambassador_id ON transactions TYPE string;
DEFINE FIELD IF NOT EXISTS type ON transactions TYPE string;
DEFINE FIELD IF NOT EXISTS amount_usd ON transactions TYPE number;
DEFINE FIELD IF NOT EXISTS amount_try ON transactions TYPE number;
DEFINE FIELD IF NOT EXISTS description ON transactions TYPE string;
DEFINE FIELD IF NOT EXISTS student_id ON transactions TYPE option<string>;
DEFINE FIELD IF NOT EXISTS student_name ON transactions TYPE option<string>;
DEFINE FIELD IF NOT EXISTS status ON transactions TYPE string DEFAULT 'pending';
DEFINE FIELD IF NOT EXISTS created_at ON transactions TYPE string DEFAULT time::now();

DEFINE TABLE IF NOT EXISTS programs SCHEMAFULL;
DEFINE FIELD IF NOT EXISTS name ON programs TYPE string;
DEFINE FIELD IF NOT EXISTS name_en ON programs TYPE string;
DEFINE FIELD IF NOT EXISTS description ON programs TYPE string;
DEFINE FIELD IF NOT EXISTS default_commission_usd ON programs TYPE number;
DEFINE FIELD IF NOT EXISTS points ON programs TYPE number;
DEFINE FIELD IF NOT EXISTS icon ON programs TYPE string;
DEFINE FIELD IF NOT EXISTS countries ON programs TYPE string;
DEFINE FIELD IF NOT EXISTS duration ON programs TYPE string;

DEFINE TABLE IF NOT EXISTS ambassador_commissions SCHEMAFULL;
DEFINE FIELD IF NOT EXISTS ambassador_id ON ambassador_commissions TYPE string;
DEFINE FIELD IF NOT EXISTS program_id ON ambassador_commissions TYPE string;
DEFINE FIELD IF NOT EXISTS custom_commission_usd ON ambassador_commissions TYPE option<number>;
DEFINE FIELD IF NOT EXISTS use_custom ON ambassador_commissions TYPE bool DEFAULT false;

DEFINE TABLE IF NOT EXISTS conversations SCHEMAFULL;
DEFINE FIELD IF NOT EXISTS participant_name ON conversations TYPE string;
DEFINE FIELD IF NOT EXISTS participant_role ON conversations TYPE string;
DEFINE FIELD IF NOT EXISTS last_message ON conversations TYPE string;
DEFINE FIELD IF NOT EXISTS last_message_time ON conversations TYPE string;
DEFINE FIELD IF NOT EXISTS unread_count ON conversations TYPE number DEFAULT 0;
DEFINE FIELD IF NOT EXISTS created_at ON conversations TYPE string DEFAULT time::now();

DEFINE TABLE IF NOT EXISTS messages SCHEMAFULL;
DEFINE FIELD IF NOT EXISTS conversation_id ON messages TYPE string;
DEFINE FIELD IF NOT EXISTS sender_id ON messages TYPE string;
DEFINE FIELD IF NOT EXISTS text ON messages TYPE string;
DEFINE FIELD IF NOT EXISTS read ON messages TYPE bool DEFAULT false;
DEFINE FIELD IF NOT EXISTS created_at ON messages TYPE string DEFAULT time::now();

DEFINE TABLE IF NOT EXISTS notifications SCHEMAFULL;
DEFINE FIELD IF NOT EXISTS ambassador_id ON notifications TYPE string;
DEFINE FIELD IF NOT EXISTS type ON notifications TYPE string;
DEFINE FIELD IF NOT EXISTS title ON notifications TYPE string;
DEFINE FIELD IF NOT EXISTS message ON notifications TYPE string;
DEFINE FIELD IF NOT EXISTS read ON notifications TYPE bool DEFAULT false;
DEFINE FIELD IF NOT EXISTS student_id ON notifications TYPE option<string>;
DEFINE FIELD IF NOT EXISTS created_at ON notifications TYPE string DEFAULT time::now();

DEFINE TABLE IF NOT EXISTS announcements SCHEMAFULL;
DEFINE FIELD IF NOT EXISTS title ON announcements TYPE string;
DEFINE FIELD IF NOT EXISTS preview ON announcements TYPE string;
DEFINE FIELD IF NOT EXISTS content ON announcements TYPE string;
DEFINE FIELD IF NOT EXISTS image_url ON announcements TYPE option<string>;
DEFINE FIELD IF NOT EXISTS created_at ON announcements TYPE string DEFAULT time::now();

DEFINE TABLE IF NOT EXISTS name_change_requests SCHEMAFULL;
DEFINE FIELD IF NOT EXISTS ambassador_id ON name_change_requests TYPE string;
DEFINE FIELD IF NOT EXISTS current_first_name ON name_change_requests TYPE string;
DEFINE FIELD IF NOT EXISTS current_last_name ON name_change_requests TYPE string;
DEFINE FIELD IF NOT EXISTS requested_first_name ON name_change_requests TYPE string;
DEFINE FIELD IF NOT EXISTS requested_last_name ON name_change_requests TYPE string;
DEFINE FIELD IF NOT EXISTS status ON name_change_requests TYPE string DEFAULT 'pending';
DEFINE FIELD IF NOT EXISTS created_at ON name_change_requests TYPE string DEFAULT time::now();

DEFINE TABLE IF NOT EXISTS withdrawal_requests SCHEMAFULL;
DEFINE FIELD IF NOT EXISTS ambassador_id ON withdrawal_requests TYPE string;
DEFINE FIELD IF NOT EXISTS bank_account_id ON withdrawal_requests TYPE string;
DEFINE FIELD IF NOT EXISTS amount_usd ON withdrawal_requests TYPE number;
DEFINE FIELD IF NOT EXISTS amount_try ON withdrawal_requests TYPE number;
DEFINE FIELD IF NOT EXISTS exchange_rate ON withdrawal_requests TYPE number;
DEFINE FIELD IF NOT EXISTS status ON withdrawal_requests TYPE string DEFAULT 'pending';
DEFINE FIELD IF NOT EXISTS created_at ON withdrawal_requests TYPE string DEFAULT time::now();
DEFINE FIELD IF NOT EXISTS processed_at ON withdrawal_requests TYPE option<string>;
`;

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + 'compass-salt-2024').digest('hex');
}

export { hashPassword };

const SEED_PROGRAMS_SQL = `
DELETE FROM programs;

CREATE programs:language_education SET
  name = 'Dil Eğitimi',
  name_en = 'Language Education',
  description = 'Yoğun dil eğitimi programları',
  default_commission_usd = 200,
  points = 80,
  icon = 'languages',
  countries = '["USA","UK","Malta","Ireland"]',
  duration = '2-24 hafta';

CREATE programs:bachelor SET
  name = 'Lisans',
  name_en = 'Bachelor',
  description = 'Lisans eğitimi programları',
  default_commission_usd = 800,
  points = 300,
  icon = 'graduation-cap',
  countries = '["USA","UK","Canada","Germany"]',
  duration = '4 yıl';

CREATE programs:high_school SET
  name = 'Lise Eğitimi',
  name_en = 'High School',
  description = 'Yurtdışı lise eğitimi',
  default_commission_usd = 600,
  points = 250,
  icon = 'school',
  countries = '["USA","UK","Canada"]',
  duration = '1 yıl';

CREATE programs:internship SET
  name = 'Staj',
  name_en = 'Internship',
  description = 'Uluslararası staj programları',
  default_commission_usd = 400,
  points = 160,
  icon = 'building',
  countries = '["USA","UK","Germany"]',
  duration = '3-12 ay';

CREATE programs:work_and_study SET
  name = 'Work and Study',
  name_en = 'Work and Study',
  description = 'Çalışma ve eğitim programı',
  default_commission_usd = 300,
  points = 120,
  icon = 'briefcase',
  countries = '["USA","Canada","Australia"]',
  duration = '6-12 ay';

CREATE programs:visa_consulting SET
  name = 'Vize Danışmanlığı',
  name_en = 'Visa Consulting',
  description = 'Vize başvuru danışmanlık hizmetleri',
  default_commission_usd = 150,
  points = 60,
  icon = 'file-text',
  countries = '["USA","UK","Canada","Schengen"]',
  duration = '1-3 ay';

CREATE programs:group_summer_school SET
  name = 'Grup Yaz Okulu',
  name_en = 'Group Summer School',
  description = 'Gruplar için yaz okulu programları',
  default_commission_usd = 250,
  points = 100,
  icon = 'users',
  countries = '["USA","UK","Malta"]',
  duration = '2-8 hafta';

CREATE programs:individual_summer_school SET
  name = 'Bireysel Yaz Okulu',
  name_en = 'Individual Summer School',
  description = 'Bireysel yaz okulu programları',
  default_commission_usd = 300,
  points = 120,
  icon = 'sun',
  countries = '["USA","UK","Malta"]',
  duration = '2-8 hafta';

CREATE programs:paid_teaching SET
  name = 'Maaşlı Öğretmenlik',
  name_en = 'Paid Teaching',
  description = 'Yurtdışında maaşlı öğretmenlik fırsatları',
  default_commission_usd = 350,
  points = 140,
  icon = 'book-open',
  countries = '["USA","UK","UAE","China"]',
  duration = '1-2 yıl';

CREATE programs:camp_usa SET
  name = 'Camp USA',
  name_en = 'Camp USA',
  description = 'Amerika\\'da yaz kampı danışmanlığı programı',
  default_commission_usd = 250,
  points = 100,
  icon = 'tent',
  countries = '["USA"]',
  duration = '3-4 ay';

CREATE programs:canada_online_highschool SET
  name = 'Kanada Online Lise',
  name_en = 'Canada Online High School',
  description = 'Kanada akrediteli online lise eğitimi',
  default_commission_usd = 450,
  points = 180,
  icon = 'laptop',
  countries = '["Canada"]',
  duration = '1-4 yıl';

CREATE programs:canada_language SET
  name = 'Kanada Dil Eğitimi',
  name_en = 'Canada Language Education',
  description = 'Kanada\\'da dil eğitimi programları',
  default_commission_usd = 200,
  points = 80,
  icon = 'maple-leaf',
  countries = '["Canada"]',
  duration = '2-24 hafta';

CREATE programs:masters SET
  name = 'Yüksek Lisans',
  name_en = 'Masters',
  description = 'Yüksek lisans programları',
  default_commission_usd = 1000,
  points = 400,
  icon = 'award',
  countries = '["USA","UK","Canada","Germany","Netherlands"]',
  duration = '1-2 yıl';
`;

function getSeedAmbassadorsSQL(): string {
  const now = nowISO();
  const adminHash = hashPassword("CompAdmin2024!");
  const testHash = hashPassword("Test1234!");

  return `
DELETE FROM ambassadors;

CREATE ambassadors:admin1 SET
  email = 'admin@compassabroad.com',
  password_hash = '${adminHash}',
  first_name = 'Admin',
  last_name = 'Compass',
  phone = '+90 212 555 0000',
  city = 'Istanbul',
  type = 'diamond',
  category = 'individual',
  sub_type = 'other',
  company_name = NONE,
  tax_number = NONE,
  tax_office = NONE,
  parent_id = NONE,
  referral_code = 'CA-ADMIN1',
  account_status = 'active',
  role = 'admin',
  compass_points = 0,
  network_commission_rate = 10,
  kvkk_consent = true,
  kvkk_consent_date = '${now}',
  privacy_policy_consent = true,
  terms_consent = true,
  profile_photo = NONE,
  pending_first_name = NONE,
  pending_last_name = NONE,
  name_change_request_date = NONE,
  birth_date = NONE,
  tc_identity = NONE,
  created_at = '${now}',
  updated_at = '${now}';

CREATE ambassadors:test1 SET
  email = 'test@compassabroad.com',
  password_hash = '${testHash}',
  first_name = 'Deniz',
  last_name = 'Aydin',
  phone = '+90 532 987 6543',
  city = 'Istanbul',
  type = 'gold',
  category = 'individual',
  sub_type = 'other',
  company_name = NONE,
  tax_number = NONE,
  tax_office = NONE,
  parent_id = NONE,
  referral_code = 'CA-7X9K2M',
  account_status = 'active',
  role = 'ambassador',
  compass_points = 4820,
  network_commission_rate = 10,
  kvkk_consent = true,
  kvkk_consent_date = '2023-06-15T00:00:00Z',
  privacy_policy_consent = true,
  terms_consent = true,
  profile_photo = NONE,
  pending_first_name = NONE,
  pending_last_name = NONE,
  name_change_request_date = NONE,
  birth_date = '1990-05-15',
  tc_identity = '12345678901',
  created_at = '2023-06-15T00:00:00Z',
  updated_at = '${now}';
`;
}

export const dbSetupRouter = createTRPCRouter({
  initializeTables: publicProcedure.mutation(async () => {
    console.log("[DB Setup] Starting table definitions...");
    try {
      const results = await dbQueryMultiple(DEFINE_TABLES_SQL);
      const errors = results.filter((r) => r.status !== "OK");
      if (errors.length > 0) {
        console.error("[DB Setup] Some table definitions failed:", JSON.stringify(errors));
        return {
          success: false,
          message: `Table creation had ${errors.length} errors`,
          totalStatements: results.length,
          errors: errors.map((e) => JSON.stringify(e)),
        };
      }
      console.log("[DB Setup] All tables defined successfully:", results.length, "statements");
      return {
        success: true,
        message: `Successfully executed ${results.length} statements`,
        totalStatements: results.length,
        errors: [] as string[],
      };
    } catch (error) {
      console.error("[DB Setup] Failed to initialize tables:", error);
      throw new Error(`Failed to initialize tables: ${error instanceof Error ? error.message : String(error)}`);
    }
  }),

  seedPrograms: publicProcedure.mutation(async () => {
    console.log("[DB Setup] Seeding programs...");
    try {
      const results = await dbQueryMultiple(SEED_PROGRAMS_SQL);
      const errors = results.filter((r) => r.status !== "OK");
      if (errors.length > 0) {
        console.error("[DB Setup] Program seeding errors:", JSON.stringify(errors));
      }
      console.log("[DB Setup] Programs seeded:", results.length, "statements");
      return {
        success: errors.length === 0,
        message: `Seeded programs: ${results.length} statements, ${errors.length} errors`,
        errors: errors.map((e) => JSON.stringify(e)),
      };
    } catch (error) {
      console.error("[DB Setup] Failed to seed programs:", error);
      throw new Error(`Failed to seed programs: ${error instanceof Error ? error.message : String(error)}`);
    }
  }),

  seedAmbassadors: publicProcedure.mutation(async () => {
    console.log("[DB Setup] Seeding ambassadors...");
    try {
      const sql = getSeedAmbassadorsSQL();
      const results = await dbQueryMultiple(sql);
      const errors = results.filter((r) => r.status !== "OK");
      if (errors.length > 0) {
        console.error("[DB Setup] Ambassador seeding errors:", JSON.stringify(errors));
      }
      console.log("[DB Setup] Ambassadors seeded:", results.length, "statements");
      return {
        success: errors.length === 0,
        message: `Seeded ambassadors: ${results.length} statements, ${errors.length} errors`,
        errors: errors.map((e) => JSON.stringify(e)),
      };
    } catch (error) {
      console.error("[DB Setup] Failed to seed ambassadors:", error);
      throw new Error(`Failed to seed ambassadors: ${error instanceof Error ? error.message : String(error)}`);
    }
  }),

  seedAll: publicProcedure.mutation(async () => {
    console.log("[DB Setup] Running full setup: tables + seed data...");
    const results: { step: string; success: boolean; message: string; errors: string[] }[] = [];

    try {
      console.log("[DB Setup] Step 1: Define tables...");
      const tableResults = await dbQueryMultiple(DEFINE_TABLES_SQL);
      const tableErrors = tableResults.filter((r) => r.status !== "OK");
      results.push({
        step: "tables",
        success: tableErrors.length === 0,
        message: `${tableResults.length} statements, ${tableErrors.length} errors`,
        errors: tableErrors.map((e) => JSON.stringify(e)),
      });
    } catch (error) {
      results.push({
        step: "tables",
        success: false,
        message: error instanceof Error ? error.message : String(error),
        errors: [],
      });
    }

    try {
      console.log("[DB Setup] Step 2: Seed programs...");
      const programResults = await dbQueryMultiple(SEED_PROGRAMS_SQL);
      const programErrors = programResults.filter((r) => r.status !== "OK");
      results.push({
        step: "programs",
        success: programErrors.length === 0,
        message: `${programResults.length} statements, ${programErrors.length} errors`,
        errors: programErrors.map((e) => JSON.stringify(e)),
      });
    } catch (error) {
      results.push({
        step: "programs",
        success: false,
        message: error instanceof Error ? error.message : String(error),
        errors: [],
      });
    }

    try {
      console.log("[DB Setup] Step 3: Seed ambassadors...");
      const ambassadorSQL = getSeedAmbassadorsSQL();
      const ambassadorResults = await dbQueryMultiple(ambassadorSQL);
      const ambassadorErrors = ambassadorResults.filter((r) => r.status !== "OK");
      results.push({
        step: "ambassadors",
        success: ambassadorErrors.length === 0,
        message: `${ambassadorResults.length} statements, ${ambassadorErrors.length} errors`,
        errors: ambassadorErrors.map((e) => JSON.stringify(e)),
      });
    } catch (error) {
      results.push({
        step: "ambassadors",
        success: false,
        message: error instanceof Error ? error.message : String(error),
        errors: [],
      });
    }

    const allSuccess = results.every((r) => r.success);
    console.log("[DB Setup] Full setup complete. All success:", allSuccess);

    return {
      success: allSuccess,
      results,
    };
  }),

  checkStatus: publicProcedure.query(async () => {
    console.log("[DB Setup] Checking database status...");
    try {
      const tables = [
        "ambassadors", "students", "student_pipeline_history", "bank_accounts",
        "commissions", "transactions", "programs", "ambassador_commissions",
        "conversations", "messages", "notifications", "announcements",
        "name_change_requests", "withdrawal_requests",
      ];

      const countQueries = tables.map((t) => `SELECT count() FROM ${t} GROUP ALL;`).join("\n");
      const results = await dbQueryMultiple(countQueries);

      const tableStatus = tables.map((table, i) => {
        const result = results[i];
        const count = result?.status === "OK" && Array.isArray(result.result) && result.result.length > 0
          ? (result.result[0] as Record<string, number>)?.count ?? 0
          : 0;
        return { table, exists: result?.status === "OK", count };
      });

      return {
        connected: true,
        tables: tableStatus,
      };
    } catch (error) {
      console.error("[DB Setup] Status check failed:", error);
      return {
        connected: false,
        tables: [] as { table: string; exists: boolean; count: number }[],
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }),
});
