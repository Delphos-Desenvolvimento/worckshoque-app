import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';

export interface DiagnosticDto {
  id: string;
  status?: string;
  generated_at?: string | null;
  completed_at?: string | null;
  questionnaire?: {
    id: string;
    title?: string;
    type?: string;
  } | null;
  user?: { id: string; name: string; email: string } | null;
}

export async function listDiagnostics(): Promise<DiagnosticDto[]> {
  const res = await api.get('/api/diagnostics');
  if (!res.ok) throw new Error(`Falha ao listar diagnósticos: ${res.status}`);
  return res.json();
}

export async function getDiagnostic(id: string): Promise<DiagnosticDto> {
  const res = await api.get(`/api/diagnostics/${id}`);
  if (!res.ok) throw new Error(`Falha ao obter diagnóstico: ${res.status}`);
  return res.json();
}