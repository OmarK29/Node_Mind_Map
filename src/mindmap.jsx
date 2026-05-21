import { useState, useRef, useEffect, useCallback } from "react";
import { supabase } from "./supabase.js";

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,300;0,400;0,500;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');`;

const STYLES = `
* { box-sizing: border-box; margin: 0; padding: 0; }
body { background: #0e0f11; font-family: 'DM Sans', sans-serif; color: #e2e0da; overflow: hidden; height: 100vh; height: 100dvh; }

:root {
  --bg: #0e0f11;
  --surface: #161719;
  --surface2: #1e2023;
  --border: #2a2c30;
  --border2: #363840;
  --text: #e2e0da;
  --muted: #7a7870;
  --accent: #c8b97a;
  --accent2: #7ab8c8;
  --danger: #c87a7a;
  --node-header: #1a1c1f;
  --mono: 'DM Mono', monospace;
}

.app { display: flex; height: 100vh; height: 100dvh; width: 100vw; position: relative; }

.canvas-wrap { flex: 1; position: relative; overflow: hidden; cursor: default; touch-action: none; -webkit-tap-highlight-color: transparent; }
.canvas-wrap.panning { cursor: grabbing; }
.canvas-wrap.connecting { cursor: crosshair; }
.canvas-wrap.connecting .node { cursor: pointer; }
.canvas-wrap.connecting .node.conn-source { cursor: not-allowed; }
.canvas-inner { position: absolute; transform-origin: 0 0; will-change: transform; }

.grid-bg { position: absolute; inset: 0; pointer-events: none; }

.node {
  position: absolute;
  min-width: 60px;
  background: var(--node-header);
  border: 1px solid var(--border);
  border-radius: 6px;
  cursor: grab;
  user-select: none;
  transition: border-color 0.15s, box-shadow 0.15s;
  box-shadow: 0 2px 12px rgba(0,0,0,0.4);
}
.node:hover { border-color: var(--border2); }
.node.selected { border-color: var(--accent); box-shadow: 0 0 0 1px var(--accent), 0 2px 16px rgba(200,185,122,0.15); }
.node.header-node { border-color: var(--accent2); }
.node.dragging { cursor: grabbing; box-shadow: 0 8px 32px rgba(0,0,0,0.6); z-index: 100; }
.node.conn-source { border-color: var(--accent2); box-shadow: 0 0 0 2px var(--accent2), 0 2px 20px rgba(122,184,200,0.3); }
.node.multi-selected { border-color: var(--accent2); box-shadow: 0 0 0 1px var(--accent2), 0 2px 16px rgba(122,184,200,0.12); }

.sel-box { position: absolute; border: 1.5px dashed var(--accent2); background: rgba(122,184,200,0.06); border-radius: 3px; pointer-events: none; z-index: 50; }

.node-img { width: 100%; display: block; max-height: 180px; object-fit: cover; border-radius: 0 0 5px 5px; }

.map-item { display: flex; align-items: center; gap: 8px; padding: 7px 10px; border: 1px solid var(--border); border-radius: 5px; cursor: pointer; transition: border-color 0.15s; }
.map-item:hover { border-color: var(--border2); }
.map-item.active { border-color: var(--accent); background: rgba(200,185,122,0.06); }
.map-item-name { flex: 1; font-size: 12px; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; }
.map-item-name input { background: transparent; border: none; outline: none; color: var(--text); font-size: 12px; width: 100%; font-family: 'DM Sans', sans-serif; }
.bg-type-row { display: flex; gap: 4px; }
.bg-type-btn { flex: 1; padding: 5px 2px; border-radius: 4px; border: 1px solid var(--border2); background: var(--surface2); color: var(--muted); font-size: 10px; cursor: pointer; text-align: center; transition: all 0.15s; font-family: 'DM Sans', sans-serif; }
.bg-type-btn:hover { color: var(--text); }
.bg-type-btn.active { border-color: var(--accent); color: var(--accent); }

.node-name { padding: 8px 12px 7px; font-size: 12px; font-weight: 500; letter-spacing: 0.04em; border-bottom: 1px solid var(--border); display: flex; align-items: flex-start; gap: 6px; }
.node-name-text { flex: 1; min-width: 0; word-break: break-word; overflow-wrap: break-word; padding-top: 1px; }
.node.header-node .node-name { color: var(--accent2); }
.node-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--accent); flex-shrink: 0; }
.node.header-node .node-dot { background: var(--accent2); }
.node-id-badge { font-size: 9px; color: var(--border2); font-family: var(--mono); padding: 2px 12px 1px; border-bottom: 1px solid var(--border); letter-spacing: 0.03em; }

.node-body { padding: 7px 12px 8px; font-size: 11px; color: var(--muted); line-height: 1.5; font-family: var(--mono); white-space: pre-wrap; word-break: break-word; }

.node-neighbors { padding: 4px 12px 8px; border-top: 1px solid var(--border); }
.node-neighbors-label { font-size: 9px; color: var(--muted); letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 4px; margin-top: 4px; }
.node-neighbor-item { font-size: 10px; color: #5a6875; font-family: var(--mono); padding: 1px 0; display: flex; gap: 4px; }
.node-neighbor-item .rel { color: var(--accent); opacity: 0.7; }

.port { position: absolute; width: 10px; height: 10px; border-radius: 50%; background: var(--surface2); border: 1.5px solid var(--border2); cursor: crosshair; transition: background 0.1s, border-color 0.1s, transform 0.1s; z-index: 10; }
.port:hover { background: var(--accent); border-color: var(--accent); transform: scale(1.3); }
.port.top    { top: -6px; left: 50%; transform: translateX(-50%); }
.port.bottom { bottom: -6px; left: 50%; transform: translateX(-50%); }
.port.left   { left: -6px; top: 50%; transform: translateY(-50%); }
.port.right  { right: -6px; top: 50%; transform: translateY(-50%); }
.port.top:hover    { transform: translateX(-50%) scale(1.3); }
.port.bottom:hover { transform: translateX(-50%) scale(1.3); }
.port.left:hover   { transform: translateY(-50%) scale(1.3); }
.port.right:hover  { transform: translateY(-50%) scale(1.3); }

.edges-svg { position: absolute; inset: 0; pointer-events: none; overflow: visible; }
.edge-path { fill: none; stroke: var(--border2); stroke-width: 1.5; transition: stroke 0.15s; }
.edge-path.selected { stroke: var(--accent); }
.edge-hit { fill: none; stroke: transparent; stroke-width: 12; pointer-events: stroke; cursor: pointer; }
.edge-label-bg { fill: var(--surface); }
.edge-label-text { font-family: var(--mono); font-size: 10px; fill: var(--muted); }
.edge-rel-text { font-family: var(--mono); font-size: 9px; fill: var(--accent); opacity: 0.8; }

.sidebar { position: relative; background: var(--surface); border-left: 1px solid var(--border); display: flex; flex-direction: column; overflow: hidden; flex-shrink: 0; min-width: 180px; max-width: 500px; }
.sidebar-resize { position: absolute; left: 0; top: 0; bottom: 0; width: 5px; cursor: col-resize; z-index: 20; transition: background 0.15s; }
.sidebar-resize:hover { background: rgba(122,184,200,0.3); }
.sidebar-header { padding: 12px 16px 0; display: flex; align-items: center; justify-content: space-between; }
.sidebar-title { font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted); font-weight: 500; }
.sidebar-tabs { display: flex; border-bottom: 1px solid var(--border); padding: 0 8px; margin-top: 8px; gap: 2px; }
.sidebar-tab { flex: 1; padding: 7px 4px; font-size: 11px; text-align: center; cursor: pointer; color: var(--muted); background: none; border: none; border-bottom: 2px solid transparent; transition: color 0.15s, border-color 0.15s; font-family: 'DM Sans', sans-serif; letter-spacing: 0.04em; margin-bottom: -1px; }
.sidebar-tab:hover { color: var(--text); }
.sidebar-tab.active { color: var(--text); border-bottom-color: var(--accent); }
.sidebar-body { flex: 1; overflow-y: auto; padding: 12px; display: flex; flex-direction: column; gap: 10px; }
.sidebar-body::-webkit-scrollbar { width: 3px; }
.sidebar-body::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 2px; }

.field { display: flex; flex-direction: column; gap: 4px; position: relative; }
.field label { font-size: 10px; color: var(--muted); letter-spacing: 0.06em; text-transform: uppercase; }
.field input, .field textarea, .field select { background: var(--surface2); border: 1px solid var(--border); border-radius: 4px; padding: 6px 8px; font-size: 12px; color: var(--text); font-family: 'DM Sans', sans-serif; outline: none; transition: border-color 0.15s; resize: none; }
.field input:focus, .field textarea:focus, .field select:focus { border-color: var(--accent2); }
.field select option { background: var(--surface2); }
.field textarea { min-height: 70px; font-family: var(--mono); font-size: 11px; }

.conn-dropdown { position: absolute; top: calc(100% + 2px); left: 0; right: 0; background: var(--surface2); border: 1px solid var(--border2); border-radius: 4px; z-index: 200; max-height: 160px; overflow-y: auto; box-shadow: 0 4px 16px rgba(0,0,0,0.5); }
.conn-dropdown-item { padding: 6px 10px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; font-size: 12px; gap: 8px; }
.conn-dropdown-item:hover { background: var(--border); }
.conn-dropdown-id { font-size: 9px; color: var(--muted); font-family: var(--mono); flex-shrink: 0; }
.conn-no-result { padding: 8px 10px; font-size: 11px; color: var(--muted); font-style: italic; }

.conn-item { display: flex; align-items: center; gap: 6px; font-size: 11px; color: var(--muted); padding: 3px 0; }
.conn-item-name { color: var(--text); cursor: pointer; flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.conn-item-name:hover { color: var(--accent2); }
.conn-item-label { color: var(--accent2); font-family: var(--mono); font-size: 10px; }
.conn-remove { background: none; border: none; cursor: pointer; color: var(--danger); font-size: 14px; padding: 0 2px; opacity: 0.5; line-height: 1; flex-shrink: 0; }
.conn-remove:hover { opacity: 1; }

.btn { padding: 6px 12px; border-radius: 4px; border: 1px solid var(--border2); background: var(--surface2); color: var(--text); font-size: 11px; font-family: 'DM Sans', sans-serif; cursor: pointer; transition: background 0.15s, border-color 0.15s; letter-spacing: 0.03em; }
.btn:hover { background: var(--border); border-color: var(--muted); }
.btn.primary { background: var(--accent); color: #0e0f11; border-color: var(--accent); font-weight: 500; }
.btn.primary:hover { background: #d4c68e; }
.btn.danger { border-color: var(--danger); color: var(--danger); }
.btn.danger:hover { background: rgba(200,122,122,0.1); }
.btn-row { display: flex; gap: 6px; flex-wrap: wrap; }

.toggle-group { display: flex; flex-direction: column; gap: 6px; }
.toggle-row { display: flex; align-items: center; justify-content: space-between; padding: 5px 0; gap: 8px; }
.toggle-label { font-size: 11px; color: var(--muted); flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.toggle { position: relative; width: 28px; height: 16px; cursor: pointer; flex-shrink: 0; }
.toggle input { opacity: 0; width: 0; height: 0; position: absolute; }
.toggle-track { position: absolute; inset: 0; background: var(--border2); border-radius: 8px; transition: background 0.2s; }
.toggle input:checked + .toggle-track { background: var(--accent2); }
.toggle-thumb { position: absolute; top: 2px; left: 2px; width: 12px; height: 12px; background: white; border-radius: 50%; transition: transform 0.2s; }
.toggle input:checked ~ .toggle-thumb { transform: translateX(12px); }

.section-label { font-size: 9px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--border2); padding: 4px 0 2px; border-top: 1px solid var(--border); margin-top: 4px; }

.toolbar { position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%); display: flex; gap: 2px; background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 5px; box-shadow: 0 4px 20px rgba(0,0,0,0.5); z-index: 50; white-space: nowrap; }
.tool-btn { padding: 6px 12px; border-radius: 5px; border: none; background: transparent; color: var(--muted); font-size: 11px; cursor: pointer; font-family: 'DM Sans', sans-serif; letter-spacing: 0.04em; transition: background 0.15s, color 0.15s; }
.tool-btn:hover { background: var(--surface2); color: var(--text); }
.tool-btn.active { background: var(--surface2); color: var(--accent); }
.tool-btn:disabled { opacity: 0.25; cursor: not-allowed; }
.tool-btn:disabled:hover { background: transparent; color: var(--muted); }
.tool-sep { width: 1px; background: var(--border); margin: 4px 2px; align-self: stretch; }

.infobar { position: absolute; top: 12px; left: 12px; background: var(--surface); border: 1px solid var(--border); border-radius: 5px; padding: 6px 12px; font-size: 10px; color: var(--muted); font-family: var(--mono); letter-spacing: 0.04em; z-index: 50; display: flex; gap: 12px; align-items: center; }
.infobar span { color: var(--text); }
.infobar-hint { color: var(--accent2) !important; font-size: 9px; }

.empty-hint { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); text-align: center; pointer-events: none; opacity: 0.3; }
.empty-hint .big { font-size: 48px; margin-bottom: 12px; }
.empty-hint p { font-size: 13px; color: var(--muted); }

.connecting-preview { stroke: var(--accent2); stroke-dasharray: 6 4; stroke-width: 1.5; fill: none; pointer-events: none; }

.help-block { display: flex; flex-direction: column; gap: 4px; }
.shortcut-row { display: flex; justify-content: space-between; align-items: baseline; padding: 4px 0; border-bottom: 1px solid var(--border); gap: 8px; }
.shortcut-row:last-child { border-bottom: none; }
.shortcut-key { font-family: var(--mono); font-size: 11px; color: var(--text); white-space: nowrap; flex-shrink: 0; }
.shortcut-desc { font-size: 11px; color: var(--muted); text-align: right; }
.prompt-card { background: var(--bg); border: 1px solid var(--border); border-radius: 5px; padding: 10px 12px; position: relative; }
.prompt-card pre { font-family: var(--mono); font-size: 10px; color: var(--muted); white-space: pre-wrap; word-break: break-word; line-height: 1.55; margin: 0; padding-right: 44px; }
.prompt-copy { position: absolute; top: 8px; right: 8px; background: var(--surface2); border: 1px solid var(--border2); color: var(--muted); font-size: 10px; padding: 3px 7px; border-radius: 3px; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: color 0.15s, border-color 0.15s; }
.prompt-copy:hover { color: var(--text); border-color: var(--muted); }
.prompt-copy.copied { color: var(--accent); border-color: var(--accent); }
.help-tip { font-size: 11px; color: var(--muted); line-height: 1.6; }
.help-tip b { color: var(--text); font-weight: 500; }

/* Mobile sidebar toggle */
.sidebar-toggle { display: none; position: absolute; top: 12px; right: 12px; z-index: 50; background: var(--surface); border: 1px solid var(--border); border-radius: 5px; width: 38px; height: 38px; color: var(--muted); font-size: 18px; cursor: pointer; align-items: center; justify-content: center; }

/* Mobile */
@media (max-width: 767px) {
  .sidebar-toggle { display: flex; }
  .sidebar { position: absolute; right: 0; top: 0; height: 100%; z-index: 100; width: min(300px, 88vw) !important; transform: translateX(101%); transition: transform 0.25s ease; box-shadow: -4px 0 24px rgba(0,0,0,0.7); }
  .sidebar.open { transform: translateX(0); }
  .sidebar-resize { display: none; }
  .port { width: 20px; height: 20px; }
  .port.top    { top: -10px; }  .port.bottom { bottom: -10px; }
  .port.left   { left: -10px; }
  .port.right  { right: -10px; }
  .port.top:hover    { transform: translateX(-50%) scale(1.2); }
  .port.bottom:hover { transform: translateX(-50%) scale(1.2); }
  .port.left:hover   { transform: translateY(-50%) scale(1.2); }
  .port.right:hover  { transform: translateY(-50%) scale(1.2); }
  .toolbar { left: 8px; right: 8px; transform: none; overflow-x: auto; justify-content: flex-start; bottom: calc(20px + env(safe-area-inset-bottom, 0px)); scrollbar-width: none; }
  .toolbar::-webkit-scrollbar { display: none; }
  .tool-btn { padding: 10px 14px; font-size: 12px; white-space: nowrap; }
  .infobar { top: calc(8px + env(safe-area-inset-top, 0px)); font-size: 9px; padding: 4px 8px; gap: 8px; }
}
`;

const STORAGE_KEY = "mindmap_v2";
const STORAGE_KEY_V1 = "mindmap_v1";
const DEFAULT_BG = { type: "dots", bgColor: "#0e0f11", dotColor: "#2a2c30", imageUrl: "" };
const DEFAULT_SETTINGS = {
  header: { nameSize: 12, nameColor: "" },
  node: { nameSize: 12, nameColor: "", bodySize: 11, bodyColor: "", maxWidth: 280 },
  edge: { color: "", width: 1.5, style: "solid", labelSize: 10, labelWidth: 72 },
  layout: { minGapX: 40, minGapY: 40 },
};

let _seq = 0;
function makeNodeId() {
  const d = new Date();
  const p = n => String(n).padStart(2, "0");
  return `n_${d.getFullYear().toString().slice(2)}${p(d.getMonth()+1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}_${++_seq}`;
}
function makeEdgeId() { return `e_${Date.now()}_${++_seq}`; }

const RELATION_PRESETS = [
  { src: "parent", tgt: "child" },
  { src: "higher", tgt: "lower" },
  { src: "left", tgt: "right" },
  { src: "cause", tgt: "effect" },
  { src: "before", tgt: "after" },
];

function bestPorts(src, tgt) {
  const dx = (tgt.x + (tgt.w||180)/2) - (src.x + (src.w||180)/2);
  const dy = (tgt.y + (tgt.h||60)/2) - (src.y + (src.h||60)/2);
  if (Math.abs(dx) >= Math.abs(dy)) return dx >= 0 ? { srcPort:"right", tgtPort:"left" } : { srcPort:"left", tgtPort:"right" };
  return dy >= 0 ? { srcPort:"bottom", tgtPort:"top" } : { srcPort:"top", tgtPort:"bottom" };
}

function cubicPath(x1, y1, x2, y2) {
  const dx = Math.abs(x2-x1)*0.5;
  return `M ${x1} ${y1} C ${x1+dx} ${y1}, ${x2-dx} ${y2}, ${x2} ${y2}`;
}

function makeMapId() { return `map_${Date.now()}_${++_seq}`; }

function loadStored() {
  try {
    const v2 = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (v2) return v2; // may be new {maps,activeMapId} or legacy {nodes,edges} format
    return JSON.parse(localStorage.getItem(STORAGE_KEY_V1)); // fall back to old key
  } catch { return null; }
}

const DEFAULT_NODE = { id: "n_default", name: "Central Idea", body: "", x: 300, y: 220, w: 180, h: 44, showBody: true, showNeighbors: true };

function dlBlob(content, filename, type) {
  const a = Object.assign(document.createElement("a"), {
    href: URL.createObjectURL(new Blob([content], { type })),
    download: filename,
  });
  a.click();
  URL.revokeObjectURL(a.href);
}

export default function MindMap() {
  // One-time initialization from localStorage
  const _init = useRef(null);
  if (!_init.current) {
    const raw = loadStored();
    const initMaps = raw?.maps?.length
      ? raw.maps
      : [{ id: makeMapId(), name: "My Map", nodes: raw?.nodes || [], edges: raw?.edges || [], background: { ...DEFAULT_BG } }];
    const initActiveId = (raw?.activeMapId && initMaps.some(m => m.id === raw.activeMapId))
      ? raw.activeMapId : initMaps[0].id;
    const initActiveMap = initMaps.find(m => m.id === initActiveId) || initMaps[0];
    const initNodes = initActiveMap.nodes?.length ? initActiveMap.nodes : [DEFAULT_NODE];
    const initEdges = initActiveMap.edges || [];
    _init.current = { maps: initMaps, activeMapId: initActiveId, nodes: initNodes, edges: initEdges, background: initActiveMap.background || { ...DEFAULT_BG }, settings: initActiveMap.settings || { ...DEFAULT_SETTINGS } };
  }
  const _i = _init.current;

  const [maps, setMaps] = useState(_i.maps);
  const [activeMapId, setActiveMapId] = useState(_i.activeMapId);
  const [nodes, setNodes] = useState(_i.nodes);
  const [edges, setEdges] = useState(_i.edges);
  const [background, setBackground] = useState(_i.background);
  const [settings, setSettings] = useState(_i.settings);
  const [selected, setSelected] = useState(null);
  const [pan, setPan] = useState({ x: 80, y: 60 });
  const [zoom, setZoom] = useState(1);
  const [zoomText, setZoomText] = useState("100");
  const zoomFocused = useRef(false);
  const [connFrom, setConnFrom] = useState(null);
  const [mouseCanvas, setMouseCanvas] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState(null);
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [addConnInput, setAddConnInput] = useState("");
  const [showDrop, setShowDrop] = useState(false);
  const [globalShow, setGlobalShow] = useState(() => {
    const defaults = { body: true, neighbors: true, neighborPath: false, neighborRel: false, nodeIds: false };
    try { const s = JSON.parse(localStorage.getItem(STORAGE_KEY)); if (s?.globalShow) return { ...defaults, ...s.globalShow }; } catch {}
    return defaults;
  });
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarTab, setSidebarTab] = useState("edit");
  const [copiedPrompt, setCopiedPrompt] = useState(null);
  const [multiSelected, setMultiSelected] = useState([]);
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [selBox, setSelBox] = useState(null);
  const [hasClipboard, setHasClipboard] = useState(false);
  const [renamingMapId, setRenamingMapId] = useState(null);
  const [user, setUser] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [lastDeletedMapInfo, setLastDeletedMapInfo] = useState(null);
  const [styleDefaultsOpen, setStyleDefaultsOpen] = useState(false);
  const [nodeStyleOpen, setNodeStyleOpen] = useState(false);
  const [edgeStyleOpen, setEdgeStyleOpen] = useState(false);
  const [viewOnly, setViewOnly] = useState(false);
  const [sharedMapName, setSharedMapName] = useState(null);
  const viewOnlyRef = useRef(false);

  // History
  const hist = useRef([{ nodes: _i.nodes, edges: _i.edges }]);
  const histIdx = useRef(0);
  const [histVer, setHistVer] = useState(0);

  const canvasRef = useRef(null);
  const nodeRefs = useRef({});
  const resizing = useRef(null);
  const clipboardRef = useRef(null);
  const mouseCanvasRef = useRef({ x: 0, y: 0 });
  const canvasHoveredRef = useRef(false);
  const selBoxStartRef = useRef(null);
  const nameInputRef = useRef(null);
  const bodyTextareaRef = useRef(null);
  const pendingFocusId = useRef(null);

  const userRef = useRef(null);
  const syncTimerRef = useRef(null);
  const saveTimerRef = useRef(null);

  // Stable refs for touch handlers and deferred callbacks
  const mapsRef = useRef(maps);
  const backgroundRef = useRef(background);
  const settingsRef = useRef(settings);
  const activeMapIdRef = useRef(activeMapId);
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);
  const panRef = useRef(pan);
  const zoomRef = useRef(zoom);
  const pushHistRef = useRef(null); // set below after pushHistory is defined

  const selectedEdge = selected?.type === "edge" ? edges.find(e => e.id === selected.id) : null;
  const selectedNode = selected?.type === "node" ? nodes.find(n => n.id === selected.id) : null;
  const canUndo = histIdx.current > 0;
  const canRedo = histIdx.current < hist.current.length - 1;
  const selectionEdgeCount = multiSelected.length > 0
    ? edges.filter(e => multiSelected.includes(e.src) && multiSelected.includes(e.tgt)).length
    : 0;

  // ── History ──────────────────────────────────────────────────────────────────
  const pushHistory = useCallback((newNodes, newEdges, bg, settingsSnap) => {
    const entry = { nodes: newNodes, edges: newEdges };
    if (bg !== undefined) entry.background = bg;
    if (settingsSnap !== undefined) entry.settings = settingsSnap;
    hist.current = [...hist.current.slice(0, histIdx.current + 1), entry];
    if (hist.current.length > 60) hist.current = hist.current.slice(-60);
    histIdx.current = hist.current.length - 1;
    setHistVer(v => v + 1);
  }, []);
  pushHistRef.current = pushHistory;

  const undo = useCallback(() => {
    if (histIdx.current <= 0) return;
    histIdx.current--;
    const s = hist.current[histIdx.current];
    setNodes(s.nodes); setEdges(s.edges);
    if (s.background !== undefined) setBackground(s.background);
    if (s.settings !== undefined) setSettings(s.settings);
    setHistVer(v => v + 1);
  }, []);

  const redo = useCallback(() => {
    if (histIdx.current >= hist.current.length - 1) return;
    histIdx.current++;
    const s = hist.current[histIdx.current];
    setNodes(s.nodes); setEdges(s.edges);
    if (s.background !== undefined) setBackground(s.background);
    if (s.settings !== undefined) setSettings(s.settings);
    setHistVer(v => v + 1);
  }, []);

  const commitTimer = useRef(null);
  const deferCommit = useCallback(() => {
    clearTimeout(commitTimer.current);
    commitTimer.current = setTimeout(() => pushHistRef.current(nodesRef.current, edgesRef.current), 700);
  }, []);

  // ── Export / Import ───────────────────────────────────────────────────────────
  const exportJSON = useCallback((selOnly = false) => {
    let expNodes = nodes, expEdges = edges;
    if (selOnly) {
      if (multiSelected.length > 0) {
        const ids = new Set(multiSelected);
        expNodes = nodes.filter(n => ids.has(n.id));
        expEdges = edges.filter(e => ids.has(e.src) && ids.has(e.tgt));
      } else if (selectedNode) {
        expEdges = edges.filter(e => e.src === selectedNode.id || e.tgt === selectedNode.id);
        const ids = new Set([selectedNode.id, ...expEdges.map(e => e.src), ...expEdges.map(e => e.tgt)]);
        expNodes = nodes.filter(n => ids.has(n.id));
      }
    }
    const ts = new Date().toISOString().slice(0,10);
    dlBlob(JSON.stringify({ nodes: expNodes, edges: expEdges, background, settings }, null, 2), `mindmap_${ts}.json`, "application/json");
  }, [nodes, edges, selectedNode, multiSelected]);

  const exportCSV = useCallback((selOnly = false) => {
    let expNodes = nodes, expEdges = edges;
    if (selOnly) {
      if (multiSelected.length > 0) {
        const ids = new Set(multiSelected);
        expNodes = nodes.filter(n => ids.has(n.id));
        expEdges = edges.filter(e => ids.has(e.src) && ids.has(e.tgt));
      } else if (selectedNode) {
        expEdges = edges.filter(e => e.src === selectedNode.id || e.tgt === selectedNode.id);
        const ids = new Set([selectedNode.id, ...expEdges.map(e => e.src), ...expEdges.map(e => e.tgt)]);
        expNodes = nodes.filter(n => ids.has(n.id));
      }
    }
    const esc = s => `"${(s||"").replace(/"/g,'""')}"`;
    const lines = [
      "# NODES",
      "ID,Name,Body",
      ...expNodes.map(n => [esc(n.id), esc(n.name), esc(n.body||"")].join(",")),
      "",
      "# CONNECTIONS",
      "From,To,Label,From Relation,To Relation",
      ...expEdges.map(e => {
        const sn = nodes.find(n => n.id === e.src), tn = nodes.find(n => n.id === e.tgt);
        return [esc(sn?.name||e.src), esc(tn?.name||e.tgt), esc(e.label||""), esc(e.relSrc||""), esc(e.relTgt||"")].join(",");
      }),
    ];
    const ts = new Date().toISOString().slice(0,10);
    dlBlob(lines.join("\n"), `mindmap_${ts}.csv`, "text/csv");
  }, [nodes, edges, selectedNode, multiSelected]);

  const importJSON = useCallback((file) => {
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const data = JSON.parse(ev.target.result);
        if (!Array.isArray(data.nodes) || !Array.isArray(data.edges)) throw new Error();

        const curNodes = nodesRef.current;
        const curEdges = edgesRef.current;

        // Normalize positions for nodes missing x/y
        const normalized = data.nodes.map((n, i) => ({
          showBody: true, showNeighbors: true, w: 180, h: 44,
          ...n,
          id: n.id || makeNodeId(),
          x: n.x ?? (80 + (i % 4) * 230),
          y: n.y ?? (80 + Math.floor(i / 4) * 150),
        }));

        // Remap any IDs that collide with existing nodes
        const existingIds = new Set(curNodes.map(n => n.id));
        const idMap = {};
        const remapped = normalized.map(n => {
          if (existingIds.has(n.id)) {
            const newId = makeNodeId();
            idMap[n.id] = newId;
            return { ...n, id: newId };
          }
          return n;
        });

        // Remap edge node references; always generate fresh edge IDs
        const allIds = new Set([...curNodes.map(n => n.id), ...remapped.map(n => n.id)]);
        const newEdges = data.edges
          .map(e => ({ ...e, id: makeEdgeId(), src: idMap[e.src] ?? e.src, tgt: idMap[e.tgt] ?? e.tgt }))
          .filter(e => allIds.has(e.src) && allIds.has(e.tgt));

        // Shift imported group right just enough so bounding boxes don't overlap
        let shifted = remapped;
        if (curNodes.length > 0) {
          const exMaxX = Math.max(...curNodes.map(n => n.x + (n.w || 180)));
          const exMinY = Math.min(...curNodes.map(n => n.y));
          const exMaxY = Math.max(...curNodes.map(n => n.y + (n.h || 44)));
          const imMinX = Math.min(...remapped.map(n => n.x));
          const imMaxX = Math.max(...remapped.map(n => n.x + (n.w || 180)));
          const imMinY = Math.min(...remapped.map(n => n.y));
          const imMaxY = Math.max(...remapped.map(n => n.y + (n.h || 44)));
          const exMinX = Math.min(...curNodes.map(n => n.x));
          const overlapX = imMinX < exMaxX && imMaxX > exMinX;
          const overlapY = imMinY < exMaxY && imMaxY > exMinY;
          if (overlapX && overlapY) {
            const dx = exMaxX + 80 - imMinX;
            const dy = exMinY - imMinY;
            shifted = remapped.map(n => ({ ...n, x: n.x + dx, y: n.y + dy }));
          }
        }

        const newNodes = [...curNodes, ...shifted];
        const mergedEdges = [...curEdges, ...newEdges];
        setNodes(newNodes);
        setEdges(mergedEdges);
        setSelected(null);
        const importBg = data.background || undefined;
        const importSettings = data.settings || undefined;
        if (importBg || importSettings) {
          // Stamp pre-import state onto current history entry so a single undo reverts everything
          if (hist.current[histIdx.current]) {
            hist.current[histIdx.current] = {
              ...hist.current[histIdx.current],
              ...(importBg ? { background: backgroundRef.current } : {}),
              ...(importSettings ? { settings: settingsRef.current } : {}),
            };
          }
          if (importBg) setBackground(importBg);
          if (importSettings) setSettings(importSettings);
          pushHistRef.current(newNodes, mergedEdges, importBg, importSettings);
        } else {
          pushHistRef.current(newNodes, mergedEdges);
        }
      } catch { alert("Invalid file — expected a mindmap JSON export."); }
    };
    reader.readAsText(file);
  }, []);

  const exportTXT = useCallback((selOnly = false) => {
    let expNodes = nodes, expEdges = edges;
    if (selOnly) {
      if (multiSelected.length > 0) {
        const ids = new Set(multiSelected);
        expNodes = nodes.filter(n => ids.has(n.id));
        expEdges = edges.filter(e => ids.has(e.src) && ids.has(e.tgt));
      } else if (selectedNode) {
        expEdges = edges.filter(e => e.src === selectedNode.id || e.tgt === selectedNode.id);
        const ids = new Set([selectedNode.id, ...expEdges.map(e => e.src), ...expEdges.map(e => e.tgt)]);
        expNodes = nodes.filter(n => ids.has(n.id));
      }
    }
    const sorted = [...expNodes].sort((a, b) => (a.x + a.y) - (b.x + b.y));
    const blocks = sorted.map(n => {
      const lines = [`\`${n.name}`];
      if (n.body?.trim()) lines.push(n.body.trim());
      for (const e of expEdges) {
        let rel = "", otherNode = null;
        if (e.src === n.id) { otherNode = expNodes.find(t => t.id === e.tgt); rel = e.relSrc || ""; }
        else if (e.tgt === n.id) { otherNode = expNodes.find(s => s.id === e.src); rel = e.relTgt || ""; }
        if (!otherNode) continue;
        const lbl = e.label || "";
        const left = (rel && lbl) ? `${rel}, ${lbl}` : (rel || lbl);
        lines.push(`= ${left}${left ? " " : ""}: ${otherNode.name}`);
      }
      return lines.join("\n");
    });
    const ts = new Date().toISOString().slice(0, 10);
    dlBlob(blocks.join("\n\n\n"), `mindmap_${ts}.txt`, "text/plain");
  }, [nodes, edges, selectedNode, multiSelected]);

  const importTXT = useCallback((file) => {
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const text = ev.target.result;
        // Split into blocks wherever a backtick-line begins (after any blank lines)
        const rawBlocks = text.split(/\n{2,}(?=`)/);
        const parsedNodes = [], allConns = [];

        for (const block of rawBlocks) {
          const lines = block.trim().split("\n");
          if (!lines[0]?.startsWith("`")) continue;
          const name = lines[0].slice(1).trim();
          if (!name) continue;
          const bodyLines = [], connLines = [];
          for (const line of lines.slice(1)) {
            if (line.startsWith("=")) connLines.push(line);
            else bodyLines.push(line);
          }
          parsedNodes.push({ name, body: bodyLines.join("\n").trim() });
          for (const line of connLines) {
            const afterEq = line.slice(1).trim(); // e.g. "parent, label : Node B" or ": Node B"
            let leftPart = "", toName = "";
            const ci = afterEq.indexOf(" : ");
            if (ci !== -1) {
              leftPart = afterEq.slice(0, ci).trim();
              toName = afterEq.slice(ci + 3).trim();
            } else if (afterEq.startsWith(": ")) {
              toName = afterEq.slice(2).trim();
            } else { continue; }
            if (!toName) continue;
            let relType = "", relLabel = "";
            if (leftPart.includes(",")) {
              const comma = leftPart.indexOf(",");
              relType = leftPart.slice(0, comma).trim();
              relLabel = leftPart.slice(comma + 1).trim();
            } else {
              relType = leftPart;
            }
            allConns.push({ fromName: name, toName, relType, relLabel });
          }
        }

        if (parsedNodes.length === 0) {
          alert("No nodes found. Each node should start with `Name on its own line.");
          return;
        }

        const curNodes = nodesRef.current, curEdges = edgesRef.current;
        const startX = curNodes.length > 0 ? Math.max(...curNodes.map(n => n.x + (n.w || 180))) + 80 : 80;
        const nameToNode = {};
        const newNodes = parsedNodes.map((p, i) => {
          const node = { id: makeNodeId(), name: p.name, body: p.body, x: startX + Math.floor(i / 4) * 230, y: 80 + (i % 4) * 150, w: 180, h: 44, showBody: true, showNeighbors: true };
          nameToNode[p.name] = node;
          return node;
        });

        const newEdges = [];
        const edgeSet = new Set();
        const edgeById = {};
        const allNodesByName = { ...nameToNode };
        for (const n of curNodes) allNodesByName[n.name] = allNodesByName[n.name] ?? n;
        for (const conn of allConns) {
          const from = nameToNode[conn.fromName], to = allNodesByName[conn.toName];
          if (!from || !to) continue;
          const key = [from.id, to.id].sort().join("--") + (conn.relLabel ? `--${conn.relLabel}` : "");
          if (edgeSet.has(key)) {
            const ex = edgeById[key];
            if (ex && from.id === ex.tgt) ex.relTgt = conn.relType;
          } else {
            edgeSet.add(key);
            const edge = { id: makeEdgeId(), src: from.id, tgt: to.id, srcPort: "right", tgtPort: "left", label: conn.relLabel || "", relSrc: conn.relType || "", relTgt: "" };
            newEdges.push(edge);
            edgeById[key] = edge;
          }
        }

        const mergedNodes = [...curNodes, ...newNodes];
        const mergedEdges = [...curEdges, ...newEdges];
        setNodes(mergedNodes); setEdges(mergedEdges); setSelected(null);
        pushHistRef.current(mergedNodes, mergedEdges);
      } catch { alert("Could not parse file. Make sure nodes start with `Name."); }
    };
    reader.readAsText(file);
  }, []);

  const doPaste = useCallback((explicitPos) => {
    if (!clipboardRef.current) return;
    const clip = clipboardRef.current;
    const clipNodes = clip.nodes || [clip];
    const clipEdges = clip.edges || [];
    if (clipNodes.length === 0) return;
    const pos = explicitPos ?? (() => {
      const el = canvasRef.current;
      const vw = el ? el.clientWidth : 800, vh = el ? el.clientHeight : 600;
      return { x: (-panRef.current.x + vw / 2) / zoomRef.current, y: (-panRef.current.y + vh / 2) / zoomRef.current };
    })();
    const cx = clipNodes.reduce((s, n) => s + n.x + (n.w || 180) / 2, 0) / clipNodes.length;
    const cy = clipNodes.reduce((s, n) => s + n.y + (n.h || 44) / 2, 0) / clipNodes.length;
    const idMap = {};
    const newNodes = clipNodes.map(n => { const id = makeNodeId(); idMap[n.id] = id; return { ...n, id, x: n.x + (pos.x - cx), y: n.y + (pos.y - cy) }; });
    const newEdges = clipEdges.map(ed => ({ ...ed, id: makeEdgeId(), src: idMap[ed.src] ?? ed.src, tgt: idMap[ed.tgt] ?? ed.tgt }));
    const allNodes = [...nodesRef.current, ...newNodes];
    const allEdges = [...edgesRef.current, ...newEdges];
    setNodes(allNodes); setEdges(allEdges);
    if (newNodes.length === 1) { setSelected({ type: "node", id: newNodes[0].id }); setMultiSelected([]); setMultiSelectMode(false); }
    else { setMultiSelected(newNodes.map(n => n.id)); setSelected(null); setMultiSelectMode(false); }
    pushHistRef.current(allNodes, allEdges);
  }, []);

  // ── Map management ────────────────────────────────────────────────────────────
  const switchToMap = useCallback((newMapId) => {
    if (newMapId === activeMapIdRef.current) return;
    const newMap = mapsRef.current.find(m => m.id === newMapId);
    if (!newMap) return;
    setMaps(prev => prev.map(m =>
      m.id === activeMapIdRef.current
        ? { ...m, nodes: nodesRef.current, edges: edgesRef.current, background: backgroundRef.current, settings: settingsRef.current }
        : m
    ));
    setActiveMapId(newMapId);
    setNodes(newMap.nodes?.length ? newMap.nodes : [DEFAULT_NODE]);
    setEdges(newMap.edges || []);
    setBackground(newMap.background || { ...DEFAULT_BG });
    setSettings(newMap.settings || { ...DEFAULT_SETTINGS });
    setSelected(null); setMultiSelected([]); setMultiSelectMode(false); setConnFrom(null);
    setLastDeletedMapInfo(null);
    hist.current = [{ nodes: newMap.nodes?.length ? newMap.nodes : [DEFAULT_NODE], edges: newMap.edges || [] }];
    histIdx.current = 0;
    setHistVer(v => v + 1);
  }, []);

  const createNewMap = useCallback(() => {
    const newId = makeMapId();
    const firstNode = { id: makeNodeId(), name: "Central Idea", body: "", x: 300, y: 220, w: 180, h: 44, showBody: true, showNeighbors: true };
    const initNodes = [firstNode];
    setMaps(prev => [
      ...prev.map(m => m.id === activeMapIdRef.current
        ? { ...m, nodes: nodesRef.current, edges: edgesRef.current, background: backgroundRef.current, settings: settingsRef.current }
        : m),
      { id: newId, name: "New Map", nodes: initNodes, edges: [], background: { ...DEFAULT_BG }, settings: { ...DEFAULT_SETTINGS }, visibility: "private", shareToken: null },
    ]);
    setActiveMapId(newId);
    setNodes(initNodes);
    setEdges([]);
    setBackground({ ...DEFAULT_BG });
    setSettings({ ...DEFAULT_SETTINGS });
    setSelected(null); setMultiSelected([]); setMultiSelectMode(false); setConnFrom(null);
    hist.current = [{ nodes: initNodes, edges: [] }];
    histIdx.current = 0;
    setHistVer(v => v + 1);
  }, []);

  const setMapVisibility = useCallback((vis) => {
    setMaps(prev => prev.map(m => {
      if (m.id !== activeMapIdRef.current) return m;
      const shareToken = vis !== "private" && !m.shareToken
        ? crypto.randomUUID()
        : m.shareToken;
      return { ...m, visibility: vis, shareToken };
    }));
  }, []);

  const exitSharedView = useCallback(() => {
    viewOnlyRef.current = false;
    setViewOnly(false);
    setSharedMapName(null);
    const active = mapsRef.current.find(m => m.id === activeMapIdRef.current) || mapsRef.current[0];
    if (active) {
      setNodes(active.nodes?.length ? active.nodes : [DEFAULT_NODE]);
      setEdges(active.edges || []);
      setBackground(active.background || { ...DEFAULT_BG });
      setSettings(active.settings || { ...DEFAULT_SETTINGS });
    }
  }, []);

  const deleteMap = useCallback((mapId) => {
    if (mapsRef.current.length <= 1) return;
    const toDelete = mapsRef.current.find(m => m.id === mapId);
    const insertIdx = mapsRef.current.findIndex(m => m.id === mapId);
    const savedMap = mapId === activeMapIdRef.current
      ? { ...toDelete, nodes: nodesRef.current, edges: edgesRef.current, background: backgroundRef.current, settings: settingsRef.current }
      : toDelete;
    setLastDeletedMapInfo({ map: savedMap, insertIdx });
    const newMaps = mapsRef.current.filter(m => m.id !== mapId);
    setMaps(newMaps);
    if (mapId === activeMapIdRef.current) {
      const nextMap = newMaps[0];
      setActiveMapId(nextMap.id);
      setNodes(nextMap.nodes?.length ? nextMap.nodes : [DEFAULT_NODE]);
      setEdges(nextMap.edges || []);
      setBackground(nextMap.background || { ...DEFAULT_BG });
      setSettings(nextMap.settings || { ...DEFAULT_SETTINGS });
      setSelected(null); setMultiSelected([]); setMultiSelectMode(false); setConnFrom(null);
      hist.current = [{ nodes: nextMap.nodes?.length ? nextMap.nodes : [DEFAULT_NODE], edges: nextMap.edges || [] }];
      histIdx.current = 0;
      setHistVer(v => v + 1);
    }
  }, []);

  const renameMap = useCallback((mapId, name) => {
    setMaps(prev => prev.map(m => m.id === mapId ? { ...m, name } : m));
  }, []);

  const restoreDeletedMap = useCallback(() => {
    if (!lastDeletedMapInfo) return;
    const { map, insertIdx } = lastDeletedMapInfo;
    setMaps(prev => { const next = [...prev]; next.splice(Math.min(insertIdx, next.length), 0, map); return next; });
    setLastDeletedMapInfo(null);
  }, [lastDeletedMapInfo]);

  // ── Supabase sync ─────────────────────────────────────────────────────────────
  const syncUp = useCallback(async (mapsToSync, userId) => {
    if (!userId) return;
    setSyncing(true);
    const rows = mapsToSync.map(m => ({
      id: m.id, user_id: userId, name: m.name,
      visibility: m.visibility || "private",
      share_token: m.shareToken || null,
      data: { nodes: m.nodes || [], edges: m.edges || [], background: m.background || DEFAULT_BG, settings: m.settings || DEFAULT_SETTINGS },
      updated_at: new Date().toISOString(),
    }));
    const { error } = await supabase.from("maps").upsert(rows, { onConflict: "id" });
    if (!error && mapsToSync.length > 0) {
      await supabase.from("maps").delete().eq("user_id", userId)
        .not("id", "in", `(${mapsToSync.map(m => m.id).join(",")})`);
    }
    if (error) console.error("Sync error:", error);
    setSyncing(false);
  }, []);

  const deferSync = useCallback((mapsToSync, userId) => {
    clearTimeout(syncTimerRef.current);
    syncTimerRef.current = setTimeout(() => syncUp(mapsToSync, userId), 2000);
  }, [syncUp]);

  const syncDown = useCallback(async (userId) => {
    const { data, error } = await supabase.from("maps").select("*").eq("user_id", userId).order("updated_at", { ascending: false });
    if (error) { console.error(error); return; }
    if (data?.length) {
      const remoteMaps = data.map(row => ({ id: row.id, name: row.name, visibility: row.visibility || "private", shareToken: row.share_token || null, ...row.data }));
      const remoteIds = new Set(remoteMaps.map(m => m.id));
      const localOnly = mapsRef.current.filter(m =>
        !remoteIds.has(m.id) &&
        (m.nodes?.length > 1 || m.edges?.length > 0 || m.name !== "Untitled Map")
      );
      const merged = [...remoteMaps, ...localOnly];
      const active = merged[0];
      mapsRef.current = merged; activeMapIdRef.current = active.id;
      setMaps(merged); setActiveMapId(active.id);
      setNodes(active.nodes?.length ? active.nodes : [DEFAULT_NODE]);
      setEdges(active.edges || []);
      setBackground(active.background || { ...DEFAULT_BG });
      setSettings(active.settings || { ...DEFAULT_SETTINGS });
      setSelected(null); setMultiSelected([]); setMultiSelectMode(false); setConnFrom(null);
      hist.current = [{ nodes: active.nodes?.length ? active.nodes : [DEFAULT_NODE], edges: active.edges || [] }];
      histIdx.current = 0; setHistVer(v => v + 1);
      if (localOnly.length) syncUp(merged, userId);
    } else {
      syncUp(mapsRef.current, userId);
    }
  }, [syncUp]);

  const signIn = useCallback(() => supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: window.location.origin },
  }), []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null); userRef.current = null;
  }, []);

  // ── Effects ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    const updatedMaps = maps.map(m =>
      m.id === activeMapId ? { ...m, nodes, edges, background, settings } : m
    );
    if (viewOnlyRef.current) return;
    const doSave = () => localStorage.setItem(STORAGE_KEY, JSON.stringify({ maps: updatedMaps, activeMapId, globalShow }));
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(doSave, 400);
    const flush = () => { clearTimeout(saveTimerRef.current); doSave(); };
    window.addEventListener("beforeunload", flush, { once: true });
    if (userRef.current) deferSync(updatedMaps, userRef.current.id);
    return () => window.removeEventListener("beforeunload", flush);
  }, [nodes, edges, background, settings, maps, activeMapId, globalShow, deferSync]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null;
      setUser(u); userRef.current = u;
      if (u) syncDown(u.id);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const u = session?.user ?? null;
      setUser(u); userRef.current = u;
      if (event === "SIGNED_IN") syncDown(u.id);
    });
    return () => subscription.unsubscribe();
  }, [syncDown]);

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("share");
    if (!token || !supabase) return;
    supabase.from("maps").select("*").eq("share_token", token).in("visibility", ["link", "public"]).single()
      .then(({ data, error }) => {
        if (error || !data) return;
        const m = { ...data.data };
        viewOnlyRef.current = true;
        setViewOnly(true);
        setSharedMapName(data.name);
        setNodes(m.nodes?.length ? m.nodes : [DEFAULT_NODE]);
        setEdges(m.edges || []);
        setBackground(m.background || { ...DEFAULT_BG });
        setSettings(m.settings || { ...DEFAULT_SETTINGS });
        setSelected(null); setMultiSelected([]);
      });
  }, []);

  useEffect(() => { setAddConnInput(""); setShowDrop(false); }, [selected?.id]);
  useEffect(() => { if (selected) setSidebarTab("edit"); }, [selected]);

  // Auto-focus name field after node creation (re-runs when sidebarTab switches to "edit")
  useEffect(() => {
    if (pendingFocusId.current && selected?.type === "node" && selected.id === pendingFocusId.current && sidebarTab === "edit") {
      if (nameInputRef.current) {
        nameInputRef.current.focus();
        nameInputRef.current.select();
        pendingFocusId.current = null;
      }
    }
  }, [selected, sidebarTab]);

  // Async size tracking via ResizeObserver — avoids forced layout on every render
  const _roRef = useRef(null);
  useEffect(() => {
    _roRef.current = new ResizeObserver(entries => {
      const elToEntry = new Map(entries.map(e => [e.target, e]));
      setNodes(prev => {
        let changed = false;
        const next = prev.map(n => {
          const el = nodeRefs.current[n.id];
          if (!el) return n;
          const entry = elToEntry.get(el);
          if (!entry) return n;
          const bbs = entry.borderBoxSize?.[0];
          const h = bbs ? Math.round(bbs.blockSize) : el.offsetHeight;
          const w = bbs ? Math.round(bbs.inlineSize) : el.offsetWidth;
          if (h !== n.h || w !== n.w) { changed = true; return { ...n, h, w }; }
          return n;
        });
        return changed ? next : prev;
      });
    });
    return () => _roRef.current?.disconnect();
  }, []);
  useEffect(() => {
    const ro = _roRef.current;
    if (!ro) return;
    ro.disconnect();
    Object.values(nodeRefs.current).forEach(el => { if (el) ro.observe(el); });
  }, [nodes.length]);

  useEffect(() => {
    const onMove = e => {
      if (!resizing.current) return;
      const dx = resizing.current.startX - e.clientX;
      setSidebarWidth(Math.max(180, Math.min(500, resizing.current.startWidth + dx)));
    };
    const onUp = () => { resizing.current = null; };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, []);

  useEffect(() => { mapsRef.current = maps; }, [maps]);
  useEffect(() => { backgroundRef.current = background; }, [background]);
  useEffect(() => { settingsRef.current = settings; }, [settings]);
  useEffect(() => { activeMapIdRef.current = activeMapId; }, [activeMapId]);
  useEffect(() => { nodesRef.current = nodes; }, [nodes]);
  useEffect(() => { edgesRef.current = edges; }, [edges]);
  useEffect(() => { panRef.current = pan; }, [pan]);
  useEffect(() => {
    zoomRef.current = zoom;
    if (!zoomFocused.current) setZoomText(String(Math.round(zoom * 100)));
  }, [zoom]);

  useEffect(() => {
    const handle = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handle);
    return () => window.removeEventListener("resize", handle);
  }, []);

  // Touch handler
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let drag = null, canPan = null, pinch = null;
    let rafId = null, pending = null;

    function nodeIdFromEl(el) {
      while (el && el !== canvas) {
        if (el.dataset?.nodeId) return el.dataset.nodeId;
        el = el.parentElement;
      }
      return null;
    }
    function onStart(e) {
      e.preventDefault();
      if (e.touches.length === 1) {
        const t = e.touches[0];
        const nid = nodeIdFromEl(e.target);
        if (nid) {
          const node = nodesRef.current.find(n => n.id === nid);
          if (node) drag = { nodeId: nid, startX: t.clientX, startY: t.clientY, origX: node.x, origY: node.y };
        } else {
          canPan = { startX: t.clientX, startY: t.clientY, startPanX: panRef.current.x, startPanY: panRef.current.y };
        }
      } else if (e.touches.length === 2) {
        drag = null; canPan = null;
        const t0 = e.touches[0], t1 = e.touches[1];
        const rect = canvas.getBoundingClientRect();
        pinch = { d0: Math.hypot(t0.clientX-t1.clientX, t0.clientY-t1.clientY), z0: zoomRef.current, p0: { ...panRef.current }, mx: (t0.clientX+t1.clientX)/2-rect.left, my: (t0.clientY+t1.clientY)/2-rect.top };
      }
    }
    function onMove(e) {
      if (e.touches.length === 1) {
        const t = e.touches[0];
        pending = { n: 1, x: t.clientX, y: t.clientY };
      } else if (e.touches.length === 2) {
        pending = { n: 2, x0: e.touches[0].clientX, y0: e.touches[0].clientY, x1: e.touches[1].clientX, y1: e.touches[1].clientY };
      }
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        const m = pending; pending = null;
        if (!m) return;
        if (m.n === 1) {
          if (drag) {
            const dx = (m.x-drag.startX)/zoomRef.current, dy = (m.y-drag.startY)/zoomRef.current;
            setNodes(prev => prev.map(n => n.id === drag.nodeId ? { ...n, x: drag.origX+dx, y: drag.origY+dy } : n));
          } else if (canPan) {
            setPan({ x: canPan.startPanX+(m.x-canPan.startX), y: canPan.startPanY+(m.y-canPan.startY) });
          }
        } else if (m.n === 2 && pinch) {
          const d = Math.hypot(m.x0-m.x1, m.y0-m.y1);
          const nz = Math.min(3, Math.max(0.2, pinch.z0*(d/pinch.d0)));
          setZoom(nz);
          setPan({ x: pinch.mx-(pinch.mx-pinch.p0.x)*(nz/pinch.z0), y: pinch.my-(pinch.my-pinch.p0.y)*(nz/pinch.z0) });
        }
      });
    }
    function onEnd() {
      if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
      pending = null;
      if (drag) setTimeout(() => pushHistRef.current(nodesRef.current, edgesRef.current), 0);
      drag = null; canPan = null; pinch = null;
    }
    canvas.addEventListener("touchstart", onStart, { passive: false });
    canvas.addEventListener("touchmove", onMove, { passive: false });
    canvas.addEventListener("touchend", onEnd);
    canvas.addEventListener("touchcancel", onEnd);
    return () => {
      canvas.removeEventListener("touchstart", onStart);
      canvas.removeEventListener("touchmove", onMove);
      canvas.removeEventListener("touchend", onEnd);
      canvas.removeEventListener("touchcancel", onEnd);
    };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = e => {
      if (viewOnlyRef.current) return;
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key === "z" && !e.shiftKey) { e.preventDefault(); undo(); return; }
      if (mod && (e.key === "y" || (e.key === "z" && e.shiftKey))) { e.preventDefault(); redo(); return; }
      if (e.key === "n" && !mod && canvasHoveredRef.current && !e.target.matches("input,textarea")) {
        e.preventDefault();
        const pos = mouseCanvasRef.current;
        const id = makeNodeId();
        const newNode = { id, name: "New Node", body: "", x: pos.x-90, y: pos.y-22, w: 180, h: 44, showBody: true, showNeighbors: true };
        const newNodes = [...nodesRef.current, newNode];
        setNodes(newNodes); setSelected({ type: "node", id });
        pushHistRef.current(newNodes, edgesRef.current);
        pendingFocusId.current = id;
        setSidebarOpen(true);
        return;
      }
      if (e.key === "c" && !mod && !e.target.matches("input,textarea") && selected?.type === "node") {
        e.preventDefault();
        setConnFrom(prev => prev?.nodeId === selected.id ? null : { nodeId: selected.id });
        return;
      }
      if (mod && e.key === "c" && !e.target.matches("input,textarea")) {
        if (multiSelected.length > 0) {
          const ids = new Set(multiSelected);
          clipboardRef.current = {
            nodes: nodesRef.current.filter(n => ids.has(n.id)),
            edges: edgesRef.current.filter(ed => ids.has(ed.src) && ids.has(ed.tgt)),
          };
        } else if (selected?.type === "node") {
          const n = nodesRef.current.find(n => n.id === selected.id);
          if (n) clipboardRef.current = { nodes: [n], edges: [] };
        }
        if (clipboardRef.current) setHasClipboard(true);
        return;
      }
      if (mod && e.key === "v" && !e.target.matches("input,textarea")) {
        e.preventDefault();
        doPaste(mouseCanvasRef.current);
        return;
      }
      if (e.key === "Escape") {
        setConnFrom(null); setSelected(null); setMultiSelected([]); setMultiSelectMode(false);
        setSelBox(null); selBoxStartRef.current = null;
        return;
      }
      if ((e.key === "Delete" || e.key === "Backspace") && !e.target.matches("input,textarea")) {
        if (multiSelected.length > 0) {
          const ids = new Set(multiSelected);
          const nn = nodesRef.current.filter(n => !ids.has(n.id));
          const ne = edgesRef.current.filter(ed => !ids.has(ed.src) && !ids.has(ed.tgt));
          setNodes(nn); setEdges(ne); setMultiSelected([]);
          pushHistRef.current(nn, ne);
        } else if (selected) {
          const cur = nodesRef.current, curE = edgesRef.current;
          let nn = cur, ne = curE;
          if (selected.type === "node") {
            nn = cur.filter(n => n.id !== selected.id);
            ne = curE.filter(e => e.src !== selected.id && e.tgt !== selected.id);
          } else {
            ne = curE.filter(e => e.id !== selected.id);
          }
          setNodes(nn); setEdges(ne); setSelected(null);
          pushHistRef.current(nn, ne);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected, multiSelected, undo, redo, doPaste]);

  // ── Canvas / node handlers ────────────────────────────────────────────────────
  function getAbsPortPos(node, port) {
    const h = node.h || 60, w = node.w || 200;
    if (port === "top")    return { x: node.x+w/2, y: node.y };
    if (port === "bottom") return { x: node.x+w/2, y: node.y+h };
    if (port === "left")   return { x: node.x,     y: node.y+h/2 };
    if (port === "right")  return { x: node.x+w,   y: node.y+h/2 };
    return { x: node.x+w/2, y: node.y+h/2 };
  }

  const onCanvasMouseDown = useCallback((e) => {
    const onCanvas = e.target === canvasRef.current || e.target.classList.contains("canvas-inner") || e.target.classList.contains("grid-bg");
    if (!onCanvas) return;
    if (connFrom) { setConnFrom(null); return; }
    if (e.shiftKey) {
      const rect = canvasRef.current.getBoundingClientRect();
      const cx = (e.clientX - rect.left - pan.x) / zoom;
      const cy = (e.clientY - rect.top - pan.y) / zoom;
      selBoxStartRef.current = { x: cx, y: cy };
      setSelBox({ x0: cx, y0: cy, x1: cx, y1: cy });
      setSelected(null);
    } else {
      setIsPanning(true); setPanStart({ x: e.clientX-pan.x, y: e.clientY-pan.y }); setSelected(null);
      setMultiSelected([]); setMultiSelectMode(false);
    }
  }, [pan, zoom, connFrom]);

  const onCanvasMouseMove = useCallback((e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const pos = { x: (e.clientX-rect.left-pan.x)/zoom, y: (e.clientY-rect.top-pan.y)/zoom };
    setMouseCanvas(pos);
    mouseCanvasRef.current = pos;
    if (selBoxStartRef.current) {
      setSelBox({ x0: selBoxStartRef.current.x, y0: selBoxStartRef.current.y, x1: pos.x, y1: pos.y });
      return;
    }
    if (isPanning && panStart) setPan({ x: e.clientX-panStart.x, y: e.clientY-panStart.y });
    if (dragging) {
      const dx = (e.clientX-dragging.startX)/zoom, dy = (e.clientY-dragging.startY)/zoom;
      if (dragging.origPositions) {
        setNodes(p => p.map(n => {
          const orig = dragging.origPositions[n.id];
          return orig ? { ...n, x: orig.x+dx, y: orig.y+dy } : n;
        }));
      } else {
        setNodes(p => p.map(n => n.id === dragging.nodeId ? { ...n, x: dragging.origX+dx, y: dragging.origY+dy } : n));
      }
    }
  }, [isPanning, panStart, dragging, pan, zoom]);

  const onCanvasMouseUp = useCallback(() => {
    if (selBoxStartRef.current) {
      setSelBox(prev => {
        if (prev) {
          const x0 = Math.min(prev.x0, prev.x1), x1 = Math.max(prev.x0, prev.x1);
          const y0 = Math.min(prev.y0, prev.y1), y1 = Math.max(prev.y0, prev.y1);
          const inside = nodesRef.current.filter(n =>
            n.x < x1 && n.x + (n.w || 180) > x0 && n.y < y1 && n.y + (n.h || 44) > y0
          ).map(n => n.id);
          setMultiSelected(inside);
        }
        return null;
      });
      selBoxStartRef.current = null;
      return;
    }
    if (dragging) setTimeout(() => pushHistRef.current(nodesRef.current, edgesRef.current), 0);
    setIsPanning(false); setPanStart(null); setDragging(null);
  }, [dragging]);

  const zoomTo = useCallback((nz, pivotX, pivotY) => {
    if (!canvasRef.current) return;
    nz = Math.min(3, Math.max(0.2, nz));
    const prev = zoomRef.current;
    const w = canvasRef.current.clientWidth, h = canvasRef.current.clientHeight;
    const px = pivotX ?? w / 2, py = pivotY ?? h / 2;
    const p = panRef.current;
    setZoom(nz);
    setPan({ x: px - (px - p.x) * (nz / prev), y: py - (py - p.y) * (nz / prev) });
  }, []);

  const zoomBy = useCallback((factor, pivotX, pivotY) => {
    zoomTo(zoomRef.current * factor, pivotX, pivotY);
  }, [zoomTo]);

  const onWheel = useCallback((e) => {
    e.preventDefault();
    const rect = canvasRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    zoomBy(e.deltaY > 0 ? 0.9 : 1.1, mx, my);
  }, [zoomBy]);

  const onNodeMouseDown = useCallback((e, nodeId) => {
    if (viewOnlyRef.current) return;
    if (connFrom) return;
    e.stopPropagation();
    if (e.shiftKey || multiSelectMode) {
      setSelected(null);
      setMultiSelected(prev => prev.includes(nodeId) ? prev.filter(id => id !== nodeId) : [...prev, nodeId]);
      return;
    }
    const curMulti = multiSelected;
    if (curMulti.length > 1 && curMulti.includes(nodeId)) {
      const origPositions = {};
      nodes.forEach(n => { if (curMulti.includes(n.id)) origPositions[n.id] = { x: n.x, y: n.y }; });
      setDragging({ nodeId, startX: e.clientX, startY: e.clientY, origPositions });
    } else {
      const node = nodes.find(n => n.id === nodeId);
      setDragging({ nodeId, startX: e.clientX, startY: e.clientY, origX: node.x, origY: node.y });
      setSelected({ type: "node", id: nodeId });
      setMultiSelected([]);
    }
  }, [connFrom, nodes, multiSelected]);

  const onNodeClick = useCallback((e, nodeId) => {
    if (!connFrom) return;
    e.stopPropagation();
    if (connFrom.nodeId === nodeId) { setConnFrom(null); return; }
    const src = nodes.find(n => n.id === connFrom.nodeId), tgt = nodes.find(n => n.id === nodeId);
    const auto = bestPorts(src, tgt);
    const eid = makeEdgeId();
    const newEdge = { id: eid, src: connFrom.nodeId, srcPort: connFrom.port||auto.srcPort, tgt: nodeId, tgtPort: auto.tgtPort, label: "", relSrc: "", relTgt: "" };
    const newEdges = [...edgesRef.current, newEdge];
    setEdges(newEdges); setConnFrom(null); setSelected({ type: "edge", id: eid });
    pushHistRef.current(nodesRef.current, newEdges);
  }, [connFrom, nodes]);

  const onPortClick = useCallback((e, nodeId, port) => {
    e.stopPropagation();
    if (!connFrom) { setConnFrom({ nodeId, port }); return; }
    if (connFrom.nodeId === nodeId) { setConnFrom(null); return; }
    const eid = makeEdgeId();
    const newEdge = { id: eid, src: connFrom.nodeId, srcPort: connFrom.port||"right", tgt: nodeId, tgtPort: port, label: "", relSrc: "", relTgt: "" };
    const newEdges = [...edgesRef.current, newEdge];
    setEdges(newEdges); setConnFrom(null); setSelected({ type: "edge", id: eid });
    pushHistRef.current(nodesRef.current, newEdges);
  }, [connFrom]);

  const addNode = () => {
    const id = makeNodeId();
    const newNode = { id, name: "New Node", body: "", x: (-pan.x/zoom)+200+Math.random()*100, y: (-pan.y/zoom)+200+Math.random()*80, w: 180, h: 44, showBody: true, showNeighbors: true };
    const newNodes = [...nodes, newNode];
    setNodes(newNodes); setSelected({ type: "node", id });
    pushHistory(newNodes, edges);
    pendingFocusId.current = id;
    setSidebarOpen(true);
  };

  const deleteSelected = useCallback(() => {
    if (!selected) return;
    const cur = nodesRef.current, curE = edgesRef.current;
    let nn = cur, ne = curE;
    if (selected.type === "node") {
      nn = cur.filter(n => n.id !== selected.id);
      ne = curE.filter(e => e.src !== selected.id && e.tgt !== selected.id);
    } else {
      ne = curE.filter(e => e.id !== selected.id);
    }
    setNodes(nn); setEdges(ne); setSelected(null);
    pushHistory(nn, ne);
  }, [selected, pushHistory]);

  const deleteEdge = useCallback((eid) => {
    const ne = edgesRef.current.filter(e => e.id !== eid);
    setEdges(ne);
    if (selected?.id === eid) setSelected(null);
    pushHistory(nodesRef.current, ne);
  }, [selected, pushHistory]);

  const autoSort = useCallback(() => {
    const curNodes = nodesRef.current;
    if (curNodes.length === 0) return;
    const gapX = settingsRef.current.layout?.minGapX ?? 40;
    const gapY = settingsRef.current.layout?.minGapY ?? 40;
    const cellW = Math.max(...curNodes.map(n => n.w || 180)) + gapX;
    const cellH = Math.max(...curNodes.map(n => n.h || 44)) + gapY;
    const occupied = new Set();
    const assignments = new Map();
    // Process in diagonal order so nodes keep their relative positions
    const sorted = [...curNodes].sort((a, b) => (a.x + a.y) - (b.x + b.y));
    for (const n of sorted) {
      const baseCol = Math.round(n.x / cellW);
      const baseRow = Math.round(n.y / cellH);
      let placed = false;
      for (let radius = 0; radius <= 30 && !placed; radius++) {
        for (let dc = -radius; dc <= radius && !placed; dc++) {
          for (let dr = -radius; dr <= radius && !placed; dr++) {
            if (Math.max(Math.abs(dc), Math.abs(dr)) !== radius) continue;
            const key = `${baseCol + dc},${baseRow + dr}`;
            if (!occupied.has(key)) {
              occupied.add(key);
              assignments.set(n.id, { x: (baseCol + dc) * cellW, y: (baseRow + dr) * cellH });
              placed = true;
            }
          }
        }
      }
    }
    const newNodes = curNodes.map(n => { const p = assignments.get(n.id); return p ? { ...n, ...p } : n; });
    setNodes(newNodes);
    pushHistRef.current(newNodes, edgesRef.current);
  }, []);

  const updateNode = (id, field, val) => {
    setNodes(p => p.map(n => n.id === id ? { ...n, [field]: val } : n));
    deferCommit();
  };
  const updateEdge = (id, field, val) => {
    setEdges(p => p.map(e => e.id === id ? { ...e, [field]: val } : e));
    deferCommit();
  };


  const centerView = useCallback(() => {
    if (!nodes.length || !canvasRef.current) return;
    const minX = Math.min(...nodes.map(n => n.x)), maxX = Math.max(...nodes.map(n => n.x+(n.w||180)));
    const minY = Math.min(...nodes.map(n => n.y)), maxY = Math.max(...nodes.map(n => n.y+(n.h||60)));
    const ww = canvasRef.current.clientWidth, wh = canvasRef.current.clientHeight, pad = 80;
    const nz = Math.min((ww-pad*2)/Math.max(maxX-minX,1), (wh-pad*2)/Math.max(maxY-minY,1), 1.5);
    setZoom(nz);
    setPan({ x: (ww-(maxX-minX)*nz)/2-minX*nz, y: (wh-(maxY-minY)*nz)/2-minY*nz });
  }, [nodes]);
  const centerViewRef = useRef(centerView);
  useEffect(() => { centerViewRef.current = centerView; }, [centerView]);
  useEffect(() => {
    const frame = requestAnimationFrame(() => centerViewRef.current());
    return () => cancelAnimationFrame(frame);
  }, [activeMapId]);

  const addConnFromInput = useCallback((targetNode) => {
    if (!selectedNode || !targetNode || targetNode.id === selectedNode.id) return;
    const { srcPort, tgtPort } = bestPorts(selectedNode, targetNode);
    const eid = makeEdgeId();
    const newEdge = { id: eid, src: selectedNode.id, srcPort, tgt: targetNode.id, tgtPort, label: "", relSrc: "", relTgt: "" };
    const newEdges = [...edgesRef.current, newEdge];
    setEdges(newEdges); setAddConnInput(""); setShowDrop(false);
    pushHistory(nodesRef.current, newEdges);
  }, [selectedNode, pushHistory]);

  function getNeighbors(nodeId) {
    const out = [];
    for (const e of edges) {
      if (e.src === nodeId) { const t = nodes.find(n => n.id === e.tgt); if (t) out.push({ name: t.name, rel: e.relTgt||"", pathName: e.label||"" }); }
      if (e.tgt === nodeId) { const s = nodes.find(n => n.id === e.src); if (s) out.push({ name: s.name, rel: e.relSrc||"", pathName: e.label||"" }); }
    }
    return out;
  }

  function edgeMid(e) {
    const sn = nodes.find(n => n.id === e.src), tn = nodes.find(n => n.id === e.tgt);
    if (!sn || !tn) return null;
    const sp = getAbsPortPos(sn, e.srcPort||"right"), tp = getAbsPortPos(tn, e.tgtPort||"left");
    return { x: (sp.x+tp.x)/2, y: (sp.y+tp.y)/2, sp, tp };
  }

  const isHeader = n => !n.body || n.body.trim() === "";

  const connPreview = connFrom ? (() => {
    const src = nodes.find(n => n.id === connFrom.nodeId);
    if (!src) return null;
    return connFrom.port ? getAbsPortPos(src, connFrom.port) : { x: src.x+(src.w||180)/2, y: src.y+(src.h||60)/2 };
  })() : null;

  const dropItems = selectedNode && addConnInput
    ? nodes.filter(n => n.id !== selectedNode.id && (n.name.toLowerCase().includes(addConnInput.toLowerCase()) || n.id.includes(addConnInput)))
    : [];

  const nodeEdges = selectedNode ? edges.filter(e => e.src === selectedNode.id || e.tgt === selectedNode.id) : [];

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{FONTS}{STYLES}</style>
      <div className="app">
        {viewOnly && (
          <div style={{ position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)", zIndex: 200, background: "var(--surface)", border: "1px solid var(--border2)", borderRadius: 6, padding: "6px 14px", display: "flex", alignItems: "center", gap: 10, fontSize: 11, color: "var(--muted)", pointerEvents: "auto", boxShadow: "0 4px 16px rgba(0,0,0,0.5)" }}>
            <span>Viewing <span style={{ color: "var(--text)" }}>{sharedMapName}</span> — read only</span>
            <button className="btn" style={{ padding: "2px 8px", fontSize: 10 }} onClick={exitSharedView}>✕</button>
          </div>
        )}
        <div
          className={`canvas-wrap${isPanning ? " panning" : ""}${connFrom ? " connecting" : ""}`}
          style={{ backgroundColor: background.bgColor || "#0e0f11" }}
          ref={canvasRef}
          onMouseDown={onCanvasMouseDown}
          onMouseMove={onCanvasMouseMove}
          onMouseUp={onCanvasMouseUp}
          onMouseEnter={() => { canvasHoveredRef.current = true; }}
          onMouseLeave={() => { canvasHoveredRef.current = false; onCanvasMouseUp(); }}
          onWheel={onWheel}
        >
          {background.imageUrl
            ? <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${background.imageUrl})`, backgroundSize: "cover", backgroundPosition: "center", pointerEvents: "none" }}/>
            : background.type !== "plain" && (
                <svg className="grid-bg" width="100%" height="100%">
                  <defs>
                    {background.type === "grid"
                      ? <pattern id="bg-pat" width={20*zoom} height={20*zoom} patternUnits="userSpaceOnUse" x={pan.x%(20*zoom)} y={pan.y%(20*zoom)}>
                          <path d={`M ${20*zoom} 0 L 0 0 0 ${20*zoom}`} fill="none" stroke={background.dotColor || "#2a2c30"} strokeWidth="0.5"/>
                        </pattern>
                      : <pattern id="bg-pat" width={20*zoom} height={20*zoom} patternUnits="userSpaceOnUse" x={pan.x%(20*zoom)} y={pan.y%(20*zoom)}>
                          <circle cx={20*zoom} cy={20*zoom} r="0.8" fill={background.dotColor || "#2a2c30"}/>
                        </pattern>
                    }
                  </defs>
                  <rect width="100%" height="100%" fill="url(#bg-pat)"/>
                </svg>
              )
          }

          <div className="canvas-inner" style={{ transform: `translate3d(${pan.x}px,${pan.y}px,0) scale(${zoom})` }}>
            <svg className="edges-svg">
              <defs>
                <marker id="arr" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6 Z" fill="var(--border2)"/></marker>
                <marker id="arr-sel" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6 Z" fill="var(--accent)"/></marker>
              </defs>
              {edges.map(e => {
                const mid = edgeMid(e);
                if (!mid) return null;
                const { sp, tp } = mid;
                const d = cubicPath(sp.x, sp.y, tp.x, tp.y);
                const isSel = selected?.id === e.id;
                const hasLabel = e.label || e.relSrc || e.relTgt;
                const _color = e.lineColor || settings.edge.color || undefined;
                const _width = e.lineWidth ?? settings.edge.width;
                const _style = e.lineStyle || settings.edge.style;
                const _dashArray = _style === "dashed" ? "8 4" : _style === "dotted" ? "2 4" : undefined;
                const _labelW = e.labelWidth ?? settings.edge.labelWidth;
                const _labelSize = e.labelSize ?? settings.edge.labelSize;
                const markerId = isSel ? "arr-sel" : _color ? `arr-c-${e.id}` : "arr";
                return (
                  <g key={e.id}>
                    {_color && !isSel && (
                      <defs>
                        <marker id={`arr-c-${e.id}`} markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                          <path d="M0 0 L6 3 L0 6 Z" fill={_color}/>
                        </marker>
                      </defs>
                    )}
                    <path d={d} className={`edge-path${isSel ? " selected" : ""}`}
                      style={{ ...(_color && !isSel ? { stroke: _color } : {}), strokeWidth: _width, ...(_dashArray ? { strokeDasharray: _dashArray } : {}) }}
                      markerEnd={`url(#${markerId})`}
                    />
                    <path d={d} className="edge-hit" onClick={() => setSelected({ type: "edge", id: e.id })}/>
                    {hasLabel && (
                      <g>
                        <rect x={mid.x - _labelW/2} y={mid.y-10} width={_labelW} height={20} rx="3" className="edge-label-bg" opacity="0.9"/>
                        {e.label
                          ? <text x={mid.x} y={mid.y+1} textAnchor="middle" dominantBaseline="middle" className="edge-label-text" style={{ fontSize: _labelSize }}>{e.label}</text>
                          : <text x={mid.x} y={mid.y+1} textAnchor="middle" dominantBaseline="middle" className="edge-rel-text" style={{ fontSize: _labelSize }}>{e.relSrc}→{e.relTgt}</text>
                        }
                      </g>
                    )}
                  </g>
                );
              })}
              {connPreview && <line className="connecting-preview" x1={connPreview.x} y1={connPreview.y} x2={mouseCanvas.x} y2={mouseCanvas.y}/>}
            </svg>

            {nodes.map(n => {
              const nbrs = getNeighbors(n.id);
              const showBody = n.showBody && globalShow.body && n.body;
              const showNbr = n.showNeighbors && globalShow.neighbors && nbrs.length > 0;
              const isHdr = isHeader(n);
              const _nameSize = n.nameSize ?? (isHdr ? settings.header.nameSize : settings.node.nameSize);
              const _nameColor = n.nameColor || (isHdr ? settings.header.nameColor || undefined : settings.node.nameColor || undefined);
              const _bodySize = n.bodySize ?? settings.node.bodySize;
              const _bodyColor = n.bodyColor || settings.node.bodyColor || undefined;
              const _width = n.maxWidth ?? settings.node.maxWidth;
              return (
                <div
                  key={n.id}
                  data-node-id={n.id}
                  className={`node${selected?.id === n.id ? " selected" : ""}${multiSelected.includes(n.id) ? " multi-selected" : ""}${dragging?.nodeId === n.id ? " dragging" : ""}${isHdr ? " header-node" : ""}${connFrom?.nodeId === n.id ? " conn-source" : ""}`}
                  style={{ left: n.x, top: n.y, width: _width }}
                  ref={el => { if (el) nodeRefs.current[n.id] = el; }}
                  onMouseDown={e => onNodeMouseDown(e, n.id)}
                  onClick={e => onNodeClick(e, n.id)}
                >
                  <div className="node-name" style={{ fontSize: _nameSize, ...(_nameColor ? { color: _nameColor } : {}) }}><div className="node-dot"/><span className="node-name-text">{n.name}</span></div>
                  {globalShow.nodeIds && <div className="node-id-badge">{n.id}</div>}
                  {showBody && <div className="node-body" style={{ fontSize: _bodySize, ...(_bodyColor ? { color: _bodyColor } : {}) }}>{n.body}</div>}
                  {showNbr && (
                    <div className="node-neighbors">
                      <div className="node-neighbors-label">connections</div>
                      {nbrs.map((nb, i) => (
                        <div key={i} className="node-neighbor-item">
                          <span>↔</span><span>{nb.name}</span>
                          {globalShow.neighborPath && nb.pathName && <span className="rel">/{nb.pathName}</span>}
                          {globalShow.neighborRel && nb.rel && <span className="rel">[{nb.rel}]</span>}
                        </div>
                      ))}
                    </div>
                  )}
                  {n.imageUrl && <img src={n.imageUrl} className="node-img" alt="" draggable={false} onError={e => { e.target.style.display = "none"; }}/>}
                  {["top","bottom","left","right"].map(p => (
                    <div key={p} className={`port ${p}`} onClick={e => onPortClick(e, n.id, p)}/>
                  ))}
                </div>
              );
            })}
            {selBox && (
              <div className="sel-box" style={{
                left: Math.min(selBox.x0, selBox.x1),
                top: Math.min(selBox.y0, selBox.y1),
                width: Math.abs(selBox.x1 - selBox.x0),
                height: Math.abs(selBox.y1 - selBox.y0),
              }}/>
            )}
          </div>

          {nodes.length === 0 && (
            <div className="empty-hint"><div className="big">◈</div><p>Click "+ Node" to get started</p></div>
          )}

          {isMobile && sidebarOpen && (
            <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 99, cursor: "pointer" }} onClick={() => setSidebarOpen(false)}/>
          )}
          {isMobile && <button className="sidebar-toggle" onClick={() => setSidebarOpen(o => !o)}>☰</button>}

          <div className="toolbar">
            {!viewOnly && <>
              <button className="tool-btn" onClick={undo} disabled={!canUndo} title="Undo (⌘Z)">⟲</button>
              <button className="tool-btn" onClick={redo} disabled={!canRedo} title="Redo (⌘⇧Z)">⟳</button>
              <div className="tool-sep"/>
              <button className="tool-btn" onClick={addNode}>+ Node</button>
              <div className="tool-sep"/>
            </>}
            <button className="tool-btn" onClick={() => zoomBy(1/1.25)} title="Zoom out">－</button>
            <input
              type="number" min={20} max={300}
              value={zoomText}
              onChange={e => setZoomText(e.target.value)}
              onFocus={() => { zoomFocused.current = true; }}
              onBlur={e => {
                zoomFocused.current = false;
                const v = parseInt(e.target.value);
                if (!isNaN(v)) zoomTo(v / 100);
                else setZoomText(String(Math.round(zoomRef.current * 100)));
              }}
              onKeyDown={e => {
                if (e.key === "Enter") e.target.blur();
                if (e.key === "Escape") { setZoomText(String(Math.round(zoomRef.current * 100))); e.target.blur(); }
                e.stopPropagation();
              }}
              style={{ width: 42, background: "var(--surface2)", border: "1px solid var(--border2)", borderRadius: 4, color: "var(--text)", fontFamily: "var(--mono)", fontSize: 10, textAlign: "center", padding: "2px 2px", outline: "none" }}
              title="Zoom %"
            /><span style={{ fontSize: 10, color: "var(--muted)", alignSelf: "center", paddingRight: 2 }}>%</span>
            <button className="tool-btn" onClick={() => zoomBy(1.25)} title="Zoom in">＋</button>
            <button className="tool-btn" onClick={centerView} title="Fit to view">⊙</button>
            {multiSelected.length > 1 && (
              <>
                <div className="tool-sep"/>
                <span style={{ fontSize: 10, color: "var(--accent2)", padding: "0 4px", alignSelf: "center" }}>{multiSelected.length} selected</span>
                <button className="tool-btn" style={{ color: "var(--danger)" }} onClick={() => {
                  const ids = new Set(multiSelected);
                  const nn = nodes.filter(n => !ids.has(n.id));
                  const ne = edges.filter(e => !ids.has(e.src) && !ids.has(e.tgt));
                  setNodes(nn); setEdges(ne); setMultiSelected([]);
                  pushHistory(nn, ne);
                }}>✕ Delete all</button>
              </>
            )}
            {selected && multiSelected.length === 0 && (
              <>
                <div className="tool-sep"/>
                <button className="tool-btn" onClick={deleteSelected} style={{ color: "var(--danger)" }}>✕ Delete</button>
              </>
            )}
          </div>

          <div className="infobar">
            <span>{nodes.length} nodes</span>
            <span>{edges.length} edges</span>
            <span>{Math.round(zoom * 100)}%</span>
            {connFrom && <span className="infobar-hint">click target — esc to cancel</span>}
            {multiSelected.length > 0 && <span className="infobar-hint">shift+click to add/remove · drag any selected node to move group</span>}
          </div>
        </div>

        {/* Sidebar */}
        <div className={`sidebar${isMobile && sidebarOpen ? " open" : ""}`} style={{ width: sidebarWidth }} onWheel={e => e.stopPropagation()}>
          <div className="sidebar-resize" onMouseDown={e => { resizing.current = { startX: e.clientX, startWidth: sidebarWidth }; e.preventDefault(); }}/>

          <div className="sidebar-header">
            <span className="sidebar-title">{sidebarTab === "help" ? "Help & Docs" : sidebarTab === "maps" ? "Maps" : multiSelected.length > 0 ? `${multiSelected.length} Nodes` : selectedNode ? "Node" : selectedEdge ? "Edge" : "Mind Map"}</span>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              {selected && sidebarTab === "edit" && multiSelected.length === 0 && <button className="btn danger" style={{ padding: "3px 8px", fontSize: "10px" }} onClick={deleteSelected}>delete</button>}
              {isMobile && <button style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: 18, padding: "0 2px", lineHeight: 1 }} onClick={() => setSidebarOpen(false)}>×</button>}
            </div>
          </div>
          <div className="sidebar-tabs">
            <button className={`sidebar-tab${sidebarTab === "edit" ? " active" : ""}`} onClick={() => setSidebarTab("edit")}>Edit</button>
            <button className={`sidebar-tab${sidebarTab === "maps" ? " active" : ""}`} onClick={() => setSidebarTab("maps")}>Maps</button>
            <button className={`sidebar-tab${sidebarTab === "help" ? " active" : ""}`} onClick={() => setSidebarTab("help")}>Help</button>
          </div>

          <div className="sidebar-body">

            {/* ── Node editor ── */}
            {sidebarTab === "edit" && selectedNode && (
              <>
                <div className="field">
                  <label>Name</label>
                  <input
                    ref={nameInputRef}
                    value={selectedNode.name}
                    onChange={e => updateNode(selectedNode.id, "name", e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); bodyTextareaRef.current?.focus(); } }}
                  />
                </div>
                <div style={{ fontSize: 10, color: "var(--muted)", fontFamily: "var(--mono)", marginTop: -6 }}>{selectedNode.id}</div>
                <div className="field">
                  <label>Body / Notes</label>
                  <textarea ref={bodyTextareaRef} placeholder="Leave empty to make this a header node…" value={selectedNode.body} onChange={e => updateNode(selectedNode.id, "body", e.target.value)}/>
                </div>
                <div className="field">
                  <label>Image URL</label>
                  <input value={selectedNode.imageUrl || ""} placeholder="https://…" onChange={e => updateNode(selectedNode.id, "imageUrl", e.target.value)}/>
                </div>

                <div className="section-label">Display</div>
                <div className="toggle-group">
                  {[["showBody","Show body"],["showNeighbors","Show neighbors"]].map(([k,l]) => (
                    <div className="toggle-row" key={k}>
                      <span className="toggle-label">{l}</span>
                      <label className="toggle">
                        <input type="checkbox" checked={selectedNode[k]} onChange={e => updateNode(selectedNode.id, k, e.target.checked)}/>
                        <div className="toggle-track"/><div className="toggle-thumb"/>
                      </label>
                    </div>
                  ))}
                </div>

                <div className="section-label" style={{ cursor: "pointer", userSelect: "none", display: "flex", justifyContent: "space-between" }} onClick={() => setNodeStyleOpen(o => !o)}>
                  Style overrides <span style={{ opacity: 0.6 }}>{nodeStyleOpen ? "▲" : "▼"}</span>
                </div>
                {nodeStyleOpen && (
                  <>
                    <div style={{ fontSize: 10, color: "var(--muted)", marginBottom: 4 }}>Leave blank to use map defaults.</div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <div className="field" style={{ flex: 1 }}>
                        <label>Name size (px)</label>
                        <input type="number" min="8" max="40" placeholder={isHeader(selectedNode) ? settings.header.nameSize : settings.node.nameSize} value={selectedNode.nameSize ?? ""} onChange={e => updateNode(selectedNode.id, "nameSize", e.target.value === "" ? null : Number(e.target.value))}/>
                      </div>
                      <div className="field" style={{ flex: 1 }}>
                        <label>Name color</label>
                        <input placeholder="inherit" value={selectedNode.nameColor || ""} onChange={e => updateNode(selectedNode.id, "nameColor", e.target.value)}/>
                      </div>
                    </div>
                    {!isHeader(selectedNode) && (
                      <div style={{ display: "flex", gap: 8 }}>
                        <div className="field" style={{ flex: 1 }}>
                          <label>Body size (px)</label>
                          <input type="number" min="8" max="40" placeholder={settings.node.bodySize} value={selectedNode.bodySize ?? ""} onChange={e => updateNode(selectedNode.id, "bodySize", e.target.value === "" ? null : Number(e.target.value))}/>
                        </div>
                        <div className="field" style={{ flex: 1 }}>
                          <label>Body color</label>
                          <input placeholder="inherit" value={selectedNode.bodyColor || ""} onChange={e => updateNode(selectedNode.id, "bodyColor", e.target.value)}/>
                        </div>
                      </div>
                    )}
                    <div className="field">
                      <label>Width (px)</label>
                      <input type="number" min="60" placeholder={settings.node.maxWidth} value={selectedNode.maxWidth ?? ""} onChange={e => updateNode(selectedNode.id, "maxWidth", e.target.value === "" ? null : Number(e.target.value))}/>
                    </div>
                  </>
                )}

                <div className="section-label">Connections</div>
                {nodeEdges.length === 0
                  ? <span style={{ fontSize: 11, color: "var(--muted)" }}>No connections yet.</span>
                  : nodeEdges.map(e => {
                    const other = nodes.find(n => n.id === (e.src === selectedNode.id ? e.tgt : e.src));
                    return (
                      <div key={e.id} className="conn-item">
                        <span style={{ color: "var(--accent)", fontFamily: "var(--mono)", flexShrink: 0 }}>↔</span>
                        <span className="conn-item-name" onClick={() => setSelected({ type: "edge", id: e.id })}>{other?.name || "?"}</span>
                        {e.label && <span className="conn-item-label">"{e.label}"</span>}
                        <button className="conn-remove" onClick={() => deleteEdge(e.id)}>×</button>
                      </div>
                    );
                  })
                }
                <div className="field">
                  <label>Add connection</label>
                  <input
                    value={addConnInput}
                    placeholder="Type node name or ID…"
                    onChange={e => { setAddConnInput(e.target.value); setShowDrop(true); }}
                    onFocus={() => setShowDrop(true)}
                    onBlur={() => setTimeout(() => setShowDrop(false), 150)}
                    onKeyDown={e => {
                      if (e.key === "Enter" && dropItems.length > 0) addConnFromInput(dropItems[0]);
                      if (e.key === "Escape") { setShowDrop(false); setAddConnInput(""); }
                    }}
                  />
                  {showDrop && addConnInput && (
                    <div className="conn-dropdown">
                      {dropItems.length > 0
                        ? dropItems.map(n => (
                          <div key={n.id} className="conn-dropdown-item" onMouseDown={() => addConnFromInput(n)}>
                            <span>{n.name}</span>
                            <span className="conn-dropdown-id">{n.id}</span>
                          </div>
                        ))
                        : <div className="conn-no-result">No matching nodes</div>
                      }
                    </div>
                  )}
                </div>

                <div className="section-label">Export node</div>
                <div className="btn-row">
                  <button className="btn" style={{ flex: 1 }} onClick={() => exportJSON(true)}>↓ JSON</button>
                  <button className="btn" style={{ flex: 1 }} onClick={() => exportCSV(true)}>↓ CSV</button>
                  <button className="btn" style={{ flex: 1 }} onClick={() => exportTXT(true)}>↓ TXT</button>
                </div>

                <div className="section-label">Copy / Multi-select</div>
                <div className="btn-row">
                  <button className="btn" style={{ flex: 1 }} onClick={() => {
                    const n = selectedNode;
                    if (n) { clipboardRef.current = { nodes: [n], edges: [] }; setHasClipboard(true); }
                  }}>Copy node</button>
                  <button
                    className={`btn${multiSelectMode ? " primary" : ""}`}
                    style={{ flex: 1 }}
                    onClick={() => {
                      if (!multiSelectMode) {
                        setMultiSelected(prev => prev.includes(selectedNode.id) ? prev : [...prev, selectedNode.id]);
                        setMultiSelectMode(true);
                        setSelected(null);
                      } else {
                        setMultiSelected([]); setMultiSelectMode(false);
                      }
                    }}
                  >{multiSelectMode ? "◉ Selecting…" : "◎ Multi-select"}</button>
                </div>
              </>
            )}

            {/* ── Edge editor ── */}
            {sidebarTab === "edit" && selectedEdge && (
              <>
                <div className="field">
                  <label>Path name / label</label>
                  <input value={selectedEdge.label} placeholder="e.g. supports, leads to…" onChange={e => updateEdge(selectedEdge.id, "label", e.target.value)}/>
                </div>
                <div className="section-label">Relation labels</div>
                <div className="field">
                  <label>Relation preset</label>
                  <select onChange={e => {
                    const p = RELATION_PRESETS[e.target.value];
                    if (p) { updateEdge(selectedEdge.id, "relSrc", p.src); updateEdge(selectedEdge.id, "relTgt", p.tgt); }
                  }} defaultValue="">
                    <option value="">— pick preset —</option>
                    {RELATION_PRESETS.map((p, i) => <option key={i} value={i}>{p.src} → {p.tgt}</option>)}
                  </select>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <div className="field" style={{ flex: 1 }}>
                    <label>Source label</label>
                    <input value={selectedEdge.relSrc} placeholder="e.g. parent" onChange={e => updateEdge(selectedEdge.id, "relSrc", e.target.value)}/>
                  </div>
                  <div className="field" style={{ flex: 1 }}>
                    <label>Target label</label>
                    <input value={selectedEdge.relTgt} placeholder="e.g. child" onChange={e => updateEdge(selectedEdge.id, "relTgt", e.target.value)}/>
                  </div>
                </div>
                <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
                  <span style={{ color: "var(--accent)", fontFamily: "var(--mono)" }}>{nodes.find(n => n.id === selectedEdge.src)?.name}</span>
                  {" → "}
                  <span style={{ color: "var(--accent2)", fontFamily: "var(--mono)" }}>{nodes.find(n => n.id === selectedEdge.tgt)?.name}</span>
                </div>

                <div className="section-label" style={{ cursor: "pointer", userSelect: "none", display: "flex", justifyContent: "space-between" }} onClick={() => setEdgeStyleOpen(o => !o)}>
                  Style overrides <span style={{ opacity: 0.6 }}>{edgeStyleOpen ? "▲" : "▼"}</span>
                </div>
                {edgeStyleOpen && (
                  <>
                    <div style={{ fontSize: 10, color: "var(--muted)", marginBottom: 4 }}>Leave blank to use map defaults.</div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <div className="field" style={{ flex: 1 }}>
                        <label>Line color</label>
                        <input placeholder="inherit" value={selectedEdge.lineColor || ""} onChange={e => updateEdge(selectedEdge.id, "lineColor", e.target.value)}/>
                      </div>
                      <div className="field" style={{ flex: 1 }}>
                        <label>Line width</label>
                        <input type="number" min="0.5" max="10" step="0.5" placeholder={settings.edge.width} value={selectedEdge.lineWidth ?? ""} onChange={e => updateEdge(selectedEdge.id, "lineWidth", e.target.value === "" ? null : Number(e.target.value))}/>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <div className="field" style={{ flex: 1 }}>
                        <label>Line style</label>
                        <select value={selectedEdge.lineStyle || ""} onChange={e => updateEdge(selectedEdge.id, "lineStyle", e.target.value || null)}>
                          <option value="">— map default —</option>
                          <option value="solid">Solid</option>
                          <option value="dashed">Dashed</option>
                          <option value="dotted">Dotted</option>
                        </select>
                      </div>
                      <div className="field" style={{ flex: 1 }}>
                        <label>Label size (px)</label>
                        <input type="number" min="7" max="24" placeholder={settings.edge.labelSize} value={selectedEdge.labelSize ?? ""} onChange={e => updateEdge(selectedEdge.id, "labelSize", e.target.value === "" ? null : Number(e.target.value))}/>
                      </div>
                    </div>
                    <div className="field">
                      <label>Label width (px)</label>
                      <input type="number" min="40" max="300" placeholder={settings.edge.labelWidth} value={selectedEdge.labelWidth ?? ""} onChange={e => updateEdge(selectedEdge.id, "labelWidth", e.target.value === "" ? null : Number(e.target.value))}/>
                    </div>
                  </>
                )}
              </>
            )}

            {/* ── Multi-select panel ── */}
            {sidebarTab === "edit" && multiSelected.length > 0 && (
              <>
                <div style={{ fontSize: 11, color: "var(--muted)", lineHeight: 1.7 }}>
                  <span style={{ color: "var(--text)" }}>{multiSelected.length}</span> nodes &nbsp;·&nbsp; <span style={{ color: "var(--text)" }}>{selectionEdgeCount}</span> connections
                </div>
                <div style={{ fontSize: 10, color: "var(--muted)" }}>
                  {multiSelectMode ? "◉ Tap any node to add or remove it" : "Shift+click or Shift+drag to adjust"}
                </div>

                <div className="section-label">Copy / Paste</div>
                <div className="btn-row">
                  <button className="btn" style={{ flex: 1 }} onClick={() => {
                    const ids = new Set(multiSelected);
                    clipboardRef.current = {
                      nodes: nodes.filter(n => ids.has(n.id)),
                      edges: edges.filter(e => ids.has(e.src) && ids.has(e.tgt)),
                    };
                    setHasClipboard(true);
                  }}>Copy</button>
                  <button className="btn" style={{ flex: 1 }} disabled={!hasClipboard} onClick={() => doPaste()}>Paste</button>
                </div>

                <div className="section-label">Export selection</div>
                <div className="btn-row">
                  <button className="btn" style={{ flex: 1 }} onClick={() => exportJSON(true)}>↓ JSON</button>
                  <button className="btn" style={{ flex: 1 }} onClick={() => exportCSV(true)}>↓ CSV</button>
                  <button className="btn" style={{ flex: 1 }} onClick={() => exportTXT(true)}>↓ TXT</button>
                </div>

                <div className="section-label" style={{ marginTop: 8 }}/>
                <button className="btn" style={{ width: "100%" }} onClick={() => { setMultiSelected([]); setMultiSelectMode(false); }}>
                  {multiSelectMode ? "◉ End selection mode" : "✕ Clear selection"}
                </button>
              </>
            )}

            {/* ── Global settings + export/import ── */}
            {sidebarTab === "edit" && !selected && multiSelected.length === 0 && (
              <>
                {hasClipboard && (
                  <>
                    <div className="section-label" style={{ marginTop: 0, borderTop: "none", paddingTop: 0 }}>Clipboard</div>
                    <button className="btn" style={{ width: "100%" }} onClick={() => doPaste()}>Paste at view centre</button>
                  </>
                )}
                <div className="section-label" style={{ marginTop: 0, borderTop: hasClipboard ? undefined : "none", paddingTop: 0 }}>Global display</div>
                <div className="toggle-group">
                  {[
                    ["body", "Show body on all nodes"],
                    ["neighbors", "Show neighbors list"],
                    ["neighborPath", "Show path name in neighbors"],
                    ["neighborRel", "Show relation in neighbors"],
                    ["nodeIds", "Show node IDs on canvas"],
                  ].map(([key, label]) => (
                    <div className="toggle-row" key={key}>
                      <span className="toggle-label">{label}</span>
                      <label className="toggle">
                        <input type="checkbox" checked={!!globalShow[key]} onChange={e => setGlobalShow(g => ({ ...g, [key]: e.target.checked }))}/>
                        <div className="toggle-track"/><div className="toggle-thumb"/>
                      </label>
                    </div>
                  ))}
                </div>

                <div className="section-label">Export</div>
                <div className="btn-row">
                  <button className="btn" style={{ flex: 1 }} onClick={() => exportJSON()}>↓ JSON</button>
                  <button className="btn" style={{ flex: 1 }} onClick={() => exportCSV()}>↓ CSV</button>
                  <button className="btn" style={{ flex: 1 }} onClick={() => exportTXT()}>↓ TXT</button>
                </div>

                <div className="section-label">Import</div>
                <div className="btn-row">
                  <label className="btn" style={{ flex: 1, cursor: "pointer", textAlign: "center" }}>
                    ↑ JSON
                    <input type="file" accept=".json" hidden onChange={e => { if (e.target.files[0]) { importJSON(e.target.files[0]); e.target.value = ""; } }}/>
                  </label>
                  <label className="btn" style={{ flex: 1, cursor: "pointer", textAlign: "center" }}>
                    ↑ TXT
                    <input type="file" accept=".txt" hidden onChange={e => { if (e.target.files[0]) { importTXT(e.target.files[0]); e.target.value = ""; } }}/>
                  </label>
                </div>
                <div style={{ fontSize: 10, color: "var(--muted)", lineHeight: 1.5 }}>Merges with current map. Imported nodes are placed beside existing ones.</div>

              </>
            )}

            {/* ── Maps tab ── */}
            {sidebarTab === "maps" && (
              <>
                <div className="section-label" style={{ marginTop: 0, borderTop: "none", paddingTop: 0 }}>Your maps</div>
                {maps.map(m => (
                  <div key={m.id} className={`map-item${m.id === activeMapId ? " active" : ""}`} onClick={() => switchToMap(m.id)}>
                    <div className="map-item-name">
                      {renamingMapId === m.id
                        ? <input
                            autoFocus
                            value={m.name}
                            onClick={e => e.stopPropagation()}
                            onChange={e => renameMap(m.id, e.target.value)}
                            onBlur={() => setRenamingMapId(null)}
                            onKeyDown={e => { if (e.key === "Enter" || e.key === "Escape") setRenamingMapId(null); e.stopPropagation(); }}
                          />
                        : m.name
                      }
                    </div>
                    {renamingMapId !== m.id && (
                      <button className="btn" style={{ padding: "2px 7px", fontSize: 10, flexShrink: 0 }} onClick={e => { e.stopPropagation(); setRenamingMapId(m.id); }}>✎</button>
                    )}
                    {maps.length > 1 && (
                      <button className="btn danger" style={{ padding: "2px 7px", fontSize: 10, flexShrink: 0 }} onClick={e => { e.stopPropagation(); deleteMap(m.id); }}>✕</button>
                    )}
                  </div>
                ))}
                <button className="btn primary" style={{ width: "100%" }} onClick={createNewMap}>+ New Map</button>

                {lastDeletedMapInfo && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", background: "rgba(200,122,122,0.1)", border: "1px solid var(--danger)", borderRadius: 5, fontSize: 11 }}>
                    <span style={{ flex: 1, color: "var(--muted)" }}>Deleted <span style={{ color: "var(--text)" }}>{lastDeletedMapInfo.map.name}</span></span>
                    <button className="btn" style={{ padding: "2px 8px", fontSize: 10, flexShrink: 0 }} onClick={restoreDeletedMap}>Restore</button>
                  </div>
                )}

                <div className="section-label" style={{ marginTop: 8, borderTop: "1px solid var(--border)", paddingTop: 10 }}>
                  {user ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ flex: 1, fontSize: 11, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.email}</span>
                        {syncing && <span style={{ fontSize: 9, color: "var(--muted)", flexShrink: 0 }}>syncing…</span>}
                      </div>
                      <button className="btn" style={{ width: "100%", fontSize: 11 }} onClick={signOut}>Sign out</button>
                    </div>
                  ) : (
                    <button className="btn primary" style={{ width: "100%", fontSize: 11 }} onClick={signIn}>Sign in with Google</button>
                  )}
                </div>

                {(() => {
                  const activeMap = maps.find(m => m.id === activeMapId);
                  const vis = activeMap?.visibility || "private";
                  const token = activeMap?.shareToken;
                  const shareUrl = token ? `${window.location.origin}?share=${token}` : null;
                  return (
                    <>
                      <div className="section-label">Sharing</div>
                      {user ? (
                        <>
                          <div className="bg-type-row">
                            {[["private","🔒 Private"],["link","🔗 Link only"],["public","🌐 Public"]].map(([v,label]) => (
                              <button key={v} className={`bg-type-btn${vis === v ? " active" : ""}`} onClick={() => setMapVisibility(v)}>{label}</button>
                            ))}
                          </div>
                          {vis !== "private" && shareUrl && (
                            <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
                              <input readOnly value={shareUrl} style={{ flex: 1, background: "var(--surface2)", border: "1px solid var(--border2)", borderRadius: 4, color: "var(--muted)", fontSize: 9, padding: "4px 6px", fontFamily: "var(--mono)", minWidth: 0 }} onClick={e => e.target.select()} />
                              <button className="btn" style={{ padding: "3px 8px", fontSize: 10, flexShrink: 0 }} onClick={() => navigator.clipboard.writeText(shareUrl)}>Copy</button>
                            </div>
                          )}
                        </>
                      ) : (
                        <div style={{ fontSize: 11, color: "var(--muted)", paddingBottom: 4 }}>Sign in to share maps</div>
                      )}
                    </>
                  );
                })()}

                <div className="section-label" style={{ cursor: "pointer", userSelect: "none", display: "flex", justifyContent: "space-between" }} onClick={() => setStyleDefaultsOpen(o => !o)}>
                  Style defaults <span style={{ opacity: 0.6 }}>{styleDefaultsOpen ? "▲" : "▼"}</span>
                </div>
                {styleDefaultsOpen && (
                  <>
                    <div style={{ fontSize: 10, color: "var(--muted)", marginBottom: 2 }}>Header nodes (no body)</div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <div className="field" style={{ flex: 1 }}>
                        <label>Name size (px)</label>
                        <input type="number" min="8" max="40" value={settings.header.nameSize} onChange={e => setSettings(s => ({ ...s, header: { ...s.header, nameSize: Number(e.target.value) } }))}/>
                      </div>
                      <div className="field" style={{ flex: 1 }}>
                        <label>Name color</label>
                        <input placeholder="default" value={settings.header.nameColor} onChange={e => setSettings(s => ({ ...s, header: { ...s.header, nameColor: e.target.value } }))}/>
                      </div>
                    </div>
                    <div style={{ fontSize: 10, color: "var(--muted)", marginBottom: 2, marginTop: 4 }}>Body nodes</div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <div className="field" style={{ flex: 1 }}>
                        <label>Name size (px)</label>
                        <input type="number" min="8" max="40" value={settings.node.nameSize} onChange={e => setSettings(s => ({ ...s, node: { ...s.node, nameSize: Number(e.target.value) } }))}/>
                      </div>
                      <div className="field" style={{ flex: 1 }}>
                        <label>Name color</label>
                        <input placeholder="default" value={settings.node.nameColor} onChange={e => setSettings(s => ({ ...s, node: { ...s.node, nameColor: e.target.value } }))}/>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <div className="field" style={{ flex: 1 }}>
                        <label>Body size (px)</label>
                        <input type="number" min="8" max="40" value={settings.node.bodySize} onChange={e => setSettings(s => ({ ...s, node: { ...s.node, bodySize: Number(e.target.value) } }))}/>
                      </div>
                      <div className="field" style={{ flex: 1 }}>
                        <label>Body color</label>
                        <input placeholder="default" value={settings.node.bodyColor} onChange={e => setSettings(s => ({ ...s, node: { ...s.node, bodyColor: e.target.value } }))}/>
                      </div>
                    </div>
                    <div className="field">
                      <label>Node width (px)</label>
                      <input type="number" min="60" value={settings.node.maxWidth} onChange={e => setSettings(s => ({ ...s, node: { ...s.node, maxWidth: Number(e.target.value) } }))}/>
                    </div>
                    <div style={{ fontSize: 10, color: "var(--muted)", marginBottom: 2, marginTop: 4 }}>Edges / paths</div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <div className="field" style={{ flex: 1 }}>
                        <label>Line color</label>
                        <input placeholder="default" value={settings.edge.color} onChange={e => setSettings(s => ({ ...s, edge: { ...s.edge, color: e.target.value } }))}/>
                      </div>
                      <div className="field" style={{ flex: 1 }}>
                        <label>Line width</label>
                        <input type="number" min="0.5" max="10" step="0.5" value={settings.edge.width} onChange={e => setSettings(s => ({ ...s, edge: { ...s.edge, width: Number(e.target.value) } }))}/>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <div className="field" style={{ flex: 1 }}>
                        <label>Line style</label>
                        <select value={settings.edge.style} onChange={e => setSettings(s => ({ ...s, edge: { ...s.edge, style: e.target.value } }))}>
                          <option value="solid">Solid</option>
                          <option value="dashed">Dashed</option>
                          <option value="dotted">Dotted</option>
                        </select>
                      </div>
                      <div className="field" style={{ flex: 1 }}>
                        <label>Label size (px)</label>
                        <input type="number" min="7" max="24" value={settings.edge.labelSize} onChange={e => setSettings(s => ({ ...s, edge: { ...s.edge, labelSize: Number(e.target.value) } }))}/>
                      </div>
                    </div>
                    <div className="field">
                      <label>Label width (px)</label>
                      <input type="number" min="40" max="300" value={settings.edge.labelWidth} onChange={e => setSettings(s => ({ ...s, edge: { ...s.edge, labelWidth: Number(e.target.value) } }))}/>
                    </div>
                    <button className="btn" style={{ fontSize: 10 }} onClick={() => setSettings({ ...DEFAULT_SETTINGS })}>↺ Reset to defaults</button>
                  </>
                )}

                <div className="section-label">Layout</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <div className="field" style={{ flex: 1 }}>
                    <label>Min gap X (px)</label>
                    <input type="number" min="0" value={settings.layout?.minGapX ?? 40} onChange={e => setSettings(s => ({ ...s, layout: { ...DEFAULT_SETTINGS.layout, ...s.layout, minGapX: Number(e.target.value) } }))}/>
                  </div>
                  <div className="field" style={{ flex: 1 }}>
                    <label>Min gap Y (px)</label>
                    <input type="number" min="0" value={settings.layout?.minGapY ?? 40} onChange={e => setSettings(s => ({ ...s, layout: { ...DEFAULT_SETTINGS.layout, ...s.layout, minGapY: Number(e.target.value) } }))}/>
                  </div>
                </div>
                <button className="btn" style={{ width: "100%" }} onClick={autoSort}>⊞ Auto sort</button>

                <div className="section-label">Background</div>
                <div className="field">
                  <label>Type</label>
                  <div className="bg-type-row">
                    {["dots", "grid", "plain"].map(t => (
                      <button key={t} className={`bg-type-btn${background.type === t ? " active" : ""}`} onClick={() => setBackground(b => ({ ...b, type: t }))}>{t}</button>
                    ))}
                  </div>
                </div>
                <div className="field">
                  <label>Background color</label>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <input type="color" value={background.bgColor || "#0e0f11"} onChange={e => setBackground(b => ({ ...b, bgColor: e.target.value }))} style={{ width: 32, height: 28, padding: 2, border: "1px solid var(--border)", borderRadius: 4, background: "var(--surface2)", cursor: "pointer", flexShrink: 0 }}/>
                    <input value={background.bgColor || "#0e0f11"} onChange={e => setBackground(b => ({ ...b, bgColor: e.target.value }))} style={{ flex: 1, background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 4, padding: "5px 8px", fontSize: 12, color: "var(--text)", fontFamily: "var(--mono)", outline: "none" }}/>
                  </div>
                </div>
                {background.type !== "plain" && (
                  <div className="field">
                    <label>{background.type === "dots" ? "Dot color" : "Grid color"}</label>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <input type="color" value={background.dotColor || "#2a2c30"} onChange={e => setBackground(b => ({ ...b, dotColor: e.target.value }))} style={{ width: 32, height: 28, padding: 2, border: "1px solid var(--border)", borderRadius: 4, background: "var(--surface2)", cursor: "pointer", flexShrink: 0 }}/>
                      <input value={background.dotColor || "#2a2c30"} onChange={e => setBackground(b => ({ ...b, dotColor: e.target.value }))} style={{ flex: 1, background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 4, padding: "5px 8px", fontSize: 12, color: "var(--text)", fontFamily: "var(--mono)", outline: "none" }}/>
                    </div>
                  </div>
                )}
                <div className="field">
                  <label>Background image URL</label>
                  <input value={background.imageUrl || ""} placeholder="https://…" onChange={e => setBackground(b => ({ ...b, imageUrl: e.target.value }))}/>
                  {background.imageUrl && (
                    <button className="btn" style={{ fontSize: 10 }} onClick={() => setBackground(b => ({ ...b, imageUrl: "" }))}>✕ Remove image</button>
                  )}
                </div>
              </>
            )}

            {/* ── Help tab ── */}
            {sidebarTab === "help" && (
              <>
                <div className="section-label" style={{ marginTop: 0, borderTop: "none", paddingTop: 0 }}>Quick start</div>
                <div className="help-block">
                  <div className="help-tip"><b>1.</b> Click <b>+ Node</b> in the toolbar (or press <b>N</b> while hovering the canvas) to add nodes.</div>
                  <div className="help-tip"><b>2.</b> Hover a node to reveal its port dots. Click a port to start a connection, then click any other node or port to complete it. Esc cancels.</div>
                  <div className="help-tip"><b>3.</b> Click any node or connection to select it and edit it in this sidebar.</div>
                  <div className="help-tip"><b>4.</b> Export as JSON to back up or hand off to an AI. Import merges into the current map — imported nodes are shifted right if they overlap with existing ones.</div>
                </div>

                <div className="section-label">Keyboard shortcuts</div>
                <div className="help-block">
                  {[
                    ["N", "New node at cursor (hover canvas)"],
                    ["C", "Connect selected node to next clicked node"],
                    ["⌘C / ⌘V", "Copy / paste node at cursor"],
                    ["Shift + drag", "Draw selection box (multi-select)"],
                    ["Shift + click node", "Add / remove node from selection"],
                    ["◎ Multi-select btn", "Tap-to-select mode (sidebar, great for mobile)"],
                    ["Delete / ⌫", "Delete selected node, edge, or group"],
                    ["⌘Z", "Undo"],
                    ["⌘⇧Z / ⌘Y", "Redo"],
                    ["Esc", "Cancel connection / deselect"],
                    ["Scroll", "Zoom in / out"],
                    ["Drag canvas", "Pan"],
                  ].map(([k, d]) => (
                    <div className="shortcut-row" key={k}>
                      <span className="shortcut-key">{k}</span>
                      <span className="shortcut-desc">{d}</span>
                    </div>
                  ))}
                </div>

                <div className="section-label">Notes (.txt) format</div>
                <div className="help-tip" style={{ marginBottom: 6 }}>
                  Each node starts with a <b>`</b> (backtick) line. Body text follows. Connections start with <b>=</b>. Two blank lines between nodes.
                </div>
                <div className="prompt-card">
                  <pre>{"`Node Name\n Next line for body text (optional,\ncan span lines)\n= relation, path label : Other Node\n\n\n`Second Node\nNo body or connections"}</pre>
                </div>
                <div className="help-tip" style={{ marginTop: 6 }}>
                  Connection format: <b>= relation type, path name : Other Node</b><br/>
                  Omit either part if not needed — <b>= rel : Name</b> or <b>= , label : Name</b> or <b>= : Name</b>
                </div>

                <div className="section-label">Use with AI</div>
                <div className="help-tip" style={{ marginBottom: 4 }}>Copy a prompt below, paste it into any AI chat (Claude, ChatGPT, etc.), then import the result.</div>
                {[
                  {
                    label: "Generate a new map",
                    text: `Create a mind map about [YOUR TOPIC HERE]. Return ONLY valid JSON — no markdown fences, no explanation:

{"nodes":[{"id":"n_1","name":"Central Idea","body":""}],"edges":[{"id":"e_1","src":"n_1","tgt":"n_2","label":""}]}

Aim for 8–12 nodes. Keep names short (2–4 words). body is optional notes text.`,
                  },
                  {
                    label: "Expand existing map",
                    text: `Here is my mind map:

[PASTE YOUR EXPORTED JSON HERE]

Add 5–8 new nodes that deepen or broaden the existing ideas. Keep all existing nodes and edges unchanged. Return ONLY the complete updated JSON — no markdown, no explanation.`,
                  },
                  {
                    label: "Suggest new connections",
                    text: `Here is my mind map:

[PASTE YOUR EXPORTED JSON HERE]

Find 4–6 pairs of nodes that aren't connected yet but should be. Return ONLY a JSON object with a single edges array — no markdown, no explanation:

{"edges":[{"id":"e_new1","src":"n_1","tgt":"n_3","label":"why they connect"}]}

Then paste those edges into the existing JSON before importing.`,
                  },
                  {
                    label: "Simplify / summarise",
                    text: `Here is my mind map:

[PASTE YOUR EXPORTED JSON HERE]

Condense it: merge overlapping ideas, remove redundant nodes, and keep only the most important connections. Return ONLY the simplified JSON — no markdown, no explanation.`,
                  },
                ].map((p, i) => (
                  <div className="prompt-card" key={i}>
                    <div style={{ fontSize: 10, color: "var(--accent)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6 }}>{p.label}</div>
                    <pre>{p.text}</pre>
                    <button
                      className={`prompt-copy${copiedPrompt === i ? " copied" : ""}`}
                      onClick={() => {
                        navigator.clipboard.writeText(p.text);
                        setCopiedPrompt(i);
                        setTimeout(() => setCopiedPrompt(c => c === i ? null : c), 1500);
                      }}
                    >{copiedPrompt === i ? "Copied!" : "Copy"}</button>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
