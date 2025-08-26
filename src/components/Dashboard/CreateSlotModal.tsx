import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { X, Play, Clock } from 'lucide-react';
import { generateId } from '../../utils/helpers';

interface CreateSlotModalProps {
  sessionId: string;
  onClose: () => void;
}

export default function CreateSlotModal({ sessionId, onClose }: CreateSlotModalProps) {
  const { sessions, updateSession, getTodaysSessions } = useData();
  const [description, setDescription] = useState('');
  const [estimatedDuration, setEstimatedDuration] = useState(30);
  const [startImmediately, setStartImmediately] = useState(false);

  const session = sessions.find(s => s.id === sessionId);
  
  // Check if there's already an active slot in this session
  const hasActiveSlot = session?.slots.some(slot => slot.status === 'active');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session) return;
    
    // Prevent starting a slot if another is already active
    if (startImmediately && hasActiveSlot) {
      alert('Cannot start a new slot while another slot is active. Please complete the current slot first.');
      return;
    }

    const todaysSessions = getTodaysSessions();
    const totalSlotsToday = todaysSessions.reduce((count, s) => count + s.slots.length, 0);
    const name = `slot-${totalSlotsToday + 1}`;

    const newSlot = {
      id: generateId(),
      name,
      description,
      estimatedDuration,
      startTime: startImmediately ? new Date() : null,
      endTime: null,
      duration: 0,
      status: startImmediately ? 'active' as const : 'pending' as const
    };

    const updatedSlots = [...session.slots, newSlot];
    updateSession(sessionId, { slots: updatedSlots });
    
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Create New Slot</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Describe what you'll be working on..."
              required
            />
          </div>

          <div>
            <label htmlFor="estimatedDuration" className="block text-sm font-medium text-gray-700 mb-2">
              Estimated Duration (minutes)
            </label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                id="estimatedDuration"
                type="number"
                max="480"
                step="5"
                value={estimatedDuration}
                onChange={(e) => setEstimatedDuration(parseInt(e.target.value))}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <p className="text-sm text-gray-600 mt-1">
              How long do you plan to work on this slot?
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <input
              id="startImmediately"
              type="checkbox"
              checked={startImmediately}
              onChange={(e) => setStartImmediately(e.target.checked)}
              disabled={hasActiveSlot}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            />
            <label htmlFor="startImmediately" className={`text-sm ${hasActiveSlot ? 'text-gray-400' : 'text-gray-700'}`}>
              Start immediately
            </label>
            {hasActiveSlot && (
              <span className="text-xs text-red-600">
                (Complete active slot first)
              </span>
            )}
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              <Play className="w-4 h-4 mr-2" />
              Create Slot
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
