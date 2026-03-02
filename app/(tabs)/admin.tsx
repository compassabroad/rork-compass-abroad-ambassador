import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Shield,
  Users,
  UserCheck,
  GraduationCap,
  DollarSign,
  Search,
  Check,
  X,
  ChevronRight,
  ChevronDown,
  Settings,
  Share2,
  UserCog,
  ArrowRight,
  Briefcase,
  CreditCard,
  Wallet,
  Megaphone,
  Plus,
  Trash2,
  Star,
  Award,
  TrendingUp,
  Calendar,
  BarChart3,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { trpc } from '@/lib/trpc';
import { AMBASSADOR_TYPE_LABELS, STAGE_LABELS } from '@/types';
import type { StudentStage, AmbassadorType } from '@/types';

const STAGE_OPTIONS: { value: StudentStage; label: string }[] = [
  { value: 'pre_payment', label: 'Ön Ödeme' },
  { value: 'registered', label: 'Kayıt' },
  { value: 'documents_completed', label: 'Belgeler Tamam' },
  { value: 'visa_applied', label: 'Vize Başvurusu' },
  { value: 'visa_approved', label: 'Vize Onaylandı' },
  { value: 'visa_rejected', label: 'Vize Red' },
  { value: 'orientation', label: 'Oryantasyon' },
  { value: 'departed', label: 'Uçtu' },
];

const TYPE_OPTIONS: { value: AmbassadorType; label: string }[] = [
  { value: 'bronze', label: 'Bronz' },
  { value: 'silver', label: 'Gümüş' },
  { value: 'gold', label: 'Altın' },
  { value: 'platinum', label: 'Platin' },
  { value: 'diamond', label: 'Elmas' },
];

export default function AdminScreen() {
  const router = useRouter();
  const { user, token } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [studentStageFilter, setStudentStageFilter] = useState('all');
  const [activeSection, setActiveSection] = useState<string>('overview');

  const [studentDetailModalVisible, setStudentDetailModalVisible] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [selectedNewStage, setSelectedNewStage] = useState<StudentStage | null>(null);
  const [stageDropdownOpen, setStageDropdownOpen] = useState(false);

  const [announcementModalVisible, setAnnouncementModalVisible] = useState(false);
  const [newAnnouncementTitle, setNewAnnouncementTitle] = useState('');
  const [newAnnouncementPreview, setNewAnnouncementPreview] = useState('');
  const [newAnnouncementContent, setNewAnnouncementContent] = useState('');
  const [newAnnouncementImageUrl, setNewAnnouncementImageUrl] = useState('');

  const [pointsModalVisible, setPointsModalVisible] = useState(false);
  const [pointsAmbassadorId, setPointsAmbassadorId] = useState('');
  const [pointsAmbassadorName, setPointsAmbassadorName] = useState('');
  const [pointsAmount, setPointsAmount] = useState('');
  const [pointsReason, setPointsReason] = useState('');

  const [typeModalVisible, setTypeModalVisible] = useState(false);
  const [typeAmbassadorId, setTypeAmbassadorId] = useState('');
  const [typeAmbassadorName, setTypeAmbassadorName] = useState('');
  const [selectedType, setSelectedType] = useState<AmbassadorType>('bronze');

  const isAdmin = user?.role === 'admin';

  const statsQuery = trpc.admin.getDashboardStats.useQuery(
    { token: token ?? '' },
    { enabled: !!token && isAdmin }
  );

  const pendingAmbassadorsQuery = trpc.admin.getPendingAmbassadors.useQuery(
    { token: token ?? '' },
    { enabled: !!token && isAdmin }
  );

  const nameChangeQuery = trpc.admin.getNameChangeRequests.useQuery(
    { token: token ?? '' },
    { enabled: !!token && isAdmin }
  );

  const pendingBanksQuery = trpc.admin.getPendingBankAccounts.useQuery(
    { token: token ?? '' },
    { enabled: !!token && isAdmin }
  );

  const pendingWithdrawalsQuery = trpc.admin.getPendingWithdrawals.useQuery(
    { token: token ?? '' },
    { enabled: !!token && isAdmin }
  );

  const allAmbassadorsQuery = trpc.admin.getAllAmbassadors.useQuery(
    { token: token ?? '', search: searchQuery || undefined },
    { enabled: !!token && isAdmin }
  );

  const allStudentsQuery = trpc.admin.getAllStudents.useQuery(
    {
      token: token ?? '',
      stage: studentStageFilter !== 'all' ? studentStageFilter : undefined,
      search: studentSearchQuery || undefined,
    },
    { enabled: !!token && isAdmin && activeSection === 'students' }
  );

  const studentDetailQuery = trpc.admin.getStudentDetail.useQuery(
    { token: token ?? '', studentId: selectedStudentId ?? '' },
    { enabled: !!token && isAdmin && !!selectedStudentId && studentDetailModalVisible }
  );

  const announcementsQuery = trpc.admin.getAnnouncements.useQuery(
    { token: token ?? '' },
    { enabled: !!token && isAdmin && activeSection === 'announcements' }
  );

  const approveAmbassadorMutation = trpc.admin.approveAmbassador.useMutation();
  const rejectAmbassadorMutation = trpc.admin.rejectAmbassador.useMutation();
  const approveNameChangeMutation = trpc.admin.approveNameChange.useMutation();
  const rejectNameChangeMutation = trpc.admin.rejectNameChange.useMutation();
  const approveBankMutation = trpc.admin.approveBankAccount.useMutation();
  const rejectBankMutation = trpc.admin.rejectBankAccount.useMutation();
  const approveWithdrawalMutation = trpc.admin.approveWithdrawal.useMutation();
  const rejectWithdrawalMutation = trpc.admin.rejectWithdrawal.useMutation();
  const updateStudentStageMutation = trpc.admin.updateStudentStage.useMutation();
  const createAnnouncementMutation = trpc.admin.createAnnouncement.useMutation();
  const deleteAnnouncementMutation = trpc.admin.deleteAnnouncement.useMutation();
  const updateCompassPointsMutation = trpc.admin.updateCompassPoints.useMutation();
  const updateAmbassadorTypeMutation = trpc.admin.updateAmbassadorType.useMutation();

  const stats = statsQuery.data ?? {
    totalAmbassadors: 0,
    totalStudents: 0,
    pendingApprovals: 0,
    pendingWithdrawals: 0,
    pendingBankAccounts: 0,
    pendingNameChanges: 0,
    commissionsPaidThisMonth: 0,
    pendingWithdrawalsAmount: 0,
    studentsByStage: [] as { stage: string; count: number }[],
    newRegistrationsThisWeek: 0,
    topAmbassadors: [] as { id: string; name: string; studentsReferred: number; type: string }[],
  };

  const pendingList = pendingAmbassadorsQuery.data ?? [];
  const pendingNameChanges = nameChangeQuery.data ?? [];
  const pendingBanks = pendingBanksQuery.data ?? [];
  const pendingWithdrawals = pendingWithdrawalsQuery.data ?? [];
  const allAmbassadors = allAmbassadorsQuery.data ?? [];
  const allStudents = allStudentsQuery.data ?? [];
  const announcements = announcementsQuery.data ?? [];

  const refetchAll = useCallback(() => {
    statsQuery.refetch();
    pendingAmbassadorsQuery.refetch();
    nameChangeQuery.refetch();
    pendingBanksQuery.refetch();
    pendingWithdrawalsQuery.refetch();
    allAmbassadorsQuery.refetch();
    if (activeSection === 'students') allStudentsQuery.refetch();
    if (activeSection === 'announcements') announcementsQuery.refetch();
  }, [statsQuery, pendingAmbassadorsQuery, nameChangeQuery, pendingBanksQuery, pendingWithdrawalsQuery, allAmbassadorsQuery, allStudentsQuery, announcementsQuery, activeSection]);

  const handleApprove = useCallback((id: string) => {
    Alert.alert('Onayla', 'Bu elçiyi onaylamak istediğinize emin misiniz?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Onayla',
        onPress: async () => {
          try {
            await approveAmbassadorMutation.mutateAsync({ token: token ?? '', ambassadorId: id });
            Alert.alert('Başarılı', 'Elçi başarıyla onaylandı.');
            refetchAll();
          } catch (error: any) {
            Alert.alert('Hata', error.message || 'Bir hata oluştu');
          }
        },
      },
    ]);
  }, [token, approveAmbassadorMutation, refetchAll]);

  const handleReject = useCallback((id: string) => {
    Alert.alert('Reddet', 'Bu elçiyi reddetmek istediğinize emin misiniz?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Reddet',
        style: 'destructive',
        onPress: async () => {
          try {
            await rejectAmbassadorMutation.mutateAsync({ token: token ?? '', ambassadorId: id });
            Alert.alert('Reddedildi', 'Elçi başvurusu reddedildi.');
            refetchAll();
          } catch (error: any) {
            Alert.alert('Hata', error.message || 'Bir hata oluştu');
          }
        },
      },
    ]);
  }, [token, rejectAmbassadorMutation, refetchAll]);

  const handleApproveNameChange = useCallback((request: { id: string; currentFirstName: string; currentLastName: string; requestedFirstName: string; requestedLastName: string }) => {
    Alert.alert(
      'İsim Değişikliğini Onayla',
      `"${request.currentFirstName} ${request.currentLastName}" → "${request.requestedFirstName} ${request.requestedLastName}" olarak değiştirilsin mi?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Onayla',
          onPress: async () => {
            try {
              await approveNameChangeMutation.mutateAsync({ token: token ?? '', requestId: request.id });
              Alert.alert('Başarılı', 'İsim değişikliği onaylandı.');
              refetchAll();
            } catch (error: any) {
              Alert.alert('Hata', error.message || 'Bir hata oluştu');
            }
          },
        },
      ]
    );
  }, [token, approveNameChangeMutation, refetchAll]);

  const handleRejectNameChange = useCallback((request: { id: string }) => {
    Alert.alert('İsim Değişikliğini Reddet', 'Bu isim değişikliği talebini reddetmek istediğinize emin misiniz?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Reddet',
        style: 'destructive',
        onPress: async () => {
          try {
            await rejectNameChangeMutation.mutateAsync({ token: token ?? '', requestId: request.id });
            Alert.alert('Reddedildi', 'İsim değişikliği talebi reddedildi.');
            refetchAll();
          } catch (error: any) {
            Alert.alert('Hata', error.message || 'Bir hata oluştu');
          }
        },
      },
    ]);
  }, [token, rejectNameChangeMutation, refetchAll]);

  const handleApproveBankAccount = useCallback((id: string) => {
    Alert.alert('Banka Hesabını Onayla', 'Bu banka hesabını onaylamak istediğinize emin misiniz?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Onayla',
        onPress: async () => {
          try {
            await approveBankMutation.mutateAsync({ token: token ?? '', bankAccountId: id });
            Alert.alert('Başarılı', 'Banka hesabı onaylandı.');
            refetchAll();
          } catch (error: any) {
            Alert.alert('Hata', error.message || 'Bir hata oluştu');
          }
        },
      },
    ]);
  }, [token, approveBankMutation, refetchAll]);

  const handleRejectBankAccount = useCallback((id: string) => {
    Alert.alert('Banka Hesabını Reddet', 'Bu banka hesabını reddetmek istediğinize emin misiniz?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Reddet',
        style: 'destructive',
        onPress: async () => {
          try {
            await rejectBankMutation.mutateAsync({ token: token ?? '', bankAccountId: id });
            Alert.alert('Reddedildi', 'Banka hesabı reddedildi.');
            refetchAll();
          } catch (error: any) {
            Alert.alert('Hata', error.message || 'Bir hata oluştu');
          }
        },
      },
    ]);
  }, [token, rejectBankMutation, refetchAll]);

  const handleApproveWithdrawal = useCallback((id: string) => {
    Alert.alert('Çekim Talebini Onayla', 'Bu çekim talebini onaylamak istediğinize emin misiniz?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Onayla',
        onPress: async () => {
          try {
            await approveWithdrawalMutation.mutateAsync({ token: token ?? '', withdrawalId: id });
            Alert.alert('Başarılı', 'Çekim talebi onaylandı.');
            refetchAll();
          } catch (error: any) {
            Alert.alert('Hata', error.message || 'Bir hata oluştu');
          }
        },
      },
    ]);
  }, [token, approveWithdrawalMutation, refetchAll]);

  const handleRejectWithdrawal = useCallback((id: string) => {
    Alert.alert('Çekim Talebini Reddet', 'Bu çekim talebini reddetmek istediğinize emin misiniz?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Reddet',
        style: 'destructive',
        onPress: async () => {
          try {
            await rejectWithdrawalMutation.mutateAsync({ token: token ?? '', withdrawalId: id });
            Alert.alert('Reddedildi', 'Çekim talebi reddedildi.');
            refetchAll();
          } catch (error: any) {
            Alert.alert('Hata', error.message || 'Bir hata oluştu');
          }
        },
      },
    ]);
  }, [token, rejectWithdrawalMutation, refetchAll]);

  const handleUpdateStudentStage = useCallback(() => {
    if (!selectedStudentId || !selectedNewStage) return;

    const studentDetail = studentDetailQuery.data;
    const stageLabelTr = STAGE_LABELS[selectedNewStage as StudentStage]?.tr ?? selectedNewStage;

    Alert.alert(
      'Aşamayı Güncelle',
      `Öğrenci ${studentDetail?.name ?? ''} ${stageLabelTr} aşamasına geçirilecek. Komisyon otomatik hesaplanacak. Devam edilsin mi?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Güncelle',
          onPress: async () => {
            try {
              const result = await updateStudentStageMutation.mutateAsync({
                token: token ?? '',
                studentId: selectedStudentId,
                newStage: selectedNewStage,
              });
              const msg = result.commissionMessage
                ? `Aşama güncellendi. ${result.commissionMessage}`
                : 'Aşama güncellendi.';
              Alert.alert('Başarılı', msg);
              setStudentDetailModalVisible(false);
              setSelectedStudentId(null);
              setSelectedNewStage(null);
              allStudentsQuery.refetch();
              statsQuery.refetch();
            } catch (error: any) {
              Alert.alert('Hata', error.message || 'Bir hata oluştu');
            }
          },
        },
      ]
    );
  }, [selectedStudentId, selectedNewStage, studentDetailQuery.data, token, updateStudentStageMutation, allStudentsQuery, statsQuery]);

  const handleCreateAnnouncement = useCallback(async () => {
    if (!newAnnouncementTitle.trim() || !newAnnouncementPreview.trim() || !newAnnouncementContent.trim()) {
      Alert.alert('Hata', 'Başlık, önizleme ve içerik alanları zorunludur.');
      return;
    }
    try {
      await createAnnouncementMutation.mutateAsync({
        token: token ?? '',
        title: newAnnouncementTitle,
        preview: newAnnouncementPreview,
        content: newAnnouncementContent,
        imageUrl: newAnnouncementImageUrl || undefined,
      });
      Alert.alert('Başarılı', 'Duyuru oluşturuldu ve tüm elçilere bildirim gönderildi.');
      setAnnouncementModalVisible(false);
      setNewAnnouncementTitle('');
      setNewAnnouncementPreview('');
      setNewAnnouncementContent('');
      setNewAnnouncementImageUrl('');
      announcementsQuery.refetch();
    } catch (error: any) {
      Alert.alert('Hata', error.message || 'Bir hata oluştu');
    }
  }, [token, newAnnouncementTitle, newAnnouncementPreview, newAnnouncementContent, newAnnouncementImageUrl, createAnnouncementMutation, announcementsQuery]);

  const handleDeleteAnnouncement = useCallback((id: string, title: string) => {
    Alert.alert('Duyuruyu Sil', `"${title}" duyurusunu silmek istediğinize emin misiniz?`, [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteAnnouncementMutation.mutateAsync({ token: token ?? '', announcementId: id });
            Alert.alert('Silindi', 'Duyuru başarıyla silindi.');
            announcementsQuery.refetch();
          } catch (error: any) {
            Alert.alert('Hata', error.message || 'Bir hata oluştu');
          }
        },
      },
    ]);
  }, [token, deleteAnnouncementMutation, announcementsQuery]);

  const handleUpdateCompassPoints = useCallback(async () => {
    const pts = parseInt(pointsAmount, 10);
    if (isNaN(pts) || pts === 0) {
      Alert.alert('Hata', 'Geçerli bir puan değeri girin.');
      return;
    }
    if (!pointsReason.trim()) {
      Alert.alert('Hata', 'Bir sebep belirtin.');
      return;
    }
    try {
      const result = await updateCompassPointsMutation.mutateAsync({
        token: token ?? '',
        ambassadorId: pointsAmbassadorId,
        points: pts,
        reason: pointsReason,
      });
      Alert.alert('Başarılı', `Puanlar güncellendi. Yeni toplam: ${result.newTotal}`);
      setPointsModalVisible(false);
      setPointsAmount('');
      setPointsReason('');
      allAmbassadorsQuery.refetch();
      statsQuery.refetch();
    } catch (error: any) {
      Alert.alert('Hata', error.message || 'Bir hata oluştu');
    }
  }, [token, pointsAmbassadorId, pointsAmount, pointsReason, updateCompassPointsMutation, allAmbassadorsQuery, statsQuery]);

  const handleUpdateAmbassadorType = useCallback(async () => {
    try {
      await updateAmbassadorTypeMutation.mutateAsync({
        token: token ?? '',
        ambassadorId: typeAmbassadorId,
        newType: selectedType,
      });
      Alert.alert('Başarılı', 'Elçi seviyesi güncellendi.');
      setTypeModalVisible(false);
      allAmbassadorsQuery.refetch();
    } catch (error: any) {
      Alert.alert('Hata', error.message || 'Bir hata oluştu');
    }
  }, [token, typeAmbassadorId, selectedType, updateAmbassadorTypeMutation, allAmbassadorsQuery]);

  const openPointsModal = useCallback((id: string, name: string) => {
    setPointsAmbassadorId(id);
    setPointsAmbassadorName(name);
    setPointsAmount('');
    setPointsReason('');
    setPointsModalVisible(true);
  }, []);

  const openTypeModal = useCallback((id: string, name: string, currentType: string) => {
    setTypeAmbassadorId(id);
    setTypeAmbassadorName(name);
    setSelectedType(currentType as AmbassadorType);
    setTypeModalVisible(true);
  }, []);

  if (!isAdmin) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.accessDenied}>
          <Shield color={Colors.error} size={64} />
          <Text style={styles.accessDeniedTitle}>Erişim Reddedildi</Text>
          <Text style={styles.accessDeniedText}>Bu sayfaya erişim yetkiniz bulunmamaktadır.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const sections = [
    { id: 'overview', label: 'Genel', icon: BarChart3 },
    { id: 'students', label: 'Öğrenciler', icon: GraduationCap },
    { id: 'announcements', label: 'Duyurular', icon: Megaphone },
    { id: 'ambassadors', label: 'Elçiler', icon: Users },
  ];

  const renderStatCard = (icon: React.ReactNode, label: string, value: string | number, color: string) => (
    <View style={[styles.statCard, { borderLeftColor: color }]} key={label}>
      <View style={[styles.statIconContainer, { backgroundColor: color + '20' }]}>{icon}</View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  const renderPendingAmbassador = (ambassador: { id: string; name: string; email: string; registrationDate: string; referredBy?: string }) => (
    <View key={ambassador.id} style={styles.pendingCard}>
      <View style={styles.pendingInfo}>
        <View style={styles.pendingAvatar}>
          <Text style={styles.pendingAvatarText}>{ambassador.name.split(' ').map(n => n[0]).join('')}</Text>
        </View>
        <View style={styles.pendingDetails}>
          <Text style={styles.pendingName}>{ambassador.name}</Text>
          <Text style={styles.pendingEmail}>{ambassador.email}</Text>
          <Text style={styles.pendingDate}>Kayıt: {formatDate(ambassador.registrationDate)}</Text>
          {ambassador.referredBy && <Text style={styles.pendingReferral}>Referans: {ambassador.referredBy}</Text>}
        </View>
      </View>
      <View style={styles.pendingActions}>
        <TouchableOpacity style={[styles.actionButton, styles.approveButton]} onPress={() => handleApprove(ambassador.id)} testID={`approve-${ambassador.id}`}>
          <Check color="#FFFFFF" size={20} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.rejectButton]} onPress={() => handleReject(ambassador.id)} testID={`reject-${ambassador.id}`}>
          <X color="#FFFFFF" size={20} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderAmbassadorItem = (ambassador: { id: string; name: string; email: string; type: string; referralCode: string }) => {
    const typeKey = ambassador.type as keyof typeof AMBASSADOR_TYPE_LABELS;
    const typeLabel = AMBASSADOR_TYPE_LABELS[typeKey];

    return (
      <View key={ambassador.id} style={styles.ambassadorItem}>
        <TouchableOpacity
          style={styles.ambassadorMainArea}
          onPress={() => router.push(`/admin/ambassador-commissions/${ambassador.id}` as any)}
          testID={`ambassador-${ambassador.id}`}
        >
          <View style={styles.ambassadorAvatar}>
            <Text style={styles.ambassadorAvatarText}>{ambassador.name.split(' ').map(n => n[0]).join('')}</Text>
          </View>
          <View style={styles.ambassadorInfo}>
            <Text style={styles.ambassadorName}>{ambassador.name}</Text>
            <Text style={styles.ambassadorEmail}>{ambassador.email}</Text>
            <View style={styles.ambassadorMeta}>
              {typeLabel && (
                <View style={[styles.typeBadge, { backgroundColor: typeLabel.color + '30' }]}>
                  <Text style={[styles.typeBadgeText, { color: typeLabel.color }]}>{typeLabel.tr}</Text>
                </View>
              )}
              <Text style={styles.ambassadorCode}>{ambassador.referralCode}</Text>
            </View>
          </View>
          <ChevronRight color={Colors.textMuted} size={20} />
        </TouchableOpacity>
        <View style={styles.ambassadorActions}>
          <TouchableOpacity
            style={[styles.miniActionButton, { backgroundColor: Colors.secondary + '20' }]}
            onPress={() => openPointsModal(ambassador.id, ambassador.name)}
          >
            <Star color={Colors.secondary} size={14} />
            <Text style={[styles.miniActionText, { color: Colors.secondary }]}>Puan</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.miniActionButton, { backgroundColor: Colors.info + '20' }]}
            onPress={() => openTypeModal(ambassador.id, ambassador.name, ambassador.type)}
          >
            <Award color={Colors.info} size={14} />
            <Text style={[styles.miniActionText, { color: Colors.info }]}>Seviye</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderStudentCard = (student: {
    id: string;
    name: string;
    program: string;
    stage: string;
    ambassadorName: string;
    createdAt: string;
  }) => {
    const stageInfo = STAGE_LABELS[student.stage as StudentStage];
    return (
      <TouchableOpacity
        key={student.id}
        style={styles.studentCard}
        onPress={() => {
          setSelectedStudentId(student.id);
          setSelectedNewStage(null);
          setStageDropdownOpen(false);
          setStudentDetailModalVisible(true);
        }}
      >
        <View style={styles.studentCardHeader}>
          <View style={styles.studentCardLeft}>
            <View style={styles.studentAvatar}>
              <Text style={styles.studentAvatarText}>{student.name.split(' ').map(n => n[0]).join('')}</Text>
            </View>
            <View style={styles.studentCardInfo}>
              <Text style={styles.studentCardName}>{student.name}</Text>
              <Text style={styles.studentCardAmbassador}>{student.ambassadorName}</Text>
            </View>
          </View>
          <View style={[styles.stageBadge, { backgroundColor: (stageInfo?.color ?? '#9CA3AF') + '20' }]}>
            <View style={[styles.stageDot, { backgroundColor: stageInfo?.color ?? '#9CA3AF' }]} />
            <Text style={[styles.stageBadgeText, { color: stageInfo?.color ?? '#9CA3AF' }]}>{stageInfo?.tr ?? student.stage}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderOverviewSection = () => (
    <>
      <View style={styles.statsGrid}>
        {renderStatCard(<Users color={Colors.info} size={20} />, 'Toplam Elçi', stats.totalAmbassadors, Colors.info)}
        {renderStatCard(<UserCheck color={Colors.warning} size={20} />, 'Onay Bekleyen', stats.pendingApprovals, Colors.warning)}
        {renderStatCard(<GraduationCap color={Colors.success} size={20} />, 'Toplam Öğrenci', stats.totalStudents, Colors.success)}
        {renderStatCard(<Wallet color={Colors.secondary} size={20} />, 'Çekim Bekleyen', stats.pendingWithdrawals, Colors.secondary)}
      </View>

      <View style={styles.enhancedStatsRow}>
        <View style={[styles.enhancedStatCard, { borderLeftColor: Colors.success }]}>
          <View style={styles.enhancedStatHeader}>
            <DollarSign color={Colors.success} size={18} />
            <Text style={styles.enhancedStatLabel}>Bu Ay Komisyon</Text>
          </View>
          <Text style={styles.enhancedStatValue}>${(stats.commissionsPaidThisMonth ?? 0).toLocaleString()}</Text>
        </View>
        <View style={[styles.enhancedStatCard, { borderLeftColor: Colors.warning }]}>
          <View style={styles.enhancedStatHeader}>
            <TrendingUp color={Colors.warning} size={18} />
            <Text style={styles.enhancedStatLabel}>Bekleyen Çekim</Text>
          </View>
          <Text style={styles.enhancedStatValue}>${(stats.pendingWithdrawalsAmount ?? 0).toLocaleString()}</Text>
        </View>
      </View>

      <View style={styles.enhancedStatsRow}>
        <View style={[styles.enhancedStatCard, { borderLeftColor: Colors.info }]}>
          <View style={styles.enhancedStatHeader}>
            <Calendar color={Colors.info} size={18} />
            <Text style={styles.enhancedStatLabel}>Bu Hafta Yeni Kayıt</Text>
          </View>
          <Text style={styles.enhancedStatValue}>{stats.newRegistrationsThisWeek ?? 0}</Text>
        </View>
        <View style={[styles.enhancedStatCard, { borderLeftColor: Colors.primaryLight }]}>
          <View style={styles.enhancedStatHeader}>
            <CreditCard color={Colors.primaryLight} size={18} />
            <Text style={styles.enhancedStatLabel}>Banka Onayı</Text>
          </View>
          <Text style={styles.enhancedStatValue}>{stats.pendingBankAccounts}</Text>
        </View>
      </View>

      {(stats.topAmbassadors?.length ?? 0) > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>En Aktif Elçiler</Text>
          {stats.topAmbassadors.map((amb, idx) => {
            const typeLabel = AMBASSADOR_TYPE_LABELS[amb.type as AmbassadorType];
            return (
              <View key={amb.id} style={styles.topAmbassadorRow}>
                <View style={[styles.rankBadge, idx === 0 && { backgroundColor: Colors.secondary + '30' }]}>
                  <Text style={[styles.rankText, idx === 0 && { color: Colors.secondary }]}>{idx + 1}</Text>
                </View>
                <View style={styles.topAmbassadorInfo}>
                  <Text style={styles.topAmbassadorName}>{amb.name}</Text>
                  {typeLabel && (
                    <View style={[styles.typeBadge, { backgroundColor: typeLabel.color + '30' }]}>
                      <Text style={[styles.typeBadgeText, { color: typeLabel.color }]}>{typeLabel.tr}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.topAmbassadorStudents}>{amb.studentsReferred} öğrenci</Text>
              </View>
            );
          })}
        </View>
      )}

      {(stats.studentsByStage?.length ?? 0) > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Aşamalara Göre Öğrenciler</Text>
          <View style={styles.stageBreakdownGrid}>
            {stats.studentsByStage.map(s => {
              const stageInfo = STAGE_LABELS[s.stage as StudentStage];
              return (
                <View key={s.stage} style={[styles.stageBreakdownItem, { borderLeftColor: stageInfo?.color ?? '#9CA3AF' }]}>
                  <Text style={styles.stageBreakdownCount}>{s.count}</Text>
                  <Text style={styles.stageBreakdownLabel}>{stageInfo?.tr ?? s.stage}</Text>
                </View>
              );
            })}
          </View>
        </View>
      )}

      <TouchableOpacity style={styles.commissionsLink} onPress={() => router.push('/admin/program-commissions')}>
        <View style={styles.commissionsLinkContent}>
          <View style={styles.commissionsIconContainer}>
            <DollarSign color={Colors.secondary} size={24} />
          </View>
          <View style={styles.commissionsTextContainer}>
            <Text style={styles.commissionsLinkTitle}>Program Komisyonları</Text>
            <Text style={styles.commissionsLinkSubtitle}>Tüm programlar için komisyon oranlarını düzenle</Text>
          </View>
        </View>
        <ChevronRight color={Colors.textMuted} size={24} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.commissionsLink} onPress={() => router.push('/admin/social-media')} testID="social-media-button">
        <View style={styles.commissionsLinkContent}>
          <View style={[styles.commissionsIconContainer, { backgroundColor: '#E4405F20' }]}>
            <Share2 color="#E4405F" size={24} />
          </View>
          <View style={styles.commissionsTextContainer}>
            <Text style={styles.commissionsLinkTitle}>Sosyal Medya Linkleri</Text>
            <Text style={styles.commissionsLinkSubtitle}>Instagram, LinkedIn, Twitter ve Facebook linklerini yönet</Text>
          </View>
        </View>
        <ChevronRight color={Colors.textMuted} size={24} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.commissionsLink} onPress={() => router.push('/admin/team')} testID="team-management-button">
        <View style={styles.commissionsLinkContent}>
          <View style={[styles.commissionsIconContainer, { backgroundColor: Colors.info + '20' }]}>
            <Briefcase color={Colors.info} size={24} />
          </View>
          <View style={styles.commissionsTextContainer}>
            <Text style={styles.commissionsLinkTitle}>Danışman Ekibi</Text>
            <Text style={styles.commissionsLinkSubtitle}>Ekip üyelerini ekle, düzenle ve yönet</Text>
          </View>
        </View>
        <ChevronRight color={Colors.textMuted} size={24} />
      </TouchableOpacity>

      {pendingNameChanges.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>İsim Değişikliği Talepleri</Text>
            <View style={[styles.pendingBadge, { backgroundColor: Colors.info }]}>
              <Text style={styles.pendingBadgeText}>{pendingNameChanges.length}</Text>
            </View>
          </View>
          {pendingNameChanges.map((request) => (
            <View key={request.id} style={styles.nameChangeCard}>
              <View style={styles.nameChangeInfo}>
                <View style={styles.nameChangeAvatar}>
                  <UserCog size={20} color={Colors.info} />
                </View>
                <View style={styles.nameChangeDetails}>
                  <Text style={styles.nameChangeAmbassador}>{request.ambassadorName}</Text>
                  <View style={styles.nameChangeNames}>
                    <Text style={styles.nameChangeCurrent}>{request.currentFirstName} {request.currentLastName}</Text>
                    <ArrowRight size={14} color={Colors.textMuted} />
                    <Text style={styles.nameChangeRequested}>{request.requestedFirstName} {request.requestedLastName}</Text>
                  </View>
                  <Text style={styles.nameChangeDate}>Talep: {formatDate(request.requestDate)}</Text>
                </View>
              </View>
              <View style={styles.nameChangeActions}>
                <TouchableOpacity style={[styles.actionButton, styles.approveButton]} onPress={() => handleApproveNameChange(request)}>
                  <Check color="#FFFFFF" size={20} />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionButton, styles.rejectButton]} onPress={() => handleRejectNameChange(request)}>
                  <X color="#FFFFFF" size={20} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      {pendingBanks.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Onay Bekleyen Banka Hesapları</Text>
            <View style={[styles.pendingBadge, { backgroundColor: Colors.info }]}>
              <Text style={styles.pendingBadgeText}>{pendingBanks.length}</Text>
            </View>
          </View>
          {pendingBanks.map((bank) => (
            <View key={bank.id} style={styles.pendingCard}>
              <View style={styles.pendingInfo}>
                <View style={[styles.pendingAvatar, { backgroundColor: Colors.info + '20' }]}>
                  <CreditCard size={20} color={Colors.info} />
                </View>
                <View style={styles.pendingDetails}>
                  <Text style={styles.pendingName}>{bank.ambassadorName}</Text>
                  <Text style={styles.pendingEmail}>{bank.bankName}</Text>
                  <Text style={styles.pendingDate}>{bank.iban}</Text>
                </View>
              </View>
              <View style={styles.pendingActions}>
                <TouchableOpacity style={[styles.actionButton, styles.approveButton]} onPress={() => handleApproveBankAccount(bank.id)}>
                  <Check color="#FFFFFF" size={20} />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionButton, styles.rejectButton]} onPress={() => handleRejectBankAccount(bank.id)}>
                  <X color="#FFFFFF" size={20} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      {pendingWithdrawals.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Onay Bekleyen Çekim Talepleri</Text>
            <View style={[styles.pendingBadge, { backgroundColor: Colors.secondary }]}>
              <Text style={styles.pendingBadgeText}>{pendingWithdrawals.length}</Text>
            </View>
          </View>
          {pendingWithdrawals.map((withdrawal) => (
            <View key={withdrawal.id} style={styles.pendingCard}>
              <View style={styles.pendingInfo}>
                <View style={[styles.pendingAvatar, { backgroundColor: Colors.secondary + '20' }]}>
                  <Wallet size={20} color={Colors.secondary} />
                </View>
                <View style={styles.pendingDetails}>
                  <Text style={styles.pendingName}>{withdrawal.ambassadorName}</Text>
                  <Text style={styles.pendingEmail}>${withdrawal.amountUSD.toLocaleString()} (₺{withdrawal.amountTRY.toLocaleString()})</Text>
                  <Text style={styles.pendingDate}>{withdrawal.bankName} - {withdrawal.iban}</Text>
                  <Text style={styles.pendingDate}>Tarih: {formatDate(withdrawal.createdAt)}</Text>
                </View>
              </View>
              <View style={styles.pendingActions}>
                <TouchableOpacity style={[styles.actionButton, styles.approveButton]} onPress={() => handleApproveWithdrawal(withdrawal.id)}>
                  <Check color="#FFFFFF" size={20} />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionButton, styles.rejectButton]} onPress={() => handleRejectWithdrawal(withdrawal.id)}>
                  <X color="#FFFFFF" size={20} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      {pendingList.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Onay Bekleyen Elçiler</Text>
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingBadgeText}>{pendingList.length}</Text>
            </View>
          </View>
          {pendingList.map(renderPendingAmbassador)}
        </View>
      )}
    </>
  );

  const renderStudentsSection = () => (
    <>
      <View style={styles.searchContainer}>
        <Search color={Colors.textMuted} size={20} />
        <TextInput
          style={styles.searchInput}
          placeholder="Öğrenci ara..."
          placeholderTextColor={Colors.textMuted}
          value={studentSearchQuery}
          onChangeText={setStudentSearchQuery}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterChipsScroll} contentContainerStyle={styles.filterChipsContainer}>
        {[{ value: 'all', label: 'Tümü' }, ...STAGE_OPTIONS].map(opt => (
          <TouchableOpacity
            key={opt.value}
            style={[styles.filterChip, studentStageFilter === opt.value && styles.filterChipActive]}
            onPress={() => setStudentStageFilter(opt.value)}
          >
            <Text style={[styles.filterChipText, studentStageFilter === opt.value && styles.filterChipTextActive]}>{opt.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {allStudentsQuery.isLoading ? (
        <ActivityIndicator size="small" color={Colors.primary} style={{ marginVertical: 20 }} />
      ) : allStudents.length === 0 ? (
        <Text style={styles.emptyText}>Öğrenci bulunamadı.</Text>
      ) : (
        <View style={styles.studentsList}>
          {allStudents.map(renderStudentCard)}
        </View>
      )}
    </>
  );

  const renderAnnouncementsSection = () => (
    <>
      <TouchableOpacity
        style={styles.addAnnouncementButton}
        onPress={() => setAnnouncementModalVisible(true)}
      >
        <LinearGradient colors={[Colors.secondary, '#F5D76E']} style={styles.addAnnouncementGradient}>
          <Plus color="#000" size={20} />
          <Text style={styles.addAnnouncementText}>Yeni Duyuru</Text>
        </LinearGradient>
      </TouchableOpacity>

      {announcementsQuery.isLoading ? (
        <ActivityIndicator size="small" color={Colors.primary} style={{ marginVertical: 20 }} />
      ) : announcements.length === 0 ? (
        <Text style={styles.emptyText}>Henüz duyuru bulunmuyor.</Text>
      ) : (
        <View style={styles.announcementsList}>
          {announcements.map(ann => (
            <View key={ann.id} style={styles.announcementCard}>
              <View style={styles.announcementInfo}>
                <View style={styles.announcementIconContainer}>
                  <Megaphone color={Colors.secondary} size={20} />
                </View>
                <View style={styles.announcementDetails}>
                  <Text style={styles.announcementTitle}>{ann.title}</Text>
                  <Text style={styles.announcementPreview} numberOfLines={2}>{ann.preview}</Text>
                  <Text style={styles.announcementDate}>{formatDate(ann.createdAt)}</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.deleteAnnouncementButton}
                onPress={() => handleDeleteAnnouncement(ann.id, ann.title)}
              >
                <Trash2 color={Colors.error} size={18} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </>
  );

  const renderAmbassadorsSection = () => (
    <>
      <View style={styles.searchContainer}>
        <Search color={Colors.textMuted} size={20} />
        <TextInput
          style={styles.searchInput}
          placeholder="İsim, e-posta veya kod ile ara..."
          placeholderTextColor={Colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          testID="ambassador-search"
        />
      </View>
      {allAmbassadorsQuery.isLoading ? (
        <ActivityIndicator size="small" color={Colors.primary} style={{ marginVertical: 20 }} />
      ) : (
        <View style={styles.ambassadorList}>
          {allAmbassadors.map(renderAmbassadorItem)}
          {allAmbassadors.length === 0 && <Text style={styles.emptyText}>Aktif elçi bulunamadı.</Text>}
        </View>
      )}
    </>
  );

  const renderStudentDetailModal = () => {
    const detail = studentDetailQuery.data;
    const isLoadingDetail = studentDetailQuery.isLoading;

    return (
      <Modal visible={studentDetailModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Öğrenci Detayı</Text>
              <TouchableOpacity onPress={() => { setStudentDetailModalVisible(false); setSelectedStudentId(null); }}>
                <X color={Colors.text} size={24} />
              </TouchableOpacity>
            </View>

            {isLoadingDetail ? (
              <ActivityIndicator size="large" color={Colors.primary} style={{ marginVertical: 40 }} />
            ) : detail ? (
              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                <View style={styles.detailSection}>
                  <Text style={styles.detailName}>{detail.name}</Text>
                  <Text style={styles.detailSubInfo}>{detail.email} • {detail.phone}</Text>
                  <Text style={styles.detailSubInfo}>Elçi: {detail.ambassadorName}</Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Mevcut Aşama</Text>
                  <View style={[styles.currentStageBadge, { backgroundColor: (STAGE_LABELS[detail.stage as StudentStage]?.color ?? '#9CA3AF') + '20' }]}>
                    <Text style={[styles.currentStageText, { color: STAGE_LABELS[detail.stage as StudentStage]?.color ?? '#9CA3AF' }]}>
                      {STAGE_LABELS[detail.stage as StudentStage]?.tr ?? detail.stage}
                    </Text>
                  </View>
                </View>

                {detail.pipeline.length > 0 && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>Geçmiş</Text>
                    {detail.pipeline.map((p, idx) => {
                      const stageInfo = STAGE_LABELS[p.stage as StudentStage];
                      return (
                        <View key={idx} style={styles.pipelineItem}>
                          <View style={[styles.pipelineDot, { backgroundColor: stageInfo?.color ?? '#9CA3AF' }]} />
                          <View style={styles.pipelineInfo}>
                            <Text style={styles.pipelineStage}>{stageInfo?.tr ?? p.stage}</Text>
                            <Text style={styles.pipelineDate}>{formatDate(p.date)}</Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}

                {detail.commissions.length > 0 && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>Komisyonlar</Text>
                    {detail.commissions.map(c => (
                      <View key={c.id} style={styles.commissionItem}>
                        <Text style={styles.commissionStage}>{STAGE_LABELS[c.stage as StudentStage]?.tr ?? c.stage}</Text>
                        <View style={styles.commissionRight}>
                          <Text style={styles.commissionAmount}>${c.amountUSD}</Text>
                          <View style={[styles.commissionStatusBadge, { backgroundColor: c.status === 'completed' ? Colors.success + '20' : c.status === 'cancelled' ? Colors.error + '20' : Colors.warning + '20' }]}>
                            <Text style={[styles.commissionStatusText, { color: c.status === 'completed' ? Colors.success : c.status === 'cancelled' ? Colors.error : Colors.warning }]}>
                              {c.status === 'completed' ? 'Tamamlandı' : c.status === 'cancelled' ? 'İptal' : 'Bekliyor'}
                            </Text>
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Aşamayı Güncelle</Text>
                  <TouchableOpacity
                    style={styles.stageDropdown}
                    onPress={() => setStageDropdownOpen(!stageDropdownOpen)}
                  >
                    <Text style={styles.stageDropdownText}>
                      {selectedNewStage ? STAGE_LABELS[selectedNewStage]?.tr ?? selectedNewStage : 'Yeni aşama seçin...'}
                    </Text>
                    <ChevronDown color={Colors.textMuted} size={20} />
                  </TouchableOpacity>

                  {stageDropdownOpen && (
                    <View style={styles.stageDropdownList}>
                      {STAGE_OPTIONS.map(opt => (
                        <TouchableOpacity
                          key={opt.value}
                          style={[styles.stageDropdownItem, selectedNewStage === opt.value && styles.stageDropdownItemActive]}
                          onPress={() => {
                            setSelectedNewStage(opt.value);
                            setStageDropdownOpen(false);
                          }}
                        >
                          <View style={[styles.stageDot, { backgroundColor: STAGE_LABELS[opt.value]?.color ?? '#9CA3AF' }]} />
                          <Text style={[styles.stageDropdownItemText, selectedNewStage === opt.value && { color: Colors.secondary }]}>{opt.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  <TouchableOpacity
                    style={[styles.updateStageButton, !selectedNewStage && styles.updateStageButtonDisabled]}
                    onPress={handleUpdateStudentStage}
                    disabled={!selectedNewStage || updateStudentStageMutation.isPending}
                  >
                    {updateStudentStageMutation.isPending ? (
                      <ActivityIndicator size="small" color="#000" />
                    ) : (
                      <Text style={[styles.updateStageButtonText, !selectedNewStage && { color: Colors.textMuted }]}>Aşamayı Güncelle</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            ) : (
              <Text style={styles.emptyText}>Öğrenci bilgisi yüklenemedi.</Text>
            )}
          </View>
        </View>
      </Modal>
    );
  };

  const renderAnnouncementModal = () => (
    <Modal visible={announcementModalVisible} animationType="slide" transparent>
      <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Yeni Duyuru</Text>
            <TouchableOpacity onPress={() => setAnnouncementModalVisible(false)}>
              <X color={Colors.text} size={24} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            <Text style={styles.inputLabel}>Başlık</Text>
            <TextInput
              style={styles.modalInput}
              value={newAnnouncementTitle}
              onChangeText={setNewAnnouncementTitle}
              placeholder="Duyuru başlığı"
              placeholderTextColor={Colors.textMuted}
            />
            <Text style={styles.inputLabel}>Önizleme</Text>
            <TextInput
              style={styles.modalInput}
              value={newAnnouncementPreview}
              onChangeText={setNewAnnouncementPreview}
              placeholder="Kısa açıklama"
              placeholderTextColor={Colors.textMuted}
            />
            <Text style={styles.inputLabel}>İçerik</Text>
            <TextInput
              style={[styles.modalInput, styles.modalInputMultiline]}
              value={newAnnouncementContent}
              onChangeText={setNewAnnouncementContent}
              placeholder="Duyuru içeriği..."
              placeholderTextColor={Colors.textMuted}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
            <Text style={styles.inputLabel}>Görsel URL (Opsiyonel)</Text>
            <TextInput
              style={styles.modalInput}
              value={newAnnouncementImageUrl}
              onChangeText={setNewAnnouncementImageUrl}
              placeholder="https://..."
              placeholderTextColor={Colors.textMuted}
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={styles.createAnnouncementButton}
              onPress={handleCreateAnnouncement}
              disabled={createAnnouncementMutation.isPending}
            >
              <LinearGradient colors={[Colors.secondary, '#F5D76E']} style={styles.createAnnouncementGradient}>
                {createAnnouncementMutation.isPending ? (
                  <ActivityIndicator size="small" color="#000" />
                ) : (
                  <Text style={styles.createAnnouncementButtonText}>Duyuruyu Yayınla</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  const renderPointsModal = () => (
    <Modal visible={pointsModalVisible} animationType="fade" transparent>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { maxHeight: 400 }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Puan Ekle/Çıkar</Text>
            <TouchableOpacity onPress={() => setPointsModalVisible(false)}>
              <X color={Colors.text} size={24} />
            </TouchableOpacity>
          </View>
          <View style={styles.modalBody}>
            <Text style={styles.pointsAmbassadorLabel}>{pointsAmbassadorName}</Text>
            <Text style={styles.inputLabel}>Puan (negatif değer çıkarır)</Text>
            <TextInput
              style={styles.modalInput}
              value={pointsAmount}
              onChangeText={setPointsAmount}
              placeholder="Örn: 50 veya -20"
              placeholderTextColor={Colors.textMuted}
              keyboardType="numeric"
            />
            <Text style={styles.inputLabel}>Sebep</Text>
            <TextInput
              style={styles.modalInput}
              value={pointsReason}
              onChangeText={setPointsReason}
              placeholder="Puan değişikliği sebebi"
              placeholderTextColor={Colors.textMuted}
            />
            <TouchableOpacity
              style={styles.createAnnouncementButton}
              onPress={handleUpdateCompassPoints}
              disabled={updateCompassPointsMutation.isPending}
            >
              <LinearGradient colors={[Colors.secondary, '#F5D76E']} style={styles.createAnnouncementGradient}>
                {updateCompassPointsMutation.isPending ? (
                  <ActivityIndicator size="small" color="#000" />
                ) : (
                  <Text style={styles.createAnnouncementButtonText}>Kaydet</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderTypeModal = () => (
    <Modal visible={typeModalVisible} animationType="fade" transparent>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { maxHeight: 450 }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Seviye Değiştir</Text>
            <TouchableOpacity onPress={() => setTypeModalVisible(false)}>
              <X color={Colors.text} size={24} />
            </TouchableOpacity>
          </View>
          <View style={styles.modalBody}>
            <Text style={styles.pointsAmbassadorLabel}>{typeAmbassadorName}</Text>
            <View style={styles.typeOptionsGrid}>
              {TYPE_OPTIONS.map(opt => {
                const isSelected = selectedType === opt.value;
                const typeLabel = AMBASSADOR_TYPE_LABELS[opt.value];
                return (
                  <TouchableOpacity
                    key={opt.value}
                    style={[styles.typeOption, isSelected && { borderColor: typeLabel.color, borderWidth: 2 }]}
                    onPress={() => setSelectedType(opt.value)}
                  >
                    <View style={[styles.typeOptionDot, { backgroundColor: typeLabel.color }]} />
                    <Text style={[styles.typeOptionText, isSelected && { color: typeLabel.color }]}>{opt.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <TouchableOpacity
              style={styles.createAnnouncementButton}
              onPress={handleUpdateAmbassadorType}
              disabled={updateAmbassadorTypeMutation.isPending}
            >
              <LinearGradient colors={[Colors.secondary, '#F5D76E']} style={styles.createAnnouncementGradient}>
                {updateAmbassadorTypeMutation.isPending ? (
                  <ActivityIndicator size="small" color="#000" />
                ) : (
                  <Text style={styles.createAnnouncementButtonText}>Kaydet</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.gradient.start, Colors.gradient.middle, Colors.gradient.end]}
        style={styles.headerGradient}
      >
        <SafeAreaView edges={['top']}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Shield color={Colors.secondary} size={28} />
              <Text style={styles.headerTitle}>Admin Panel</Text>
            </View>
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={() => router.push('/admin/program-commissions')}
              testID="program-commissions-button"
            >
              <Settings color={Colors.text} size={24} />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <View style={styles.sectionTabs}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sectionTabsContent}>
          {sections.map(sec => {
            const isActive = activeSection === sec.id;
            const IconComp = sec.icon;
            return (
              <TouchableOpacity
                key={sec.id}
                style={[styles.sectionTab, isActive && styles.sectionTabActive]}
                onPress={() => setActiveSection(sec.id)}
              >
                <IconComp color={isActive ? Colors.secondary : Colors.textMuted} size={16} />
                <Text style={[styles.sectionTabText, isActive && styles.sectionTabTextActive]}>{sec.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={statsQuery.isRefetching} onRefresh={refetchAll} tintColor={Colors.primary} />
        }
      >
        {statsQuery.isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Veriler yükleniyor...</Text>
          </View>
        ) : (
          <>
            {activeSection === 'overview' && renderOverviewSection()}
            {activeSection === 'students' && renderStudentsSection()}
            {activeSection === 'announcements' && renderAnnouncementsSection()}
            {activeSection === 'ambassadors' && renderAmbassadorsSection()}
          </>
        )}
      </ScrollView>

      {renderStudentDetailModal()}
      {renderAnnouncementModal()}
      {renderPointsModal()}
      {renderTypeModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerGradient: {
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTabs: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  sectionTabsContent: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  sectionTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surfaceLight,
  },
  sectionTabActive: {
    backgroundColor: Colors.secondary + '20',
    borderWidth: 1,
    borderColor: Colors.secondary + '50',
  },
  sectionTabText: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.textMuted,
  },
  sectionTabTextActive: {
    color: Colors.secondary,
    fontWeight: '600' as const,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    width: '48%',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  enhancedStatsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  enhancedStatCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    borderLeftWidth: 3,
  },
  enhancedStatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  enhancedStatLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  enhancedStatValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  commissionsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.secondary + '40',
  },
  commissionsLinkContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  commissionsIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: Colors.secondary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  commissionsTextContainer: {
    flex: 1,
  },
  commissionsLinkTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  commissionsLinkSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 16,
  },
  pendingBadge: {
    backgroundColor: Colors.warning,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 12,
    marginBottom: 16,
  },
  pendingBadgeText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#000',
  },
  pendingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  pendingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  pendingAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  pendingAvatarText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  pendingDetails: {
    flex: 1,
  },
  pendingName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  pendingEmail: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  pendingDate: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  pendingReferral: {
    fontSize: 12,
    color: Colors.secondary,
    marginTop: 2,
  },
  pendingActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  approveButton: {
    backgroundColor: Colors.success,
  },
  rejectButton: {
    backgroundColor: Colors.error,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    fontSize: 15,
    color: Colors.text,
  },
  ambassadorList: {
    gap: 12,
  },
  ambassadorItem: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 2,
  },
  ambassadorMainArea: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ambassadorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  ambassadorAvatarText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  ambassadorInfo: {
    flex: 1,
  },
  ambassadorName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  ambassadorEmail: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  ambassadorMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  ambassadorActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  miniActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  miniActionText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  ambassadorCode: {
    fontSize: 12,
    color: Colors.textMuted,
    fontFamily: 'monospace',
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingVertical: 20,
  },
  accessDenied: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  accessDeniedTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
    marginTop: 20,
    marginBottom: 10,
  },
  accessDeniedText: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  nameChangeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.info + '30',
  },
  nameChangeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  nameChangeAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.info + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  nameChangeDetails: {
    flex: 1,
  },
  nameChangeAmbassador: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 6,
  },
  nameChangeNames: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  nameChangeCurrent: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  nameChangeRequested: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.info,
  },
  nameChangeDate: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  nameChangeActions: {
    flexDirection: 'row',
    gap: 10,
  },
  filterChipsScroll: {
    marginBottom: 16,
  },
  filterChipsContainer: {
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.secondary + '20',
    borderColor: Colors.secondary,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.textMuted,
  },
  filterChipTextActive: {
    color: Colors.secondary,
    fontWeight: '600' as const,
  },
  studentsList: {
    gap: 10,
  },
  studentCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
  },
  studentCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  studentCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  studentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  studentAvatarText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  studentCardInfo: {
    flex: 1,
  },
  studentCardName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  studentCardAmbassador: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  stageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  stageDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  stageBadgeText: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  topAmbassadorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  rankBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rankText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.textSecondary,
  },
  topAmbassadorInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  topAmbassadorName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  topAmbassadorStudents: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.secondary,
  },
  stageBreakdownGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  stageBreakdownItem: {
    width: '47%',
    backgroundColor: Colors.surface,
    borderRadius: 10,
    padding: 12,
    borderLeftWidth: 3,
  },
  stageBreakdownCount: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  stageBreakdownLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  addAnnouncementButton: {
    marginBottom: 20,
    borderRadius: 14,
    overflow: 'hidden',
  },
  addAnnouncementGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  addAnnouncementText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#000',
  },
  announcementsList: {
    gap: 12,
  },
  announcementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
  },
  announcementInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  announcementIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.secondary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  announcementDetails: {
    flex: 1,
  },
  announcementTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 3,
  },
  announcementPreview: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  announcementDate: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  deleteAnnouncementButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.error + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    minHeight: 300,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  modalBody: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginBottom: 6,
    marginTop: 12,
  },
  modalInput: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalInputMultiline: {
    minHeight: 100,
    textAlignVertical: 'top' as const,
  },
  detailSection: {
    marginBottom: 20,
  },
  detailName: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  detailSubInfo: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  detailSectionTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 10,
  },
  currentStageBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  currentStageText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  pipelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  pipelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  pipelineInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  pipelineStage: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.text,
  },
  pipelineDate: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  commissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  commissionStage: {
    fontSize: 14,
    color: Colors.text,
    flex: 1,
  },
  commissionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  commissionAmount: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  commissionStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  commissionStatusText: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  stageDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 10,
  },
  stageDropdownText: {
    fontSize: 15,
    color: Colors.textSecondary,
  },
  stageDropdownList: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 14,
    overflow: 'hidden',
  },
  stageDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  stageDropdownItemActive: {
    backgroundColor: Colors.secondary + '10',
  },
  stageDropdownItemText: {
    fontSize: 14,
    color: Colors.text,
  },
  updateStageButton: {
    backgroundColor: Colors.secondary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  updateStageButtonDisabled: {
    backgroundColor: Colors.surfaceLight,
  },
  updateStageButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#000',
  },
  createAnnouncementButton: {
    marginTop: 16,
    borderRadius: 14,
    overflow: 'hidden',
  },
  createAnnouncementGradient: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  createAnnouncementButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#000',
  },
  pointsAmbassadorLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  typeOptionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 12,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  typeOptionDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  typeOptionText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.text,
  },
});
