import React, { useState, useEffect } from 'react';
import { Session, Slot } from '../../types/data';
import { useData } from '../../contexts/DataContext';
import { Timer, Play, Pause, Square, Plus } from 'lucide-react';
import { formatDuration } from '../../utils/helpers';

interface ActiveSlotTimerProps {
  session: Session;
  onEndSession: () => void;
  onAddSlot: () => void;
}

export default function ActiveSlotTimer({ session, onEndSession, onAddSlot }: ActiveSlotTimerProps) {
  const { updateSession } = useData();
  const [currentSlot, setCurrentSlot] = useState<Slot | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0); // in seconds
  const [pauseTime, setPauseTime] = useState(0); // in seconds
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const activeSlot = session.slots.find(slot => slot.status === 'active');
    setCurrentSlot(activeSlot || null);

    if (activeSlot && activeSlot.startTime) {
      const now = Date.now();
      const startTime = new Date(activeSlot.startTime).getTime();
      const totalPauseDurationInMs = (activeSlot.totalPauseDuration || 0) * 1000;

      if (activeSlot.pauseStartTime) { // It is currently paused
        setIsPaused(true);
        const pauseStartTime = new Date(activeSlot.pauseStartTime).getTime();
        const currentPauseDurationInMs = now - pauseStartTime;
        setPauseTime(Math.floor(currentPauseDurationInMs / 1000));
        
        const elapsedMs = pauseStartTime - startTime - totalPauseDurationInMs;
        setElapsedTime(Math.max(0, Math.floor(elapsedMs / 1000)));
      } else { // It is running
        setIsPaused(false);
        setPauseTime(0);
        const elapsedMs = now - startTime - totalPauseDurationInMs;
        setElapsedTime(Math.max(0, Math.floor(elapsedMs / 1000)));
      }
    } else {
      setIsPaused(false);
      setElapsedTime(0);
      setPauseTime(0);
    }
  }, [session]);

  useEffect(() => {
    if (!currentSlot) return;

    const interval = setInterval(() => {
      if (isPaused) {
        setPauseTime(prev => prev + 1);
      } else {
        setElapsedTime(prev => prev + 1);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [currentSlot, isPaused]);

  const handlePauseToggle = () => {
    if (!currentSlot) return;

    const now = new Date();
    let updatedSlots;

    if (isPaused) { // Resuming
      const pauseStartTime = new Date(currentSlot.pauseStartTime!).getTime();
      const thisPauseDurationSec = (now.getTime() - pauseStartTime) / 1000;
      const newTotalPauseDuration = (currentSlot.totalPauseDuration || 0) + thisPauseDurationSec;

      updatedSlots = session.slots.map(slot =>
        slot.id === currentSlot.id
          ? { ...slot, pauseStartTime: null, totalPauseDuration: newTotalPauseDuration }
          : slot
      );
    } else { // Pausing
      updatedSlots = session.slots.map(slot =>
        slot.id === currentSlot.id
          ? { ...slot, pauseStartTime: now }
          : slot
      );
    }
    updateSession(session.id, { slots: updatedSlots });
  };

  const endSlot = () => {
    if (!currentSlot) return;

    const endTime = new Date();
    let finalTotalPauseDurationSec = currentSlot.totalPauseDuration || 0;

    if (currentSlot.pauseStartTime) {
      const pauseStartTime = new Date(currentSlot.pauseStartTime).getTime();
      finalTotalPauseDurationSec += (endTime.getTime() - pauseStartTime) / 1000;
    }

    const startTime = new Date(currentSlot.startTime!).getTime();
    const totalElapsedMs = endTime.getTime() - startTime - (finalTotalPauseDurationSec * 1000);
    const durationInMinutes = Math.floor(totalElapsedMs / (1000 * 60));

    const updatedSlots = session.slots.map(slot =>
      slot.id === currentSlot.id
        ? {
            ...slot,
            status: 'completed' as const,
            endTime,
            duration: durationInMinutes,
            totalPauseDuration: finalTotalPauseDurationSec,
            pauseStartTime: null,
          }
        : slot
    );

    const totalDuration = updatedSlots.reduce((total, slot) =>
      total + (slot.duration || 0), 0
    );

    updateSession(session.id, {
      slots: updatedSlots,
      totalDuration
    });
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-white/20 rounded-lg">
            <Timer className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Active Session</h2>
            <p className="text-blue-100 capitalize">{session.type} Session</p>
          </div>
        </div>
        
        <button
          onClick={onEndSession}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200"
        >
          End Session
        </button>
      </div>

      {currentSlot ? (
        <div className="bg-white/10 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">{currentSlot.name}</h3>
              <p className="text-blue-100">{currentSlot.description}</p>
            </div>
            
            <div className="text-right">
              <div className="text-3xl font-bold font-mono">
                {formatTime(elapsedTime)}
              </div>
              <p className="text-blue-100 text-sm">Elapsed Time</p>
              {isPaused && (
                <>
                  <div className="text-lg font-bold font-mono text-yellow-300 mt-1">
                    {formatTime(pauseTime)}
                  </div>
                  <p className="text-yellow-200 text-xs">Paused</p>
                </>
              )}
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={handlePauseToggle}
              className={`flex items-center px-4 py-2 text-white rounded-lg transition-colors duration-200 ${
                isPaused 
                  ? 'bg-green-500 hover:bg-green-600' 
                  : 'bg-yellow-500 hover:bg-yellow-600'
              }`}
            >
              {isPaused ? <Play className="w-4 h-4 mr-2" /> : <Pause className="w-4 h-4 mr-2" />}
              {isPaused ? 'Resume' : 'Pause'}
            </button>
            
            <button
              onClick={endSlot}
              className="flex items-center px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200"
            >
              <Square className="w-4 h-4 mr-2" />
              End Slot
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white/10 rounded-lg p-6 text-center">
          <Timer className="w-12 h-12 mx-auto mb-4 text-blue-200" />
          <h3 className="text-lg font-semibold mb-2">No Active Slot</h3>
          <p className="text-blue-100 mb-4">Create a new slot to start tracking time</p>
          
          <button
            onClick={onAddSlot}
            className="flex items-center mx-auto px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Slot
          </button>
        </div>
      )}

      {session.slots.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-blue-100 mb-2">Session Progress</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{session.slots.length}</p>
              <p className="text-blue-100 text-sm">Total Slots</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">
                {session.slots.filter(s => s.status === 'completed').length}
              </p>
              <p className="text-blue-100 text-sm">Completed</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{formatDuration(session.totalDuration)}</p>
              <p className="text-blue-100 text-sm">Total Time</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">
                {session.slots.length > 0 
                  ? Math.round((session.slots.filter(s => s.status === 'completed').length / session.slots.length) * 100)
                  : 0}%
              </p>
              <p className="text-blue-100 text-sm">Progress</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
