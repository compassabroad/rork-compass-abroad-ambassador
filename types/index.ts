export type StudentStage = 
  | 'registered'
  | 'documents'
  | 'application'
  | 'interview'
  | 'visa'
  | 'approved'
  | 'departed';

export interface Student {
  id: string;
  name: string;
  email: string;
  phone: string;
  program: ProgramType;
  stage: StudentStage;
  registeredAt: string;
  updatedAt: string;
  avatar?: string;
  country?: string;
}

export type ProgramType = 
  | 'camp_usa'
  | 'university'
  | 'masters'
  | 'high_school'
  | 'language_school'
  | 'au_pair'
  | 'work_travel'
  | 'internship'
  | 'summer_camp'
  | 'boarding_school'
  | 'foundation';

export interface Program {
  id: ProgramType;
  name: string;
  nameEn: string;
  description: string;
  commission: number;
  points: number;
  icon: string;
  countries: string[];
  duration: string;
}

export type AmbassadorType = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

export interface Ambassador {
  id: string;
  referralCode: string;
  name: string;
  email: string;
  phone: string;
  type: AmbassadorType;
  parentId?: string;
  avatar?: string;
  joinedAt: string;
  totalEarningsUSD: number;
  totalEarningsTRY: number;
  compassPoints: number;
  studentsReferred: number;
  subAmbassadors: string[];
  iban?: string;
  kvkkConsent: boolean;
  kvkkConsentDate?: string;
}

export interface Earnings {
  totalUSD: number;
  totalTRY: number;
  pendingUSD: number;
  pendingTRY: number;
  thisMonthUSD: number;
  thisMonthTRY: number;
  exchangeRate: number;
}

export interface NetworkNode {
  ambassador: Ambassador;
  children: NetworkNode[];
  level: number;
}

export const STAGE_LABELS: Record<StudentStage, { tr: string; en: string }> = {
  registered: { tr: 'Kayıtlı', en: 'Registered' },
  documents: { tr: 'Belgeler', en: 'Documents' },
  application: { tr: 'Başvuru', en: 'Application' },
  interview: { tr: 'Mülakat', en: 'Interview' },
  visa: { tr: 'Vize', en: 'Visa' },
  approved: { tr: 'Onaylı', en: 'Approved' },
  departed: { tr: 'Gitti', en: 'Departed' },
};

export const AMBASSADOR_TYPE_LABELS: Record<AmbassadorType, { tr: string; en: string; color: string }> = {
  bronze: { tr: 'Bronz', en: 'Bronze', color: '#CD7F32' },
  silver: { tr: 'Gümüş', en: 'Silver', color: '#C0C0C0' },
  gold: { tr: 'Altın', en: 'Gold', color: '#FFD700' },
  platinum: { tr: 'Platin', en: 'Platinum', color: '#E5E4E2' },
  diamond: { tr: 'Elmas', en: 'Diamond', color: '#B9F2FF' },
};
