import { api } from './api';

// Interfaces para os dados de auditoria
export interface AuditStats {
  totalActivities24h: number;
  suspiciousLogins: number;
  criticalAlerts: number;
  complianceRate: number;
  activityTimeline: Array<{ time: string; activities: number }>;
  loginAttempts: Array<{ time: string; successful: number; failed: number }>;
}

export interface SecurityAlert {
  id: string;
  type: 'multiple_failed_logins' | 'suspicious_ip' | 'off_hours_activity' | 'critical_action' | 'access_denied_attempts';
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  message: string;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
  status: 'new' | 'investigating' | 'resolved';
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string;
  action: string;
  entityType?: string;
  entityId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export interface LoginHistoryEntry {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string;
  loginAt: string;
  logoutAt?: string;
  ipAddress?: string;
  userAgent?: string;
  deviceInfo?: string;
  browserInfo?: string;
  location?: string;
  sessionDuration?: number;
  status: string;
  failureReason?: string;
}

export interface AuditLogFilters {
  page?: number;
  limit?: number;
  userId?: string;
  action?: string;
  ipAddress?: string;
  startDate?: string;
  endDate?: string;
}

export interface LoginHistoryFilters {
  page?: number;
  limit?: number;
  userId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

// Funções de API para auditoria
export const auditApi = {
  // Buscar estatísticas de auditoria
  async getStats(period: '24h' | '7d' | '30d' = '24h'): Promise<AuditStats> {
    try {
      const response = await api.get(`/api/auth/audit/stats?period=${period}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Erro ao buscar estatísticas de auditoria:', error);
      throw error;
    }
  },

  // Buscar logs de atividade
  async getActivityLogs(filters: AuditLogFilters = {}): Promise<{
    logs: AuditLog[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    try {
      const params = new URLSearchParams();
      
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.userId) params.append('userId', filters.userId);
      if (filters.action) params.append('action', filters.action);
      if (filters.ipAddress) params.append('ipAddress', filters.ipAddress);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const response = await api.get(`/api/auth/audit/activity-logs?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Erro ao buscar logs de atividade:', error);
      throw error;
    }
  },

  // Buscar histórico de login
  async getLoginHistory(filters: LoginHistoryFilters = {}): Promise<{
    history: LoginHistoryEntry[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    try {
      const params = new URLSearchParams();
      
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.userId) params.append('userId', filters.userId);
      if (filters.status) params.append('status', filters.status);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const response = await api.get(`/api/auth/audit/login-history?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Erro ao buscar histórico de login:', error);
      throw error;
    }
  },

  // Buscar alertas de segurança
  async getSecurityAlerts(status?: 'new' | 'investigating' | 'resolved'): Promise<SecurityAlert[]> {
    try {
      const params = new URLSearchParams();
      if (status) params.append('status', status);

      const response = await api.get(`/api/auth/audit/security-alerts?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Erro ao buscar alertas de segurança:', error);
      throw error;
    }
  },

  // Atualizar status de alerta de segurança
  async updateSecurityAlertStatus(alertId: string, status: 'new' | 'investigating' | 'resolved'): Promise<void> {
    try {
      const response = await api.put(`/api/auth/audit/security-alerts/${alertId}/status`, { status });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Erro ao atualizar status do alerta:', error);
      throw error;
    }
  }
};

export default auditApi;