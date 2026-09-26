import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import api from '../../../services/api';
import { formatCurrency, formatDate, formatDateTime } from '../../../utils/formatters';
import { Button } from '../../../components/common/Button';
import { Card } from '../../../components/common/Card';
import { RiskBadge } from '../../../components/common/RiskBadge';
import { Modal } from '../../../components/common/Modal';
import { Alert, Skeleton, EmptyState } from '../../../components/common/LayoutComponents';
import {
  GitBranch,
  Search,
  Clock,
  Info,
  ShieldCheck,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Layers,
  Sparkles,
} from 'lucide-react';

export const MoneyFlowTracePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTxn = searchParams.get('txn') || '';

  const [activeTxnId, setActiveTxnId] = useState(initialTxn);
  const [availableTxns, setAvailableTxns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [traceData, setTraceData] = useState(null);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('graph'); // 'graph' | 'timeline'
  const [selectedEntity, setSelectedEntity] = useState(null);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Fetch available transactions for selector
  useEffect(() => {
    const loadTxns = async () => {
      try {
        const res = await api.get('/transactions?limit=50&sortBy=date&sortOrder=desc');
        const list = res.data || [];
        setAvailableTxns(list);
        if (!activeTxnId && list.length > 0) {
          // Default to first high-risk transaction or first available
          const risky = list.find((t) => t.riskLevel === 'High Risk' || t.riskLevel === 'Medium Risk');
          const chosen = risky ? risky.transactionId : list[0].transactionId;
          setActiveTxnId(chosen);
          setSearchParams({ txn: chosen });
        }
      } catch (err) {
        console.error('Failed to load transaction list:', err);
      }
    };
    loadTxns();
  }, []);

  // Fetch trace whenever activeTxnId changes
  useEffect(() => {
    if (activeTxnId) {
      loadTrace(activeTxnId);
    }
  }, [activeTxnId]);

  const loadTrace = async (txnId) => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get(`/trace/${txnId}`);
      setTraceData(res.data);

      buildFlowGraph(res.data);
    } catch (err) {
      setError(err.message || 'Failed to trace money flow');
      setTraceData(null);
    } finally {
      setLoading(false);
    }
  };

  const buildFlowGraph = (data) => {
    if (!data?.graph) return;

    const rawNodes = data.graph.nodes || [];
    const rawEdges = data.graph.edges || [];

    // Layout calculation: Left (sources) -> Center (User account) -> Right (destinations)
    const sources = rawNodes.filter((n) => n.type === 'originator' || n.type === 'source');
    const central = rawNodes.filter((n) => n.type === 'account');
    const destinations = rawNodes.filter((n) => n.type === 'beneficiary' || n.type === 'destination');

    const flowNodes = [];

    // Place sources on X: 50
    sources.forEach((s, i) => {
      flowNodes.push({
        id: s.id,
        data: {
          label: (
            <div className="p-3 bg-emerald-50 border-2 border-emerald-500 rounded-xl shadow-md text-left min-w-[190px]">
              <div className="flex items-center justify-between text-[10px] font-bold text-emerald-800 uppercase tracking-wider mb-1">
                <span>Originator</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              </div>
              <p className="font-bold text-slate-900 text-xs truncate">{s.label}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">{s.role || 'Inbound Source'}</p>
            </div>
          ),
          raw: s,
        },
        position: { x: 50, y: 80 + i * 140 },
        type: 'default',
      });
    });

    // Place central account on X: 380
    central.forEach((c, i) => {
      flowNodes.push({
        id: c.id,
        data: {
          label: (
            <div className="p-3.5 bg-brand-600 text-white border-2 border-brand-400 rounded-xl shadow-xl text-left min-w-[210px]">
              <div className="flex items-center justify-between text-[10px] font-bold text-brand-200 uppercase tracking-wider mb-1">
                <span>Audited Account</span>
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <p className="font-bold text-white text-sm">{c.label}</p>
              <p className="text-[11px] text-brand-100 mt-0.5 font-mono">
                Ledger Hub
              </p>
            </div>
          ),
          raw: c,
        },
        position: { x: 380, y: 120 + i * 160 },
        type: 'default',
      });
    });

    // Place destinations on X: 720
    destinations.forEach((d, i) => {
      const isRisky = d.metadata?.riskLevel === 'High Risk';
      flowNodes.push({
        id: d.id,
        data: {
          label: (
            <div
              className={`p-3 border-2 rounded-xl shadow-md text-left min-w-[200px] ${
                isRisky
                  ? 'bg-red-50 border-red-500'
                  : 'bg-blue-50 border-blue-400'
              }`}
            >
              <div
                className={`flex items-center justify-between text-[10px] font-bold uppercase tracking-wider mb-1 ${
                  isRisky ? 'text-red-700' : 'text-blue-700'
                }`}
              >
                <span>Beneficiary</span>
                <span
                  className={`w-2 h-2 rounded-full ${
                    isRisky ? 'bg-red-500' : 'bg-blue-500'
                  }`}
                ></span>
              </div>
              <p className="font-bold text-slate-900 text-xs truncate">{d.label}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">{d.role || 'Outbound Destination'}</p>
            </div>
          ),
          raw: d,
        },
        position: { x: 720, y: 60 + i * 130 },
        type: 'default',
      });
    });

    setNodes(flowNodes);

    // Build flow edges with animated styling and currency labels
    const flowEdges = rawEdges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      label: e.label,
      animated: true,
      style: { stroke: '#2563eb', strokeWidth: 2.5 },
      labelStyle: { fill: '#1e293b', fontWeight: 700, fontSize: 11, fontFamily: 'monospace' },
      labelBgStyle: { fill: '#ffffff', fillOpacity: 0.95, stroke: '#cbd5e1', rx: 4, ry: 4 },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#2563eb',
        width: 18,
        height: 18,
      },
      data: e,
    }));

    setEdges(flowEdges);
  };

  const handleNodeClick = (_, node) => {
    setSelectedEntity(node.data?.raw || null);
  };

  const handleEdgeClick = (_, edge) => {
    setSelectedEntity({
      isEdge: true,
      amount: edge.data?.amount,
      date: edge.data?.date,
      transactionId: edge.data?.transactionId,
      description: edge.data?.description,
      label: edge.label,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Money Flow Trace Visualizer
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-100 text-brand-800 border border-brand-200">
              Multi-Hop Graph
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Reconstruct where funds originated and how they transitioned through related transfers.
          </p>
        </div>

        {/* Transaction Selector Dropdown */}
        <div className="flex items-center gap-2">
          <div className="w-64">
            <select
              value={activeTxnId}
              onChange={(e) => {
                setActiveTxnId(e.target.value);
                setSearchParams({ txn: e.target.value });
              }}
              className="w-full text-xs font-semibold rounded-lg border border-slate-300 py-2 px-3 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 shadow-subtle truncate"
            >
              {availableTxns.map((t) => (
                <option key={t._id} value={t.transactionId}>
                  {t.transactionId} — {formatCurrency(t.amount)} ({t.riskLevel})
                </option>
              ))}
            </select>
          </div>
          <Link to={`/transactions/${traceData?.rootTransaction?._id || ''}`}>
            <Button size="sm" variant="outline">
              Analysis Detail
            </Button>
          </Link>
        </div>
      </div>

      {/* Mandatory Regulatory Grounding Disclaimer */}
      <div className="p-3 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            {traceData?.disclaimer ||
              'This money flow graph is derived exclusively from records present in your uploaded statements. No external or unauthorized banking ledgers were queried.'}
          </span>
        </div>
        <span className="text-[10px] uppercase font-bold text-slate-400 font-mono shrink-0 ml-2">
          Strict DB Grounding
        </span>
      </div>

      {error && (
        <Alert type="error" title="Trace Error">
          {error}
        </Alert>
      )}

      {/* Graph vs Timeline Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200">
        <div className="flex items-center gap-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('graph')}
            className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'graph'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <GitBranch className="w-4 h-4" />
            <span>Interactive Flow Graph</span>
          </button>
          <button
            onClick={() => setActiveTab('timeline')}
            className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'timeline'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Pass-Through Timeline Velocity</span>
          </button>
        </div>

        {traceData?.summary && (
          <div className="hidden sm:flex items-center gap-3 text-xs text-slate-500 pb-2">
            <span>Inflows: <strong className="text-emerald-600">{formatCurrency(traceData.summary.inflowTotal)}</strong></span>
            <span>•</span>
            <span>Outflows: <strong className="text-red-600">{formatCurrency(traceData.summary.outflowTotal)}</strong></span>
          </div>
        )}
      </div>

      {/* Main Visualizer Area */}
      {loading ? (
        <div className="h-[550px] bg-white rounded-2xl border border-slate-200 flex items-center justify-center shadow-card">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Mapping Multi-Hop Money Flow Trail...
            </p>
          </div>
        </div>
      ) : activeTab === 'graph' ? (
        <div className="h-[580px] bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden shadow-card relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={handleNodeClick}
            onEdgeClick={handleEdgeClick}
            fitView
            attributionPosition="bottom-right"
          >
            <Background color="#cbd5e1" gap={20} size={1} />
            <Controls className="bg-white rounded-lg border border-slate-200 shadow-md p-1" />
            <MiniMap
              nodeColor={(node) => {
                if (node.id.startsWith('entity_')) return '#3b82f6';
                return '#1e3a8a';
              }}
              className="bg-white border border-slate-200 rounded-lg shadow-md"
            />
          </ReactFlow>

          {/* Interactive Legend Box */}
          <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur-md p-3 rounded-xl border border-slate-200 shadow-lg text-[11px] space-y-1.5 pointer-events-none">
            <p className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">Flow Graph Legend</p>
            <div className="flex items-center gap-2 text-slate-600">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Originating Source
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <span className="w-2.5 h-2.5 rounded-full bg-brand-600"></span> Central Account (User)
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Dispersal Beneficiary
            </div>
            <p className="text-[10px] text-slate-400 pt-1 italic">Click any node or transfer edge for audit details</p>
          </div>
        </div>
      ) : (
        /* Timeline View (Section 13) */
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Chronological Fund Movement Velocity
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Inspect rapid inbound credits and subsequent outbound liquidations.
            </p>
          </div>

          {traceData?.timeline && traceData.timeline.length > 0 ? (
            <div className="relative border-l-2 border-slate-200 ml-4 pl-6 space-y-6">
              {traceData.timeline.map((step, idx) => {
                const isCredit = step.type === 'credit';
                return (
                  <div key={idx} className="relative group">
                    {/* Timeline bullet */}
                    <div
                      className={`absolute -left-[31px] top-1 w-4 h-4 rounded-full border-2 border-white shadow-sm flex items-center justify-center ${
                        step.isRoot
                          ? 'bg-brand-600 ring-4 ring-brand-100'
                          : isCredit
                          ? 'bg-emerald-500'
                          : 'bg-red-500'
                      }`}
                    />

                    <div
                      className={`p-4 rounded-xl border transition-all ${
                        step.isRoot
                          ? 'bg-brand-50/60 border-brand-200 shadow-sm'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-700">
                            {formatDateTime(step.date)}
                          </span>
                          {step.isRoot && (
                            <span className="text-[10px] uppercase font-bold bg-brand-600 text-white px-1.5 py-0.2 rounded">
                              Target Transaction
                            </span>
                          )}
                          <RiskBadge level={step.riskLevel} size="sm" />
                        </div>
                        <div
                          className={`text-sm font-bold font-mono ${
                            isCredit ? 'text-emerald-600' : 'text-slate-900'
                          }`}
                        >
                          {step.formattedAmount}
                        </div>
                      </div>

                      <div className="mt-2 text-xs text-slate-800">
                        <span className="font-semibold">{step.party}</span> —{' '}
                        <span className="text-slate-500">{step.description}</span>
                      </div>
                      <div className="mt-1 font-mono text-[10px] text-slate-400">
                        ID: {step.transactionId}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title="No chronological movements"
              description="No correlated transfers found in the selected transaction window."
            />
          )}
        </div>
      )}

      {/* Node / Edge Click Details Modal */}
      {selectedEntity && (
        <Modal
          isOpen={!!selectedEntity}
          onClose={() => setSelectedEntity(null)}
          title={selectedEntity.isEdge ? 'Transfer Details' : 'Account / Node Entity'}
          subtitle="MoneyTrace ledger metadata"
          maxWidth="max-w-md"
        >
          <div className="space-y-3 text-xs">
            {selectedEntity.isEdge ? (
              <>
                <div className="p-3 bg-brand-50 rounded-xl border border-brand-100 flex items-center justify-between">
                  <span className="font-semibold text-brand-900">Transfer Amount</span>
                  <span className="text-base font-bold text-brand-700 font-mono">
                    {formatCurrency(selectedEntity.amount)}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Transaction ID:</span>
                  <span className="font-mono font-bold text-slate-800">
                    {selectedEntity.transactionId}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Execution Date:</span>
                  <span className="text-slate-800">{formatDateTime(selectedEntity.date)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block mb-1">Description:</span>
                  <p className="bg-slate-50 p-2 rounded-lg border border-slate-200 text-slate-800">
                    {selectedEntity.description || 'N/A'}
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                    Entity Label
                  </span>
                  <h4 className="text-sm font-bold text-slate-900">{selectedEntity.label}</h4>
                  <p className="text-slate-500 text-xs mt-0.5">{selectedEntity.role}</p>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Entity Type:</span>
                  <span className="font-semibold uppercase text-brand-700">
                    {selectedEntity.type}
                  </span>
                </div>
                {selectedEntity.metadata?.paymentMode && (
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Payment Mode:</span>
                    <span className="text-slate-800 font-mono">
                      {selectedEntity.metadata.paymentMode}
                    </span>
                  </div>
                )}
              </>
            )}
            <div className="pt-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => setSelectedEntity(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
