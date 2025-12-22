import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';

interface HeroSectionProps {
  onDiagnosticoClick: () => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({ onDiagnosticoClick }) => {
  return (
    <section className="relative min-h-screen flex items-center justify-center text-white overflow-hidden">
      {/* Video Background */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover object-center z-0"
      >
        <source src="/video_hero2.mp4" type="video/mp4" />
      </video>
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/60 via-slate-800/80 to-slate-900/95 z-10"></div>
      
      {/* Content */}
      <div className="relative z-20 container mx-auto px-4 text-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-6">
          Transforme seu ambiente de trabalho com{' '}
          <span className="text-accent">diagnósticos inteligentes</span>
        </h1>
        <p className="text-xl md:text-2xl mb-8 text-white/90 max-w-3xl mx-auto">
          Descubra problemas, receba planos de ação personalizados e acompanhe o progresso da sua equipe em tempo real.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button 
            size="lg" 
            variant="accent"
            className="font-semibold px-8 py-4 text-lg"
            onClick={onDiagnosticoClick}
          >
            Fazer Diagnóstico Gratuito
            <ChevronRight className="ml-2 h-5 w-5" />
          </Button>
          <Button variant="outline" size="lg" className="border-white text-white dark:text-white text-gray-800 dark:bg-white/10 bg-white/90 hover:bg-white/20 dark:hover:bg-white/20 px-8 py-4 text-lg" asChild>
            <Link to="/sobre">
              Saiba Mais
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
