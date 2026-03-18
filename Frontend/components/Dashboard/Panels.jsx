'use client';

import { Bell, CheckSquare, Calendar, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const panelsData = {
  reminders: [
    { text: 'Call John at 3 PM', urgent: true },
    { text: 'Meeting with Sarah', urgent: false },
    { text: 'Submit report', urgent: false },
  ],
  tasks: [
    { text: 'Review applications', completed: false },
    { text: 'Update student records', completed: false },
    { text: 'Send emails', completed: true },
  ],
  birthdays: [
    'Sarah Johnson - Mar 25',
    'Mike Chen - Mar 28',
    'Lisa Wong - Apr 2',
  ],
  onLeave: ['David Kim', 'Alex Rodriguez'],
  anniversaries: ['John Smith - 2 years', 'Maria Garcia - 1 year'],
};

export default function Panels() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Bell className="h-5 w-5 mr-2" />
            Reminders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {panelsData.reminders.map((reminder, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Bell
                  className={`h-4 w-4 ${reminder.urgent ? 'text-red-500' : 'text-yellow-500'}`}
                />
                <span className="text-sm">{reminder.text}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <CheckSquare className="h-5 w-5 mr-2" />
            Tasks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {panelsData.tasks.map((task, index) => (
              <div key={index} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={task.completed}
                  readOnly
                  className="rounded"
                />
                <span
                  className={`text-sm ${task.completed ? 'line-through text-gray-500' : ''}`}
                >
                  {task.text}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Birthdays
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {panelsData.birthdays.map((birthday, index) => (
              <div key={index} className="text-sm">
                {birthday}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Users className="h-5 w-5 mr-2" />
            On Leave
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {panelsData.onLeave.map((person, index) => (
              <div key={index} className="text-sm">
                {person}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Anniversaries
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {panelsData.anniversaries.map((anniversary, index) => (
              <div key={index} className="text-sm">
                {anniversary}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
