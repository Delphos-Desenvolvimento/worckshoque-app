import { api } from '@/lib/api';
import { PERMISSION_MAPPING } from '@/lib/permission-mapping';

export type AgentContext = {
  scope?: string;
  user?: { role?: string } | null;
  contextUsed?: unknown[];
} & Record<string, unknown>;

type AgentActionLike = {
  label?: unknown;
  route?: unknown;
  url?: unknown;
  path?: unknown;
  href?: unknown;
  routeOrUrl?: unknown;
  intent?: unknown;
  payload?: unknown;
};

const collectPageRoutes = () => {
  const urls: string[] = [];
  const pages = PERMISSION_MAPPING?.PAGES as Record<string, unknown>;
  if (pages && typeof pages === 'object') {
    for (const key of Object.keys(pages)) {
      if (key.startsWith('/') && !key.includes(':')) urls.push(key);
    }
  }
  return urls;
};

const collectPermissionUrls = () => {
  const urls: string[] = [];
  const sidebar = PERMISSION_MAPPING?.SIDEBAR as Record<string, unknown>;
  if (sidebar && typeof sidebar === 'object') {
    for (const entry of Object.values(sidebar)) {
      if (!entry || typeof entry !== 'object') continue;
      const url = (entry as { url?: unknown }).url;
      if (typeof url === 'string') urls.push(url);
      const children = (entry as { children?: unknown }).children;
      if (Array.isArray(children)) {
        for (const child of children) {
          if (!child || typeof child !== 'object') continue;
          const childUrl = (child as { url?: unknown }).url;
          if (typeof childUrl === 'string') urls.push(childUrl);
        }
      }
    }
  }
  return urls;
};

const ROUTE_ALIASES: Record<string, string> = {
  '/plano-acao': '/planos-acao',
  '/plano-de-acao': '/planos-acao',
  '/planos-de-acao': '/planos-acao',
  '/diagnostico': '/diagnosticos',
  '/conteudo': '/conteudos',
  '/conteudos-e-ferramentas': '/conteudos',
  '/conteudos-ferramentas': '/conteudos',
};

const DEFAULT_ALLOWED_ROUTES = Array.from(
  new Set([
    '/',
    '/login',
    ...collectPermissionUrls(),
    ...collectPageRoutes(),
  ]),
);

const INTENT_ROUTE_MAP: Record<string, string> = {
  start_diagnostic: '/diagnosticos',
  start_diagnostic_process: '/diagnosticos',
  open_diagnostic: '/diagnosticos',
  view_diagnostics: '/diagnosticos',
  open_plan: '/planos-acao',
  view_plans: '/planos-acao',
  view_contents: '/conteudos',
  open_contents: '/conteudos',
  open_notifications: '/notificacoes',
  open_profile: '/perfil',
  open_settings: '/configuracoes',
  open_reports: '/relatorios',
  open_user_management: '/gestao-usuarios',
  open_agent: '/agente',
};

export const normalizeAgentRoute = (raw: string) => {
  const trimmed = String(raw).trim().replace(/^['"`]+|['"`]+$/g, '').trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const match = trimmed.match(/^([^?#]*)([?#][\s\S]*)?$/);
  const base = match?.[1] ?? trimmed;
  const suffix = match?.[2] ?? '';
  const withSlash = base.startsWith('/') ? base : `/${base}`;
  const noTrailing = withSlash.length > 1 ? withSlash.replace(/\/+$/, '') : withSlash;
  const normalizedBase = ROUTE_ALIASES[noTrailing] ?? noTrailing;
  return `${normalizedBase}${suffix}`;
};

export const isExternalUrl = (value: string) => /^https?:\/\//i.test(value);

export const isValidAppRoute = (route: string) => {
  const normalized = normalizeAgentRoute(route);
  if (!normalized) return false;
  if (isExternalUrl(normalized)) return true;
  const base = normalized.split(/[?#]/, 1)[0];
  if (DEFAULT_ALLOWED_ROUTES.includes(base)) return true;

  if (/^\/planos-acao\/[^/]+$/.test(base)) return true;
  if (/^\/conteudos\/[^/]+(\/editar)?$/.test(base)) return true;

  return false;
};

const toSafeInt = (raw: unknown) => {
  if (typeof raw === 'number' && Number.isFinite(raw)) return Math.trunc(raw);
  if (typeof raw === 'string' && raw.trim()) {
    const n = Number(raw.trim());
    if (Number.isFinite(n)) return Math.trunc(n);
  }
  return null;
};

const applyPayloadToRoute = (route: string, payload: Record<string, unknown>) => {
  if (!route || isExternalUrl(route)) return route;

  const [beforeHash, existingHash = ''] = route.split('#', 2);
  const [base, existingQuery = ''] = beforeHash.split('?', 2);
  const params = new URLSearchParams(existingQuery);

  const stepRaw =
    payload.step ??
    payload.etapa ??
    payload.stepIndex ??
    payload.currentStep ??
    payload.moduleStep;
  const step = toSafeInt(stepRaw);
  if (step !== null && step >= 0 && !params.has('step')) {
    params.set('step', String(step));
  }

  const diagnosticId =
    typeof payload.diagnosticId === 'string'
      ? payload.diagnosticId
      : typeof payload.diagnostic_id === 'string'
        ? payload.diagnostic_id
        : '';
  if (diagnosticId && !params.has('diagnosticId')) {
    params.set('diagnosticId', diagnosticId);
  }

  const moduleRaw =
    typeof payload.module === 'string'
      ? payload.module
      : typeof payload.modulo === 'string'
        ? payload.modulo
        : typeof payload.anchor === 'string'
          ? payload.anchor
          : typeof payload.section === 'string'
            ? payload.section
            : '';
  const moduleValue = moduleRaw.trim().replace(/^#/, '');

  const hash = existingHash || moduleValue;
  const query = params.toString();
  return `${base}${query ? `?${query}` : ''}${hash ? `#${hash}` : ''}`;
};

const inferRouteFromLabel = (label: unknown) => {
  if (typeof label !== 'string') return '';
  const normalized = label.trim().toLowerCase();
  if (!normalized) return '';
  if (/(conteu|conteú)do/.test(normalized)) return '/conteudos';
  if (/(diagnos|diagnós)t/.test(normalized)) return '/diagnosticos';
  if (/plano/.test(normalized)) return '/planos-acao';
  return '';
};

export const resolveAgentActionRoute = (action: AgentActionLike) => {
  const candidate =
    action.route ?? action.url ?? action.path ?? action.href ?? action.routeOrUrl;

  if (typeof candidate === 'string') {
    const normalized = normalizeAgentRoute(candidate);
    if (normalized && isValidAppRoute(normalized)) {
      const payload = action.payload;
      if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
        return applyPayloadToRoute(normalized, payload as Record<string, unknown>);
      }
      return normalized;
    }
  }

  const intent = typeof action.intent === 'string' ? action.intent : '';
  if (intent) {
    const mapped = INTENT_ROUTE_MAP[intent] ?? INTENT_ROUTE_MAP[intent.toLowerCase()];
    if (mapped && isValidAppRoute(mapped)) {
      const payload = action.payload;
      if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
        return applyPayloadToRoute(mapped, payload as Record<string, unknown>);
      }
      return mapped;
    }
  }

  const inferred = inferRouteFromLabel(action.label);
  if (inferred && isValidAppRoute(inferred)) {
    const payload = action.payload;
    if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
      return applyPayloadToRoute(inferred, payload as Record<string, unknown>);
    }
    return inferred;
  }

  const payload = action.payload;
  if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
    const p = payload as Record<string, unknown>;
    const id = typeof p.id === 'string' ? p.id : '';
    const contentId = typeof p.contentId === 'string' ? p.contentId : '';
    const planId = typeof p.planId === 'string' ? p.planId : '';
    if (planId && isValidAppRoute(`/planos-acao/${planId}`)) return applyPayloadToRoute(`/planos-acao/${planId}`, p);
    if (id && isValidAppRoute(`/planos-acao/${id}`)) return applyPayloadToRoute(`/planos-acao/${id}`, p);
    if (contentId && isValidAppRoute(`/conteudos/${contentId}`)) return applyPayloadToRoute(`/conteudos/${contentId}`, p);
    if (isValidAppRoute('/planos-acao')) return applyPayloadToRoute('/planos-acao', p);
    if (isValidAppRoute('/diagnostico')) return applyPayloadToRoute('/diagnostico', p);
    if (isValidAppRoute('/conteudos')) return applyPayloadToRoute('/conteudos', p);
  }

  return '/dashboard';
};

export async function getAgentContext(): Promise<AgentContext> {
  const res = await api.get('/api/agent/context');
  if (!res.ok) throw new Error('Falha ao carregar contexto do agente');
  return (await res.json()) as AgentContext;
}

export async function sendAgentMessage(message: string) {
  console.log('Sending agent message:', message);
  try {
    const res = await api.post('/api/agent/chat', { message });
    if (!res.ok) {
      console.error('Agent chat error:', res.status, res.statusText);
      const errBody = await res.text();
      console.error('Error body:', errBody);
      throw new Error(`Falha ao enviar mensagem ao agente: ${res.status} ${res.statusText}`);
    }
    return res.json();
  } catch (err) {
    console.error('Agent chat exception:', err);
    throw err;
  }
}
