'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Filter } from 'lucide-react';
import Link from 'next/link';

interface Lead {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: string;
  leadScore: number;
  leadCategory: string;
  source: string;
  assignedCounsellor?: {
    firstName: string;
    lastName: string;
  };
  nextFollowUp?: Date;
  createdAt: string;
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      const response = await fetch('/api/leads');
      const data = await response.json();
      if (data.success) {
        setLeads(data.data);
      }
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      new: 'bg-blue-100 text-blue-800',
      contacted: 'bg-yellow-100 text-yellow-800',
      qualified: 'bg-green-100 text-green-800',
      counselling_scheduled: 'bg-purple-100 text-purple-800',
      counselling_done: 'bg-indigo-100 text-indigo-800',
      application_started: 'bg-orange-100 text-orange-800',
      documents_pending: 'bg-red-100 text-red-800',
      application_submitted: 'bg-pink-100 text-pink-800',
      offer_received: 'bg-teal-100 text-teal-800',
      visa_applied: 'bg-cyan-100 text-cyan-800',
      enrolled: 'bg-emerald-100 text-emerald-800',
      lost: 'bg-gray-100 text-gray-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
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
          <h2 className="text-3xl font-bold tracking-tight">Leads</h2>
          <p className="text-muted-foreground">
            Manage and track your leads pipeline
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          <Button variant="outline" size="sm">
            <Search className="mr-2 h-4 w-4" />
            Search
          </Button>
          <Link href="/leads/create">
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Lead
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4">
        {leads.map((lead) => (
          <Card key={lead._id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">
                    {lead.firstName} {lead.lastName}
                  </CardTitle>
                  <CardDescription>{lead.email}</CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={getStatusColor(lead.status)}>
                    {lead.status.replace('_', ' ')}
                  </Badge>
                  <Badge className={getCategoryColor(lead.leadCategory)}>
                    {lead.leadCategory}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Phone</p>
                  <p className="font-medium">{lead.phone}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Source</p>
                  <p className="font-medium">{lead.source}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Score</p>
                  <p className="font-medium">{lead.leadScore}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Counsellor</p>
                  <p className="font-medium">
                    {lead.assignedCounsellor
                      ? `${lead.assignedCounsellor.firstName} ${lead.assignedCounsellor.lastName}`
                      : 'Unassigned'}
                  </p>
                </div>
              </div>
              <div className="flex justify-between items-center mt-4">
                <div className="text-sm text-muted-foreground">
                  Created: {new Date(lead.createdAt).toLocaleDateString()}
                  {lead.nextFollowUp && (
                    <span className="ml-4">
                      Next Follow-up:{' '}
                      {new Date(lead.nextFollowUp).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <Link href={`/leads/${lead._id}`}>
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
