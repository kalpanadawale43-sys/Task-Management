import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  Target, 
  Calendar,
  Download,
  Filter
} from 'lucide-react';
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { formatDuration, calculateProductivity } from '../../utils/helpers';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export default function Analytics() {
  const { sessions, tasks, exportData } = useData();
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('week');

  const getFilteredData = () => {
    const now = new Date();
    let startDate: Date;
    
    switch (timeRange) {
      case 'week':
        startDate = startOfWeek(now);
        break;
      case 'month':
        startDate = startOfMonth(now);
        break;
      default:
        startDate = user?.startDate ? new Date(user.startDate) : subDays(now, 30);
    }

    const filteredSessions = sessions.filter(session => 
      new Date(session.date) >= startDate
    );
    
    const filteredTasks = tasks.filter(task => 
      new Date(task.date) >= startDate
    );

    return { filteredSessions, filteredTasks };
  };

  const { filteredSessions, filteredTasks } = getFilteredData();

  // Calculate statistics
  const totalHours = filteredSessions
    .filter(session => session.status === 'completed')
    .reduce((total, session) => total + session.totalDuration, 0);

  const completedSessions = filteredSessions.filter(s => s.status === 'completed').length;
  const totalSessions = filteredSessions.length;
  
  const completedTasks = filteredTasks.filter(t => t.completed).length;
  const totalTasks = filteredTasks.length;

  const productivity = calculateProductivity(filteredSessions, filteredTasks);

  // Chart data for daily hours
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayHours = sessions
      .filter(s => s.date === dateStr && s.status === 'completed')
      .reduce((total, s) => total + s.totalDuration, 0);
    
    return {
      date: format(date, 'MMM dd'),
      hours: Math.round(dayHours / 60 * 10) / 10 // Convert to hours with 1 decimal
    };
  });

  const barChartData = {
    labels: last7Days.map(d => d.date),
    datasets: [
      {
        label: 'Study Hours',
        data: last7Days.map(d => d.hours),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  const barChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Daily Study Hours (Last 7 Days)',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Hours'
        }
      }
    },
  };

  // Session type distribution
  const sessionTypeData = {
    morning: filteredSessions.filter(s => s.type === 'morning' && s.status === 'completed').length,
    afternoon: filteredSessions.filter(s => s.type === 'afternoon' && s.status === 'completed').length,
    evening: filteredSessions.filter(s => s.type === 'evening' && s.status === 'completed').length,
  };

  const pieChartData = {
    labels: ['Morning', 'Afternoon', 'Evening'],
    datasets: [
      {
        data: [sessionTypeData.morning, sessionTypeData.afternoon, sessionTypeData.evening],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(168, 85, 247, 0.8)',
        ],
        borderColor: [
          'rgba(34, 197, 94, 1)',
          'rgba(59, 130, 246, 1)',
          'rgba(168, 85, 247, 1)',
        ],
        borderWidth: 2,
      },
    ],
  };

  const pieChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
      title: {
        display: true,
        text: 'Session Distribution',
      },
    },
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
            <p className="text-gray-600 mt-1">
              Track your progress and analyze your study patterns
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as 'week' | 'month' | 'all')}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="all">All Time</option>
              </select>
            </div>
            
            <button
              onClick={exportData}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Data
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Total Study Time</h3>
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
              <h3 className="text-sm font-medium text-gray-500">Productivity</h3>
              <p className="text-2xl font-bold text-gray-900">{productivity}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <BarChart3 className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Sessions</h3>
              <p className="text-2xl font-bold text-gray-900">{completedSessions}/{totalSessions}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 bg-orange-100 rounded-lg">
              <Calendar className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Tasks</h3>
              <p className="text-2xl font-bold text-gray-900">{completedTasks}/{totalTasks}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Bar Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <Bar data={barChartData} options={barChartOptions} />
        </div>

        {/* Pie Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <Pie data={pieChartData} options={pieChartOptions} />
        </div>
      </div>

      {/* Detailed Statistics */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Detailed Statistics</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Session Statistics */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Session Performance</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Morning Sessions:</span>
                <span className="font-medium">{sessionTypeData.morning}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Afternoon Sessions:</span>
                <span className="font-medium">{sessionTypeData.afternoon}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Evening Sessions:</span>
                <span className="font-medium">{sessionTypeData.evening}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                <span className="text-gray-600">Completion Rate:</span>
                <span className="font-medium">
                  {totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0}%
                </span>
              </div>
            </div>
          </div>

          {/* Task Statistics */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Task Performance</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Tasks:</span>
                <span className="font-medium">{totalTasks}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Completed:</span>
                <span className="font-medium text-green-600">{completedTasks}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Incomplete:</span>
                <span className="font-medium text-red-600">{totalTasks - completedTasks}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                <span className="text-gray-600">Completion Rate:</span>
                <span className="font-medium">
                  {totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}%
                </span>
              </div>
            </div>
          </div>

          {/* Time Statistics */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Time Analysis</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Hours:</span>
                <span className="font-medium">{formatDuration(totalHours)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Average per Session:</span>
                <span className="font-medium">
                  {completedSessions > 0 
                    ? formatDuration(Math.round(totalHours / completedSessions))
                    : '0m'
                  }
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Average per Day:</span>
                <span className="font-medium">
                  {timeRange === 'week' 
                    ? formatDuration(Math.round(totalHours / 7))
                    : timeRange === 'month'
                    ? formatDuration(Math.round(totalHours / 30))
                    : formatDuration(Math.round(totalHours / Math.max(1, filteredSessions.length)))
                  }
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                <span className="text-gray-600">Study Efficiency:</span>
                <span className="font-medium">
                  {productivity >= 80 ? '🔥 Excellent' : 
                   productivity >= 60 ? '👍 Good' : 
                   productivity >= 40 ? '⚠️ Fair' : '📈 Needs Improvement'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Insights */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
          Performance Insights
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h3 className="font-medium text-gray-900">Strengths</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              {productivity >= 80 && (
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  Excellent overall productivity
                </li>
              )}
              {completedSessions >= totalSessions * 0.8 && (
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  High session completion rate
                </li>
              )}
              {completedTasks >= totalTasks * 0.8 && (
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  Strong task completion habits
                </li>
              )}
              {Math.max(sessionTypeData.morning, sessionTypeData.afternoon, sessionTypeData.evening) === sessionTypeData.morning && (
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  Consistent morning study routine
                </li>
              )}
            </ul>
          </div>
          
          <div className="space-y-3">
            <h3 className="font-medium text-gray-900">Areas for Improvement</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              {productivity < 60 && (
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                  Focus on improving overall productivity
                </li>
              )}
              {completedSessions < totalSessions * 0.7 && (
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                  Work on session consistency
                </li>
              )}
              {completedTasks < totalTasks * 0.7 && (
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                  Improve task completion rate
                </li>
              )}
              {sessionTypeData.evening > sessionTypeData.morning + sessionTypeData.afternoon && (
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                  Consider more morning/afternoon sessions
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
