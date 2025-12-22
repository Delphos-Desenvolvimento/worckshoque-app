import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, FileText, TrendingUp, Eye, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface Diagnostic {
  id: string;
  questionnaire: {
    title: string;
    type: string;
  };
  generated_at: string;
  status: string;
  score?: number;
  insights?: Record<string, unknown>;
  recommendations?: Record<string, unknown>;
}

export default function MeusDiagnosticos() {
  const [diagnostics, setDiagnostics] = useState<Diagnostic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDiagnostics = async () => {
      try {
        setLoading(true);
        const response = await api.get('/diagnostics');
        if (response.ok) {
          const data = await response.json();
          setDiagnostics(data);
        } else {
          toast.error('Erro ao carregar diagnósticos');
        }
      } catch (error) {
        console.error('Erro:', error);
        toast.error('Erro ao conectar com o servidor');
      } finally {
        setLoading(false);
      }
    };

    fetchDiagnostics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Meus Diagnósticos</h1>
        <p className="text-muted-foreground">
          Histórico completo dos seus diagnósticos realizados
        </p>
      </div>

      <div className="grid gap-6">
        {diagnostics.length === 0 ? (
          <div className="text-center py-12 bg-muted/20 rounded-lg">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Nenhum diagnóstico encontrado</h3>
            <p className="text-muted-foreground">Você ainda não realizou nenhum diagnóstico.</p>
          </div>
        ) : (
          diagnostics.map((diagnostico) => (
            <Card key={diagnostico.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      {diagnostico.questionnaire.title}
                    </CardTitle>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(diagnostico.generated_at).toLocaleDateString('pt-BR')}
                      </div>
                      {/* Score ainda não retornado diretamente, placeholder */}
                      {/* <div className="flex items-center gap-1">
                        <TrendingUp className="w-4 h-4" />
                        Score: 8.5/10
                      </div> */}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={diagnostico.status === 'completed' ? 'default' : 'secondary'}
                    >
                      {diagnostico.status === 'completed' ? 'Concluído' : 
                       diagnostico.status === 'processing' ? 'Processando' : 
                       diagnostico.status === 'failed' ? 'Falha' : diagnostico.status}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4 mr-2" />
                      Ver Detalhes
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
