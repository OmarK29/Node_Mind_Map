export const STORAGE_KEY = "mindmap_v2";
export const STORAGE_KEY_V1 = "mindmap_v1";
export const DELETED_IDS_KEY = "mindmap_deleted_v2";

export const DEFAULT_BG = { type: "dots", bgColor: "#0e0f11", dotColor: "#2a2c30", imageUrl: "" };
export const DEFAULT_SETTINGS = {
  header: { nameSize: 12, nameColor: "" },
  node: { nameSize: 12, nameColor: "", bodySize: 11, bodyColor: "", maxWidth: 280 },
  edge: { color: "", width: 1.5, style: "solid", labelSize: 10, labelWidth: 72 },
  layout: { minGapX: 40, minGapY: 40 },
};
export const DEFAULT_NODE = { id: "n_default", name: "Central Idea", body: "", x: 300, y: 220, w: 180, h: 44, showBody: true, showNeighbors: true };

let _seq = 0;

// Human-readable IDs with a timestamp + per-session sequence counter.
// This prevents collisions across concurrent tabs or rapid creation bursts
// (e.g. import) without requiring UUIDs, while keeping IDs debuggable.
export function makeNodeId() {
  const d = new Date();
  const p = n => String(n).padStart(2, "0");
  return `n_${d.getFullYear().toString().slice(2)}${p(d.getMonth()+1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}_${++_seq}`;
}
export function makeEdgeId() { return `e_${Date.now()}_${++_seq}`; }
export function makeMapId() { return `map_${Date.now()}_${++_seq}`; }

// Tracks map IDs that were deleted on this device so syncDown can evict
// any "zombie" copies that re-appear from another device's earlier syncUp.
// Persisted in localStorage so the tombstone survives page reloads.
export function getDeletedIds() {
  try { return new Set(JSON.parse(localStorage.getItem(DELETED_IDS_KEY)) || []); } catch { return new Set(); }
}
export function addDeletedId(id) {
  const ids = getDeletedIds();
  ids.add(id);
  localStorage.setItem(DELETED_IDS_KEY, JSON.stringify([...ids]));
}

// Picks the pair of ports that minimises edge crossings by choosing the
// dominant axis (horizontal vs vertical) based on the centre-to-centre
// vector. Default dimensions (180×60) are used when the DOM hasn't
// measured the node yet (first render before ResizeObserver fires).
export function bestPorts(src, tgt) {
  const dx = (tgt.x + (tgt.w||180)/2) - (src.x + (src.w||180)/2);
  const dy = (tgt.y + (tgt.h||60)/2) - (src.y + (src.h||60)/2);
  if (Math.abs(dx) >= Math.abs(dy)) return dx >= 0 ? { srcPort:"right", tgtPort:"left" } : { srcPort:"left", tgtPort:"right" };
  return dy >= 0 ? { srcPort:"bottom", tgtPort:"top" } : { srcPort:"top", tgtPort:"bottom" };
}

// SVG cubic Bézier for edges. Control points are offset by half the
// horizontal distance, producing smooth S-curves that visually separate
// overlapping edges without requiring layout-phase geometry.
export function cubicPath(x1, y1, x2, y2) {
  const dx = Math.abs(x2-x1)*0.5;
  return `M ${x1} ${y1} C ${x1+dx} ${y1}, ${x2-dx} ${y2}, ${x2} ${y2}`;
}

// Two-key fallback supports in-place schema migration: existing users on
// v1 (single {nodes,edges} blob) are silently promoted to v2 the first
// time the app loads, without a separate migration script.
export function loadStored() {
  try {
    const v2 = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (v2) return v2;
    return JSON.parse(localStorage.getItem(STORAGE_KEY_V1));
  } catch { return null; }
}

// Triggers a file download via a temporary anchor element rather than
// window.open(), which is blocked as a popup in most browsers unless
// called from a direct user gesture on the same frame.
export function dlBlob(content, filename, type) {
  const a = Object.assign(document.createElement("a"), {
    href: URL.createObjectURL(new Blob([content], { type })),
    download: filename,
  });
  a.click();
  URL.revokeObjectURL(a.href);
}
