import * as z from "zod";
import { createTRPCRouter, publicProcedure } from "../create-context";
import { dbQuery } from "@/lib/db";

function decodeToken(token: string): { id: string; email: string; role: string; exp: number } | null {
  try {
    const decoded = JSON.parse(Buffer.from(token, "base64").toString("utf-8"));
    if (!decoded.id || !decoded.email || !decoded.role || !decoded.exp) {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}

function escapeSQL(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

function validateToken(token: string): { id: string; email: string; role: string } {
  const decoded = decodeToken(token);
  if (!decoded) {
    throw new Error("Geçersiz oturum bilgisi");
  }
  if (decoded.exp < Date.now()) {
    throw new Error("Oturum süresi dolmuş");
  }
  return decoded;
}

interface AmbassadorRecord {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  type: string;
  compass_points: number;
  parent_id: string | null;
  referral_code: string;
  account_status: string;
  network_commission_rate: number;
  city: string | null;
  created_at: string;
}

interface CommissionRecord {
  id: string;
  ambassador_id: string;
  amount_usd: number;
  status: string;
}

interface StudentCountRecord {
  count: number;
}

interface TreeNode {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  type: string;
  compassPoints: number;
  studentsReferred: number;
  totalEarningsUSD: number;
  referralCode: string;
  city: string | null;
  children: TreeNode[];
  level: number;
}

async function getStudentCount(ambassadorId: string): Promise<number> {
  const result = await dbQuery<StudentCountRecord>(
    `SELECT count() FROM students WHERE ambassador_id = '${escapeSQL(ambassadorId)}' GROUP ALL;`
  );
  return result[0]?.count ?? 0;
}

async function getTotalEarnings(ambassadorId: string): Promise<number> {
  const commissions = await dbQuery<CommissionRecord>(
    `SELECT * FROM commissions WHERE ambassador_id = '${escapeSQL(ambassadorId)}' AND (status = 'completed' OR status = 'paid');`
  );
  let total = 0;
  for (const c of commissions) {
    total += c.amount_usd;
  }
  return total;
}

async function buildTree(parentId: string, level: number): Promise<TreeNode[]> {
  const children = await dbQuery<AmbassadorRecord>(
    `SELECT * FROM ambassadors WHERE parent_id = '${escapeSQL(parentId)}' ORDER BY created_at ASC;`
  );

  const nodes: TreeNode[] = [];

  for (const child of children) {
    const studentsReferred = await getStudentCount(child.id);
    const totalEarningsUSD = await getTotalEarnings(child.id);
    const grandChildren = await buildTree(child.id, level + 1);

    nodes.push({
      id: child.id,
      name: `${child.first_name} ${child.last_name}`,
      firstName: child.first_name,
      lastName: child.last_name,
      type: child.type,
      compassPoints: child.compass_points,
      studentsReferred,
      totalEarningsUSD,
      referralCode: child.referral_code,
      city: child.city,
      children: grandChildren,
      level,
    });
  }

  return nodes;
}

function countAllNodes(nodes: TreeNode[]): number {
  let count = nodes.length;
  for (const node of nodes) {
    count += countAllNodes(node.children);
  }
  return count;
}

function sumAllStudents(nodes: TreeNode[]): number {
  let total = 0;
  for (const node of nodes) {
    total += node.studentsReferred;
    total += sumAllStudents(node.children);
  }
  return total;
}

function sumAllEarnings(nodes: TreeNode[]): number {
  let total = 0;
  for (const node of nodes) {
    total += node.totalEarningsUSD;
    total += sumAllEarnings(node.children);
  }
  return total;
}

export const networkRouter = createTRPCRouter({
  getTree: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      console.log("[Network] getTree called");
      const { id } = validateToken(input.token);

      const ambassadorResult = await dbQuery<AmbassadorRecord>(
        `SELECT * FROM ambassadors WHERE id = '${escapeSQL(id)}' LIMIT 1;`
      );

      if (ambassadorResult.length === 0) {
        throw new Error("Elçi bulunamadı");
      }

      const amb = ambassadorResult[0];
      const studentsReferred = await getStudentCount(id);
      const totalEarningsUSD = await getTotalEarnings(id);
      const children = await buildTree(id, 1);

      const rootNode: TreeNode = {
        id: amb.id,
        name: `${amb.first_name} ${amb.last_name}`,
        firstName: amb.first_name,
        lastName: amb.last_name,
        type: amb.type,
        compassPoints: amb.compass_points,
        studentsReferred,
        totalEarningsUSD,
        referralCode: amb.referral_code,
        city: amb.city,
        children,
        level: 0,
      };

      console.log("[Network] Tree built with", countAllNodes(children), "sub-ambassadors");
      return rootNode;
    }),

  getStats: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      console.log("[Network] getStats called");
      const { id } = validateToken(input.token);

      const myStudents = await getStudentCount(id);
      const myEarnings = await getTotalEarnings(id);
      const children = await buildTree(id, 1);

      const totalAmbassadors = 1 + countAllNodes(children);
      const totalStudents = myStudents + sumAllStudents(children);
      const totalEarningsUSD = myEarnings + sumAllEarnings(children);

      console.log("[Network] Stats:", { totalAmbassadors, totalStudents, totalEarningsUSD });
      return { totalAmbassadors, totalStudents, totalEarningsUSD };
    }),

  getCommissionBreakdown: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      console.log("[Network] getCommissionBreakdown called");
      const { id } = validateToken(input.token);

      const ambassadorResult = await dbQuery<AmbassadorRecord>(
        `SELECT * FROM ambassadors WHERE id = '${escapeSQL(id)}' LIMIT 1;`
      );
      const networkRate = ambassadorResult[0]?.network_commission_rate ?? 10;

      const directSubs = await dbQuery<AmbassadorRecord>(
        `SELECT * FROM ambassadors WHERE parent_id = '${escapeSQL(id)}' ORDER BY created_at ASC;`
      );

      const breakdown: {
        ambassadorId: string;
        name: string;
        type: string;
        theirEarningsUSD: number;
        yourCommissionUSD: number;
      }[] = [];

      for (const sub of directSubs) {
        const theirEarningsUSD = await getTotalEarnings(sub.id);
        const yourCommissionUSD = Math.floor(theirEarningsUSD * networkRate / 100);

        breakdown.push({
          ambassadorId: sub.id,
          name: `${sub.first_name} ${sub.last_name}`,
          type: sub.type,
          theirEarningsUSD,
          yourCommissionUSD,
        });
      }

      const totalNetworkCommission = breakdown.reduce((sum, b) => sum + b.yourCommissionUSD, 0);

      console.log("[Network] Commission breakdown:", breakdown.length, "subs, total:", totalNetworkCommission);
      return { networkRate, breakdown, totalNetworkCommission };
    }),
});
