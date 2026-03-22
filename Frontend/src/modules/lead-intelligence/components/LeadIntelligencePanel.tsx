'use client';

import LeadHealthPills from './LeadHealthPills';

const formatLabel = (value: string) =>
  String(value || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());

type LeadIntelligencePanelProps = {
  profile: any;
  loading?: boolean;
  actionLoading?: boolean;
  onRefresh?: () => void;
  onExecuteRecommendation?: (recommendationId: string) => void;
};

export default function LeadIntelligencePanel({
  profile,
  loading = false,
  actionLoading = false,
  onRefresh,
  onExecuteRecommendation,
}: LeadIntelligencePanelProps) {
  const current = profile?.currentIntelligence || {};
  const recommendations = profile?.recommendations || [];
  const factorEntries = current?.factors || [];

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            AI Lead System
          </p>
          <h3 className="mt-2 text-xl font-semibold text-slate-900">
            Explainable lead intelligence
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Score, urgency, temperature, routing, assignment, and next-action logic from the operational intelligence layer.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading || actionLoading}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Refresh AI
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <div className="space-y-4">
          <div className="rounded-[1.5rem] bg-slate-50 p-5">
            <LeadHealthPills
              score={current?.score || profile?.latestScore?.score || 0}
              label={current?.label || profile?.latestScore?.label}
              temperature={current?.temperature}
              priority={current?.priority}
              nextAction={current?.recommendedNextAction}
            />
            <p className="mt-4 text-sm leading-6 text-slate-700">
              {current?.explanationSummary || 'No explainable AI summary is available yet for this lead.'}
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {[
              ['Confidence', current?.confidence ? `${Math.round(current.confidence * 100)}%` : 'Not available'],
              ['Score Delta', typeof current?.scoreDelta === 'number' ? `${current.scoreDelta >= 0 ? '+' : ''}${current.scoreDelta}` : '0'],
              ['Reactivation', current?.isReactivationCandidate ? 'Candidate' : 'No'],
              ['Last Rule Version', current?.scoringVersion || profile?.settings?.scoringVersion || 'rule_v1'],
            ].map(([label, value]) => (
              <div key={String(label)} className="rounded-2xl border border-slate-200 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  {label}
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-900">{value}</p>
              </div>
            ))}
          </div>

          <div className="rounded-[1.5rem] border border-slate-200 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Recommendations
                </p>
                <h4 className="mt-2 text-lg font-semibold text-slate-900">
                  Suggested next actions
                </h4>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {!recommendations.length ? (
                <p className="text-sm text-slate-500">No active recommendations right now.</p>
              ) : (
                recommendations.map((recommendation: any) => (
                  <div
                    key={recommendation._id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <p className="font-semibold text-slate-900">
                          {formatLabel(recommendation.recommendationType)}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          {recommendation.explanation}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                          <span>Status: {formatLabel(recommendation.status || 'suggested')}</span>
                          {typeof recommendation.confidence === 'number' ? (
                            <span>Confidence: {Math.round(recommendation.confidence * 100)}%</span>
                          ) : null}
                        </div>
                      </div>
                      {recommendation.status === 'suggested' ? (
                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={() => onExecuteRecommendation?.(recommendation._id)}
                          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Execute
                        </button>
                      ) : null}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-[1.5rem] border border-slate-200 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Score Factors
            </p>
            <div className="mt-5 space-y-3">
              {!factorEntries.length ? (
                <p className="text-sm text-slate-500">No factor breakdown available yet.</p>
              ) : (
                factorEntries.map((factor: any) => (
                  <div key={factor.key} className="rounded-2xl bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-slate-900">{factor.label}</p>
                      <span className="text-sm font-semibold text-slate-700">
                        {Math.round(factor.value || 0)}
                      </span>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-slate-500">
                      {factor.explanation}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-slate-200 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Routing and Assignment
            </p>
            <div className="mt-5 space-y-4 text-sm text-slate-600">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="font-semibold text-slate-900">Branch suggestion</p>
                <p className="mt-2">
                  {current?.routingSuggestion?.reason || 'No branch suggestion is stored yet.'}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="font-semibold text-slate-900">Assignment suggestion</p>
                <p className="mt-2">
                  {current?.assignmentSuggestion?.explanation || 'No assignment suggestion is stored yet.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
