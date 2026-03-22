'use client';

import { SectionCard, SectionHeader } from '@/components/app/design-system';

type FunnelAutomationBuilderProps = {
  stages: any[];
  automations: any[];
  editingAutomation: any;
  setEditingAutomation: (updater: any) => void;
  onSave: () => Promise<void> | void;
  saving?: boolean;
};

export default function FunnelAutomationBuilder({
  stages,
  automations,
  editingAutomation,
  setEditingAutomation,
  onSave,
  saving = false,
}: FunnelAutomationBuilderProps) {
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
      <SectionCard>
        <SectionHeader
          eyebrow="Funnel Automations"
          title="Trigger operational actions from stage movement"
          description="Use stage entry rules to assign users, create reminders, escalate SLA risk, and notify operators."
        />
        <div className="mt-6 space-y-4">
          {automations.length ? (
            automations.map((automation) => (
              <div
                key={automation._id}
                className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-slate-900">{automation.name}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {automation.triggerEvent} on {automation.triggerStageId?.name || automation.triggerStageKey}
                    </p>
                  </div>
                  <button
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white"
                    onClick={() => setEditingAutomation(automation)}
                    type="button"
                  >
                    Edit
                  </button>
                </div>
                <div className="mt-3 text-xs text-slate-500">
                  Action: {automation.actionType}
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500">No Funnel automations configured yet.</p>
          )}
        </div>
      </SectionCard>

      <SectionCard>
        <SectionHeader
          eyebrow="Automation Editor"
          title={editingAutomation?.id || editingAutomation?._id ? 'Edit automation' : 'Add automation'}
          description="Configure stage-entry actions for assignment, reminders, notifications, tags, or SLA updates."
        />
        <div className="mt-6 space-y-4">
          <input
            className="ds-field"
            placeholder="Automation name"
            value={editingAutomation.name || ''}
            onChange={(event) =>
              setEditingAutomation((current: any) => ({ ...current, name: event.target.value }))
            }
          />

          <select
            className="ds-field"
            value={editingAutomation.triggerStageKey || ''}
            onChange={(event) =>
              setEditingAutomation((current: any) => ({
                ...current,
                triggerStageKey: event.target.value,
              }))
            }
          >
            <option value="">Trigger stage</option>
            {stages.map((stage) => (
              <option key={stage._id} value={stage.key}>
                {stage.name}
              </option>
            ))}
          </select>

          <select
            className="ds-field"
            value={editingAutomation.triggerEvent || 'enter_stage'}
            onChange={(event) =>
              setEditingAutomation((current: any) => ({
                ...current,
                triggerEvent: event.target.value,
              }))
            }
          >
            <option value="enter_stage">Enter stage</option>
            <option value="exit_stage">Exit stage</option>
            <option value="stale_in_stage">Stale in stage</option>
          </select>

          <select
            className="ds-field"
            value={editingAutomation.actionType || 'assign_user'}
            onChange={(event) =>
              setEditingAutomation((current: any) => ({
                ...current,
                actionType: event.target.value,
              }))
            }
          >
            <option value="assign_user">Assign user</option>
            <option value="assign_branch">Assign branch</option>
            <option value="create_task">Create task</option>
            <option value="create_reminder">Create reminder</option>
            <option value="send_internal_notification">Send internal notification</option>
            <option value="add_tag">Add tag</option>
            <option value="update_sla_status">Update SLA status</option>
          </select>

          <textarea
            rows={8}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white"
            placeholder='Action config JSON, e.g. {"offsetHours":24,"notes":"Call within one day"}'
            value={editingAutomation.actionConfigText || ''}
            onChange={(event) =>
              setEditingAutomation((current: any) => ({
                ...current,
                actionConfigText: event.target.value,
              }))
            }
          />

          <button
            className="ds-button-primary w-full"
            disabled={saving || !editingAutomation.name || !editingAutomation.actionType}
            onClick={onSave}
            type="button"
          >
            Save automation
          </button>
        </div>
      </SectionCard>
    </div>
  );
}
