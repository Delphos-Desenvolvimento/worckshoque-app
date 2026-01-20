import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { useAuthStore } from '@/stores/authStore';
import PageHeader from '@/components/common/PageHeader';
import DiagnosticGrid from '@/components/common/DiagnosticGrid';
import DiagnosticList from '@/components/common/DiagnosticList';
import DiagnosticTimeline from '@/components/common/DiagnosticTimeline';
import DiagnosticDetailModal from '@/components/common/DiagnosticDetailModal';
import ModalLayout from '@/components/common/ModalLayout';
import Diagnostico from '@/components/user/Diagnostico';
import { listDiagnostics } from '@/lib/diagnostics-api';
import { BarChart3, Filter, Grid3X3, List, Plus, Search, Calendar } from 'lucide-react';

interface DiagnosticUser {
  id: string;
  name: string;
  email: string;
}

interface DiagnosticData {
  id: string;
  questionnaire_id: string;
  questionnaire: {
    id: string;
    title: string;
    type: string;
  };
  insights: string[];
  recommendations: string[];
  areas_focus: string[];
  score_intelligent: number;
  status: string;
  generated_at: string;
  completed_at: string | null;
  analysis_data: Record<string, unknown>;
  user?: DiagnosticUser | null;
}

const Diagnosticos: React.FC = () => {
  const { token, user } = useAuthStore();

  const [diagnostics, setDiagnostics] = useState<DiagnosticData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'timeline'>('grid');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'processing' | 'failed'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const [selectedDiagnostic, setSelectedDiagnostic] = useState<DiagnosticData | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDiagnosticModalOpen, setIsDiagnosticModalOpen] = useState(false);

  const loadDiagnostics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!token && !useAuthStore.getState().token) {
        throw new Error('Token de autenticação não encontrado. Faça login novamente.');
      }

      const data = await listDiagnostics();

      if (!Array.isArray(data)) {
        throw new Error('Formato de dados inválido recebido do servidor.');
      }

      setDiagnostics(data as unknown as DiagnosticData[]);
    } catch (err: unknown) {
      console.error('Erro ao carregar diagnósticos:', err);
      const message = err instanceof Error ? err.message : 'Erro ao carregar diagnósticos.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      void loadDiagnostics();
    }
  }, [token, loadDiagnostics]);

  const filteredDiagnostics = useMemo(() => {
    return diagnostics
      .filter((d) => {
        if (statusFilter !== 'all' && d.status !== statusFilter) return false;
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
          d.questionnaire.title.toLowerCase().includes(term) ||
          d.questionnaire.type.toLowerCase().includes(term)
        );
      })
      .sort((a, b) => {
        const dateA = new Date(a.generated_at).getTime();
        const dateB = new Date(b.generated_at).getTime();
        return dateB - dateA;
      });
  }, [diagnostics, statusFilter, searchTerm]);

  const handleViewDiagnostic = (diagnostic: DiagnosticData) => {
    setSelectedDiagnostic(diagnostic);
    setIsDetailOpen(true);
  };

  const handleCloseDetail = () => {
    setIsDetailOpen(false);
    setSelectedDiagnostic(null);
  };

  const showOwner =
    user?.role === 'master' || user?.role === 'admin';

  return (
    <div className="space-y-8">
      <PageHeader
        title="Meus Diagnósticos"
        description="Acompanhe seus diagnósticos, evolução e insights gerados pela IA."
        icon={BarChart3}
        badges={[
          {
            label: `${diagnostics.length} diagnósticos realizados`,
            icon: Calendar,
          },
        ]}
        actions={[
          {
            label: 'Novo Diagnóstico',
            icon: Plus,
            onClick: () => setIsDiagnosticModalOpen(true),
            variant: 'primary',
          },
        ]}
      />

      <div className="container mx-auto px-4 space-y-6">
        <Card>
          <CardContent className="py-4 flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
            <div className="flex-1 flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por título ou tipo de diagnóstico..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-md"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select
                  value={statusFilter}
                  onValueChange={(value) =>
                    setStatusFilter(value as 'all' | 'completed' | 'processing' | 'failed')
                  }
                >
                  <SelectTrigger className="w-[170px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    <SelectItem value="completed">Concluídos</SelectItem>
                    <SelectItem value="processing">Processando</SelectItem>
                    <SelectItem value="failed">Falhos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'grid' | 'list' | 'timeline')}>
                <TabsList>
                  <TabsTrigger value="grid" className="flex items-center gap-2">
                    <Grid3X3 className="h-4 w-4" />
                    Grade
                  </TabsTrigger>
                  <TabsTrigger value="list" className="flex items-center gap-2">
                    <List className="h-4 w-4" />
                    Lista
                  </TabsTrigger>
                  <TabsTrigger value="timeline" className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Linha do tempo
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex items-center justify-center min-h-[320px] text-muted-foreground">
            Carregando diagnósticos...
          </div>
        ) : error ? (
          <div className="flex items-center justify-center min-h-[320px] text-center">
            <div className="space-y-3 max-w-md">
              <p className="font-medium">Não foi possível carregar seus diagnósticos.</p>
              <p className="text-muted-foreground text-sm">{error}</p>
              <Button onClick={loadDiagnostics}>Tentar novamente</Button>
            </div>
          </div>
        ) : filteredDiagnostics.length === 0 ? (
          <div className="flex items-center justify-center min-h-[320px]">
            <div className="text-center space-y-4 max-w-md">
              <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground" />
              <div className="space-y-2">
                <p className="text-lg font-semibold">
                  {searchTerm || statusFilter !== 'all'
                    ? 'Nenhum diagnóstico encontrado com esses filtros.'
                    : 'Você ainda não realizou nenhum diagnóstico.'}
                </p>
                <p className="text-muted-foreground text-sm">
                  Inicie um novo diagnóstico para gerar insights sobre o clima da sua empresa.
                </p>
              </div>
              <Button onClick={() => setIsDiagnosticModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Começar novo diagnóstico
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {viewMode === 'grid' && (
              <DiagnosticGrid
                diagnostics={filteredDiagnostics}
                onViewDiagnostic={handleViewDiagnostic}
                showOwner={showOwner}
              />
            )}
            {viewMode === 'list' && (
              <DiagnosticList
                diagnostics={filteredDiagnostics}
                onViewDiagnostic={handleViewDiagnostic}
                showOwner={showOwner}
              />
            )}
            {viewMode === 'timeline' && (
              <DiagnosticTimeline
                diagnostics={filteredDiagnostics}
                onViewDiagnostic={handleViewDiagnostic}
                showOwner={showOwner}
              />
            )}
          </div>
        )}
      </div>

      {selectedDiagnostic && (
        <DiagnosticDetailModal
          isOpen={isDetailOpen}
          onClose={handleCloseDetail}
          diagnostic={selectedDiagnostic}
        />
      )}

      <ModalLayout
        isOpen={isDiagnosticModalOpen}
        onClose={() => setIsDiagnosticModalOpen(false)}
        title="Novo Diagnóstico"
        size="xl"
      >
        <Diagnostico
          mode="modal"
          onComplete={() => {
            setIsDiagnosticModalOpen(false);
            void loadDiagnostics();
          }}
        />
      </ModalLayout>
    </div>
  );
};

export default Diagnosticos;
