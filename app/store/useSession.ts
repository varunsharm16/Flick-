import { create } from 'zustand';

export type ThemeOption = 'light' | 'dark' | 'system';

interface SessionState {
  userId: string;
  name: string;
  avatarUrl?: string;
  isPro: boolean;
  notificationsEnabled: boolean;
  pushToken: string | null;
  theme: ThemeOption;
  setProfile: (payload: { name: string; avatarUrl?: string; isPro: boolean }) => void;
  updateName: (name: string) => void;
  updateAvatar: (avatarUrl?: string) => void;
  setNotifications: (enabled: boolean) => void;
  setPushToken: (token: string | null) => void;
  setTheme: (theme: ThemeOption) => void;
  upgradeToPro: () => void;
}

export const useSession = create<SessionState>(set => ({
  userId: 'user-001',
  name: 'Player',
  avatarUrl: undefined,
  isPro: false,
  notificationsEnabled: true,
  pushToken: null,
  theme: 'system',
  setProfile: ({ name, avatarUrl, isPro }) => set({ name, avatarUrl, isPro }),
  updateName: name => set({ name }),
  updateAvatar: avatarUrl => set({ avatarUrl }),
  setNotifications: enabled => set({ notificationsEnabled: enabled }),
  setPushToken: token => set({ pushToken: token }),
  setTheme: theme => set({ theme }),
  upgradeToPro: () => set({ isPro: true })
}));
