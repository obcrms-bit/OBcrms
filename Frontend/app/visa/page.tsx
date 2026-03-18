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

interface VisaApplication {
  _id: string;
  visaId: string;
  student: {
    firstName: string;
    lastName: string;
    email: string;
  };
  destinationCountry: string;
  destinationCountryCode: string;
  flagEmoji: string;
  visaType: string;
  currentStage: string;
  status: string;
  counsellor?: {
    firstName: string;
    lastName: string;
  };
  riskAssessment?: {
    riskCategory: string;
    visaSuccessProbability: number;
  };
  createdAt: string;
}

export default function VisaPage() {
  const [applications, setApplications] = useState<VisaApplication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const response = await fetch('/api/visa-applications');
      const data = await response.json();
      if (data.success) {
        setApplications(data.data);
      }
    } catch (error) {
      console.error('Error fetching visa applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStageColor = (stage: string) => {
    const colors = {
      not_started: 'bg-gray-100 text-gray-800',
      checklist_generated: 'bg-blue-100 text-blue-800',
      documents_collecting: 'bg-yellow-100 text-yellow-800',
      documents_ready: 'bg-green-100 text-green-800',
      financial_review: 'bg-purple-100 text-purple-800',
      forms_completed: 'bg-indigo-100 text-indigo-800',
      appointment_booked: 'bg-orange-100 text-orange-800',
      biometrics_scheduled: 'bg-pink-100 text-pink-800',
      biometrics_done: 'bg-teal-100 text-teal-800',
      interview_scheduled: 'bg-cyan-100 text-cyan-800',
      interview_done: 'bg-emerald-100 text-emerald-800',
      submitted: 'bg-violet-100 text-violet-800',
      under_processing: 'bg-amber-100 text-amber-800',
      additional_docs_requested: 'bg-red-100 text-red-800',
      approved: 'bg-lime-100 text-lime-800',
      rejected: 'bg-rose-100 text-rose-800',
      appeal_in_progress: 'bg-orange-100 text-orange-800',
      pre_departure_ready: 'bg-sky-100 text-sky-800',
      completed: 'bg-emerald-100 text-emerald-800',
    };
    return colors[stage as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getRiskColor = (category: string) => {
    const colors = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      very_high: 'bg-red-100 text-red-800',
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
          <h2 className="text-3xl font-bold tracking-tight">
            Visa Applications
          </h2>
          <p className="text-muted-foreground">
            Manage visa application workflows
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
          <Link href="/visa/create">
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              New Application
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4">
        {applications.map((app) => (
          <Card key={app._id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{app.flagEmoji}</span>
                  <div>
                    <CardTitle className="text-lg">
                      {app.student.firstName} {app.student.lastName}
                    </CardTitle>
                    <CardDescription>{app.student.email}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={getStageColor(app.currentStage)}>
                    {app.currentStage.replace('_', ' ')}
                  </Badge>
                  {app.riskAssessment && (
                    <Badge
                      className={getRiskColor(app.riskAssessment.riskCategory)}
                    >
                      {app.riskAssessment.riskCategory}
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Visa ID</p>
                  <p className="font-medium">{app.visaId}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Country</p>
                  <p className="font-medium">{app.destinationCountry}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Type</p>
                  <p className="font-medium">{app.visaType}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Counsellor</p>
                  <p className="font-medium">
                    {app.counsellor
                      ? `${app.counsellor.firstName} ${app.counsellor.lastName}`
                      : 'Unassigned'}
                  </p>
                </div>
              </div>
              {app.riskAssessment && (
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      Success Probability
                    </span>
                    <span className="text-sm font-bold">
                      {app.riskAssessment.visaSuccessProbability}%
                    </span>
                  </div>
                </div>
              )}
              <div className="flex justify-between items-center mt-4">
                <div className="text-sm text-muted-foreground">
                  Created: {new Date(app.createdAt).toLocaleDateString()}
                </div>
                <div className="flex space-x-2">
                  <Link href={`/visa/${app._id}/checklist`}>
                    <Button variant="outline" size="sm">
                      Checklist
                    </Button>
                  </Link>
                  <Link href={`/visa/${app._id}`}>
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
