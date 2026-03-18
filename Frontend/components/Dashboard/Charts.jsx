'use client';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const leadsByStageData = {
  labels: [
    'New',
    'Contacted',
    'Qualified',
    'Proposal',
    'Negotiation',
    'Closed',
  ],
  datasets: [
    {
      label: 'Leads',
      data: [400, 300, 200, 150, 100, 80],
      backgroundColor: '#3B82F6',
    },
  ],
};

const monthlyRevenueData = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
  datasets: [
    {
      label: 'Revenue',
      data: [45000, 52000, 48000, 61000, 55000, 67000],
      borderColor: '#10B981',
      backgroundColor: '#10B981',
    },
  ],
};

const visaSuccessData = {
  labels: ['Approved', 'Rejected', 'Pending'],
  datasets: [
    {
      data: [75, 15, 10],
      backgroundColor: ['#10B981', '#EF4444', '#F59E0B'],
    },
  ],
};

const counsellorConversionData = {
  labels: [
    'Sarah Johnson',
    'Mike Chen',
    'Lisa Wong',
    'David Kim',
    'Alex Rodriguez',
  ],
  datasets: [
    {
      label: 'Conversion %',
      data: [85, 78, 92, 71, 88],
      backgroundColor: '#8B5CF6',
    },
  ],
};

export default function Charts() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Leads by Stage</CardTitle>
        </CardHeader>
        <CardContent>
          <Bar data={leadsByStageData} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Monthly Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          <Line data={monthlyRevenueData} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Visa Success Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <Doughnut data={visaSuccessData} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Conversion per Counsellor</CardTitle>
        </CardHeader>
        <CardContent>
          <Bar data={counsellorConversionData} />
        </CardContent>
      </Card>
    </div>
  );
}
