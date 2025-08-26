export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  });
}

export function formatDuration(minutes: number): string {
  if (typeof minutes !== 'number' || isNaN(minutes)) {
    return '00:00:00';
  }

  const totalSeconds = Math.round(minutes * 60);
  
  const hours = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  
  const pad = (num: number) => num.toString().padStart(2, '0');
  
  return `${pad(hours)}:${pad(mins)}:${pad(secs)}`;
}

export function isTimeInRange(time: string, start: string, end: string): boolean {
  const timeMinutes = timeToMinutes(time);
  const startMinutes = timeToMinutes(start);
  const endMinutes = timeToMinutes(end);
  
  return timeMinutes >= startMinutes && timeMinutes <= endMinutes;
}

export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

export function getSessionType(time: string, sessionTimes: any): 'morning' | 'afternoon' | 'evening' | null {
  const timeMinutes = timeToMinutes(time);
  const morningStart = timeToMinutes(sessionTimes.morning);
  const afternoonStart = timeToMinutes(sessionTimes.afternoon);
  const eveningStart = timeToMinutes(sessionTimes.evening);
  
  if (timeMinutes >= morningStart && timeMinutes < afternoonStart) {
    return 'morning';
  } else if (timeMinutes >= afternoonStart && timeMinutes < eveningStart) {
    return 'afternoon';
  } else if (timeMinutes >= eveningStart) {
    return 'evening';
  }
  
  return null;
}

export function calculateProductivity(sessions: any[], tasks: any[]): number {
  const completedSessions = sessions.filter(s => s.status === 'completed').length;
  const totalSessions = sessions.length;
  const completedTasks = tasks.filter(t => t.completed).length;
  const totalTasks = tasks.length;
  
  if (totalSessions === 0 && totalTasks === 0) return 0;
  
  const sessionScore = totalSessions > 0 ? (completedSessions / totalSessions) * 50 : 0;
  const taskScore = totalTasks > 0 ? (completedTasks / totalTasks) * 50 : 0;
  
  return Math.round(sessionScore + taskScore);
}

export function isWithinWorkingHours(sessionTimes: any): boolean {
  const now = new Date();
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  
  // Block sessions between 10 PM and 9 AM
  return !isTimeInRange(currentTime, '22:00', '08:59');
}
