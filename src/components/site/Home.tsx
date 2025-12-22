import React, { useState } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/site/Footer';
import DiagnosticoModal from '@/components/site/DiagnosticoModal';
import HeroSection from './HeroSection';
import FeaturesSection from './FeaturesSection';
import StatsSection from './StatsSection';
import CTASection from './CTASection';

const Home: React.FC = () => {
  const [isDiagnosticoModalOpen, setIsDiagnosticoModalOpen] = useState(false);

  const handleDiagnosticoClick = () => {
    setIsDiagnosticoModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <HeroSection onDiagnosticoClick={handleDiagnosticoClick} />
      <FeaturesSection />
      <StatsSection />
      <CTASection onDiagnosticoClick={handleDiagnosticoClick} />
      <Footer />

      <DiagnosticoModal 
        isOpen={isDiagnosticoModalOpen}
        onClose={() => setIsDiagnosticoModalOpen(false)}
      />
    </div>
  );
};

export default Home;