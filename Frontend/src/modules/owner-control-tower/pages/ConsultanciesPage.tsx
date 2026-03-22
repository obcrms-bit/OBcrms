'use client';

import { useMemo, useState } from 'react';
import { SectionCard, SectionHeader } from '@/components/app/design-system';
import type { ConsultancyRecord } from '../types/owner-control.types';
import {
  defaultOwnerFilters,
  filterConsultancies,
} from '../utils/owner-control.utils';
import CompletionProgressCard from '../components/owner/CompletionProgressCard';
import ConsultancySetupChecklist from '../components/owner/ConsultancySetupChecklist';
import OwnerCommandBar from '../components/owner/OwnerCommandBar';
import ServiceStatusWidget from '../components/owner/ServiceStatusWidget';
import ConsultancyPortfolioTable from '../components/tables/ConsultancyPortfolioTable';

export default function ConsultanciesPage({
  ownerName,
  ownerEmail,
  notifications,
  countries,
  consultancies: seedConsultancies,
}: {
  ownerName: string;
  ownerEmail: string;
  notifications: number;
  countries: string[];
  consultancies: ConsultancyRecord[];
}) {
  const [filters, setFilters] = useState(defaultOwnerFilters);
  const [consultancies, setConsultancies] = useState(seedConsultancies);
  const filteredConsultancies = useMemo(
    () => filterConsultancies(consultancies, filters),
    [consultancies, filters]
  );
  const [selectedId, setSelectedId] = useState(filteredConsultancies[0]?.id || consultancies[0]?.id || '');

  const selectedConsultancy =
    filteredConsultancies.find((item) => item.id === selectedId) ||
    consultancies.find((item) => item.id === selectedId) ||
    filteredConsultancies[0] ||
    consultancies[0];

  const handleToggleStatus = (id: string) => {
    setConsultancies((current) =>
      current.map((item) =>
        item.id === id
          ? { ...item, status: item.status === 'suspended' ? 'active' : 'suspended' }
          : item
      )
    );
  };

  return (
    <div className="space-y-8">
      <OwnerCommandBar
        ownerName={ownerName}
        ownerEmail={ownerEmail}
        notifications={notifications}
        consultancies={consultancies}
        countries={countries}
        filters={filters}
        onFiltersChange={setFilters}
      />

      <ConsultancyPortfolioTable
        consultancies={filteredConsultancies}
        onToggleStatus={(id) => {
          setSelectedId(id);
          handleToggleStatus(id);
        }}
      />

      {selectedConsultancy ? (
        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="space-y-4">
            <CompletionProgressCard
              name={selectedConsultancy.name}
              completion={selectedConsultancy.setupCompletion}
              sections={selectedConsultancy.setupSections}
            />
            <ServiceStatusWidget items={selectedConsultancy.services} />
          </div>
          <div className="space-y-4">
            <SectionCard>
              <SectionHeader
                eyebrow="Selected Consultancy"
                title={selectedConsultancy.name}
                description="Review setup sections, blocked items, and service ownership while keeping the full portfolio table in view."
              />
            </SectionCard>
            <ConsultancySetupChecklist sections={selectedConsultancy.setupSections} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
