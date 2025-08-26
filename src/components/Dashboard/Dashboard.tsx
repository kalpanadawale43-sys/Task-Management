import React, { useState, useEffect } from 'react';
import { useData } from '../../contexts/DataContext';
import { Clock, Play, Pause, Square, Plus, Timer, Target, Flame, Activity } from 'lucide-react';
import { format } from 'date-fns';
import { formatDuration, isWithinWorkingHours } from '../../utils/helpers';
import { SessionCard } from './SessionCard';
import ActiveSlotTimer from './ActiveSlotTimer';
import CreateSlotModal from './CreateSlotModal';

export default function Dashboard() {
  const { 
    getTodaysSessions, 
    getActiveSession, 
    getStreakCount, 
    getTotalHours, 
    updateSession,
    addSession,
    settings 
  } = useData();
  
  const [showCreateSlot, setShowCreateSlot] = useState(false);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  const todaysSessions = getTodaysSessions();
  const activeSession = getActiveSession();
  const streakCount = getStreakCount();
  const totalHours = getTotalHours();
  
  // Calculate today's hours
  const todaysHours = todaysSessions
    .filter(session => session.status === 'completed')
    .reduce((total, session) => total + session.totalDuration, 0);
  
  // Get active slot info
  const activeSlot = activeSession?.slots.find(slot => slot.status === 'active');
  
  // Progress calculation (10 hours = 600 minutes target)
  const dailyTargetMinutes = 600; // 10 hours
  const progressPercentage = Math.min((todaysHours / dailyTargetMinutes) * 100, 100);
  const isOverTarget = todaysHours > dailyTargetMinutes;
  const overTargetHours = isOverTarget ? todaysHours - dailyTargetMinutes : 0;

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const canStartSession = isWithinWorkingHours(settings.sessionTimes);

  const startSession = (type: 'morning' | 'afternoon' | 'evening') => {
    if (!canStartSession) {
      alert('Sessions cannot be started between 10 PM and 9 AM');
      return;
    }

    if (activeSession) {
      alert('Please complete the current session before starting a new one');
      return;
    }

    // Check if session of this type already exists today
    const existingSession = todaysSessions.find(s => s.type === type);
    if (existingSession) {
      alert(`${type.charAt(0).toUpperCase() + type.slice(1)} session already exists for today`);
      return;
    }

    const newSession = {
      type,
      date: format(new Date(), 'yyyy-MM-dd'),
      startTime: new Date(),
      endTime: null,
      status: 'active' as const,
      slots: [],
      totalDuration: 0
    };

    const session = addSession(newSession);
    setSelectedSession(session.id);
    setShowCreateSlot(true);
  };

  const endSession = () => {
    if (!activeSession) return;

    const endTime = new Date();
    console.log(`Session ended at: ${endTime.toLocaleString()}`);
    
    updateSession(activeSession.id, {
      endTime: endTime,
      status: 'completed'
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Track your progress and manage your study sessions</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 bg-orange-100 rounded-lg">
              <Activity className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Today's Hours</h3>
              <p className="text-2xl font-bold text-gray-900">{formatDuration(todaysHours)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Total Hours</h3>
              <p className="text-2xl font-bold text-gray-900">{formatDuration(totalHours)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <Target className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Daily Streak</h3>
              <p className="text-2xl font-bold text-gray-900">{streakCount} days</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Timer className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Current Time</h3>
              <p className="text-2xl font-bold text-gray-900">
                {format(currentTime, 'HH:mm:ss')}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 bg-orange-100 rounded-lg">
              <Play className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Today's Sessions</h3>
              <p className="text-2xl font-bold text-gray-900">{todaysSessions.length}/3</p>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Progress Bar */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Daily Progress</h2>
          <div className="text-right">
            <p className="text-sm text-gray-600">Target: 10 hours</p>
            <p className="text-lg font-bold text-gray-900">
              {formatDuration(todaysHours)} / {formatDuration(dailyTargetMinutes)}
            </p>
          </div>
        </div>
        
        <div className="relative">
          {/* Background bar */}
          <div className="w-full bg-gray-200 rounded-full h-6">
            {/* Progress bar */}
            <div
              className={`h-6 rounded-full transition-all duration-500 ${
                isOverTarget 
                  ? 'bg-gradient-to-r from-green-500 via-yellow-500 to-orange-500' 
                  : 'bg-gradient-to-r from-blue-500 to-green-500'
              }`}
              style={{
                width: `${Math.min(progressPercentage, 100)}%`
              }}
            />
            
            {/* Overtime indicator */}
            {isOverTarget && (
              <div
                className="absolute top-0 h-6 bg-gradient-to-r from-orange-500 to-red-500 rounded-r-full"
                style={{
                  left: '100%',
                  width: `${Math.min((overTargetHours / dailyTargetMinutes) * 100, 50)}%`,
                  transform: 'translateX(-100%)'
                }}
              />
            )}
          </div>
          
          {/* Progress text overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-medium text-white drop-shadow-lg">
              {Math.round(progressPercentage)}%
              {isOverTarget && (
                <span className="ml-2 text-orange-100">
                  (+{formatDuration(overTargetHours)} overtime)
                </span>
              )}
            </span>
          </div>
        </div>
        
        <div className="flex justify-between items-center mt-3 text-sm text-gray-600">
          <span>0h</span>
          <span className="text-center">
            {isOverTarget ? (
              <span className="text-orange-600 font-medium">
                🎉 Target exceeded! Great work!
              </span>
            ) : progressPercentage >= 80 ? (
              <span className="text-green-600 font-medium">
                🔥 Almost there! Keep going!
              </span>
            ) : progressPercentage >= 50 ? (
              <span className="text-blue-600 font-medium">
                💪 Good progress! Stay focused!
              </span>
            ) : (
              <span className="text-gray-600">
                📚 Let's get started!
              </span>
            )}
          </span>
          <span>10h</span>
        </div>
      </div>

      {/* Active Session */}
      {activeSession && (
        <ActiveSlotTimer 
          session={activeSession}
          onEndSession={endSession}
          onAddSlot={() => {
            setSelectedSession(activeSession.id);
            setShowCreateSlot(true);
          }}
        />
      )}

      {/* Session Controls */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Start Session</h2>
        
        {!canStartSession && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg mb-4">
            Sessions cannot be started between 10 PM and 9 AM
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => startSession('morning')}
            disabled={!canStartSession || !!activeSession}
            className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="text-center">
              <Play className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <h3 className="font-semibold text-gray-900">Morning Session</h3>
              <p className="text-sm text-gray-600">{settings.sessionTimes.morning}</p>
            </div>
          </button>

          <button
            onClick={() => startSession('afternoon')}
            disabled={!canStartSession || !!activeSession}
            className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="text-center">
              <Play className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <h3 className="font-semibold text-gray-900">Afternoon Session</h3>
              <p className="text-sm text-gray-600">{settings.sessionTimes.afternoon}</p>
            </div>
          </button>

          <button
            onClick={() => startSession('evening')}
            disabled={!canStartSession || !!activeSession}
            className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="text-center">
              <Play className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <h3 className="font-semibold text-gray-900">Evening Session</h3>
              <p className="text-sm text-gray-600">{settings.sessionTimes.evening}</p>
            </div>
          </button>
        </div>
      </div>

      {/* Today's Sessions */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Today's Sessions</h2>
        
        {todaysSessions.length === 0 ? (
          <div className="text-center py-8">
            <Timer className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No sessions started today</p>
          </div>
        ) : (
          <div className="space-y-4">
            {todaysSessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                onAddSlot={() => {
                  setSelectedSession(session.id);
                  setShowCreateSlot(true);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Slot Modal */}
      {showCreateSlot && selectedSession && (
        <CreateSlotModal
          sessionId={selectedSession}
          onClose={() => {
            setShowCreateSlot(false);
            setSelectedSession(null);
          }}
        />
      )}
    </div>
  );
}
