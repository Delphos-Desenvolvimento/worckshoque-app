import React, { useState } from 'react';
import WorkChoqueLogo from '@/assets/workchoque-logo';
import { 
  Mail, 
  Phone, 
  MapPin,
  ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';
import LoginModal from '@/components/login/LoginModal';

const Footer = () => {
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [showLoginModal, setShowLoginModal] = useState(false);

  const handleNewsletterSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const email = newsletterEmail.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Informe um e-mail válido para se inscrever.');
      return;
    }

    const mailtoUrl = `mailto:contato@workchoque.com?subject=${encodeURIComponent('Inscrição na newsletter WorkChoque')}&body=${encodeURIComponent(`Olá, gostaria de receber as atualizações no e-mail: ${email}`)}`;
    window.location.href = mailtoUrl;
    toast.success('Abrimos seu app de e-mail para concluir a inscrição.');
    setNewsletterEmail('');
  };

  return (
    <footer id="footer-contact" className="bg-gray-900 text-white">
      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          
          {/* Company Info */}
          <div className="space-y-3 md:space-y-4">
            <WorkChoqueLogo showText={false} className="h-6 w-auto md:h-8" />
            <p className="text-gray-300 text-sm leading-relaxed">
              Transforme seu ambiente de trabalho com diagnósticos inteligentes. 
              Descubra problemas, receba planos de ação personalizados e acompanhe 
              o progresso da sua equipe em tempo real.
            </p>
            <div className="text-sm text-gray-300">
              Fale com nosso time:
              <a href="mailto:contato@workchoque.com" className="ml-2 text-accent hover:underline">
                contato@workchoque.com
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Links Rápidos</h3>
            <ul className="space-y-2">
              <li>
                <a href="/" className="text-gray-300 hover:text-accent transition-colors text-sm">
                  Início
                </a>
              </li>
              <li>
                <a href="/#features" className="text-gray-300 hover:text-accent transition-colors text-sm">
                  Sobre Nós
                </a>
              </li>
              <li>
                <a href="/?openDiagnostic=1" className="text-gray-300 hover:text-accent transition-colors text-sm">
                  Diagnóstico
                </a>
              </li>
              <li>
                <a href="/#footer-contact" className="text-gray-300 hover:text-accent transition-colors text-sm">
                  Contato
                </a>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setShowLoginModal(true)}
                  className="text-gray-300 hover:text-accent transition-colors text-sm"
                >
                  Login
                </button>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Serviços</h3>
            <ul className="space-y-2">
              <li>
                <a href="/?openDiagnostic=1" className="text-gray-300 hover:text-accent transition-colors text-sm">
                  Diagnóstico de Burnout
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Contato</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Mail className="h-4 w-4 text-accent" />
                <span className="text-gray-300 text-sm">contato@workchoque.com</span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-4 w-4 text-accent" />
                <span className="text-gray-300 text-sm">+55 (11) 99999-9999</span>
              </div>
              <div className="flex items-start space-x-3">
                <MapPin className="h-4 w-4 text-accent mt-1" />
                <span className="text-gray-300 text-sm">
                  São Paulo, SP<br />
                  Brasil
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Newsletter Section */}
      <div className="border-t border-gray-800">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-2">Receba nossas atualizações</h3>
              <p className="text-gray-300 text-sm">
                Fique por dentro das novidades e dicas para melhorar seu ambiente de trabalho.
              </p>
            </div>
            <form className="flex w-full md:w-auto" onSubmit={handleNewsletterSubmit}>
              <input
                type="email"
                placeholder="Seu e-mail"
                value={newsletterEmail}
                onChange={(event) => setNewsletterEmail(event.target.value)}
                className="flex-1 md:w-80 px-4 py-2 bg-gray-800 border border-gray-700 rounded-l-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
              />
              <button type="submit" className="px-6 py-2 bg-accent hover:bg-accent/90 text-primary font-semibold rounded-r-md transition-colors flex items-center">
                Inscrever
                <ArrowRight className="ml-2 h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            <div className="text-gray-400 text-sm">
              © 2024 WorkChoque. Todos os direitos reservados.
            </div>
            <div className="flex space-x-6">
              <a href="mailto:contato@workchoque.com" className="text-gray-400 hover:text-accent transition-colors text-sm">
                Suporte por E-mail
              </a>
              <a href="tel:+5511999999999" className="text-gray-400 hover:text-accent transition-colors text-sm">
                Ligar para Suporte
              </a>
            </div>
          </div>
        </div>
      </div>
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
    </footer>
  );
};

export default Footer;
