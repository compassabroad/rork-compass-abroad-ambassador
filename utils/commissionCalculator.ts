import { Student, StudentStage, ProgramType } from '@/types';
import { PROGRAMS, MOCK_AMBASSADOR_COMMISSIONS } from '@/mocks/data';

export interface CommissionBreakdown {
  totalCommissionUSD: number;
  registrationCommissionUSD: number;
  visaApprovedCommissionUSD: number;
  departedCommissionUSD: number;
  earnedCommissionUSD: number;
  pendingCommissionUSD: number;
  registrationEarned: boolean;
  visaApprovedEarned: boolean;
  departedEarned: boolean;
  isRejected: boolean;
}

export const getAmbassadorCommissionForProgram = (
  ambassadorId: string,
  programId: ProgramType
): number => {
  const customCommission = MOCK_AMBASSADOR_COMMISSIONS.find(
    (ac) => ac.ambassadorId === ambassadorId && ac.programId === programId && ac.useCustom
  );

  if (customCommission && customCommission.customCommissionUSD !== null) {
    console.log(`[Commission] Using custom rate for ${ambassadorId}/${programId}: $${customCommission.customCommissionUSD}`);
    return customCommission.customCommissionUSD;
  }

  const program = PROGRAMS.find((p) => p.id === programId);
  const defaultCommission = program?.commission || 0;
  console.log(`[Commission] Using default rate for ${ambassadorId}/${programId}: $${defaultCommission}`);
  return defaultCommission;
};

export const calculateCommissionBreakdown = (
  student: Student,
  ambassadorId: string
): CommissionBreakdown => {
  const totalCommissionUSD = getAmbassadorCommissionForProgram(ambassadorId, student.program);
  
  const registrationCommissionUSD = Math.floor(totalCommissionUSD * 0.25);
  const visaApprovedCommissionUSD = Math.floor(totalCommissionUSD * 0.25);
  const departedCommissionUSD = Math.floor(totalCommissionUSD * 0.50);

  const stage = student.stage;
  const isRejected = stage === 'visa_rejected';

  let registrationEarned = false;
  let visaApprovedEarned = false;
  let departedEarned = false;

  if (['registered', 'documents_completed', 'visa_applied', 'visa_approved', 'visa_rejected', 'orientation', 'departed'].includes(stage)) {
    registrationEarned = true;
  }

  if (['visa_approved', 'orientation', 'departed'].includes(stage)) {
    visaApprovedEarned = true;
  }

  if (stage === 'departed') {
    departedEarned = true;
  }

  let earnedCommissionUSD = 0;
  if (registrationEarned) earnedCommissionUSD += registrationCommissionUSD;
  if (visaApprovedEarned) earnedCommissionUSD += visaApprovedCommissionUSD;
  if (departedEarned) earnedCommissionUSD += departedCommissionUSD;

  let pendingCommissionUSD = 0;
  if (!isRejected) {
    if (!registrationEarned) pendingCommissionUSD += registrationCommissionUSD;
    if (!visaApprovedEarned) pendingCommissionUSD += visaApprovedCommissionUSD;
    if (!departedEarned) pendingCommissionUSD += departedCommissionUSD;
  }

  console.log(`[Commission] Student ${student.name} (${student.stage}): earned $${earnedCommissionUSD}, pending $${pendingCommissionUSD}`);

  return {
    totalCommissionUSD,
    registrationCommissionUSD,
    visaApprovedCommissionUSD,
    departedCommissionUSD,
    earnedCommissionUSD,
    pendingCommissionUSD,
    registrationEarned,
    visaApprovedEarned,
    departedEarned,
    isRejected,
  };
};

export const calculateTotalEarnings = (
  students: Student[],
  ambassadorId: string
): { totalEarnedUSD: number; totalPendingUSD: number; availableUSD: number } => {
  let totalEarnedUSD = 0;
  let totalPendingUSD = 0;
  let availableUSD = 0;

  students.forEach((student) => {
    const breakdown = calculateCommissionBreakdown(student, ambassadorId);
    totalEarnedUSD += breakdown.earnedCommissionUSD;
    totalPendingUSD += breakdown.pendingCommissionUSD;

    if (student.stage === 'departed') {
      availableUSD += breakdown.earnedCommissionUSD;
    }
  });

  console.log(`[Commission] Total for ambassador ${ambassadorId}: earned $${totalEarnedUSD}, pending $${totalPendingUSD}, available $${availableUSD}`);

  return { totalEarnedUSD, totalPendingUSD, availableUSD };
};

export const getCommissionPercentForStage = (stage: StudentStage): number => {
  switch (stage) {
    case 'pre_payment':
      return 0;
    case 'registered':
    case 'documents_completed':
    case 'visa_applied':
      return 25;
    case 'visa_approved':
    case 'orientation':
      return 50;
    case 'departed':
      return 100;
    case 'visa_rejected':
      return 25;
    default:
      return 0;
  }
};

export const getEarnedCommissionForStage = (
  stage: StudentStage,
  totalCommissionUSD: number
): number => {
  const percent = getCommissionPercentForStage(stage);
  return Math.floor(totalCommissionUSD * (percent / 100));
};
