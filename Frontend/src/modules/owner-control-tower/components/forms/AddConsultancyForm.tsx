'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SectionCard, SectionHeader } from '@/components/app/design-system';
import type { ConsultancyRecord } from '../../types/owner-control.types';

export default function AddConsultancyForm({
  consultancies,
}: {
  consultancies: ConsultancyRecord[];
}) {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: '',
    country: '',
    headOffice: '',
    ownerEmail: '',
    plan: 'Growth',
    onboardingMode: 'manual',
    cloneFrom: 'none',
  });

  const selectedClone = useMemo(
    () => consultancies.find((item) => item.id === form.cloneFrom),
    [consultancies, form.cloneFrom]
  );

  return (
    <SectionCard>
      <SectionHeader
        eyebrow="Add Consultancy"
        title="Launch a new consultancy from the owner layer"
        description="Create manually or start from an existing consultancy template so the business can go live faster with fewer setup gaps."
      />
      <div className="mt-6 grid gap-5 xl:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-semibold text-slate-700">Consultancy name</span>
          <Input
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            className="h-12 rounded-2xl"
            placeholder="Atlas Horizon Education"
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-semibold text-slate-700">Country</span>
          <Input
            value={form.country}
            onChange={(event) => setForm((current) => ({ ...current, country: event.target.value }))}
            className="h-12 rounded-2xl"
            placeholder="United Kingdom"
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-semibold text-slate-700">Head office</span>
          <Input
            value={form.headOffice}
            onChange={(event) => setForm((current) => ({ ...current, headOffice: event.target.value }))}
            className="h-12 rounded-2xl"
            placeholder="London Central Office"
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-semibold text-slate-700">Owner or admin email</span>
          <Input
            value={form.ownerEmail}
            onChange={(event) => setForm((current) => ({ ...current, ownerEmail: event.target.value }))}
            className="h-12 rounded-2xl"
            placeholder="admin@consultancy.com"
          />
        </label>
        <div className="space-y-2">
          <span className="text-sm font-semibold text-slate-700">Subscription plan</span>
          <Select
            value={form.plan}
            onValueChange={(value) => setForm((current) => ({ ...current, plan: value }))}
          >
            <SelectTrigger className="h-12 rounded-2xl">
              <SelectValue placeholder="Plan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Launch">Launch</SelectItem>
              <SelectItem value="Growth">Growth</SelectItem>
              <SelectItem value="Scale">Scale</SelectItem>
              <SelectItem value="Enterprise">Enterprise</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <span className="text-sm font-semibold text-slate-700">Onboarding mode</span>
          <Select
            value={form.onboardingMode}
            onValueChange={(value) =>
              setForm((current) => ({ ...current, onboardingMode: value }))
            }
          >
            <SelectTrigger className="h-12 rounded-2xl">
              <SelectValue placeholder="Mode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="manual">Manual setup</SelectItem>
              <SelectItem value="import">File import</SelectItem>
              <SelectItem value="hybrid">Hybrid launch</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2 xl:col-span-2">
          <span className="text-sm font-semibold text-slate-700">Clone setup from existing consultancy</span>
          <Select
            value={form.cloneFrom}
            onValueChange={(value) => setForm((current) => ({ ...current, cloneFrom: value }))}
          >
            <SelectTrigger className="h-12 rounded-2xl">
              <SelectValue placeholder="Select a consultancy blueprint" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Start from scratch</SelectItem>
              {consultancies.map((consultancy) => (
                <SelectItem key={consultancy.id} value={consultancy.id}>
                  {consultancy.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedClone ? (
            <div className="rounded-[1.4rem] border border-teal-100 bg-teal-50/80 p-4 text-sm text-teal-700">
              {selectedClone.name} will contribute its role matrix, workflow structure, and service
              checklist as the launch baseline.
            </div>
          ) : null}
        </div>
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <Button
          className="rounded-2xl"
          onClick={() => setSubmitted(true)}
          type="button"
        >
          Create consultancy draft
        </Button>
        <Button asChild variant="outline" className="rounded-2xl">
          <a href="/owner-control-tower/imports/new">Switch to import workflow</a>
        </Button>
      </div>
      {submitted ? (
        <div className="mt-6 rounded-[1.6rem] border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-700">
          Consultancy draft prepared for <strong>{form.name || 'new consultancy'}</strong>. Next,
          assign branches, apply the {form.plan} plan, and continue with the owner-controlled setup
          checklist.
        </div>
      ) : null}
    </SectionCard>
  );
}
