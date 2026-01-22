// Mapeamento completo de permissões para elementos da interface
// Este arquivo centraliza a relação entre permissões e componentes

export const PERMISSION_MAPPING = {
  // ==================== SIDEBAR ITEMS ====================
  SIDEBAR: {
    // Dashboards
    'dashboard.user.view': {
      title: 'Dashboard Pessoal',
      url: '/dashboard',
      description: 'Visão geral do seu progresso'
    },
    'dashboard.admin.view': {
      title: 'Dashboard da Empresa', 
      url: '/admin-dashboard',
      description: 'Visão geral da empresa'
    },
    'dashboard.master.view': {
      title: 'Dashboard Global',
      url: '/master-dashboard', 
      description: 'Visão geral do sistema'
    },

    // Questionários (Coleta de dados)
    'questionario.view': {
      title: 'Questionários',
      url: '/questionarios',
      description: 'Gerenciar questionários'
    },

    // Diagnósticos (Análise IA)
    'diagnostico.view': {
      title: 'Diagnósticos',
      url: '/diagnosticos',
      description: 'Diagnósticos gerados pela IA'
    },
    'diagnostico.global': {
      title: 'Diagnósticos Globais',
      url: '/diagnosticos-globais',
      description: 'Acompanhar diagnósticos gerados'
    },

    // Planos
    'plano.view': {
      title: 'Planos de Ação (IA)',
      url: '/planos-acao',
      description: 'Planos personalizados pela IA'
    },
    'plano.global': {
      title: 'Planos & Conquistas',
      url: '/planos-conquistas-globais',
      description: 'Gerenciar planos globais'
    },

    // Conteúdos
    'conteudo.view': {
      title: 'Conteúdos',
      url: '/conteudos',
      description: 'Gerenciar conteúdos educacionais',
      icon: 'book',
      children: [
        {
          title: 'Meus Conteúdos',
          url: '/conteudos',
          permission: 'conteudo.view',
          description: 'Conteúdos que você criou'
        },
        {
          title: 'Biblioteca',
          url: '/conteudos',
          permission: 'conteudo.view',
          description: 'Conteúdos disponíveis para você'
        },
        {
          title: 'Categorias',
          url: '/conteudos',
          permission: 'conteudo.manage_categories',
          description: 'Gerenciar categorias de conteúdo'
        }
      ]
    },

    // Conquistas
    'conquista.view': {
      title: 'Conquistas',
      url: '/conquistas',
      description: 'Conquistas e sistema de pontos'
    },

    // Usuários
    'user.manage': {
      title: 'Gestão de Usuários',
      url: '/gestao-usuarios',
      description: 'Gerenciar usuários e permissões'
    },
    'questionario.equipe': {
      title: 'Respostas da Equipe',
      url: '/respostas-equipe',
      description: 'Ver respostas dos questionários da equipe'
    },

    // Perfis e Permissões
    'permissao.manage': {
      title: 'Perfis & Permissões',
      url: '/perfis-permissoes',
      description: 'Gerenciar perfis e permissões'
    },

    // Empresas
    'empresa.view': {
      title: 'Empresas',
      url: '/empresas',
      description: 'Gerenciar empresas'
    },

    // Relatórios
    'relatorio.view': {
      title: 'Relatórios & Métricas',
      url: '/relatorios',
      description: 'Relatórios e métricas da empresa'
    },

    // Notificações
    'notification.view': {
      title: 'Notificações',
      url: '/notificacoes',
      description: 'Central de notificações do sistema'
    },
    'notification.create': {
      title: 'Criar Notificação',
      url: '/notificacoes',
      description: 'Criar nova notificação'
    },
    'notification.manage': {
      title: 'Gerenciar Notificações',
      url: '/notificacoes',
      description: 'Gerenciar todas as notificações'
    },
    'notification.broadcast': {
      title: 'Notificações Globais',
      url: '/notificacoes',
      description: 'Enviar notificações para todos'
    },

    // Financeiro
    'financeiro.manage': {
      title: 'Financeiro',
      url: '/financeiro',
      description: 'Controle financeiro do sistema'
    },

    // Configurações
    'config.edit': {
      title: 'Configurações',
      url: '/configuracoes',
      description: 'Configurações do sistema'
    },

    // Perfil
    'user.view': {
      title: 'Perfil',
      url: '/perfil',
      description: 'Configurações da sua conta'
    },
    'agent.chat.view': {
      title: 'Agente',
      url: '/agente',
      description: 'Conversar com o Agente'
    },
    'agent.chat.manage': {
      title: 'Gestão de Chat',
      url: '/agente',
      description: 'Gerenciar sessões e histórico'
    }
  },

  // ==================== BUTTON ACTIONS ====================
  BUTTONS: {
    // Usuários
    'user.create': {
      text: 'Novo Usuário',
      variant: 'default' as const,
      icon: 'Plus',
      description: 'Adicionar um novo usuário ao sistema'
    },
    'user.edit': {
      text: 'Editar',
      variant: 'outline' as const,
      icon: 'Edit',
      description: 'Editar informações do usuário'
    },
    'user.delete': {
      text: 'Excluir',
      variant: 'destructive' as const,
      icon: 'Trash2',
      description: 'Remover usuário do sistema'
    },

    // Conteúdos
    'conteudo.create': {
      text: 'Novo Conteúdo',
      variant: 'default' as const,
      icon: 'Plus',
      description: 'Criar um novo conteúdo educacional'
    },
    'conteudo.edit': {
      text: 'Editar',
      variant: 'outline' as const,
      icon: 'Edit',
      description: 'Editar conteúdo existente'
    },
    'conteudo.delete': {
      text: 'Excluir',
      variant: 'destructive' as const,
      icon: 'Trash2',
      description: 'Remover conteúdo do sistema'
    },
    'conteudo.publish': {
      text: 'Publicar',
      variant: 'success' as const,
      icon: 'Upload',
      description: 'Publicar conteúdo para visualização'
    },
    'conteudo.archive': {
      text: 'Arquivar',
      variant: 'secondary' as const,
      icon: 'Archive',
      description: 'Arquivar conteúdo (não será mais visível para usuários comuns)'
    },
    'conteudo.manage_access': {
      text: 'Gerenciar Acesso',
      variant: 'outline' as const,
      icon: 'Lock',
      description: 'Gerenciar permissões de acesso ao conteúdo'
    },

    // Diagnósticos
    'diagnostico.create': {
      text: 'Novo Diagnóstico',
      variant: 'default' as const,
      icon: 'Plus'
    },
    'diagnostico.edit': {
      text: 'Editar',
      variant: 'outline' as const,
      icon: 'Edit'
    },
    'diagnostico.delete': {
      text: 'Excluir',
      variant: 'destructive' as const,
      icon: 'Trash2'
    },

    // Planos
    'plano.create': {
      text: 'Novo Plano',
      variant: 'default' as const,
      icon: 'Plus'
    },
    'plano.edit': {
      text: 'Editar',
      variant: 'outline' as const,
      icon: 'Edit'
    },
    'plano.delete': {
      text: 'Excluir',
      variant: 'destructive' as const,
      icon: 'Trash2'
    },

    // Conquistas
    'conquista.create': {
      text: 'Nova Conquista',
      variant: 'default' as const,
      icon: 'Plus'
    },
    'conquista.edit': {
      text: 'Editar',
      variant: 'outline' as const,
      icon: 'Edit'
    },
    'conquista.delete': {
      text: 'Excluir',
      variant: 'destructive' as const,
      icon: 'Trash2'
    },

    // Empresas
    'empresa.create': {
      text: 'Nova Empresa',
      variant: 'default' as const,
      icon: 'Plus'
    },
    'empresa.edit': {
      text: 'Editar',
      variant: 'outline' as const,
      icon: 'Edit'
    },
    'empresa.delete': {
      text: 'Excluir',
      variant: 'destructive' as const,
      icon: 'Trash2'
    },

    // Questionários
    'questionario.create': {
      text: 'Criar Questionário',
      variant: 'default' as const,
      icon: 'Plus'
    },
    'questionario.edit': {
      text: 'Editar Questionário',
      variant: 'outline' as const,
      icon: 'Edit'
    },
    'questionario.delete': {
      text: 'Excluir Questionário',
      variant: 'destructive' as const,
      icon: 'Trash2'
    },
    'questionario.view': {
      text: 'Ver Questionário',
      variant: 'ghost' as const,
      icon: 'Eye'
    },

    // Relatórios
    'relatorio.create': {
      text: 'Gerar Relatório',
      variant: 'default' as const,
      icon: 'FileText',
      description: 'Gerar um novo relatório'
    },
    'relatorio.export': {
      text: 'Exportar',
      variant: 'outline' as const,
      icon: 'Download',
      description: 'Exportar relatório'
    },
    
    // Auditoria e Segurança
    'auditoria.logs.view': {
      text: 'Ver Logs',
      variant: 'ghost' as const,
      icon: 'FileText',
      description: 'Visualizar logs do sistema'
    },
    'auditoria.logs.export': {
      text: 'Exportar Logs',
      variant: 'outline' as const,
      icon: 'Download',
      description: 'Exportar logs do sistema'
    },
    'auditoria.alerts.view': {
      text: 'Ver Alertas',
      variant: 'secondary' as const,
      icon: 'AlertTriangle',
      description: 'Visualizar alertas do sistema'
    },
    'auditoria.alerts.manage': {
      text: 'Gerenciar Alertas',
      variant: 'default' as const,
      icon: 'Shield',
      description: 'Gerenciar configurações de alertas'
    },
    'auditoria.compliance.view': {
      text: 'Ver Compliance',
      variant: 'ghost' as const,
      icon: 'FileCheck',
      description: 'Visualizar relatórios de conformidade'
    },
    'auditoria.compliance.export': {
      text: 'Exportar Compliance',
      variant: 'outline' as const,
      icon: 'Download',
      description: 'Exportar relatórios de conformidade'
    }
  },

  // ==================== PAGES ====================
  PAGES: {
    // Conteúdos
    '/conteudos': 'conteudo.view',
    
    // Outras páginas existentes...
    '/dashboard': 'dashboard.user.view',
    '/diagnostico': 'diagnostico.view',
    '/admin-dashboard': 'dashboard.admin.view',
    '/admin': 'dashboard.admin.view',
    '/master-dashboard': 'dashboard.master.view',
    '/questionarios': 'questionario.view',
    '/meus-questionarios': 'questionario.view',
    '/meus-diagnosticos': 'diagnostico.view',
    '/diagnosticos': 'diagnostico.view',
    '/diagnosticos-globais': 'diagnostico.global',
    '/planos-acao': 'plano.view',
    '/planos-acao/:id': 'plano.view',
    '/planos-conquistas-globais': 'plano.global',
    '/gamificacao': 'conquista.view',
    '/conquistas': 'conquista.view',
    '/conquistas-empresa': 'conquista.manage',
    '/gestao-usuarios': 'user.manage',
    '/gestao-planos': 'dashboard.admin.view',
    '/respostas-equipe': 'questionario.equipe',
    '/perfis-permissoes': 'permissao.manage',
    '/empresas': 'empresa.view',
    '/relatorios': 'relatorio.view',
    '/notificacoes': 'notification.view',
    '/financeiro': 'financeiro.manage',
    '/configuracoes': 'config.edit',
    '/perfil': 'user.view',
    '/agente': 'agent.chat.view',
    '/questionarios-globais': 'questionario.view',
    '/conteudos/novo': 'conteudo.create',
    '/conteudos/:id': 'conteudo.view',
    '/conteudos/:id/editar': 'conteudo.edit',
    
    // Outras rotas de páginas
    '/': 'public',
    '/login': 'public',
    '/cadastro': 'public',
    '/recuperar-senha': 'public',
    '/redefinir-senha': 'public',
    '/termos-de-uso': 'public',
    '/politica-de-privacidade': 'public',
    '/ajuda': 'public',
    '/contato': 'public',
    '/sobre': 'public',
    '/erro': 'public',
    '/nao-encontrado': 'public',
    '/acesso-negado': 'public',
    '/manutencao': 'public'
  }
} as const;

// Tipos para TypeScript
type SidebarItem = typeof PERMISSION_MAPPING.SIDEBAR[keyof typeof PERMISSION_MAPPING.SIDEBAR];
type ButtonAction = typeof PERMISSION_MAPPING.BUTTONS[keyof typeof PERMISSION_MAPPING.BUTTONS];
type PageProtection = typeof PERMISSION_MAPPING.PAGES;

// Helper para obter permissão de uma página
export function getPagePermission(path: string): string | null {
  const normalizedPath = (() => {
    const trimmedPath =
      path !== '/' ? path.replace(/\/+$/, '') || '/' : '/';

    if (trimmedPath.startsWith('/planos-acao/')) {
      return '/planos-acao/:id';
    }
    if (trimmedPath === '/conteudos') {
      return '/conteudos';
    }
    if (trimmedPath.startsWith('/conteudos/')) {
      if (trimmedPath.endsWith('/editar')) {
        return '/conteudos/:id/editar';
      }
      if (trimmedPath.endsWith('/novo')) {
        return '/conteudos/novo';
      }
      return '/conteudos/:id';
    }
    return trimmedPath;
  })();
  return PERMISSION_MAPPING.PAGES[normalizedPath as keyof PageProtection] || null;
}

// Helper para obter configuração de item da sidebar
export function getSidebarItem(permission: string): SidebarItem | null {
  return PERMISSION_MAPPING.SIDEBAR[permission as keyof typeof PERMISSION_MAPPING.SIDEBAR] || null;
}

// Helper para obter configuração de botão
export function getButtonConfig(permission: string): ButtonAction | null {
  return PERMISSION_MAPPING.BUTTONS[permission as keyof typeof PERMISSION_MAPPING.BUTTONS] || null;
}
