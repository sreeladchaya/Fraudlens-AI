/**
 * FraudLens — Knowledge Graph Explorer
 * Interactive Cytoscape.js canvas with multi-hop traversals, suspicious subgraph isolation,
 * neighbor expansion, and rule evidence explanation drawer.
 */

import React, { useEffect, useRef, useState } from 'react';
import cytoscape, { Core, EventObject } from 'cytoscape';
import { apiClient } from '../lib/api.ts';
import { KnowledgeGraphData, GraphNode, GraphEdge, EntityType } from '../types/index.ts';
import { SeverityBadge, StatusBadge } from '../components/common/Badge.tsx';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Filter,
  Search,
  Eye,
  Layers,
  Info,
  X,
  ExternalLink,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';

interface GraphExplorerProps {
  initialRingId?: string;
  onNavigateToCase?: (caseId: string) => void;
}

export const GraphExplorerPage: React.FC<GraphExplorerProps> = ({ initialRingId }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);

  const [graphData, setGraphData] = useState<KnowledgeGraphData | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('ALL');
  const [flaggedOnlyFilter, setFlaggedOnlyFilter] = useState(false);
  const [activeLayout, setActiveLayout] = useState<'cose' | 'concentric' | 'circle' | 'breadthfirst'>('cose');
  const [isLoading, setIsLoading] = useState(true);

  // Fetch full graph or ring-filtered graph
  useEffect(() => {
    const fetchGraph = async () => {
      setIsLoading(true);
      try {
        if (initialRingId) {
          const res = await apiClient.get<{ ring: any; subgraph: KnowledgeGraphData }>(`/api/rings/${initialRingId}`);
          setGraphData(res.subgraph);
        } else {
          const res = await apiClient.get<KnowledgeGraphData>('/api/graph/full');
          setGraphData(res);
        }
      } catch (err) {
        console.error('Failed to load graph data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGraph();
  }, [initialRingId]);

  // Color & Shape mapping for Entity Types
  const getNodeColor = (type: EntityType, isFlagged?: boolean) => {
    if (isFlagged) return '#e11d48'; // crimson
    switch (type) {
      case 'CUSTOMER': return '#2563eb'; // blue
      case 'ACCOUNT': return '#0891b2'; // cyan
      case 'DEVICE': return '#7c3aed'; // purple
      case 'IP_ADDRESS': return '#d97706'; // amber
      case 'MERCHANT': return '#059669'; // emerald
      case 'TRANSACTION': return '#64748b'; // slate
      default: return '#475569';
    }
  };

  // Initialize and update Cytoscape
  useEffect(() => {
    if (!containerRef.current || !graphData) return;

    // Filter nodes based on state
    let filteredNodes = graphData.nodes;
    if (selectedTypeFilter !== 'ALL') {
      filteredNodes = filteredNodes.filter(n => n.type === selectedTypeFilter);
    }
    if (flaggedOnlyFilter) {
      filteredNodes = filteredNodes.filter(n => n.isFlagged);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filteredNodes = filteredNodes.filter(n =>
        n.label.toLowerCase().includes(q) || n.id.toLowerCase().includes(q)
      );
    }

    const visibleNodeIds = new Set(filteredNodes.map(n => n.id));
    const filteredEdges = graphData.edges.filter(
      e => visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target)
    );

    const cyElements = [
      ...filteredNodes.map(node => ({
        data: {
          id: node.id,
          label: node.label,
          type: node.type,
          isFlagged: node.isFlagged,
          riskScore: node.riskScore || 0,
          rawProperties: node.properties,
        },
      })),
      ...filteredEdges.map(edge => ({
        data: {
          id: edge.id,
          source: edge.source,
          target: edge.target,
          label: edge.label,
          type: edge.type,
          isFlagged: edge.isFlagged,
        },
      })),
    ];

    if (cyRef.current) {
      cyRef.current.destroy();
    }

    const cy = cytoscape({
      container: containerRef.current,
      elements: cyElements,
      style: [
        {
          selector: 'node',
          style: {
            label: 'data(label)',
            'font-family': 'Plus Jakarta Sans, sans-serif',
            'font-size': '10px',
            'font-weight': 600,
            'text-valign': 'bottom',
            'text-margin-y': 5,
            color: '#1e293b',
            'background-color': (ele: any) => getNodeColor(ele.data('type'), ele.data('isFlagged')),
            width: (ele: any) => (ele.data('isFlagged') ? 34 : 26),
            height: (ele: any) => (ele.data('isFlagged') ? 34 : 26),
            'border-width': 2,
            'border-color': (ele: any) => (ele.data('isFlagged') ? '#ffe4e6' : '#ffffff'),
            'border-opacity': 0.9,
          },
        },
        {
          selector: 'node:selected',
          style: {
            'border-width': 4,
            'border-color': '#1d4ed8',
            'border-opacity': 1,
          },
        },
        {
          selector: 'edge',
          style: {
            width: (ele: any) => (ele.data('isFlagged') ? 2.5 : 1.5),
            'line-color': (ele: any) => (ele.data('isFlagged') ? '#f43f5e' : '#cbd5e1'),
            'target-arrow-color': (ele: any) => (ele.data('isFlagged') ? '#f43f5e' : '#94a3b8'),
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'arrow-scale': 0.8,
            label: 'data(label)',
            'font-size': '8px',
            'font-family': 'JetBrains Mono, monospace',
            'text-rotation': 'autorotate',
            'text-margin-y': -6,
            color: '#64748b',
          },
        },
      ],
      layout: {
        name: activeLayout,
        animate: true,
        animationDuration: 400,
        padding: 50,
      } as any,
    });

    cy.on('tap', 'node', (evt: EventObject) => {
      const nodeData = evt.target.data();
      setSelectedNode({
        id: nodeData.id,
        label: nodeData.label,
        type: nodeData.type,
        properties: nodeData.rawProperties || {},
        riskScore: nodeData.riskScore,
        isFlagged: nodeData.isFlagged,
      });

      // Highlight connected neighbors
      cy.elements().removeClass('highlighted faded');
      const neighborhood = evt.target.neighborhood().add(evt.target);
      cy.elements().difference(neighborhood).addClass('faded');
      neighborhood.addClass('highlighted');
    });

    cy.on('tap', (evt: EventObject) => {
      if (evt.target === cy) {
        setSelectedNode(null);
        cy.elements().removeClass('highlighted faded');
      }
    });

    cyRef.current = cy;

    return () => {
      if (cyRef.current) {
        cyRef.current.destroy();
      }
    };
  }, [graphData, selectedTypeFilter, flaggedOnlyFilter, searchQuery, activeLayout]);

  const handleZoomIn = () => cyRef.current?.zoom(cyRef.current.zoom() * 1.25);
  const handleZoomOut = () => cyRef.current?.zoom(cyRef.current.zoom() * 0.8);
  const handleFit = () => cyRef.current?.fit(undefined, 40);

  const handleExpandNeighbors = async () => {
    if (!selectedNode) return;
    try {
      const res = await apiClient.get<{ nodes: GraphNode[]; edges: GraphEdge[] }>(
        `/api/graph/subgraph/${selectedNode.id}?depth=1`
      );

      if (graphData) {
        const existingNodeIds = new Set(graphData.nodes.map(n => n.id));
        const existingEdgeIds = new Set(graphData.edges.map(e => e.id));

        const newNodes = res.nodes.filter(n => !existingNodeIds.has(n.id));
        const newEdges = res.edges.filter(e => !existingEdgeIds.has(e.id));

        setGraphData({
          nodes: [...graphData.nodes, ...newNodes],
          edges: [...graphData.edges, ...newEdges],
        });
      }
    } catch (err) {
      console.error('Failed to expand neighbors:', err);
    }
  };

  return (
    <div className="relative h-[calc(100vh-4rem)] flex flex-col bg-slate-50 overflow-hidden">
      {/* Top Toolbar */}
      <div className="h-14 px-6 bg-white border-b border-slate-200 flex items-center justify-between gap-4 z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search graph nodes..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded text-slate-800 placeholder-slate-400 w-48 sm:w-64 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedTypeFilter}
              onChange={e => setSelectedTypeFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded px-2 py-1.5 text-slate-700 focus:outline-none"
            >
              <option value="ALL">All Entity Types</option>
              <option value="CUSTOMER">Customers</option>
              <option value="ACCOUNT">Accounts</option>
              <option value="DEVICE">Devices</option>
              <option value="IP_ADDRESS">IP Addresses</option>
              <option value="MERCHANT">Merchants</option>
              <option value="TRANSACTION">Transactions</option>
            </select>
          </div>

          <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={flaggedOnlyFilter}
              onChange={e => setFlaggedOnlyFilter(e.target.checked)}
              className="rounded text-rose-600 focus:ring-0"
            />
            <span>Suspicious Only</span>
          </label>
        </div>

        {/* Layout & Zoom Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 p-0.5 rounded border border-slate-200 text-xs">
            {(['cose', 'concentric', 'breadthfirst', 'circle'] as const).map(l => (
              <button
                key={l}
                onClick={() => setActiveLayout(l)}
                className={`px-2 py-1 rounded capitalize font-medium transition-colors cursor-pointer ${
                  activeLayout === l ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {l === 'cose' ? 'Force' : l}
              </button>
            ))}
          </div>

          <div className="flex items-center border border-slate-200 rounded bg-white overflow-hidden">
            <button
              onClick={handleZoomIn}
              className="p-1.5 text-slate-600 hover:bg-slate-50 hover:text-slate-900 border-r border-slate-200 cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={handleZoomOut}
              className="p-1.5 text-slate-600 hover:bg-slate-50 hover:text-slate-900 border-r border-slate-200 cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={handleFit}
              className="p-1.5 text-slate-600 hover:bg-slate-50 hover:text-slate-900 cursor-pointer"
              title="Fit to Screen"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Canvas & Overlay Legend */}
      <div className="relative flex-1 w-full h-full bg-[#fcfcfd]">
        {isLoading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/70 backdrop-blur-xs">
            <div className="text-center space-y-2">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-slate-600 font-medium">Rendering Knowledge Graph Topology...</p>
            </div>
          </div>
        )}

        <div ref={containerRef} className="w-full h-full cytoscape-canvas" />

        {/* Legend Overlay */}
        <div className="absolute bottom-4 left-4 z-10 bg-white/95 backdrop-blur-xs border border-slate-200 rounded-lg p-3 shadow-xs space-y-2 text-xs">
          <span className="font-semibold text-slate-900 block text-[11px] uppercase tracking-wider">Graph Ontology</span>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-slate-600">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
              <span>Customer</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-600" />
              <span>Account</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-600" />
              <span>Device</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-600" />
              <span>IP Address</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
              <span>Merchant</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600" />
              <span className="font-semibold text-rose-700">Flagged (Fraud)</span>
            </div>
          </div>
        </div>

        {/* Selected Node Details Drawer */}
        {selectedNode && (
          <div className="absolute top-4 right-4 z-20 w-80 sm:w-96 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden animate-in slide-in-from-right duration-200 flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase text-slate-500 font-bold tracking-wider">
                  {selectedNode.type} NODE
                </span>
                <h3 className="text-sm font-bold text-slate-900 truncate max-w-[240px]">
                  {selectedNode.label}
                </h3>
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4 overflow-y-auto flex-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Risk Severity</span>
                <SeverityBadge
                  severity={
                    (selectedNode.riskScore || 0) >= 90
                      ? 'CRITICAL'
                      : (selectedNode.riskScore || 0) >= 70
                      ? 'HIGH'
                      : (selectedNode.riskScore || 0) >= 40
                      ? 'MEDIUM'
                      : 'LOW'
                  }
                  score={selectedNode.riskScore}
                />
              </div>

              <div className="space-y-1.5">
                <span className="font-semibold text-slate-700">Entity Identifier</span>
                <div className="p-2 bg-slate-50 rounded border border-slate-200 font-mono text-[11px] text-slate-800 break-all">
                  {selectedNode.id}
                </div>
              </div>

              {/* Node Properties */}
              <div className="space-y-2">
                <span className="font-semibold text-slate-700">Ontology Attributes</span>
                <div className="bg-slate-50 border border-slate-200 rounded divide-y divide-slate-100">
                  {Object.entries(selectedNode.properties).map(([k, v]) => (
                    <div key={k} className="p-2 flex items-center justify-between gap-2">
                      <span className="text-slate-500 font-mono text-[11px]">{k}</span>
                      <span className="font-medium text-slate-900 truncate max-w-[180px]">
                        {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col gap-2">
                <button
                  onClick={handleExpandNeighbors}
                  className="w-full py-2 px-3 text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 rounded hover:bg-blue-100 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Traverse & Expand Immediate Neighbors</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
