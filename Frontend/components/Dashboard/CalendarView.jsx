'use client';

import { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function CalendarView() {
  const [view, setView] = useState('dayGridMonth');

  const events = [
    {
      id: '1',
      title: 'Followup with John',
      start: '2024-03-18T10:00:00',
      backgroundColor: '#3B82F6',
      borderColor: '#3B82F6',
    },
    {
      id: '2',
      title: 'Interview - Maria',
      start: '2024-03-19T14:30:00',
      backgroundColor: '#10B981',
      borderColor: '#10B981',
    },
    {
      id: '3',
      title: 'Visa Appointment',
      start: '2024-03-20T09:00:00',
      backgroundColor: '#F59E0B',
      borderColor: '#F59E0B',
    },
  ];

  const handleViewChange = (newView) => {
    setView(newView);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Calendar</CardTitle>
          <div className="flex space-x-2">
            <Button
              variant={view === 'dayGridMonth' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleViewChange('dayGridMonth')}
            >
              Month
            </Button>
            <Button
              variant={view === 'timeGridWeek' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleViewChange('timeGridWeek')}
            >
              Week
            </Button>
            <Button
              variant={view === 'timeGridDay' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleViewChange('timeGridDay')}
            >
              Day
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="calendar-container">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView={view}
            headerToolbar={false}
            events={events}
            height="400px"
            eventClick={(info) => {
              alert(`Event: ${info.event.title}`);
            }}
            dateClick={(info) => {
              alert(`Clicked on: ${info.dateStr}`);
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
