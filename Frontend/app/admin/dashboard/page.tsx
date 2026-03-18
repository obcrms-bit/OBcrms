'use client';

import { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Doughnut,
} from 'recharts';
import {
  Users,
  FileText,
  Phone,
  Calendar,
  Clock,
  Bell,
  Search,
  Filter,
  MoreHorizontal,
  Menu,
  Sun,
  Moon,
  User,
  Settings,
  LogOut,
  ChevronDown,
  Eye,
  Edit,
  Trash2,
} from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// Dummy data
const kpiData = [
  { title: 'Employees', value: '45', icon: Users, change: '+2' },
  { title: 'Leads', value: '1,234', icon: FileText, change: '+12%' },
  { title: 'Students', value: '856', icon: Users, change: '+8%' },
  { title: 'Applications', value: '342', icon: FileText, change: '+15%' },
  { title: 'Call Logs', value: '2,156', icon: Phone, change: '+23%' },
  { title: 'Classes', value: '28', icon: Calendar, change: '+1' },
];

const followupData = [
  {
    id: 1,
    leadName: 'John Smith',
    assignedTo: 'Sarah Johnson',
    followupDate: '2024-03-18',
    followupTime: '10:00 AM',
    status: 'Pending',
  },
  {
    id: 2,
    leadName: 'Maria Garcia',
    assignedTo: 'Mike Chen',
    followupDate: '2024-03-18',
    followupTime: '2:30 PM',
    status: 'Completed',
  },
  {
    id: 3,
    leadName: 'Ahmed Hassan',
    assignedTo: 'Lisa Wong',
    followupDate: '2024-03-19',
    followupTime: '11:15 AM',
    status: 'Pending',
  },
  {
    id: 4,
    leadName: 'Emma Davis',
    assignedTo: 'David Kim',
    followupDate: '2024-03-19',
    followupTime: '4:00 PM',
    status: 'In Progress',
  },
  {
    id: 5,
    leadName: 'Raj Patel',
    assignedTo: 'Sarah Johnson',
    followupDate: '2024-03-20',
    followupTime: '9:30 AM',
    status: 'Pending',
  },
];

const leadsByStageData = [
  { name: 'New', value: 400 },
  { name: 'Contacted', value: 300 },
  { name: 'Qualified', value: 200 },
  { name: 'Proposal', value: 150 },
  { name: 'Negotiation', value: 100 },
  { name: 'Closed', value: 80 },
];

const monthlyRevenueData = [
  { month: 'Jan', revenue: 45000 },
  { month: 'Feb', revenue: 52000 },
  { month: 'Mar', revenue: 48000 },
  { month: 'Apr', revenue: 61000 },
  { month: 'May', revenue: 55000 },
  { month: 'Jun', revenue: 67000 },
];

const visaSuccessData = [
  { name: 'Approved', value: 75, color: '#10B981' },
  { name: 'Rejected', value: 15, color: '#EF4444' },
  { name: 'Pending', value: 10, color: '#F59E0B' },
];

const counsellorConversionData = [
  { name: 'Sarah Johnson', conversion: 85 },
  { name: 'Mike Chen', conversion: 78 },
  { name: 'Lisa Wong', conversion: 92 },
  { name: 'David Kim', conversion: 71 },
  { name: 'Alex Rodriguez', conversion: 88 },
];

const sidebarItems = [
  { name: 'Dashboard', icon: BarChart, active: true },
  { name: 'Call Management', icon: Phone },
  { name: 'Scheduled Followup', icon: Calendar },
  { name: 'Leads / Registrations', icon: Users },
  { name: 'Students', icon: Users },
  { name: 'Agents', icon: User },
  { name: 'Partners', icon: Users },
  { name: 'Universities', icon: FileText },
  { name: 'Applications', icon: FileText },
  { name: 'Offer Letter', icon: FileText },
  { name: 'Visa', icon: FileText },
  { name: 'Invoice', icon: FileText },
  { name: 'Commission', icon: FileText },
  { name: 'Calendar', icon: Calendar },
  { name: 'Tasks', icon: FileText },
  { name: 'Reminder', icon: Bell },
  { name: 'Reports', icon: BarChart },
  { name: 'Highlights', icon: Eye },
  { name: 'Attendance', icon: Clock },
  { name: 'Leave', icon: Calendar },
  { name: 'Settings', icon: Settings },
];

export default function AdminDashboard() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('Main Branch');

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const filteredFollowups = followupData.filter(
    (item) =>
      item.leadName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.assignedTo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const variants = {
      Pending: 'secondary',
      Completed: 'default',
      'In Progress': 'outline',
    } as const;
    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status}
      </Badge>
    );
  };

  return (
    <div
      className={`min-h-screen bg-gray-50 ${darkMode ? 'dark bg-gray-900' : ''}`}
    >
      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 z-40 h-screen transition-all duration-300 ${
          sidebarCollapsed ? 'w-16' : 'w-64'
        } bg-white shadow-lg`}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between p-4 border-b">
            {!sidebarCollapsed && (
              <h2 className="text-xl font-bold">TrustEdu</h2>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
          <nav className="flex-1 p-4 space-y-2">
            {sidebarItems.map((item) => (
              <Button
                key={item.name}
                variant={item.active ? 'default' : 'ghost'}
                className={`w-full justify-start ${sidebarCollapsed ? 'px-2' : ''}`}
              >
                <item.icon className="h-5 w-5 mr-3" />
                {!sidebarCollapsed && item.name}
              </Button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div
        className={`transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}
      >
        {/* Header */}
        <header className="bg-white shadow-sm border-b p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold">Good Morning, Admin</h1>
              <div className="text-sm text-gray-600">
                {currentTime.toLocaleTimeString()} IST
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Main Branch">Main Branch</SelectItem>
                  <SelectItem value="Branch 1">Branch 1</SelectItem>
                  <SelectItem value="Branch 2">Branch 2</SelectItem>
                </SelectContent>
              </Select>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center space-x-2"
                  >
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-white" />
                    </div>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDarkMode(!darkMode)}
              >
                {darkMode ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-6">
            {kpiData.map((kpi) => (
              <Card key={kpi.title}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">{kpi.title}</p>
                      <p className="text-2xl font-bold">{kpi.value}</p>
                      <p className="text-xs text-green-600">{kpi.change}</p>
                    </div>
                    <kpi.icon className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </header>

        {/* Main Dashboard Content */}
        <main className="p-6 space-y-6">
          {/* Scheduled Followup Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Scheduled Followup</CardTitle>
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search followups..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                  <Button variant="outline">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                  <Button variant="outline">Reset</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lead Name</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>FollowUp Date</TableHead>
                    <TableHead>FollowUp Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFollowups.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        {item.leadName}
                      </TableCell>
                      <TableCell>{item.assignedTo}</TableCell>
                      <TableCell>{item.followupDate}</TableCell>
                      <TableCell>{item.followupTime}</TableCell>
                      <TableCell>{getStatusBadge(item.status)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Leads by Stage</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={leadsByStageData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Monthly Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyRevenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#10B981"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Visa Success Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={visaSuccessData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {visaSuccessData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Conversion per Counsellor</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={counsellorConversionData} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={100} />
                    <Tooltip />
                    <Bar dataKey="conversion" fill="#8B5CF6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Panels Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Reminders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Bell className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm">Call John at 3 PM</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Bell className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm">Meeting with Sarah</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Bell className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm">Submit report</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tasks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded" />
                    <span className="text-sm">Review applications</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded" />
                    <span className="text-sm">Update student records</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded" checked />
                    <span className="text-sm line-through">Send emails</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Upcoming Birthdays</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-sm">Sarah Johnson - Mar 25</div>
                  <div className="text-sm">Mike Chen - Mar 28</div>
                  <div className="text-sm">Lisa Wong - Apr 2</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">On Leave Today</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-sm">David Kim</div>
                  <div className="text-sm">Alex Rodriguez</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Calendar Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Calendar</CardTitle>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    Month
                  </Button>
                  <Button variant="outline" size="sm">
                    Week
                  </Button>
                  <Button variant="outline" size="sm">
                    Day
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                <p className="text-gray-500">
                  Calendar component would go here
                </p>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
