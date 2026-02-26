import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Moon, Sun, Menu } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useAuthStore } from '@/stores/authStore';
import WorkChoqueLogo from '@/assets/workchoque-logo';
import CadastroModal from '@/components/login/Cadastro';
import LoginModal from '@/components/login/LoginModal';

interface HeaderProps {
  user?: {
    name: string;
    role: 'visitor' | 'user' | 'admin' | 'master';
  } | null;
  onDiagnosticoClick?: () => void;
}

const Header = ({ user, onDiagnosticoClick }: HeaderProps) => {
  const { theme, setTheme } = useTheme();
  const { logout } = useAuthStore();
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isPastHero, setIsPastHero] = useState(false);
  const [showCadastroModal, setShowCadastroModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 50);
      // Assume Hero section is roughly 100vh. Switch contrast when passing it.
      setIsPastHero(scrollTop > window.innerHeight - 80);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleCadastroClick = () => {
    setShowCadastroModal(true);
  };

  const handleCadastroClose = () => {
    setShowCadastroModal(false);
  };

  const handleLoginClick = () => {
    setShowLoginModal(true);
  };

  const handleLoginClose = () => {
    setShowLoginModal(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 overflow-visible bg-transparent`}>
      <div className="container flex h-16 md:h-24 items-center justify-between md:justify-start px-4 md:px-8">
        <Link to="/" className="flex items-center h-full">
          <WorkChoqueLogo showText={false} className="h-10 w-auto md:h-full" lightMode={isPastHero} />
        </Link>

        <nav className="hidden md:flex items-center space-x-6 ml-auto mr-8">
          {!user && (
            <button 
              onClick={() => onDiagnosticoClick ? onDiagnosticoClick() : navigate('/diagnostico')}
              className={`transition-colors font-medium bg-transparent border-none cursor-pointer ${
                isPastHero ? 'text-foreground hover:text-primary' : 'text-white hover:text-white/80'
              }`}
            >
              Diagnóstico
            </button>
          )}
          
          {user && (
            <>
              <Link to="/dashboard" className={`transition-colors font-medium ${
                isPastHero ? 'text-foreground hover:text-primary' : 'text-white hover:text-white/80'
              }`}>
                Dashboard
              </Link>
              {user.role === 'user' && (
                <>
                  <Link to="/diagnosticos" className={`transition-colors font-medium ${
                    isPastHero ? 'text-foreground hover:text-primary' : 'text-white hover:text-white/80'
                  }`}>
                    Meus Diagnósticos
                  </Link>
                  <Link to="/conquistas" className={`transition-colors font-medium ${
                    isPastHero ? 'text-foreground hover:text-primary' : 'text-white hover:text-white/80'
                  }`}>
                    Conquistas
                  </Link>
                </>
              )}
              {(user.role === 'admin' || user.role === 'master') && (
                <>
                  <Link to="/usuarios" className={`transition-colors font-medium ${
                    isPastHero ? 'text-foreground hover:text-primary' : 'text-white hover:text-white/80'
                  }`}>
                    Usuários
                  </Link>
                  <Link to="/relatorios" className={`transition-colors font-medium ${
                    isPastHero ? 'text-foreground hover:text-primary' : 'text-white hover:text-white/80'
                  }`}>
                    Relatórios
                  </Link>
                </>
              )}
            </>
          )}
        </nav>

        <div className="flex items-center space-x-2 md:space-x-4 pr-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            className={`h-8 w-8 md:h-9 md:w-9 px-0 transition-colors ${
              isPastHero 
                ? 'text-foreground hover:bg-accent/10' 
                : 'text-white hover:text-white/80 hover:bg-white/10'
            }`}
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>

          {!user ? (
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                onClick={handleLoginClick}
                size="sm"
                className={`transition-colors text-sm font-medium ${
                  isPastHero 
                    ? 'text-foreground hover:bg-accent/10' 
                    : 'text-white hover:text-white/80 hover:bg-white/10'
                }`}
              >
                Entrar
              </Button>
              <Button 
                onClick={handleCadastroClick}
                size="sm"
                className={`transition-colors text-sm font-medium ${
                  isPastHero 
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
                    : 'bg-white/20 hover:bg-white/30 text-white border border-white/30'
                }`}
              >
                Cadastrar
              </Button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <span className={`text-sm transition-colors hidden md:inline-block font-medium ${
                isPastHero ? 'text-foreground' : 'text-white'
              }`}>
                Olá, {user.name}
              </span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleLogout}
                className={`transition-all duration-200 ${
                  isPastHero 
                    ? 'text-destructive hover:text-destructive/80 hover:bg-destructive/10' 
                    : 'text-red-200 hover:text-red-100 hover:bg-red-500/20'
                }`}
              >
                Sair
              </Button>
            </div>
          )}

          <Button variant="ghost" size="sm" className={`md:hidden transition-colors ${
            isPastHero 
              ? 'text-foreground hover:bg-accent/10' 
              : 'text-white hover:text-white/80 hover:bg-white/10'
          }`}>
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Modal de Cadastro */}
      <CadastroModal
        isOpen={showCadastroModal}
        onClose={handleCadastroClose}
      />

      {/* Modal de Login */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={handleLoginClose}
        onRegisterClick={handleCadastroClick}
      />
    </header>
  );
};

export default Header;