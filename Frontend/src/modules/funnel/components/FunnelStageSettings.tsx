'use client';

import { ArrowDown, ArrowUp, Plus } from 'lucide-react';
import { SectionCard, SectionHeader } from '@/components/app/design-system';

type FunnelStageSettingsProps = {
  stages: any[];
  editingStage: any;
  setEditingStage: (updater: any) => void;
  onSave: () => Promise<void> | void;
  onReorder: (stageIds: string[]) => Promise<void> | void;
  saving?: boolean;
};

export default function FunnelStageSettings({
  stages,
  editingStage,
  setEditingStage,
  onSave,
  onReorder,
  saving = false,
}: FunnelStageSettingsProps) {
  const moveStage = async (index: number, direction: -1 | 1) => {
    const nextStages = [...stages];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= nextStages.length) {
      return;
    }
    const [item] = nextStages.splice(index, 1);
    nextStages.splice(targetIndex, 0, item);
    await onReorder(nextStages.map((stage) => stage._id));
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
      <SectionCard>
        <SectionHeader
          eyebrow="Funnel Stages"
          title="Configurable stage engine"
          description="Control stage ordering, colors, terminal states, and movement requirements."
        />
        <div className="mt-6 space-y-4">
          {stages.map((stage, index) => (
            <div
              key={stage._id}
              className="flex items-center justify-between gap-4 rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-4"
            >
              <div className="flex items-center gap-4">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: stage.color || '#1d4ed8' }}
                />
                <div>
                  <p className="font-semibold text-slate-900">{stage.name}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {stage.key} • SLA {stage.slaHours ?? 'none'}h
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="rounded-xl border border-slate-200 p-2 text-slate-600 transition hover:bg-white"
                  onClick={() => moveStage(index, -1)}
                  type="button"
                >
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button
                  className="rounded-xl border border-slate-200 p-2 text-slate-600 transition hover:bg-white"
                  onClick={() => moveStage(index, 1)}
                  type="button"
                >
                  <ArrowDown className="h-4 w-4" />
                </button>
                <button
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white"
                  onClick={() => setEditingStage(stage)}
                  type="button"
                >
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard>
        <SectionHeader
          eyebrow="Stage Editor"
          title={editingStage?.id || editingStage?._id ? 'Edit stage' : 'Add stage'}
          description="Define Funnel stage identity, SLA, and validation behavior."
        />
        <div className="mt-6 space-y-4">
          <input
            className="ds-field"
            placeholder="Stage name"
            value={editingStage.name || ''}
            onChange={(event) =>
              setEditingStage((current: any) => ({ ...current, name: event.target.value }))
            }
          />
          <input
            className="ds-field"
            placeholder="Key"
            value={editingStage.key || ''}
            onChange={(event) =>
              setEditingStage((current: any) => ({ ...current, key: event.target.value }))
            }
          />
          <div className="grid gap-4 md:grid-cols-2">
            <input
              type="color"
              className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-2"
              value={editingStage.color || '#1d4ed8'}
              onChange={(event) =>
                setEditingStage((current: any) => ({ ...current, color: event.target.value }))
              }
            />
            <input
              type="number"
              className="ds-field"
              placeholder="SLA hours"
              value={editingStage.slaHours ?? ''}
              onChange={(event) =>
                setEditingStage((current: any) => ({ ...current, slaHours: event.target.value }))
              }
            />
          </div>

          <div className="grid gap-3">
            {[
              ['isTerminal', 'Terminal stage'],
              ['isWon', 'Won / conversion stage'],
              ['isLost', 'Lost stage'],
              ['requiredActions.noteRequired', 'Require note before move'],
              ['requiredActions.followUpRequired', 'Require follow-up before move'],
              ['requiredActions.assigneeRequired', 'Require assignee before move'],
              ['requiredActions.branchRequired', 'Require active branch before move'],
              ['requiredActions.lostReasonRequired', 'Require lost reason'],
            ].map(([key, label]) => {
              const value =
                key.indexOf('.') >= 0
                  ? editingStage.requiredActions?.[key.split('.')[1]]
                  : editingStage[key];

              return (
                <label
                  key={key}
                  className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700"
                >
                  <input
                    type="checkbox"
                    checked={Boolean(value)}
                    onChange={(event) => {
                      if (key.indexOf('.') >= 0) {
                        const nestedKey = key.split('.')[1];
                        setEditingStage((current: any) => ({
                          ...current,
                          requiredActions: {
                            ...(current.requiredActions || {}),
                            [nestedKey]: event.target.checked,
                          },
                        }));
                        return;
                      }

                      setEditingStage((current: any) => ({
                        ...current,
                        [key]: event.target.checked,
                      }));
                    }}
                  />
                  {label}
                </label>
              );
            })}
          </div>

          <button
            className="ds-button-primary w-full"
            disabled={saving || !editingStage.name}
            onClick={onSave}
            type="button"
          >
            <Plus className="h-4 w-4" />
            Save stage
          </button>
        </div>
      </SectionCard>
    </div>
  );
}
