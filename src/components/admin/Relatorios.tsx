import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  BarChart3, 
  Download, 
  Calendar, 
  TrendingUp, 
  Users, 
  FileText,
  Target,
  Award,
  Filter
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

const mockMetricas = {
  totalUsuarios: 47,
  diagnosticosRealizados: 156,
  planosAtivos: 23,
  conquistasObtidas: 89,
  engajamento: 78,
  satisfacao: 8.4
};

const mockRelatoriosMensais = [
  { mes: 'Janeiro', diagnosticos: 45, planos: 12, engajamento: 85 },
  { mes: 'Dezembro', diagnosticos: 38, planos: 15, engajamento: 72 },
  { mes: 'Novembro', diagnosticos: 42, planos: 8, engajamento: 68 },
  { mes: 'Outubro', diagnosticos: 31, planos: 11, engajamento: 75 }
];

const mockRelatoriosDepartamento = [
  { departamento: 'TI', usuarios: 12, diagnosticos: 48, satisfacao: 8.2 },
  { departamento: 'RH', usuarios: 8, diagnosticos: 32, satisfacao: 8.7 },
  { departamento: 'Vendas', usuarios: 15, diagnosticos: 45, satisfacao: 7.8 },
  { departamento: 'Marketing', usuarios: 7, diagnosticos: 21, satisfacao: 8.5 },
  { departamento: 'Financeiro', usuarios: 5, diagnosticos: 10, satisfacao: 7.9 }
];

export default function Relatorios() {
  const [periodoFiltro, setPeriodoFiltro] = useState("ultimo-mes");
  const [departamentoFiltro, setDepartamentoFiltro] = useState("todos");

  const gerarRelatorio = (tipo: string) => {
    console.log(`Gerando relatório: ${tipo}`);
    // Aqui seria a integração para gerar o relatório
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Relatórios & Métricas</h1>
          <p className="text-muted-foreground">
            Análise completa do desempenho da empresa
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Exportar PDF
          </Button>
          <Button className="gap-2">
            <Download className="w-4 h-4" />
            Exportar Excel
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filtros:</span>
            </div>
            <Select value={periodoFiltro} onValueChange={setPeriodoFiltro}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ultimo-mes">Último Mês</SelectItem>
                <SelectItem value="ultimo-trimestre">Último Trimestre</SelectItem>
                <SelectItem value="ultimo-semestre">Último Semestre</SelectItem>
                <SelectItem value="ultimo-ano">Último Ano</SelectItem>
              </SelectContent>
            </Select>
            <Select value={departamentoFiltro} onValueChange={setDepartamentoFiltro}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Departamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="ti">TI</SelectItem>
                <SelectItem value="rh">RH</SelectItem>
                <SelectItem value="vendas">Vendas</SelectItem>
                <SelectItem value="marketing">Marketing</SelectItem>
                <SelectItem value="financeiro">Financeiro</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* KPIs Principais */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{mockMetricas.totalUsuarios}</p>
                <p className="text-xs text-muted-foreground">Usuários</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{mockMetricas.diagnosticosRealizados}</p>
                <p className="text-xs text-muted-foreground">Diagnósticos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-accent" />
              <div>
                <p className="text-2xl font-bold">{mockMetricas.planosAtivos}</p>
                <p className="text-xs text-muted-foreground">Planos Ativos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold">{mockMetricas.conquistasObtidas}</p>
                <p className="text-xs text-muted-foreground">Conquistas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{mockMetricas.engajamento}%</p>
                <p className="text-xs text-muted-foreground">Engajamento</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{mockMetricas.satisfacao}</p>
                <p className="text-xs text-muted-foreground">Satisfação</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Relatório Mensal */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Desempenho Mensal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockRelatoriosMensais.map((mes, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{mes.mes}</span>
                    <Badge variant="outline">Engajamento: {mes.engajamento}%</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Diagnósticos: </span>
                      <span className="font-medium">{mes.diagnosticos}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Planos: </span>
                      <span className="font-medium">{mes.planos}</span>
                    </div>
                  </div>
                  <Progress value={mes.engajamento} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Relatório por Departamento */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Desempenho por Departamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockRelatoriosDepartamento.map((dept, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-semibold">{dept.departamento}</h4>
                    <Badge variant="default">
                      Nota: {dept.satisfacao}/10
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="text-center">
                      <p className="text-lg font-bold text-primary">{dept.usuarios}</p>
                      <p className="text-muted-foreground">Usuários</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-accent">{dept.diagnosticos}</p>
                      <p className="text-muted-foreground">Diagnósticos</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-green-600">{dept.satisfacao}</p>
                      <p className="text-muted-foreground">Satisfação</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ações de Relatório */}
      <Card>
        <CardHeader>
          <CardTitle>Gerar Relatórios Personalizados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button 
              variant="outline" 
              className="h-20 flex-col gap-2"
              onClick={() => gerarRelatorio('diagnosticos')}
            >
              <FileText className="w-6 h-6" />
              Relatório de Diagnósticos
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex-col gap-2"
              onClick={() => gerarRelatorio('engajamento')}
            >
              <TrendingUp className="w-6 h-6" />
              Relatório de Engajamento
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex-col gap-2"
              onClick={() => gerarRelatorio('satisfacao')}
            >
              <BarChart3 className="w-6 h-6" />
              Pesquisa de Satisfação
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex-col gap-2"
              onClick={() => gerarRelatorio('completo')}
            >
              <Download className="w-6 h-6" />
              Relatório Completo
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}