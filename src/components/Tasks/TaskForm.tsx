import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { X, Plus, Upload } from 'lucide-react';
import { format, addDays, isToday } from 'date-fns';

interface TaskFormProps {
  onClose: () => void;
}

export default function TaskForm({ onClose }: TaskFormProps) {
  const { addTask } = useData();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tasks, setTasks] = useState<{ title: string; description: string }[]>([
    { title: '', description: '' }
  ]);

  // Set initial date to tomorrow
  const tomorrow = addDays(new Date(), 1);
  const today = new Date();
  const [date, setDate] = useState(format(tomorrow, 'yyyy-MM-dd'));

  const addTaskField = () => {
    setTasks([...tasks, { title: '', description: '' }]);
  };

  const removeTaskField = (index: number) => {
    if (tasks.length > 1) {
      setTasks(tasks.filter((_, i) => i !== index));
    }
  };

  const updateTask = (index: number, field: 'title' | 'description', value: string) => {
    const updatedTasks = tasks.map((task, i) => 
      i === index ? { ...task, [field]: value } : task
    );
    setTasks(updatedTasks);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    tasks.forEach(task => {
      if (task.title.trim()) {
        addTask({
          title: task.title.trim(),
          description: task.description.trim(),
          date,
          completed: false
        });
      }
    });
    
    onClose();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const lines = content.split('\n').filter(line => line.trim());
      
      const newTasks = lines.map(line => ({
        title: line.trim(),
        description: ''
      }));
      
      setTasks(newTasks.length > 0 ? newTasks : [{ title: '', description: '' }]);
    };
    
    reader.readAsText(file);
  };

  // Disable dates other than today and tomorrow
  const getMinDate = () => {
    return format(today, 'yyyy-MM-dd');
  };

  const getMaxDate = () => {
    return format(tomorrow, 'yyyy-MM-dd');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Add Tasks</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-6">
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
              Date
            </label>
            <input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              min={getMinDate()}
              max={getMaxDate()}
            />
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Tasks</h3>
              <div className="flex space-x-2">
                <label className="flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 cursor-pointer transition-colors duration-200">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload File
                  <input
                    type="file"
                    accept=".txt,.csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
                <button
                  type="button"
                  onClick={addTaskField}
                  className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Task
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {tasks.map((task, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700">Task {index + 1}</span>
                    {tasks.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeTaskField(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={task.title}
                      onChange={(e) => updateTask(index, 'title', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Task title"
                      required
                    />
                    
                    <textarea
                      value={task.description}
                      onChange={(e) => updateTask(index, 'description', e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Task description (optional)"
                    />
                  </div>
                </div>
              ))}
            </div>
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
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              Add Tasks
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
