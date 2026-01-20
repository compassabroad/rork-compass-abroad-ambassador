export type StudentStage = 
  | 'pre_payment'
  | 'registered'
  | 'documents_completed'
  | 'visa_applied'
  | 'visa_approved'
  | 'visa_rejected'
  | 'orientation'
  | 'departed';

export type StudentInvitationStatus = 'pending_kvkk' | 'completed';

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
  invitationStatus?: StudentInvitationStatus;
  invitationToken?: string;
  invitedAt?: string;
  invitedByAmbassadorId?: string;
  notes?: string;
}

export type ProgramType = 
  | 'language_education'
  | 'bachelor'
  | 'high_school'
  | 'internship'
  | 'work_and_study'
  | 'visa_consulting'
  | 'group_summer_school'
  | 'individual_summer_school'
  | 'paid_teaching'
  | 'camp_usa'
  | 'canada_online_highschool'
  | 'canada_language'
  | 'masters';

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

export type AmbassadorCategory = 'individual' | 'corporate';
export type IndividualSubType = 'student' | 'teacher' | 'other';
export type CorporateSubType = 'school' | 'agency' | 'other';
export type AccountStatus = 'pending_approval' | 'active' | 'rejected' | 'suspended';

export interface Ambassador {
  id: string;
  referralCode: string;
  name: string;
  firstName: string;
  lastName: string;
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
  savedIbans?: SavedIban[];
  kvkkConsent: boolean;
  kvkkConsentDate?: string;
  birthDate?: string;
  tcIdentity?: string;
  city?: string;
  ambassadorCategory: AmbassadorCategory;
  ambassadorSubType: IndividualSubType | CorporateSubType;
  companyName?: string;
  taxNumber?: string;
  taxOffice?: string;
  accountStatus: AccountStatus;
  pendingFirstName?: string | null;
  pendingLastName?: string | null;
  nameChangeRequestDate?: string | null;
  profilePhoto?: string | null;
  privacyPolicyConsent: boolean;
  privacyPolicyConsentDate?: string;
  termsConsent: boolean;
  termsConsentDate?: string;
  networkCommissionRate: number;
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

export const STAGE_LABELS: Record<StudentStage, { tr: string; en: string; color: string; commissionPercent: number }> = {
  pre_payment: { tr: 'Ön Ödeme', en: 'Pre Payment', color: '#9CA3AF', commissionPercent: 0 },
  registered: { tr: 'Kayıt', en: 'Registered', color: '#3B82F6', commissionPercent: 25 },
  documents_completed: { tr: 'Belgeler Tamam', en: 'Documents Completed', color: '#8B5CF6', commissionPercent: 0 },
  visa_applied: { tr: 'Vize Başvurusu', en: 'Visa Applied', color: '#F59E0B', commissionPercent: 0 },
  visa_approved: { tr: 'Vize Onaylandı', en: 'Visa Approved', color: '#10B981', commissionPercent: 25 },
  visa_rejected: { tr: 'Vize Red', en: 'Visa Rejected', color: '#EF4444', commissionPercent: 0 },
  orientation: { tr: 'Oryantasyon', en: 'Orientation', color: '#06B6D4', commissionPercent: 0 },
  departed: { tr: 'Uçtu', en: 'Departed', color: '#22C55E', commissionPercent: 50 },
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
  isTicket?: boolean;
  ticketId?: string;
}

export type TicketStatus = 'open' | 'in_progress' | 'resolved';
export type TicketPriority = 'low' | 'medium' | 'high';

export interface ChatTicket {
  id: string;
  subject: string;
  message: string;
  createdAt: string;
  status: TicketStatus;
  priority: TicketPriority;
  ambassadorId: string;
  ambassadorName: string;
  resolvedAt?: string;
  responses: Message[];
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

export interface SocialMediaLinks {
  instagram: string;
  linkedin: string;
  twitter: string;
  facebook: string;
}

export type BankAccountStatus = 'pending' | 'approved' | 'rejected';

export interface SavedIban {
  id: string;
  iban: string;
  bankName: string;
  isDefault: boolean;
  status: BankAccountStatus;
  submittedAt?: string;
  approvedAt?: string;
}

export interface NameChangeRequest {
  id: string;
  ambassadorId: string;
  ambassadorName: string;
  currentFirstName: string;
  currentLastName: string;
  requestedFirstName: string;
  requestedLastName: string;
  requestDate: string;
  status: 'pending' | 'approved' | 'rejected';
}

export const TURKISH_CITIES = [
  'Adana', 'Adıyaman', 'Afyonkarahisar', 'Ağrı', 'Aksaray', 'Amasya', 'Ankara', 'Antalya', 'Ardahan', 'Artvin',
  'Aydın', 'Balıkesir', 'Bartın', 'Batman', 'Bayburt', 'Bilecik', 'Bingöl', 'Bitlis', 'Bolu', 'Burdur',
  'Bursa', 'Çanakkale', 'Çankırı', 'Çorum', 'Denizli', 'Diyarbakır', 'Düzce', 'Edirne', 'Elazığ', 'Erzincan',
  'Erzurum', 'Eskişehir', 'Gaziantep', 'Giresun', 'Gümüşhane', 'Hakkari', 'Hatay', 'Iğdır', 'Isparta', 'İstanbul',
  'İzmir', 'Kahramanmaraş', 'Karabük', 'Karaman', 'Kars', 'Kastamonu', 'Kayseri', 'Kırıkkale', 'Kırklareli', 'Kırşehir',
  'Kilis', 'Kocaeli', 'Konya', 'Kütahya', 'Malatya', 'Manisa', 'Mardin', 'Mersin', 'Muğla', 'Muş',
  'Nevşehir', 'Niğde', 'Ordu', 'Osmaniye', 'Rize', 'Sakarya', 'Samsun', 'Siirt', 'Sinop', 'Sivas',
  'Şanlıurfa', 'Şırnak', 'Tekirdağ', 'Tokat', 'Trabzon', 'Tunceli', 'Uşak', 'Van', 'Yalova', 'Yozgat', 'Zonguldak'
] as const;
