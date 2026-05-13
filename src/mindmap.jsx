import { useState, useRef, useEffect, useCallback } from "react";

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,300;0,400;0,500;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');`;

const STYLES = `
* { box-sizing: border-box; margin: 0; padding: 0; }
body { background: #0e0f11; font-family: 'DM Sans', sans-serif; color: #e2e0da; overflow: hidden; height: 100vh; }

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

.app { display: flex; height: 100vh; width: 100vw; position: relative; }

.canvas-wrap { flex: 1; position: relative; overflow: hidden; cursor: default; background: var(--bg); touch-action: none; -webkit-tap-highlight-color: transparent; }
.canvas-wrap.panning { cursor: grabbing; }
.canvas-wrap.connect-mode { cursor: crosshair; }
.canvas-wrap.connect-mode .node { cursor: pointer; }
.canvas-wrap.connect-mode .node.conn-source { cursor: not-allowed; }
.canvas-inner { position: absolute; transform-origin: 0 0; }

.grid-bg { position: absolute; inset: 0; pointer-events: none; }

.node {
  position: absolute;
  min-width: 160px;
  max-width: 280px;
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

.node-name {
  padding: 8px 12px 7px;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.04em;
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  gap: 6px;
}
.node.header-node .node-name { color: var(--accent2); }
.node-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--accent); flex-shrink: 0; }
.node.header-node .node-dot { background: var(--accent2); }
.node-id-badge { font-size: 9px; color: var(--border2); font-family: var(--mono); padding: 2px 12px 1px; border-bottom: 1px solid var(--border); letter-spacing: 0.03em; }

.node-body {
  padding: 7px 12px 8px;
  font-size: 11px;
  color: var(--muted);
  line-height: 1.5;
  font-family: var(--mono);
  white-space: pre-wrap;
  word-break: break-word;
}

.node-neighbors { padding: 4px 12px 8px; border-top: 1px solid var(--border); }
.node-neighbors-label { font-size: 9px; color: var(--muted); letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 4px; margin-top: 4px; }
.node-neighbor-item { font-size: 10px; color: #5a6875; font-family: var(--mono); padding: 1px 0; display: flex; gap: 4px; }
.node-neighbor-item .rel { color: var(--accent); opacity: 0.7; }

.port {
  position: absolute;
  width: 10px; height: 10px;
  border-radius: 50%;
  background: var(--surface2);
  border: 1.5px solid var(--border2);
  cursor: crosshair;
  transition: background 0.1s, border-color 0.1s, transform 0.1s;
  z-index: 10;
}
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

.sidebar {
  position: relative;
  background: var(--surface);
  border-left: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  flex-shrink: 0;
  min-width: 180px;
  max-width: 500px;
}
.sidebar-resize {
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 5px;
  cursor: col-resize;
  z-index: 20;
  transition: background 0.15s;
}
.sidebar-resize:hover { background: rgba(122,184,200,0.3); }
.sidebar-header {
  padding: 16px;
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.sidebar-title { font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted); font-weight: 500; }
.sidebar-body { flex: 1; overflow-y: auto; padding: 12px; display: flex; flex-direction: column; gap: 10px; }
.sidebar-body::-webkit-scrollbar { width: 3px; }
.sidebar-body::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 2px; }

.field { display: flex; flex-direction: column; gap: 4px; position: relative; }
.field label { font-size: 10px; color: var(--muted); letter-spacing: 0.06em; text-transform: uppercase; }
.field input, .field textarea, .field select {
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 6px 8px;
  font-size: 12px;
  color: var(--text);
  font-family: 'DM Sans', sans-serif;
  outline: none;
  transition: border-color 0.15s;
  resize: none;
}
.field input:focus, .field textarea:focus, .field select:focus { border-color: var(--accent2); }
.field select option { background: var(--surface2); }
.field textarea { min-height: 70px; font-family: var(--mono); font-size: 11px; }

.conn-dropdown {
  position: absolute;
  top: calc(100% + 2px);
  left: 0; right: 0;
  background: var(--surface2);
  border: 1px solid var(--border2);
  border-radius: 4px;
  z-index: 200;
  max-height: 160px;
  overflow-y: auto;
  box-shadow: 0 4px 16px rgba(0,0,0,0.5);
}
.conn-dropdown-item {
  padding: 6px 10px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  gap: 8px;
}
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
.btn-row { display: flex; gap: 6px; }

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

.toolbar {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 2px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 5px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.5);
  z-index: 50;
  white-space: nowrap;
}
.tool-btn { padding: 6px 12px; border-radius: 5px; border: none; background: transparent; color: var(--muted); font-size: 11px; cursor: pointer; font-family: 'DM Sans', sans-serif; letter-spacing: 0.04em; transition: background 0.15s, color 0.15s; }
.tool-btn:hover { background: var(--surface2); color: var(--text); }
.tool-btn.active { background: var(--surface2); color: var(--accent); }
.tool-sep { width: 1px; background: var(--border); margin: 4px 2px; align-self: stretch; }

.infobar {
  position: absolute;
  top: 12px; left: 12px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 5px;
  padding: 6px 12px;
  font-size: 10px;
  color: var(--muted);
  font-family: var(--mono);
  letter-spacing: 0.04em;
  z-index: 50;
  display: flex;
  gap: 12px;
  align-items: center;
}
.infobar span { color: var(--text); }
.infobar-hint { color: var(--accent2) !important; font-size: 9px; }

.empty-hint { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); text-align: center; pointer-events: none; opacity: 0.3; }
.empty-hint .big { font-size: 48px; margin-bottom: 12px; }
.empty-hint p { font-size: 13px; color: var(--muted); }

.connecting-preview { stroke: var(--accent2); stroke-dasharray: 6 4; stroke-width: 1.5; fill: none; pointer-events: none; }

/* Mobile sidebar toggle */
.sidebar-toggle {
  display: none;
  position: absolute; top: 12px; right: 12px; z-index: 50;
  background: var(--surface); border: 1px solid var(--border);
  border-radius: 5px; width: 38px; height: 38px;
  color: var(--muted); font-size: 18px; cursor: pointer;
  align-items: center; justify-content: center;
}

/* Mobile */
@media (max-width: 767px) {
  .sidebar-toggle { display: flex; }
  .sidebar {
    position: absolute; right: 0; top: 0; height: 100%; z-index: 100;
    width: min(300px, 88vw) !important;
    transform: translateX(101%);
    transition: transform 0.25s ease;
    box-shadow: -4px 0 24px rgba(0,0,0,0.7);
  }
  .sidebar.open { transform: translateX(0); }
  .sidebar-resize { display: none; }
  .port { width: 20px; height: 20px; }
  .port.top    { top: -10px; }
  .port.bottom { bottom: -10px; }
  .port.left   { left: -10px; }
  .port.right  { right: -10px; }
  .port.top:hover    { transform: translateX(-50%) scale(1.2); }
  .port.bottom:hover { transform: translateX(-50%) scale(1.2); }
  .port.left:hover   { transform: translateY(-50%) scale(1.2); }
  .port.right:hover  { transform: translateY(-50%) scale(1.2); }
  .toolbar {
    left: 8px; right: 8px; transform: none;
    overflow-x: auto; justify-content: flex-start;
    bottom: calc(16px + env(safe-area-inset-bottom, 0px));
    scrollbar-width: none;
  }
  .toolbar::-webkit-scrollbar { display: none; }
  .tool-btn { padding: 10px 14px; font-size: 12px; white-space: nowrap; }
  .infobar {
    top: calc(8px + env(safe-area-inset-top, 0px));
    font-size: 9px; padding: 4px 8px; gap: 8px;
  }
}
`;

const STORAGE_KEY = "mindmap_v1";

let _seq = 0;
function makeNodeId() {
  const d = new Date();
  const p = n => String(n).padStart(2, "0");
  return `n_${d.getFullYear().toString().slice(2)}${p(d.getMonth()+1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}_${++_seq}`;
}
function makeEdgeId() {
  return `e_${Date.now()}_${++_seq}`;
}

const RELATION_PRESETS = [
  { src: "parent", tgt: "child" },
  { src: "higher", tgt: "lower" },
  { src: "left", tgt: "right" },
  { src: "cause", tgt: "effect" },
  { src: "before", tgt: "after" },
];

function bestPorts(src, tgt) {
  const sx = src.x + (src.w || 180) / 2;
  const sy = src.y + (src.h || 60) / 2;
  const tx = tgt.x + (tgt.w || 180) / 2;
  const ty = tgt.y + (tgt.h || 60) / 2;
  const dx = tx - sx, dy = ty - sy;
  if (Math.abs(dx) >= Math.abs(dy)) {
    return dx >= 0 ? { srcPort: "right", tgtPort: "left" } : { srcPort: "left", tgtPort: "right" };
  }
  return dy >= 0 ? { srcPort: "bottom", tgtPort: "top" } : { srcPort: "top", tgtPort: "bottom" };
}

function cubicPath(x1, y1, x2, y2) {
  const dx = Math.abs(x2 - x1) * 0.5;
  return `M ${x1} ${y1} C ${x1+dx} ${y1}, ${x2-dx} ${y2}, ${x2} ${y2}`;
}

function loadStored() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch { return null; }
}

const DEFAULT_NODE = { id: "n_default", name: "Central Idea", body: "", x: 300, y: 220, w: 180, h: 44, showBody: true, showNeighbors: true };

export default function MindMap() {
  const stored = useRef(loadStored());

  const [nodes, setNodes] = useState(() => stored.current?.nodes || [DEFAULT_NODE]);
  const [edges, setEdges] = useState(() => stored.current?.edges || []);
  const [selected, setSelected] = useState(null);
  const [pan, setPan] = useState({ x: 80, y: 60 });
  const [zoom, setZoom] = useState(1);
  const [tool, setTool] = useState("select");
  const [connFrom, setConnFrom] = useState(null); // { nodeId, port: string|null }
  const [mouseCanvas, setMouseCanvas] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState(null);
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [addConnInput, setAddConnInput] = useState("");
  const [showDrop, setShowDrop] = useState(false);
  const [globalShow, setGlobalShow] = useState({ body: true, neighbors: true, neighborPath: false, neighborRel: false, nodeIds: false });
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const canvasRef = useRef(null);
  const nodeRefs = useRef({});
  const resizing = useRef(null); // { startX, startWidth }

  // Refs for touch handlers (avoids stale closures in non-React event listeners)
  const toolRef = useRef(tool);
  const nodesRef = useRef(nodes);
  const panRef = useRef(pan);
  const zoomRef = useRef(zoom);

  const selectedEdge = selected?.type === "edge" ? edges.find(e => e.id === selected.id) : null;
  const selectedNode = selected?.type === "node" ? nodes.find(n => n.id === selected.id) : null;

  // Persist
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ nodes, edges }));
  }, [nodes, edges]);

  // Reset add-conn input when selection changes
  useEffect(() => {
    setAddConnInput("");
    setShowDrop(false);
  }, [selected?.id]);

  // Sync node dimensions after render
  useEffect(() => {
    let changed = false;
    const next = nodes.map(n => {
      const el = nodeRefs.current[n.id];
      if (!el) return n;
      const h = el.offsetHeight, w = el.offsetWidth;
      if (h !== n.h || w !== n.w) { changed = true; return { ...n, h, w }; }
      return n;
    });
    if (changed) setNodes(next);
  });

  // Sidebar resize - global mouse handlers
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

  // Keep refs in sync for touch handlers
  useEffect(() => { toolRef.current = tool; }, [tool]);
  useEffect(() => { nodesRef.current = nodes; }, [nodes]);
  useEffect(() => { panRef.current = pan; }, [pan]);
  useEffect(() => { zoomRef.current = zoom; }, [zoom]);

  // Mobile detection
  useEffect(() => {
    const handle = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handle);
    return () => window.removeEventListener("resize", handle);
  }, []);

  // Touch: pan, pinch-zoom, node drag
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let drag = null;       // { nodeId, startX, startY, origX, origY }
    let canPan = null;     // { startX, startY, startPanX, startPanY }
    let pinch = null;      // { d0, z0, p0:{x,y}, mx, my }

    function nodeIdFromEl(el) {
      while (el && el !== canvas) {
        if (el.dataset && el.dataset.nodeId) return el.dataset.nodeId;
        el = el.parentElement;
      }
      return null;
    }

    function onStart(e) {
      if (e.touches.length === 1) {
        const t = e.touches[0];
        const nid = nodeIdFromEl(e.target);
        if (nid && toolRef.current === "select") {
          const node = nodesRef.current.find(n => n.id === nid);
          if (node) drag = { nodeId: nid, startX: t.clientX, startY: t.clientY, origX: node.x, origY: node.y };
        } else if (!nid && toolRef.current === "select") {
          canPan = { startX: t.clientX, startY: t.clientY, startPanX: panRef.current.x, startPanY: panRef.current.y };
        }
      } else if (e.touches.length === 2) {
        drag = null; canPan = null;
        const t0 = e.touches[0], t1 = e.touches[1];
        const rect = canvas.getBoundingClientRect();
        pinch = {
          d0: Math.hypot(t0.clientX - t1.clientX, t0.clientY - t1.clientY),
          z0: zoomRef.current,
          p0: { ...panRef.current },
          mx: (t0.clientX + t1.clientX) / 2 - rect.left,
          my: (t0.clientY + t1.clientY) / 2 - rect.top,
        };
      }
    }

    function onMove(e) {
      if (e.touches.length === 1) {
        const t = e.touches[0];
        if (drag) {
          const dx = (t.clientX - drag.startX) / zoomRef.current;
          const dy = (t.clientY - drag.startY) / zoomRef.current;
          setNodes(prev => prev.map(n => n.id === drag.nodeId ? { ...n, x: drag.origX + dx, y: drag.origY + dy } : n));
        } else if (canPan) {
          setPan({ x: canPan.startPanX + (t.clientX - canPan.startX), y: canPan.startPanY + (t.clientY - canPan.startY) });
        }
      } else if (e.touches.length === 2 && pinch) {
        const t0 = e.touches[0], t1 = e.touches[1];
        const d = Math.hypot(t0.clientX - t1.clientX, t0.clientY - t1.clientY);
        const nz = Math.min(3, Math.max(0.2, pinch.z0 * (d / pinch.d0)));
        setZoom(nz);
        setPan({ x: pinch.mx - (pinch.mx - pinch.p0.x) * (nz / pinch.z0), y: pinch.my - (pinch.my - pinch.p0.y) * (nz / pinch.z0) });
      }
    }

    function onEnd() { drag = null; canPan = null; pinch = null; }

    canvas.addEventListener("touchstart", onStart);
    canvas.addEventListener("touchmove", onMove);
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
      if (e.key === "Escape") { setConnFrom(null); setSelected(null); }
      if ((e.key === "Delete" || e.key === "Backspace") && selected && !e.target.matches("input,textarea")) {
        if (selected.type === "node") {
          setNodes(p => p.filter(n => n.id !== selected.id));
          setEdges(p => p.filter(e => e.src !== selected.id && e.tgt !== selected.id));
        } else {
          setEdges(p => p.filter(e => e.id !== selected.id));
        }
        setSelected(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected]);

  function getAbsPortPos(node, port) {
    const el = nodeRefs.current[node.id];
    const h = el ? el.offsetHeight : (node.h || 60);
    const w = el ? el.offsetWidth : (node.w || 200);
    if (port === "top")    return { x: node.x + w/2, y: node.y };
    if (port === "bottom") return { x: node.x + w/2, y: node.y + h };
    if (port === "left")   return { x: node.x,       y: node.y + h/2 };
    if (port === "right")  return { x: node.x + w,   y: node.y + h/2 };
    return { x: node.x + w/2, y: node.y + h/2 };
  }

  // Canvas mouse
  const onCanvasMouseDown = useCallback((e) => {
    const onCanvas = e.target === canvasRef.current ||
      e.target.classList.contains("canvas-inner") ||
      e.target.classList.contains("grid-bg");
    if (!onCanvas) return;
    if (tool === "select") {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      setSelected(null);
    } else if (tool === "connect") {
      setConnFrom(null);
    }
  }, [tool, pan]);

  const onCanvasMouseMove = useCallback((e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    setMouseCanvas({ x: (e.clientX - rect.left - pan.x) / zoom, y: (e.clientY - rect.top - pan.y) / zoom });
    if (isPanning && panStart) setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
    if (dragging) {
      const dx = (e.clientX - dragging.startX) / zoom;
      const dy = (e.clientY - dragging.startY) / zoom;
      setNodes(p => p.map(n => n.id === dragging.nodeId ? { ...n, x: dragging.origX + dx, y: dragging.origY + dy } : n));
    }
  }, [isPanning, panStart, dragging, pan, zoom]);

  const onCanvasMouseUp = useCallback(() => {
    setIsPanning(false); setPanStart(null); setDragging(null);
  }, []);

  const onWheel = useCallback((e) => {
    e.preventDefault();
    const rect = canvasRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    const factor = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prev => {
      const nz = Math.min(3, Math.max(0.2, prev * factor));
      setPan(p => ({ x: mx - (mx - p.x) * (nz / prev), y: my - (my - p.y) * (nz / prev) }));
      return nz;
    });
  }, []);

  // Node drag (select mode)
  const onNodeMouseDown = useCallback((e, nodeId) => {
    if (tool !== "select") return;
    e.stopPropagation();
    const node = nodes.find(n => n.id === nodeId);
    setDragging({ nodeId, startX: e.clientX, startY: e.clientY, origX: node.x, origY: node.y });
    setSelected({ type: "node", id: nodeId });
  }, [tool, nodes]);

  // Node click (connect mode)
  const onNodeClick = useCallback((e, nodeId) => {
    if (tool !== "connect") return;
    e.stopPropagation();
    if (!connFrom) {
      setConnFrom({ nodeId, port: null });
    } else if (connFrom.nodeId !== nodeId) {
      const src = nodes.find(n => n.id === connFrom.nodeId);
      const tgt = nodes.find(n => n.id === nodeId);
      const auto = bestPorts(src, tgt);
      const eid = makeEdgeId();
      setEdges(p => [...p, { id: eid, src: connFrom.nodeId, srcPort: connFrom.port || auto.srcPort, tgt: nodeId, tgtPort: auto.tgtPort, label: "", relSrc: "", relTgt: "" }]);
      setConnFrom(null);
      setSelected({ type: "edge", id: eid });
    }
  }, [tool, connFrom, nodes]);

  // Port click (connect mode - specific port)
  const onPortClick = useCallback((e, nodeId, port) => {
    e.stopPropagation();
    if (tool !== "connect") return;
    if (!connFrom) {
      setConnFrom({ nodeId, port });
    } else if (connFrom.nodeId !== nodeId) {
      const eid = makeEdgeId();
      setEdges(p => [...p, { id: eid, src: connFrom.nodeId, srcPort: connFrom.port || "right", tgt: nodeId, tgtPort: port, label: "", relSrc: "", relTgt: "" }]);
      setConnFrom(null);
      setSelected({ type: "edge", id: eid });
    }
  }, [tool, connFrom]);

  const addNode = () => {
    const id = makeNodeId();
    setNodes(p => [...p, { id, name: "New Node", body: "", x: (-pan.x / zoom) + 200 + Math.random() * 100, y: (-pan.y / zoom) + 200 + Math.random() * 80, w: 180, h: 44, showBody: true, showNeighbors: true }]);
    setSelected({ type: "node", id });
  };

  const deleteSelected = useCallback(() => {
    if (!selected) return;
    if (selected.type === "node") {
      setNodes(p => p.filter(n => n.id !== selected.id));
      setEdges(p => p.filter(e => e.src !== selected.id && e.tgt !== selected.id));
    } else {
      setEdges(p => p.filter(e => e.id !== selected.id));
    }
    setSelected(null);
  }, [selected]);

  const deleteEdge = (eid) => {
    setEdges(p => p.filter(e => e.id !== eid));
    if (selected?.id === eid) setSelected(null);
  };

  const updateNode = (id, field, val) => setNodes(p => p.map(n => n.id === id ? { ...n, [field]: val } : n));
  const updateEdge = (id, field, val) => setEdges(p => p.map(e => e.id === id ? { ...e, [field]: val } : e));

  const zoomBy = useCallback((factor) => {
    if (!canvasRef.current) return;
    const w = canvasRef.current.clientWidth, h = canvasRef.current.clientHeight;
    setZoom(prev => {
      const nz = Math.min(3, Math.max(0.2, prev * factor));
      setPan(p => ({ x: w/2 - (w/2 - p.x) * (nz / prev), y: h/2 - (h/2 - p.y) * (nz / prev) }));
      return nz;
    });
  }, []);

  const centerView = useCallback(() => {
    if (!nodes.length || !canvasRef.current) return;
    const minX = Math.min(...nodes.map(n => n.x));
    const maxX = Math.max(...nodes.map(n => n.x + (n.w || 180)));
    const minY = Math.min(...nodes.map(n => n.y));
    const maxY = Math.max(...nodes.map(n => n.y + (n.h || 60)));
    const ww = canvasRef.current.clientWidth, wh = canvasRef.current.clientHeight;
    const pad = 80;
    const nz = Math.min((ww - pad*2) / Math.max(maxX - minX, 1), (wh - pad*2) / Math.max(maxY - minY, 1), 1.5);
    setZoom(nz);
    setPan({ x: (ww - (maxX - minX) * nz) / 2 - minX * nz, y: (wh - (maxY - minY) * nz) / 2 - minY * nz });
  }, [nodes]);

  const addConnFromInput = (targetNode) => {
    if (!selectedNode || !targetNode || targetNode.id === selectedNode.id) return;
    const { srcPort, tgtPort } = bestPorts(selectedNode, targetNode);
    const eid = makeEdgeId();
    setEdges(p => [...p, { id: eid, src: selectedNode.id, srcPort, tgt: targetNode.id, tgtPort, label: "", relSrc: "", relTgt: "" }]);
    setAddConnInput(""); setShowDrop(false);
  };

  function getNeighbors(nodeId) {
    const out = [];
    for (const e of edges) {
      if (e.src === nodeId) { const t = nodes.find(n => n.id === e.tgt); if (t) out.push({ name: t.name, rel: e.relTgt || "", pathName: e.label || "" }); }
      if (e.tgt === nodeId) { const s = nodes.find(n => n.id === e.src); if (s) out.push({ name: s.name, rel: e.relSrc || "", pathName: e.label || "" }); }
    }
    return out;
  }

  function edgeMid(e) {
    const sn = nodes.find(n => n.id === e.src), tn = nodes.find(n => n.id === e.tgt);
    if (!sn || !tn) return null;
    const sp = getAbsPortPos(sn, e.srcPort || "right"), tp = getAbsPortPos(tn, e.tgtPort || "left");
    return { x: (sp.x + tp.x) / 2, y: (sp.y + tp.y) / 2, sp, tp };
  }

  const isHeader = n => !n.body || n.body.trim() === "";

  const connPreview = connFrom ? (() => {
    const src = nodes.find(n => n.id === connFrom.nodeId);
    if (!src) return null;
    return connFrom.port ? getAbsPortPos(src, connFrom.port) : { x: src.x + (src.w || 180) / 2, y: src.y + (src.h || 60) / 2 };
  })() : null;

  const dropItems = selectedNode && addConnInput
    ? nodes.filter(n => n.id !== selectedNode.id && (n.name.toLowerCase().includes(addConnInput.toLowerCase()) || n.id.includes(addConnInput)))
    : [];

  const nodeEdges = selectedNode ? edges.filter(e => e.src === selectedNode.id || e.tgt === selectedNode.id) : [];

  return (
    <>
      <style>{FONTS}{STYLES}</style>
      <div className="app">
        <div
          className={`canvas-wrap${isPanning ? " panning" : ""}${tool === "connect" ? " connect-mode" : ""}`}
          ref={canvasRef}
          onMouseDown={onCanvasMouseDown}
          onMouseMove={onCanvasMouseMove}
          onMouseUp={onCanvasMouseUp}
          onMouseLeave={onCanvasMouseUp}
          onWheel={onWheel}
        >
          <svg className="grid-bg" width="100%" height="100%">
            <defs>
              <pattern id="grid" width={20*zoom} height={20*zoom} patternUnits="userSpaceOnUse" x={pan.x%(20*zoom)} y={pan.y%(20*zoom)}>
                <circle cx={20*zoom} cy={20*zoom} r="0.8" fill="#1e2023"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)"/>
          </svg>

          <div className="canvas-inner" style={{ transform: `translate(${pan.x}px,${pan.y}px) scale(${zoom})` }}>
            <svg className="edges-svg">
              <defs>
                <marker id="arr" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                  <path d="M0 0 L6 3 L0 6 Z" fill="var(--border2)"/>
                </marker>
                <marker id="arr-sel" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                  <path d="M0 0 L6 3 L0 6 Z" fill="var(--accent)"/>
                </marker>
              </defs>
              {edges.map(e => {
                const mid = edgeMid(e);
                if (!mid) return null;
                const { sp, tp } = mid;
                const d = cubicPath(sp.x, sp.y, tp.x, tp.y);
                const isSel = selected?.id === e.id;
                const hasLabel = e.label || e.relSrc || e.relTgt;
                return (
                  <g key={e.id}>
                    <path d={d} className={`edge-path${isSel ? " selected" : ""}`} markerEnd={isSel ? "url(#arr-sel)" : "url(#arr)"}/>
                    <path d={d} className="edge-hit" onClick={() => setSelected({ type: "edge", id: e.id })}/>
                    {hasLabel && (
                      <g>
                        <rect x={mid.x-36} y={mid.y-10} width="72" height="20" rx="3" className="edge-label-bg" opacity="0.9"/>
                        {e.label
                          ? <text x={mid.x} y={mid.y+1} textAnchor="middle" dominantBaseline="middle" className="edge-label-text">{e.label}</text>
                          : <text x={mid.x} y={mid.y+1} textAnchor="middle" dominantBaseline="middle" className="edge-rel-text">{e.relSrc}→{e.relTgt}</text>
                        }
                      </g>
                    )}
                  </g>
                );
              })}
              {connPreview && (
                <line className="connecting-preview" x1={connPreview.x} y1={connPreview.y} x2={mouseCanvas.x} y2={mouseCanvas.y}/>
              )}
            </svg>

            {nodes.map(n => {
              const nbrs = getNeighbors(n.id);
              const showBody = n.showBody && globalShow.body && n.body;
              const showNbr = n.showNeighbors && globalShow.neighbors && nbrs.length > 0;
              return (
                <div
                  key={n.id}
                  data-node-id={n.id}
                  className={`node${selected?.id === n.id ? " selected" : ""}${dragging?.nodeId === n.id ? " dragging" : ""}${isHeader(n) ? " header-node" : ""}${connFrom?.nodeId === n.id ? " conn-source" : ""}`}
                  style={{ left: n.x, top: n.y }}
                  ref={el => { if (el) nodeRefs.current[n.id] = el; }}
                  onMouseDown={e => onNodeMouseDown(e, n.id)}
                  onClick={e => onNodeClick(e, n.id)}
                >
                  <div className="node-name"><div className="node-dot"/>{n.name}</div>
                  {globalShow.nodeIds && <div className="node-id-badge">{n.id}</div>}
                  {showBody && <div className="node-body">{n.body}</div>}
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
                  {["top","bottom","left","right"].map(p => (
                    <div key={p} className={`port ${p}`} onClick={e => onPortClick(e, n.id, p)}/>
                  ))}
                </div>
              );
            })}
          </div>

          {/* Mobile: backdrop + sidebar toggle */}
          {isMobile && sidebarOpen && (
            <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 99, cursor: "pointer" }}
              onClick={() => setSidebarOpen(false)}/>
          )}
          {isMobile && (
            <button className="sidebar-toggle" onClick={() => setSidebarOpen(o => !o)}>☰</button>
          )}

          {nodes.length === 0 && (
            <div className="empty-hint">
              <div className="big">◈</div>
              <p>Click "+ Node" to get started</p>
            </div>
          )}

          <div className="toolbar">
            <button className={`tool-btn${tool === "select" ? " active" : ""}`} onClick={() => setTool("select")}>↖ Select</button>
            <button className={`tool-btn${tool === "connect" ? " active" : ""}`} onClick={() => { setTool("connect"); setConnFrom(null); }}>⌁ Connect</button>
            <button className="tool-btn" onClick={addNode}>+ Node</button>
            <div className="tool-sep"/>
            <button className="tool-btn" onClick={() => zoomBy(1.25)} title="Zoom in">＋</button>
            <button className="tool-btn" onClick={() => zoomBy(1/1.25)} title="Zoom out">－</button>
            <button className="tool-btn" onClick={centerView} title="Fit to view">⊙</button>
            {selected && (
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
            {connFrom && <span className="infobar-hint">click target node — esc to cancel</span>}
          </div>
        </div>

        <div className={`sidebar${isMobile && sidebarOpen ? " open" : ""}`} style={{ width: sidebarWidth }} onWheel={e => e.stopPropagation()}>
          <div className="sidebar-resize" onMouseDown={e => { resizing.current = { startX: e.clientX, startWidth: sidebarWidth }; e.preventDefault(); }}/>

          <div className="sidebar-header">
            <span className="sidebar-title">{selectedNode ? "Node" : selectedEdge ? "Edge" : "Mind Map"}</span>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              {selected && <button className="btn danger" style={{ padding: "3px 8px", fontSize: "10px" }} onClick={deleteSelected}>delete</button>}
              {isMobile && <button style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: 18, padding: "0 2px", lineHeight: 1 }} onClick={() => setSidebarOpen(false)}>×</button>}
            </div>
          </div>

          <div className="sidebar-body">
            {selectedNode && (
              <>
                <div className="field">
                  <label>Name</label>
                  <input value={selectedNode.name} onChange={e => updateNode(selectedNode.id, "name", e.target.value)}/>
                </div>
                <div style={{ fontSize: 10, color: "var(--muted)", fontFamily: "var(--mono)", marginTop: -6 }}>{selectedNode.id}</div>
                <div className="field">
                  <label>Body / Notes</label>
                  <textarea placeholder="Leave empty to make this a header node…" value={selectedNode.body} onChange={e => updateNode(selectedNode.id, "body", e.target.value)}/>
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

                <div className="section-label">Connections</div>
                {nodeEdges.length === 0
                  ? <span style={{ fontSize: 11, color: "var(--muted)" }}>No connections yet.</span>
                  : nodeEdges.map(e => {
                    const otherId = e.src === selectedNode.id ? e.tgt : e.src;
                    const other = nodes.find(n => n.id === otherId);
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
              </>
            )}

            {selectedEdge && (
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
              </>
            )}

            {!selected && (
              <>
                <div className="section-label" style={{ marginTop: 0, borderTop: "none", paddingTop: 0 }}>Global display</div>
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
                <div className="section-label">Instructions</div>
                <div style={{ fontSize: 11, color: "var(--muted)", lineHeight: 1.7 }}>
                  <p><b style={{ color: "var(--text)" }}>Select</b> — click nodes to select, drag to move, scroll to zoom, drag canvas to pan</p>
                  <br/>
                  <p><b style={{ color: "var(--text)" }}>Connect</b> — click source node, then click target node. Click a port dot for a specific side. Click canvas or press Esc to cancel.</p>
                  <br/>
                  <p>Nodes without body text are styled as <b style={{ color: "var(--accent2)" }}>header nodes</b></p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
