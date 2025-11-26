import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppConfig, DEFAULT_CONFIG, Team } from '../types';

interface ConfigContextType {
  config: AppConfig;
  updateConfig: (newConfig: Partial<AppConfig>) => void;
  addTeam: (team: Team) => void;
  removeTeam: (id: string) => void;
  updateTeam: (id: string, updates: Partial<Team>) => void;
  resetConfig: () => void;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

const STORAGE_KEY = 'quiz_app_config_v1';

export const ConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);

  // Load from local storage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setConfig({ ...DEFAULT_CONFIG, ...parsed });
      }
    } catch (error) {
      console.error("Failed to load config", error);
    }
  }, []);

  // Save to local storage whenever config changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch (error) {
      const trimmed = { ...config } as AppConfig;
      trimmed.leftLogo = null;
      trimmed.rightLogo = null;
      trimmed.mainAnimationGif = null;
      trimmed.teams = trimmed.teams.map((t) => {
        const logo = t.logo || null;
        const safeLogo = logo && logo.length > 150000 ? null : logo;
        return { ...t, logo: safeLogo } as Team;
      });
      if ((trimmed as any).buzzerAudioData && (trimmed as any).buzzerAudioData.length > 250000) {
        (trimmed as any).buzzerAudioData = null;
      }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
        console.warn('Large images removed from config to fit storage quota');
      } catch (e2) {
        console.error('Failed to save even after trimming. Consider reducing image sizes.');
      }
    }
  }, [config]);

  const updateConfig = (newConfig: Partial<AppConfig>) => {
    setConfig((prev) => ({ ...prev, ...newConfig, isConfigured: true }));
  };

  const addTeam = (team: Team) => {
    if (config.teams.length >= 10) return;
    setConfig((prev) => ({ ...prev, teams: [...prev.teams, team] }));
  };

  const removeTeam = (id: string) => {
    setConfig((prev) => ({ ...prev, teams: prev.teams.filter((t) => t.id !== id) }));
  };

  const updateTeam = (id: string, updates: Partial<Team>) => {
    setConfig((prev) => ({
      ...prev,
      teams: prev.teams.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    }));
  };

  const resetConfig = () => {
    setConfig(DEFAULT_CONFIG);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <ConfigContext.Provider
      value={{ config, updateConfig, addTeam, removeTeam, updateTeam, resetConfig }}
    >
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfig = () => {
  const context = useContext(ConfigContext);
  if (!context) throw new Error('useConfig must be used within a ConfigProvider');
  return context;
};
