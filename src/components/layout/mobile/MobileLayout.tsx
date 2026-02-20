import { ReactNode, useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, User as UserIcon, LogOut } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { usePermissions } from "@/contexts/PermissionsContext";
import { menuConfig } from "../sidebarConfig";
import { NavLink, useNavigate } from "react-router-dom";
import NotificationCenter from "@/components/common/NotificationCenter";
import { PERMISSION_MAPPING } from "@/lib/permission-mapping";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface MobileLayoutProps {
  children: ReactNode;
}

export function MobileLayout({ children }: MobileLayoutProps) {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const { hasPermission } = usePermissions();
  const navigate = useNavigate();

  // Helper to check if category has visible items
  const hasVisibleItems = (items: any[]) => {
    return items.some(item => hasPermission(item.permission));
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  return (
    <div className="min-h-screen w-full bg-background flex flex-col">
      {/* Mobile Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center px-4 justify-between">
          <div className="flex items-center gap-3">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="-ml-2">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Toggle Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[85%] sm:w-[350px] p-0 border-r bg-background">
                <div className="flex flex-col h-full">
                  {/* Sidebar Header */}
                  <div className="p-6 pb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg">
                        <span className="font-bold text-xl">WC</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-lg leading-none">WorkChoque</span>
                        <span className="text-xs text-muted-foreground mt-1">Mobile Access</span>
                      </div>
                    </div>
                  </div>

                  {/* Sidebar Items */}
                  <div className="flex-1 overflow-y-auto py-6 px-4">
                    {menuConfig.filter(group => hasVisibleItems(group.items)).map((group, i) => (
                      <div key={i} className="mb-6 last:mb-0">
                        <h4 className="mb-3 px-4 text-xs font-bold text-muted-foreground/70 tracking-widest uppercase">
                          {group.title}
                        </h4>
                        <div className="space-y-1">
                          {group.items.map((item) => {
                             if (!hasPermission(item.permission)) return null;
                             const itemConfig = PERMISSION_MAPPING.SIDEBAR[item.permission];
                             if (!itemConfig) return null;
                             const Icon = item.icon;
                             
                             return (
                               <NavLink
                                 key={item.permission}
                                 to={itemConfig.url}
                                 onClick={() => setOpen(false)}
                                 className={({ isActive }) =>
                                   `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 group ${
                                     isActive
                                       ? "bg-primary/10 text-primary"
                                       : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                   }`
                                 }
                               >
                                 <Icon className={`h-5 w-5 transition-colors`} />
                                 <span>{itemConfig.title}</span>
                               </NavLink>
                             );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Sidebar Footer */}
                  <div className="p-4 mt-auto">
                    <Separator className="mb-4" />
                    <div className="flex items-center justify-between gap-2 px-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar className="h-9 w-9 border border-border">
                          <AvatarImage src={`https://ui-avatars.com/api/?name=${user?.name}&background=random`} />
                          <AvatarFallback>{user?.name ? getInitials(user.name) : 'U'}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-medium truncate">{user?.name}</span>
                          <span className="text-xs text-muted-foreground truncate">{user?.email}</span>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                        onClick={() => {
                          setOpen(false);
                          logout();
                          navigate('/');
                        }}
                      >
                        <LogOut className="h-5 w-5" />
                        <span className="sr-only">Sair</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
            <span className="font-semibold text-lg">WorkChoque</span>
          </div>

          <div className="flex items-center gap-1">
            <NotificationCenter />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 pb-10 w-full max-w-full overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
