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
}

const Header = ({ user }: HeaderProps) => {
  const { theme, setTheme } = useTheme();
  const { logout } = useAuthStore();
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [showCadastroModal, setShowCadastroModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 50);
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
    <header className={`${isScrolled ? 'fixed' : 'absolute'} top-0 left-0 right-0 z-50 transition-all duration-300 overflow-visible ${
      isScrolled 
        ? 'bg-blue-900/95 backdrop-blur-md shadow-lg' 
        : 'bg-transparent backdrop-blur-sm'
    }`}>
      <div className="container flex h-24 items-center justify-between">
        <Link to="/" className="flex items-center h-full">
          <WorkChoqueLogo showText={false} className="h-full w-auto" />
        </Link>

        <nav className="hidden md:flex items-center space-x-6">
          {!user && (
            <>
              <Link to="/diagnostico" className={`transition-colors ${
                isScrolled ? 'text-white/90 hover:text-white' : 'text-white/80 hover:text-white'
              }`}>
                Diagnóstico
              </Link>
              <Link to="/sobre" className={`transition-colors ${
                isScrolled ? 'text-white/90 hover:text-white' : 'text-white/80 hover:text-white'
              }`}>
                Sobre
              </Link>
            </>
          )}
          
          {user && (
            <>
              <Link to="/dashboard" className={`transition-colors ${
                isScrolled ? 'text-white/90 hover:text-white' : 'text-white/80 hover:text-white'
              }`}>
                Dashboard
              </Link>
              {user.role === 'user' && (
                <>
                  <Link to="/diagnosticos" className={`transition-colors ${
                    isScrolled ? 'text-white/90 hover:text-white' : 'text-white/80 hover:text-white'
                  }`}>
                    Meus Diagnósticos
                  </Link>
                  <Link to="/conquistas" className={`transition-colors ${
                    isScrolled ? 'text-white/90 hover:text-white' : 'text-white/80 hover:text-white'
                  }`}>
                    Conquistas
                  </Link>
                </>
              )}
              {(user.role === 'admin' || user.role === 'master') && (
                <>
                  <Link to="/usuarios" className={`transition-colors ${
                    isScrolled ? 'text-white/90 hover:text-white' : 'text-white/80 hover:text-white'
                  }`}>
                    Usuários
                  </Link>
                  <Link to="/relatorios" className={`transition-colors ${
                    isScrolled ? 'text-white/90 hover:text-white' : 'text-white/80 hover:text-white'
                  }`}>
                    Relatórios
                  </Link>
                </>
              )}
            </>
          )}
        </nav>

        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            className={`h-9 w-9 px-0 transition-colors ${
              isScrolled ? 'text-white/90 hover:text-white hover:bg-white/10' : 'text-white/80 hover:text-white hover:bg-white/10'
            }`}
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>

          {!user ? (
            <div className="flex items-center space-x-2">
              <Button 
                variant="ghost" 
                onClick={handleLoginClick}
                className={`transition-colors ${
                  isScrolled ? 'text-white/90 hover:text-white hover:bg-white/10' : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                Entrar
              </Button>
              <Button 
                onClick={handleCadastroClick}
                className={`transition-colors ${
                  isScrolled ? 'bg-white/30 hover:bg-white/40 text-white border-white/40' : 'bg-white/20 hover:bg-white/30 text-white border-white/30'
                }`}
              >
                Cadastrar
              </Button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <span className={`text-sm transition-colors ${
                isScrolled ? 'text-white/90' : 'text-white/80'
              }`}>
                Olá, {user.name}
              </span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleLogout}
                className={`transition-all duration-200 ${
                  isScrolled 
                    ? 'text-red-400 hover:text-red-300 hover:bg-red-500/10' 
                    : 'text-red-400/80 hover:text-red-300 hover:bg-red-500/10'
                }`}
              >
                Sair
              </Button>
            </div>
          )}

          <Button variant="ghost" size="sm" className={`md:hidden transition-colors ${
            isScrolled ? 'text-white/90 hover:text-white hover:bg-white/10' : 'text-white/80 hover:text-white hover:bg-white/10'
          }`}>
            <Menu className="h-4 w-4" />
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
      />
    </header>
  );
};

export default Header;