import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { Plus, CheckCircle, XCircle, AlertTriangle, Calendar } from 'lucide-react';
import TaskForm from './TaskForm';
import TaskList from './TaskList';
import EndOfDayChecklist from './EndOfDayChecklist';

export default function TaskManager() {
  const { getTodaysTasks, settings } = useData();
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showEODChecklist, setShowEODChecklist] = useState(false);
  
  const todaysTasks = getTodaysTasks();
  const completedTasks = todaysTasks.filter(task => task.status === 'completed');
  const pendingTasks = todaysTasks.filter(task => task.status === 'pending' || task.status === 'incomplete');

  const isEndOfDay = () => {
    const now = new Date();
    const eodTime = settings.endOfDayTime.split(':');
    const eodHour = parseInt(eodTime[0]);
    const eodMinute = parseInt(eodTime[1]);
    
    return now.getHours() >= eodHour && now.getMinutes() >= eodMinute;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Task Manager</h1>
            <p className="text-gray-600 mt-1">
              Manage your daily tasks and track completion
            </p>
          </div>
          
          <div className="flex space-x-3">
            {isEndOfDay() && (
              <button
                onClick={() => setShowEODChecklist(true)}
                className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                End of Day Review
              </button>
            )}
            
            <button
              onClick={() => setShowTaskForm(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Task
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Total Tasks</h3>
              <p className="text-2xl font-bold text-gray-900">{todaysTasks.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Completed</h3>
              <p className="text-2xl font-bold text-gray-900">{completedTasks.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Pending</h3>
              <p className="text-2xl font-bold text-gray-900">{pendingTasks.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      {todaysTasks.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-900">Daily Progress</h3>
            <span className="text-sm text-gray-600">
              {completedTasks.length} of {todaysTasks.length} tasks completed
            </span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-300"
              style={{
                width: `${todaysTasks.length > 0 ? (completedTasks.length / todaysTasks.length) * 100 : 0}%`
              }}
            />
          </div>
          
          <p className="text-sm text-gray-600 mt-2">
            {todaysTasks.length > 0 
              ? `${Math.round((completedTasks.length / todaysTasks.length) * 100)}% complete`
              : 'No tasks for today'
            }
          </p>
        </div>
      )}

      {/* Task List */}
      <TaskList tasks={todaysTasks} />

      {/* Modals */}
      {showTaskForm && (
        <TaskForm onClose={() => setShowTaskForm(false)} />
      )}
      
      {showEODChecklist && (
        <EndOfDayChecklist onClose={() => setShowEODChecklist(false)} />
      )}
    </div>
  );
}
