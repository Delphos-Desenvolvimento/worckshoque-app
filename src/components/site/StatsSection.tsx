import React, { useEffect, useRef } from 'react';
import { motion, useInView, useSpring, useTransform } from 'framer-motion';

interface CounterProps {
  value: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

const Counter: React.FC<CounterProps> = ({ value, prefix = '', suffix = '', className }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  
  const springValue = useSpring(0, {
    damping: 50,
    stiffness: 50,
    duration: 4
  });
  
  const displayValue = useTransform(springValue, (current) => Math.round(current));

  useEffect(() => {
    if (isInView) {
      springValue.set(value);
    }
  }, [isInView, value, springValue]);

  return (
    <span className={className} ref={ref}>
      {prefix}
      <motion.span>{displayValue}</motion.span>
      {suffix}
    </span>
  );
};

const StatsSection: React.FC = () => {
  return (
    <section className="py-10 md:py-20">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-8 md:mb-12 text-foreground">
          Resultados que falam por si
        </h2>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="rounded-2xl border border-border/50 bg-card/30 backdrop-blur-md shadow-2xl p-8 md:p-12 max-w-6xl mx-auto"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            <div className="flex flex-col items-center justify-center p-2">
              <div className="text-4xl md:text-5xl font-bold text-primary mb-3">
                <Counter value={1000} prefix="+" />
              </div>
              <p className="text-sm md:text-base font-medium text-muted-foreground">Diagnósticos Realizados</p>
            </div>
            
            <div className="flex flex-col items-center justify-center p-2">
              <div className="text-4xl md:text-5xl font-bold text-accent mb-3">
                <Counter value={95} suffix="%" />
              </div>
              <p className="text-sm md:text-base font-medium text-muted-foreground">Satisfação dos Usuários</p>
            </div>
            
            <div className="flex flex-col items-center justify-center p-2">
              <div className="text-4xl md:text-5xl font-bold text-primary mb-3">
                <Counter value={50} prefix="+" />
              </div>
              <p className="text-sm md:text-base font-medium text-muted-foreground">Empresas Parceiras</p>
            </div>
            
            <div className="flex flex-col items-center justify-center p-2">
              {/* 24h remains static as requested */}
              <div className="text-4xl md:text-5xl font-bold text-accent mb-3">24h</div>
              <p className="text-sm md:text-base font-medium text-muted-foreground">Suporte Disponível</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default StatsSection;
