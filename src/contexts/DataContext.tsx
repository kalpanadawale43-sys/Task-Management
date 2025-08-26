import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { Session, Task, Settings, Leave, DataContextType } from '../types/data';
import { generateId } from '../utils/helpers';
import { format, addDays, differenceInDays, eachDayOfInterval } from 'date-fns';

const DEFAULT_SETTINGS: Settings = {
  sessionTimes: {
    morning: '09:00',
    afternoon: '14:30',
    evening: '18:15'
  },
  endOfDayTime: '22:00',
  dayOffInterval: 15,
  telegramBotToken: '',
  telegramChatId: '',
  notificationSounds: {
    default: true,
    custom: ''
  }
};

const DataContext = createContext<DataContextType | undefined>(undefined);

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [leaves, setLeaves] = useState<Leave[]>([]);

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  useEffect(() => {
    // Automatically log mandatory days off
    if (user?.startDate) {
      const startDate = new Date(user.startDate);
      const today = new Date();
      const totalDays = differenceInDays(today, startDate);
      
      for (let i = settings.dayOffInterval; i <= totalDays; i += settings.dayOffInterval) {
        const mandatoryDate = addDays(startDate, i);
        const mandatoryDateStr = format(mandatoryDate, 'yyyy-MM-dd');
        
        // Check if leave already exists
        const leaveExists = leaves.some(leave => leave.date === mandatoryDateStr && leave.type === 'mandatory');
        
        if (!leaveExists) {
          const newLeave: Leave = {
            id: generateId(),
            type: 'mandatory',
            date: mandatoryDateStr,
            reason: 'Mandatory day off',
            approved: true
          };
          setLeaves(prevLeaves => [...prevLeaves, newLeave]);
          saveData('leaves', [...leaves, newLeave]);
        }
      }
    }
  }, [user, settings]);

  const loadUserData = () => {
    if (!user) return;

    const savedSessions = localStorage.getItem(`taskmaster_sessions_${user.id}`);
    const savedTasks = localStorage.getItem(`taskmaster_tasks_${user.id}`);
    const savedSettings = localStorage.getItem(`taskmaster_settings_${user.id}`);
    const savedLeaves = localStorage.getItem(`taskmaster_leaves_${user.id}`);

    if (savedSessions) setSessions(JSON.parse(savedSessions));
    if (savedTasks) setTasks(JSON.parse(savedTasks));
    if (savedSettings) {
      const parsedSettings = JSON.parse(savedSettings);
      // Deep merge with default settings to ensure all properties exist
      setSettings({
        ...DEFAULT_SETTINGS,
        ...parsedSettings,
        sessionTimes: {
          ...DEFAULT_SETTINGS.sessionTimes,
          ...(parsedSettings.sessionTimes || {})
        },
        notificationSounds: {
          ...DEFAULT_SETTINGS.notificationSounds,
          ...(parsedSettings.notificationSounds || {})
        }
      });
    }
    if (savedLeaves) setLeaves(JSON.parse(savedLeaves));
  };

  const saveData = (type: string, data: any) => {
    if (!user) return;
    localStorage.setItem(`taskmaster_${type}_${user.id}`, JSON.stringify(data));
  };

  const addSession = (sessionData: Omit<Session, 'id'>) => {
    const newSession: Session = {
      ...sessionData,
      id: generateId()
    };
    const updatedSessions = [...sessions, newSession];
    setSessions(updatedSessions);
    saveData('sessions', updatedSessions);
    return newSession;
  };

  const updateSession = (sessionId: string, updates: Partial<Session>) => {
    const updatedSessions = sessions.map(session =>
      session.id === sessionId ? { ...session, ...updates } : session
    );
    setSessions(updatedSessions);
    saveData('sessions', updatedSessions);
  };

  const addTask = (taskData: Omit<Task, 'id' | 'status'>) => {
    const newTask: Task = {
      ...taskData,
      id: generateId(),
      status: 'pending'
    };
    const updatedTasks = [...tasks, newTask];
    setTasks(updatedTasks);
    saveData('tasks', updatedTasks);
    return newTask;
  };

  const updateTask = (taskId: string, updates: Partial<Task>) => {
    const updatedTasks = tasks.map(task => {
      if (task.id === taskId) {
        const updatedTask = { ...task, ...updates };
        // If task is marked complete, clear the incompletion reason
        if (updates.status === 'completed') {
          updatedTask.incompletionReason = '';
        }
        return updatedTask;
      }
      return task;
    });
    setTasks(updatedTasks);
    saveData('tasks', updatedTasks);
  };

  const removeTask = (taskId: string) => {
    const updatedTasks = tasks.filter(task => task.id !== taskId);
    setTasks(updatedTasks);
    saveData('tasks', updatedTasks);
  };

  const updateSettings = (newSettings: Partial<Settings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    saveData('settings', updatedSettings);
  };

  const addLeave = (leaveData: Omit<Leave, 'id'>) => {
    const newLeave: Leave = {
      ...leaveData,
      id: generateId()
    };
    const updatedLeaves = [...leaves, newLeave];
    setLeaves(updatedLeaves);
    saveData('leaves', updatedLeaves);
    return newLeave;
  };

  const updateLeave = (leaveId: string, updates: Partial<Leave>) => {
    const updatedLeaves = leaves.map(leave =>
      leave.id === leaveId ? { ...leave, ...updates } : leave
    );
    setLeaves(updatedLeaves);
    saveData('leaves', updatedLeaves);
  };

  const getTodaysSessions = () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    return sessions.filter(session => session.date === today);
  };

  const getActiveSession = () => {
    return sessions.find(session => session.status === 'active');
  };

  const getTodaysTasks = () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    return tasks.filter(task => task.date === today);
  };

  const getStreakCount = () => {
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');

    // Group sessions by date and check if any session was started that day
    const sessionsByDate = sessions.reduce((acc, session) => {
      if (!acc[session.date]) {
        acc[session.date] = [];
      }
      acc[session.date].push(session);
      return acc;
    }, {} as Record<string, Session[]>);

    // Get all dates with sessions, sorted in descending order
    const datesWithSessions = Object.keys(sessionsByDate)
      .filter(date => {
        // Only count dates where at least one session was started
        return sessionsByDate[date].some(session => session.startTime !== null);
      })
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    if (datesWithSessions.length === 0) return 0;

    let streak = 0;
    let checkDate = new Date(today);

    // Start checking from today backwards
    while (true) {
      const checkDateStr = format(checkDate, 'yyyy-MM-dd');

      // If this date has sessions with at least one started
      if (datesWithSessions.includes(checkDateStr)) {
        streak++;
        // Move to previous day
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        // If we're checking today and there are no sessions, streak is 0
        if (checkDateStr === todayStr) {
          return 0;
        }
        // If we're checking a past date and there are no sessions, break the streak
        break;
      }

      // Safety check to prevent infinite loop
      if (streak > 365) break;
    }

    return streak;
  };

  const getTotalHours = () => {
    return sessions
      .filter(session => session.status === 'completed')
      .reduce((total, session) => {
        return total + (session.slots?.reduce((slotTotal, slot) =>
          slotTotal + (slot.duration || 0), 0) || 0);
      }, 0);
  };

  const exportData = () => {
    const data = {
      sessions,
      tasks,
      settings,
      leaves,
      user: user?.username,
      exportDate: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `taskmaster_data_${format(new Date(), 'yyyy-MM-dd')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const value = {
    sessions,
    tasks,
    settings,
    leaves,
    addSession,
    updateSession,
    addTask,
    updateTask,
    removeTask,
    updateSettings,
    addLeave,
    updateLeave,
    getTodaysSessions,
    getActiveSession,
    getTodaysTasks,
    getStreakCount,
    getTotalHours,
    exportData
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}
