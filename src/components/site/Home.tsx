import React, { useEffect, useMemo, useState } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/site/Footer';
import ModalLayout from '@/components/common/ModalLayout';
import Diagnostico from '@/components/user/Diagnostico';
import HeroSection from './HeroSection';
import FeaturesSection from './FeaturesSection';
import StatsSection from './StatsSection';
import CTASection from './CTASection';
import { PublicAccessibilityWidget } from '@/components/common/AccessibilityWidget';
import { useHomepageDiagnosticConfig } from '@/lib/homepage-diagnostic';

const Home: React.FC = () => {
  const [isDiagnosticoModalOpen, setIsDiagnosticoModalOpen] = useState(false);
  const isPreviewMode = useMemo(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get('previewHomepageDiagnostic') === '1';
    } catch {
      return false;
    }
  }, []);
  const homepageDiagnostic = useHomepageDiagnosticConfig({
    mode: isPreviewMode ? 'preview' : 'saved',
  });
  const openDiagnosticFromQuery = useMemo(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get('openDiagnostic') === '1';
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    if (openDiagnosticFromQuery) {
      setIsDiagnosticoModalOpen(true);
    }
  }, [openDiagnosticFromQuery]);

  const handleDiagnosticoClick = () => {
    setIsDiagnosticoModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header onDiagnosticoClick={handleDiagnosticoClick} />
      
      <HeroSection
        onDiagnosticoClick={handleDiagnosticoClick}
        title={homepageDiagnostic.heroTitle}
        highlight={homepageDiagnostic.heroHighlight}
        description={homepageDiagnostic.heroDescription}
        primaryButtonLabel={homepageDiagnostic.heroPrimaryButton}
        secondaryButtonLabel={homepageDiagnostic.heroSecondaryButton}
      />
      <FeaturesSection />
      <StatsSection />
      <CTASection
        onDiagnosticoClick={handleDiagnosticoClick}
        title={homepageDiagnostic.ctaTitle}
        description={homepageDiagnostic.ctaDescription}
        buttonLabel={homepageDiagnostic.ctaButton}
      />
      <Footer />
      <PublicAccessibilityWidget />

      <ModalLayout
        isOpen={isDiagnosticoModalOpen}
        onClose={() => setIsDiagnosticoModalOpen(false)}
        title={homepageDiagnostic.modalTitle}
        size="xl"
      >
        <Diagnostico
          mode="modal"
          schema={homepageDiagnostic.modalSchema}
          headerTitle={homepageDiagnostic.modalTitle}
          onComplete={() => setIsDiagnosticoModalOpen(false)}
        />
      </ModalLayout>
    </div>
  );
};

export default Home;
