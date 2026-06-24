import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ReactFlow, Background, Controls, MiniMap,
  type Node, type Edge, type NodeTypes,
  Handle, Position, useNodesState, useEdgesState,
  ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  Target, BookOpen, Layers, BookOpenCheck,
  Search, AlertCircle, BarChart3, ChevronRight,
} from 'lucide-react';
import {
  cpmkCplMappingService, cplBkMappingService, subCpmkService,
  academicClassService, studentCpmkScoreService,
  courseService, courseCpmkWeightService,
} from '@/services/obe.service';
import { useApp } from '@/contexts/AppContext';

// ── Color palette per node type ──────────────────────────
const COLORS = {
  cpl:    { bg: '#eff6ff', border: '#3b82f6', text: '#1d4ed8', badge: '#dbeafe' },
  bk:     { bg: '#fffbeb', border: '#f59e0b', text: '#92400e', badge: '#fef3c7' },
  cpmk:   { bg: '#f5f3ff', border: '#8b5cf6', text: '#5b21b6', badge: '#ede9fe' },
  sub:    { bg: '#f0fdfa', border: '#14b8a6', text: '#0f766e', badge: '#ccfbf1' },
  score:  { bg: '#f0fdf4', border: '#22c55e', text: '#15803d', badge: '#dcfce7' },
};

const CATEGORY_LABEL: Record<string, string> = {
  SIKAP:               'Sikap',
  PENGETAHUAN:         'Pengetahuan',
  KETERAMPILAN_UMUM:   'KU',
  KETERAMPILAN_KHUSUS: 'KK',
};
const CATEGORY_COLOR: Record<string, string> = {
  SIKAP:               'bg-blue-100 text-blue-700',
  PENGETAHUAN:         'bg-purple-100 text-purple-700',
  KETERAMPILAN_UMUM:   'bg-teal-100 text-teal-700',
  KETERAMPILAN_KHUSUS: 'bg-orange-100 text-orange-700',
};

function scoreColor(avg: number) {
  if (avg >= 75) return '#10b981';
  if (avg >= 60) return '#f59e0b';
  return '#f87171';
}

// ── Custom node: CPL ─────────────────────────────────────
function CplNode({ data }: { data: { code: string; name: string; category: string; selected: boolean } }) {
  const c = COLORS.cpl;
  return (
    <div
      style={{
        background: data.selected ? c.border : c.bg,
        border: `2px solid ${c.border}`,
        color: data.selected ? '#fff' : c.text,
        borderRadius: 14,
        padding: '10px 14px',
        minWidth: 180,
        maxWidth: 220,
        boxShadow: data.selected ? `0 0 0 3px ${c.border}40` : '0 1px 4px #0001',
        transition: 'all .2s',
        cursor: 'pointer',
      }}
    >
      <Handle type="source" position={Position.Right} style={{ background: c.border }} />
      <div className="flex items-start gap-2">
        <Target size={14} style={{ color: data.selected ? '#fff' : c.border, marginTop: 2, flexShrink: 0 }} />
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
            <span className="text-[11px] font-bold">{data.code}</span>
            {data.category && (
              <span
                style={{
                  background: data.selected ? '#ffffff30' : c.badge,
                  color: data.selected ? '#fff' : c.text,
                  padding: '1px 6px',
                  borderRadius: 99,
                  fontSize: 9,
                  fontWeight: 600,
                }}
              >
                {CATEGORY_LABEL[data.category] ?? data.category}
              </span>
            )}
          </div>
          <p className="text-[10px] leading-tight opacity-90 line-clamp-2">{data.name}</p>
        </div>
      </div>
    </div>
  );
}

// ── Custom node: BK ──────────────────────────────────────
function BkNode({ data }: { data: { code: string; name: string } }) {
  const c = COLORS.bk;
  return (
    <div style={{ background: c.bg, border: `1.5px solid ${c.border}`, borderRadius: 12, padding: '8px 12px', minWidth: 160, maxWidth: 200, boxShadow: '0 1px 3px #0001' }}>
      <Handle type="target" position={Position.Left} style={{ background: c.border }} />
      <div className="flex items-start gap-1.5">
        <BookOpenCheck size={12} style={{ color: c.border, marginTop: 1, flexShrink: 0 }} />
        <div>
          <p className="text-[10px] font-bold" style={{ color: c.text }}>{data.code}</p>
          <p className="text-[9px] leading-tight opacity-80 mt-0.5" style={{ color: c.text }}>{data.name}</p>
        </div>
      </div>
    </div>
  );
}

// ── Custom node: CPMK ────────────────────────────────────
function CpmkNode({ data }: { data: { code: string; name: string; subCount: number; avg?: number; expanded: boolean } }) {
  const c = COLORS.cpmk;
  return (
    <div
      style={{
        background: data.expanded ? '#ede9fe' : c.bg,
        border: `2px solid ${data.expanded ? c.border : '#c4b5fd'}`,
        borderRadius: 12,
        padding: '8px 12px',
        minWidth: 200,
        maxWidth: 240,
        boxShadow: data.expanded ? `0 0 0 3px ${c.border}25` : '0 1px 3px #0001',
        cursor: data.subCount > 0 ? 'pointer' : 'default',
        transition: 'all .15s',
      }}
    >
      <Handle type="target" position={Position.Left} style={{ background: c.border }} />
      <Handle type="source" position={Position.Right} style={{ background: c.border }} />
      <div className="flex items-start gap-1.5">
        <BookOpen size={12} style={{ color: c.border, marginTop: 1, flexShrink: 0 }} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 justify-between">
            <p className="text-[10px] font-bold" style={{ color: c.text }}>{data.code}</p>
            <div className="flex items-center gap-1 shrink-0">
              {data.subCount > 0 && (
                <span style={{
                  background: data.expanded ? c.border : c.badge,
                  color: data.expanded ? '#fff' : c.text,
                  padding: '1px 6px', borderRadius: 99, fontSize: 9, fontWeight: 700,
                }}>
                  {data.subCount} sub
                </span>
              )}
              {data.avg !== undefined && (
                <span style={{ background: scoreColor(data.avg) + '20', color: scoreColor(data.avg), padding: '0 5px', borderRadius: 99, fontSize: 9, fontWeight: 700 }}>
                  {data.avg.toFixed(0)}
                </span>
              )}
            </div>
          </div>
          <p className="text-[9px] leading-tight mt-0.5 line-clamp-2" style={{ color: c.text, opacity: 0.8 }}>{data.name}</p>
          {data.subCount > 0 && (
            <p className="text-[9px] mt-1 font-medium" style={{ color: c.border }}>
              {data.expanded ? '▾ tutup sub CPMK' : '▸ lihat sub CPMK'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Custom node: Sub CPMK ────────────────────────────────
function SubCpmkNode({ data }: { data: { code: string; name: string } }) {
  const c = COLORS.sub;
  return (
    <div style={{ background: c.bg, border: `1.5px solid ${c.border}`, borderRadius: 10, padding: '6px 10px', minWidth: 200, maxWidth: 280, boxShadow: '0 1px 2px #0001' }}>
      <Handle type="target" position={Position.Left} style={{ background: c.border, width: 6, height: 6 }} />
      <div className="flex items-start gap-1.5">
        <Layers size={11} style={{ color: c.border, marginTop: 1, flexShrink: 0 }} />
        <div>
          <p className="text-[9px] font-bold" style={{ color: c.text }}>{data.code}</p>
          <p className="text-[8.5px] leading-tight mt-0.5" style={{ color: c.text, opacity: 0.8 }}>{data.name}</p>
        </div>
      </div>
    </div>
  );
}

const nodeTypes: NodeTypes = {
  cplNode:    CplNode,
  bkNode:     BkNode,
  cpmkNode:   CpmkNode,
  subCpmkNode: SubCpmkNode,
};

// ── Layout constants ────────────────────────────────────
const COL_CPL  = 0;
const COL_BK   = 320;
const COL_CPMK = 320;
const COL_SUB  = 620;
const ROW_H    = 90;

// ── Build nodes + edges for selected CPL ────────────────
function buildFlow(
  cpl: { id: string; code: string; name: string; category: string },
  bks: { id: string; code: string; name: string }[],
  cpmks: { id: string; code: string; name: string }[],
  subCpmkMap: Map<string, { id: string; code: string; name: string }[]>,
  scoreMap: Map<string, number[]>,
  expandedCpmkId: string | null,
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  const totalRows = Math.max(bks.length + cpmks.length, 1);
  const cplY = ((totalRows - 1) * ROW_H) / 2;

  // CPL node
  nodes.push({
    id: `cpl-${cpl.id}`,
    type: 'cplNode',
    position: { x: COL_CPL, y: cplY - 30 },
    data: { ...cpl, selected: true },
  });

  // BK nodes (top section)
  bks.forEach((bk, i) => {
    const nodeId = `bk-${bk.id}`;
    nodes.push({ id: nodeId, type: 'bkNode', position: { x: COL_BK, y: i * ROW_H }, data: bk });
    edges.push({ id: `e-cpl-bk-${bk.id}`, source: `cpl-${cpl.id}`, target: nodeId, type: 'smoothstep', animated: false, style: { stroke: '#f59e0b', strokeWidth: 1.5, strokeDasharray: '4 3' }, label: 'BK', labelStyle: { fontSize: 9, fill: '#92400e' } });
  });

  // CPMK nodes (below BKs) — track cumulative Y to handle sub-CPMK expansion
  const cpmkStartY = bks.length > 0 ? bks.length * ROW_H + 30 : 0;
  let cpmkCurY = cpmkStartY;

  cpmks.forEach((cpmk) => {
    const subs = subCpmkMap.get(cpmk.id) ?? [];
    const rawScores = scoreMap.get(cpmk.id) ?? [];
    const avg = rawScores.length > 0 ? rawScores.reduce((s, v) => s + v, 0) / rawScores.length : undefined;
    const isExpanded = expandedCpmkId === cpmk.id;

    const cpmkY = cpmkCurY;
    const nodeId = `cpmk-${cpmk.id}`;

    nodes.push({
      id: nodeId,
      type: 'cpmkNode',
      position: { x: COL_CPMK, y: cpmkY },
      data: {
        ...cpmk,
        subCount: subs.length,
        avg,
        expanded: isExpanded,
      },
    });

    edges.push({
      id: `e-cpl-cpmk-${cpmk.id}`,
      source: `cpl-${cpl.id}`,
      target: nodeId,
      type: 'smoothstep',
      style: { stroke: '#8b5cf6', strokeWidth: 1.5 },
    });

    if (isExpanded && subs.length > 0) {
      const subSpacing = 72;
      const blockH = subs.length * subSpacing;
      const startSubY = cpmkY + (blockH < ROW_H ? (ROW_H - blockH) / 2 : 0);
      subs.forEach((sub, j) => {
        const subId = `sub-${sub.id}`;
        nodes.push({ id: subId, type: 'subCpmkNode', position: { x: COL_SUB, y: startSubY + j * subSpacing }, data: sub });
        edges.push({ id: `e-cpmk-sub-${sub.id}`, source: nodeId, target: subId, type: 'smoothstep', style: { stroke: '#14b8a6', strokeWidth: 1 } });
      });
      cpmkCurY += Math.max(ROW_H, blockH + 20);
    } else {
      cpmkCurY += ROW_H;
    }
  });

  return { nodes, edges };
}

// ── Main Flow Canvas ────────────────────────────────────
function TrackingFlowCanvas({
  cpl, bks, cpmks, subCpmkMap, scoreMap,
}: {
  cpl: { id: string; code: string; name: string; category: string };
  bks: { id: string; code: string; name: string }[];
  cpmks: { id: string; code: string; name: string }[];
  subCpmkMap: Map<string, { id: string; code: string; name: string }[]>;
  scoreMap: Map<string, number[]>;
}) {
  const [expandedCpmkId, setExpandedCpmkId] = useState<string | null>(null);

  const { nodes, edges } = useMemo(
    () => buildFlow(cpl, bks, cpmks, subCpmkMap, scoreMap, expandedCpmkId),
    [cpl, bks, cpmks, subCpmkMap, scoreMap, expandedCpmkId]
  );

  const [flowNodes, setFlowNodes, onNodesChange] = useNodesState(nodes);
  const [flowEdges, setFlowEdges, onEdgesChange] = useEdgesState(edges);

  useEffect(() => { setFlowNodes(nodes); }, [nodes, setFlowNodes]);
  useEffect(() => { setFlowEdges(edges); }, [edges, setFlowEdges]);

  const handleNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    if (node.type === 'cpmkNode') {
      const cpmkId = node.id.replace('cpmk-', '');
      setExpandedCpmkId((prev) => (prev === cpmkId ? null : cpmkId));
    }
  }, []);

  return (
    <ReactFlow
      nodes={flowNodes}
      edges={flowEdges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onNodeClick={handleNodeClick}
      nodeTypes={nodeTypes}
      fitView
      fitViewOptions={{ padding: 0.2 }}
      minZoom={0.3}
      maxZoom={2}
      proOptions={{ hideAttribution: true }}
    >
      <Background color="#e5e7eb" gap={20} size={1} />
      <Controls showInteractive={false} />
      <MiniMap
        nodeColor={(n) => {
          if (n.type === 'cplNode')     return '#3b82f6';
          if (n.type === 'bkNode')     return '#f59e0b';
          if (n.type === 'cpmkNode')   return '#8b5cf6';
          if (n.type === 'subCpmkNode') return '#14b8a6';
          return '#94a3b8';
        }}
        maskColor="#f8fafc80"
        style={{ borderRadius: 8, border: '1px solid #e2e8f0' }}
      />

      {/* Legend */}
      <div
        style={{
          position: 'absolute', top: 12, right: 12, background: 'white',
          border: '1px solid #e2e8f0', borderRadius: 10, padding: '8px 12px',
          fontSize: 10, zIndex: 10, boxShadow: '0 2px 8px #0001',
        }}
      >
        <p style={{ fontWeight: 700, color: '#374151', marginBottom: 6, fontSize: 11 }}>Legenda</p>
        {[
          { color: '#3b82f6', label: 'CPL' },
          { color: '#f59e0b', label: 'Bahan Kajian', dashed: true },
          { color: '#8b5cf6', label: 'CPMK' },
          { color: '#14b8a6', label: 'Sub CPMK' },
        ].map((item) => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
            <div style={{
              width: 24, height: 2.5,
              background: item.color,
              borderRadius: 2,
              borderTop: item.dashed ? `2px dashed ${item.color}` : undefined,
              backgroundImage: item.dashed ? 'none' : undefined,
            }} />
            <span style={{ color: '#6b7280' }}>{item.label}</span>
          </div>
        ))}
        <p style={{ color: '#9ca3af', marginTop: 6, fontSize: 9 }}>Klik CPMK → tampilkan Sub CPMK</p>
      </div>
    </ReactFlow>
  );
}

// ── Main Page ────────────────────────────────────────────
export default function TrackingObePage() {
  const { selectedCurriculum } = useApp();
  const curriculumId = selectedCurriculum?.id;

  const [search, setSearch]               = useState('');
  const [selectedCplId, setSelectedCplId] = useState<string | null>(null);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('');

  // ── Queries ────────────────────────────────────────────
  const { data: cpmkCplMatrix, isLoading: matrixLoading } = useQuery({
    queryKey: ['cpmk-cpl-matrix', curriculumId],
    queryFn: () => cpmkCplMappingService.getMatrix({ curriculumId: curriculumId! }),
    enabled: !!curriculumId,
  });

  const { data: cplBkMatrix } = useQuery({
    queryKey: ['cpl-bk-matrix', curriculumId],
    queryFn: () => cplBkMappingService.getMatrix({ curriculumId: curriculumId! }),
    enabled: !!curriculumId,
  });

  const { data: subCpmkData } = useQuery({
    queryKey: ['sub-cpmk-all', curriculumId],
    queryFn: async () => {
      const PAGE = 100;
      const first = await subCpmkService.getAll({ limit: PAGE, page: 1, curriculumId });
      const total = first.meta?.total ?? 0;
      if (total <= PAGE) return first;
      const pages = Math.ceil(total / PAGE);
      const rest = await Promise.all(
        Array.from({ length: pages - 1 }, (_, i) =>
          subCpmkService.getAll({ limit: PAGE, page: i + 2, curriculumId })
        )
      );
      return { ...first, data: [...first.data, ...rest.flatMap((r) => r.data)] };
    },
    enabled: !!curriculumId,
  });

  const { data: classesData } = useQuery({
    queryKey: ['classes-tracking'],
    queryFn: () => academicClassService.getAll({ limit: 100 }),
  });

  const { data: coursesData } = useQuery({
    queryKey: ['courses-tracking'],
    queryFn: () => courseService.getAll({ limit: 100, isActive: true }),
    staleTime: 5 * 60 * 1000,
  });

  const { data: courseWeightsData } = useQuery({
    queryKey: ['course-weights-obe', selectedCourseId],
    queryFn: () => courseCpmkWeightService.getAll({ courseId: selectedCourseId }),
    enabled: !!selectedCourseId,
  });

  const { data: courseSubCpmkData } = useQuery({
    queryKey: ['course-sub-cpmk-obe', selectedCourseId],
    queryFn: () => subCpmkService.getAll({ courseId: selectedCourseId, limit: 100 }),
    enabled: !!selectedCourseId,
  });

  const { data: scoresData } = useQuery({
    queryKey: ['scores-tracking', selectedClassId],
    queryFn: () => studentCpmkScoreService.getByClass(selectedClassId),
    enabled: !!selectedClassId,
  });

  // ── Derived data ───────────────────────────────────────
  const cpls     = cpmkCplMatrix?.data?.cpls     ?? [];
  const cpmks    = cpmkCplMatrix?.data?.cpmks    ?? [];
  const mappings = cpmkCplMatrix?.data?.mappings ?? [];

  const bks        = cplBkMatrix?.data?.bodyOfKnowledges ?? [];
  const bkMappings = cplBkMatrix?.data?.mappings         ?? [];

  const subCpmks   = subCpmkData?.data ?? [];
  const classes    = classesData?.data ?? [];
  const courses    = (coursesData?.data ?? []) as { id: string; code: string; name: string; semester: number }[];

  // Map: cplId → list of CPMK
  const cplToCpmks = useMemo(() => {
    const map = new Map<string, typeof cpmks>();
    for (const cpl of cpls) {
      const linked = mappings
        .filter((m) => m.cplId === cpl.id)
        .map((m) => cpmks.find((c) => c.id === m.cpmkId))
        .filter((c): c is (typeof cpmks)[number] => !!c);
      map.set(cpl.id, linked);
    }
    return map;
  }, [cpls, cpmks, mappings]);

  // Map: cplId → list of BK
  const cplToBks = useMemo(() => {
    const map = new Map<string, typeof bks>();
    for (const cpl of cpls) {
      const linked = bkMappings
        .filter((m) => m.cplId === cpl.id)
        .map((m) => bks.find((b) => b.id === m.bodyOfKnowledgeId))
        .filter((b): b is (typeof bks)[number] => !!b);
      map.set(cpl.id, linked);
    }
    return map;
  }, [cpls, bks, bkMappings]);

  // Map: cpmkId → list of SubCpmk
  const cpmkToSubs = useMemo(() => {
    const map = new Map<string, { id: string; code: string; name: string }[]>();
    for (const sub of subCpmks) {
      if (!map.has(sub.cpmkId)) map.set(sub.cpmkId, []);
      map.get(sub.cpmkId)!.push({ id: sub.id, code: sub.code, name: sub.name });
    }
    return map;
  }, [subCpmks]);

  // Map: cpmkId → scores
  const scoreMap = useMemo(() => {
    const map = new Map<string, number[]>();
    if (!scoresData?.data) return map;
    for (const s of scoresData.data) {
      if (!map.has(s.cpmkId)) map.set(s.cpmkId, []);
      map.get(s.cpmkId)!.push(s.score);
    }
    return map;
  }, [scoresData]);

  // Set of CPMK IDs in selected course (null = no course filter)
  const courseCpmkIds = useMemo((): Set<string> | null => {
    if (!selectedCourseId) return null;
    const weights = courseWeightsData?.data ?? [];
    return new Set(weights.map((w) => w.cpmkId));
  }, [selectedCourseId, courseWeightsData]);

  // Sub-CPMK map scoped to selected course (falls back to full map when no course)
  const effectiveSubCpmkMap = useMemo(() => {
    if (!selectedCourseId || !courseSubCpmkData?.data) return cpmkToSubs;
    const map = new Map<string, { id: string; code: string; name: string }[]>();
    for (const sub of courseSubCpmkData.data) {
      if (!map.has(sub.cpmkId)) map.set(sub.cpmkId, []);
      map.get(sub.cpmkId)!.push({ id: sub.id, code: sub.code, name: sub.name });
    }
    return map;
  }, [selectedCourseId, courseSubCpmkData, cpmkToSubs]);

  // Filter CPLs — by course (if selected) then by search
  const filteredCpls = useMemo(() => {
    let result = cpls;
    if (courseCpmkIds) {
      result = result.filter((cpl) =>
        (cplToCpmks.get(cpl.id) ?? []).some((c) => courseCpmkIds.has(c.id))
      );
    }
    if (!search.trim()) return result;
    const q = search.toLowerCase();
    return result.filter(
      (cpl) =>
        cpl.code.toLowerCase().includes(q) ||
        cpl.name.toLowerCase().includes(q) ||
        (cplToCpmks.get(cpl.id) ?? []).some((c) => c.code.toLowerCase().includes(q))
    );
  }, [cpls, cplToCpmks, search, courseCpmkIds]);

  // Auto-select first CPL
  const activeCplId = selectedCplId ?? filteredCpls[0]?.id ?? null;
  const activeCpl   = cpls.find((c) => c.id === activeCplId);

  if (!curriculumId) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400">
        <AlertCircle className="w-10 h-10 mb-3 text-yellow-400" />
        <p className="text-sm">Pilih kurikulum terlebih dahulu (pojok kiri atas)</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] gap-0">

      {/* ── Header strip ──────────────────────────────── */}
      <div className="shrink-0 px-5 py-3 bg-white border-b border-gray-100 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 mr-2">
          <Target size={17} className="text-primary" />
          <div>
            <h1 className="text-sm font-bold text-gray-800 leading-tight">Tracking OBE</h1>
            <p className="text-[10px] text-gray-400">{selectedCurriculum?.name}</p>
          </div>
        </div>

        {/* Legend pills */}
        <div className="hidden md:flex items-center gap-2 flex-1 flex-wrap">
          {[
            { color: '#3b82f6', label: `CPL (${filteredCpls.length}${selectedCourseId ? `/${cpls.length}` : ''})` },
            { color: '#f59e0b', label: `Bahan Kajian (${bks.length})` },
            { color: '#8b5cf6', label: `CPMK (${courseCpmkIds ? courseCpmkIds.size : cpmks.length}${selectedCourseId ? `/${cpmks.length}` : ''})` },
            { color: '#14b8a6', label: `Sub CPMK (${selectedCourseId ? (courseSubCpmkData?.data?.length ?? '…') : subCpmks.length})` },
          ].map((p) => (
            <span key={p.label} className="flex items-center gap-1.5 text-[11px] text-gray-600">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: p.color }} />
              {p.label}
            </span>
          ))}
          {selectedCourseId && (
            <span className="text-[11px] px-2 py-0.5 bg-primary/10 text-primary rounded-full font-medium">
              Filter: {courses.find((c) => c.id === selectedCourseId)?.code ?? '…'}
            </span>
          )}
        </div>

        {/* Course filter */}
        <select
          value={selectedCourseId}
          onChange={(e) => { setSelectedCourseId(e.target.value); setSelectedCplId(null); }}
          className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 shrink-0 max-w-[220px]"
        >
          <option value="">— Semua mata kuliah —</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.code} · {c.name}
            </option>
          ))}
        </select>

        {/* Class selector for scores */}
        <select
          value={selectedClassId}
          onChange={(e) => setSelectedClassId(e.target.value)}
          className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 shrink-0"
        >
          <option value="">— Tanpa overlay nilai —</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.course.name} · Kelas {c.code}
            </option>
          ))}
        </select>
      </div>

      {/* ── Body: sidebar + flow canvas ────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* CPL Sidebar */}
        <div className="w-64 shrink-0 bg-white border-r border-gray-100 flex flex-col overflow-hidden">
          {/* Search */}
          <div className="p-3 border-b border-gray-100">
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Cari CPL / CPMK..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-7 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50"
              />
            </div>
          </div>

          {/* CPL list */}
          <div className="flex-1 overflow-y-auto py-1">
            {matrixLoading ? (
              <div className="flex items-center justify-center h-20">
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredCpls.length === 0 ? (
              <p className="text-xs text-gray-400 italic text-center py-6">Tidak ditemukan</p>
            ) : (
              filteredCpls.map((cpl) => {
                const linkedCpmks = cplToCpmks.get(cpl.id) ?? [];
                const linkedBks   = cplToBks.get(cpl.id) ?? [];
                const isActive    = activeCplId === cpl.id;
                const cpmkWithSub = linkedCpmks.filter((c) => (cpmkToSubs.get(c.id)?.length ?? 0) > 0).length;
                const cpmkWithScore = linkedCpmks.filter((c) => (scoreMap.get(c.id)?.length ?? 0) > 0).length;

                return (
                  <button
                    key={cpl.id}
                    onClick={() => setSelectedCplId(cpl.id)}
                    className={`w-full text-left px-3 py-2.5 border-b border-gray-50 transition-all group ${
                      isActive
                        ? 'bg-blue-50 border-l-[3px] border-l-blue-500'
                        : 'hover:bg-gray-50 border-l-[3px] border-l-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-bold ${isActive ? 'text-blue-700' : 'text-blue-600'}`}>
                        {cpl.code}
                      </span>
                      {cpl.category && (
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${CATEGORY_COLOR[cpl.category] ?? 'bg-gray-100 text-gray-600'}`}>
                          {CATEGORY_LABEL[cpl.category] ?? cpl.category}
                        </span>
                      )}
                      <ChevronRight size={10} className={`ml-auto shrink-0 transition-transform ${isActive ? 'rotate-90 text-blue-500' : 'text-gray-300 group-hover:text-gray-400'}`} />
                    </div>
                    <p className={`text-[10px] leading-tight line-clamp-2 ${isActive ? 'text-blue-600' : 'text-gray-500'}`}>
                      {cpl.name}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      {linkedBks.length > 0 && (
                        <span className="text-[9px] bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded-full">
                          {linkedBks.length} BK
                        </span>
                      )}
                      <span className="text-[9px] bg-violet-50 text-violet-600 px-1.5 py-0.5 rounded-full">
                        {linkedCpmks.length} CPMK
                      </span>
                      {cpmkWithSub > 0 && (
                        <span className="text-[9px] bg-teal-50 text-teal-600 px-1.5 py-0.5 rounded-full">
                          {cpmkWithSub} ada sub
                        </span>
                      )}
                      {cpmkWithScore > 0 && (
                        <span className="text-[9px] bg-green-50 text-green-600 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                          <BarChart3 size={8} /> {cpmkWithScore} nilai
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* React Flow canvas */}
        <div className="flex-1 bg-gray-50 overflow-hidden relative">
          {activeCpl ? (
            <ReactFlowProvider>
              <TrackingFlowCanvas
                key={`${activeCplId}-${selectedCourseId}`}
                cpl={activeCpl}
                bks={cplToBks.get(activeCpl.id) ?? []}
                cpmks={(cplToCpmks.get(activeCpl.id) ?? []).filter(
                  (c) => !courseCpmkIds || courseCpmkIds.has(c.id)
                )}
                subCpmkMap={effectiveSubCpmkMap}
                scoreMap={scoreMap}
              />
            </ReactFlowProvider>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <Target size={40} className="mb-3 opacity-20" />
              <p className="text-sm">Pilih CPL di sebelah kiri</p>
            </div>
          )}

          {/* Score info overlay */}
          {selectedClassId && scoresData && (
            <div className="absolute bottom-3 left-3 bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs shadow-sm z-10">
              <p className="font-semibold text-gray-700">
                Nilai overlay dari: <span className="text-indigo-600">{classes.find((c) => c.id === selectedClassId)?.course.name}</span>
              </p>
              <p className="text-gray-400 mt-0.5">{scoresData.meta?.total ?? 0} entri · angka di node = rata-rata raw score</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
