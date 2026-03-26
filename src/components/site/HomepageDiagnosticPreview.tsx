import React, { useState } from 'react';
import ModalLayout from '@/components/common/ModalLayout';
import Diagnostico from '@/components/user/Diagnostico';
import type { HomepageDiagnosticConfig } from '@/lib/homepage-diagnostic';
import HeroSection from './HeroSection';
import FeaturesSection from './FeaturesSection';
import StatsSection from './StatsSection';
import CTASection from './CTASection';

interface HomepageDiagnosticPreviewProps {
  config: HomepageDiagnosticConfig;
}

const HomepageDiagnosticPreview: React.FC<HomepageDiagnosticPreviewProps> = ({
  config,
}) => {
  const [isDiagnosticoModalOpen, setIsDiagnosticoModalOpen] = useState(false);

  const handleDiagnosticoClick = () => {
    setIsDiagnosticoModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <HeroSection
        onDiagnosticoClick={handleDiagnosticoClick}
        title={config.heroTitle}
        highlight={config.heroHighlight}
        description={config.heroDescription}
        primaryButtonLabel={config.heroPrimaryButton}
        secondaryButtonLabel={config.heroSecondaryButton}
      />
      <FeaturesSection />
      <StatsSection />
      <CTASection
        onDiagnosticoClick={handleDiagnosticoClick}
        title={config.ctaTitle}
        description={config.ctaDescription}
        buttonLabel={config.ctaButton}
      />
      <ModalLayout
        isOpen={isDiagnosticoModalOpen}
        onClose={() => setIsDiagnosticoModalOpen(false)}
        title={config.modalTitle}
        size="xl"
      >
        <Diagnostico
          mode="modal"
          schema={config.modalSchema}
          headerTitle={config.modalTitle}
          onComplete={() => setIsDiagnosticoModalOpen(false)}
        />
      </ModalLayout>
    </div>
  );
};

export default HomepageDiagnosticPreview;
