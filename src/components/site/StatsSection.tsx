import React from 'react';

const StatsSection: React.FC = () => {
  return (
    <section className="py-10 md:py-20 bg-muted/50">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-8 md:mb-12 text-foreground">
          Resultados que falam por si
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          <div>
            <div className="text-3xl md:text-4xl font-bold text-primary mb-2">+1000</div>
            <p className="text-sm md:text-base text-muted-foreground">Diagnósticos Realizados</p>
          </div>
          <div>
            <div className="text-3xl md:text-4xl font-bold text-accent mb-2">95%</div>
            <p className="text-sm md:text-base text-muted-foreground">Satisfação dos Usuários</p>
          </div>
          <div>
            <div className="text-3xl md:text-4xl font-bold text-primary mb-2">+50</div>
            <p className="text-sm md:text-base text-muted-foreground">Empresas Parceiras</p>
          </div>
          <div>
            <div className="text-3xl md:text-4xl font-bold text-accent mb-2">24h</div>
            <p className="text-sm md:text-base text-muted-foreground">Suporte Disponível</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
