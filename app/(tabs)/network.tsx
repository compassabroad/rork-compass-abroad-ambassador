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
  ChevronDown,
  ChevronRight,
  Users,
  TrendingUp,
  Star,
  Award,
} from 'lucide-react-native';

import Colors from '@/constants/colors';
import { MOCK_CURRENT_AMBASSADOR, MOCK_SUB_AMBASSADORS } from '@/mocks/data';
import { Ambassador, AMBASSADOR_TYPE_LABELS } from '@/types';

interface NetworkNodeProps {
  ambassador: Ambassador;
  level: number;
  isExpanded: boolean;
  onToggle: () => void;
  hasChildren: boolean;
}

function NetworkNode({ ambassador, level, isExpanded, onToggle, hasChildren }: NetworkNodeProps) {
  const typeInfo = AMBASSADOR_TYPE_LABELS[ambassador.type];
  
  return (
    <TouchableOpacity
      style={[styles.nodeCard, { marginLeft: level * 20 }]}
      onPress={onToggle}
      activeOpacity={0.8}
    >
      <View style={styles.nodeContent}>
        <View style={[styles.nodeAvatar, { borderColor: typeInfo.color }]}>
          <Text style={styles.nodeInitial}>
            {ambassador.name.split(' ').map(n => n[0]).join('')}
          </Text>
          <View style={[styles.typeBadge, { backgroundColor: typeInfo.color }]}>
            <Award size={10} color={Colors.background} />
          </View>
        </View>
        
        <View style={styles.nodeInfo}>
          <View style={styles.nodeHeader}>
            <Text style={styles.nodeName}>{ambassador.name}</Text>
            <View style={[styles.typeLabel, { backgroundColor: typeInfo.color + '20' }]}>
              <Text style={[styles.typeLabelText, { color: typeInfo.color }]}>
                {typeInfo.tr}
              </Text>
            </View>
          </View>
          
          <View style={styles.nodeStats}>
            <View style={styles.nodeStat}>
              <Users size={12} color={Colors.textSecondary} />
              <Text style={styles.nodeStatText}>{ambassador.studentsReferred}</Text>
            </View>
            <View style={styles.nodeStat}>
              <Star size={12} color={Colors.secondary} />
              <Text style={styles.nodeStatText}>{ambassador.compassPoints}</Text>
            </View>
            <View style={styles.nodeStat}>
              <TrendingUp size={12} color={Colors.success} />
              <Text style={styles.nodeStatText}>${ambassador.totalEarningsUSD.toLocaleString()}</Text>
            </View>
          </View>
        </View>
        
        {hasChildren && (
          <View style={styles.expandIcon}>
            {isExpanded ? (
              <ChevronDown size={20} color={Colors.textMuted} />
            ) : (
              <ChevronRight size={20} color={Colors.textMuted} />
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function NetworkScreen() {
  const insets = useSafeAreaInsets();
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['current']));

  const toggleNode = (id: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const getChildren = (parentId: string): Ambassador[] => {
    return MOCK_SUB_AMBASSADORS.filter(a => a.parentId === parentId);
  };

  const totalNetwork = MOCK_SUB_AMBASSADORS.length + 1;
  const totalStudentsInNetwork = MOCK_CURRENT_AMBASSADOR.studentsReferred +
    MOCK_SUB_AMBASSADORS.reduce((sum, a) => sum + a.studentsReferred, 0);
  const totalEarningsInNetwork = MOCK_CURRENT_AMBASSADOR.totalEarningsUSD +
    MOCK_SUB_AMBASSADORS.reduce((sum, a) => sum + a.totalEarningsUSD, 0);

  const renderNode = (ambassador: Ambassador, level: number) => {
    const children = getChildren(ambassador.id);
    const isExpanded = expandedNodes.has(ambassador.id);
    const hasChildren = children.length > 0;

    return (
      <View key={ambassador.id}>
        <NetworkNode
          ambassador={ambassador}
          level={level}
          isExpanded={isExpanded}
          onToggle={() => toggleNode(ambassador.id)}
          hasChildren={hasChildren}
        />
        {isExpanded && children.map(child => renderNode(child, level + 1))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.gradient.middle, Colors.background]}
        style={[styles.header, { paddingTop: insets.top + 16 }]}
      >
        <Text style={styles.headerTitle}>Ağım</Text>
        <Text style={styles.headerSubtitle}>MLM ağ yapısı</Text>
      </LinearGradient>

      <View style={styles.statsContainer}>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: Colors.info + '20' }]}>
              <Users size={20} color={Colors.info} />
            </View>
            <Text style={styles.statValue}>{totalNetwork}</Text>
            <Text style={styles.statLabel}>Toplam Elçi</Text>
          </View>
          
          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: Colors.success + '20' }]}>
              <Users size={20} color={Colors.success} />
            </View>
            <Text style={styles.statValue}>{totalStudentsInNetwork}</Text>
            <Text style={styles.statLabel}>Ağ Öğrenci</Text>
          </View>
          
          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: Colors.secondary + '20' }]}>
              <TrendingUp size={20} color={Colors.secondary} />
            </View>
            <Text style={styles.statValue}>${(totalEarningsInNetwork / 1000).toFixed(1)}K</Text>
            <Text style={styles.statLabel}>Ağ Gelir</Text>
          </View>
        </View>
      </View>

      <View style={styles.treeHeader}>
        <Text style={styles.treeTitle}>Ağaç Görünümü</Text>
        <TouchableOpacity
          style={styles.expandAllButton}
          onPress={() => {
            const allIds = new Set(['current', ...MOCK_SUB_AMBASSADORS.map(a => a.id)]);
            setExpandedNodes(allIds);
          }}
        >
          <Text style={styles.expandAllText}>Tümünü Aç</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.rootIndicator}>
          <View style={styles.rootLine} />
          <Text style={styles.rootText}>SİZ</Text>
          <View style={styles.rootLine} />
        </View>
        
        {renderNode(MOCK_CURRENT_AMBASSADOR, 0)}
        
        <View style={{ height: 40 }} />
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
  statsContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  treeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  treeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  expandAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.primary + '20',
    borderRadius: 8,
  },
  expandAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
  },
  rootIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  rootLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  rootText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.secondary,
    letterSpacing: 1,
  },
  nodeCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  nodeContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nodeAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 2,
  },
  nodeInitial: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  typeBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  nodeInfo: {
    flex: 1,
  },
  nodeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  nodeName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  typeLabel: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  typeLabelText: {
    fontSize: 10,
    fontWeight: '600',
  },
  nodeStats: {
    flexDirection: 'row',
    gap: 16,
  },
  nodeStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  nodeStatText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  expandIcon: {
    marginLeft: 8,
  },
});
