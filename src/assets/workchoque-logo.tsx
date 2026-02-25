import React from 'react';
import { useTheme } from 'next-themes';

interface WorkChoqueLogoProps {
  className?: string;
  showText?: boolean;
  lightMode?: boolean; // Controls logo brightness/contrast mode (true = content, false = hero)
}

const WorkChoqueLogo = ({ className = "h-8 w-auto", showText = true, lightMode = true }: WorkChoqueLogoProps) => {
  const { theme } = useTheme();
  
  // Determine filter based on context (lightMode prop) and global theme
  const getFilterClass = () => {
    // If we are in the Hero section (lightMode=false), we want White Text + Yellow Bolt.
    // Assuming source is White+Yellow, we just need a shadow for contrast.
    if (!lightMode) {
      return 'drop-shadow-md';
    }
    
    // If we are in the Content section (lightMode=true)
    // AND the theme is 'dark', we want White Text + Yellow Bolt.
    if (theme === 'dark') {
      return '';
    }
    
    // Default (Content section + Light theme): We want Black Text + Yellow Bolt.
    // The previous attempt made it too dark.
    // Let's adjust:
    // 1. Invert: White -> Black, Yellow (#FFD700) -> Blue (#0028FF)
    // 2. Hue-rotate(180deg): Blue (#0028FF) -> Yellow-Orange
    // 3. Brightness(2.0): Boost brightness significantly to counteract the darkness
    // 4. Saturate(1.5): Boost saturation to make the yellow pop
    return 'invert hue-rotate-180 brightness-200 saturate-150';
  };

  return (
    <div className={`${className} flex items-center space-x-2`}>
      <img 
        src="/logo_workchoque.png" 
        alt="WorkChoque Logo" 
        className={`h-full w-auto object-contain transition-all duration-300 ${getFilterClass()}`}
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