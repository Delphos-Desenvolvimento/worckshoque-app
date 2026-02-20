import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Accessibility, Eye, Type, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { useSidebar } from "@/components/ui/sidebar";

export function AccessibilityWidget() {
  const { theme, setTheme } = useTheme();
  const [highContrast, setHighContrast] = useState(false);
  const [largeText, setLargeText] = useState(false);
  const { state, isMobile } = useSidebar();
  const collapsed = state === "collapsed";

  // Apply high contrast class to body
  useEffect(() => {
    if (highContrast) {
      document.documentElement.classList.add("high-contrast");
    } else {
      document.documentElement.classList.remove("high-contrast");
    }
  }, [highContrast]);

  // Apply large text class to body
  useEffect(() => {
    if (largeText) {
      document.documentElement.classList.add("text-large");
    } else {
      document.documentElement.classList.remove("text-large");
    }
  }, [largeText]);

  // Calculate left position based on sidebar state
  // Sidebar expanded: 80 (width) + 24 (margin) = 104px ~ left-28
  // Sidebar collapsed: 20 (width) + 24 (margin) = 44px ~ left-12
  // Mobile: default to left-6
  const leftPosition = isMobile ? "left-6" : (collapsed ? "left-24" : "left-80 ml-6");

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className={`fixed bottom-6 ${leftPosition} z-50 h-12 w-12 rounded-full shadow-lg border-primary/20 bg-background hover:bg-accent transition-all duration-300 hover:scale-105 active:scale-95`}
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
          
          <div className="space-y-4">
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

            {/* Large Text Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Type className="h-4 w-4" />
                <Label htmlFor="text-toggle">Texto Maior</Label>
              </div>
              <Switch
                id="text-toggle"
                checked={largeText}
                onCheckedChange={setLargeText}
              />
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
