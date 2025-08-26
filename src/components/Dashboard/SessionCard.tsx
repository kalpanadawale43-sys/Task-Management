import React from 'react';
import { Session, Slot } from '../../types/data';
import { useData } from '../../contexts/DataContext';
import { Play, Pause, Square, Clock, Plus } from 'lucide-react';

interface SessionCardProps {
  session: Session;
  onAddSlot: () => void;
}

export const SessionCard: React.FC<SessionCardProps> = ({ session, onAddSlot }) => {
  const { updateSession } = useData();

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getStatusColor = (status: Slot['status']): string => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'paused': return 'text-yellow-600 bg-yellow-100';
      case 'completed': return 'text-gray-600 bg-gray-100';
      default: return 'text-blue-600 bg-blue-100';
    }
  };

  const handleStartSlot = (slotId: string) => {
    // Check if any other slot is currently active
    const hasActiveSlot = session.slots.some(slot => slot.status === 'active' && slot.id !== slotId);
    
    if (hasActiveSlot) {
      alert('Please pause or end the current active slot before starting a new one.');
      return;
    }

    const updatedSlots = session.slots.map(slot =>
      slot.id === slotId
        ? { ...slot, status: 'active' as const, startTime: new Date().toISOString() }
        : slot
    );
    
    updateSession(session.id, { slots: updatedSlots });
  };

  const handlePauseSlot = (slotId: string) => {
    const slot = session.slots.find(s => s.id === slotId);
    if (!slot || !slot.startTime) return;

    const currentDuration = slot.duration || 0;
    const sessionTime = Math.floor((Date.now() - new Date(slot.startTime).getTime()) / 1000);
    
    const updatedSlots = session.slots.map(s =>
      s.id === slotId
        ? { ...s, status: 'pending' as const, duration: currentDuration + sessionTime }
        : s
    );
    
    updateSession(session.id, { slots: updatedSlots });
  };

  const handleEndSlot = (slotId: string) => {
    const slot = session.slots.find(s => s.id === slotId);
    if (!slot || !slot.startTime) return;

    const currentDuration = slot.duration || 0;
    const sessionTime = Math.floor((Date.now() - new Date(slot.startTime).getTime()) / 1000);
    
    const updatedSlots = session.slots.map(s =>
      s.id === slotId
        ? { ...s, status: 'completed' as const, duration: currentDuration + sessionTime, endTime: new Date().toISOString() }
        : s
    );
    
    // Calculate new total duration
    const newTotalDuration = updatedSlots.reduce((total, s) => total + (s.duration || 0), 0);
    
    updateSession(session.id, { slots: updatedSlots, totalDuration: newTotalDuration });
  };

  const hasActiveSlot = session.slots.some(slot => slot.status === 'active');

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-4">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-xl font-semibold text-gray-800 capitalize">
            {session.type} Session
          </h3>
          <p className="text-sm text-gray-600">
            Started: {session.startTime ? new Date(session.startTime).toLocaleTimeString() : 'Not started'}
            {session.status === 'completed' && session.endTime && (
              <span className="ml-2">
                • Ended: {new Date(session.endTime).toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-600">Total Duration</p>
          <p className="text-lg font-semibold text-blue-600">
            {formatTime(session.totalDuration)}
          </p>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${
            session.status === 'completed' ? 'bg-green-100 text-green-800' :
            session.status === 'active' ? 'bg-blue-100 text-blue-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {session.status}
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {session.slots.map((slot) => (
          <div key={slot.id} className="border rounded-lg p-4 bg-gray-50">
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                <h4 className="font-medium text-gray-800">{slot.name}</h4>
                {slot.description && (
                  <p className="text-sm text-gray-600 mt-1">{slot.description}</p>
                )}
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    Est: {formatDuration(slot.estimatedDuration)}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(slot.status)}`}>
                    {slot.status}
                  </span>
                </div>
              </div>
              
              <div className="flex gap-2 ml-4">
                {slot.status === 'pending' && (
                  <button
                    onClick={() => handleStartSlot(slot.id)}
                    className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
                  >
                    <Play className="w-4 h-4" />
                    Start
                  </button>
                )}
                
                {slot.status === 'active' && (
                  <>
                    <button
                      onClick={() => handlePauseSlot(slot.id)}
                      className="flex items-center gap-1 px-3 py-1 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors text-sm"
                    >
                      <Pause className="w-4 h-4" />
                      Pause
                    </button>
                    <button
                      onClick={() => handleEndSlot(slot.id)}
                      className="flex items-center gap-1 px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
                    >
                      <Square className="w-4 h-4" />
                      End
                    </button>
                  </>
                )}
                
              </div>
            </div>
            
            {slot.duration > 0 && (
              <div className="text-sm text-gray-600">
                Duration: {formatTime(slot.duration)}
              </div>
            )}
          </div>
        ))}
      </div>

      {!hasActiveSlot && session.status !== 'completed' && (
        <button
          onClick={onAddSlot}
          className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Slot
        </button>
      )}
      
      {session.status === 'completed' && (
        <div className="mt-4 text-center text-sm text-gray-500 italic">
          Session completed - no more slots can be added
        </div>
      )}
    </div>
  );
};
