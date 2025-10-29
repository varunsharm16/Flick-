import { create } from 'zustand';

export type ThemeOption = 'light' | 'dark' | 'system';

interface SessionState {
  userId: string;
  name: string;
  avatarUrl?: string;
  isPro: boolean;
  notificationsEnabled: boolean;
  theme: ThemeOption;
  setProfile: (payload: { name: string; avatarUrl?: string; isPro: boolean }) => void;
  setNotifications: (enabled: boolean) => void;
  setTheme: (theme: ThemeOption) => void;
  upgradeToPro: () => void;
}

export const useSession = create<SessionState>(set => ({
  userId: 'user-001',
  name: 'Player',
  avatarUrl: undefined,
  isPro: false,
  notificationsEnabled: true,
  theme: 'system',
  setProfile: ({ name, avatarUrl, isPro }) => set({ name, avatarUrl, isPro }),
  setNotifications: enabled => set({ notificationsEnabled: enabled }),
  setTheme: theme => set({ theme }),
  upgradeToPro: () => set({ isPro: true })
}));
