import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import ModalLayout from '@/components/common/ModalLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { LogIn, Eye, EyeOff } from 'lucide-react';
import { axiosInstance } from '@/lib/api';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LoginModal = ({ isOpen, onClose }: LoginModalProps) => {
  const navigate = useNavigate();
  const { login, isLoading } = useAuthStore();
  
  // Form states
  const [formData, setFormData] = useState({
    email: '',
    senha: '',
    manterConectado: false
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email.trim()) {
      newErrors.email = 'E-mail é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'E-mail inválido';
    }

    if (!formData.senha) {
      newErrors.senha = 'Senha é obrigatória';
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

    try {
      // Usar o Zustand store para login
      const success = await login(formData.email, formData.senha);
      
      if (success) {
        try {
          const temp = localStorage.getItem('tempDiagnostico');
          if (temp) {
            const data = JSON.parse(temp);
            const id = data?.questionnaire_id;
            const answers = data?.answers;
            if (id && answers) {
              await axiosInstance.post(`/questionnaires/${id}/transfer`, { responses: answers });
              localStorage.removeItem('tempDiagnostico');
            }
          }
        } catch (error) {
          console.error(error);
        }

        // Fechar modal e redirecionar baseado no role
        onClose();
        
        // Obter o usuário do store para verificar o role
        const user = useAuthStore.getState().user;
        
        if (user) {
          // Redirecionar baseado no role
          switch (user.role) {
            case 'master':
              navigate('/master-dashboard');
              break;
            case 'admin':
              navigate('/admin-dashboard');
              break;
            case 'user':
            default:
              navigate('/dashboard');
              break;
          }
        } else {
          // Fallback para dashboard padrão
          navigate('/dashboard');
        }
      } else {
        setErrors({ submit: 'E-mail ou senha incorretos. Tente novamente.' });
      }
      
    } catch (error) {
      console.error('Erro no login:', error);
      setErrors({ submit: 'Erro ao fazer login. Tente novamente.' });
    }
  };

  const handleGoogleLogin = () => {
    // Simular login com Google (em produção seria integração real)
    console.log('Login com Google');
    // Aqui seria a integração real com Google OAuth
  };

  if (!isOpen) return null;

  return createPortal(
    <ModalLayout
      isOpen={isOpen}
      onClose={onClose}
      title="Entrar"
      size="md"
      showCloseButton={true}
      closeOnOverlayClick={false}
    >
      <div className="space-y-6">
        {/* Header com ícone */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center">
            <LogIn className="h-6 w-6 text-accent" />
          </div>
          <p className="text-sm text-muted-foreground">
            Faça login para acessar sua conta
          </p>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-4">
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

          {/* Manter conectado */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="manterConectado"
              checked={formData.manterConectado}
              onCheckedChange={(checked) => handleInputChange('manterConectado', checked as boolean)}
            />
            <Label htmlFor="manterConectado" className="text-sm">
              Manter-me conectado
            </Label>
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
              {isLoading ? 'Entrando...' : 'Entrar'}
            </Button>
            
            {/* Divisor */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Ou continue com
                </span>
              </div>
            </div>

            {/* Botão Google */}
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="w-full"
              onClick={handleGoogleLogin}
              disabled={isLoading}
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Entrar com Google
            </Button>
          </div>
        </form>

        {/* Link para cadastro */}
        <div className="text-center pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            Não tem uma conta?{' '}
            <button
              onClick={() => {
                onClose();
                // Aqui poderia abrir o modal de cadastro se necessário
                navigate('/');
              }}
              className="text-accent hover:underline font-medium"
            >
              Cadastre-se
            </button>
          </p>
        </div>
      </div>
    </ModalLayout>,
    document.body
  );
};

export default LoginModal;
