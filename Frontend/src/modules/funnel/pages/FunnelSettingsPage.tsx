'use client';

import { useEffect, useState } from 'react';
import AppShell from '@/components/app/app-shell';
import { SectionCard, SectionHeader } from '@/components/app/design-system';
import { ErrorState, LoadingState } from '@/components/app/shared';
import { funnelAPI } from '@/src/services/api';
import FunnelAutomationBuilder from '../components/FunnelAutomationBuilder';
import FunnelStageSettings from '../components/FunnelStageSettings';
import LostReasonModal from '../components/LostReasonModal';

const INITIAL_STAGE = {
  name: '',
  key: '',
  color: '#1d4ed8',
  slaHours: '',
  requiredActions: {},
  isTerminal: false,
  isWon: false,
  isLost: false,
};

const INITIAL_AUTOMATION = {
  name: '',
  triggerStageKey: '',
  triggerEvent: 'enter_stage',
  actionType: 'assign_user',
  actionConfigText: '',
};

export default function FunnelSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [stages, setStages] = useState<any[]>([]);
  const [lostReasons, setLostReasons] = useState<any[]>([]);
  const [automations, setAutomations] = useState<any[]>([]);
  const [editingStage, setEditingStage] = useState<any>(INITIAL_STAGE);
  const [editingAutomation, setEditingAutomation] = useState<any>(INITIAL_AUTOMATION);
  const [lostReasonModal, setLostReasonModal] = useState<any>(null);

  const loadSettings = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await funnelAPI.getSettings();
      setStages(response.data?.data?.stages || []);
      setLostReasons(response.data?.data?.lostReasons || []);
      setAutomations(
        (response.data?.data?.automations || []).map((automation: any) => ({
          ...automation,
          actionConfigText: JSON.stringify(automation.actionConfig || {}, null, 2),
        }))
      );
    } catch (requestError: any) {
      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          'Failed to load Funnel settings.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const runSave = async (callback: () => Promise<any>) => {
    setSaving(true);
    setError('');

    try {
      await callback();
      await loadSettings();
    } catch (requestError: any) {
      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          'Failed to save Funnel settings.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell
      title="Funnel Settings"
      description="Configure Funnel stages, movement rules, lost reasons, and automation triggers at the tenant level."
    >
      {loading ? <LoadingState label="Loading Funnel settings..." /> : null}
      {!loading && error ? <ErrorState message={error} onRetry={loadSettings} /> : null}

      {!loading && !error ? (
        <div className="space-y-6">
          <FunnelStageSettings
            stages={stages}
            editingStage={editingStage}
            setEditingStage={setEditingStage}
            saving={saving}
            onSave={() =>
              runSave(async () => {
                await funnelAPI.saveStage(editingStage);
                setEditingStage(INITIAL_STAGE);
              })
            }
            onReorder={(stageIds) =>
              runSave(async () => {
                await funnelAPI.reorderStages(stageIds);
              })
            }
          />

          <FunnelAutomationBuilder
            stages={stages}
            automations={automations}
            editingAutomation={editingAutomation}
            setEditingAutomation={setEditingAutomation}
            saving={saving}
            onSave={() =>
              runSave(async () => {
                let actionConfig = {};
                if (editingAutomation.actionConfigText?.trim()) {
                  actionConfig = JSON.parse(editingAutomation.actionConfigText);
                }
                await funnelAPI.saveAutomation({
                  ...editingAutomation,
                  actionConfig,
                });
                setEditingAutomation(INITIAL_AUTOMATION);
              })
            }
          />

          <SectionCard>
            <SectionHeader
              eyebrow="Lost Reasons"
              title="Loss classification"
              description="Require structured reasons when leads exit the Funnel into lost stages."
              actions={
                <button
                  className="ds-button-primary"
                  onClick={() => setLostReasonModal({})}
                  type="button"
                >
                  Add reason
                </button>
              }
            />

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {lostReasons.map((reason) => (
                <div
                  key={reason._id}
                  className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4"
                >
                  <p className="font-semibold text-slate-900">{reason.label}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {reason.active ? 'Active' : 'Inactive'}
                  </p>
                  <button
                    className="mt-4 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white"
                    onClick={() => setLostReasonModal(reason)}
                    type="button"
                  >
                    Edit
                  </button>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      ) : null}

      <LostReasonModal
        open={Boolean(lostReasonModal)}
        initialValue={lostReasonModal}
        submitting={saving}
        onClose={() => setLostReasonModal(null)}
        onSubmit={(payload) =>
          runSave(async () => {
            await funnelAPI.saveLostReason(payload);
            setLostReasonModal(null);
          })
        }
      />
    </AppShell>
  );
}
