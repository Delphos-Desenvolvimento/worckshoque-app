import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Users, ChevronRight } from 'lucide-react';

interface CTASectionProps {
  onDiagnosticoClick: () => void;
}

const CTASection: React.FC<CTASectionProps> = ({ onDiagnosticoClick }) => {
  return (
    <section className="py-10 md:py-20">
      <div className="container mx-auto px-4 text-center">
        <Card className="max-w-2xl mx-auto workchoque-shadow">
          <CardContent className="p-6 md:p-12">
            <Users className="h-12 w-12 md:h-16 md:w-16 text-accent mx-auto mb-4 md:mb-6" />
            <h2 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6 text-foreground">
              Pronto para transformar sua empresa?
            </h2>
            <p className="text-muted-foreground mb-6 md:mb-8 text-base md:text-lg">
              Comece agora mesmo com um diagnóstico gratuito e descubra como podemos ajudar a melhorar seu ambiente de trabalho.
            </p>
            <Button 
              size="lg" 
              className="bg-primary hover:bg-primary/90 px-6 py-3 md:px-8 md:py-4 h-auto text-base md:text-lg"
              onClick={onDiagnosticoClick}
            >
              Começar Diagnóstico
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default CTASection;
