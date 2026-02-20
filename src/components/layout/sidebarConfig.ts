import { 
  LayoutDashboard, 
  FileText, 
  Lightbulb, 
  Trophy, 
  User,
  Users,
  Settings,
  BarChart3,
  Shield,
  Building,
  DollarSign,
  Activity,
  Award,
  Bell,
  Book,
  MessageSquare
} from "lucide-react";
import { Permission } from "@/contexts/PermissionsContext";

export const menuConfig = [
  {
    title: "PRINCIPAL",
    items: [
      { 
        permission: 'dashboard.user.view' as Permission,
        icon: LayoutDashboard 
      },
      { 
        permission: 'questionario.view' as Permission,
        icon: FileText 
      },
      { 
        permission: 'diagnostico.view' as Permission,
        icon: Activity 
      },
      { 
        permission: 'plano.view' as Permission,
        icon: Lightbulb 
      },
      { 
        permission: 'conquista.view' as Permission,
        icon: Trophy 
      },
      { 
        permission: 'agent.chat.view' as Permission,
        icon: MessageSquare 
      },
      { 
        permission: 'user.view' as Permission,
        icon: User 
      },
      { 
        permission: 'conteudo.view' as Permission,
        icon: Book 
      },
    ]
  },
  {
    title: "GESTÃO",
    items: [
      { 
        permission: 'dashboard.admin.view' as Permission,
        icon: LayoutDashboard 
      },
      { 
        permission: 'user.manage' as Permission,
        icon: Users 
      },
      { 
        permission: 'plano.create' as Permission,
        icon: Lightbulb 
      },
    ]
  },
  {
    title: "ANÁLISE",
    items: [
      { 
        permission: 'relatorio.view' as Permission,
        icon: BarChart3 
      },
      { 
        permission: 'notification.view' as Permission,
        icon: Bell 
      },
      { 
        permission: 'conquista.manage' as Permission,
        icon: Award 
      },
      { 
        permission: 'config.edit' as Permission,
        icon: Settings 
      },
    ]
  },
  {
    title: "SISTEMA",
    items: [
      { 
        permission: 'dashboard.master.view' as Permission,
        icon: LayoutDashboard 
      },
      { 
        permission: 'permissao.manage' as Permission,
        icon: Shield 
      },
      { 
        permission: 'empresa.view' as Permission,
        icon: Building 
      },
    ]
  },
  {
    title: "FINANCEIRO & SISTEMA",
    items: [
      { 
        permission: 'financeiro.manage' as Permission,
        icon: DollarSign 
      },
    ]
  }
];
