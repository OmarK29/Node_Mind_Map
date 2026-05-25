import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// ── Supabase mock ─────────────────────────────────────────────────────────────
// vi.hoisted creates objects before vi.mock hoists the factory to the top of
// the file. Without hoisting, the factory closes over uninitialised variables
// and the mock chain is undefined at mock-evaluation time.
const { mockChain, mockAuth } = vi.hoisted(() => {
  const mockChain = {
    select: vi.fn(),
    eq: vi.fn(),
    order: vi.fn().mockResolvedValue({ data: [], error: null }),
    upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
    delete: vi.fn(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
  };
  // All chainable methods return the chain itself so calls can be chained
  // arbitrarily without the test specifying the exact call order.
  mockChain.select.mockReturnValue(mockChain);
  mockChain.eq.mockReturnValue(mockChain);
  mockChain.delete.mockReturnValue(mockChain);

  const mockAuth = {
    getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
    onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    signInWithOtp: vi.fn().mockResolvedValue({ error: null }),
    signOut: vi.fn().mockResolvedValue({}),
  };

  return { mockChain, mockAuth };
});

vi.mock("./supabase.js", () => ({
  supabase: {
    from: vi.fn(() => mockChain),
    auth: mockAuth,
  },
}));

// ── Component import ──────────────────────────────────────────────────────────
import MindMap from "./mindmap.jsx";

// ── Helpers ───────────────────────────────────────────────────────────────────
function renderApp() {
  return render(<MindMap />);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("MindMap — initial render", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it("renders the Central Idea node", () => {
    renderApp();
    expect(screen.getByText("Central Idea")).toBeInTheDocument();
  });

  it("shows the toolbar", () => {
    renderApp();
    expect(screen.getByText("+Node")).toBeInTheDocument();
  });

  it("undo button is disabled initially", () => {
    renderApp();
    expect(screen.getByTitle("Undo")).toBeDisabled();
  });

  it("redo button is disabled initially", () => {
    renderApp();
    expect(screen.getByTitle("Redo")).toBeDisabled();
  });
});

describe("MindMap — node operations", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it("+Node adds a new node and enables undo", async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getByText("+Node"));

    await waitFor(() => {
      expect(screen.getByTitle("Undo")).not.toBeDisabled();
    });
  });

  it("undo after +Node reverts to single Central Idea node", async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getByText("+Node"));
    await waitFor(() => expect(screen.getByTitle("Undo")).not.toBeDisabled());

    await user.click(screen.getByTitle("Undo"));
    await waitFor(() => expect(screen.getByTitle("Undo")).toBeDisabled());
  });

  it("redo re-applies undone action", async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getByText("+Node"));
    await waitFor(() => expect(screen.getByTitle("Undo")).not.toBeDisabled());

    await user.click(screen.getByTitle("Undo"));
    await waitFor(() => expect(screen.getByTitle("Redo")).not.toBeDisabled());

    await user.click(screen.getByTitle("Redo"));
    await waitFor(() => expect(screen.getByTitle("Undo")).not.toBeDisabled());
  });
});

describe("MindMap — maps tab", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it("shows the current map name", async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getByText("Maps"));

    await waitFor(() => {
      expect(screen.getByText("My Map")).toBeInTheDocument();
    });
  });

  it("+New Map creates a second map entry", async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getByText("Maps"));
    await waitFor(() => screen.getByText("My Map"));

    await user.click(screen.getByText("+New Map"));

    await waitFor(() => {
      expect(screen.getByText("Untitled Map")).toBeInTheDocument();
    });
  });
});

describe("MindMap — auth state", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it("shows Sign in button when logged out", async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getByText("Maps"));

    await waitFor(() => {
      expect(screen.getByText(/sign in/i)).toBeInTheDocument();
    });
  });
});

describe("MindMap — view-only share banner", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it("shows view-only banner when share token is in URL", async () => {
    vi.stubGlobal("location", { search: "?share=TEST_TOKEN" });
    mockChain.single.mockResolvedValueOnce({
      data: {
        id: "map_shared",
        name: "Shared Map",
        visibility: "public",
        share_token: "TEST_TOKEN",
        data: { nodes: [{ id: "n_1", name: "Shared Node", x: 0, y: 0, body: "" }], edges: [], background: null, settings: null },
      },
      error: null,
    });

    renderApp();

    await waitFor(() => {
      expect(screen.getByText(/view.only/i)).toBeInTheDocument();
    });
  });

  it("dismisses the banner on ✕ click", async () => {
    vi.stubGlobal("location", { search: "?share=TEST_TOKEN" });
    mockChain.single.mockResolvedValueOnce({
      data: {
        id: "map_shared",
        name: "Shared Map",
        visibility: "public",
        share_token: "TEST_TOKEN",
        data: { nodes: [{ id: "n_1", name: "Shared Node", x: 0, y: 0, body: "" }], edges: [], background: null, settings: null },
      },
      error: null,
    });

    const user = userEvent.setup();
    renderApp();

    await waitFor(() => screen.getByText(/view.only/i));

    await user.click(screen.getByRole("button", { name: "✕" }));

    await waitFor(() => {
      expect(screen.queryByText(/view.only/i)).not.toBeInTheDocument();
    });
  });
});
