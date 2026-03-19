'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User, Calendar, Phone, ArrowRight } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Lead {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: string;
  leadScore: number;
  leadCategory: string;
  assignedCounsellor?: {
    firstName: string;
    lastName: string;
  };
  nextFollowUp?: Date;
}

const columns = [
  { id: 'new', title: 'New', color: 'bg-blue-100' },
  { id: 'contacted', title: 'Contacted', color: 'bg-yellow-100' },
  { id: 'qualified', title: 'Qualified', color: 'bg-green-100' },
  {
    id: 'counselling_scheduled',
    title: 'Counselling Scheduled',
    color: 'bg-purple-100',
  },
  { id: 'counselling_done', title: 'Counselling Done', color: 'bg-indigo-100' },
  {
    id: 'application_started',
    title: 'Application Started',
    color: 'bg-orange-100',
  },
  { id: 'documents_pending', title: 'Documents Pending', color: 'bg-red-100' },
  {
    id: 'application_submitted',
    title: 'Application Submitted',
    color: 'bg-pink-100',
  },
  { id: 'offer_received', title: 'Offer Received', color: 'bg-teal-100' },
  { id: 'visa_applied', title: 'Visa Applied', color: 'bg-cyan-100' },
  { id: 'enrolled', title: 'Enrolled', color: 'bg-emerald-100' },
  { id: 'lost', title: 'Lost', color: 'bg-gray-100' },
];

export default function PipelinePage() {
  const [leads, setLeads] = useState<Record<string, Lead[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      const response = await fetch('/api/leads');
      const data = await response.json();
      if (data.success) {
        const grouped = data.data.reduce(
          (acc: Record<string, Lead[]>, lead: Lead) => {
            const status = lead.status;
            if (!acc[status]) acc[status] = [];
            acc[status].push(lead);
            return acc;
          },
          {}
        );
        setLeads(grouped);
      }
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateLeadStatus = async (leadId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/leads/${leadId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        fetchLeads(); // Refresh the pipeline
      }
    } catch (error) {
      console.error('Error updating lead status:', error);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      hot: 'bg-red-100 text-red-800',
      warm: 'bg-yellow-100 text-yellow-800',
      cold: 'bg-blue-100 text-blue-800',
    };
    return (
      colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800'
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">Loading...</div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Lead Pipeline</h2>
          <p className="text-muted-foreground">
            View and manage leads through the pipeline stages
          </p>
        </div>
      </div>

      <div className="flex space-x-4 overflow-x-auto pb-4">
        {columns.map((column) => (
          <div key={column.id} className="flex-shrink-0 w-80">
            <Card>
              <CardHeader className={`rounded-t-lg ${column.color}`}>
                <CardTitle className="text-sm font-medium">
                  {column.title}
                </CardTitle>
                <div className="text-2xl font-bold">
                  {leads[column.id]?.length || 0}
                </div>
              </CardHeader>
              <CardContent className="p-2">
                <div className="space-y-2 min-h-[400px]">
                  {leads[column.id]?.map((lead) => (
                    <Card
                      key={lead._id}
                      className="p-3 hover:shadow-md transition-shadow"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-sm">
                            {lead.firstName} {lead.lastName}
                          </h4>
                          <Badge
                            className={getCategoryColor(lead.leadCategory)}
                          >
                            {lead.leadCategory}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {lead.email}
                        </p>
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center space-x-1">
                            <User className="h-3 w-3" />
                            <span>
                              {lead.assignedCounsellor
                                ? `${lead.assignedCounsellor.firstName}`
                                : 'Unassigned'}
                            </span>
                          </div>
                          <div className="font-medium">
                            Score: {lead.leadScore}
                          </div>
                        </div>
                        {lead.nextFollowUp && (
                          <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>
                              {new Date(
                                lead.nextFollowUp
                              ).toLocaleDateString()}
                            </span>
                          </div>
                        )}

                        {/* Status Update Dropdown */}
                        <div className="pt-2 border-t">
                          <Select
                            defaultValue={lead.status}
                            onValueChange={(newStatus) =>
                              updateLeadStatus(lead._id, newStatus)
                            }
                          >
                            <SelectTrigger className="h-7 text-xs">
                              <SelectValue placeholder="Update status" />
                            </SelectTrigger>
                            <SelectContent>
                              {columns.map((col) => (
                                <SelectItem key={col.id} value={col.id}>
                                  {col.title}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}
