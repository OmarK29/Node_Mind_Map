import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  STORAGE_KEY, STORAGE_KEY_V1, DELETED_IDS_KEY,
  makeNodeId, makeEdgeId, makeMapId,
  bestPorts, cubicPath,
  getDeletedIds, addDeletedId,
  loadStored,
} from "./utils.js";

// ── makeNodeId ───────────────────────────────────────────────────────────────

describe("makeNodeId", () => {
  it("matches the expected format n_YYMMDD_HHMMSS_seq", () => {
    expect(makeNodeId()).toMatch(/^n_\d{6}_\d{6}_\d+$/);
  });

  it("returns unique IDs on rapid calls", () => {
    const ids = Array.from({ length: 20 }, makeNodeId);
    expect(new Set(ids).size).toBe(20);
  });
});

// ── makeEdgeId ───────────────────────────────────────────────────────────────

describe("makeEdgeId", () => {
  it("matches the expected format e_timestamp_seq", () => {
    expect(makeEdgeId()).toMatch(/^e_\d+_\d+$/);
  });

  it("returns unique IDs on rapid calls", () => {
    const ids = Array.from({ length: 20 }, makeEdgeId);
    expect(new Set(ids).size).toBe(20);
  });
});

// ── makeMapId ────────────────────────────────────────────────────────────────

describe("makeMapId", () => {
  it("matches the expected format map_timestamp_seq", () => {
    expect(makeMapId()).toMatch(/^map_\d+_\d+$/);
  });
});

// ── bestPorts ────────────────────────────────────────────────────────────────

describe("bestPorts", () => {
  const node = (x, y, w = 100, h = 50) => ({ x, y, w, h });

  it("tgt to the right → right/left", () => {
    expect(bestPorts(node(0, 0), node(200, 0))).toEqual({ srcPort: "right", tgtPort: "left" });
  });

  it("tgt to the left → left/right", () => {
    expect(bestPorts(node(200, 0), node(0, 0))).toEqual({ srcPort: "left", tgtPort: "right" });
  });

  it("tgt below → bottom/top", () => {
    expect(bestPorts(node(0, 0), node(0, 200))).toEqual({ srcPort: "bottom", tgtPort: "top" });
  });

  it("tgt above → top/bottom", () => {
    expect(bestPorts(node(0, 200), node(0, 0))).toEqual({ srcPort: "top", tgtPort: "bottom" });
  });

  it("equal dx/dy prefers horizontal (right/left)", () => {
    // dx === dy: Math.abs(dx) >= Math.abs(dy) is true, so horizontal wins
    expect(bestPorts(node(0, 0), node(100, 100))).toEqual({ srcPort: "right", tgtPort: "left" });
  });

  it("uses default 180×60 when w/h are missing", () => {
    const src = { x: 0, y: 0 };
    const tgt = { x: 400, y: 0 };
    // dx = 400 + 90 - 90 = 400, dominantly horizontal
    expect(bestPorts(src, tgt)).toEqual({ srcPort: "right", tgtPort: "left" });
  });
});

// ── cubicPath ────────────────────────────────────────────────────────────────

describe("cubicPath", () => {
  it("starts with M and has C command", () => {
    const path = cubicPath(10, 20, 100, 80);
    expect(path).toMatch(/^M 10 20 C/);
    expect(path).toContain("100 80");
  });

  it("uses 50% of horizontal distance for control points", () => {
    const path = cubicPath(0, 0, 100, 50);
    // dx = |100 - 0| * 0.5 = 50
    // C x1+dx y1, x2-dx y2 → C 50 0, 50 50, 100 50
    expect(path).toBe("M 0 0 C 50 0, 50 50, 100 50");
  });

  it("uses absolute dx (works when x2 < x1)", () => {
    const path = cubicPath(100, 0, 0, 0);
    // dx = |0 - 100| * 0.5 = 50
    // C 150 0, -50 0, 0 0
    expect(path).toBe("M 100 0 C 150 0, -50 0, 0 0");
  });
});

// ── getDeletedIds / addDeletedId ──────────────────────────────────────────────

describe("getDeletedIds / addDeletedId", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it("returns empty set when nothing stored", () => {
    expect(getDeletedIds().size).toBe(0);
  });

  it("returns stored IDs", () => {
    localStorage.setItem(DELETED_IDS_KEY, JSON.stringify(["a", "b"]));
    const ids = getDeletedIds();
    expect(ids.has("a")).toBe(true);
    expect(ids.has("b")).toBe(true);
    expect(ids.size).toBe(2);
  });

  it("returns empty set on malformed JSON", () => {
    localStorage.setItem(DELETED_IDS_KEY, "not-json{{{");
    expect(getDeletedIds().size).toBe(0);
  });

  it("addDeletedId persists a single ID", () => {
    addDeletedId("map_1");
    expect(getDeletedIds().has("map_1")).toBe(true);
  });

  it("addDeletedId accumulates multiple IDs", () => {
    addDeletedId("map_1");
    addDeletedId("map_2");
    const ids = getDeletedIds();
    expect(ids.has("map_1")).toBe(true);
    expect(ids.has("map_2")).toBe(true);
  });

  it("addDeletedId deduplicates on re-add", () => {
    addDeletedId("map_1");
    addDeletedId("map_1");
    expect(getDeletedIds().size).toBe(1);
  });
});

// ── loadStored ───────────────────────────────────────────────────────────────

describe("loadStored", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it("returns null when nothing is stored", () => {
    expect(loadStored()).toBeNull();
  });

  it("returns v2 data when present", () => {
    const data = { maps: [{ id: "map_1" }], activeMapId: "map_1" };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    expect(loadStored()).toEqual(data);
  });

  it("falls back to v1 when v2 is absent", () => {
    const data = { nodes: [{ id: "n_1" }], edges: [] };
    localStorage.setItem(STORAGE_KEY_V1, JSON.stringify(data));
    expect(loadStored()).toEqual(data);
  });

  it("prefers v2 over v1 when both are present", () => {
    const v2 = { maps: [{ id: "map_1" }] };
    const v1 = { nodes: [] };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(v2));
    localStorage.setItem(STORAGE_KEY_V1, JSON.stringify(v1));
    expect(loadStored()).toEqual(v2);
  });

  it("returns null on malformed JSON", () => {
    localStorage.setItem(STORAGE_KEY, "bad{json");
    expect(loadStored()).toBeNull();
  });
});
