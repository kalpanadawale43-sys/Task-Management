import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import {
  Calendar,
  Plus,
  FileText,
  Upload,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Heart,
  User
} from 'lucide-react';
import { format, addDays, differenceInDays, eachDayOfInterval, isWithinInterval } from 'date-fns';

export default function LeaveManager() {
  const { leaves, addLeave, updateLeave, settings } = useData();
  const { user } = useAuth();
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [leaveType, setLeaveType] = useState<'sick' | 'mandatory' | 'personal'>('sick');
  const [leaveStartDate, setLeaveStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [leaveEndDate, setLeaveEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [leaveReason, setLeaveReason] = useState('');
  const [leaveDocument, setLeaveDocument] = useState<File | null>(null);
  const [modifyingLeaveId, setModifyingLeaveId] = useState<string | null>(null);

  // Calculate next mandatory day off
  const getNextMandatoryDayOff = () => {
    if (!user?.startDate) return null;

    const startDate = new Date(user.startDate);
    const today = new Date();
    const daysSinceStart = differenceInDays(today, startDate);
    const daysSinceLastOff = daysSinceStart % settings.dayOffInterval;
    const daysUntilNext = settings.dayOffInterval - daysSinceLastOff;

    return addDays(today, daysUntilNext);
  };

  const getMandatoryDaysOff = () => {
    if (!user?.startDate) return [];

    const startDate = new Date(user.startDate);
    const today = new Date();
    const totalDays = differenceInDays(today, startDate);
    const mandatoryDays = [];

    for (let i = settings.dayOffInterval; i <= totalDays; i += settings.dayOffInterval) {
      mandatoryDays.push(addDays(startDate, i));
    }

    return mandatoryDays;
  };

  const isDateBlocked = (date: string) => {
    const dateObj = new Date(date);
    const mandatoryDays = getMandatoryDaysOff();

    // Check if it's a mandatory day off
    const isMandatoryOff = mandatoryDays.some(mandatoryDate =>
      format(mandatoryDate, 'yyyy-MM-dd') === date
    );

    // Check if there's an approved leave
    const hasApprovedLeave = leaves.some(leave =>
      leave.date === date && leave.approved
    );

    return isMandatoryOff || hasApprovedLeave;
  };

  const handleSubmitLeave = (e: React.FormEvent) => {
    e.preventDefault();

    const startDate = new Date(leaveStartDate);
    const endDate = new Date(leaveEndDate);

    if (startDate > endDate) {
      alert('Start date cannot be after end date');
      return;
    }

    const leaveDates = eachDayOfInterval({ start: startDate, end: endDate });

    leaveDates.forEach(date => {
      const leaveDateStr = format(date, 'yyyy-MM-dd');

      if (isDateBlocked(leaveDateStr)) {
        alert('Date ' + leaveDateStr + ' is already blocked or has an existing leave');
        return;
      }

      addLeave({
        type: leaveType,
        date: leaveDateStr,
        reason: leaveReason,
        document: leaveDocument?.name,
        approved: leaveType === 'mandatory' // Auto-approve mandatory leaves
      });
    });

    setShowLeaveForm(false);
    setLeaveReason('');
    setLeaveDocument(null);
  };

  const handleApproveLeave = (leaveId: string) => {
    updateLeave(leaveId, { approved: true });
    setModifyingLeaveId(null);
  };

  const handleRejectLeave = (leaveId: string) => {
    updateLeave(leaveId, { approved: false });
    setModifyingLeaveId(null);
  };

  const nextMandatoryOff = getNextMandatoryDayOff();
  const mandatoryDaysOff = getMandatoryDaysOff();
  const pendingLeaves = leaves.filter(leave => !leave.approved);
  const approvedLeaves = leaves.filter(leave => leave.approved);

  const getLeaveTypeIcon = (type: string) => {
    switch (type) {
      case 'sick': return <Heart className="w-4 h-4 text-red-600" />;
      case 'mandatory': return <Clock className="w-4 h-4 text-blue-600" />;
      case 'personal': return <User className="w-4 h-4 text-purple-600" />;
      default: return <Calendar className="w-4 h-4 text-gray-600" />;
    }
  };

  const getLeaveTypeColor = (type: string) => {
    switch (type) {
      case 'sick': return 'bg-red-100 text-red-800 border-red-200';
      case 'mandatory': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'personal': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Leave Management</h1>
            <p className="text-gray-600 mt-1">
              Manage your time off and track mandatory rest days
            </p>
          </div>

          <button
            onClick={() => setShowLeaveForm(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            <Plus className="w-4 h-4 mr-2" />
            Apply for Leave
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Next Mandatory Off</h3>
              <p className="text-lg font-bold text-gray-900">
                {nextMandatoryOff ? format(nextMandatoryOff, 'MMM dd, yyyy') : 'Not scheduled'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Pending Leaves</h3>
              <p className="text-2xl font-bold text-gray-900">{pendingLeaves.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Approved Leaves</h3>
              <p className="text-2xl font-bold text-gray-900">{approvedLeaves.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Mandatory Days Off Schedule */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Mandatory Rest Days Schedule</h2>
        <p className="text-gray-600 mb-4">
          Based on your {settings.dayOffInterval}-day interval setting, here are your scheduled mandatory rest days:
        </p>

        {mandatoryDaysOff.length === 0 ? (
          <p className="text-gray-500 italic">No mandatory days off scheduled yet</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {mandatoryDaysOff.map((date, index) => (
              <div
                key={index}
                className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-center"
              >
                <div className="text-sm font-medium text-blue-800">
                  Day {(index + 1) * settings.dayOffInterval}
                </div>
                <div className="text-xs text-blue-600">
                  {format(date, 'MMM dd, yyyy')}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Leave Applications */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Leave Applications</h2>

        {leaves.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No leave applications</h3>
            <p className="text-gray-600">Apply for leave when you need time off from your study schedule.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {leaves.map((leave) => (
              <div
                key={leave.id}
                className={
                  'border-2 rounded-lg p-4 flex items-center justify-between' +
                  (leave.approved
                    ? ' border-green-200 bg-green-50'
                    : ' border-yellow-200 bg-yellow-50')
                }
              >
                <div className="flex items-center space-x-3">
                  {getLeaveTypeIcon(leave.type)}
                  <div>
                    <h3 className="font-semibold text-gray-900 capitalize">
                      {leave.type} Leave
                    </h3>
                    <p className="text-sm text-gray-600">
                      {format(new Date(leave.date), 'EEEE, MMMM dd, yyyy')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  {leave.document && (
                    <div className="flex items-center text-sm text-gray-600">
                      <FileText className="w-4 h-4 mr-1" />
                      Document attached
                    </div>
                  )}

                  <span
                    className={
                      'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ' +
                      (leave.approved
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800')
                    }
                  >
                    {leave.approved ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Approved
                      </>
                    ) : (
                      <>
                        <Clock className="w-4 h-4 mr-1" />
                        Pending
                      </>
                    )}
                  </span>

                  {!leave.approved && (
                    <div className="space-x-2">
                      <button
                        onClick={() => handleApproveLeave(leave.id)}
                        className="px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 text-sm"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleRejectLeave(leave.id)}
                        className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 text-sm"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>

                {leave.reason && (
                  <div className="mt-3 p-3 bg-white rounded-lg">
                    <p className="text-sm text-gray-700">
                      <strong>Reason:</strong> {leave.reason}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Leave Application Form Modal */}
      {showLeaveForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Apply for Leave</h2>
              <button
                onClick={() => setShowLeaveForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmitLeave} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Leave Type
                </label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value as 'sick' | 'mandatory' | 'personal')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="sick">Sick Leave</option>
                  <option value="personal">Personal Leave</option>
                  <option value="mandatory">Mandatory Rest Day</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={leaveStartDate}
                    onChange={(e) => setLeaveStartDate(e.target.value)}
                    min={format(new Date(), 'yyyy-MM-dd')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={leaveEndDate}
                    onChange={(e) => setLeaveEndDate(e.target.value)}
                    min={format(new Date(), 'yyyy-MM-dd')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason
                </label>
                <textarea
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Explain the reason for your leave..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Supporting Document (Optional)
                </label>
                <label className="flex items-center justify-center w-full px-4 py-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 cursor-pointer transition-colors duration-200">
                  <div className="text-center">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">
                      {leaveDocument ? leaveDocument.name : 'Click to upload a file'}
                    </p>
                  </div>
                  <input
                    type="file"
                    onChange={(e) => setLeaveDocument(e.target.files?.[0] || null)}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  />
                </label>
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowLeaveForm(false)}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                >
                  Apply for Leave
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
