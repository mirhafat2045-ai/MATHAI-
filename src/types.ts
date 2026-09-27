export type SolverMode = 'solve' | 'tutor' | 'proof' | 'quick';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  plottableFunction?: string | null;
  imageBase64?: string;
  mode?: SolverMode;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
}

export interface PracticeProblem {
  title: string;
  topic: string;
  difficulty: string;
  problemStatement: string;
  hints: string[];
  finalAnswer: string;
  fullSolution: string;
}

export interface MathDomain {
  id: string;
  name: string;
  iconName: string;
  tagline: string;
  accentColor: string;
  presets: {
    title: string;
    prompt: string;
    description: string;
  }[];
}
