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

export type TransactionType = 
  | 'student_registration'
  | 'student_program_selected'
  | 'student_visa_approved'
  | 'student_departed'
  | 'referral_commission'
  | 'bonus'
  | 'payment_withdrawal';

export interface Transaction {
  id: string;
  type: TransactionType;
  amountUSD: number;
  amountTRY: number;
  date: string;
  studentName?: string;
  studentId?: string;
  description: string;
  status: 'completed' | 'pending';
}

export type NotificationType = 
  | 'student_update'
  | 'payment_received'
  | 'announcement'
  | 'ambassador_joined';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  date: string;
  read: boolean;
  studentId?: string;
  ambassadorId?: string;
}

export interface Message {
  id: string;
  text: string;
  senderId: string;
  timestamp: string;
  read: boolean;
}

export interface Conversation {
  id: string;
  participantName: string;
  participantAvatar?: string;
  participantRole: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  messages: Message[];
}

export type UserRole = 'ambassador' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  ambassadorId?: string;
}

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface PendingAmbassador {
  id: string;
  name: string;
  email: string;
  phone: string;
  registrationDate: string;
  status: ApprovalStatus;
  referredBy?: string;
}

export interface ProgramCommission {
  programId: ProgramType;
  defaultCommissionUSD: number;
  exchangeRate: number;
}

export interface AmbassadorCommission {
  ambassadorId: string;
  programId: ProgramType;
  customCommissionUSD: number | null;
  useCustom: boolean;
}

export type AvailabilityStatus = 'available' | 'busy';

export interface TeamMember {
  id: string;
  name: string;
  title: string;
  expertiseAreas: ProgramType[];
  languages: string[];
  availability: AvailabilityStatus;
  email: string;
  phone: string;
  avatar?: string;
}

export interface StudentPipelineStage {
  stage: StudentStage;
  date: string | null;
  completed: boolean;
}

export const TRANSACTION_TYPE_LABELS: Record<TransactionType, { tr: string; en: string; icon: string }> = {
  student_registration: { tr: 'Öğrenci Kaydı', en: 'Student Registration', icon: 'user-plus' },
  student_program_selected: { tr: 'Program Seçimi', en: 'Program Selected', icon: 'book-open' },
  student_visa_approved: { tr: 'Vize Onayı', en: 'Visa Approved', icon: 'check-circle' },
  student_departed: { tr: 'Öğrenci Gidişi', en: 'Student Departed', icon: 'plane' },
  referral_commission: { tr: 'Referans Komisyonu', en: 'Referral Commission', icon: 'users' },
  bonus: { tr: 'Bonus', en: 'Bonus', icon: 'gift' },
  payment_withdrawal: { tr: 'Ödeme Çekimi', en: 'Payment Withdrawal', icon: 'wallet' },
};

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, { tr: string; icon: string; color: string }> = {
  student_update: { tr: 'Öğrenci Güncellemesi', icon: 'user', color: '#3B82F6' },
  payment_received: { tr: 'Ödeme Alındı', icon: 'dollar-sign', color: '#10B981' },
  announcement: { tr: 'Duyuru', icon: 'megaphone', color: '#F59E0B' },
  ambassador_joined: { tr: 'Yeni Elçi', icon: 'user-plus', color: '#8B5CF6' },
};

export interface Announcement {
  id: string;
  title: string;
  preview: string;
  content: string;
  date: string;
  read: boolean;
  imageUrl?: string;
}
