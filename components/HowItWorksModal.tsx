import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  X,
  DollarSign,
  Star,
  CheckCircle,
  UserPlus,
  FileText,
  Send,
  MessageSquare,
  Stamp,
  Plane,
  Award,
  TrendingUp,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import Colors from '@/constants/colors';
import { trpc } from '@/lib/trpc';

interface HowItWorksModalProps {
  visible: boolean;
  onClose: () => void;
}

const PIPELINE_STAGES = [
  { stage: 'Kayıt', icon: UserPlus, points: 10, description: 'Öğrenci sisteme kaydedildiğinde' },
  { stage: 'Belgeler', icon: FileText, points: 20, description: 'Belgeler tamamlandığında' },
  { stage: 'Başvuru', icon: Send, points: 30, description: 'Program başvurusu yapıldığında' },
  { stage: 'Mülakat', icon: MessageSquare, points: 40, description: 'Mülakat tamamlandığında' },
  { stage: 'Vize', icon: Stamp, points: 50, description: 'Vize onaylandığında' },
  { stage: 'Gidiş', icon: Plane, points: 100, description: 'Öğrenci gittiğinde (Ana Komisyon)' },
];

export default function HowItWorksModal({ visible, onClose }: HowItWorksModalProps) {
  const insets = useSafeAreaInsets();
  const programsQuery = trpc.programs.list.useQuery(undefined, { enabled: visible });
  const PROGRAMS = programsQuery.data ?? [];

  const handleClose = async () => {
    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <LinearGradient
          colors={[Colors.gradient.start, Colors.gradient.middle, Colors.background]}
          style={styles.gradient}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Nasıl Çalışır?</Text>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <X size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.content}
            contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 20 }]}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIcon, { backgroundColor: Colors.secondary + '20' }]}>
                  <DollarSign size={20} color={Colors.secondary} />
                </View>
                <Text style={styles.sectionTitle}>Program Komisyonları</Text>
              </View>
              <Text style={styles.sectionDescription}>
                Her program için farklı komisyon oranları uygulanır. Öğrenci gittiğinde ana komisyonu kazanırsınız.
              </Text>
              <View style={styles.commissionList}>
                {PROGRAMS.slice(0, 6).map((program: any) => (
                  <View key={program.id} style={styles.commissionItem}>
                    <Text style={styles.commissionName}>{program.name}</Text>
                    <View style={styles.commissionValues}>
                      <Text style={styles.commissionUSD}>${program.commission}</Text>
                      <Text style={styles.commissionPoints}>+{program.points} puan</Text>
                    </View>
                  </View>
                ))}
                <View style={styles.morePrograms}>
                  <Text style={styles.moreProgramsText}>+{Math.max(0, PROGRAMS.length - 6)} program daha</Text>
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIcon, { backgroundColor: Colors.info + '20' }]}>
                  <TrendingUp size={20} color={Colors.info} />
                </View>
                <Text style={styles.sectionTitle}>Pipeline Aşamaları</Text>
              </View>
              <Text style={styles.sectionDescription}>
                Öğrenci her aşamada ilerlediğinde Compass Points kazanırsınız.
              </Text>
              <View style={styles.pipelineList}>
                {PIPELINE_STAGES.map((stage, index) => (
                  <View key={stage.stage} style={styles.pipelineItem}>
                    <View style={styles.pipelineLeft}>
                      <View style={[
                        styles.pipelineIcon,
                        index === PIPELINE_STAGES.length - 1 && { backgroundColor: Colors.success }
                      ]}>
                        <stage.icon size={16} color={Colors.text} />
                      </View>
                      {index < PIPELINE_STAGES.length - 1 && <View style={styles.pipelineLine} />}
                    </View>
                    <View style={styles.pipelineContent}>
                      <View style={styles.pipelineHeader}>
                        <Text style={styles.pipelineName}>{stage.stage}</Text>
                        <View style={styles.pipelinePointsBadge}>
                          <Star size={12} color={Colors.secondary} />
                          <Text style={styles.pipelinePoints}>+{stage.points}</Text>
                        </View>
                      </View>
                      <Text style={styles.pipelineDescription}>{stage.description}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIcon, { backgroundColor: Colors.primary + '20' }]}>
                  <Star size={20} color={Colors.primaryLight} />
                </View>
                <Text style={styles.sectionTitle}>Compass Points</Text>
              </View>
              <Text style={styles.sectionDescription}>
                Compass Points, elçi seviyenizi belirler ve özel avantajlar sağlar.
              </Text>
              <View style={styles.pointsInfo}>
                <View style={styles.pointsRow}>
                  <View style={[styles.tierBadge, { backgroundColor: '#CD7F32' + '20' }]}>
                    <Award size={16} color="#CD7F32" />
                    <Text style={[styles.tierText, { color: '#CD7F32' }]}>Bronz</Text>
                  </View>
                  <Text style={styles.tierRequirement}>0 - 999 puan</Text>
                </View>
                <View style={styles.pointsRow}>
                  <View style={[styles.tierBadge, { backgroundColor: '#C0C0C0' + '20' }]}>
                    <Award size={16} color="#C0C0C0" />
                    <Text style={[styles.tierText, { color: '#C0C0C0' }]}>Gümüş</Text>
                  </View>
                  <Text style={styles.tierRequirement}>1,000 - 2,499 puan</Text>
                </View>
                <View style={styles.pointsRow}>
                  <View style={[styles.tierBadge, { backgroundColor: '#FFD700' + '20' }]}>
                    <Award size={16} color="#FFD700" />
                    <Text style={[styles.tierText, { color: '#FFD700' }]}>Altın</Text>
                  </View>
                  <Text style={styles.tierRequirement}>2,500 - 4,999 puan</Text>
                </View>
                <View style={styles.pointsRow}>
                  <View style={[styles.tierBadge, { backgroundColor: '#E5E4E2' + '20' }]}>
                    <Award size={16} color="#E5E4E2" />
                    <Text style={[styles.tierText, { color: '#E5E4E2' }]}>Platin</Text>
                  </View>
                  <Text style={styles.tierRequirement}>5,000 - 9,999 puan</Text>
                </View>
                <View style={styles.pointsRow}>
                  <View style={[styles.tierBadge, { backgroundColor: '#B9F2FF' + '20' }]}>
                    <Award size={16} color="#B9F2FF" />
                    <Text style={[styles.tierText, { color: '#B9F2FF' }]}>Elmas</Text>
                  </View>
                  <Text style={styles.tierRequirement}>10,000+ puan</Text>
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIcon, { backgroundColor: Colors.success + '20' }]}>
                  <CheckCircle size={20} color={Colors.success} />
                </View>
                <Text style={styles.sectionTitle}>Alt Elçi Komisyonu</Text>
              </View>
              <Text style={styles.sectionDescription}>
                Davet ettiğiniz elçilerin kazandığı komisyonlardan %10 pay alırsınız. Ağınızı büyütün, pasif gelir elde edin!
              </Text>
              <View style={styles.referralInfo}>
                <Text style={styles.referralText}>
                  Alt elçiniz $1,000 kazandığında → Siz $100 kazanırsınız
                </Text>
              </View>
            </View>
          </ScrollView>
        </LinearGradient>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  sectionDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
    marginLeft: 48,
  },
  commissionList: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  commissionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  commissionName: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
  },
  commissionValues: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  commissionUSD: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.secondary,
  },
  commissionPoints: {
    fontSize: 12,
    color: Colors.info,
    fontWeight: '500',
  },
  morePrograms: {
    paddingTop: 12,
    alignItems: 'center',
  },
  moreProgramsText: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  pipelineList: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pipelineItem: {
    flexDirection: 'row',
  },
  pipelineLeft: {
    alignItems: 'center',
    marginRight: 12,
  },
  pipelineIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pipelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: Colors.border,
    marginVertical: 4,
  },
  pipelineContent: {
    flex: 1,
    paddingBottom: 16,
  },
  pipelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  pipelineName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  pipelinePointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.secondary + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  pipelinePoints: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.secondary,
  },
  pipelineDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  pointsInfo: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  pointsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  tierText: {
    fontSize: 14,
    fontWeight: '600',
  },
  tierRequirement: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  referralInfo: {
    backgroundColor: Colors.success + '15',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.success + '30',
  },
  referralText: {
    fontSize: 14,
    color: Colors.success,
    fontWeight: '500',
    textAlign: 'center',
  },
});
