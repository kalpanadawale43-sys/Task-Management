import { generateId } from './helpers';

export const generateFakeData = (date: string) => {
  const sessions = [
    {
      id: generateId(),
      date: date,
      type: 'morning',
      totalDuration: 3600,
      status: 'completed',
      slots: [
        {
          id: generateId(),
          description: 'Focused work session',
          startTime: new Date(new Date(date).setHours(9, 0, 0)).toISOString(),
          endTime: new Date(new Date(date).setHours(10, 0, 0)).toISOString(),
          duration: 3600
        },
        {
          id: generateId(),
          description: 'Quick sync with team',
          startTime: new Date(new Date(date).setHours(10, 0, 0)).toISOString(),
          endTime: new Date(new Date(date).setHours(10, 30, 0)).toISOString(),
          duration: 1800
        }
      ]
    },
    {
      id: generateId(),
      date: date,
      type: 'afternoon',
      totalDuration: 5400,
      status: 'completed',
      slots: [
        {
          id: generateId(),
          description: 'Deep dive into project',
          startTime: new Date(new Date(date).setHours(14, 0, 0)).toISOString(),
          endTime: new Date(new Date(date).setHours(15, 30, 0)).toISOString(),
          duration: 5400
        }
      ]
    },
    {
      id: generateId(),
      date: date,
      type: 'evening',
      totalDuration: 1800,
      status: 'incomplete',
      slots: [
        {
          id: generateId(),
          description: 'Review and planning',
          startTime: new Date(new Date(date).setHours(17, 0, 0)).toISOString(),
          endTime: new Date(new Date(date).setHours(17, 30, 0)).toISOString(),
          duration: 1800
        }
      ]
    }
  ];

  const tasks = [
    {
      id: generateId(),
      date: date,
      title: 'Prepare presentation',
      description: 'Finalize slides for the client meeting',
      completed: true
    },
    {
      id: generateId(),
      date: date,
      title: 'Send follow-up emails',
      description: 'Contact potential clients',
      completed: false,
      incompletionReason: 'Not enough time'
    },
    {
      id: generateId(),
      date: date,
      title: 'Code review',
      description: 'Review code changes',
      completed: true
    }
  ];

  return { sessions, tasks };
};
