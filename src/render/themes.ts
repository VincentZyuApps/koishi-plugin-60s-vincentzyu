import type { ColorMode, ImageTheme } from '../config'

export type TemplateName = 'daily' | 'hot' | 'weather' | 'simple'

export const IMAGE_THEME_ATTR: Record<ImageTheme, string> = {
  koishi: 'koishi',
  github: 'github',
}

export const COLOR_MODE_ATTR: Record<ColorMode, string> = {
  light: 'light',
  dark: 'dark',
  system: 'system',
}
