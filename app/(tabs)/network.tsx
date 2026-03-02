import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
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
  Percent,
  DollarSign,
  Share2,
} from 'lucide-react-native';

import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { trpc } from '@/lib/trpc';
import { AmbassadorType, AMBASSADOR_TYPE_LABELS } from '@/types';

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

interface NetworkNodeProps {
  node: TreeNode;
  level: number;
  isExpanded: boolean;
  onToggle: () => void;
  hasChildren: boolean;
}

function NetworkNode({ node, level, isExpanded, onToggle, hasChildren }: NetworkNodeProps) {
  const typeKey = node.type as AmbassadorType;
  const typeInfo = AMBASSADOR_TYPE_LABELS[typeKey] || { tr: node.type, color: '#9CA3AF' };

  return (
    <TouchableOpacity
      style={[styles.nodeCard, { marginLeft: level * 20 }]}
      onPress={onToggle}
      activeOpacity={0.8}
    >
      <View style={styles.nodeContent}>
        <View style={[styles.nodeAvatar, { borderColor: typeInfo.color }]}>
          <Text style={styles.nodeInitial}>
            {node.name.split(' ').map(n => n[0]).join('')}
          </Text>
          <View style={[styles.typeBadge, { backgroundColor: typeInfo.color }]}>
            <Award size={10} color={Colors.background} />
          </View>
        </View>

        <View style={styles.nodeInfo}>
          <View style={styles.nodeHeader}>
            <Text style={styles.nodeName}>{node.name}</Text>
            <View style={[styles.typeLabel, { backgroundColor: typeInfo.color + '20' }]}>
              <Text style={[styles.typeLabelText, { color: typeInfo.color }]}>
                {typeInfo.tr}
              </Text>
            </View>
          </View>

          <View style={styles.nodeStats}>
            <View style={styles.nodeStat}>
              <Users size={12} color={Colors.textSecondary} />
              <Text style={styles.nodeStatText}>{node.studentsReferred}</Text>
            </View>
            <View style={styles.nodeStat}>
              <Star size={12} color={Colors.secondary} />
              <Text style={styles.nodeStatText}>{node.compassPoints}</Text>
            </View>
            <View style={styles.nodeStat}>
              <TrendingUp size={12} color={Colors.success} />
              <Text style={styles.nodeStatText}>${node.totalEarningsUSD.toLocaleString()}</Text>
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

function collectAllIds(nodes: TreeNode[]): string[] {
  const ids: string[] = [];
  for (const node of nodes) {
    ids.push(node.id);
    ids.push(...collectAllIds(node.children));
  }
  return ids;
}

export default function NetworkScreen() {
  const insets = useSafeAreaInsets();
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['current']));
  const { token } = useAuth();

  const treeQuery = trpc.network.getTree.useQuery(
    { token: token || '' },
    { enabled: !!token }
  );

  const statsQuery = trpc.network.getStats.useQuery(
    { token: token || '' },
    { enabled: !!token }
  );

  const commissionQuery = trpc.network.getCommissionBreakdown.useQuery(
    { token: token || '' },
    { enabled: !!token }
  );

  const treeData = treeQuery.data;
  const statsData = statsQuery.data;
  const commissionData = commissionQuery.data;

  const isLoading = treeQuery.isLoading || statsQuery.isLoading;
  const isRefreshing = treeQuery.isRefetching || statsQuery.isRefetching;

  const onRefresh = useCallback(() => {
    treeQuery.refetch();
    statsQuery.refetch();
    commissionQuery.refetch();
  }, [treeQuery, statsQuery, commissionQuery]);

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

  const totalNetwork = statsData?.totalAmbassadors ?? 0;
  const totalStudentsInNetwork = statsData?.totalStudents ?? 0;
  const totalEarningsInNetwork = statsData?.totalEarningsUSD ?? 0;

  const networkCommissionRate = commissionData?.networkRate ?? 10;
  const totalNetworkCommission = commissionData?.totalNetworkCommission ?? 0;
  const directSubBreakdown = commissionData?.breakdown ?? [];

  const renderNode = (node: TreeNode, level: number) => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children.length > 0;

    return (
      <View key={node.id}>
        <NetworkNode
          node={node}
          level={level}
          isExpanded={isExpanded}
          onToggle={() => toggleNode(node.id)}
          hasChildren={hasChildren}
        />
        {isExpanded && node.children.map(child => renderNode(child, level + 1))}
      </View>
    );
  };

  const handleExpandAll = () => {
    if (treeData) {
      const allIds = new Set([treeData.id, ...collectAllIds(treeData.children)]);
      setExpandedNodes(allIds);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={[Colors.gradient.middle, Colors.background]}
          style={[styles.header, { paddingTop: insets.top + 16 }]}
        >
          <Text style={styles.headerTitle}>Ağım</Text>
          <Text style={styles.headerSubtitle}>MLM ağ yapısı</Text>
        </LinearGradient>
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Yükleniyor...</Text>
        </View>
      </View>
    );
  }

  const hasNetwork = treeData && treeData.children.length > 0;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.gradient.middle, Colors.background]}
        style={[styles.header, { paddingTop: insets.top + 16 }]}
      >
        <Text style={styles.headerTitle}>Ağım</Text>
        <Text style={styles.headerSubtitle}>MLM ağ yapısı</Text>
      </LinearGradient>

      <ScrollView
        style={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      >
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

        {directSubBreakdown.length > 0 && (
          <View style={styles.networkCommissionCard}>
            <View style={styles.networkCommissionHeader}>
              <View style={styles.networkCommissionIcon}>
                <Percent size={20} color={Colors.secondary} />
              </View>
              <View style={styles.networkCommissionInfo}>
                <Text style={styles.networkCommissionTitle}>Ağ Komisyon Kazançınız</Text>
                <Text style={styles.networkCommissionDesc}>
                  Alt elçilerinizin kazançlarından %{networkCommissionRate} payınız
                </Text>
              </View>
            </View>
            <View style={styles.networkCommissionAmount}>
              <DollarSign size={24} color={Colors.secondary} />
              <Text style={styles.networkCommissionValue}>
                {totalNetworkCommission.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </Text>
            </View>
            <View style={styles.networkCommissionBreakdown}>
              <Text style={styles.networkCommissionBreakdownTitle}>Elçi Bazlı Dağılım</Text>
              {directSubBreakdown.map(sub => (
                <View key={sub.ambassadorId} style={styles.networkCommissionItem}>
                  <Text style={styles.networkCommissionItemName}>{sub.name}</Text>
                  <Text style={styles.networkCommissionItemAmount}>
                    ${sub.theirEarningsUSD.toLocaleString()} × %{networkCommissionRate} = ${sub.yourCommissionUSD.toLocaleString()}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {hasNetwork ? (
          <>
            <View style={styles.treeHeader}>
              <Text style={styles.treeTitle}>Ağaç Görünümü</Text>
              <TouchableOpacity
                style={styles.expandAllButton}
                onPress={handleExpandAll}
              >
                <Text style={styles.expandAllText}>Tümünü Aç</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.treeContent}>
              <View style={styles.rootIndicator}>
                <View style={styles.rootLine} />
                <Text style={styles.rootText}>SİZ</Text>
                <View style={styles.rootLine} />
              </View>

              {treeData && renderNode(treeData, 0)}
            </View>
          </>
        ) : (
          <View style={styles.emptyState}>
            <Share2 size={48} color={Colors.textMuted} />
            <Text style={styles.emptyStateTitle}>Henüz alt elçiniz yok</Text>
            <Text style={styles.emptyStateText}>
              Referans kodunuzu paylaşarak ağınızı büyütün!
            </Text>
          </View>
        )}

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
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  scrollContent: {
    flex: 1,
  },
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
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
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  networkCommissionCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: Colors.secondary + '15',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.secondary + '30',
  },
  networkCommissionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  networkCommissionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.secondary + '30',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  networkCommissionInfo: {
    flex: 1,
  },
  networkCommissionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  networkCommissionDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  networkCommissionAmount: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    gap: 4,
  },
  networkCommissionValue: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: Colors.secondary,
  },
  networkCommissionBreakdown: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 12,
  },
  networkCommissionBreakdownTitle: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginBottom: 10,
  },
  networkCommissionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  networkCommissionItemName: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.text,
  },
  networkCommissionItemAmount: {
    fontSize: 12,
    color: Colors.textMuted,
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
    fontWeight: '600' as const,
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
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  treeContent: {
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
    fontWeight: '700' as const,
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
    fontWeight: '600' as const,
    color: Colors.text,
  },
  typeBadge: {
    position: 'absolute' as const,
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
    fontWeight: '600' as const,
    color: Colors.text,
  },
  typeLabel: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  typeLabelText: {
    fontSize: 10,
    fontWeight: '600' as const,
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
    fontWeight: '500' as const,
  },
  expandIcon: {
    marginLeft: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  emptyStateText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});
