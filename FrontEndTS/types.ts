export interface User {
  username: string;
  role: 'admin' | 'user';
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string) => void;
  logout: () => void;
}

export interface NavItem {
  label: string;
  path: string;
}
export interface Team {
  id: string;
  name: string;
  logo: string | null; // Base64 string
  score: number;
}

export interface AppConfig {
  headerTitle: string;
  headerSubtitle: string;
  leftLogo: string | null;
  rightLogo: string | null;
  mainAnimationGif: string | null;
  questionTimeoutSeconds: number;
  currentQuestionNumber: number;
  teams: Team[];
  isConfigured: boolean;
  buzzerSoundEnabled: boolean;
  buzzerToneFreq: number; // base frequency for synth tone
  buzzerToneMs: number;   // tone duration in ms
  buzzerAudioData: string | null; // optional custom audio data URL/base64
}

export const DEFAULT_CONFIG: AppConfig = {
  headerTitle: "NEON QUIZ CHAMPIONSHIP",
  headerSubtitle: "Grand Finale - Round 1",
  leftLogo: null,
  rightLogo: null,
  mainAnimationGif: null,
  questionTimeoutSeconds: 30,
  currentQuestionNumber: 1,
  teams: [],
  isConfigured: false,
  buzzerSoundEnabled: false,
  buzzerToneFreq: 800,
  buzzerToneMs: 200,
  buzzerAudioData: null,
};
