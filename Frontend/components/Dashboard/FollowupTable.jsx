'use client';

import { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { leadAPI } from '@/services/api';

export default function FollowupTable() {
  const [followups, setFollowups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchFollowups();
  }, []);

  const fetchFollowups = async () => {
    try {
      const response = await leadAPI.getDueFollowUps();
      setFollowups(response.data.data || []);
    } catch (error) {
      console.error('Error fetching followups:', error);
      // Fallback to dummy data if API fails
      setFollowups([
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
      ]);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = followups.filter(
    (item) =>
      item.leadName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.assignedTo?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status) => {
    const variants = {
      Pending: 'secondary',
      Completed: 'default',
      'In Progress': 'outline',
    };
    return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>;
  };

  if (loading) {
    return <div className="p-4">Loading followups...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Scheduled Followup</h3>
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
          {filteredData.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">{item.leadName}</TableCell>
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
    </div>
  );
}
