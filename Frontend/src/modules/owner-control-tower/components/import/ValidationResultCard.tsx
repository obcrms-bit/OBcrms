import type { ImportSectionValidation } from '../../types/owner-control.types';
import { getValidationTone } from '../../utils/owner-control.utils';
import OwnerStatusBadge from '../owner/OwnerStatusBadge';

export default function ValidationResultCard({
  section,
}: {
  section: ImportSectionValidation;
}) {
  const tone = getValidationTone(section.status);

  return (
    <div className="rounded-[1.35rem] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-semibold text-slate-950">{section.label}</p>
          <p className="mt-1 text-sm text-slate-500">{section.summary}</p>
        </div>
        <OwnerStatusBadge
          label={section.status}
          tone={
            tone === 'completed'
              ? 'success'
              : tone === 'pending'
                ? 'warning'
                : 'danger'
          }
        />
      </div>
      <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
        <span>{section.rowCount} rows</span>
        <span>{section.issues.filter((item) => item.severity === 'error').length} errors</span>
        <span>{section.issues.filter((item) => item.severity === 'warning').length} warnings</span>
      </div>
    </div>
  );
}
