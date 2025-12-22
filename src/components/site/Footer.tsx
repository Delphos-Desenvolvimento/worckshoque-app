import React from 'react';
import { Link } from 'react-router-dom';
import WorkChoqueLogo from '@/assets/workchoque-logo';
import { 
  Facebook, 
  Twitter, 
  Linkedin, 
  Instagram, 
  Mail, 
  Phone, 
  MapPin,
  ArrowRight
} from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white">
      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Company Info */}
          <div className="space-y-4">
            <WorkChoqueLogo showText={false} className="h-8 w-auto" />
            <p className="text-gray-300 text-sm leading-relaxed">
              Transforme seu ambiente de trabalho com diagnósticos inteligentes. 
              Descubra problemas, receba planos de ação personalizados e acompanhe 
              o progresso da sua equipe em tempo real.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-accent transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-accent transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-accent transition-colors">
                <Linkedin className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-accent transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Links Rápidos</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-300 hover:text-accent transition-colors text-sm">
                  Início
                </Link>
              </li>
              <li>
                <Link to="/sobre" className="text-gray-300 hover:text-accent transition-colors text-sm">
                  Sobre Nós
                </Link>
              </li>
              <li>
                <Link to="/diagnostico" className="text-gray-300 hover:text-accent transition-colors text-sm">
                  Diagnóstico
                </Link>
              </li>
              <li>
                <Link to="/contato" className="text-gray-300 hover:text-accent transition-colors text-sm">
                  Contato
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-gray-300 hover:text-accent transition-colors text-sm">
                  Login
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Serviços</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/diagnostico" className="text-gray-300 hover:text-accent transition-colors text-sm">
                  Diagnóstico de Burnout
                </Link>
              </li>
              <li>
                <Link to="/planos" className="text-gray-300 hover:text-accent transition-colors text-sm">
                  Planos de Ação
                </Link>
              </li>
              <li>
                <Link to="/relatorios" className="text-gray-300 hover:text-accent transition-colors text-sm">
                  Relatórios
                </Link>
              </li>
              {/* Unificado em Conquistas */}
              <li>
                <Link to="/conquistas" className="text-gray-300 hover:text-accent transition-colors text-sm">
                  Conquistas
                </Link>
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
            <div className="flex w-full md:w-auto">
              <input
                type="email"
                placeholder="Seu e-mail"
                className="flex-1 md:w-80 px-4 py-2 bg-gray-800 border border-gray-700 rounded-l-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
              />
              <button className="px-6 py-2 bg-accent hover:bg-accent/90 text-primary font-semibold rounded-r-md transition-colors flex items-center">
                Inscrever
                <ArrowRight className="ml-2 h-4 w-4" />
              </button>
            </div>
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
              <Link to="/privacidade" className="text-gray-400 hover:text-accent transition-colors text-sm">
                Política de Privacidade
              </Link>
              <Link to="/termos" className="text-gray-400 hover:text-accent transition-colors text-sm">
                Termos de Uso
              </Link>
              <Link to="/cookies" className="text-gray-400 hover:text-accent transition-colors text-sm">
                Cookies
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
