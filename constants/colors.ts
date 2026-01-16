export default {
  primary: '#502274',
  primaryLight: '#7B3FA0',
  primaryDark: '#3A1854',
  secondary: '#E8B923',
  secondaryLight: '#F5D76E',
  
  gradient: {
    start: '#7B3FA0',
    middle: '#502274',
    end: '#3A1854',
  },
  
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  
  background: '#0F0A14',
  surface: '#1A1221',
  surfaceLight: '#251A2E',
  surfaceElevated: '#2F2239',
  
  text: '#FFFFFF',
  textSecondary: '#A89BB0',
  textMuted: '#6B5A78',
  
  border: '#3D2E4A',
  borderLight: '#4A3A58',
  
  stages: {
    pre_payment: '#9CA3AF',
    registered: '#3B82F6',
    documents_completed: '#8B5CF6',
    visa_applied: '#F59E0B',
    visa_approved: '#10B981',
    visa_rejected: '#EF4444',
    orientation: '#06B6D4',
    departed: '#22C55E',
  } as Record<string, string>,
  
  light: {
    text: '#FFFFFF',
    background: '#0F0A14',
    tint: '#502274',
    tabIconDefault: '#6B5A78',
    tabIconSelected: '#E8B923',
  },
};
