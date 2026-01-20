import { api } from '@/lib/api';

export type DateRange = { from?: string; to?: string };

export async function getOverview(range: DateRange, companyId?: string) {
  const params = new URLSearchParams();
  if (range.from) params.append('from', range.from);
  if (range.to) params.append('to', range.to);
  if (companyId) params.append('companyId', companyId);
  const res = await api.get(`/api/reports/overview?${params.toString()}`);
  if (!res.ok) throw new Error(`Falha ao obter overview: ${res.status}`);
  return res.json();
}

export async function getClientsTop(range: DateRange, limit = 10, sortBy: 'revenue' | 'engagement' = 'revenue') {
  const params = new URLSearchParams();
  if (range.from) params.append('from', range.from);
  if (range.to) params.append('to', range.to);
  params.append('limit', String(limit));
  params.append('sortBy', sortBy);
  const res = await api.get(`/api/reports/clients/top?${params.toString()}`);
  if (!res.ok) throw new Error(`Falha ao obter clientes top: ${res.status}`);
  return res.json();
}

export async function getPlatformUsage(range: DateRange, companyId?: string) {
  const params = new URLSearchParams();
  if (range.from) params.append('from', range.from);
  if (range.to) params.append('to', range.to);
  if (companyId) params.append('companyId', companyId);
  const res = await api.get(`/api/reports/platform/usage?${params.toString()}`);
  if (!res.ok) throw new Error(`Falha ao obter uso da plataforma: ${res.status}`);
  return res.json();
}

export async function getFinancialSummary(range: DateRange, companyId?: string) {
  const params = new URLSearchParams();
  if (range.from) params.append('from', range.from);
  if (range.to) params.append('to', range.to);
  if (companyId) params.append('companyId', companyId);
  const res = await api.get(`/api/reports/financial/summary?${params.toString()}`);
  if (!res.ok) throw new Error(`Falha ao obter financeiro: ${res.status}`);
  return res.json();
}

export async function getAuditSummary(range: DateRange, companyId?: string) {
  const params = new URLSearchParams();
  if (range.from) params.append('from', range.from);
  if (range.to) params.append('to', range.to);
  if (companyId) params.append('companyId', companyId);
  const res = await api.get(`/api/reports/audit/summary?${params.toString()}`);
  if (!res.ok) throw new Error(`Falha ao obter auditoria: ${res.status}`);
  return res.json();
}

export async function getFinancialHistory(range: DateRange, companyId?: string) {
  const params = new URLSearchParams();
  if (range.from) params.append('from', range.from);
  if (range.to) params.append('to', range.to);
  if (companyId) params.append('companyId', companyId);
  const res = await api.get(`/api/reports/financial/history?${params.toString()}`);
  if (!res.ok) throw new Error(`Falha ao obter histórico financeiro: ${res.status}`);
  return res.json();
}

export async function getClientsHistory(range: DateRange) {
  const params = new URLSearchParams();
  if (range.from) params.append('from', range.from);
  if (range.to) params.append('to', range.to);
  const res = await api.get(`/api/reports/clients/history?${params.toString()}`);
  if (!res.ok) throw new Error(`Falha ao obter histórico de clientes: ${res.status}`);
  return res.json();
}

export async function getPlatformHistory(range: DateRange, companyId?: string) {
  const params = new URLSearchParams();
  if (range.from) params.append('from', range.from);
  if (range.to) params.append('to', range.to);
  if (companyId) params.append('companyId', companyId);
  const res = await api.get(`/api/reports/platform/history?${params.toString()}`);
  if (!res.ok) throw new Error(`Falha ao obter histórico da plataforma: ${res.status}`);
  return res.json();
}

export async function getCompanyDashboard(range: DateRange, companyId?: string) {
  const params = new URLSearchParams();
  if (range.from) params.append('from', range.from);
  if (range.to) params.append('to', range.to);
  if (companyId) params.append('companyId', companyId);
  const res = await api.get(`/api/reports/company/dashboard?${params.toString()}`);
  if (!res.ok) throw new Error(`Falha ao obter dashboard da empresa: ${res.status}`);
  return res.json();
}