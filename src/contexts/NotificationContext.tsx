import React, { createContext, useContext, useEffect } from 'react';
import { useData } from './DataContext';
import { useAuth } from './AuthContext';

const NotificationContext = createContext<{} | undefined>(undefined);

export function useNotification() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { settings } = useData();
  const { user } = useAuth();

  const sendTelegramNotification = async (message: string) => {
    if (!settings.telegramBotToken || !settings.telegramChatId) {
      console.log('Telegram not configured');
      return;
    }

    try {
      const url = `https://api.telegram.org/bot${settings.telegramBotToken}/sendMessage`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: settings.telegramChatId,
          text: `🎯 TaskMasterScheduler\n\n${message}`,
          parse_mode: 'Markdown'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send Telegram notification');
      }
    } catch (error) {
      console.error('Telegram notification error:', error);
    }
  };

  const playNotificationSound = () => {
    if (settings.notificationSounds.custom) {
      const audio = new Audio(settings.notificationSounds.custom);
      audio.play().catch(console.error);
    } else if (settings.notificationSounds.default) {
      // Browser notification sound
      new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvmgo=').play().catch(console.error);
    }
  };

  const scheduleSessionReminders = () => {
    const now = new Date();
    const sessionTimes = [
      settings.sessionTimes.morning,
      settings.sessionTimes.afternoon,
      settings.sessionTimes.evening
    ];

    sessionTimes.forEach((time, index) => {
      const [hours, minutes] = time.split(':').map(Number);
      const sessionTime = new Date(now);
      sessionTime.setHours(hours, minutes, 0, 0);

      // If session time has passed today, schedule for tomorrow
      if (sessionTime <= now) {
        sessionTime.setDate(sessionTime.getDate() + 1);
      }

      // 15 minute reminder
      const reminder15 = new Date(sessionTime.getTime() - 15 * 60 * 1000);
      const timeout15 = reminder15.getTime() - now.getTime();
      
      if (timeout15 > 0) {
        setTimeout(() => {
          const sessionNames = ['Morning', 'Afternoon', 'Evening'];
          const message = `⏰ 15-minute reminder: ${sessionNames[index]} session starts in 15 minutes!`;
          sendTelegramNotification(message);
          playNotificationSound();
          
          if (Notification.permission === 'granted') {
            new Notification('TaskMasterScheduler', { body: message });
          }
        }, timeout15);
      }

      // 5 minute reminder
      const reminder5 = new Date(sessionTime.getTime() - 5 * 60 * 1000);
      const timeout5 = reminder5.getTime() - now.getTime();
      
      if (timeout5 > 0) {
        setTimeout(() => {
          const sessionNames = ['Morning', 'Afternoon', 'Evening'];
          const message = `🚨 5-minute reminder: ${sessionNames[index]} session starts in 5 minutes!`;
          sendTelegramNotification(message);
          playNotificationSound();
          
          if (Notification.permission === 'granted') {
            new Notification('TaskMasterScheduler', { body: message });
          }
        }, timeout5);
      }
    });
  };

  const scheduleEndOfDayReminder = () => {
    const now = new Date();
    const [hours, minutes] = settings.endOfDayTime.split(':').map(Number);
    const eodTime = new Date(now);
    eodTime.setHours(hours, minutes, 0, 0);

    if (eodTime <= now) {
      eodTime.setDate(eodTime.getDate() + 1);
    }

    const timeout = eodTime.getTime() - now.getTime();
    
    setTimeout(() => {
      const message = '📋 End of day checklist time! Time to review your tasks and plan for tomorrow.';
      sendTelegramNotification(message);
      playNotificationSound();
      
      if (Notification.permission === 'granted') {
        new Notification('TaskMasterScheduler', { body: message });
      }
    }, timeout);
  };

  useEffect(() => {
    if (user) {
      // Request notification permission
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }

      scheduleSessionReminders();
      scheduleEndOfDayReminder();
    }
  }, [user, settings]);

  const value = {
    sendTelegramNotification,
    playNotificationSound
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}
