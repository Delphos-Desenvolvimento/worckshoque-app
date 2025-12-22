import React from 'react';

interface WorkChoqueLogoProps {
  className?: string;
  showText?: boolean;
}

const WorkChoqueLogo = ({ className = "h-8 w-auto", showText = true }: WorkChoqueLogoProps) => {
  return (
    <div className={`${className} flex items-center space-x-2`}>
      <img 
        src="/logo_workchoque.png" 
        alt="WorkChoque Logo" 
        className="h-full w-auto object-contain"
      />
      {showText && (
        <div className="font-bold text-lg text-foreground">
          WORK<span className="text-accent">CHOQUE</span>
        </div>
      )}
    </div>
  );
};

export default WorkChoqueLogo;