import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Plus } from 'lucide-react';
import { leadAPI } from '../services/api';
import { useBranding } from '../context/BrandingContext';

const STAGES = [
  { key: 'new', label: 'New', color: '#94a3b8' },
  { key: 'contacted', label: 'Contacted', color: '#60a5fa' },
  { key: 'qualified', label: 'Qualified', color: '#22d3ee' },
  {
    key: 'counselling_scheduled',
    label: 'Counselling Sched.',
    color: '#a78bfa',
  },
  { key: 'counselling_done', label: 'Counselling Done', color: '#8b5cf6' },
  {
    key: 'application_started',
    label: 'Application Started',
    color: '#f59e0b',
  },
  { key: 'documents_pending', label: 'Documents Pending', color: '#f97316' },
  { key: 'application_submitted', label: 'App Submitted', color: '#6366f1' },
  { key: 'offer_received', label: 'Offer Received', color: '#10b981' },
  { key: 'visa_applied', label: 'Visa Applied', color: '#14b8a6' },
  { key: 'enrolled', label: 'Enrolled', color: '#22c55e' },
  { key: 'lost', label: 'Lost', color: '#ef4444' },
];

const CATEGORY_COLORS = {
  hot: { bg: 'bg-red-100', text: 'text-red-600', dot: 'bg-red-400' },
  warm: { bg: 'bg-amber-100', text: 'text-amber-600', dot: 'bg-amber-400' },
  cold: { bg: 'bg-blue-100', text: 'text-blue-500', dot: 'bg-blue-400' },
};

const LeadCard = ({ lead, primaryColor, onNavigate }) => {
  const cat = CATEGORY_COLORS[lead.leadCategory] || CATEGORY_COLORS.cold;
  return (
    <div
      onClick={() => onNavigate(`/admin/leads/${lead._id}`)}
      className="bg-white border border-gray-100 rounded-xl p-3 shadow-sm hover:shadow-md cursor-pointer transition-all hover:-translate-y-0.5 group"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[10px] font-black flex-shrink-0"
            style={{ backgroundColor: primaryColor }}
          >
            {(lead.firstName || lead.name || '?')[0].toUpperCase()}
          </div>
          <div>
            <p className="text-[11px] font-black text-gray-800 leading-none">
              {lead.firstName} {lead.lastName}
            </p>
            <p className="text-[9px] text-gray-400 mt-0.5">{lead.phone}</p>
          </div>
        </div>
        <span
          className={`text-[8px] font-black px-1.5 py-0.5 rounded-full ${cat.bg} ${cat.text}`}
        >
          {lead.leadScore || 0}
        </span>
      </div>
      <div className="flex flex-wrap gap-1">
        {lead.preferredCountries?.slice(0, 2).map((c) => (
          <span
            key={c}
            className="text-[8px] px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded font-bold"
          >
            {c.split(' ')[0]}
          </span>
        ))}
        {lead.assignedCounsellor?.name && (
          <span className="text-[8px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded font-bold">
            {lead.assignedCounsellor.name.split(' ')[0]}
          </span>
        )}
      </div>
      {lead.nextFollowUp && (
        <p
          className={`text-[8px] mt-1.5 font-bold ${new Date(lead.nextFollowUp) < new Date() ? 'text-red-500' : 'text-gray-400'}`}
        >
          📅 {new Date(lead.nextFollowUp).toLocaleDateString()}
        </p>
      )}
    </div>
  );
};

const PipelineBoardPage = () => {
  const { branding } = useBranding();
  const navigate = useNavigate();
  const primary = branding?.primaryColor || '#6366f1';

  const [pipeline, setPipeline] = useState({});
  const [loading, setLoading] = useState(true);
  const [dragging, setDragging] = useState(null);
  const [dragOver, setDragOver] = useState(null);
  const [updating, setUpdating] = useState(null);

  const fetchPipeline = async () => {
    setLoading(true);
    try {
      const res = await leadAPI.getPipeline();
      setPipeline(res.data.data.pipeline || {});
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPipeline();
  }, []);

  // ─── Native HTML5 DnD ──────────────────────────────────────────────────
  const handleDragStart = (e, lead, fromStage) => {
    setDragging({ lead, fromStage });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, stageKey) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOver(stageKey);
  };

  const handleDrop = async (e, toStage) => {
    e.preventDefault();
    if (!dragging || dragging.fromStage === toStage) {
      setDragging(null);
      setDragOver(null);
      return;
    }

    const { lead, fromStage } = dragging;
    setDragging(null);
    setDragOver(null);
    setUpdating(lead._id);

    // Optimistic update
    setPipeline((prev) => {
      const updated = { ...prev };
      // Remove from source
      updated[fromStage] = {
        ...prev[fromStage],
        leads: prev[fromStage]?.leads?.filter((l) => l._id !== lead._id) || [],
        count: (prev[fromStage]?.count || 1) - 1,
      };
      // Add to target
      updated[toStage] = {
        ...prev[toStage],
        leads: [{ ...lead, status: toStage }, ...(prev[toStage]?.leads || [])],
        count: (prev[toStage]?.count || 0) + 1,
      };
      return updated;
    });

    try {
      await leadAPI.updateStatus(lead._id, toStage);
    } catch (e) {
      console.error(e);
      // Revert
      fetchPipeline();
    } finally {
      setUpdating(null);
    }
  };

  const handleDragLeave = () => setDragOver(null);

  const total = Object.values(pipeline).reduce(
    (acc, s) => acc + (s?.count || 0),
    0
  );

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin/leads')}
            className="p-2 hover:bg-gray-100 rounded-xl transition-all"
          >
            <ArrowLeft size={18} className="text-gray-500" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-gray-800">
              Pipeline Board
            </h1>
            <p className="text-xs text-gray-400">
              {total} leads across {STAGES.length} stages
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchPipeline}
            className="p-2 hover:bg-gray-100 rounded-xl text-gray-500 transition-all"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => navigate('/admin/leads/create')}
            className="px-4 py-2 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 hover:opacity-90"
            style={{ backgroundColor: primary }}
          >
            <Plus size={14} /> Add Lead
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-full">
          <div
            className="w-10 h-10 border-4 border-gray-200 rounded-full animate-spin"
            style={{ borderTopColor: primary }}
          />
        </div>
      ) : (
        <div className="flex-1 overflow-x-auto">
          <div
            className="flex gap-3 h-full min-h-0"
            style={{ minWidth: `${STAGES.length * 220}px` }}
          >
            {STAGES.map((stage) => {
              const stageData = pipeline[stage.key] || { leads: [], count: 0 };
              const isDragTarget = dragOver === stage.key;
              return (
                <div
                  key={stage.key}
                  className="flex flex-col rounded-2xl border-2 transition-all flex-shrink-0"
                  style={{
                    width: '210px',
                    borderColor: isDragTarget ? stage.color : 'transparent',
                    backgroundColor: isDragTarget
                      ? `${stage.color}10`
                      : '#f8fafc',
                  }}
                  onDragOver={(e) => handleDragOver(e, stage.key)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, stage.key)}
                >
                  {/* Stage Header */}
                  <div className="px-3 py-2.5 flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: stage.color }}
                      />
                      <span className="text-[10px] font-black text-gray-700 uppercase tracking-wider">
                        {stage.label}
                      </span>
                    </div>
                    <span
                      className="text-[10px] font-black px-1.5 py-0.5 rounded-full text-white"
                      style={{ backgroundColor: stage.color }}
                    >
                      {stageData.count}
                    </span>
                  </div>

                  {/* Cards */}
                  <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-2 min-h-16">
                    {stageData.leads?.map((lead) => (
                      <div
                        key={lead._id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, lead, stage.key)}
                        className={`transition-opacity ${updating === lead._id ? 'opacity-50' : 'opacity-100'}`}
                      >
                        <LeadCard
                          lead={lead}
                          primaryColor={primary}
                          onNavigate={navigate}
                        />
                      </div>
                    ))}
                    {stageData.leads?.length === 0 && (
                      <div className="h-16 flex items-center justify-center text-[10px] text-gray-300 font-bold uppercase tracking-widest border-2 border-dashed border-gray-100 rounded-xl">
                        Drop here
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default PipelineBoardPage;
