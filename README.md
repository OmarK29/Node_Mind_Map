# Mind Map

A node-based mind mapping tool as a canvas-based application for mapping ideas as connected nodes. Connect ideas with optionally labeled, relational paths. For visualizing thoughts. Built with React.

Some uses: brainstorming, planning, flowing a debate, annotating a paper.

---

## Implemented

### Nodes
- Name, auto-generated timestamp ID, optional body/notes, optional image (URL)
- Nodes with no body are styled as **header nodes**
- Per-node toggles: show body, show neighbors list

### Connections
- Click a port dot on any node to start a connection, click another node or port to complete it
- Add connections by typing a node name or ID in the sidebar (autocomplete dropdown)
- Connections have an optional **label** and optional **relation** labels (one per end, e.g. parent → child)
- Relation presets: parent/child, higher/lower, left/right, cause/effect, before/after
- Click any connection on the canvas to select and edit it

### Canvas
- Pan (drag), zoom (scroll wheel, pinch on mobile, +/− buttons), fit-to-view button
- Infobar: live node/edge count and zoom %

### Multi-select
- **Shift + drag** to draw a selection box
- **Shift + click** to add/remove individual nodes
- Sidebar toggle for tap-to-select mode (mobile-friendly)
- Move, delete, copy, paste, or export the whole selection at once

### Multiple Maps
- Create, rename, and delete maps that are all stored locally
- Switch between maps; each saves its own state automatically

### Background (per map)
- Pattern type: dots, grid, or plain
- Customizable background color and dot/grid color
- Background image via URL (great for annotating an image)

### Sidebar
- **Edit tab** — node editor, edge editor, multi-select controls, global display settings, export/import
- **Maps tab** — map list, create/rename/delete maps, background settings
- **Help tab** — quick start guide, keyboard shortcuts, ready-to-copy AI prompts

### Global Display Toggles
- Show/hide body on all nodes
- Show/hide neighbor list on all nodes
- Show path name or relation label in neighbor lists
- Show node IDs on canvas

### Keyboard Shortcuts
| Key | Action |
|-----|--------|
| `N` | New node at cursor (hover canvas first) |
| `⌘C` | Copy selected node or selection |
| `⌘V` | Paste at cursor (or view center) |
| `Delete` / `⌫` | Delete selected node, edge, or group |
| `⌘Z` | Undo |
| `⌘⇧Z` / `⌘Y` | Redo |
| `Esc` | Cancel connection / deselect |
| Scroll | Zoom |
| Drag canvas | Pan |

### Export & Import
- Export whole map or selection as **JSON**, **CSV**, or **TXT** (plain-text notes format)
- Import **JSON** or **TXT** — both merge with the current map, shifting new nodes to avoid overlap
- After creating a node, focus jumps to the Name field automatically — press **Enter** to move to the body

### History
- 60-step undo/redo

### Mobile
- Touch pan and pinch-to-zoom
- Slide-out sidebar drawer
- Larger port tap targets
- RAF-throttled touch handler to prevent white-screen on repeated moves

### TXT format

Each node starts with a backtick line. Body follows. Connections start with `=`. Two blank lines between nodes.

```
`Node Name
Body text (optional, can span multiple lines)
= relation type, path label : Other Node
= : Node With No Labels


`Second Node
```

Connection line: `= relation type, path label : Other Node Name`  
Omit either part: `= rel : Name` or `= , label : Name` or `= : Name` are all valid.

---

## Planned

### Navigation
- Arrow keys to pan canvas (Shift for faster)

### Organization
- **Folder / collapse feature** — collapse everything connected under a header node; sidebar button to list all headers and toggle visibility of their subtrees

### Styling
- Color coding per node and per path
- Per-node text size, color, and weight
- Map-wide text defaults (headers, body, paths)

### AI Integration
- Tool to parse a paper or article line-by-line and extract Claim / Reasoning / Evidence / Source / Assumption nodes with relations automatically

### Account & Sync
- Sign-in and cloud storage

### Platform
- Hosted web version
- Desktop download (local, no server needed)

---

© 2026 Omar Khan
