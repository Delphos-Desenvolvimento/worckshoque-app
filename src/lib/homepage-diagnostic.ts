import { useEffect, useMemo, useState } from 'react';

export type HomepageDiagnosticConfig = {
  heroTitle: string;
  heroHighlight: string;
  heroDescription: string;
  heroPrimaryButton: string;
  heroSecondaryButton: string;
  ctaTitle: string;
  ctaDescription: string;
  ctaButton: string;
  modalTitle: string;
  modalSchema: DiagnosticModalSchema;
};

export type DiagnosticModalFieldType =
  | 'text'
  | 'textarea'
  | 'select'
  | 'radio'
  | 'number'
  | 'email'
  | 'date'
  | 'checkbox';

export type DiagnosticModalField = {
  id: string;
  key: string;
  label: string;
  type: DiagnosticModalFieldType;
  category?: string;
  required?: boolean;
  placeholder?: string;
  helpText?: string;
  defaultValue?: string;
  options?: string[];
  min?: number;
  max?: number;
  step?: number;
  rows?: number;
};

export type DiagnosticModalPageType = 'form' | 'summary';

export type DiagnosticModalPage = {
  id: string;
  type: DiagnosticModalPageType;
  title: string;
  description?: string;
  fields: DiagnosticModalField[];
};

export type DiagnosticModalSchema = {
  pages: DiagnosticModalPage[];
  categories?: string[];
};

export const DEFAULT_HOMEPAGE_DIAGNOSTIC_CONFIG: HomepageDiagnosticConfig = {
  heroTitle: 'Transforme seu ambiente de trabalho com',
  heroHighlight: 'diagnósticos inteligentes',
  heroDescription:
    'Descubra problemas, receba planos de ação personalizados e acompanhe o progresso da sua equipe em tempo real.',
  heroPrimaryButton: 'Fazer Diagnóstico Gratuito',
  heroSecondaryButton: 'Saiba Mais',
  ctaTitle: 'Pronto para transformar sua empresa?',
  ctaDescription:
    'Comece agora mesmo com um diagnóstico gratuito e descubra como podemos ajudar a melhorar seu ambiente de trabalho.',
  ctaButton: 'Começar Diagnóstico',
  modalTitle: 'Novo Diagnóstico',
  modalSchema: {
    categories: ['Informações', 'Problemas', 'Objetivos', 'Urgência', 'Outros'],
    pages: [
      {
        id: 'page-informacoes',
        type: 'form',
        title: 'Configure seu novo diagnóstico',
        description:
          'Preencha as informações abaixo para criar um diagnóstico alinhado à sua realidade.',
        fields: [
          {
            id: 'field-title',
            key: 'title',
            label: 'Nome do diagnóstico',
            type: 'textarea',
            category: 'Informações',
            required: true,
            placeholder:
              'Ex: Diagnóstico de Clima Organizacional da Equipe de Vendas',
          },
          {
            id: 'field-area',
            key: 'area',
            label: 'Área ou setor avaliado',
            type: 'textarea',
            category: 'Informações',
            required: true,
            placeholder: 'Ex: Vendas, Marketing, Operações, Empresa inteira',
          },
          {
            id: 'field-teamSize',
            key: 'teamSize',
            label: 'Tamanho aproximado da equipe',
            type: 'textarea',
            category: 'Informações',
            placeholder: 'Ex: 12 pessoas, 3 líderes e 9 analistas',
          },
        ],
      },
      {
        id: 'page-problemas',
        type: 'form',
        title: 'Problemas e objetivos',
        description:
          'Descreva os principais desafios e o que você quer alcançar com este diagnóstico.',
        fields: [
          {
            id: 'field-painPoints',
            key: 'painPoints',
            label: 'Quais problemas você quer entender?',
            type: 'textarea',
            category: 'Problemas',
            required: true,
            placeholder:
              'Descreva os principais desafios, sintomas ou sinais que você está percebendo.',
          },
          {
            id: 'field-goals',
            key: 'goals',
            label: 'Qual é o objetivo deste diagnóstico?',
            type: 'textarea',
            category: 'Objetivos',
            required: true,
            placeholder:
              'Ex: identificar causas de turnover, medir engajamento, mapear conflitos de liderança.',
          },
        ],
      },
      {
        id: 'page-urgencia',
        type: 'form',
        title: 'Urgência e horizonte',
        description: 'Ajuste a urgência e o prazo para criação de ações.',
        fields: [
          {
            id: 'field-urgency',
            key: 'urgency',
            label: 'Qual é o nível de urgência?',
            type: 'radio',
            category: 'Urgência',
            required: true,
            options: ['baixa', 'media', 'alta'],
          },
          {
            id: 'field-timeframe',
            key: 'timeframe',
            label: 'Horizonte desejado para ações',
            type: 'radio',
            category: 'Urgência',
            required: true,
            options: ['30_dias', '60_dias', '90_dias'],
          },
        ],
      },
      {
        id: 'page-resumo',
        type: 'summary',
        title: 'Resumo',
        description: 'Revise suas informações antes de finalizar.',
        fields: [
          {
            id: 'field-description',
            key: 'description',
            label: 'Observações adicionais',
            type: 'textarea',
            category: 'Outros',
            placeholder:
              'Inclua qualquer detalhe que ajude a IA a gerar um diagnóstico mais preciso.',
          },
        ],
      },
    ],
  },
};

const STORAGE_KEY = 'workchoq.homepageDiagnosticConfig.v1';
const PREVIEW_STORAGE_KEY = 'workchoq.homepageDiagnosticPreview.v1';
export const HOMEPAGE_DIAGNOSTIC_CONFIG_UPDATED_EVENT =
  'workchoq:homepageDiagnosticConfigUpdated';
export const HOMEPAGE_DIAGNOSTIC_PREVIEW_UPDATED_EVENT =
  'workchoq:homepageDiagnosticPreviewUpdated';
export const HOMEPAGE_DIAGNOSTIC_PREVIEW_MESSAGE_TYPE =
  'workchoq:homepageDiagnosticPreviewMessage';

function parseConfig(raw: string | null): HomepageDiagnosticConfig {
  try {
    if (!raw) return DEFAULT_HOMEPAGE_DIAGNOSTIC_CONFIG;
    const parsed = JSON.parse(raw) as Partial<HomepageDiagnosticConfig>;
    const schema = (() => {
      const maybe = (parsed as Partial<HomepageDiagnosticConfig>).modalSchema as unknown;
      if (!maybe || typeof maybe !== 'object') return DEFAULT_HOMEPAGE_DIAGNOSTIC_CONFIG.modalSchema;
      const obj = maybe as { pages?: unknown; categories?: unknown };
      if (!Array.isArray(obj.pages)) return DEFAULT_HOMEPAGE_DIAGNOSTIC_CONFIG.modalSchema;
      const categories =
        Array.isArray(obj.categories) &&
        obj.categories.every((c) => typeof c === 'string' && c.trim().length > 0)
          ? (obj.categories as string[])
          : undefined;
      const pages = obj.pages
        .map((p) => {
          if (!p || typeof p !== 'object') return null;
          const page = p as Record<string, unknown>;
          const id = typeof page.id === 'string' ? page.id : `page-${Date.now()}`;
          const type =
            page.type === 'form' || page.type === 'summary' ? page.type : 'form';
          const title = typeof page.title === 'string' ? page.title : 'Página';
          const description =
            typeof page.description === 'string' ? page.description : undefined;
          const fieldsRaw = page.fields;
          const fields = Array.isArray(fieldsRaw)
            ? fieldsRaw
                .map((f) => {
                  if (!f || typeof f !== 'object') return null;
                  const field = f as Record<string, unknown>;
                  const fid =
                    typeof field.id === 'string' ? field.id : `field-${Date.now()}`;
                  const key =
                    typeof field.key === 'string' ? field.key : `field_${Date.now()}`;
                  const label =
                    typeof field.label === 'string' ? field.label : 'Campo';
                  const t = field.type;
                  const fieldType: DiagnosticModalFieldType =
                    t === 'text' ||
                    t === 'textarea' ||
                    t === 'select' ||
                    t === 'radio' ||
                    t === 'number' ||
                    t === 'email' ||
                    t === 'date' ||
                    t === 'checkbox'
                      ? t
                      : 'text';
                  const category =
                    typeof field.category === 'string'
                      ? field.category.trim()
                      : undefined;
                  const required =
                    typeof field.required === 'boolean' ? field.required : undefined;
                  const placeholder =
                    typeof field.placeholder === 'string' ? field.placeholder : undefined;
                  const helpText =
                    typeof field.helpText === 'string' ? field.helpText : undefined;
                  const defaultValue =
                    typeof field.defaultValue === 'string'
                      ? field.defaultValue
                      : undefined;
                  const optionsRaw = field.options;
                  const options =
                    Array.isArray(optionsRaw) && optionsRaw.every((o) => typeof o === 'string')
                      ? (optionsRaw as string[])
                      : undefined;
                  const min = typeof field.min === 'number' ? field.min : undefined;
                  const max = typeof field.max === 'number' ? field.max : undefined;
                  const step = typeof field.step === 'number' ? field.step : undefined;
                  const rows = typeof field.rows === 'number' ? field.rows : undefined;
                  const parsedField: DiagnosticModalField = {
                    id: fid,
                    key,
                    label,
                    type: fieldType,
                    ...(typeof category === 'string' && category.length > 0
                      ? { category }
                      : {}),
                    ...(typeof required === 'boolean' ? { required } : {}),
                    ...(typeof placeholder === 'string' && placeholder.length > 0
                      ? { placeholder }
                      : {}),
                    ...(typeof helpText === 'string' && helpText.length > 0
                      ? { helpText }
                      : {}),
                    ...(typeof defaultValue === 'string' && defaultValue.length > 0
                      ? { defaultValue }
                      : {}),
                    ...(Array.isArray(options) && options.length > 0
                      ? { options }
                      : {}),
                    ...(typeof min === 'number' ? { min } : {}),
                    ...(typeof max === 'number' ? { max } : {}),
                    ...(typeof step === 'number' ? { step } : {}),
                    ...(typeof rows === 'number' ? { rows } : {}),
                  };
                  return parsedField;
                })
                .filter((v): v is DiagnosticModalField => v !== null)
            : [];
          const parsedPage: DiagnosticModalPage = {
            id,
            type,
            title,
            ...(typeof description === 'string' && description.length > 0
              ? { description }
              : {}),
            fields,
          };
          return parsedPage;
        })
        .filter((v): v is DiagnosticModalPage => v !== null);
      if (pages.length === 0) return DEFAULT_HOMEPAGE_DIAGNOSTIC_CONFIG.modalSchema;
      return {
        pages,
        ...(Array.isArray(categories) && categories.length > 0 ? { categories } : {}),
      } satisfies DiagnosticModalSchema;
    })();
    const merged: HomepageDiagnosticConfig = {
      ...DEFAULT_HOMEPAGE_DIAGNOSTIC_CONFIG,
      ...Object.fromEntries(Object.entries(parsed).filter(([, v]) => typeof v === 'string')),
      modalSchema: schema,
    };
    return merged;
  } catch {
    return DEFAULT_HOMEPAGE_DIAGNOSTIC_CONFIG;
  }
}

export function loadHomepageDiagnosticConfig(): HomepageDiagnosticConfig {
  return parseConfig(localStorage.getItem(STORAGE_KEY));
}

export function saveHomepageDiagnosticConfig(config: HomepageDiagnosticConfig) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  window.dispatchEvent(new Event(HOMEPAGE_DIAGNOSTIC_CONFIG_UPDATED_EVENT));
}

export function resetHomepageDiagnosticConfig() {
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event(HOMEPAGE_DIAGNOSTIC_CONFIG_UPDATED_EVENT));
}

export function loadHomepageDiagnosticPreviewConfig(): HomepageDiagnosticConfig {
  return parseConfig(sessionStorage.getItem(PREVIEW_STORAGE_KEY));
}

export function saveHomepageDiagnosticPreviewConfig(
  config: HomepageDiagnosticConfig,
) {
  sessionStorage.setItem(PREVIEW_STORAGE_KEY, JSON.stringify(config));
  window.dispatchEvent(new Event(HOMEPAGE_DIAGNOSTIC_PREVIEW_UPDATED_EVENT));
}

export function clearHomepageDiagnosticPreviewConfig() {
  sessionStorage.removeItem(PREVIEW_STORAGE_KEY);
  window.dispatchEvent(new Event(HOMEPAGE_DIAGNOSTIC_PREVIEW_UPDATED_EVENT));
}

export function useHomepageDiagnosticConfig(options?: {
  mode?: 'saved' | 'preview';
}): HomepageDiagnosticConfig {
  const mode = options?.mode ?? 'saved';
  const [config, setConfig] = useState<HomepageDiagnosticConfig>(() => {
    return mode === 'preview'
      ? loadHomepageDiagnosticPreviewConfig()
      : loadHomepageDiagnosticConfig();
  });

  useEffect(() => {
    const refresh = () =>
      setConfig(
        mode === 'preview'
          ? loadHomepageDiagnosticPreviewConfig()
          : loadHomepageDiagnosticConfig(),
      );
    const handleMessage = (event: MessageEvent<unknown>) => {
      if (
        typeof event.data === 'object' &&
        event.data !== null &&
        'type' in event.data &&
        (event.data as { type?: string }).type ===
          HOMEPAGE_DIAGNOSTIC_PREVIEW_MESSAGE_TYPE
      ) {
        refresh();
      }
    };
    if (mode === 'saved') window.addEventListener('storage', refresh);
    window.addEventListener(HOMEPAGE_DIAGNOSTIC_CONFIG_UPDATED_EVENT, refresh);
    window.addEventListener(HOMEPAGE_DIAGNOSTIC_PREVIEW_UPDATED_EVENT, refresh);
    window.addEventListener('message', handleMessage);
    return () => {
      if (mode === 'saved') window.removeEventListener('storage', refresh);
      window.removeEventListener(HOMEPAGE_DIAGNOSTIC_CONFIG_UPDATED_EVENT, refresh);
      window.removeEventListener(
        HOMEPAGE_DIAGNOSTIC_PREVIEW_UPDATED_EVENT,
        refresh,
      );
      window.removeEventListener('message', handleMessage);
    };
  }, [mode]);

  return useMemo(() => config, [config]);
}
