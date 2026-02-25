import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Accessibility, Eye, Type, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { useSidebar } from "@/components/ui/sidebar";

// Core logic and UI for the Accessibility Widget
export function AccessibilityWidgetContent({ className = "" }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const [highContrast, setHighContrast] = useState(false);
  const [textSize, setTextSize] = useState(100);

  // Apply high contrast class to body
  useEffect(() => {
    if (highContrast) {
      document.documentElement.classList.add("high-contrast");
    } else {
      document.documentElement.classList.remove("high-contrast");
    }
  }, [highContrast]);

  // Apply text size to body
  useEffect(() => {
    document.documentElement.style.fontSize = `${textSize}%`;
  }, [textSize]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className={`z-50 h-12 w-12 rounded-full shadow-lg border-primary/20 bg-background hover:bg-accent transition-all duration-300 hover:scale-105 active:scale-95 ${className}`}
          aria-label="Opções de Acessibilidade"
        >
          <Accessibility className="h-6 w-6 text-primary" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 ml-6 mb-2 p-4" side="top" align="start">
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b pb-2">
            <Accessibility className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-lg">Acessibilidade</h3>
          </div>
          
          <div className="space-y-6">
            {/* Theme Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                <Label htmlFor="theme-toggle">Modo Escuro</Label>
              </div>
              <Switch
                id="theme-toggle"
                checked={theme === 'dark'}
                onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
              />
            </div>

            {/* High Contrast Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                <Label htmlFor="contrast-toggle">Alto Contraste</Label>
              </div>
              <Switch
                id="contrast-toggle"
                checked={highContrast}
                onCheckedChange={setHighContrast}
              />
            </div>

            {/* Text Size Slider */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Type className="h-4 w-4" />
                  <Label>Tamanho do Texto</Label>
                </div>
                <span className="text-sm text-muted-foreground">{textSize}%</span>
              </div>
              <Slider
                value={[textSize]}
                onValueChange={(value) => setTextSize(value[0])}
                min={100}
                max={150}
                step={5}
                className="py-2"
              />
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Widget that connects to the Sidebar context for positioning
export function AccessibilityWidget() {
  const { state, isMobile } = useSidebar();
  const collapsed = state === "collapsed";

  // Calculate left position based on sidebar state
  // Sidebar expanded: 80 (width) + 24 (margin) = 104px ~ left-28
  // Sidebar collapsed: 20 (width) + 24 (margin) = 44px ~ left-12
  // Mobile: default to left-6
  const leftPosition = isMobile ? "left-6" : (collapsed ? "left-24" : "left-80 ml-6");

  return <AccessibilityWidgetContent className={`fixed bottom-6 ${leftPosition}`} />;
}

// Standalone widget for public pages (no sidebar dependency)
export function PublicAccessibilityWidget() {
  return <AccessibilityWidgetContent className="fixed bottom-6 left-6" />;
}
