import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { X, CheckCircle, XCircle, BarChart3, Upload } from 'lucide-react';
import { format } from 'date-fns';

interface EndOfDayChecklistProps {
  onClose: () => void;
}

export default function EndOfDayChecklist({ onClose }: EndOfDayChecklistProps) {
  const { getTodaysTasks, updateTask } = useData();
  const [incompletionReasons, setIncompletionReasons] = useState<Record<string, string>>({});
  const [showTomorrowTasks, setShowTomorrowTasks] = useState(false);
  const [tomorrowTasks, setTomorrowTasks] = useState('');

  const todaysTasks = getTodaysTasks();
  const completedTasks = todaysTasks.filter(task => task.completed);
  const incompleteTasks = todaysTasks.filter(task => !task.completed);

  const handleReasonChange = (taskId: string, reason: string) => {
    setIncompletionReasons(prev => ({ ...prev, [taskId]: reason }));
  };

  const completeReview = () => {
    // Update incomplete tasks with reasons
    incompleteTasks.forEach(task => {
      const reason = incompletionReasons[task.id];
      if (reason && reason.trim()) {
        updateTask(task.id, { incompletionReason: reason.trim() });
      }
    });

    // Add tomorrow's tasks if provided
    if (tomorrowTasks.trim()) {
      const tomorrow = format(new Date(Date.now() + 24 * 60 * 60 * 1000), 'yyyy-MM-dd');
      const taskLines = tomorrowTasks.split('\n').filter(line => line.trim());
      
      taskLines.forEach(line => {
        const task = line.trim();
        if (task) {
          useData().addTask({
            title: task,
            description: '',
            date: tomorrow,
            completed: false
          });
        }
      });
    }

    setShowTomorrowTasks(true);
  };

  const productivity = todaysTasks.length > 0 
    ? Math.round((completedTasks.length / todaysTasks.length) * 100) 
    : 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">End of Day Review</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Daily Summary */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <BarChart3 className="w-6 h-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Daily Summary</h3>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{todaysTasks.length}</p>
                <p className="text-sm text-gray-600">Total Tasks</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{completedTasks.length}</p>
                <p className="text-sm text-gray-600">Completed</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{productivity}%</p>
                <p className="text-sm text-gray-600">Productivity</p>
              </div>
            </div>
          </div>

          {/* Completed Tasks */}
          {completedTasks.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                Completed Tasks ({completedTasks.length})
              </h3>
              
              <div className="space-y-2">
                {completedTasks.map(task => (
                  <div key={task.id} className="flex items-center p-3 bg-green-50 rounded-lg">
                    <CheckCircle className="w-4 h-4 text-green-600 mr-3" />
                    <div>
                      <p className="font-medium text-green-800">{task.title}</p>
                      {task.description && (
                        <p className="text-sm text-green-600">{task.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Incomplete Tasks */}
          {incompleteTasks.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <XCircle className="w-5 h-5 text-red-600 mr-2" />
                Incomplete Tasks ({incompleteTasks.length})
              </h3>
              
              <div className="space-y-4">
                {incompleteTasks.map(task => (
                  <div key={task.id} className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <XCircle className="w-4 h-4 text-red-600 mt-1" />
                      <div className="flex-1">
                        <p className="font-medium text-red-800">{task.title}</p>
                        {task.description && (
                          <p className="text-sm text-red-600 mb-3">{task.description}</p>
                        )}
                        
                        <div>
                          <label className="block text-sm font-medium text-red-700 mb-2">
                            Reason for incompletion:
                          </label>
                          <textarea
                            value={incompletionReasons[task.id] || ''}
                            onChange={(e) => handleReasonChange(task.id, e.target.value)}
                            rows={2}
                            className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                            placeholder="Why wasn't this task completed?"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tomorrow's Tasks */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Plan Tomorrow's Tasks</h3>
            
            <textarea
              value={tomorrowTasks}
              onChange={(e) => setTomorrowTasks(e.target.value)}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter tomorrow's tasks (one per line)..."
            />
            
            <p className="text-sm text-gray-600 mt-2">
              Enter each task on a new line. These will be added to tomorrow's task list.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                completeReview();
                onClose();
              }}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              Complete Review
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
