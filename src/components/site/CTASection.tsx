import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Users, ChevronRight } from 'lucide-react';

interface CTASectionProps {
  onDiagnosticoClick: () => void;
}

const CTASection: React.FC<CTASectionProps> = ({ onDiagnosticoClick }) => {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4 text-center">
        <Card className="max-w-2xl mx-auto workchoque-shadow">
          <CardContent className="p-12">
            <Users className="h-16 w-16 text-accent mx-auto mb-6" />
            <h2 className="text-3xl font-bold mb-6 text-foreground">
              Pronto para transformar sua empresa?
            </h2>
            <p className="text-muted-foreground mb-8 text-lg">
              Comece agora mesmo com um diagnóstico gratuito e descubra como podemos ajudar a melhorar seu ambiente de trabalho.
            </p>
            <Button 
              size="lg" 
              className="bg-primary hover:bg-primary/90 px-8 py-4 text-lg"
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
