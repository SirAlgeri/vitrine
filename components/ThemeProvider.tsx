import { useEffect } from 'react';
import { AppConfig } from '../types';

interface ThemeProviderProps {
  config: AppConfig;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ config }) => {
  useEffect(() => {
    const root = document.documentElement;
    
    // Aplicar cores customizadas com !important
    if (config.background_color) {
      root.style.setProperty('--color-background', config.background_color);
      document.body.style.backgroundColor = config.background_color;
    }
    if (config.card_color) root.style.setProperty('--color-card', config.card_color);
    if (config.surface_color) root.style.setProperty('--color-surface', config.surface_color);
    if (config.text_primary_color) {
      root.style.setProperty('--color-text-primary', config.text_primary_color);
      document.body.style.color = config.text_primary_color;
    }
    if (config.text_secondary_color) root.style.setProperty('--color-text-secondary', config.text_secondary_color);
    if (config.border_color) root.style.setProperty('--color-border', config.border_color);
    if (config.button_primary_color) root.style.setProperty('--color-button-primary', config.button_primary_color);
    if (config.button_primary_hover_color) root.style.setProperty('--color-button-primary-hover', config.button_primary_hover_color);
    if (config.button_secondary_color) root.style.setProperty('--color-button-secondary', config.button_secondary_color);
    if (config.button_secondary_hover_color) root.style.setProperty('--color-button-secondary-hover', config.button_secondary_hover_color);
  }, [config]);

  return null;
};
