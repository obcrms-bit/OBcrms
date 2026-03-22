'use client';

import { useMemo, useState } from 'react';
import { Download, RotateCcw } from 'lucide-react';
import { SectionCard, SectionHeader } from '@/components/app/design-system';
import type { ConsultancyRecord, ImportScenario } from '../../types/owner-control.types';
import { canFinalizeImport, groupImportIssues } from '../../utils/owner-control.utils';
import ImportSectionAccordion from './ImportSectionAccordion';
import ImportStepper from './ImportStepper';
import UploadDropzone from './UploadDropzone';
import ValidationResultCard from './ValidationResultCard';

const steps = [
  'Upload File',
  'Read Sections',
  'Validate Data',
  'Preview Consultancy Creation',
  'Confirm Import',
  'Result Screen',
];

export default function ImportWizard({
  scenarios,
  consultancies,
}: {
  scenarios: ImportScenario[];
  consultancies: ConsultancyRecord[];
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedScenarioId, setSelectedScenarioId] = useState(scenarios[0]?.id || '');
  const [selectedFileName, setSelectedFileName] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  const selectedScenario = useMemo(
    () => scenarios.find((item) => item.id === selectedScenarioId) || scenarios[0],
    [scenarios, selectedScenarioId]
  );

  const issueSummary = groupImportIssues(selectedScenario.sections);
  const canConfirm = canFinalizeImport(selectedScenario.sections);

  const handleSelectFile = (file: File) => {
    setSelectedFileName(file.name);
    setCurrentStep(1);
  };

  const handleDownloadTemplate = () => {
    const templateText = [
      'Section,Required Fields',
      'Company Info,companyName|country|ownerEmail|plan',
      'Branch / Office Setup,branchName|officeCode|manager|country',
      'Roles and Permission,roleName|scope|modules|branches',
      'Users,fullName|email|primaryBranch|role',
      'Automation,trigger|channel|enabled|owner',
    ].join('\n');

    const blob = new Blob([templateText], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'owner_consultancy_onboarding_template.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadReport = () => {
    const reportText = JSON.stringify(
      {
        file: selectedFileName || selectedScenario.sourceFileName,
        template: selectedScenario.templateName,
        sections: selectedScenario.sections,
      },
      null,
      2
    );
    const blob = new Blob([reportText], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'consultancy-import-report.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <ImportStepper currentStep={currentStep} steps={steps} />

      <SectionCard>
        <SectionHeader
          eyebrow="Import Center"
          title="Owner-controlled consultancy onboarding"
          description="Upload a spreadsheet-style onboarding file, validate every section, preview the target consultancy, and confirm import only when the data is safe."
        />
        <div className="mt-6 flex flex-wrap gap-2">
          {scenarios.map((scenario) => (
            <button
              key={scenario.id}
              type="button"
              onClick={() => setSelectedScenarioId(scenario.id)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                selectedScenarioId === scenario.id
                  ? 'bg-slate-900 text-white'
                  : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {scenario.name}
            </button>
          ))}
        </div>
      </SectionCard>

      {currentStep === 0 ? (
        <UploadDropzone
          fileName={selectedFileName}
          onSelectFile={handleSelectFile}
          onDownloadTemplate={handleDownloadTemplate}
        />
      ) : null}

      {currentStep === 1 ? (
        <SectionCard>
          <SectionHeader
            eyebrow="Read Sections"
            title="Expected sections detected"
            description={selectedScenario.description}
          />
          <div className="mt-6 grid gap-4 xl:grid-cols-3">
            {selectedScenario.sections.map((section) => (
              <ValidationResultCard key={section.key} section={section} />
            ))}
          </div>
          <div className="mt-6 flex justify-end">
            <button className="ds-button-primary" onClick={() => setCurrentStep(2)} type="button">
              Continue to validation
            </button>
          </div>
        </SectionCard>
      ) : null}

      {currentStep === 2 ? (
        <SectionCard>
          <SectionHeader
            eyebrow="Validate Data"
            title="Section-by-section validation"
            description={`Validation found ${issueSummary.errors} blocking errors and ${issueSummary.warnings} warnings.`}
          />
          <div className="mt-6">
            <ImportSectionAccordion sections={selectedScenario.sections} />
          </div>
          <div className="mt-6 flex flex-wrap justify-between gap-3">
            <button className="ds-button-secondary" onClick={() => setCurrentStep(1)} type="button">
              Back
            </button>
            <button
              className="ds-button-primary"
              onClick={() => setCurrentStep(3)}
              type="button"
            >
              Review preview
            </button>
          </div>
        </SectionCard>
      ) : null}

      {currentStep === 3 ? (
        <SectionCard>
          <SectionHeader
            eyebrow="Preview Consultancy Creation"
            title="Everything the import will create or configure"
            description="Review the owner-facing preview before anything is committed."
          />
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Object.entries(selectedScenario.preview).map(([key, value]) => (
              <div key={key} className="rounded-[1.35rem] border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {key.replace(/([A-Z])/g, ' $1')}
                </p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">{String(value)}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap justify-between gap-3">
            <button className="ds-button-secondary" onClick={() => setCurrentStep(2)} type="button">
              Back
            </button>
            <button className="ds-button-primary" onClick={() => setCurrentStep(4)} type="button">
              Proceed to confirm
            </button>
          </div>
        </SectionCard>
      ) : null}

      {currentStep === 4 ? (
        <SectionCard>
          <SectionHeader
            eyebrow="Confirm Import"
            title="Finalize consultancy onboarding"
            description="The owner can only finalize the import after all blocking validation issues are resolved."
          />
          <div className="mt-6 rounded-[1.6rem] border border-slate-200 bg-slate-50 p-5">
            <p className="font-semibold text-slate-950">
              Target consultancy: {selectedScenario.preview.companyName}
            </p>
            <p className="mt-2 text-sm text-slate-600">
              File: {selectedFileName || selectedScenario.sourceFileName} • Template:{' '}
              {selectedScenario.templateName}
            </p>
            <p className="mt-4 text-sm text-slate-600">
              This import will initialize branches, users, role mappings, partner network, workflow
              config, automations, service status records, and audit entries.
            </p>
          </div>
          {!canConfirm ? (
            <div className="mt-4 rounded-[1.35rem] border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              Confirmation is disabled because the selected scenario still contains blocking
              validation errors.
            </div>
          ) : null}
          <div className="mt-6 flex flex-wrap justify-between gap-3">
            <button className="ds-button-secondary" onClick={() => setCurrentStep(3)} type="button">
              Back
            </button>
            <button
              className="ds-button-primary"
              disabled={!canConfirm}
              onClick={() => {
                setConfirmed(true);
                setCurrentStep(5);
              }}
              type="button"
            >
              Confirm import
            </button>
          </div>
        </SectionCard>
      ) : null}

      {currentStep === 5 ? (
        <SectionCard>
          <SectionHeader
            eyebrow="Result Screen"
            title={confirmed ? 'Import completed successfully' : 'Import review ready'}
            description="The owner can download the report, reopen issues, or move directly into the consultancy drill-down."
          />
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-[1.35rem] border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
                Records Created
              </p>
              <p className="mt-2 text-2xl font-semibold text-emerald-900">
                {selectedScenario.preview.usersToCreate +
                  selectedScenario.preview.branchesToCreate +
                  selectedScenario.preview.rolesToCreate}
              </p>
            </div>
            <div className="rounded-[1.35rem] border border-amber-200 bg-amber-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-700">
                Records Skipped
              </p>
              <p className="mt-2 text-2xl font-semibold text-amber-900">
                {selectedScenario.scenario === 'warning' ? 2 : 0}
              </p>
            </div>
            <div className="rounded-[1.35rem] border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-700">
                Failed Records
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {selectedScenario.scenario === 'clean' ? 0 : selectedScenario.scenario === 'warning' ? 0 : 3}
              </p>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <button className="ds-button-secondary" onClick={handleDownloadReport} type="button">
              <Download className="h-4 w-4" />
              Download import report
            </button>
            <button className="ds-button-secondary" onClick={() => setCurrentStep(2)} type="button">
              Reopen import issues
            </button>
            <button className="ds-button-primary" onClick={() => setCurrentStep(0)} type="button">
              <RotateCcw className="h-4 w-4" />
              Fix and retry
            </button>
          </div>
          <div className="mt-6 rounded-[1.6rem] border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
            Portfolio context: {consultancies.length} consultancies are already supervised from the
            owner control tower, so new imports immediately inherit the same cross-tenant review
            and setup governance model.
          </div>
        </SectionCard>
      ) : null}
    </div>
  );
}
