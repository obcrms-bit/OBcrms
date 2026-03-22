'use client';

import FunnelColumn from './FunnelColumn';

type FunnelBoardProps = {
  stages: any[];
  board: Record<string, any>;
  dragOverStageKey: string;
  disabledLeadId?: string;
  onDragOver: (stageKey: string) => void;
  onDragLeave: () => void;
  onDropStage: (stageKey: string) => void;
  onOpenLead: (lead: any) => void;
  onDragStart: (lead: any) => void;
};

export default function FunnelBoard({
  stages,
  board,
  dragOverStageKey,
  disabledLeadId = '',
  onDragOver,
  onDragLeave,
  onDropStage,
  onOpenLead,
  onDragStart,
}: FunnelBoardProps) {
  return (
    <div className="overflow-x-auto">
      <div className="flex gap-4 pb-3" style={{ minWidth: `${Math.max(stages.length, 1) * 340}px` }}>
        {stages.map((stage) => (
          <FunnelColumn
            key={stage._id || stage.key}
            stage={stage}
            stageData={board?.[stage.key] || { leads: [], count: 0, overdueFollowUpCount: 0, totalEstimatedValue: 0 }}
            isDragTarget={dragOverStageKey === stage.key}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDropStage={onDropStage}
            onOpenLead={onOpenLead}
            onDragStart={onDragStart}
            disabledLeadId={disabledLeadId}
          />
        ))}
      </div>
    </div>
  );
}
