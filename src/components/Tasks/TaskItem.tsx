import React, { useState } from 'react';
import { Task } from '../../types/data';
import { useData } from '../../contexts/DataContext';
import { CheckCircle, XCircle, Trash2, AlertTriangle, RotateCcw, MessageSquare } from 'lucide-react';

interface TaskItemProps {
  task: Task;
}

export default function TaskItem({ task }: TaskItemProps) {
  const { updateTask, removeTask } = useData();
  const [reason, setReason] = useState(task.incompletionReason || '');

  const handleComplete = () => {
    updateTask(task.id, { status: 'completed' });
  };

  const handleIncomplete = () => {
    if (!reason) {
      alert('Please provide a reason for marking the task as incomplete.');
      return;
    }
    updateTask(task.id, { status: 'incomplete', incompletionReason: reason });
  };

  const handleRemove = () => {
    if (window.confirm(`Are you sure you want to remove the task: "${task.title}"?`)) {
      removeTask(task.id);
    }
  };

  const handleUndo = () => {
    updateTask(task.id, { status: 'pending' });
  };

  const getStatusBadge = () => {
    switch (task.status) {
      case 'completed':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Completed</span>;
      case 'incomplete':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Incomplete</span>;
      case 'pending':
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Pending</span>;
    }
  };

  const isCompleted = task.status === 'completed';

  return (
    <div
      className={`p-4 rounded-lg border transition-all duration-300 ${
        isCompleted ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
      }`}
    >
      <div className="flex items-start space-x-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className={`font-medium text-lg ${isCompleted ? 'text-green-800 line-through' : 'text-gray-900'}`}>
              {task.title}
            </h3>
            {getStatusBadge()}
          </div>
          
          {task.description && (
            <p className={`text-sm mt-1 ${isCompleted ? 'text-green-600' : 'text-gray-600'}`}>
              {task.description}
            </p>
          )}
        </div>
      </div>

      {!isCompleted && (
        <div className="mt-4 space-y-4">
          <div className="relative">
            <MessageSquare className="w-4 h-4 absolute top-3 left-3 text-gray-400" />
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason for incompletion..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button
                onClick={handleComplete}
                className="flex items-center px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
              >
                <CheckCircle className="w-4 h-4 mr-1.5" />
                Complete
              </button>
              <button
                onClick={handleIncomplete}
                className="flex items-center px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
              >
                <XCircle className="w-4 h-4 mr-1.5" />
                Incomplete
              </button>
            </div>
            <button
              onClick={handleRemove}
              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-100 rounded-full transition-colors"
              title="Remove Task"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {isCompleted && (
        <div className="mt-4 flex items-center justify-between">
          {task.incompletionReason && (
            <div className="p-2 bg-red-100 border border-red-200 rounded-lg text-sm text-red-800">
              <strong>Original Reason for Incompletion:</strong> {task.incompletionReason}
            </div>
          )}
          <div className="flex-grow"></div>
          <button
            onClick={handleUndo}
            className="flex items-center px-3 py-1.5 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors"
          >
            <RotateCcw className="w-4 h-4 mr-1.5" />
            Undo
          </button>
        </div>
      )}
      
      {task.status === 'incomplete' && task.incompletionReason && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800 flex items-start">
            <AlertTriangle className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
            <span><strong>Reason:</strong> {task.incompletionReason}</span>
          </p>
        </div>
      )}
    </div>
  );
}
