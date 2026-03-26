import React, { useEffect, useMemo, useState } from 'react';
import {
  ExternalLink,
  RotateCcw,
  Save,
  Settings,
  Smartphone,
  Monitor,
  RefreshCw,
  Undo2,
} from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  DEFAULT_HOMEPAGE_DIAGNOSTIC_CONFIG,
  loadHomepageDiagnosticConfig,
  resetHomepageDiagnosticConfig,
  saveHomepageDiagnosticConfig,
  saveHomepageDiagnosticPreviewConfig,
  type DiagnosticModalField,
  type DiagnosticModalFieldType,
  type DiagnosticModalPage,
  type DiagnosticModalPageType,
  type HomepageDiagnosticConfig,
} from '@/lib/homepage-diagnostic';
import HomepageDiagnosticPreview from '@/components/site/HomepageDiagnosticPreview';

export default function DiagnosticoInicialEditor() {
  const [baseline, setBaseline] = useState<HomepageDiagnosticConfig>(() =>
    loadHomepageDiagnosticConfig(),
  );
  const [form, setForm] = useState<HomepageDiagnosticConfig>(() =>
    loadHomepageDiagnosticConfig(),
  );
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>(
    'desktop',
  );
  const [previewRevision, setPreviewRevision] = useState(0);
  const previewUrl = '/?previewHomepageDiagnostic=1';

  const isDirty = useMemo(() => {
    return JSON.stringify(form) !== JSON.stringify(baseline);
  }, [form, baseline]);

  useEffect(() => {
    saveHomepageDiagnosticPreviewConfig(form);
  }, [form]);

  const onSave = () => {
    saveHomepageDiagnosticConfig(form);
    setBaseline(form);
    toast.success('Configurações do diagnóstico inicial salvas');
  };

  const onReset = () => {
    resetHomepageDiagnosticConfig();
    setForm(DEFAULT_HOMEPAGE_DIAGNOSTIC_CONFIG);
    setBaseline(DEFAULT_HOMEPAGE_DIAGNOSTIC_CONFIG);
    toast.success('Configurações restauradas para o padrão');
  };

  const onRevert = () => {
    setForm(baseline);
    toast.success('Alterações revertidas');
  };

  const updateModalSchema = (updater: (prev: HomepageDiagnosticConfig) => HomepageDiagnosticConfig) => {
    setForm((prev) => updater(prev));
  };

  const addPage = () => {
    const now = Date.now();
    const newPage: DiagnosticModalPage = {
      id: `page-${now}`,
      type: 'form',
      title: 'Nova Página',
      description: '',
      fields: [],
    };
    updateModalSchema((prev) => ({
      ...prev,
      modalSchema: {
        ...prev.modalSchema,
        pages: [...prev.modalSchema.pages, newPage],
      },
    }));
  };

  const removePage = (pageId: string) => {
    updateModalSchema((prev) => ({
      ...prev,
      modalSchema: {
        ...prev.modalSchema,
        pages: prev.modalSchema.pages.filter((p) => p.id !== pageId),
      },
    }));
  };

  const movePage = (pageId: string, dir: -1 | 1) => {
    updateModalSchema((prev) => {
      const pages = [...prev.modalSchema.pages];
      const idx = pages.findIndex((p) => p.id === pageId);
      if (idx < 0) return prev;
      const nextIdx = idx + dir;
      if (nextIdx < 0 || nextIdx >= pages.length) return prev;
      const tmp = pages[idx];
      pages[idx] = pages[nextIdx];
      pages[nextIdx] = tmp;
      return { ...prev, modalSchema: { ...prev.modalSchema, pages } };
    });
  };

  const updatePage = (pageId: string, patch: Partial<DiagnosticModalPage>) => {
    updateModalSchema((prev) => ({
      ...prev,
      modalSchema: {
        ...prev.modalSchema,
        pages: prev.modalSchema.pages.map((p) =>
          p.id === pageId ? { ...p, ...patch } : p,
        ),
      },
    }));
  };

  const addField = (pageId: string) => {
    const now = Date.now();
    const field: DiagnosticModalField = {
      id: `field-${now}`,
      key: `field_${now}`,
      label: 'Novo Campo',
      type: 'text',
      category:
        form.modalSchema.categories && form.modalSchema.categories.length > 0
          ? form.modalSchema.categories[0]
          : undefined,
      required: false,
      placeholder: '',
    };
    updateModalSchema((prev) => ({
      ...prev,
      modalSchema: {
        ...prev.modalSchema,
        pages: prev.modalSchema.pages.map((p) =>
          p.id === pageId ? { ...p, fields: [...p.fields, field] } : p,
        ),
      },
    }));
  };

  const removeField = (pageId: string, fieldId: string) => {
    updateModalSchema((prev) => ({
      ...prev,
      modalSchema: {
        ...prev.modalSchema,
        pages: prev.modalSchema.pages.map((p) =>
          p.id === pageId
            ? { ...p, fields: p.fields.filter((f) => f.id !== fieldId) }
            : p,
        ),
      },
    }));
  };

  const moveField = (pageId: string, fieldId: string, dir: -1 | 1) => {
    updateModalSchema((prev) => {
      const pages = prev.modalSchema.pages.map((p) => ({ ...p, fields: [...p.fields] }));
      const page = pages.find((p) => p.id === pageId);
      if (!page) return prev;
      const idx = page.fields.findIndex((f) => f.id === fieldId);
      if (idx < 0) return prev;
      const nextIdx = idx + dir;
      if (nextIdx < 0 || nextIdx >= page.fields.length) return prev;
      const tmp = page.fields[idx];
      page.fields[idx] = page.fields[nextIdx];
      page.fields[nextIdx] = tmp;
      return { ...prev, modalSchema: { ...prev.modalSchema, pages } };
    });
  };

  const updateField = (
    pageId: string,
    fieldId: string,
    patch: Partial<DiagnosticModalField>,
  ) => {
    updateModalSchema((prev) => {
      const normalizeKey = (raw: string) => {
        const trimmed = raw.trim();
        const sanitized = trimmed
          .replace(/\s+/g, '_')
          .replace(/[^a-zA-Z0-9_]/g, '_')
          .replace(/_+/g, '_')
          .replace(/^_+|_+$/g, '');
        return sanitized;
      };

      const usedKeys = new Set<string>();
      for (const pg of prev.modalSchema.pages) {
        for (const f of pg.fields) {
          if (f.id === fieldId) continue;
          if (typeof f.key === 'string' && f.key.trim().length > 0) {
            usedKeys.add(f.key);
          }
        }
      }

      const nextPatch = { ...patch };
      if (typeof patch.key === 'string') {
        const base = normalizeKey(patch.key);
        const baseOrDefault = base.length > 0 ? base : `field_${Date.now()}`;
        let candidate = baseOrDefault;
        let i = 2;
        while (usedKeys.has(candidate)) {
          candidate = `${baseOrDefault}_${i}`;
          i += 1;
        }
        nextPatch.key = candidate;
      }

      if (typeof patch.category === 'string' && patch.category.trim().length === 0) {
        delete (nextPatch as Partial<DiagnosticModalField>).category;
      }
      if (typeof patch.placeholder === 'string' && patch.placeholder.trim().length === 0) {
        delete (nextPatch as Partial<DiagnosticModalField>).placeholder;
      }
      if (typeof patch.helpText === 'string' && patch.helpText.trim().length === 0) {
        delete (nextPatch as Partial<DiagnosticModalField>).helpText;
      }
      if (
        typeof patch.defaultValue === 'string' &&
        patch.defaultValue.trim().length === 0
      ) {
        delete (nextPatch as Partial<DiagnosticModalField>).defaultValue;
      }
      if (Array.isArray(patch.options) && patch.options.length === 0) {
        delete (nextPatch as Partial<DiagnosticModalField>).options;
      }
      if (typeof patch.min === 'number' && Number.isNaN(patch.min)) {
        delete (nextPatch as Partial<DiagnosticModalField>).min;
      }
      if (typeof patch.max === 'number' && Number.isNaN(patch.max)) {
        delete (nextPatch as Partial<DiagnosticModalField>).max;
      }
      if (typeof patch.step === 'number' && Number.isNaN(patch.step)) {
        delete (nextPatch as Partial<DiagnosticModalField>).step;
      }
      if (typeof patch.rows === 'number' && Number.isNaN(patch.rows)) {
        delete (nextPatch as Partial<DiagnosticModalField>).rows;
      }

      return {
        ...prev,
        modalSchema: {
          ...prev.modalSchema,
          pages: prev.modalSchema.pages.map((p) =>
            p.id === pageId
              ? {
                  ...p,
                  fields: p.fields.map((f) =>
                    f.id === fieldId ? { ...f, ...nextPatch } : f,
                  ),
                }
              : p,
          ),
        },
      };
    });
  };

  const normalizeOptions = (raw: string) => {
    return raw
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
  };

  const normalizeCategories = (raw: string) => {
    return raw
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
  };

  const reloadPreview = () => {
    setPreviewRevision((prev) => prev + 1);
  };

  const openPreview = () => {
    saveHomepageDiagnosticPreviewConfig(form);
    window.open(previewUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Diagnóstico Inicial"
        description="Edite os textos e botões do diagnóstico na página inicial"
        icon={Settings}
        actions={[
          {
            label: 'Restaurar Padrão',
            icon: RotateCcw,
            onClick: onReset,
            variant: 'secondary',
          },
          {
            label: 'Reverter',
            icon: Undo2,
            onClick: onRevert,
            variant: 'secondary',
            disabled: !isDirty,
          },
          {
            label: 'Salvar',
            icon: Save,
            onClick: onSave,
            variant: 'primary',
            disabled: !isDirty,
          },
        ]}
      />

      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Hero</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-sm font-medium">Título</div>
                  <Input
                    value={form.heroTitle}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, heroTitle: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium">Destaque</div>
                  <Input
                    value={form.heroHighlight}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        heroHighlight: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <div className="text-sm font-medium">Descrição</div>
                  <Textarea
                    value={form.heroDescription}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        heroDescription: e.target.value,
                      }))
                    }
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium">Botão Primário</div>
                  <Input
                    value={form.heroPrimaryButton}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        heroPrimaryButton: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium">Botão Secundário</div>
                  <Input
                    value={form.heroSecondaryButton}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        heroSecondaryButton: e.target.value,
                      }))
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>CTA</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <div className="text-sm font-medium">Título</div>
                  <Input
                    value={form.ctaTitle}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, ctaTitle: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <div className="text-sm font-medium">Descrição</div>
                  <Textarea
                    value={form.ctaDescription}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        ctaDescription: e.target.value,
                      }))
                    }
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium">Botão</div>
                  <Input
                    value={form.ctaButton}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, ctaButton: e.target.value }))
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Modal</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-sm font-medium">Título do Modal</div>
                  <Input
                    value={form.modalTitle}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, modalTitle: e.target.value }))
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2">
                <CardTitle>Campos e páginas do Modal</CardTitle>
                <Button variant="outline" size="sm" onClick={addPage}>
                  Adicionar Página
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border p-4 space-y-2">
                  <div className="text-sm font-medium">Categorias (uma por linha)</div>
                  <Textarea
                    value={(form.modalSchema.categories ?? []).join('\n')}
                    onChange={(e) =>
                      updateModalSchema((prev) => ({
                        ...prev,
                        modalSchema: {
                          ...prev.modalSchema,
                          categories: normalizeCategories(e.target.value),
                        },
                      }))
                    }
                    rows={4}
                  />
                </div>
                {form.modalSchema.pages.map((page, pageIndex) => (
                  <div key={page.id} className="rounded-lg border p-4 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-sm font-medium">
                        Página {pageIndex + 1}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => movePage(page.id, -1)}
                          disabled={pageIndex === 0}
                        >
                          Subir
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => movePage(page.id, 1)}
                          disabled={pageIndex === form.modalSchema.pages.length - 1}
                        >
                          Descer
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => removePage(page.id)}
                          disabled={form.modalSchema.pages.length <= 1}
                        >
                          Remover
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="text-sm font-medium">Título</div>
                        <Input
                          value={page.title}
                          onChange={(e) =>
                            updatePage(page.id, { title: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="text-sm font-medium">Tipo</div>
                        <Select
                          value={page.type}
                          onValueChange={(value) =>
                            updatePage(page.id, {
                              type: value as DiagnosticModalPageType,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="form">Form</SelectItem>
                            <SelectItem value="summary">Resumo</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <div className="text-sm font-medium">Descrição</div>
                        <Textarea
                          value={page.description ?? ''}
                          onChange={(e) =>
                            updatePage(page.id, { description: e.target.value })
                          }
                          rows={3}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-medium">Campos</div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addField(page.id)}
                      >
                        Adicionar Campo
                      </Button>
                    </div>

                    <div className="space-y-3">
                      {page.fields.map((field, fieldIndex) => (
                        <div
                          key={field.id}
                          className="rounded-lg border p-3 space-y-3"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="text-sm font-medium">
                              Campo {fieldIndex + 1}
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => moveField(page.id, field.id, -1)}
                                disabled={fieldIndex === 0}
                              >
                                Subir
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => moveField(page.id, field.id, 1)}
                                disabled={fieldIndex === page.fields.length - 1}
                              >
                                Descer
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => removeField(page.id, field.id)}
                              >
                                Remover
                              </Button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <div className="text-sm font-medium">Nome</div>
                              <Input
                                value={field.label}
                                onChange={(e) =>
                                  updateField(page.id, field.id, {
                                    label: e.target.value,
                                  })
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <div className="text-sm font-medium">Chave</div>
                              <Input
                                value={field.key}
                                onChange={(e) =>
                                  updateField(page.id, field.id, {
                                    key: e.target.value,
                                  })
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <div className="text-sm font-medium">Tipo</div>
                              <Select
                                value={field.type}
                                onValueChange={(value) => {
                                  const nextType = value as DiagnosticModalFieldType;
                                  const needsOptions =
                                    (nextType === 'radio' || nextType === 'select') &&
                                    (!field.options || field.options.length === 0);
                                  const wantsRows =
                                    nextType === 'textarea' &&
                                    (typeof field.rows !== 'number' || Number.isNaN(field.rows));
                                  const wantsCheckboxDefault =
                                    nextType === 'checkbox' &&
                                    typeof field.defaultValue !== 'string';
                                  updateField(page.id, field.id, {
                                    type: nextType,
                                    options: needsOptions
                                      ? ['Opção 1', 'Opção 2']
                                      : field.options,
                                    rows: wantsRows ? 4 : field.rows,
                                    defaultValue: wantsCheckboxDefault
                                      ? 'false'
                                      : field.defaultValue,
                                  });
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="text">Texto</SelectItem>
                                  <SelectItem value="textarea">
                                    Texto longo
                                  </SelectItem>
                                  <SelectItem value="number">Número</SelectItem>
                                  <SelectItem value="email">Email</SelectItem>
                                  <SelectItem value="date">Data</SelectItem>
                                  <SelectItem value="checkbox">Checkbox</SelectItem>
                                  <SelectItem value="select">Select</SelectItem>
                                  <SelectItem value="radio">Radio</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <div className="text-sm font-medium">Categoria</div>
                              {form.modalSchema.categories &&
                              form.modalSchema.categories.length > 0 ? (
                                <Select
                                  value={
                                    field.category
                                      ? field.category.toString()
                                      : '__none__'
                                  }
                                  onValueChange={(value) =>
                                    updateField(page.id, field.id, {
                                      category:
                                        value === '__none__' ? '' : value,
                                    })
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="__none__">
                                      Sem categoria
                                    </SelectItem>
                                    {form.modalSchema.categories.map((c) => (
                                      <SelectItem key={c} value={c}>
                                        {c}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              ) : (
                                <Input
                                  value={field.category ?? ''}
                                  onChange={(e) =>
                                    updateField(page.id, field.id, {
                                      category: e.target.value,
                                    })
                                  }
                                />
                              )}
                            </div>
                            <div className="space-y-2">
                              <div className="text-sm font-medium">Obrigatório</div>
                              <div className="flex items-center gap-2 h-10">
                                <Checkbox
                                  checked={!!field.required}
                                  onCheckedChange={(v) =>
                                    updateField(page.id, field.id, {
                                      required: v === true,
                                    })
                                  }
                                />
                                <div className="text-sm text-muted-foreground">
                                  {field.required ? 'Sim' : 'Não'}
                                </div>
                              </div>
                            </div>
                            <div className="space-y-2 md:col-span-2">
                              <div className="text-sm font-medium">Placeholder</div>
                              <Input
                                value={field.placeholder ?? ''}
                                onChange={(e) =>
                                  updateField(page.id, field.id, {
                                    placeholder: e.target.value,
                                  })
                                }
                              />
                            </div>

                            <div className="space-y-2 md:col-span-2">
                              <div className="text-sm font-medium">Texto de ajuda</div>
                              <Textarea
                                value={field.helpText ?? ''}
                                onChange={(e) =>
                                  updateField(page.id, field.id, {
                                    helpText: e.target.value,
                                  })
                                }
                                rows={2}
                              />
                            </div>

                            {field.type !== 'checkbox' && (
                              <div className="space-y-2 md:col-span-2">
                                <div className="text-sm font-medium">Valor padrão</div>
                                <Input
                                  value={field.defaultValue ?? ''}
                                  onChange={(e) =>
                                    updateField(page.id, field.id, {
                                      defaultValue: e.target.value,
                                    })
                                  }
                                />
                              </div>
                            )}

                            {field.type === 'checkbox' && (
                              <div className="space-y-2 md:col-span-2">
                                <div className="text-sm font-medium">Padrão</div>
                                <div className="flex items-center gap-2 h-10">
                                  <Checkbox
                                    checked={(field.defaultValue ?? '') === 'true'}
                                    onCheckedChange={(v) =>
                                      updateField(page.id, field.id, {
                                        defaultValue: v === true ? 'true' : 'false',
                                      })
                                    }
                                  />
                                  <div className="text-sm text-muted-foreground">
                                    Marcado
                                  </div>
                                </div>
                              </div>
                            )}

                            {field.type === 'textarea' && (
                              <div className="space-y-2">
                                <div className="text-sm font-medium">Linhas</div>
                                <Input
                                  type="number"
                                  value={typeof field.rows === 'number' ? String(field.rows) : ''}
                                  onChange={(e) =>
                                    updateField(page.id, field.id, {
                                      rows:
                                        e.target.value.trim().length === 0
                                          ? Number.NaN
                                          : Number(e.target.value),
                                    })
                                  }
                                />
                              </div>
                            )}

                            {field.type === 'number' && (
                              <>
                                <div className="space-y-2">
                                  <div className="text-sm font-medium">Min</div>
                                  <Input
                                    type="number"
                                    value={typeof field.min === 'number' ? String(field.min) : ''}
                                    onChange={(e) =>
                                      updateField(page.id, field.id, {
                                        min:
                                          e.target.value.trim().length === 0
                                            ? Number.NaN
                                            : Number(e.target.value),
                                      })
                                    }
                                  />
                                </div>
                                <div className="space-y-2">
                                  <div className="text-sm font-medium">Max</div>
                                  <Input
                                    type="number"
                                    value={typeof field.max === 'number' ? String(field.max) : ''}
                                    onChange={(e) =>
                                      updateField(page.id, field.id, {
                                        max:
                                          e.target.value.trim().length === 0
                                            ? Number.NaN
                                            : Number(e.target.value),
                                      })
                                    }
                                  />
                                </div>
                                <div className="space-y-2">
                                  <div className="text-sm font-medium">Step</div>
                                  <Input
                                    type="number"
                                    value={typeof field.step === 'number' ? String(field.step) : ''}
                                    onChange={(e) =>
                                      updateField(page.id, field.id, {
                                        step:
                                          e.target.value.trim().length === 0
                                            ? Number.NaN
                                            : Number(e.target.value),
                                      })
                                    }
                                  />
                                </div>
                              </>
                            )}

                            {(field.type === 'radio' || field.type === 'select') && (
                              <div className="space-y-2 md:col-span-2">
                                <div className="text-sm font-medium">
                                  Opções (uma por linha)
                                </div>
                                <Textarea
                                  value={(field.options ?? []).join('\n')}
                                  onChange={(e) =>
                                    updateField(page.id, field.id, {
                                      options: normalizeOptions(e.target.value),
                                    })
                                  }
                                  rows={4}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={onSave} disabled={!isDirty}>
                <Save className="h-4 w-4 mr-2" />
                Salvar
              </Button>
            </div>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2">
                <CardTitle>Preview</CardTitle>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant={previewDevice === 'desktop' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPreviewDevice('desktop')}
                  >
                    <Monitor className="h-4 w-4 mr-2" />
                    Desktop
                  </Button>
                  <Button
                    variant={previewDevice === 'mobile' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPreviewDevice('mobile')}
                  >
                    <Smartphone className="h-4 w-4 mr-2" />
                    Mobile
                  </Button>
                  <Button variant="outline" size="sm" onClick={reloadPreview}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Atualizar
                  </Button>
                  <Button variant="outline" size="sm" onClick={openPreview}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Abrir
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div
                  className={
                    previewDevice === 'mobile'
                      ? 'mx-auto w-[390px] max-w-full'
                      : 'w-full'
                  }
                >
                  <div className="overflow-hidden rounded-lg border">
                    <div className="h-[780px] overflow-y-auto bg-background">
                      <HomepageDiagnosticPreview
                        key={previewRevision}
                        config={form}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
