import type { Settings, ThemePreference } from '../models/Settings';

export class SetThemeMode {
  execute(settings: Settings, themeMode: ThemePreference): Settings {
    return { ...settings, themeMode };
  }
}
