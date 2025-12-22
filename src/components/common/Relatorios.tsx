import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { auditApi, AuditStats, SecurityAlert, AuditLog, LoginHistoryEntry } from '@/lib/audit-api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart as RechartsPieChart, 
  Pie,
  Cell, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Users, 
  Building, 
  Target, 
  Award,
  Calendar,
  Download,
  RefreshCw,
  Filter,
  Eye,
  Globe,
  User,
  Crown,
  Trophy,
  DollarSign,
  PieChart,
  Activity,
  Zap,
  CheckCircle,
  Shield,
  AlertTriangle,
  Clock,
  MapPin,
  Search,
  FileText,
  Bell
} from 'lucide-react';
import { useAuthStore, UserRole } from '@/stores/authStore';
import { getOverview, getClientsTop, getPlatformUsage, getFinancialSummary, getFinancialHistory, getClientsHistory, getPlatformHistory } from '@/lib/reports-api';
import { usePermissions } from '@/contexts/PermissionsContext';
import PageHeader from '@/components/common/PageHeader';
import Pagination from '@/components/common/Pagination';

// Interfaces para diferentes tipos de dados
interface OverviewData {
  users?: { total?: number; active?: number };
  diagnostics?: { total?: number; completed?: number };
  actionPlans?: { total?: number };
  nps?: number;
}

interface ClientTopItem {
  companyName: string;
  diagnostics?: number;
  engagement?: number;
  revenue?: number;
}

interface PlatformUsageData {
  usersActive?: number;
  diagnosticsByStatus?: { status: string; count: number }[];
}

interface FinancialSummaryData {
  mrr?: number;
  revenue?: number;
  churnRate?: number;
}

interface FinancialHistoryItem {
  date: string;
  revenue: number;
}

interface ClientsHistoryItem {
  date: string;
  activeClients: number;
}

interface PlatformHistoryItem {
  date: string;
  diagnostics: number;
  sessions: number;
}
interface CompanyOwnerReportData {
  // Saúde Organizacional
  overallScore: number;
  totalSectors: number;
  criticalSectors: number;
  excellentSectors: number;
  progressTrend: 'up' | 'down' | 'stable';
  
  // Performance por Setor
  sectorPerformance: { 
    name: string; 
    score: number; 
    trend: 'up' | 'down' | 'stable';
    lastDiagnostic: string;
    priority: 'high' | 'medium' | 'low';
  }[];
  
  // Planos de Ação
  activePlans: number;
  completedPlans: number;
  planCompletionRate: number;
  avgImplementationTime: number;
  
  // Evolução Temporal
  scoreHistory: { date: string; score: number }[];
  sectorEvolution: { sector: string; data: { date: string; score: number }[] }[];
  
  // Insights e Recomendações
  priorityAreas: string[];
  risks: string[];
  opportunities: string[];
  nextDiagnosticRecommendation: string;
  
  // Dados expandidos para paginação
  diagnosticsHistory?: {
    id: string;
    date: string;
    sector: string;
    score: number;
    status: 'completed' | 'in_progress' | 'pending';
    improvement: number;
    recommendations: number;
    timeSpent: number;
  }[];
  
  activePlansHistory?: {
    id: string;
    title: string;
    sector: string;
    progress: number;
    deadline: string;
    priority: 'high' | 'medium' | 'low';
    tasksCompleted: number;
    totalTasks: number;
    createdAt: string;
    estimatedCompletion: string;
  }[];
}

interface AdminReportData {
  // Gestão de Clientes (Empresários)
  totalClients: number;
  activeClients: number;
  newClientsThisMonth: number;
  clientsNeedingSupport: number;
  averageEngagement: number;
  
  // Qualidade e Suporte
  totalDiagnostics: number;
  diagnosticsThisMonth: number;
  avgDiagnosticsPerClient: number;
  qualityScore: number; // Qualidade dos diagnósticos
  supportTickets: number;
  avgResponseTime: number; // horas
  
  // Performance dos Clientes
  topPerformingClients: {
    name: string;
    company: string;
    diagnostics: number;
    engagement: number;
    lastActivity: string;
    planCompletion: number;
    status: 'excellent' | 'good' | 'needs_attention';
  }[];
  
  // Uso da Plataforma
  platformUsage: { month: string; diagnostics: number; activeUsers: number; engagement: number }[];
  clientsHistory: { month: string; active: number; new: number; churned: number }[];
  
  // Análise de Qualidade
  diagnosticQuality: {
    category: string;
    avgScore: number;
    totalDiagnostics: number;
    trend: 'up' | 'down' | 'stable';
  }[];
  
  // Suporte e Moderação
  supportMetrics: {
    openTickets: number;
    resolvedTickets: number;
    avgResolutionTime: number;
    clientSatisfaction: number;
  };
}

interface GlobalReportData {
  // Métricas Financeiras
  mrr: number; // Monthly Recurring Revenue
  totalRevenue: number;
  churnRate: number;
  ltv: number; // Lifetime Value
  cac: number; // Customer Acquisition Cost
  monthlyGrowth: number;
  
  // Métricas de Clientes
  totalClients: number;
  activeClients: number;
  newClientsThisMonth: number;
  churnedClientsThisMonth: number;
  npsScore: number;
  
  // Métricas de Uso da Plataforma
  totalDiagnostics: number;
  diagnosticsThisMonth: number;
  avgDiagnosticsPerClient: number;
  platformEngagement: number;
  avgSessionTime: number;
  
  // Dados Temporais
  revenueHistory: { month: string; mrr: number; newClients: number; churn: number }[];
  clientsHistory: { month: string; active: number; new: number; churned: number }[];
  usageHistory: { month: string; diagnostics: number; engagement: number }[];
  
  // Top Performers
  topClients: { 
    name: string; 
    company: string;
    mrr: number; 
    diagnostics: number; 
    engagement: number;
    joinDate: string;
  }[];
  
  // Métricas do Sistema
  systemHealth: {
    uptime: number;
    responseTime: number;
    errorRate: number;
    supportTickets: number;
  };
  
  // Dados expandidos para paginação
  allClients?: {
    id: string;
    name: string;
    company: string;
    mrr: number;
    diagnostics: number;
    engagement: number;
    joinDate: string;
    lastActivity: string;
    status: 'active' | 'churned' | 'at_risk';
    planType: 'basic' | 'premium' | 'enterprise';
  }[];
  
  transactionHistory?: {
    id: string;
    date: string;
    clientName: string;
    amount: number;
    type: 'subscription' | 'upgrade' | 'one-time';
    status: 'completed' | 'pending' | 'failed';
    plan: 'basic' | 'premium' | 'enterprise';
  }[];
  
  platformLogs?: {
    id: string;
    timestamp: string;
    event: string;
    user: string;
    severity: 'info' | 'warning' | 'error';
    details: string;
  }[];
}

// Interface para dados de auditoria
interface AuditReportData {
  // KPIs de Segurança
  totalActivities24h: number;
  suspiciousLogins: number;
  criticalAlerts: number;
  complianceRate: number;
  
  // Dados Temporais
  activityTimeline: { time: string; activities: number }[];
  loginAttempts: { time: string; successful: number; failed: number }[];
  
  // Alertas de Segurança
  securityAlerts: SecurityAlert[];
  
  // Logs de Auditoria
  auditLogs: AuditLog[];
  
  // Top Usuários
  topActiveUsers: { userId: string; userName: string; activityCount: number }[];
  
  // Distribuição de Ações
  actionDistribution: { action: string; count: number }[];
}

// Mock data para demonstração
const mockCompanyOwnerData: CompanyOwnerReportData = {
  // Saúde Organizacional
  overallScore: 78,
  totalSectors: 8,
  criticalSectors: 2,
  excellentSectors: 3,
  progressTrend: 'up',
  
  // Performance por Setor
  sectorPerformance: [
    { name: 'Recursos Humanos', score: 92, trend: 'up', lastDiagnostic: '2024-01-15', priority: 'low' },
    { name: 'Tecnologia', score: 88, trend: 'up', lastDiagnostic: '2024-01-10', priority: 'medium' },
    { name: 'Vendas', score: 45, trend: 'down', lastDiagnostic: '2024-01-20', priority: 'high' },
    { name: 'Marketing', score: 82, trend: 'stable', lastDiagnostic: '2024-01-12', priority: 'medium' },
    { name: 'Financeiro', score: 38, trend: 'down', lastDiagnostic: '2024-01-18', priority: 'high' },
    { name: 'Operações', score: 75, trend: 'up', lastDiagnostic: '2024-01-08', priority: 'medium' },
    { name: 'Atendimento', score: 90, trend: 'up', lastDiagnostic: '2024-01-14', priority: 'low' },
    { name: 'Logística', score: 68, trend: 'stable', lastDiagnostic: '2024-01-16', priority: 'medium' }
  ],
  
  // Planos de Ação
  activePlans: 12,
  completedPlans: 8,
  planCompletionRate: 67,
  avgImplementationTime: 21, // dias
  
  // Evolução Temporal
  scoreHistory: [
    { date: '2023-10-01', score: 65 },
    { date: '2023-11-01', score: 68 },
    { date: '2023-12-01', score: 72 },
    { date: '2024-01-01', score: 78 },
  ],
  sectorEvolution: [
    { 
      sector: 'Vendas', 
      data: [
        { date: '2023-10-01', score: 55 },
        { date: '2023-11-01', score: 52 },
        { date: '2023-12-01', score: 48 },
        { date: '2024-01-01', score: 45 }
      ]
    },
    { 
      sector: 'RH', 
      data: [
        { date: '2023-10-01', score: 85 },
        { date: '2023-11-01', score: 88 },
        { date: '2023-12-01', score: 90 },
        { date: '2024-01-01', score: 92 }
      ]
    }
  ],
  
  // Insights e Recomendações
  priorityAreas: ['Vendas', 'Financeiro', 'Logística'],
  risks: ['Queda contínua em Vendas', 'Problemas de fluxo de caixa', 'Baixa eficiência operacional'],
  opportunities: ['Automatização de processos', 'Expansão digital', 'Melhoria no atendimento'],
  nextDiagnosticRecommendation: 'Recomendamos um novo diagnóstico em 15 dias para acompanhar a implementação dos planos de Vendas e Financeiro.',
  
  // Dados expandidos para paginação
  diagnosticsHistory: Array.from({ length: 45 }, (_, i) => ({
    id: `diag-${i + 1}`,
    date: new Date(2024, 0, Math.floor(Math.random() * 30) + 1).toISOString().split('T')[0],
    sector: ['RH', 'Vendas', 'Marketing', 'Financeiro', 'Operações', 'Atendimento', 'Logística'][Math.floor(Math.random() * 7)],
    score: Math.floor(Math.random() * 40) + 50, // 50-90
    status: ['completed', 'in_progress', 'pending'][Math.floor(Math.random() * 3)] as 'completed' | 'in_progress' | 'pending',
    improvement: Math.floor(Math.random() * 20) - 10, // -10 a +10
    recommendations: Math.floor(Math.random() * 8) + 3, // 3-10
    timeSpent: Math.floor(Math.random() * 60) + 15 // 15-75 minutos
  })),
  
  activePlansHistory: Array.from({ length: 32 }, (_, i) => ({
    id: `plan-${i + 1}`,
    title: [
      'Melhoria no Atendimento ao Cliente',
      'Implementação CRM',
      'Treinamento da Equipe de Vendas',
      'Otimização de Processos',
      'Digitalização de Documentos',
      'Programa de Qualidade',
      'Expansão Digital',
      'Automatização Financeira',
      'Gestão de Estoque',
      'Marketing Digital'
    ][Math.floor(Math.random() * 10)],
    sector: ['RH', 'Vendas', 'Marketing', 'Financeiro', 'Operações', 'Atendimento'][Math.floor(Math.random() * 6)],
    progress: Math.floor(Math.random() * 100),
    deadline: new Date(2024, Math.floor(Math.random() * 6) + 1, Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0],
    priority: ['high', 'medium', 'low'][Math.floor(Math.random() * 3)] as 'high' | 'medium' | 'low',
    tasksCompleted: Math.floor(Math.random() * 8) + 2,
    totalTasks: Math.floor(Math.random() * 5) + 8,
    createdAt: new Date(2023, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0],
    estimatedCompletion: new Date(2024, Math.floor(Math.random() * 6) + 2, Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0]
  }))
};

const mockAdminData: AdminReportData = {
  // Gestão de Clientes (Empresários)
  totalClients: 127,
  activeClients: 119,
  newClientsThisMonth: 12,
  clientsNeedingSupport: 8,
  averageEngagement: 86,
  
  // Qualidade e Suporte
  totalDiagnostics: 2847,
  diagnosticsThisMonth: 342,
  avgDiagnosticsPerClient: 2.4,
  qualityScore: 92, // Qualidade dos diagnósticos
  supportTickets: 23,
  avgResponseTime: 4.2, // horas
  
  // Performance dos Clientes
  topPerformingClients: [
    {
      name: 'João Silva',
      company: 'TechCorp Solutions',
      diagnostics: 15,
      engagement: 95,
      lastActivity: '2024-01-20',
      planCompletion: 85,
      status: 'excellent'
    },
    {
      name: 'Maria Santos',
      company: 'InnovateHub',
      diagnostics: 12,
      engagement: 92,
      lastActivity: '2024-01-19',
      planCompletion: 78,
      status: 'excellent'
    },
    {
      name: 'Pedro Costa',
      company: 'GlobalTech Inc',
      diagnostics: 18,
      engagement: 88,
      lastActivity: '2024-01-18',
      planCompletion: 72,
      status: 'good'
    },
    {
      name: 'Ana Oliveira',
      company: 'StartupTech',
      diagnostics: 8,
      engagement: 65,
      lastActivity: '2024-01-10',
      planCompletion: 45,
      status: 'needs_attention'
    },
    {
      name: 'Carlos Lima',
      company: 'BusinessCorp',
      diagnostics: 6,
      engagement: 58,
      lastActivity: '2024-01-08',
      planCompletion: 38,
      status: 'needs_attention'
    }
  ],
  
  // Uso da Plataforma
  platformUsage: [
    { month: 'Set/23', diagnostics: 234, activeUsers: 98, engagement: 82 },
    { month: 'Out/23', diagnostics: 267, activeUsers: 107, engagement: 84 },
    { month: 'Nov/23', diagnostics: 298, activeUsers: 115, engagement: 85 },
    { month: 'Dez/23', diagnostics: 342, activeUsers: 119, engagement: 86 }
  ],
  clientsHistory: [
    { month: 'Set/23', active: 98, new: 8, churned: 2 },
    { month: 'Out/23', active: 107, new: 11, churned: 3 },
    { month: 'Nov/23', active: 115, new: 9, churned: 1 },
    { month: 'Dez/23', active: 119, new: 12, churned: 4 }
  ],
  
  // Análise de Qualidade
  diagnosticQuality: [
    { category: 'Recursos Humanos', avgScore: 88, totalDiagnostics: 145, trend: 'up' },
    { category: 'Tecnologia', avgScore: 85, totalDiagnostics: 167, trend: 'up' },
    { category: 'Vendas', avgScore: 72, totalDiagnostics: 198, trend: 'down' },
    { category: 'Marketing', avgScore: 79, totalDiagnostics: 134, trend: 'stable' },
    { category: 'Financeiro', avgScore: 68, totalDiagnostics: 156, trend: 'down' },
    { category: 'Operações', avgScore: 82, totalDiagnostics: 123, trend: 'up' }
  ],
  
  // Suporte e Moderação
  supportMetrics: {
    openTickets: 8,
    resolvedTickets: 67,
    avgResolutionTime: 6.5, // horas
    clientSatisfaction: 4.3 // de 5
  }
};

const mockGlobalData: GlobalReportData = {
  // Métricas Financeiras
  mrr: 45780, // R$ 45.780/mês
  totalRevenue: 548360, // R$ 548.360 total
  churnRate: 3.2, // 3.2% ao mês
  ltv: 18500, // R$ 18.500 por cliente
  cac: 850, // R$ 850 para adquirir cliente
  monthlyGrowth: 15.2,
  
  // Métricas de Clientes
  totalClients: 127, // Total de empresários
  activeClients: 119, // Empresários ativos
  newClientsThisMonth: 12,
  churnedClientsThisMonth: 4,
  npsScore: 78, // Net Promoter Score
  
  // Métricas de Uso da Plataforma
  totalDiagnostics: 2847,
  diagnosticsThisMonth: 342,
  avgDiagnosticsPerClient: 2.4,
  platformEngagement: 86, // % de clientes ativos mensalmente
  avgSessionTime: 28, // minutos por sessão
  
  // Dados Temporais
  revenueHistory: [
    { month: 'Set/23', mrr: 32400, newClients: 8, churn: 2 },
    { month: 'Out/23', mrr: 36850, newClients: 11, churn: 3 },
    { month: 'Nov/23', mrr: 41200, newClients: 9, churn: 1 },
    { month: 'Dez/23', mrr: 45780, newClients: 12, churn: 4 }
  ],
  clientsHistory: [
    { month: 'Set/23', active: 98, new: 8, churned: 2 },
    { month: 'Out/23', active: 107, new: 11, churned: 3 },
    { month: 'Nov/23', active: 115, new: 9, churned: 1 },
    { month: 'Dez/23', active: 119, new: 12, churned: 4 }
  ],
  usageHistory: [
    { month: 'Set/23', diagnostics: 234, engagement: 82 },
    { month: 'Out/23', diagnostics: 267, engagement: 84 },
    { month: 'Nov/23', diagnostics: 298, engagement: 85 },
    { month: 'Dez/23', diagnostics: 342, engagement: 86 }
  ],
  
  // Top Clientes
  topClients: [
    { 
      name: 'João Silva', 
      company: 'TechCorp Solutions',
      mrr: 1200, 
      diagnostics: 15, 
      engagement: 95,
      joinDate: '2023-06-15'
    },
    { 
      name: 'Maria Santos', 
      company: 'InnovateHub',
      mrr: 800, 
      diagnostics: 12, 
      engagement: 92,
      joinDate: '2023-07-20'
    },
    { 
      name: 'Pedro Costa', 
      company: 'GlobalTech Inc',
      mrr: 1500, 
      diagnostics: 18, 
      engagement: 88,
      joinDate: '2023-05-10'
    },
    { 
      name: 'Ana Oliveira', 
      company: 'StartupTech',
      mrr: 600, 
      diagnostics: 8, 
      engagement: 90,
      joinDate: '2023-08-05'
    }
  ],
  
  // Saúde do Sistema
  systemHealth: {
    uptime: 99.8, // %
    responseTime: 245, // ms
    errorRate: 0.1, // %
    supportTickets: 23
  },
  
  // Dados expandidos para paginação
  allClients: Array.from({ length: 127 }, (_, i) => ({
    id: `client-${i + 1}`,
    name: [
      'João Silva', 'Maria Santos', 'Pedro Costa', 'Ana Oliveira', 'Carlos Lima',
      'Fernanda Souza', 'Ricardo Alves', 'Juliana Pereira', 'Roberto Ferreira', 'Camila Rodrigues',
      'Eduardo Martins', 'Patrícia Gomes', 'Felipe Barbosa', 'Luciana Araújo', 'Marcos Ribeiro'
    ][Math.floor(Math.random() * 15)],
    company: [
      'TechCorp Solutions', 'InnovateHub', 'GlobalTech Inc', 'StartupTech', 'BusinessCorp',
      'DataFlow Systems', 'CloudTech', 'NextGen Solutions', 'SmartBiz', 'ProActive Ltd'
    ][Math.floor(Math.random() * 10)],
    mrr: Math.floor(Math.random() * 2000) + 300, // 300-2300
    diagnostics: Math.floor(Math.random() * 20) + 5, // 5-25
    engagement: Math.floor(Math.random() * 30) + 70, // 70-100
    joinDate: new Date(2023, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0],
    lastActivity: new Date(2024, 0, Math.floor(Math.random() * 30) + 1).toISOString().split('T')[0],
    status: ['active', 'churned', 'at_risk'][Math.floor(Math.random() * 3)] as 'active' | 'churned' | 'at_risk',
    planType: ['basic', 'premium', 'enterprise'][Math.floor(Math.random() * 3)] as 'basic' | 'premium' | 'enterprise'
  })),
  
  transactionHistory: Array.from({ length: 245 }, (_, i) => ({
    id: `txn-${i + 1}`,
    date: new Date(2024, Math.floor(Math.random() * 2), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0],
    clientName: [
      'João Silva', 'Maria Santos', 'Pedro Costa', 'Ana Oliveira', 'Carlos Lima',
      'Fernanda Souza', 'Ricardo Alves', 'Juliana Pereira', 'Roberto Ferreira', 'Camila Rodrigues'
    ][Math.floor(Math.random() * 10)],
    amount: Math.floor(Math.random() * 2000) + 300,
    type: ['subscription', 'upgrade', 'one-time'][Math.floor(Math.random() * 3)] as 'subscription' | 'upgrade' | 'one-time',
    status: ['completed', 'pending', 'failed'][Math.floor(Math.random() * 3)] as 'completed' | 'pending' | 'failed',
    plan: ['basic', 'premium', 'enterprise'][Math.floor(Math.random() * 3)] as 'basic' | 'premium' | 'enterprise'
  })),
  
  platformLogs: Array.from({ length: 180 }, (_, i) => ({
    id: `log-${i + 1}`,
    timestamp: new Date(2024, 0, Math.floor(Math.random() * 30) + 1, Math.floor(Math.random() * 24), Math.floor(Math.random() * 60)).toISOString(),
    event: [
      'User Login', 'Diagnostic Started', 'Plan Created', 'Report Generated', 'Profile Updated',
      'Payment Processed', 'Support Ticket Created', 'Data Export', 'System Backup', 'Security Alert'
    ][Math.floor(Math.random() * 10)],
    user: [
      'João Silva', 'Maria Santos', 'Pedro Costa', 'Ana Oliveira', 'Carlos Lima'
    ][Math.floor(Math.random() * 5)],
    severity: ['info', 'warning', 'error'][Math.floor(Math.random() * 3)] as 'info' | 'warning' | 'error',
    details: 'Evento processado com sucesso no sistema'
  }))
};

// Mock data para auditoria
const mockAuditData: AuditReportData = {
  // KPIs de Segurança
  totalActivities24h: 1247,
  suspiciousLogins: 3,
  criticalAlerts: 1,
  complianceRate: 98.5,
  
  // Dados Temporais
  activityTimeline: Array.from({ length: 24 }, (_, i) => ({
    time: `${i}:00`,
    activities: Math.floor(Math.random() * 100) + 20
  })),
  
  loginAttempts: Array.from({ length: 24 }, (_, i) => ({
    time: `${i}:00`,
    successful: Math.floor(Math.random() * 50) + 10,
    failed: Math.floor(Math.random() * 10)
  })),
  
  // Alertas de Segurança
  securityAlerts: [
    {
      id: 'alert_001',
      type: 'critical_action',
      severity: 'critical',
      title: 'Exclusão de Usuário Crítica',
      message: 'Usuário administrador foi excluído do sistema',
      userId: 'user_123',
      ipAddress: '192.168.1.100',
      status: 'new',
      createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString()
    },
    {
      id: 'alert_002',
      type: 'multiple_failed_logins',
      severity: 'high',
      title: 'Múltiplas Tentativas de Login',
      message: '5 tentativas de login falhadas para user@example.com',
      ipAddress: '10.0.0.15',
      status: 'investigating',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'alert_003',
      type: 'suspicious_ip',
      severity: 'medium',
      title: 'Login de IP Desconhecido',
      message: 'Login realizado de novo IP: 203.45.67.89',
      userId: 'user_456',
      ipAddress: '203.45.67.89',
      status: 'resolved',
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'alert_004',
      type: 'off_hours_activity',
      severity: 'low',
      title: 'Atividade Fora do Horário',
      message: 'Atividade detectada às 2:30 AM',
      userId: 'user_789',
      status: 'new',
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
    }
  ],
  
  // Logs de Auditoria
  auditLogs: [
    {
      id: 'log_001',
      userId: 'user_123',
      userName: 'João Silva',
      userEmail: 'joao@empresa.com',
      userRole: 'admin',
      action: 'delete_user',
      entityType: 'user',
      entityId: 'user_deleted_456',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString()
    },
    {
      id: 'log_002',
      userId: 'user_456',
      userName: 'Maria Santos',
      userEmail: 'maria@empresa.com',
      userRole: 'user',
      action: 'create_diagnostic',
      entityType: 'diagnostic',
      entityId: 'diag_789',
      ipAddress: '192.168.1.101',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString()
    },
    {
      id: 'log_003',
      userId: 'user_789',
      userName: 'Carlos Oliveira',
      userEmail: 'carlos@empresa.com',
      userRole: 'admin',
      action: 'update_permission',
      entityType: 'permission',
      entityId: 'perm_123',
      ipAddress: '192.168.1.102',
      userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
      createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString()
    },
    {
      id: 'log_004',
      userId: 'user_101',
      userName: 'Ana Costa',
      userEmail: 'ana@empresa.com',
      userRole: 'user',
      action: 'view_report',
      ipAddress: '192.168.1.103',
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X)',
      createdAt: new Date(Date.now() - 75 * 60 * 1000).toISOString()
    },
    {
      id: 'log_005',
      userId: 'user_202',
      userName: 'Pedro Lima',
      userEmail: 'pedro@empresa.com',
      userRole: 'user',
      action: 'login',
      ipAddress: '203.45.67.89',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:91.0) Gecko/20100101',
      createdAt: new Date(Date.now() - 90 * 60 * 1000).toISOString()
    }
  ],
  
  // Top Usuários
  topActiveUsers: [
    { userId: 'user_123', userName: 'João Silva', activityCount: 45 },
    { userId: 'user_456', userName: 'Maria Santos', activityCount: 38 },
    { userId: 'user_789', userName: 'Carlos Oliveira', activityCount: 32 },
    { userId: 'user_101', userName: 'Ana Costa', activityCount: 28 },
    { userId: 'user_202', userName: 'Pedro Lima', activityCount: 22 }
  ],
  
  // Distribuição de Ações
  actionDistribution: [
    { action: 'Login', count: 156 },
    { action: 'Visualizar Relatório', count: 89 },
    { action: 'Criar Diagnóstico', count: 67 },
    { action: 'Atualizar Usuário', count: 45 },
    { action: 'Visualizar Diagnóstico', count: 34 },
    { action: 'Criar Questionário', count: 23 },
    { action: 'Excluir Usuário', count: 12 },
    { action: 'Atualizar Permissão', count: 8 }
  ]
};

export default function Relatorios() {
  const { user } = useAuthStore();
  const { hasPermission } = usePermissions();
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [activeTab, setActiveTab] = useState('overview');
  const [overviewData, setOverviewData] = useState<OverviewData | null>(null);
  const [clientsTop, setClientsTop] = useState<ClientTopItem[]>([]);
  const [platformUsage, setPlatformUsage] = useState<PlatformUsageData | null>(null);
  const [financialSummary, setFinancialSummary] = useState<FinancialSummaryData | null>(null);
  const [financialHistory, setFinancialHistory] = useState<FinancialHistoryItem[] | null>(null);
  const [clientsHistory, setClientsHistory] = useState<ClientsHistoryItem[] | null>(null);
  const [platformHistory, setPlatformHistory] = useState<PlatformHistoryItem[] | null>(null);
  const [auditRefreshTick, setAuditRefreshTick] = useState(0);

  const periodToRange = (p: string) => {
    const to = new Date();
    const from = new Date();
    if (p === '7d') from.setDate(to.getDate() - 7);
    else if (p === '30d') from.setDate(to.getDate() - 30);
    else if (p === '90d') from.setDate(to.getDate() - 90);
    else if (p === '1y') from.setFullYear(to.getFullYear() - 1);
    return { from: from.toISOString(), to: to.toISOString() };
  };

  const fetchReports = async () => {
    const range = periodToRange(selectedPeriod);
    if (user?.role === 'master' || user?.role === 'admin') {
      try { const d = await getOverview(range); setOverviewData(d); } catch { setOverviewData(null); }
      try { const p = await getPlatformUsage(range); setPlatformUsage(p); } catch { setPlatformUsage(null); }
      try { const f = await getFinancialSummary(range); setFinancialSummary(f); } catch { setFinancialSummary(null); }
      try { const c = await getClientsTop(range, 10, 'revenue'); setClientsTop(c); } catch { setClientsTop([]); }
      try { const fh = await getFinancialHistory(range); setFinancialHistory(fh); } catch { setFinancialHistory(null); }
      try { const ch = await getClientsHistory(range); setClientsHistory(ch); } catch { setClientsHistory(null); }
      try { const ph = await getPlatformHistory(range); setPlatformHistory(ph); } catch { setPlatformHistory(null); }
    }
  };

  useEffect(() => {
    const range = periodToRange(selectedPeriod);
    if (user?.role === 'master' || user?.role === 'admin') {
      getOverview(range).then(setOverviewData).catch(() => setOverviewData(null));
      getPlatformUsage(range).then(setPlatformUsage).catch(() => setPlatformUsage(null));
      getFinancialSummary(range).then(setFinancialSummary).catch(() => setFinancialSummary(null));
      getClientsTop(range, 10, 'revenue').then(setClientsTop).catch(() => setClientsTop([]));
    }
  }, [selectedPeriod, user?.role]);

  // Verificação de permissão
  if (!hasPermission('relatorio.view')) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold">Acesso Negado</h3>
          <p className="text-muted-foreground">Você não tem permissão para visualizar relatórios.</p>
        </div>
      </div>
    );
  }

  // Configuração dinâmica baseada no role
  const getReportConfig = () => {
    switch (user?.role) {
      case 'user':
        return {
          title: "Relatórios Empresariais",
          description: "Acompanhe a saúde organizacional da sua empresa",
          icon: Building,
          badges: [
            { label: `${mockCompanyOwnerData.totalSectors} setores avaliados`, icon: Target },
            { label: `Score geral: ${mockCompanyOwnerData.overallScore}%`, icon: BarChart3 },
            { label: `${mockCompanyOwnerData.activePlans} planos ativos`, icon: TrendingUp }
          ],
          dataType: 'companyOwner' as const
        };
      case 'admin':
        return {
          title: "Gestão da Plataforma",
          description: "Monitore clientes, qualidade e suporte da WorkChoque",
          icon: Users,
          badges: [
            { label: `${overviewData?.users?.total ?? 0} clientes`, icon: Users },
            { label: `${overviewData?.users?.active ?? 0} ativos`, icon: TrendingUp },
            { label: `${overviewData?.diagnostics?.total ?? 0} diagnósticos`, icon: FileText },
            { label: `Planos ${overviewData?.actionPlans?.total ?? 0}`, icon: Target }
          ],
          dataType: 'admin' as const
        };
      case 'master':
        return {
          title: "Analytics da Plataforma",
          description: "Métricas executivas e inteligência de negócio da WorkChoque",
          icon: Crown,
          badges: [
            { label: `${overviewData?.users?.active ?? 0} empresários`, icon: Users },
            { label: `R$ ${(((financialSummary?.mrr ?? 0)/1000) || 0).toFixed(0)}k MRR`, icon: DollarSign },
            { label: `${(((financialSummary?.churnRate ?? 0))*100).toFixed(1)}% churn`, icon: TrendingDown },
            { label: `NPS ${overviewData?.nps ?? 0}`, icon: Trophy }
          ],
          dataType: 'global' as const
        };
      default:
        return null;
    }
  };

  const config = getReportConfig();
  if (!config) return null;

  // Renderização de conteúdo específico por role
  const renderRoleSpecificContent = () => {
    // Se for aba de auditoria para admin/master
    if (activeTab === 'audit' && (user?.role === 'admin' || user?.role === 'master') && hasPermission('auditoria.logs.view')) {
      return <AuditReports activeTab={activeTab} refreshTick={auditRefreshTick} />;
    }
    
    switch (config.dataType) {
      case 'companyOwner':
        return <CompanyOwnerReports data={mockCompanyOwnerData} activeTab={activeTab} />;
      case 'admin': {
        const adminData: AdminReportData = {
          totalClients: overviewData?.users?.total ?? 0,
          activeClients: overviewData?.users?.active ?? 0,
          newClientsThisMonth: 0,
          clientsNeedingSupport: 0,
          averageEngagement: platformUsage?.usersActive ?? 0,
          totalDiagnostics: overviewData?.diagnostics?.total ?? 0,
          diagnosticsThisMonth: 0,
          avgDiagnosticsPerClient: 0,
          qualityScore: Math.round((((overviewData?.diagnostics?.completed ?? 0) / Math.max(overviewData?.diagnostics?.total ?? 1, 1)) * 100)),
          supportTickets: 0,
          avgResponseTime: 0,
          topPerformingClients: (clientsTop || []).map((c) => ({
            name: c.companyName,
            company: c.companyName,
            diagnostics: Number(c.diagnostics || 0),
            engagement: Number(c.engagement || 0),
            lastActivity: new Date().toISOString(),
            planCompletion: 0,
            status: Number(c.engagement || 0) >= 90 ? 'excellent' : Number(c.engagement || 0) >= 70 ? 'good' : 'needs_attention',
          })),
          platformUsage: (platformHistory || []).map((d) => ({ month: d.date, diagnostics: d.diagnostics, activeUsers: d.sessions, engagement: d.sessions })),
          clientsHistory: (clientsHistory || []).map((d) => ({ month: d.date, active: d.activeClients, new: 0, churned: 0 })),
          diagnosticQuality: [],
          supportMetrics: { openTickets: 0, resolvedTickets: 0, avgResolutionTime: 0, clientSatisfaction: 0 },
        };
        return <AdminReports data={adminData} activeTab={activeTab} />;
      }
      case 'global': {
        const firstRev = financialHistory && financialHistory.length > 0 ? financialHistory[0].revenue : 0;
        const lastRev = financialHistory && financialHistory.length > 0 ? financialHistory[financialHistory.length - 1].revenue : 0;
        const growth = firstRev ? Math.round(((lastRev - firstRev) / firstRev) * 100) : 0;
        const totalDiags = platformUsage?.diagnosticsByStatus?.reduce((acc, d) => acc + (d.count || 0), 0) ?? 0;
        const globalData: GlobalReportData = {
          mrr: financialSummary?.mrr ?? 0,
          totalRevenue: financialSummary?.revenue ?? 0,
          churnRate: (financialSummary?.churnRate ?? 0),
          ltv: 0,
          cac: 0,
          monthlyGrowth: growth,
          totalClients: overviewData?.users?.total ?? 0,
          activeClients: overviewData?.users?.active ?? 0,
          newClientsThisMonth: 0,
          churnedClientsThisMonth: 0,
          npsScore: overviewData?.nps ?? 0,
          totalDiagnostics: totalDiags,
          diagnosticsThisMonth: 0,
          avgDiagnosticsPerClient: 0,
          platformEngagement: platformUsage?.usersActive ?? 0,
          avgSessionTime: 0,
          revenueHistory: (financialHistory || []).map((d) => ({ month: d.date, mrr: d.revenue, newClients: 0, churn: 0 })),
          clientsHistory: (clientsHistory || []).map((d) => ({ month: d.date, active: d.activeClients, new: 0, churned: 0 })),
          usageHistory: (platformHistory || []).map((d) => ({ month: d.date, diagnostics: d.diagnostics, engagement: d.sessions })),
          topClients: (clientsTop || []).map((c) => ({
            name: c.companyName,
            company: c.companyName,
            mrr: Number(c.revenue || 0),
            diagnostics: Number(c.diagnostics || 0),
            engagement: Number(c.engagement || 0),
            joinDate: new Date().toISOString(),
          })),
          systemHealth: { uptime: 0, responseTime: 0, errorRate: 0, supportTickets: 0 },
          allClients: [],
        };
        return <GlobalReports data={globalData} activeTab={activeTab} />;
      }
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title={config.title}
        description={config.description}
        icon={config.icon}
        badges={config.badges}
          actions={[
            { 
              label: "Atualizar", 
              icon: RefreshCw, 
              onClick: () => {
                // Atualiza apenas os dados, sem recarregar a página
                if (activeTab === 'audit') {
                  setAuditRefreshTick((t) => t + 1);
                } else {
                fetchReports();
                }
              },
              variant: 'primary' as const
            },
          { 
            label: "Exportar", 
            icon: Download, 
            onClick: () => console.log('Exportando relatórios...'),
            variant: 'primary' as const
          }
        ]}
      />

      <div className="container mx-auto px-4">

        {/* Controles Globais */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Período:</span>
                </div>
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7d">Últimos 7 dias</SelectItem>
                    <SelectItem value="30d">Últimos 30 dias</SelectItem>
                    <SelectItem value="90d">Últimos 3 meses</SelectItem>
                    <SelectItem value="1y">Último ano</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="outline" className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  {config.dataType === 'companyOwner' ? 'Visão Empresarial' : 
                   config.dataType === 'admin' ? 'Visão Operacional' : 
                   'Visão Executiva'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Conteúdo Específico do Role */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className={`grid w-full ${user?.role === 'master' || user?.role === 'admin' ? 'grid-cols-5' : 'grid-cols-4'}`}>
            {user?.role === 'master' ? (
              <>
                <TabsTrigger value="overview">Executivo</TabsTrigger>
                <TabsTrigger value="clients">Clientes</TabsTrigger>
                <TabsTrigger value="platform">Plataforma</TabsTrigger>
                <TabsTrigger value="financial">Financeiro</TabsTrigger>
                <TabsTrigger value="audit">Auditoria</TabsTrigger>
              </>
            ) : user?.role === 'admin' ? (
              <>
                <TabsTrigger value="overview">Dashboard</TabsTrigger>
                <TabsTrigger value="clients">Clientes</TabsTrigger>
                <TabsTrigger value="quality">Qualidade</TabsTrigger>
                <TabsTrigger value="support">Suporte</TabsTrigger>
                <TabsTrigger value="audit">Auditoria</TabsTrigger>
              </>
            ) : (
              <>
                <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                <TabsTrigger value="sectors">Setores</TabsTrigger>
                <TabsTrigger value="plans">Planos</TabsTrigger>
                <TabsTrigger value="insights">Insights</TabsTrigger>
              </>
            )}
          </TabsList>

          <div className="mt-6">
            {renderRoleSpecificContent()}
          </div>
        </Tabs>

      </div>
    </div>
  );
}

// Componente para relatórios do empresário (USER)
function CompanyOwnerReports({ data, activeTab }: { data: CompanyOwnerReportData; activeTab: string }) {
  // Estados de paginação para diferentes listas
  const [diagnosticsPage, setDiagnosticsPage] = useState(1);
  const [diagnosticsPerPage, setDiagnosticsPerPage] = useState(10);
  const [plansPage, setPlansPage] = useState(1);
  const [plansPerPage, setPlansPerPage] = useState(8);

  const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
    }
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-red-500" />;
      case 'stable': return <Target className="w-4 h-4 text-blue-500" />;
    }
  };

  if (activeTab === 'overview') {
    return (
      <div className="space-y-6">
        {/* Stats Cards Principais */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Building className="w-8 h-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{data.overallScore}%</p>
                  <p className="text-sm text-muted-foreground">Score Geral</p>
                  {getTrendIcon(data.progressTrend)}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Target className="w-8 h-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{data.totalSectors}</p>
                  <p className="text-sm text-muted-foreground">Setores Avaliados</p>
                  <Badge variant="outline" className="mt-1">
                    {data.excellentSectors} excelentes
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Award className="w-8 h-8 text-yellow-500" />
                <div>
                  <p className="text-2xl font-bold">{data.planCompletionRate}%</p>
                  <p className="text-sm text-muted-foreground">Taxa de Conclusão</p>
                  <Badge variant="outline" className="mt-1">
                    {data.completedPlans}/{data.activePlans + data.completedPlans} planos
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Calendar className="w-8 h-8 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold">{data.avgImplementationTime}</p>
                  <p className="text-sm text-muted-foreground">Dias p/ Implementar</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Setores Críticos e Excelentes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <TrendingDown className="w-5 h-5" />
                Setores Críticos ({data.criticalSectors})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.sectorPerformance
                  .filter(sector => sector.priority === 'high')
                  .map((sector, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-red-50 border border-red-200">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <div>
                          <p className="font-medium text-red-900">{sector.name}</p>
                          <p className="text-sm text-red-600">
                            Último diagnóstico: {new Date(sector.lastDiagnostic).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-red-600">{sector.score}%</p>
                        {getTrendIcon(sector.trend)}
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-600">
                <TrendingUp className="w-5 h-5" />
                Setores Excelentes ({data.excellentSectors})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.sectorPerformance
                  .filter(sector => sector.score >= 85)
                  .map((sector, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-green-50 border border-green-200">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <div>
                          <p className="font-medium text-green-900">{sector.name}</p>
                          <p className="text-sm text-green-600">
                            Último diagnóstico: {new Date(sector.lastDiagnostic).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-green-600">{sector.score}%</p>
                        {getTrendIcon(sector.trend)}
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos de Evolução */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Evolução do Score Geral
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.scoreHistory.map(item => ({
                    ...item,
                    month: new Date(item.date).toLocaleDateString('pt-BR', {month: 'short', year: '2-digit'})
                  }))}>
                    <defs>
                      <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                    <YAxis stroke="#64748b" fontSize={12} domain={[0, 100]} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e2e8f0', 
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                      }}
                      formatter={(value) => [`${value}%`, 'Score']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="score" 
                      stroke="#3b82f6" 
                      strokeWidth={3}
                      fill="url(#scoreGradient)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="w-5 h-5" />
                Distribuição de Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <defs>
                      <linearGradient id="excellentGradient" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#22c55e" />
                        <stop offset="100%" stopColor="#16a34a" />
                      </linearGradient>
                      <linearGradient id="averageGradient" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#eab308" />
                        <stop offset="100%" stopColor="#ca8a04" />
                      </linearGradient>
                      <linearGradient id="criticalGradient" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#ef4444" />
                        <stop offset="100%" stopColor="#dc2626" />
                      </linearGradient>
                    </defs>
                    <Pie
                      data={[
                        { name: 'Excelentes', value: data.excellentSectors, fill: 'url(#excellentGradient)' },
                        { name: 'Médios', value: data.totalSectors - data.criticalSectors - data.excellentSectors, fill: 'url(#averageGradient)' },
                        { name: 'Críticos', value: data.criticalSectors, fill: 'url(#criticalGradient)' }
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                    </Pie>
                    <Tooltip formatter={(value, name) => [`${value} setores`, name]} />
                    <Legend />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (activeTab === 'sectors') {
    return (
      <div className="space-y-6">
        {/* Gráfico de Barras - Performance por Setor */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Performance por Setor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.sectorPerformance.sort((a, b) => b.score - a.score)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="name" 
                    stroke="#64748b" 
                    fontSize={12}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis stroke="#64748b" fontSize={12} domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e2e8f0', 
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                    formatter={(value, name, props) => [
                      `${value}%`, 
                      'Score',
                      <div key="trend" className="flex items-center gap-1 mt-1">
                        {getTrendIcon(props.payload.trend)}
                        <span className="text-xs">
                          {props.payload.trend === 'up' ? 'Melhorando' : 
                           props.payload.trend === 'down' ? 'Piorando' : 'Estável'}
                        </span>
                      </div>
                    ]}
                  />
                  <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                    {data.sectorPerformance.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={
                          entry.score >= 85 ? '#22c55e' :
                          entry.score >= 70 ? '#eab308' :
                          entry.score >= 50 ? '#f97316' : '#ef4444'
                        } 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Radar Chart - Mapa de Competências */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Mapa de Competências Empresariais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={data.sectorPerformance.slice(0, 6)}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} />
                  <PolarRadiusAxis 
                    angle={90} 
                    domain={[0, 100]} 
                    tick={{ fontSize: 10, fill: '#64748b' }}
                  />
                  <Radar 
                    name="Score" 
                    dataKey="score" 
                    stroke="#3b82f6" 
                    fill="#3b82f6" 
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e2e8f0', 
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                    formatter={(value) => [`${value}%`, 'Score']}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Performance Detalhada por Setor */}
        <div className="grid gap-4">
          {data.sectorPerformance.map((sector, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-4 h-4 rounded-full ${getPriorityColor(sector.priority)}`}></div>
                    <div>
                      <h3 className="text-lg font-semibold">{sector.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        Último diagnóstico: {new Date(sector.lastDiagnostic).toLocaleDateString('pt-BR')}
                      </p>
                      <Badge variant={sector.priority === 'high' ? 'destructive' : sector.priority === 'medium' ? 'default' : 'secondary'} className="mt-2">
                        Prioridade {sector.priority === 'high' ? 'Alta' : sector.priority === 'medium' ? 'Média' : 'Baixa'}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-3xl font-bold">{sector.score}%</p>
                      <p className="text-sm text-muted-foreground">Score Atual</p>
                    </div>
                    <div className="flex flex-col items-center">
                      {getTrendIcon(sector.trend)}
                      <p className="text-xs text-muted-foreground mt-1">
                        {sector.trend === 'up' ? 'Melhorando' : sector.trend === 'down' ? 'Piorando' : 'Estável'}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Evolução Comparativa dos Setores */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Evolução Comparativa dos Setores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={[
                  { month: 'Out/23', Vendas: 55, RH: 85, Tecnologia: 80, Marketing: 75 },
                  { month: 'Nov/23', Vendas: 52, RH: 88, Tecnologia: 82, Marketing: 78 },
                  { month: 'Dez/23', Vendas: 48, RH: 90, Tecnologia: 85, Marketing: 80 },
                  { month: 'Jan/24', Vendas: 45, RH: 92, Tecnologia: 88, Marketing: 82 }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e2e8f0', 
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                    formatter={(value) => [`${value}%`, 'Score']}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="Vendas" stroke="#ef4444" strokeWidth={3} dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }} />
                  <Line type="monotone" dataKey="RH" stroke="#22c55e" strokeWidth={3} dot={{ fill: '#22c55e', strokeWidth: 2, r: 4 }} />
                  <Line type="monotone" dataKey="Tecnologia" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }} />
                  <Line type="monotone" dataKey="Marketing" stroke="#a855f7" strokeWidth={3} dot={{ fill: '#a855f7', strokeWidth: 2, r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Diagnósticos Recentes com Paginação */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Histórico de Diagnósticos ({data.diagnosticsHistory?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(data.diagnosticsHistory?.slice(0, 5) || []).map((diagnostic) => (
                <div key={diagnostic.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      diagnostic.score >= 80 ? 'bg-green-500' :
                      diagnostic.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}></div>
                    <div>
                      <p className="font-medium">{diagnostic.sector}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(diagnostic.date).toLocaleDateString('pt-BR')} • {diagnostic.timeSpent}min
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-lg font-bold">{diagnostic.score}%</p>
                      <p className="text-xs text-muted-foreground">Score</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold">{diagnostic.recommendations}</p>
                      <p className="text-xs text-muted-foreground">Recomendações</p>
                    </div>
                    <Badge variant={
                      diagnostic.status === 'completed' ? 'default' :
                      diagnostic.status === 'in_progress' ? 'secondary' : 'outline'
                    }>
                      {diagnostic.status === 'completed' ? 'Concluído' :
                       diagnostic.status === 'in_progress' ? 'Em Progresso' : 'Pendente'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (activeTab === 'plans') {
    // Lógica de paginação para planos
    const totalPlans = data.activePlansHistory?.length || 0;
    const totalPlanPages = Math.ceil(totalPlans / plansPerPage);
    const startPlanIndex = (plansPage - 1) * plansPerPage;
    const paginatedPlans = data.activePlansHistory?.slice(startPlanIndex, startPlanIndex + plansPerPage) || [];

    return (
      <div className="space-y-6">
        {/* Stats de Planos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Target className="w-8 h-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{data.activePlans}</p>
                  <p className="text-sm text-muted-foreground">Planos Ativos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Award className="w-8 h-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{data.completedPlans}</p>
                  <p className="text-sm text-muted-foreground">Planos Concluídos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Calendar className="w-8 h-8 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold">{data.avgImplementationTime}</p>
                  <p className="text-sm text-muted-foreground">Dias Médios</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gráfico de Progresso de Planos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Progresso de Implementação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Timeline de Implementação */}
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-300"></div>
                {data.priorityAreas.map((area, index) => {
                  const progress = [85, 60, 30][index] || 45; // Mock progress
                  return (
                    <div key={index} className="relative flex items-center gap-4 pb-6">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                        progress >= 80 ? 'bg-green-500' :
                        progress >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold">{area}</h4>
                          <span className="text-sm font-bold">{progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-1000 ${
                              progress >= 80 ? 'bg-gradient-to-r from-green-400 to-green-600' :
                              progress >= 50 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
                              'bg-gradient-to-r from-red-400 to-red-600'
                            }`}
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {progress >= 80 ? 'Implementação quase concluída' :
                           progress >= 50 ? 'Em andamento' : 'Início da implementação'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Eficiência de Implementação */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Tempo de Implementação por Setor
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { sector: 'RH', days: 15, status: 'fast' },
                  { sector: 'Tecnologia', days: 18, status: 'normal' },
                  { sector: 'Vendas', days: 28, status: 'slow' },
                  { sector: 'Marketing', days: 21, status: 'normal' }
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        item.status === 'fast' ? 'bg-green-500' :
                        item.status === 'normal' ? 'bg-yellow-500' : 'bg-red-500'
                      }`}></div>
                      <span className="font-medium">{item.sector}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold">{item.days}</span>
                      <span className="text-sm text-muted-foreground">dias</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5" />
                ROI dos Planos Implementados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { plan: 'Melhoria em Atendimento', roi: 45, investment: 5000 },
                  { plan: 'Automatização RH', roi: 78, investment: 12000 },
                  { plan: 'Treinamento Vendas', roi: 23, investment: 8000 },
                  { plan: 'Upgrade Tecnológico', roi: 89, investment: 15000 }
                ].map((item, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{item.plan}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold">+{item.roi}%</span>
                        <Badge variant={item.roi >= 50 ? 'default' : 'secondary'} className="text-xs">
                          R$ {(item.investment/1000).toFixed(0)}k
                        </Badge>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-1000 ${
                          item.roi >= 70 ? 'bg-gradient-to-r from-green-400 to-green-600' :
                          item.roi >= 40 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
                          'bg-gradient-to-r from-red-400 to-red-600'
                        }`}
                        style={{ width: `${Math.min(item.roi, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista Completa de Planos com Paginação */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Todos os Planos de Ação ({totalPlans})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {paginatedPlans.map((plan) => (
                <div key={plan.id} className="p-4 rounded-lg border hover:shadow-sm transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${getPriorityColor(plan.priority)}`}></div>
                      <h4 className="font-semibold text-lg">{plan.title}</h4>
                      <Badge variant="outline">{plan.sector}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={plan.priority === 'high' ? 'destructive' : plan.priority === 'medium' ? 'default' : 'secondary'}>
                        {plan.priority === 'high' ? 'Alta' : plan.priority === 'medium' ? 'Média' : 'Baixa'}
                      </Badge>
                      <span className="text-sm font-bold text-green-600">{plan.progress}%</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Progresso</p>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div 
                          className="h-2 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-1000"
                          style={{ width: `${plan.progress}%` }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Tarefas</p>
                      <p className="font-medium">{plan.tasksCompleted}/{plan.totalTasks}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Prazo</p>
                      <p className="font-medium">{new Date(plan.deadline).toLocaleDateString('pt-BR')}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Criado em</p>
                      <p className="font-medium">{new Date(plan.createdAt).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>
                </div>
              ))}

              {/* Paginação */}
              {totalPlanPages > 1 && (
                <div className="mt-6">
                  <Pagination
                    currentPage={plansPage}
                    totalPages={totalPlanPages}
                    totalItems={totalPlans}
                    itemsPerPage={plansPerPage}
                    onPageChange={setPlansPage}
                    onItemsPerPageChange={(newSize) => {
                      setPlansPerPage(newSize);
                      setPlansPage(1);
                    }}
                    showPageSizeSelector={true}
                    pageSizeOptions={[5, 8, 15, 25]}
                    className="border-t pt-4"
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (activeTab === 'insights') {
    return (
      <div className="space-y-6">
        {/* Riscos e Oportunidades */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <TrendingDown className="w-5 h-5" />
                Riscos Identificados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.risks.map((risk, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-red-50 border border-red-200">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                    <p className="text-sm text-red-900">{risk}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-600">
                <TrendingUp className="w-5 h-5" />
                Oportunidades de Crescimento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.opportunities.map((opportunity, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-green-50 border border-green-200">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <p className="text-sm text-green-900">{opportunity}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recomendação de Próximo Diagnóstico */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Próximos Passos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div>
                  <p className="font-medium text-blue-900 mb-2">Recomendação da IA</p>
                  <p className="text-sm text-blue-800">{data.nextDiagnosticRecommendation}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Matriz de Priorização Simplificada */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Matriz de Priorização dos Setores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Setores por Categoria de Ação */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Ação Imediata */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-red-600 flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    🚨 Ação Imediata (Alto Impacto + Baixo Esforço)
                  </h3>
                  <div className="space-y-2">
                    {[
                      { name: 'Vendas', score: 45, impact: 'Alto', effort: 'Baixo' },
                      { name: 'Financeiro', score: 38, impact: 'Alto', effort: 'Baixo' }
                    ].map((sector, index) => (
                      <div key={index} className="p-3 rounded-lg bg-red-50 border border-red-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-red-900">{sector.name}</p>
                            <p className="text-xs text-red-600">Impacto: {sector.impact} • Esforço: {sector.effort}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-red-600">{sector.score}%</p>
                            <Button size="sm" variant="destructive" className="mt-1 text-xs">
                              Agir Agora
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Monitorar */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-yellow-600 flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    ⚠️ Monitorar (Médio Impacto)
                  </h3>
                  <div className="space-y-2">
                    {[
                      { name: 'Marketing', score: 82, impact: 'Médio', effort: 'Médio' },
                      { name: 'Logística', score: 68, impact: 'Médio', effort: 'Médio' },
                      { name: 'Operações', score: 75, impact: 'Médio', effort: 'Alto' }
                    ].map((sector, index) => (
                      <div key={index} className="p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-yellow-900">{sector.name}</p>
                            <p className="text-xs text-yellow-600">Impacto: {sector.impact} • Esforço: {sector.effort}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-yellow-600">{sector.score}%</p>
                            <Button size="sm" variant="outline" className="mt-1 text-xs">
                              Planejar
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Setores Estáveis */}
              <div className="space-y-3">
                <h3 className="font-semibold text-green-600 flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  ✅ Manter Performance (Baixo Risco)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    { name: 'Recursos Humanos', score: 92, status: 'Excelente' },
                    { name: 'Atendimento', score: 90, status: 'Excelente' },
                    { name: 'Tecnologia', score: 88, status: 'Bom' }
                  ].map((sector, index) => (
                    <div key={index} className="p-3 rounded-lg bg-green-50 border border-green-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-green-900">{sector.name}</p>
                          <p className="text-xs text-green-600">Status: {sector.status}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-green-600">{sector.score}%</p>
                          <Badge variant="secondary" className="mt-1 text-xs bg-green-100 text-green-800">
                            Mantendo
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resumo Executivo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Resumo Executivo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Pontos Fortes */}
              <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                <h4 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                  <Trophy className="w-4 h-4" />
                  Pontos Fortes
                </h4>
                <ul className="space-y-2 text-sm text-green-700">
                  <li>• RH com excelente gestão (92%)</li>
                  <li>• Atendimento de alta qualidade (90%)</li>
                  <li>• Tecnologia bem estruturada (88%)</li>
                </ul>
              </div>

              {/* Áreas de Atenção */}
              <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200">
                <h4 className="font-semibold text-yellow-800 mb-3 flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Monitorar
                </h4>
                <ul className="space-y-2 text-sm text-yellow-700">
                  <li>• Marketing precisa de ajustes (82%)</li>
                  <li>• Operações pode melhorar (75%)</li>
                  <li>• Logística requer atenção (68%)</li>
                </ul>
              </div>

              {/* Ação Urgente */}
              <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                <h4 className="font-semibold text-red-800 mb-3 flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Ação Urgente
                </h4>
                <ul className="space-y-2 text-sm text-red-700">
                  <li>• Vendas em queda crítica (45%)</li>
                  <li>• Financeiro instável (38%)</li>
                  <li>• Intervenção imediata necessária</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Tab padrão (overview)
  return (
    <div className="space-y-6">
      {/* Evolução Geral */}
      <Card>
        <CardHeader>
          <CardTitle>Evolução da Empresa</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            [Gráfico de evolução do score geral da empresa ao longo do tempo]
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Componente para relatórios do admin (ADMIN)
function AdminReports({ data, activeTab }: { data: AdminReportData; activeTab: string }) {
  const getStatusColor = (status: 'excellent' | 'good' | 'needs_attention') => {
    switch (status) {
      case 'excellent': return 'text-green-600 bg-green-50 border-green-200';
      case 'good': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'needs_attention': return 'text-red-600 bg-red-50 border-red-200';
    }
  };

  const getStatusLabel = (status: 'excellent' | 'good' | 'needs_attention') => {
    switch (status) {
      case 'excellent': return 'Excelente';
      case 'good': return 'Bom';
      case 'needs_attention': return 'Precisa Atenção';
    }
  };

  if (activeTab === 'overview') {
    return (
      <div className="space-y-6">
        {/* KPIs Operacionais */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold text-blue-800">{data.totalClients}</p>
                  <p className="text-sm text-blue-600">Total de Clientes</p>
                  <Badge variant="secondary" className="mt-1 bg-blue-200 text-blue-800">
                    {data.activeClients} ativos
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold text-green-800">{data.averageEngagement}%</p>
                  <p className="text-sm text-green-600">Engajamento Médio</p>
                  <Badge variant="secondary" className="mt-1 bg-green-200 text-green-800">
                    +{data.newClientsThisMonth} novos
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <BarChart3 className="w-8 h-8 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold text-purple-800">{data.qualityScore}%</p>
                  <p className="text-sm text-purple-600">Qualidade Geral</p>
                  <Badge variant="secondary" className="mt-1 bg-purple-200 text-purple-800">
                    {data.diagnosticsThisMonth} este mês
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Activity className="w-8 h-8 text-orange-600" />
                <div>
                  <p className="text-2xl font-bold text-orange-800">{data.avgResponseTime}h</p>
                  <p className="text-sm text-orange-600">Tempo de Resposta</p>
                  <Badge variant="secondary" className="mt-1 bg-orange-200 text-orange-800">
                    {data.supportTickets} tickets
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos de Gestão */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Crescimento da Base de Clientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.clientsHistory}>
                    <defs>
                      <linearGradient id="clientsGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                    <YAxis stroke="#64748b" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e2e8f0', 
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="active" 
                      stroke="#3b82f6" 
                      strokeWidth={3}
                      fill="url(#clientsGradient)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Uso da Plataforma
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.platformUsage}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                    <YAxis yAxisId="left" stroke="#64748b" fontSize={12} />
                    <YAxis yAxisId="right" orientation="right" stroke="#64748b" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e2e8f0', 
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                      }}
                    />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="diagnostics" stroke="#8b5cf6" strokeWidth={3} name="Diagnósticos" />
                    <Line yAxisId="right" type="monotone" dataKey="engagement" stroke="#22c55e" strokeWidth={3} name="Engajamento %" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (activeTab === 'clients') {
    return (
      <div className="space-y-6">
        {/* Performance dos Clientes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Performance dos Clientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.topPerformingClients.map((client, index) => (
                <div key={index} className={`p-4 rounded-lg border ${getStatusColor(client.status)}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                        index === 0 ? 'bg-yellow-500' : 
                        index === 1 ? 'bg-gray-400' : 
                        index === 2 ? 'bg-orange-600' : 'bg-blue-500'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-semibold">{client.name}</p>
                        <p className="text-sm text-muted-foreground">{client.company}</p>
                        <p className="text-xs text-muted-foreground">
                          Última atividade: {new Date(client.lastActivity).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-lg font-bold">{client.diagnostics}</p>
                        <p className="text-xs text-muted-foreground">Diagnósticos</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold">{client.engagement}%</p>
                        <p className="text-xs text-muted-foreground">Engajamento</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold">{client.planCompletion}%</p>
                        <p className="text-xs text-muted-foreground">Conclusão</p>
                      </div>
                    </div>
                    <Badge variant={client.status === 'excellent' ? 'default' : client.status === 'good' ? 'secondary' : 'destructive'}>
                      {getStatusLabel(client.status)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Clientes que Precisam de Atenção */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <TrendingDown className="w-5 h-5" />
              Clientes que Precisam de Atenção ({data.clientsNeedingSupport})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.topPerformingClients
                .filter(client => client.status === 'needs_attention')
                .map((client, index) => (
                  <div key={index} className="p-3 rounded-lg bg-red-50 border border-red-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-red-900">{client.name}</p>
                        <p className="text-sm text-red-600">{client.company}</p>
                        <p className="text-xs text-red-600">
                          Engajamento baixo: {client.engagement}% | Última atividade: {new Date(client.lastActivity).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <Button size="sm" variant="destructive">
                        <Eye className="w-4 h-4 mr-2" />
                        Entrar em Contato
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (activeTab === 'quality') {
    return (
      <div className="space-y-6">
        {/* Qualidade dos Diagnósticos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5" />
              Qualidade dos Diagnósticos por Categoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.diagnosticQuality}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="category" 
                    stroke="#64748b" 
                    fontSize={12}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis stroke="#64748b" fontSize={12} domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e2e8f0', 
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                    formatter={(value, name, props) => [
                      `${value}%`, 
                      'Score Médio',
                      <div key="details" className="mt-1 text-xs">
                        {props.payload.totalDiagnostics} diagnósticos realizados
                      </div>
                    ]}
                  />
                  <Bar dataKey="avgScore" radius={[4, 4, 0, 0]}>
                    {data.diagnosticQuality.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={
                          entry.avgScore >= 85 ? '#22c55e' :
                          entry.avgScore >= 70 ? '#eab308' :
                          entry.avgScore >= 50 ? '#f97316' : '#ef4444'
                        } 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Análise Detalhada de Qualidade */}
        <div className="grid gap-4">
          {data.diagnosticQuality.map((category, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-4 h-4 rounded-full ${
                      category.avgScore >= 85 ? 'bg-green-500' :
                      category.avgScore >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}></div>
                    <div>
                      <h3 className="text-lg font-semibold">{category.category}</h3>
                      <p className="text-sm text-muted-foreground">
                        {category.totalDiagnostics} diagnósticos realizados
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-3xl font-bold">{category.avgScore}%</p>
                      <p className="text-sm text-muted-foreground">Score Médio</p>
                    </div>
                    <div className="flex flex-col items-center">
                      {category.trend === 'up' ? 
                        <TrendingUp className="w-5 h-5 text-green-500" /> :
                        category.trend === 'down' ?
                        <TrendingDown className="w-5 h-5 text-red-500" /> :
                        <Target className="w-5 h-5 text-blue-500" />
                      }
                      <p className="text-xs text-muted-foreground mt-1">
                        {category.trend === 'up' ? 'Melhorando' : 
                         category.trend === 'down' ? 'Piorando' : 'Estável'}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (activeTab === 'support') {
    return (
      <div className="space-y-6">
        {/* Métricas de Suporte */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Activity className="w-8 h-8 text-orange-500" />
                <div>
                  <p className="text-2xl font-bold">{data.supportMetrics.openTickets}</p>
                  <p className="text-sm text-muted-foreground">Tickets Abertos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-8 h-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{data.supportMetrics.resolvedTickets}</p>
                  <p className="text-sm text-muted-foreground">Resolvidos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Calendar className="w-8 h-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{data.supportMetrics.avgResolutionTime}h</p>
                  <p className="text-sm text-muted-foreground">Tempo Médio</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Trophy className="w-8 h-8 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold">{data.supportMetrics.clientSatisfaction}</p>
                  <p className="text-sm text-muted-foreground">Satisfação (de 5)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Análise de Suporte */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Tipos de Suporte Mais Comuns
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { type: 'Dúvidas sobre Diagnósticos', count: 12, percentage: 35 },
                  { type: 'Problemas Técnicos', count: 8, percentage: 23 },
                  { type: 'Solicitação de Recursos', count: 6, percentage: 18 },
                  { type: 'Feedback do Sistema', count: 5, percentage: 15 },
                  { type: 'Outros', count: 3, percentage: 9 }
                ].map((item, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{item.type}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold">{item.count}</span>
                        <span className="text-xs text-muted-foreground">({item.percentage}%)</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-1000"
                        style={{ width: `${item.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Status dos Clientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                    <p className="text-2xl font-bold text-green-600">
                      {data.topPerformingClients.filter(c => c.status === 'excellent').length}
                    </p>
                    <p className="text-sm text-green-600">Excelentes</p>
                  </div>
                  <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                    <p className="text-2xl font-bold text-blue-600">
                      {data.topPerformingClients.filter(c => c.status === 'good').length}
                    </p>
                    <p className="text-sm text-blue-600">Bons</p>
                  </div>
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                    <p className="text-2xl font-bold text-red-600">
                      {data.topPerformingClients.filter(c => c.status === 'needs_attention').length}
                    </p>
                    <p className="text-sm text-red-600">Precisam Atenção</p>
                  </div>
                </div>

                {/* Lista de Ações Recomendadas */}
                <div className="space-y-2 pt-4 border-t">
                  <h4 className="font-semibold text-sm">Ações Recomendadas:</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Entrar em contato com {data.topPerformingClients.filter(c => c.status === 'needs_attention').length} clientes em risco</li>
                    <li>• Verificar últimas atividades dos clientes inativos</li>
                    <li>• Oferecer suporte proativo para melhorar engajamento</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Tab padrão (overview)
  return (
    <div className="space-y-6">
      {/* Dashboard Operacional Padrão */}
      <Card>
        <CardHeader>
          <CardTitle>Gestão Operacional da Plataforma</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            Selecione uma aba para ver os relatórios detalhados
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Componente para relatórios globais (MASTER)
function GlobalReports({ data, activeTab }: { data: GlobalReportData; activeTab: string }) {
  // Estados de paginação para diferentes listas
  const [clientsPage, setClientsPage] = useState(1);
  const [clientsPerPage, setClientsPerPage] = useState(15);
  const [transactionsPage, setTransactionsPage] = useState(1);
  const [transactionsPerPage, setTransactionsPerPage] = useState(20);
  const [logsPage, setLogsPage] = useState(1);
  const [logsPerPage, setLogsPerPage] = useState(25);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (activeTab === 'overview') {
    return (
      <div className="space-y-6">
        {/* KPIs Executivos */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <DollarSign className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold text-green-800">{formatCurrency(data.mrr)}</p>
                  <p className="text-sm text-green-600">MRR (Receita Mensal)</p>
                  <Badge variant="secondary" className="mt-1 bg-green-200 text-green-800">
                    +{data.monthlyGrowth}%
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold text-blue-800">{data.totalClients}</p>
                  <p className="text-sm text-blue-600">Empresários Ativos</p>
                  <Badge variant="secondary" className="mt-1 bg-blue-200 text-blue-800">
                    {data.activeClients} ativos
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Trophy className="w-8 h-8 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold text-purple-800">{data.npsScore}</p>
                  <p className="text-sm text-purple-600">NPS Score</p>
                  <Badge variant="secondary" className="mt-1 bg-purple-200 text-purple-800">
                    Excelente
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <TrendingDown className="w-8 h-8 text-red-600" />
                <div>
                  <p className="text-2xl font-bold text-red-800">{data.churnRate}%</p>
                  <p className="text-sm text-red-600">Churn Rate</p>
                  <Badge variant="secondary" className="mt-1 bg-red-200 text-red-800">
                    Baixo
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos Executivos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Evolução da Receita (MRR)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.revenueHistory}>
                    <defs>
                      <linearGradient id="mrrGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                    <YAxis stroke="#64748b" fontSize={12} tickFormatter={(value) => `R$ ${(value/1000).toFixed(0)}k`} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e2e8f0', 
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                      }}
                      formatter={(value) => [formatCurrency(Number(value)), 'MRR']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="mrr" 
                      stroke="#22c55e" 
                      strokeWidth={3}
                      fill="url(#mrrGradient)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Crescimento de Clientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.clientsHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                    <YAxis stroke="#64748b" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e2e8f0', 
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                      }}
                    />
                    <Legend />
                    <Bar dataKey="new" fill="#22c55e" name="Novos Clientes" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="churned" fill="#ef4444" name="Churn" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Métricas de Performance */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">{formatCurrency(data.ltv)}</p>
                <p className="text-sm text-muted-foreground">LTV por Cliente</p>
                <div className="mt-2 text-xs text-green-600">
                  Ratio LTV:CAC = {(data.ltv / data.cac).toFixed(1)}:1
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-600">{formatCurrency(data.cac)}</p>
                <p className="text-sm text-muted-foreground">CAC (Custo de Aquisição)</p>
                <div className="mt-2 text-xs text-blue-600">
                  Payback: {Math.round(data.cac / (data.mrr / data.totalClients))} meses
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-purple-600">{data.avgDiagnosticsPerClient}</p>
                <p className="text-sm text-muted-foreground">Diagnósticos/Cliente</p>
                <div className="mt-2 text-xs text-purple-600">
                  {data.diagnosticsThisMonth} este mês
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-orange-600">{data.avgSessionTime}min</p>
                <p className="text-sm text-muted-foreground">Tempo Médio/Sessão</p>
                <div className="mt-2 text-xs text-orange-600">
                  {data.platformEngagement}% engajamento
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (activeTab === 'clients') {
    return (
      <div className="space-y-6">
        {/* Top Clientes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Top Clientes por Receita
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.topClients.map((client, index) => (
                <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                      index === 0 ? 'bg-yellow-500' : 
                      index === 1 ? 'bg-gray-400' : 
                      index === 2 ? 'bg-orange-600' : 'bg-blue-500'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold">{client.name}</p>
                      <p className="text-sm text-muted-foreground">{client.company}</p>
                      <p className="text-xs text-muted-foreground">
                        Cliente desde {new Date(client.joinDate).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-600">{formatCurrency(client.mrr)}/mês</p>
                    <p className="text-sm text-muted-foreground">{client.diagnostics} diagnósticos</p>
                    <Badge variant="outline" className="mt-1">
                      {client.engagement}% engajamento
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Análise de Churn */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="w-5 h-5" />
                Análise de Churn
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.clientsHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                    <YAxis stroke="#64748b" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e2e8f0', 
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                      }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="new" stroke="#22c55e" strokeWidth={3} name="Novos Clientes" />
                    <Line type="monotone" dataKey="churned" stroke="#ef4444" strokeWidth={3} name="Churn" />
                    <Line type="monotone" dataKey="active" stroke="#3b82f6" strokeWidth={3} name="Ativos" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Saúde da Plataforma
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-green-50">
                  <span className="font-medium">Uptime</span>
                  <div className="text-right">
                    <span className="text-xl font-bold text-green-600">{data.systemHealth.uptime}%</span>
                    <div className="text-xs text-green-600">Excelente</div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50">
                  <span className="font-medium">Tempo de Resposta</span>
                  <div className="text-right">
                    <span className="text-xl font-bold text-blue-600">{data.systemHealth.responseTime}ms</span>
                    <div className="text-xs text-blue-600">Rápido</div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-50">
                  <span className="font-medium">Taxa de Erro</span>
                  <div className="text-right">
                    <span className="text-xl font-bold text-yellow-600">{data.systemHealth.errorRate}%</span>
                    <div className="text-xs text-yellow-600">Baixo</div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-orange-50">
                  <span className="font-medium">Tickets de Suporte</span>
                  <div className="text-right">
                    <span className="text-xl font-bold text-orange-600">{data.systemHealth.supportTickets}</span>
                    <div className="text-xs text-orange-600">Este mês</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (activeTab === 'clients') {
    // Lógica de paginação para clientes
    const totalClientsCount = data.allClients?.length || 0;
    const totalClientsPages = Math.ceil(totalClientsCount / clientsPerPage);
    const startClientIndex = (clientsPage - 1) * clientsPerPage;
    const paginatedClients = data.allClients?.slice(startClientIndex, startClientIndex + clientsPerPage) || [];

    return (
      <div className="space-y-6">
        {/* Stats de Clientes */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{data.totalClients}</p>
                  <p className="text-sm text-muted-foreground">Total de Clientes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-8 h-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">+{data.newClientsThisMonth}</p>
                  <p className="text-sm text-muted-foreground">Novos Este Mês</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <TrendingDown className="w-8 h-8 text-red-500" />
                <div>
                  <p className="text-2xl font-bold">-{data.churnedClientsThisMonth}</p>
                  <p className="text-sm text-muted-foreground">Churn Este Mês</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Target className="w-8 h-8 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold">{data.platformEngagement}%</p>
                  <p className="text-sm text-muted-foreground">Engajamento</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista Detalhada de Clientes */}
        <Card>
          <CardHeader>
            <CardTitle>Análise Detalhada de Clientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.topClients.map((client, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 rounded-lg border hover:bg-muted/30 transition-colors">
                  <div>
                    <p className="font-semibold">{client.name}</p>
                    <p className="text-sm text-muted-foreground">{client.company}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-green-600">{formatCurrency(client.mrr)}</p>
                    <p className="text-xs text-muted-foreground">MRR</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold">{client.diagnostics}</p>
                    <p className="text-xs text-muted-foreground">Diagnósticos</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold">{client.engagement}%</p>
                    <p className="text-xs text-muted-foreground">Engajamento</p>
                  </div>
                  <div className="text-center">
                    <Badge variant={client.engagement >= 90 ? 'default' : client.engagement >= 70 ? 'secondary' : 'destructive'}>
                      {client.engagement >= 90 ? 'Excelente' : client.engagement >= 70 ? 'Bom' : 'Risco'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Lista Completa de Clientes com Paginação */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Todos os Clientes ({totalClientsCount})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {paginatedClients.map((client) => (
                <div key={client.id} className="p-4 rounded-lg border hover:shadow-sm transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${
                        client.status === 'active' ? 'bg-green-500' :
                        client.status === 'at_risk' ? 'bg-yellow-500' : 'bg-red-500'
                      }`}></div>
                      <div>
                        <h4 className="font-semibold text-lg">{client.name}</h4>
                        <p className="text-sm text-muted-foreground">{client.company}</p>
                        <p className="text-xs text-muted-foreground">
                          Cliente desde: {new Date(client.joinDate).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-6 text-center">
                      <div>
                        <p className="text-lg font-bold text-green-600">{formatCurrency(client.mrr)}</p>
                        <p className="text-xs text-muted-foreground">MRR</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold">{client.diagnostics}</p>
                        <p className="text-xs text-muted-foreground">Diagnósticos</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold">{client.engagement}%</p>
                        <p className="text-xs text-muted-foreground">Engajamento</p>
                      </div>
                      <div>
                        <Badge variant={
                          client.status === 'active' ? 'default' :
                          client.status === 'at_risk' ? 'destructive' : 'secondary'
                        }>
                          {client.status === 'active' ? 'Ativo' :
                           client.status === 'at_risk' ? 'Em Risco' : 'Cancelado'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Paginação */}
              {totalClientsPages > 1 && (
                <div className="mt-6">
                  <Pagination
                    currentPage={clientsPage}
                    totalPages={totalClientsPages}
                    totalItems={totalClientsCount}
                    itemsPerPage={clientsPerPage}
                    onPageChange={setClientsPage}
                    onItemsPerPageChange={(newSize) => {
                      setClientsPerPage(newSize);
                      setClientsPage(1);
                    }}
                    showPageSizeSelector={true}
                    pageSizeOptions={[10, 15, 25, 50]}
                    className="border-t pt-4"
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (activeTab === 'platform') {
    return (
      <div className="space-y-6">
        {/* Métricas de Uso */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <BarChart3 className="w-8 h-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{data.totalDiagnostics}</p>
                  <p className="text-sm text-muted-foreground">Total Diagnósticos</p>
                  <Badge variant="outline" className="mt-1">
                    {data.diagnosticsThisMonth} este mês
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Activity className="w-8 h-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{data.platformEngagement}%</p>
                  <p className="text-sm text-muted-foreground">Engajamento</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Calendar className="w-8 h-8 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold">{data.avgSessionTime}</p>
                  <p className="text-sm text-muted-foreground">Min/Sessão</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gráfico de Uso da Plataforma */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Evolução do Uso da Plataforma
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.usageHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                  <YAxis yAxisId="left" stroke="#64748b" fontSize={12} />
                  <YAxis yAxisId="right" orientation="right" stroke="#64748b" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e2e8f0', 
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                  />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="diagnostics" stroke="#3b82f6" strokeWidth={3} name="Diagnósticos" />
                  <Line yAxisId="right" type="monotone" dataKey="engagement" stroke="#22c55e" strokeWidth={3} name="Engajamento %" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (activeTab === 'financial') {
    // Lógica de paginação para transações
    const totalTransactions = data.transactionHistory?.length || 0;
    const totalTransactionPages = Math.ceil(totalTransactions / transactionsPerPage);
    const startTransactionIndex = (transactionsPage - 1) * transactionsPerPage;
    const paginatedTransactions = data.transactionHistory?.slice(startTransactionIndex, startTransactionIndex + transactionsPerPage) || [];

    return (
      <div className="space-y-6">
        {/* KPIs Financeiros */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-green-50 to-green-100">
            <CardContent className="p-4">
              <div className="text-center">
                <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-green-800">{formatCurrency(data.totalRevenue)}</p>
                <p className="text-sm text-green-600">Receita Total</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
            <CardContent className="p-4">
              <div className="text-center">
                <TrendingUp className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-blue-800">+{data.monthlyGrowth}%</p>
                <p className="text-sm text-blue-600">Crescimento Mensal</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
            <CardContent className="p-4">
              <div className="text-center">
                <Target className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-purple-800">{(data.ltv / data.cac).toFixed(1)}:1</p>
                <p className="text-sm text-purple-600">Ratio LTV:CAC</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100">
            <CardContent className="p-4">
              <div className="text-center">
                <Calendar className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-orange-800">{Math.round(data.cac / (data.mrr / data.totalClients))}</p>
                <p className="text-sm text-orange-600">Meses Payback</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Projeções Financeiras */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Projeção de Receita (6 meses)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={[
                  ...data.revenueHistory,
                  { month: 'Jan/24', mrr: 52000, newClients: 14, churn: 3 },
                  { month: 'Fev/24', mrr: 58500, newClients: 16, churn: 2 },
                  { month: 'Mar/24', mrr: 65200, newClients: 18, churn: 4 }
                ]}>
                  <defs>
                    <linearGradient id="projectionGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} tickFormatter={(value) => `R$ ${(value/1000).toFixed(0)}k`} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e2e8f0', 
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                    formatter={(value) => [formatCurrency(Number(value)), 'MRR Projetado']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="mrr" 
                    stroke="#8b5cf6" 
                    strokeWidth={3}
                    fill="url(#projectionGradient)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Histórico de Transações com Paginação */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Histórico de Transações ({totalTransactions})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {paginatedTransactions.map((transaction) => (
                <div key={transaction.id} className="p-4 rounded-lg border hover:shadow-sm transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${
                        transaction.status === 'completed' ? 'bg-green-500' :
                        transaction.status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'
                      }`}></div>
                      <div>
                        <h4 className="font-semibold text-lg">{transaction.clientName}</h4>
                        <p className="text-sm text-muted-foreground">
                          {new Date(transaction.date).toLocaleDateString('pt-BR')} • 
                          {transaction.type === 'subscription' ? ' Assinatura' :
                           transaction.type === 'upgrade' ? ' Upgrade' : ' Pagamento único'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-600">{formatCurrency(transaction.amount)}</p>
                        <Badge variant="outline">{transaction.plan}</Badge>
                      </div>
                      <Badge variant={
                        transaction.status === 'completed' ? 'default' :
                        transaction.status === 'pending' ? 'secondary' : 'destructive'
                      }>
                        {transaction.status === 'completed' ? 'Concluído' :
                         transaction.status === 'pending' ? 'Pendente' : 'Falhou'}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}

              {/* Paginação */}
              {totalTransactionPages > 1 && (
                <div className="mt-6">
                  <Pagination
                    currentPage={transactionsPage}
                    totalPages={totalTransactionPages}
                    totalItems={totalTransactions}
                    itemsPerPage={transactionsPerPage}
                    onPageChange={setTransactionsPage}
                    onItemsPerPageChange={(newSize) => {
                      setTransactionsPerPage(newSize);
                      setTransactionsPage(1);
                    }}
                    showPageSizeSelector={true}
                    pageSizeOptions={[10, 20, 50, 100]}
                    className="border-t pt-4"
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Tab padrão (overview)
  return (
    <div className="space-y-6">
      {/* Dashboard Executivo Padrão */}
      <Card>
        <CardHeader>
          <CardTitle>Visão Executiva da Plataforma</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            Selecione uma aba para ver os relatórios detalhados
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Componente para relatórios de auditoria (ADMIN e MASTER)
function AuditReports({ activeTab, refreshTick }: { activeTab: string; refreshTick?: number }) {
  const { hasPermission } = usePermissions();
  
  // Estados para dados reais do backend
  const [auditStats, setAuditStats] = useState<AuditStats | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loginHistory, setLoginHistory] = useState<LoginHistoryEntry[]>([]);
  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlert[]>([]);
  
  // Estados de loading e erro
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Controle para evitar múltiplas chamadas simultâneas
  const [isLoadingData, setIsLoadingData] = useState(false);
  
  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [logsPerPage, setLogsPerPage] = useState(10);
  
  // Estados para paginação
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  // Função para obter cor da severidade
  const getSeverityColor = (severity: 'critical' | 'high' | 'medium' | 'low') => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  // Função para obter ícone da severidade
  const getSeverityIcon = (severity: 'critical' | 'high' | 'medium' | 'low') => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="w-4 h-4" />;
      case 'high': return <AlertTriangle className="w-4 h-4" />;
      case 'medium': return <Bell className="w-4 h-4" />;
      case 'low': return <Bell className="w-4 h-4" />;
    }
  };

  // Função para obter cor do status
  const getStatusColor = (status: 'new' | 'investigating' | 'resolved') => {
    switch (status) {
      case 'new': return 'text-red-600 bg-red-50 border-red-200';
      case 'investigating': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'resolved': return 'text-green-600 bg-green-50 border-green-200';
    }
  };

  // Função para obter cor da ação
  const getActionColor = (action: string) => {
    if (action.includes('delete') || action.includes('excluir')) {
      return 'text-red-600 bg-red-50 border-red-200';
    }
    if (action.includes('create') || action.includes('criar')) {
      return 'text-green-600 bg-green-50 border-green-200';
    }
    if (action.includes('update') || action.includes('atualizar')) {
      return 'text-blue-600 bg-blue-50 border-blue-200';
    }
    return 'text-gray-600 bg-gray-50 border-gray-200';
  };

  // Função para carregar dados de auditoria
  const loadAuditData = React.useCallback(async () => {
    // Evitar múltiplas chamadas simultâneas
    if (isLoadingData) {
      console.log('loadAuditData já está em execução, ignorando chamada...');
      return;
    }

    try {
      setIsLoadingData(true);
      setLoading(true);
      setError(null);

      // Preparar filtros para logs de atividade (sem busca - será feita no frontend)
      const logFilters: {
        page: number;
        limit: number;
      } = {
        page: currentPage,
        limit: logsPerPage
      };

      // Carregar todos os dados em paralelo
      const [stats, logs, history, alerts] = await Promise.all([
        auditApi.getStats('24h'),
        auditApi.getActivityLogs(logFilters),
        auditApi.getLoginHistory({ page: 1, limit: 10 }),
        auditApi.getSecurityAlerts(filterStatus === 'all' ? undefined : filterStatus as 'new' | 'investigating' | 'resolved')
      ]);

      console.log('Dados recebidos:', { stats, logs, history, alerts });

      setAuditStats(stats);
      setAuditLogs(logs?.logs || []);
      setLoginHistory(history?.history || []);
      setSecurityAlerts(alerts || []);
      setTotalPages(logs?.pagination?.totalPages || 0);
      setTotalItems(logs?.pagination?.total || 0);
    } catch (err: unknown) {
      console.error('Erro ao carregar dados de auditoria:', err);
      const errorMessage = err && typeof err === 'object' && 'response' in err && err.response && typeof err.response === 'object' && 'data' in err.response && err.response.data && typeof err.response.data === 'object' && 'message' in err.response.data && typeof err.response.data.message === 'string' ? err.response.data.message : 'Erro ao carregar dados de auditoria';
      setError(errorMessage);
    } finally {
      setLoading(false);
      setIsLoadingData(false);
    }
  }, [currentPage, logsPerPage, filterStatus, isLoadingData]);

  // Função para atualizar alertas de segurança (tempo real)
  const updateSecurityAlerts = React.useCallback(async () => {
    try {
      // Só atualiza se não estiver carregando dados principais
      if (!isLoadingData) {
        const alerts = await auditApi.getSecurityAlerts();
        setSecurityAlerts(alerts);
      }
    } catch (err) {
      console.error('Erro ao atualizar alertas:', err);
    }
  }, [isLoadingData]);

  // Carregar dados ao montar o componente e quando filtros mudarem
  useEffect(() => {
    loadAuditData();
  }, [currentPage, filterStatus, loadAuditData]);

  // Debounce para busca - só recarrega se searchTerm mudou
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadAuditData();
    }, 800); // Aumentado para 800ms para ser menos agressivo

    return () => clearTimeout(timeoutId);
  }, [searchTerm, loadAuditData]);

  // Atualizar alertas a cada 2 minutos (menos agressivo)
  useEffect(() => {
    const interval = setInterval(updateSecurityAlerts, 120000); // 2 minutos
    return () => clearInterval(interval);
  }, [updateSecurityAlerts]);

  useEffect(() => {
    if (refreshTick != null) {
      loadAuditData();
    }
  }, [refreshTick, loadAuditData]);

  // Função para atualizar status de alerta
  const handleUpdateAlertStatus = async (alertId: string, status: 'new' | 'investigating' | 'resolved') => {
    try {
      await auditApi.updateSecurityAlertStatus(alertId, status);
      await updateSecurityAlerts(); // Atualizar lista
    } catch (err) {
      console.error('Erro ao atualizar status do alerta:', err);
    }
  };

  // Filtrar logs no frontend (busca em todos os campos)
  const filteredLogs = (auditLogs || []).filter(log => {
    if (!searchTerm) return true; // Se não há busca, mostrar todos
    
    const searchLower = searchTerm.toLowerCase();
    return (
      log.userName?.toLowerCase().includes(searchLower) ||
      log.userEmail?.toLowerCase().includes(searchLower) ||
      log.action?.toLowerCase().includes(searchLower) ||
      log.ipAddress?.toLowerCase().includes(searchLower) ||
      log.userRole?.toLowerCase().includes(searchLower)
    );
  });

  // Paginação no frontend (quando há busca)
  const paginatedLogs = searchTerm ? filteredLogs : auditLogs;

  // Mostrar loading
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold">Carregando dados de auditoria...</h3>
            <p className="text-muted-foreground">Aguarde enquanto buscamos as informações mais recentes.</p>
          </div>
        </div>
      </div>
    );
  }

  // Mostrar erro
  if (error) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Erro ao carregar dados de auditoria:</strong> {error}
            <Button 
              variant="outline" 
              size="sm" 
              className="ml-4"
              onClick={loadAuditData}
            >
              Tentar novamente
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPIs de Segurança */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Activity className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-blue-800">{auditStats?.totalActivities24h || 0}</p>
                <p className="text-sm text-blue-600">Atividades 24h</p>
                <Badge variant="secondary" className="mt-1 bg-blue-200 text-blue-800">
                  Últimas 24h
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-8 h-8 text-orange-600" />
              <div>
                <p className="text-2xl font-bold text-orange-800">{auditStats?.suspiciousLogins || 0}</p>
                <p className="text-sm text-orange-600">Logins Suspeitos</p>
                <Badge variant="secondary" className="mt-1 bg-orange-200 text-orange-800">
                  {(auditStats?.suspiciousLogins || 0) > 0 ? 'Atenção' : 'Normal'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-red-600" />
              <div>
                <p className="text-2xl font-bold text-red-800">{auditStats?.criticalAlerts || 0}</p>
                <p className="text-sm text-red-600">Alertas Críticos</p>
                <Badge variant="secondary" className="mt-1 bg-red-200 text-red-800">
                  {(auditStats?.criticalAlerts || 0) > 0 ? 'Crítico' : 'Seguro'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-green-800">{auditStats?.complianceRate || 0}%</p>
                <p className="text-sm text-green-600">Conformidade</p>
                <Badge variant="secondary" className="mt-1 bg-green-200 text-green-800">
                  Excelente
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos de Atividade */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Timeline de Atividades (24h)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={auditStats?.activityTimeline || []}>
                  <defs>
                    <linearGradient id="activityGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="activities" 
                    stroke="#3b82f6" 
                    fillOpacity={1} 
                    fill="url(#activityGradient)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Tentativas de Login (24h)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={auditStats?.loginAttempts || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="successful" fill="#22c55e" name="Sucessos" />
                  <Bar dataKey="failed" fill="#ef4444" name="Falhas" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertas de Segurança */}
      {hasPermission('auditoria.alerts.view') && (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Alertas de Segurança
            </CardTitle>
            <div className="flex gap-2">
              <Select value={filterSeverity} onValueChange={setFilterSeverity}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Severidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="critical">Crítica</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="low">Baixa</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="new">Novo</SelectItem>
                  <SelectItem value="investigating">Investigando</SelectItem>
                  <SelectItem value="resolved">Resolvido</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(securityAlerts || [])
              .filter(alert => 
                (filterSeverity === 'all' || alert.severity === filterSeverity) &&
                (filterStatus === 'all' || alert.status === filterStatus)
              )
              .map((alert) => (
                <Alert key={alert.id} className={`border-l-4 ${getSeverityColor(alert.severity)}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {getSeverityIcon(alert.severity)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{alert.title}</h4>
                          <Badge variant="outline" className={getSeverityColor(alert.severity)}>
                            {alert.severity.toUpperCase()}
                          </Badge>
                          <Badge variant="outline" className={getStatusColor(alert.status)}>
                            {alert.status === 'new' ? 'Novo' : 
                             alert.status === 'investigating' ? 'Investigando' : 'Resolvido'}
                          </Badge>
                        </div>
                        <AlertDescription className="mb-2">
                          {alert.message}
                        </AlertDescription>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          {alert.ipAddress && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {alert.ipAddress}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(alert.createdAt).toLocaleString('pt-BR')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Alert>
              ))}
          </div>
        </CardContent>
      </Card>
      )}

      {/* Logs de Auditoria */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Logs de Auditoria
            </CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Buscar logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
                {searchTerm && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                  >
                    ×
                  </Button>
                )}
              </div>
              <Button variant="outline" size="sm" disabled={!hasPermission('auditoria.logs.export')}>
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Contador de resultados */}
          <div className="mb-4 text-sm text-muted-foreground">
            {searchTerm ? (
              <span>
                {filteredLogs.length} resultado(s) encontrado(s) para "{searchTerm}"
              </span>
            ) : (
              <span>
                {totalItems} log(s) total(is) - Página {currentPage} de {totalPages}
              </span>
            )}
          </div>
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead>Ação</TableHead>
                <TableHead>IP</TableHead>
                <TableHead>Detalhes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <div className="text-sm">
                      {new Date(log.createdAt).toLocaleDateString('pt-BR')}
                      <br />
                      <span className="text-muted-foreground">
                        {new Date(log.createdAt).toLocaleTimeString('pt-BR')}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{log.userName}</p>
                      <p className="text-sm text-muted-foreground">{log.userEmail}</p>
                      <Badge variant="outline" className="mt-1">
                        {log.userRole.toUpperCase()}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getActionColor(log.action)}>
                      {log.action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Badge>
                    {log.entityType && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {log.entityType}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center gap-1 text-sm">
                      <MapPin className="w-3 h-3" />
                      {log.ipAddress || 'N/A'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs">
                      {log.details && (
                        <p className="text-xs text-muted-foreground truncate">
                          {JSON.stringify(log.details)}
                        </p>
                      )}
                      {log.userAgent && (
                        <p className="text-xs text-muted-foreground truncate mt-1">
                          {log.userAgent.split(' ')[0]}
                        </p>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {/* Paginação */}
          {totalPages > 1 && (
            <div className="mt-4">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                itemsPerPage={logsPerPage}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={setLogsPerPage}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Estatísticas Adicionais */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Top Usuários Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* Top usuários ativos baseado nos logs reais */}
              {(auditLogs || [])
                .reduce((acc: Array<{ userId: string; userName: string; activityCount: number }>, log) => {
                  const existing = acc.find(item => item.userId === log.userId);
                  if (existing) {
                    existing.activityCount++;
                  } else {
                    acc.push({
                      userId: log.userId,
                      userName: log.userName,
                      activityCount: 1
                    });
                  }
                  return acc;
                }, [])
                .sort((a, b) => b.activityCount - a.activityCount)
                .slice(0, 5)
                .map((user, index) => (
                  <div key={user.userId} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{user.userName}</p>
                        <p className="text-sm text-muted-foreground">{user.activityCount} atividades</p>
                      </div>
                    </div>
                    <Badge variant="outline">
                      {user.activityCount}
                    </Badge>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Distribuição de Ações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={
                  (auditLogs || [])
                    .reduce((acc: Array<{ action: string; count: number }>, log) => {
                      const existing = acc.find(item => item.action === log.action);
                      if (existing) {
                        existing.count++;
                      } else {
                        acc.push({
                          action: log.action,
                          count: 1
                        });
                      }
                      return acc;
                    }, [])
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 10)
                } layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="action" type="category" width={100} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
