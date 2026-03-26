export type UserPreferences = {
  language: string;
  timezone: string;
  theme: string;
  dashboardLayout: string;
  interfaceDensity: string;
  sidebarPosition: string;
  sidebarMode: string;
  animations: boolean;
};

export const USER_PREFERENCES_UPDATED_EVENT =
  'workchoq:user-preferences-updated';

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  language: 'pt-BR',
  timezone: 'America/Sao_Paulo',
  theme: 'dark',
  dashboardLayout: 'default',
  interfaceDensity: 'comfortable',
  sidebarPosition: 'left',
  sidebarMode: 'expanded',
  animations: true,
};

const VALID_LANGUAGES = new Set(['pt-BR', 'en-US', 'es-ES', 'fr-FR']);
const VALID_TIMEZONES = new Set([
  'America/Sao_Paulo',
  'America/New_York',
  'Europe/London',
  'Europe/Paris',
  'Asia/Tokyo',
]);
const VALID_THEMES = new Set(['light', 'dark', 'auto']);
const VALID_DASHBOARD_LAYOUTS = new Set([
  'default',
  'compact',
  'detailed',
  'minimal',
]);
const VALID_INTERFACE_DENSITIES = new Set([
  'compact',
  'comfortable',
  'spacious',
]);
const VALID_SIDEBAR_POSITIONS = new Set(['left', 'right']);
const VALID_SIDEBAR_MODES = new Set(['expanded', 'collapsed', 'auto']);

function getStorageKey(userId?: string | null) {
  return userId
    ? `workchoq:user-preferences:${userId}`
    : 'workchoq:user-preferences';
}

function normalizeUserPreferences(
  value: Partial<UserPreferences> | null | undefined,
): UserPreferences {
  return {
    language: VALID_LANGUAGES.has(String(value?.language))
      ? String(value?.language)
      : DEFAULT_USER_PREFERENCES.language,
    timezone: VALID_TIMEZONES.has(String(value?.timezone))
      ? String(value?.timezone)
      : DEFAULT_USER_PREFERENCES.timezone,
    theme: VALID_THEMES.has(String(value?.theme))
      ? String(value?.theme)
      : DEFAULT_USER_PREFERENCES.theme,
    dashboardLayout: VALID_DASHBOARD_LAYOUTS.has(String(value?.dashboardLayout))
      ? String(value?.dashboardLayout)
      : DEFAULT_USER_PREFERENCES.dashboardLayout,
    interfaceDensity: VALID_INTERFACE_DENSITIES.has(
      String(value?.interfaceDensity),
    )
      ? String(value?.interfaceDensity)
      : DEFAULT_USER_PREFERENCES.interfaceDensity,
    sidebarPosition: VALID_SIDEBAR_POSITIONS.has(String(value?.sidebarPosition))
      ? String(value?.sidebarPosition)
      : DEFAULT_USER_PREFERENCES.sidebarPosition,
    sidebarMode: VALID_SIDEBAR_MODES.has(String(value?.sidebarMode))
      ? String(value?.sidebarMode)
      : DEFAULT_USER_PREFERENCES.sidebarMode,
    animations:
      typeof value?.animations === 'boolean'
        ? value.animations
        : DEFAULT_USER_PREFERENCES.animations,
  };
}

export function loadUserPreferences(userId?: string | null): UserPreferences {
  if (typeof window === 'undefined') {
    return DEFAULT_USER_PREFERENCES;
  }

  try {
    const raw = localStorage.getItem(getStorageKey(userId));
    if (!raw) {
      return DEFAULT_USER_PREFERENCES;
    }

    return normalizeUserPreferences(JSON.parse(raw) as Partial<UserPreferences>);
  } catch {
    return DEFAULT_USER_PREFERENCES;
  }
}

export function saveUserPreferences(
  userId: string | null | undefined,
  preferences: UserPreferences,
) {
  if (typeof window === 'undefined') {
    return;
  }

  const normalized = normalizeUserPreferences(preferences);
  localStorage.setItem(getStorageKey(userId), JSON.stringify(normalized));
  window.dispatchEvent(
    new CustomEvent<UserPreferences>(USER_PREFERENCES_UPDATED_EVENT, {
      detail: normalized,
    }),
  );
}

export function resetUserPreferences(userId?: string | null) {
  saveUserPreferences(userId, DEFAULT_USER_PREFERENCES);
}

export function applyUserPreferencesToDocument(
  preferences: UserPreferences,
  resolvedTheme: string,
) {
  if (typeof document === 'undefined') {
    return;
  }

  const root = document.documentElement;
  const body = document.body;
  const normalized = normalizeUserPreferences(preferences);

  root.lang = normalized.language;
  root.dataset.timezone = normalized.timezone;
  root.dataset.interfaceDensity = normalized.interfaceDensity;
  root.dataset.dashboardLayout = normalized.dashboardLayout;
  root.dataset.sidebarPosition = normalized.sidebarPosition;
  root.dataset.sidebarMode = normalized.sidebarMode;
  root.dataset.animations = normalized.animations ? 'enabled' : 'disabled';
  root.dataset.themePreference = normalized.theme;
  body.dataset.interfaceDensity = normalized.interfaceDensity;
  body.dataset.dashboardLayout = normalized.dashboardLayout;
  body.dataset.sidebarPosition = normalized.sidebarPosition;
  body.dataset.sidebarMode = normalized.sidebarMode;
  body.dataset.themePreference = normalized.theme;
  body.classList.toggle('reduce-motion', !normalized.animations);
  body.classList.toggle('theme-dark', resolvedTheme === 'dark');
  body.classList.toggle('theme-light', resolvedTheme !== 'dark');
}
