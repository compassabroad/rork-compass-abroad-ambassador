import React, { useState, useRef } from 'react';
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
  ChevronRight,
  MapPin,
  Calendar,
  Phone,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';

import Colors from '@/constants/colors';
import { MOCK_STUDENTS, PROGRAMS } from '@/mocks/data';
import { StudentStage, STAGE_LABELS, Student } from '@/types';

const STAGES: StudentStage[] = ['pre_payment', 'registered', 'documents_completed', 'visa_applied', 'visa_approved', 'visa_rejected', 'orientation', 'departed'];

export default function StudentsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [selectedStage, setSelectedStage] = useState<StudentStage | 'all'>('all');
  const scrollViewRef = useRef<ScrollView>(null);

  const filteredStudents = selectedStage === 'all'
    ? MOCK_STUDENTS
    : MOCK_STUDENTS.filter(s => s.stage === selectedStage);

  const getStageCount = (stage: StudentStage) => {
    return MOCK_STUDENTS.filter(s => s.stage === stage).length;
  };

  const renderStudent = (student: Student) => {
    const program = PROGRAMS.find(p => p.id === student.program);
    
    return (
      <TouchableOpacity 
        key={student.id} 
        style={styles.studentCard} 
        activeOpacity={0.7}
        onPress={() => router.push(`/students/${student.id}`)}
      >
        <View style={styles.studentHeader}>
          <View style={styles.studentAvatar}>
            <Text style={styles.studentInitial}>
              {student.name.split(' ').map(n => n[0]).join('')}
            </Text>
          </View>
          <View style={styles.studentHeaderInfo}>
            <Text style={styles.studentName}>{student.name}</Text>
            <View style={styles.studentMeta}>
              <View style={styles.metaItem}>
                <MapPin size={12} color={Colors.textSecondary} />
                <Text style={styles.metaText}>{student.country || 'USA'}</Text>
              </View>
              <View style={styles.metaItem}>
                <Calendar size={12} color={Colors.textSecondary} />
                <Text style={styles.metaText}>
                  {new Date(student.registeredAt).toLocaleDateString('tr-TR')}
                </Text>
              </View>
            </View>
          </View>
          <ChevronRight size={20} color={Colors.textMuted} />
        </View>

        <View style={styles.studentBody}>
          <View style={styles.programBadge}>
            <Text style={styles.programText}>{program?.name || student.program}</Text>
          </View>
          
          <View style={styles.stageProgress}>
            {STAGES.map((stage, index) => {
              const stageIndex = STAGES.indexOf(student.stage);
              const isCompleted = index <= stageIndex;
              const isCurrent = index === stageIndex;
              
              return (
                <View key={stage} style={styles.stageProgressItem}>
                  <View
                    style={[
                      styles.stageDot,
                      isCompleted && { backgroundColor: Colors.stages[student.stage] },
                      isCurrent && styles.stageDotCurrent,
                    ]}
                  />
                  {index < STAGES.length - 1 && (
                    <View
                      style={[
                        styles.stageLine,
                        isCompleted && index < stageIndex && { backgroundColor: Colors.stages[student.stage] },
                      ]}
                    />
                  )}
                </View>
              );
            })}
          </View>
          
          <View style={[styles.currentStageBadge, { backgroundColor: Colors.stages[student.stage] + '20' }]}>
            <View style={[styles.currentStageDot, { backgroundColor: Colors.stages[student.stage] }]} />
            <Text style={[styles.currentStageText, { color: Colors.stages[student.stage] }]}>
              {STAGE_LABELS[student.stage].tr}
            </Text>
          </View>
        </View>

        <View style={styles.studentFooter}>
          <TouchableOpacity style={styles.contactButton}>
            <Phone size={16} color={Colors.primary} />
            <Text style={styles.contactButtonText}>İletişim</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.gradient.middle, Colors.background]}
        style={[styles.header, { paddingTop: insets.top + 16 }]}
      >
        <Text style={styles.headerTitle}>Öğrenciler</Text>
        <Text style={styles.headerSubtitle}>Pipeline takibi</Text>
      </LinearGradient>

      <View style={styles.filtersContainer}>
        <ScrollView
          ref={scrollViewRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContent}
        >
          <TouchableOpacity
            style={[
              styles.filterChip,
              selectedStage === 'all' && styles.filterChipActive,
            ]}
            onPress={() => setSelectedStage('all')}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedStage === 'all' && styles.filterChipTextActive,
              ]}
            >
              Tümü ({MOCK_STUDENTS.length})
            </Text>
          </TouchableOpacity>
          
          {STAGES.map((stage) => (
            <TouchableOpacity
              key={stage}
              style={[
                styles.filterChip,
                selectedStage === stage && styles.filterChipActive,
                selectedStage === stage && { borderColor: Colors.stages[stage] },
              ]}
              onPress={() => setSelectedStage(stage)}
            >
              <View style={[styles.filterDot, { backgroundColor: Colors.stages[stage] }]} />
              <Text
                style={[
                  styles.filterChipText,
                  selectedStage === stage && styles.filterChipTextActive,
                ]}
              >
                {STAGE_LABELS[stage].tr} ({getStageCount(stage)})
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {filteredStudents.length > 0 ? (
          filteredStudents.map(renderStudent)
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>Bu aşamada öğrenci yok</Text>
          </View>
        )}
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
  filtersContainer: {
    backgroundColor: Colors.background,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  filtersContent: {
    paddingHorizontal: 16,
    gap: 10,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
  },
  filterChipActive: {
    backgroundColor: Colors.primary + '30',
    borderColor: Colors.primary,
  },
  filterChipText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: Colors.text,
  },
  filterDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  studentCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  studentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  studentAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  studentInitial: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  studentHeaderInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  studentMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  studentBody: {
    marginBottom: 16,
  },
  programBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.secondary + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 16,
  },
  programText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.secondary,
  },
  stageProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  stageProgressItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  stageDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.border,
  },
  stageDotCurrent: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: Colors.background,
  },
  stageLine: {
    flex: 1,
    height: 3,
    backgroundColor: Colors.border,
    marginLeft: 2,
  },
  currentStageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  currentStageDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  currentStageText: {
    fontSize: 12,
    fontWeight: '600',
  },
  studentFooter: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 12,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: Colors.primary + '15',
    borderRadius: 8,
  },
  contactButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
});
