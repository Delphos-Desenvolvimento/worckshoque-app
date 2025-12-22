import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import ModalLayout from '@/components/common/ModalLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { CheckCircle, ArrowLeft, UserPlus, Eye, EyeOff } from 'lucide-react';
import { axiosInstance } from '@/lib/api';

interface DiagnosticoData {
  questionnaire_id: string;
  answers: Record<string, string>;
  score: number;
  category: string;
  completedAt: string;
}

interface CadastroModalProps {
  isOpen: boolean;
  onClose: () => void;
  diagnosticoData?: DiagnosticoData | null;
}

const CadastroModal = ({ isOpen, onClose, diagnosticoData: propDiagnosticoData }: CadastroModalProps) => {
  const navigate = useNavigate();
  const { register } = useAuthStore();
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [diagnosticoData, setDiagnosticoData] = useState<DiagnosticoData | null>(propDiagnosticoData || null);
  
  // Form states
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    confirmarSenha: '',
    aceitarTermos: false
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Carregar dados do diagnóstico temporário (sempre usar localStorage)
  useEffect(() => {
    const tempDiagnostico = localStorage.getItem('tempDiagnostico');
    if (tempDiagnostico) {
      const data = JSON.parse(tempDiagnostico);
      console.log('📦 Dados carregados do localStorage:', data);
      setDiagnosticoData(data);
    } else if (propDiagnosticoData) {
      console.log('📦 Usando dados das props:', propDiagnosticoData);
      setDiagnosticoData(propDiagnosticoData);
    }
  }, [propDiagnosticoData, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.nome.trim()) {
      newErrors.nome = 'Nome é obrigatório';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'E-mail é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'E-mail inválido';
    }

    if (!formData.senha) {
      newErrors.senha = 'Senha é obrigatória';
    } else if (formData.senha.length < 6) {
      newErrors.senha = 'Senha deve ter pelo menos 6 caracteres';
    }

    if (formData.senha !== formData.confirmarSenha) {
      newErrors.confirmarSenha = 'Senhas não coincidem';
    }

    if (!formData.aceitarTermos) {
      newErrors.aceitarTermos = 'Você deve aceitar os termos de uso';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Limpar erro do campo quando usuário começar a digitar
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      // Preparar dados para cadastro (sem diagnóstico)
      const userData = {
        name: formData.nome,
        email: formData.email,
        password: formData.senha
      };
      
      // Usar o AuthContext para cadastro
      const success = await register(userData);
      
      if (success) {
        // Manter diagnóstico temporário para transferência após login
        // Mostrar modal de boas-vindas
        setShowWelcomeModal(true);
      } else {
        setErrors({ submit: 'E-mail já cadastrado. Tente fazer login ou use outro e-mail.' });
      }
      
    } catch (error) {
      console.error('Erro no cadastro:', error);
      setErrors({ submit: 'Erro ao criar conta. Tente novamente.' });
    } finally {
      setIsLoading(false);
    }
  };

  const transferDiagnosticoToDatabase = async (diagnosticoData: DiagnosticoData) => {
    try {
      console.log('🔍 Dados do diagnóstico para transferir:', diagnosticoData);
      
      const { token } = useAuthStore.getState();
      
      if (!token) {
        console.warn('Token não encontrado para transferir diagnóstico');
        return null;
      }

      if (!diagnosticoData.questionnaire_id) {
        console.warn('questionnaire_id não encontrado nos dados do diagnóstico');
        return null;
      }

      console.log('🔍 Token disponível:', !!token);
      console.log('🔍 questionnaire_id:', diagnosticoData.questionnaire_id);

      // Enviar respostas para o endpoint de transferência usando axiosInstance
      const response = await axiosInstance.post(
        `/questionnaires/${diagnosticoData.questionnaire_id}/transfer`,
        {
          responses: diagnosticoData.answers
        }
      );

      console.log('Diagnóstico transferido para o banco:', response.data);
      return response.data;
      
    } catch (error: unknown) {
      console.error('Erro ao transferir diagnóstico:', error);
      // Não falhar o cadastro se houver erro na transferência
      // O usuário ainda pode fazer o diagnóstico novamente
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number; data?: { message?: string } } };
        if (axiosError.response?.status === 401) {
          console.error('Erro 401 ao transferir diagnóstico - verificar token');
        }
      }
      return null;
    }
  };

  const handleWelcomeClose = () => {
    setShowWelcomeModal(false);
    onClose();
    navigate('/');
  };

  const handleVoltar = () => {
    onClose(); // Fechar modal de cadastro
  };

  if (showWelcomeModal) {
    return createPortal(
      <ModalLayout
        isOpen={isOpen}
        onClose={handleWelcomeClose}
        title="🎉 Parabéns!"
        size="lg"
        showCloseButton={false}
        closeOnOverlayClick={false}
      >
        <div className="text-center space-y-6">
          <div className="mx-auto mb-4 w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-green-600">
              Sua conta foi criada com sucesso!
            </h3>
            <p className="text-muted-foreground">
              Seu diagnóstico foi vinculado automaticamente à sua conta.
            </p>
          </div>

          {diagnosticoData && (
            <div className="bg-muted/50 rounded-lg p-4">
              <h4 className="font-semibold mb-2">Resumo do seu diagnóstico:</h4>
              <div className="flex items-center justify-center space-x-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-accent">{diagnosticoData.score}%</div>
                  <div className="text-sm text-muted-foreground">Pontuação</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold">{diagnosticoData.category}</div>
                  <div className="text-sm text-muted-foreground">Categoria</div>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Agora você pode acessar:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Relatório detalhado do seu diagnóstico</li>
              <li>• Planos de ação personalizados</li>
              <li>• Sistema de conquistas e gamificação</li>
              <li>• Acompanhamento de progresso</li>
            </ul>
          </div>

          <Button size="lg" className="w-full" onClick={handleWelcomeClose}>
            Ir para Home
          </Button>
                 </div>
       </ModalLayout>,
       document.body
     );
   }

  if (!isOpen) return null;

  return createPortal(
    <ModalLayout
      isOpen={isOpen}
      onClose={handleVoltar}
      title="Criar Conta"
      size="md"
      showCloseButton={true}
      closeOnOverlayClick={false}
    >
          <div className="space-y-6">
            {/* Header com ícone */}
            <div className="text-center space-y-2">
              <div className="mx-auto w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center">
                <UserPlus className="h-6 w-6 text-accent" />
              </div>
              <p className="text-sm text-muted-foreground">
                Complete seu cadastro para acessar o relatório completo
              </p>
            </div>

            {/* Formulário */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nome */}
              <div className="space-y-2">
                <Label htmlFor="nome">Nome completo</Label>
                <Input
                  id="nome"
                  type="text"
                  value={formData.nome}
                  onChange={(e) => handleInputChange('nome', e.target.value)}
                  placeholder="Digite seu nome completo"
                  className={errors.nome ? 'border-red-500' : ''}
                />
                {errors.nome && (
                  <p className="text-sm text-red-500">{errors.nome}</p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Digite seu e-mail"
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email}</p>
                )}
              </div>

                             {/* Senha */}
               <div className="space-y-2">
                 <Label htmlFor="senha">Senha</Label>
                 <div className="relative">
                   <Input
                     id="senha"
                     type={showPassword ? "text" : "password"}
                     value={formData.senha}
                     onChange={(e) => handleInputChange('senha', e.target.value)}
                     placeholder="Digite sua senha"
                     className={`pr-10 ${errors.senha ? 'border-red-500' : ''}`}
                   />
                   <button
                     type="button"
                     onClick={() => setShowPassword(!showPassword)}
                     className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                   >
                     {showPassword ? (
                       <EyeOff className="h-4 w-4" />
                     ) : (
                       <Eye className="h-4 w-4" />
                     )}
                   </button>
                 </div>
                 {errors.senha && (
                   <p className="text-sm text-red-500">{errors.senha}</p>
                 )}
               </div>

                             {/* Confirmar Senha */}
               <div className="space-y-2">
                 <Label htmlFor="confirmarSenha">Confirmar senha</Label>
                 <div className="relative">
                   <Input
                     id="confirmarSenha"
                     type={showConfirmPassword ? "text" : "password"}
                     value={formData.confirmarSenha}
                     onChange={(e) => handleInputChange('confirmarSenha', e.target.value)}
                     placeholder="Confirme sua senha"
                     className={`pr-10 ${errors.confirmarSenha ? 'border-red-500' : ''}`}
                   />
                   <button
                     type="button"
                     onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                     className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                   >
                     {showConfirmPassword ? (
                       <EyeOff className="h-4 w-4" />
                     ) : (
                       <Eye className="h-4 w-4" />
                     )}
                   </button>
                 </div>
                 {errors.confirmarSenha && (
                   <p className="text-sm text-red-500">{errors.confirmarSenha}</p>
                 )}
               </div>

              {/* Termos de uso */}
              <div className="space-y-2">
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="aceitarTermos"
                    checked={formData.aceitarTermos}
                    onCheckedChange={(checked) => handleInputChange('aceitarTermos', checked as boolean)}
                    className={errors.aceitarTermos ? 'border-red-500' : ''}
                  />
                  <Label htmlFor="aceitarTermos" className="text-sm leading-relaxed">
                    Eu aceito os{' '}
                    <a href="#" className="text-accent hover:underline">
                      Termos de Uso
                    </a>{' '}
                    e a{' '}
                    <a href="#" className="text-accent hover:underline">
                      Política de Privacidade
                    </a>
                  </Label>
                </div>
                {errors.aceitarTermos && (
                  <p className="text-sm text-red-500">{errors.aceitarTermos}</p>
                )}
              </div>

              {/* Erro geral */}
              {errors.submit && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{errors.submit}</p>
                </div>
              )}

              {/* Botões */}
              <div className="space-y-3 pt-4">
                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? 'Criando conta...' : 'Criar Conta'}
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="w-full"
                  onClick={handleVoltar}
                  disabled={isLoading}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar
                </Button>
              </div>
            </form>

            {/* Link para login */}
            <div className="text-center pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Já tem uma conta?{' '}
                <button
                  onClick={() => navigate('/login')}
                  className="text-accent hover:underline font-medium"
                >
                  Faça login
                </button>
              </p>
            </div>
                     </div>
     </ModalLayout>,
     document.body
   );
 };
 
 export default CadastroModal;
