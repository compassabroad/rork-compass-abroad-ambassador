import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Tent,
  GraduationCap,
  BookOpen,
  School,
  Languages,
  Briefcase,
  Building,
  Sun,
  DollarSign,
  Star,
  Clock,
  MapPin,
  FileText,
  Users,
  Laptop,
  Leaf,
  Award,
} from 'lucide-react-native';

import Colors from '@/constants/colors';
import { useExchangeRate } from '@/contexts/ExchangeRateContext';
import { trpc } from '@/lib/trpc';
import { Program } from '@/types';

const ICON_MAP: Record<string, React.ComponentType<{ size: number; color: string }>> = {
  tent: Tent,
  'graduation-cap': GraduationCap,
  'book-open': BookOpen,
  school: School,
  languages: Languages,
  briefcase: Briefcase,
  building: Building,
  sun: Sun,
  'file-text': FileText,
  users: Users,
  laptop: Laptop,
  'maple-leaf': Leaf,
  award: Award,
};

function ProgramCard({ program, exchangeRate }: { program: Program; exchangeRate: number }) {
  const [expanded, setExpanded] = useState(false);
  const IconComponent = ICON_MAP[program.icon] || BookOpen;

  return (
    <TouchableOpacity
      style={styles.programCard}
      onPress={() => setExpanded(!expanded)}
      activeOpacity={0.8}
    >
      <View style={styles.programHeader}>
        <View style={styles.programIconContainer}>
          <IconComponent size={24} color={Colors.secondary} />
        </View>
        <View style={styles.programInfo}>
          <Text style={styles.programName}>{program.name}</Text>
          <Text style={styles.programNameEn}>{program.nameEn}</Text>
        </View>
      </View>

      <Text style={styles.programDescription}>{program.description}</Text>

      <View style={styles.programMeta}>
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Clock size={14} color={Colors.textSecondary} />
            <Text style={styles.metaText}>{program.duration}</Text>
          </View>
          <View style={styles.metaItem}>
            <MapPin size={14} color={Colors.textSecondary} />
            <Text style={styles.metaText}>{program.countries.join(', ')}</Text>
          </View>
        </View>
      </View>

      <View style={styles.commissionSection}>
        <View style={styles.commissionItem}>
          <View style={[styles.commissionIcon, { backgroundColor: Colors.success + '20' }]}>
            <DollarSign size={16} color={Colors.success} />
          </View>
          <View>
            <Text style={styles.commissionLabel}>Komisyon</Text>
            <Text style={styles.commissionValue}>${program.commission}</Text>
            <Text style={styles.commissionTRY}>₺{(program.commission * exchangeRate).toLocaleString('tr-TR')}</Text>
          </View>
        </View>
        
        <View style={styles.commissionDivider} />
        
        <View style={styles.commissionItem}>
          <View style={[styles.commissionIcon, { backgroundColor: Colors.secondary + '20' }]}>
            <Star size={16} color={Colors.secondary} />
          </View>
          <View>
            <Text style={styles.commissionLabel}>Puan</Text>
            <Text style={styles.commissionValue}>{program.points}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function ProgramsScreen() {
  const insets = useSafeAreaInsets();
  const { rate: exchangeRate } = useExchangeRate();

  const programsQuery = trpc.programs.list.useQuery();
  const programs = (programsQuery.data ?? []) as Program[];

  const totalCommission = programs.reduce((sum, p) => sum + p.commission, 0);
  const avgCommission = programs.length > 0 ? Math.round(totalCommission / programs.length) : 0;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.gradient.middle, Colors.background]}
        style={[styles.header, { paddingTop: insets.top + 16 }]}
      >
        <Text style={styles.headerTitle}>Programlar</Text>
        <Text style={styles.headerSubtitle}>{programs.length} eğitim programı</Text>
      </LinearGradient>

      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{programs.length}</Text>
          <Text style={styles.summaryLabel}>Program</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>${avgCommission}</Text>
          <Text style={styles.summaryLabel}>Ort. Komisyon</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>15+</Text>
          <Text style={styles.summaryLabel}>Ülke</Text>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {programs.map((program) => (
          <ProgramCard key={program.id} program={program} exchangeRate={exchangeRate} />
        ))}
        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  summaryContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  summaryCard: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: Colors.border,
    marginVertical: 4,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
  },
  programCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  programHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  programIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.primary + '30',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  programInfo: {
    flex: 1,
  },
  programName: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 2,
  },
  programNameEn: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  programDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  programMeta: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 20,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  commissionSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commissionItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  commissionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commissionLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  commissionValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  commissionTRY: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  commissionDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.border,
    marginHorizontal: 16,
  },
});
