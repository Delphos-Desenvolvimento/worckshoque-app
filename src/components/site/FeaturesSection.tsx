import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Target, TrendingUp, Award } from 'lucide-react';

const FeaturesSection: React.FC = () => {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-foreground">
          Por que escolher o WorkChoque?
        </h2>
        
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="workchoque-shadow hover:scale-105 workchoque-transition">
            <CardContent className="p-8 text-center">
              <div className="bg-primary/10 rounded-full p-4 inline-block mb-6">
                <Target className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Diagnósticos Precisos</h3>
              <p className="text-muted-foreground">
                Identifique problemas específicos no seu ambiente de trabalho com questionários validados cientificamente.
              </p>
            </CardContent>
          </Card>

          <Card className="workchoque-shadow hover:scale-105 workchoque-transition">
            <CardContent className="p-8 text-center">
              <div className="bg-accent/10 rounded-full p-4 inline-block mb-6">
                <TrendingUp className="h-8 w-8 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Planos Inteligentes</h3>
              <p className="text-muted-foreground">
                Receba planos de ação personalizados gerados por IA para resolver os problemas identificados.
              </p>
            </CardContent>
          </Card>

          <Card className="workchoque-shadow hover:scale-105 workchoque-transition">
            <CardContent className="p-8 text-center">
              <div className="bg-primary/10 rounded-full p-4 inline-block mb-6">
                <Award className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Sistema de Conquistas</h3>
              <p className="text-muted-foreground">
                Engaje sua equipe com um sistema completo de gamificação e reconhecimento de metas.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
