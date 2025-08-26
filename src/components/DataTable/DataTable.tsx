import React, { useState, useRef } from 'react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Calendar, 
  Download, 
  Filter, 
  Clock, 
  FileText,
  BarChart3,
  CheckCircle,
  XCircle,
  Loader,
  Copy,
  Coffee
} from 'lucide-react';
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { formatTime, formatDuration } from '../../utils/helpers';
import { Session, Task, Leave, Slot } from '../../types/data';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function DataTable() {
  const { sessions, tasks, leaves, exportData } = useData();
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [filterMonth, setFilterMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [isLoadingPDF, setIsLoadingPDF] = useState(false);
  const [pdfLoadingMessage, setPdfLoadingMessage] = useState('');
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');
  const dailyReportRef = useRef<HTMLDivElement>(null);

  const getCorrectSlotDuration = (slot: Slot): number => {
    if (slot.status === 'completed' && slot.startTime && slot.endTime) {
      const startTime = new Date(slot.startTime).getTime();
      const endTime = new Date(slot.endTime).getTime();
      const pauseSeconds = slot.totalPauseDuration || 0;
      const durationMs = endTime - startTime - (pauseSeconds * 1000);
      if (durationMs > 0) {
        return durationMs / (1000 * 60);
      }
    }
    return slot.duration || 0;
  };

  const getCorrectSessionDuration = (session: Session): number => {
    return session.slots.reduce((acc, slot) => acc + getCorrectSlotDuration(slot), 0);
  };

  const getAllDates = () => {
    const sessionDates = sessions.map(s => s.date);
    const taskDates = tasks.map(t => t.date);
    const leaveDates = leaves.filter(l => l.approved).map(l => l.date);
    const allDates = [...new Set([...sessionDates, ...taskDates, ...leaveDates])].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    
    if (filterMonth) {
      const monthStart = startOfMonth(parseISO(filterMonth + '-01'));
      const monthEnd = endOfMonth(parseISO(filterMonth + '-01'));
      
      return allDates.filter(date => {
        const dateObj = parseISO(date);
        return isWithinInterval(dateObj, { start: monthStart, end: monthEnd });
      });
    }
    
    return allDates;
  };

  const getDateData = (date: string) => {
    const dateSessions = sessions.filter(s => s.date === date);
    const dateTasks = tasks.filter(t => t.date === date);
    const dateLeave = leaves.find(l => l.date === date && l.approved);
    return { sessions: dateSessions, tasks: dateTasks, leave: dateLeave };
  };

  const getDateStatus = (date: string) => {
    const { sessions: dateSessions, tasks: dateTasks, leave } = getDateData(date);
    
    if (leave) {
      return { status: 'leave', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' };
    }

    if (dateSessions.length === 0 && dateTasks.length === 0) {
      return { status: 'no-data', color: 'bg-gray-100 text-gray-500' };
    }
    const completedSessions = dateSessions.filter(s => s.status === 'completed').length;
    const completedTasks = dateTasks.filter(t => t.status === 'completed').length;
    const totalSessions = dateSessions.length;
    const totalTasks = dateTasks.length;
    const sessionRate = totalSessions > 0 ? completedSessions / totalSessions : 1;
    const taskRate = totalTasks > 0 ? completedTasks / totalTasks : 1;
    const overallRate = (sessionRate + taskRate) / 2;
    
    if (overallRate >= 0.8) return { status: 'excellent', color: 'bg-green-100 text-green-800 border-green-200' };
    if (overallRate >= 0.6) return { status: 'good', color: 'bg-blue-100 text-blue-800 border-blue-200' };
    if (overallRate >= 0.4) return { status: 'fair', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' };
    return { status: 'poor', color: 'bg-red-100 text-red-800 border-red-200' };
  };

  const generateCSV = (sessionsToExport: Session[]) => {
    const header = ['Session', 'Slot', 'Slot Description', 'Start Time', 'End Time', 'Pause (min)', 'Duration'];
    let csvRows = [header.join(',')];
    let overallTotalDuration = 0;
    let slotCounter = 0;

    sessionsToExport.forEach(session => {
      let sessionTotalDuration = 0;
      if (session.slots.length > 0) {
        session.slots.forEach(slot => {
          slotCounter++;
          const slotNumber = `SLOT - ${slotCounter}`;
          const startTime = slot.startTime ? formatTime(new Date(slot.startTime)) : '-';
          const endTime = slot.endTime ? formatTime(new Date(slot.endTime)) : '-';
          const pauseDurationInMinutes = ((slot.totalPauseDuration || 0) / 60).toFixed(2);
          
          const duration = getCorrectSlotDuration(slot);
          sessionTotalDuration += duration;
          
          const row = [
            `${session.type.toUpperCase()} SESSION (${session.date})`,
            slotNumber,
            `"${slot.description.replace(/"/g, '""')}"`,
            startTime,
            endTime,
            pauseDurationInMinutes,
            formatDuration(duration)
          ];
          csvRows.push(row.join(','));
        });

        const sessionTotalRow = ['', '', '', '', '', 'Total Session Duration:', formatDuration(sessionTotalDuration)];
        csvRows.push(sessionTotalRow.join(','));
        overallTotalDuration += sessionTotalDuration;
      }
    });

    if (sessionsToExport.length > 1 || (sessionsToExport.length === 1 && sessionsToExport[0].slots.length > 0)) {
        const overallTotalRow = ['', '', '', '', '', 'Overall Total Duration:', formatDuration(overallTotalDuration)];
        csvRows.push(overallTotalRow.join(','));
    }

    return csvRows.join('\n');
  };

  const downloadFile = (content: string, filename: string, contentType: string) => {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const newWindow = window.open(url, '_blank');
    if (!newWindow) {
      alert('Could not open file. Please disable your pop-up blocker.');
    }
    // We don't revoke the object URL because the new tab needs it.
    // This can lead to memory leaks if many files are opened, but it's a necessary trade-off for this environment.
  };

  const exportMonthAsCSV = () => {
    const datesInMonth = getAllDates().filter(date => {
      const monthYear = format(parseISO(date), 'yyyy-MM');
      return monthYear === filterMonth;
    }).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

    if (datesInMonth.length === 0) {
      alert(`No data available to export for ${format(parseISO(filterMonth + '-01'), 'MMMM yyyy')}.`);
      return;
    }

    const monthYearFormat = format(parseISO(filterMonth + '-01'), 'MM-yyyy');
    let csvString = `Monthly Report for ${format(parseISO(filterMonth + '-01'), 'MMMM yyyy')}\n\n`;

    datesInMonth.forEach(date => {
      const { sessions: dateSessions, tasks: dateTasks, leave: dateLeave } = getDateData(date);

      csvString += `"${'='.repeat(50)}"\n`;
      csvString += `Date,"${format(parseISO(date), 'EEEE, MMMM dd, yyyy')}"\n`;
      csvString += `"${'='.repeat(50)}"\n\n`;

      if (dateLeave) {
        csvString += '"--- LEAVE INFORMATION ---"\n';
        csvString += `Type,"${dateLeave.type.charAt(0).toUpperCase() + dateLeave.type.slice(1)} Day Off"\n`;
        csvString += `Reason,"${(dateLeave.reason || '').replace(/"/g, '""')}"\n`;
        if (dateSessions.length > 0) {
          csvString += `Note,"A session was recorded on this day off."\n`;
        }
        csvString += '\n';
      }

      if (dateSessions.length > 0) {
        csvString += '"--- SESSIONS ---"\n';
        csvString += generateCSV(dateSessions);
        csvString += '\n\n';
      } else if (!dateLeave) {
        csvString += '"--- NO SESSIONS FOR THIS DATE ---"\n\n';
      }

      if (dateTasks.length > 0) {
        csvString += '"--- TASKS ---"\n';
        const taskHeader = ['Status', 'Title', 'Description', 'Reason for Incompletion'];
        csvString += taskHeader.join(',') + '\n';
        dateTasks.forEach(task => {
          const status = task.status.charAt(0).toUpperCase() + task.status.slice(1);
          const title = `"${task.title.replace(/"/g, '""')}"`;
          const description = `"${(task.description || '').replace(/"/g, '""')}"`;
          const reason = `"${(task.incompletionReason || '').replace(/"/g, '""')}"`;
          const row = [status, title, description, reason];
          csvString += row.join(',') + '\n';
        });
        csvString += '\n';
      } else {
        csvString += '"--- NO TASKS FOR THIS DATE ---"\n\n';
      }
      csvString += '\n';
    });

    downloadFile(csvString, `taskmaster_monthly_report_${monthYearFormat}.csv`, 'text/csv;charset=utf-8;');
  };

  const exportVisibleDateAsCSV = () => {
    if (!selectedDate) {
      alert("Please select a date to export.");
      return;
    }

    const { sessions: sessionsToExport, tasks: tasksToExport, leave: dateLeave } = getDateData(selectedDate);

    if (sessionsToExport.length === 0 && tasksToExport.length === 0 && !dateLeave) {
      alert(`No data available to export for ${format(parseISO(selectedDate), 'MMMM dd, yyyy')}.`);
      return;
    }

    const formattedDate = format(parseISO(selectedDate), 'dd-MM-yyyy');
    let csvString = `Daily Report for ${format(parseISO(selectedDate), 'EEEE, MMMM dd, yyyy')}\n\n`;
    
    csvString += `"${'='.repeat(50)}"\n`;
    csvString += `Date,"${format(parseISO(selectedDate), 'EEEE, MMMM dd, yyyy')}"\n`;
    csvString += `"${'='.repeat(50)}"\n\n`;

    if (dateLeave) {
      csvString += '"--- LEAVE INFORMATION ---"\n';
      csvString += `Type,"${dateLeave.type.charAt(0).toUpperCase() + dateLeave.type.slice(1)} Day Off"\n`;
      csvString += `Reason,"${(dateLeave.reason || '').replace(/"/g, '""')}"\n`;
      if (sessionsToExport.length > 0) {
        csvString += `Note,"A session was recorded on this day off."\n`;
      }
      csvString += '\n';
    }

    if (sessionsToExport.length > 0) {
      csvString += '"--- SESSIONS ---"\n';
      csvString += generateCSV(sessionsToExport);
      csvString += '\n\n';
    } else if (!dateLeave) {
      csvString += '"--- NO SESSIONS FOR THIS DATE ---"\n\n';
    }

    if (tasksToExport.length > 0) {
      csvString += '"--- TASKS ---"\n';
      const taskHeader = ['Status', 'Title', 'Description', 'Reason for Incompletion'];
      csvString += taskHeader.join(',') + '\n';

      tasksToExport.forEach(task => {
        const status = task.status.charAt(0).toUpperCase() + task.status.slice(1);
        const title = `"${task.title.replace(/"/g, '""')}"`;
        const description = `"${(task.description || '').replace(/"/g, '""')}"`;
        const reason = `"${(task.incompletionReason || '').replace(/"/g, '""')}"`;
        
        const row = [status, title, description, reason];
        csvString += row.join(',') + '\n';
      });
      csvString += '\n';
    } else {
      csvString += '"--- NO TASKS FOR THIS DATE ---"\n\n';
    }

    downloadFile(csvString, `taskmaster_daily_report_${formattedDate}.csv`, 'text/csv;charset=utf-8;');
  };

  const exportVisibleDateAsPDF = async () => {
    if (!dailyReportRef.current || !selectedDate) {
      alert("Please select a date to export.");
      return;
    }

    setIsLoadingPDF(true);
    const formattedDate = format(parseISO(selectedDate), 'dd-MM-yyyy');
    setPdfLoadingMessage(`Generating PDF for ${formattedDate}...`);

    try {
      const canvas = await html2canvas(dailyReportRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgProps= pdf.getImageProperties(imgData);
      const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
        heightLeft -= pdfHeight;
      }
      
      // Save the PDF with proper filename
      pdf.save(`taskmaster_daily_report_${formattedDate}.pdf`);

    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. See console for details.");
    } finally {
      setIsLoadingPDF(false);
      setPdfLoadingMessage('');
    }
  };

  const exportMonthAsPDF = async () => {
    const datesToExport = getAllDates().filter(date => {
      const monthYear = format(parseISO(date), 'yyyy-MM');
      return monthYear === filterMonth;
    }).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

    if (datesToExport.length === 0) {
      const monthName = format(parseISO(filterMonth + '-01'), 'MMMM yyyy');
      alert(`No data available to export for ${monthName}.`);
      return;
    }

    setIsLoadingPDF(true);
    const originalSelectedDate = selectedDate;
    const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    const monthYearFormat = format(parseISO(filterMonth + '-01'), 'MM-yyyy');

    try {
      for (let i = 0; i < datesToExport.length; i++) {
        const date = datesToExport[i];
        setPdfLoadingMessage(`Generating page ${i + 1}/${datesToExport.length} for ${format(parseISO(date), 'dd-MM-yyyy')}...`);
        
        setSelectedDate(date);
        await new Promise(resolve => setTimeout(resolve, 200)); // Wait for re-render

        if (dailyReportRef.current) {
          const canvas = await html2canvas(dailyReportRef.current, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
          });

          if (i > 0) {
            pdf.addPage();
          }

          const imgData = canvas.toDataURL('image/png');
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = pdf.internal.pageSize.getHeight();
          const imgProps= pdf.getImageProperties(imgData);
          const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;
          let heightLeft = imgHeight;
          let position = 0;

          pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
          heightLeft -= pdfHeight;

          while (heightLeft >= 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
            heightLeft -= pdfHeight;
          }
        }
      }

      // Save the PDF with proper filename
      pdf.save(`taskmaster_monthly_report_${monthYearFormat}.pdf`);

    } catch (error) {
      console.error("Error generating monthly PDF:", error);
      alert("Failed to generate monthly PDF. See console for details.");
    } finally {
      setIsLoadingPDF(false);
      setPdfLoadingMessage('');
      setSelectedDate(originalSelectedDate);
    }
  };

  const copyVisibleDateToClipboard = async () => {
    if (!selectedDate) {
      alert("Please select a date to copy.");
      return;
    }

    const { sessions: dateSessions, tasks: dateTasks, leave: dateLeave } = getDateData(selectedDate);

    if (dateSessions.length === 0 && dateTasks.length === 0 && !dateLeave) {
      alert(`No data available to copy for ${format(parseISO(selectedDate), 'MMMM dd, yyyy')}.`);
      return;
    }

    let textToCopy = `Report for ${format(parseISO(selectedDate), 'EEEE, MMMM dd, yyyy')}\n\n`;
    
    if (dateLeave) {
      textToCopy += `--- DAY OFF ---\n`;
      textToCopy += `Type:\t${dateLeave.type.charAt(0).toUpperCase() + dateLeave.type.slice(1)} Day Off\n`;
      textToCopy += `Reason:\t${dateLeave.reason}\n`;
      if (dateSessions.length > 0) {
        textToCopy += `Note:\tA session was recorded on this day off.\n`;
      }
      textToCopy += `\n`;
    }

    let overallTotalDuration = 0;
    let slotCounter = 0;

    if (dateSessions.length > 0) {
      textToCopy += "--- SESSIONS ---\n";
      dateSessions.forEach(session => {
        textToCopy += `\n${session.type.toUpperCase()} SESSION\n`;
        const header = ['Slot', 'Description', 'Start', 'End', 'Pause (min)', 'Duration'];
        textToCopy += header.join('\t') + '\n';
        let sessionTotalDuration = 0;

        session.slots.forEach(slot => {
          slotCounter++;
          const duration = getCorrectSlotDuration(slot);
          sessionTotalDuration += duration;

          const row = [
            `SLOT - ${slotCounter}`,
            slot.description,
            slot.startTime ? formatTime(new Date(slot.startTime)) : '-',
            slot.endTime ? formatTime(new Date(slot.endTime)) : '-',
            ((slot.totalPauseDuration || 0) / 60).toFixed(2),
            formatDuration(duration)
          ];
          textToCopy += row.join('\t') + '\n';
        });
        
        overallTotalDuration += sessionTotalDuration;
        textToCopy += `\t\t\t\tTotal Session Duration:\t${formatDuration(sessionTotalDuration)}\n`;
      });
      textToCopy += `\nOverall Total Duration for ${format(parseISO(selectedDate), 'MMM dd')}:\t${formatDuration(overallTotalDuration)}\n`;
    } else if (!dateLeave) {
      textToCopy += "--- No sessions for this date ---\n";
    }

    textToCopy += "\n\n--- TASKS ---\n";
    if (dateTasks.length > 0) {
      dateTasks.forEach(task => {
        const status = `[${task.status === 'completed' ? 'x' : ' '}] ${task.status.charAt(0).toUpperCase() + task.status.slice(1)}`;
        textToCopy += `${status}\t${task.title}\n`;
        if (task.description) {
          textToCopy += `\t- Description: ${task.description}\n`;
        }
        if (task.incompletionReason) {
          textToCopy += `\t- Reason for Incompletion: ${task.incompletionReason}\n`;
        }
      });
    } else {
      textToCopy += "No tasks for this date\n";
    }

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopyStatus('copied');
      setTimeout(() => setCopyStatus('idle'), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
      alert('Failed to copy data to clipboard.');
    }
  };

  const allDates = getAllDates();

  return (
    <div className="relative space-y-8">
      {isLoadingPDF && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex flex-col items-center justify-center z-50">
          <Loader className="w-16 h-16 text-white animate-spin" />
          <p className="text-white text-lg mt-4">{pdfLoadingMessage}</p>
        </div>
      )}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Data Table</h1>
            <p className="text-gray-600 mt-1">View detailed session and task data by date</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <input
                type="month"
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={exportMonthAsPDF}
              className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200"
            >
              <FileText className="w-4 h-4 mr-2" />
              Export Month (PDF)
            </button>
            <button
              onClick={exportMonthAsCSV}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
            >
              <FileText className="w-4 h-4 mr-2" />
              Export Month (CSV)
            </button>
            <button
              onClick={exportData}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              <Download className="w-4 h-4 mr-2" />
              Export All (JSON)
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Date Overview</h2>
        {allDates.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No data available</h3>
            <p className="text-gray-600">Start using the app to see your data here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {allDates.map(date => {
              const { sessions: dateSessions, tasks: dateTasks, leave } = getDateData(date);
              const { color } = getDateStatus(date);
              const isSelected = selectedDate === date;
              
              return (
                <div
                  key={date}
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 hover:shadow-md ${
                    isSelected ? 'border-blue-500 bg-blue-50' : `border-gray-200 ${color}`
                  }`}
                  onClick={() => setSelectedDate(isSelected ? null : date)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">{format(parseISO(date), 'MMM dd')}</h3>
                    <div className="flex items-center space-x-2">
                      {leave && <Coffee className="w-4 h-4 text-indigo-600" title={`Leave: ${leave.type}`} />}
                      <span className="text-xs text-gray-500">{format(parseISO(date), 'EEE')}</span>
                    </div>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Sessions:</span>
                      <span className="font-medium">{dateSessions.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Tasks:</span>
                      <span className="font-medium">{dateTasks.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Hours:</span>
                      <span className="font-medium">{formatDuration(dateSessions.reduce((total, s) => total + getCorrectSessionDuration(s), 0))}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedDate && (
        <div className="bg-white rounded-xl shadow-sm p-6" ref={dailyReportRef}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">{format(parseISO(selectedDate), 'EEEE, MMMM dd, yyyy')}</h2>
            <div className="flex space-x-2">
              <button
                onClick={copyVisibleDateToClipboard}
                className="flex items-center px-3 py-2 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors duration-200"
              >
                <Copy className="w-4 h-4 mr-1" />
                {copyStatus === 'copied' ? 'Copied!' : 'Copy'}
              </button>
              <button
                onClick={exportVisibleDateAsCSV}
                className="flex items-center px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors duration-200"
              >
                <FileText className="w-4 h-4 mr-1" />
                Export CSV
              </button>
              <button
                onClick={exportVisibleDateAsPDF}
                className="flex items-center px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                <FileText className="w-4 h-4 mr-1" />
                Export PDF
              </button>
            </div>
          </div>

          {(() => {
            const { sessions: dateSessions, tasks: dateTasks, leave: dateLeave } = getDateData(selectedDate);
            let overallTotalDuration = 0;
            let slotCounter = 0;

            dateSessions.forEach(session => {
              overallTotalDuration += getCorrectSessionDuration(session);
            });

            return (
              <div className="space-y-6">
                {dateLeave && (
                  <div className="mb-4 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                    <h3 className="text-md font-semibold text-indigo-800 capitalize flex items-center">
                      <Coffee className="w-5 h-5 mr-2" />
                      {dateLeave.type} Day Off
                    </h3>
                    <p className="text-sm text-indigo-700 mt-1"><strong>Reason:</strong> {dateLeave.reason}</p>
                    {dateSessions.length > 0 && (
                      <p className="text-sm text-amber-800 mt-2 p-2 bg-amber-100 border border-amber-200 rounded">
                        <strong>Note:</strong> A session was recorded on this day off.
                      </p>
                    )}
                  </div>
                )}

                {dateSessions.length > 0 ? dateSessions.map(session => {
                  let sessionTotalDuration = 0;
                  return (
                    <div key={session.id}>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <Clock className="w-5 h-5 mr-2 text-blue-600" />
                        {session.type.toUpperCase()} SESSION
                      </h3>
                      <div className="overflow-x-auto">
                        <table className="min-w-full leading-normal">
                          <thead>
                            <tr>
                              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Slot</th>
                              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Description</th>
                              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Start</th>
                              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">End</th>
                              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Pause (min)</th>
                              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">DURATION (HH:MM:SS)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {session.slots.map(slot => {
                              slotCounter++;
                              const duration = getCorrectSlotDuration(slot);
                              sessionTotalDuration += duration;
                              return (
                                <tr key={slot.id}>
                                  <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">SLOT - {slotCounter}</td>
                                  <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">{slot.description}</td>
                                  <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">{slot.startTime ? formatTime(new Date(slot.startTime)) : '-'}</td>
                                  <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">{slot.endTime ? formatTime(new Date(slot.endTime)) : '-'}</td>
                                  <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">{((slot.totalPauseDuration || 0) / 60).toFixed(2)}</td>
                                  <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">{formatDuration(duration)}</td>
                                </tr>
                              );
                            })}
                            <tr className="bg-gray-100 font-semibold">
                              <td colSpan={5} className="px-5 py-3 text-right">Total Session Duration:</td>
                              <td className="px-5 py-3">{formatDuration(sessionTotalDuration)}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                }) : <p className="text-gray-500 italic">{dateLeave ? `No sessions recorded (${dateLeave.type} day off).` : 'No sessions for this date'}</p>}
                
                {dateSessions.length > 0 && (
                  <div className="mt-6 pt-4 border-t-2 border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Overall Total Duration for {format(parseISO(selectedDate), 'MMM dd')}</h3>
                    <p className="text-gray-600 text-xl font-bold">{formatDuration(overallTotalDuration)}</p>
                  </div>
                )}

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center mt-6">
                    <BarChart3 className="w-5 h-5 mr-2 text-green-600" />Tasks ({dateTasks.length})
                  </h3>
                  {dateTasks.length === 0 ? <p className="text-gray-500 italic">No tasks for this date</p> : (
                    <div className="space-y-3">
                      {dateTasks.map(task => (
                        <div key={task.id} className={`border rounded-lg p-4 ${task.status === 'completed' ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0 mt-1">{task.status === 'completed' ? <CheckCircle className="w-5 h-5 text-green-600" /> : <XCircle className="w-5 h-5 text-red-600" />}</div>
                            <div className="flex-1">
                              <h4 className={`font-medium ${task.status === 'completed' ? 'text-green-800 line-through' : 'text-gray-900'}`}>{task.title}</h4>
                              {task.description && <p className={`text-sm mt-1 ${task.status === 'completed' ? 'text-green-600' : 'text-gray-600'}`}>{task.description}</p>}
                              {task.incompletionReason && <div className="mt-2 p-2 bg-red-100 border border-red-200 rounded"><p className="text-sm text-red-800"><strong>Reason:</strong> {task.incompletionReason}</p></div>}
                            </div>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${task.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{task.status === 'completed' ? 'Completed' : 'Incomplete'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
