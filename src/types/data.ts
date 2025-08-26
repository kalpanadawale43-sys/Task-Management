import { Session } from ".";

export interface Slot {
  id: string;
  name: string;
  description: string;
  estimatedDuration?: number;
  startTime: Date | string | null;
  endTime: Date | string | null;
  duration: number; // in minutes
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  totalPauseDuration: number; // in seconds
  pauseStartTime?: Date | string | null;
}

export interface Session {
  id: string;
  type: 'morning' | 'afternoon' | 'evening';
  date: string;
  startTime: Date | string | null;
  endTime: Date | string | null;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  slots: Slot[];
  totalDuration: number; // in minutes
}

export interface Task {
  id:string;
  title: string;
  description:string;
  date: string;
  status: 'pending' | 'completed' | 'incomplete';
  incompletionReason?: string;
}

export interface Settings {
  sessionTimes: {
    morning: string;
    afternoon: string;
    evening: string;
  };
  endOfDayTime: string;
  dayOffInterval: number;
  telegramBotToken: string;
  telegramChatId: string;
  notificationSounds: {
    default: boolean;
    custom: string;
  };
}

export interface Leave {
  id: string;
  type: 'sick' | 'mandatory' | 'personal';
  date: string;
  reason: string;
  document?: string;
  approved: boolean;
}

export interface DataContextType {
  sessions: Session[];
  tasks: Task[];
  settings: Settings;
  leaves: Leave[];
  addSession: (session: Omit<Session, 'id'>) => Session;
  updateSession: (sessionId: string, updates: Partial<Session>) => void;
  addTask: (task: Omit<Task, 'id' | 'status'>) => Task;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  removeTask: (taskId: string) => void;
  updateSettings: (settings: Partial<Settings>) => void;
  addLeave: (leave: Omit<Leave, 'id'>) => Leave;
  updateLeave: (leaveId: string, updates: Partial<Leave>) => void;
  getTodaysSessions: () => Session[];
  getActiveSession: () => Session | undefined;
  getTodaysTasks: () => Task[];
  getStreakCount: () => number;
  getTotalHours: () => number;
  exportData: () => void;
}
