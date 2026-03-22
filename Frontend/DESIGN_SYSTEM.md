# Frontend Design System

## Purpose
This frontend now uses a token-led SaaS UI structure so product, design, and engineering can work from the same visual rules instead of page-specific styling.

## Design Tokens
Core tokens live in [app/globals.css](./app/globals.css).

### Color Roles
- `--ds-bg-canvas`: app background
- `--ds-surface`: primary white surface
- `--ds-surface-muted`: secondary surface for filters and summary cards
- `--ds-surface-accent`: highlight surface for priority or insight panels
- `--ds-border-subtle`: neutral border color
- `--primary`, `--secondary`, `--accent`: branded application colors

### Typography
- Eyebrow: `.ds-eyebrow`
- Page title: `.ds-title`
- Section title: `.ds-section-title`
- Supporting copy: `.ds-copy`, `.ds-section-copy`

### Layout
- Page stack: `.ds-page-stack`
- Sidebar shell: `.ds-shell-grid`, `.ds-sidebar`, `.ds-main-surface`
- KPI grid: `.ds-kpi-grid`
- Inline stats: `.ds-inline-stat-grid`, `.ds-stat-block`

### Components
- Surface cards: `.ds-surface`, `.ds-surface-muted`, `.ds-surface-accent`
- Form fields: `.ds-field`
- Buttons: `.ds-button-primary`, `.ds-button-secondary`, `.ds-button-ghost`, `.ds-button-danger`
- Data tables: `.ds-table-wrap`, `.ds-table`
- Empty states: `.ds-empty-panel`
- Meta chips: `.ds-chip`

## Shared React Primitives
Reusable primitives live in [components/app/design-system.jsx](./components/app/design-system.jsx).

- `SectionCard`: normalized content surface
- `SectionHeader`: eyebrow, title, description, actions
- `FilterToolbar`: filter and search wrapper
- `DataTableSurface`: standard data table container
- `InlineStats`: small stat blocks
- `PageHero`: top-of-page product hero block

## Figma Mapping
Designers can recreate the system with these frame groups:

1. Foundations
- Colors
- Typography
- Spacing
- Radius
- Shadows

2. Components
- Buttons
- Inputs
- Selects
- Textareas
- Status badges
- Cards
- Tables
- Empty states
- Modals

3. Patterns
- CRM list page
- Detail page
- Dashboard with KPI cards + queue tables
- Admin control plane overview
- Modal workflow for follow-up completion

## Interaction States
- Hover: slightly darker fill or border emphasis
- Focus: teal border and clean ring replacement through `.ds-field`
- Loading: `LoadingState`
- Empty: `EmptyState`
- Error: `ErrorState`
- Status: `StatusPill`

## Responsive Rules
- Mobile-first layout
- Cards stack by default
- KPI and stat grids expand progressively at `md`, `xl`, and `2xl`
- Tables use horizontal scroll through `.ds-table-wrap` instead of overflowing the page

## Accessibility Notes
- Action groups should use semantic buttons/links
- Status is never color-only; labels remain visible
- Empty and error states use readable copy instead of silent blank areas
- Focus states remain visible on form controls

## Usage Guidance
- Prefer design-system primitives before adding ad-hoc wrappers
- Prefer token classes before introducing raw color values
- Keep business data and visual styling separate
- If a page needs a new pattern, add it once to the design system and reuse it
