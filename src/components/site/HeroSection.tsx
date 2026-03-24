import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';

interface HeroSectionProps {
  onDiagnosticoClick: () => void;
  title: string;
  highlight: string;
  description: string;
  primaryButtonLabel: string;
  secondaryButtonLabel: string;
}

const HeroSection: React.FC<HeroSectionProps> = ({
  onDiagnosticoClick,
  title,
  highlight,
  description,
  primaryButtonLabel,
  secondaryButtonLabel,
}) => {
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
      <div className="relative z-20 container mx-auto px-4 md:px-6 text-center pt-20 md:pt-0">
        <h1 className="text-3xl md:text-6xl font-bold mb-3 md:mb-6 leading-tight">
          {title}{' '}
          <span className="text-accent block mt-1 md:mt-2 md:inline">
            {highlight}
          </span>
        </h1>
        <p className="text-base md:text-2xl mb-6 md:mb-8 text-white/90 max-w-3xl mx-auto leading-relaxed px-2">
          {description}
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center items-center px-4 w-full">
          <Button 
            size="lg" 
            variant="accent"
            className="w-full sm:w-auto font-semibold px-6 md:px-8 h-12 md:h-14 text-base md:text-lg shadow-lg"
            onClick={onDiagnosticoClick}
          >
            {primaryButtonLabel}
            <ChevronRight className="ml-2 h-5 w-5" />
          </Button>
          <Button 
            variant="outline" 
            size="lg" 
            className="w-full sm:w-auto border-white text-gray-900 bg-white hover:bg-white/90 px-6 md:px-8 h-12 md:h-14 text-base md:text-lg" 
            onClick={(e) => {
              e.preventDefault();
              const element = document.getElementById('statistics');
              if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
              }
            }}
          >
            {secondaryButtonLabel}
          </Button>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
