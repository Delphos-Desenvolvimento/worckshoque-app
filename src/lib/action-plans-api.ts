import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import type { DiagnosticDto } from '@/lib/diagnostics-api';

// Tipos alinhados ao backend
export type PlanCategory = 'leadership' | 'wellness' | 'development' | 'performance' | 'career';
export type PlanStatus = 'rascunho' | 'em_andamento' | 'pausado' | 'concluido' | 'cancelado';
export type PlanPriority = 'baixa' | 'media' | 'alta';

export interface GoalDto {
  id?: string;
  title: string;
  description?: string | null;
  status?: 'pendente' | 'em_andamento' | 'concluida' | 'cancelada';
  priority?: PlanPriority;
  progress?: number;
  start_date?: string | null;
  due_date?: string | null;
}

export interface ActionPlanDto {
  id: string;
  user_id: string;
  user?: { id: string; name: string; email: string };
  title: string;
  description?: string | null;
  category: PlanCategory;
  status: PlanStatus;
  priority: PlanPriority;
  progress: number;
  start_date?: string | null;
  due_date?: string | null;
  created_at: string;
  updated_at: string;
  diagnostic_id?: string | null;
  goals?: GoalDto[];
  diagnostic?: DiagnosticDto | null;
}

export interface CreateActionPlanInput {
  title: string;
  description?: string;
  category: PlanCategory;
  status?: PlanStatus;
  priority?: PlanPriority;
  progress?: number;
  start_date?: string;
  due_date?: string;
  diagnostic_id?: string;
  goals?: GoalDto[];
}

export type UpdateActionPlanInput = Partial<CreateActionPlanInput>;

export async function listUserPlans(filters?: {
  status?: PlanStatus[];
  category?: PlanCategory[];
  priority?: PlanPriority[];
}): Promise<ActionPlanDto[]> {
  const params = new URLSearchParams();
  filters?.status?.forEach(s => params.append('status', s));
  filters?.category?.forEach(c => params.append('category', c));
  filters?.priority?.forEach(p => params.append('priority', p));
  const res = await api.get(`/api/action-plans${params.toString() ? `?${params.toString()}` : ''}`);
  if (!res.ok) throw new Error(`Falha ao listar planos: ${res.status}`);
  return res.json();
}

export async function getActionPlan(id: string): Promise<ActionPlanDto> {
  const role = useAuthStore.getState().user?.role;
  const path = role === 'master' || role === 'admin'
    ? `/api/action-plans/admin/${id}`
    : `/api/action-plans/${id}`;
  const res = await api.get(path);
  if (!res.ok) throw new Error(`Falha ao obter plano: ${res.status}`);
  return res.json();
}

export async function createActionPlan(data: CreateActionPlanInput): Promise<ActionPlanDto> {
  const res = await api.post('/api/action-plans', data);
  if (!res.ok) throw new Error(`Falha ao criar plano: ${res.status}`);
  return res.json();
}

export async function updateActionPlan(id: string, data: UpdateActionPlanInput): Promise<ActionPlanDto> {
  const res = await api.patch(`/api/action-plans/${id}`, data);
  if (!res.ok) throw new Error(`Falha ao atualizar plano: ${res.status}`);
  return res.json();
}

export async function deleteActionPlan(id: string): Promise<{ id: string }> {
  const res = await api.delete(`/api/action-plans/${id}`);
  if (!res.ok) throw new Error(`Falha ao remover plano: ${res.status}`);
  return res.json();
}

export async function generateActionPlanFromDiagnostic(diagnosticId: string): Promise<ActionPlanDto> {
  const res = await api.post(`/api/action-plans/generate?diagnosticId=${encodeURIComponent(diagnosticId)}`);
  if (!res.ok) throw new Error(`Falha ao gerar plano: ${res.status}`);
  return res.json();
}

export interface KeyCount {
  key: string;
  count: number;
}

export interface ActionPlansGlobalStats {
  summary: { total: number; active: number; completed: number; overdue: number; canceled: number };
  progress: { avgPlanProgress: number; avgGoalProgress: number };
  goals: { total: number; completed: number; inProgress: number; pending: number; overdue: number };
  distribution: { byStatus: KeyCount[]; byCategory: KeyCount[]; byPriority: KeyCount[] };
}

export interface StatsFilters {
  from?: string;
  to?: string;
  companyId?: string;
  status?: PlanStatus[];
  category?: PlanCategory[];
  priority?: PlanPriority[];
}

export async function getGlobalActionPlanStats(filters: StatsFilters = {}): Promise<ActionPlansGlobalStats> {
  const params = new URLSearchParams();
  if (filters.from) params.append('from', filters.from);
  if (filters.to) params.append('to', filters.to);
  if (filters.companyId) params.append('companyId', filters.companyId);
  filters.status?.forEach(s => params.append('status', s));
  filters.category?.forEach(c => params.append('category', c));
  filters.priority?.forEach(p => params.append('priority', p));
  const res = await api.get(`/api/action-plans/stats/global${params.toString() ? `?${params.toString()}` : ''}`);
  if (!res.ok) throw new Error(`Falha ao obter estatísticas globais: ${res.status}`);
  return res.json();
}

export async function listActionPlansByUser(userId: string, filters?: {
  status?: PlanStatus[];
  category?: PlanCategory[];
  priority?: PlanPriority[];
}): Promise<ActionPlanDto[]> {
  const params = new URLSearchParams();
  filters?.status?.forEach(s => params.append('status', s));
  filters?.category?.forEach(c => params.append('category', c));
  filters?.priority?.forEach(p => params.append('priority', p));
  const res = await api.get(`/api/action-plans/admin/users/${encodeURIComponent(userId)}${params.toString() ? `?${params.toString()}` : ''}`);
  if (!res.ok) throw new Error(`Falha ao listar planos do usuário: ${res.status}`);
  return res.json();
}

export async function getUserActionPlanStats(userId: string, filters: StatsFilters = {}): Promise<ActionPlansGlobalStats> {
  const params = new URLSearchParams();
  if (filters.from) params.append('from', filters.from);
  if (filters.to) params.append('to', filters.to);
  filters.status?.forEach(s => params.append('status', s));
  filters.category?.forEach(c => params.append('category', c));
  filters.priority?.forEach(p => params.append('priority', p));
  const res = await api.get(`/api/action-plans/admin/users/${encodeURIComponent(userId)}/stats${params.toString() ? `?${params.toString()}` : ''}`);
  if (!res.ok) throw new Error(`Falha ao obter estatísticas do usuário: ${res.status}`);
  return res.json();
}

export interface ApiUser {
  id: string;
  name: string;
  email: string;
  role: 'master' | 'admin' | 'user';
}

export async function listUsers(): Promise<ApiUser[]> {
  const res = await api.get('/auth/users');
  if (!res.ok) throw new Error(`Falha ao listar usuários: ${res.status}`);
  return res.json();
}

export async function listAllActionPlans(filters?: {
  status?: PlanStatus[];
  category?: PlanCategory[];
  priority?: PlanPriority[];
}): Promise<ActionPlanDto[]> {
  const params = new URLSearchParams();
  filters?.status?.forEach(s => params.append('status', s));
  filters?.category?.forEach(c => params.append('category', c));
  filters?.priority?.forEach(p => params.append('priority', p));
  const res = await api.get(`/api/action-plans/admin${params.toString() ? `?${params.toString()}` : ''}`);
  if (!res.ok) throw new Error(`Falha ao listar planos globais: ${res.status}`);
  return res.json();
}
