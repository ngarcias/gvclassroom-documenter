# GVClassroom Design Guidelines

## Design Approach
**System Selected:** Material Design + Enterprise Dashboard Patterns  
**Justification:** GVClassroom is a data-intensive educational management platform requiring robust table displays, complex filtering, calendar views, and clear information hierarchy. Material Design provides excellent patterns for content-rich applications while maintaining professional aesthetics suitable for institutional use.

**References:** Google Admin Console, Microsoft Teams Admin, Canvas LMS, Linear (for data table polish)

## Core Design Principles
1. **Information Clarity First:** Dense data must remain scannable and actionable
2. **Role-Based Context:** UI adapts to user permissions (SuperAdmin vs Professor vs Viewer)
3. **Operational Efficiency:** Minimize clicks to critical actions (edit attendance, homologate devices)
4. **Institutional Trust:** Professional, stable interface appropriate for educational institutions

---

## Typography System

**Font Families:**
- Primary: Inter (UI elements, tables, forms)
- Monospace: JetBrains Mono (device SNs, IDs, technical data)

**Type Scale:**
- Page Titles: text-3xl font-semibold
- Section Headers: text-xl font-semibold
- Card/Module Titles: text-lg font-medium
- Body/Table Content: text-base font-normal
- Labels/Metadata: text-sm font-medium
- Helper Text: text-xs

---

## Layout System

**Spacing Primitives:** Use Tailwind units of **2, 4, 6, 8, 12, 16**
- Component padding: p-4 to p-6
- Section gaps: gap-6 to gap-8
- Page margins: px-6 py-8 (desktop), px-4 py-6 (mobile)

**Container Strategy:**
- Main content: max-w-7xl mx-auto
- Forms/Modals: max-w-2xl
- Full-width tables: w-full with horizontal scroll on mobile

**Grid System:**
- Dashboard cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6
- Filter rows: flex flex-wrap gap-4
- Data tables: Always full-width, responsive horizontal scroll

---

## Navigation & Layout Structure

**Primary Navigation:**
- Persistent left sidebar (desktop) or collapsible drawer (mobile)
- Grouped by sections: Calendario, Dispositivos, Usuarios, Historiales, Configuración
- Active state with subtle accent indicator
- Icon + label for each nav item

**Page Structure:**
```
┌─────────────────────────────────────┐
│ Breadcrumb / Page Title             │
├─────────────────────────────────────┤
│ Filter Bar (if applicable)          │
├─────────────────────────────────────┤
│ Main Content Area                   │
│ (Tables, Cards, Calendar)           │
└─────────────────────────────────────┘
```

---

## Component Library

### Data Tables
- Header row with sortable columns (arrow indicators)
- Zebra striping for row scanning
- Compact row height (py-3) for data density
- Action buttons in right column (icon buttons)
- Search bar above table: sticky position
- Pagination controls at bottom
- Export button in top-right corner

### Filters
- Horizontal filter bar with multiple select dropdowns
- Date range pickers for temporal filters
- "Clear Filters" button always visible when filters active
- Filter chips below bar showing active selections

### Calendar Views
- Monthly grid view as default
- Day cells showing class blocks with time + room
- Click to expand class detail modal
- Legend for class states (active, canceled, completed)

### Cards (Dashboard Widgets)
- Elevation with subtle shadow
- Header with icon + title
- Metric/stat prominently displayed
- Action link or button at bottom
- Grid layout for dashboard overview

### Forms & Modals
- Modal overlays with backdrop blur
- Form sections with clear labels
- Input fields with validation states
- Primary action button (bottom-right)
- Cancel/secondary actions (bottom-left)
- Required field indicators

### Buttons
- Primary: Filled, high emphasis (create, save, confirm)
- Secondary: Outlined, medium emphasis (cancel, filter)
- Text: Low emphasis (minor actions)
- Icon-only: For table row actions (edit, delete, view)

### Status Indicators
- Badges for device connection status (Connected/Disconnected/Warning)
- Pill badges for user roles (Profesor, Alumno, Admin)
- Timestamp displays with relative time ("hace 2 horas")

### Search Components
- Magnifying glass icon prefix
- Placeholder text: "Buscar por nombre, RUT..."
- Clear button (×) when text entered
- Debounced search on typing

---

## Key Module Layouts

**Calendar Docente/Mi Calendario:**
- Top: Professor selector dropdown (or current user indicator) + date picker
- Main: Calendar grid showing scheduled classes
- Click interaction: Opens modal with attendance roster + manual mark controls

**Monitor de Dispositivos:**
- Top filter bar: SN search, Sede dropdown, Sala dropdown, Estado toggle
- Main: Sortable table with: SN, Sala, Sede, Versión App, Batería %, Estado, Última Conexión
- Right corner: Export buttons (General/Histórico)

**Usuarios:**
- Search bar + filter chips (Perfil, Estado)
- User table with inline edit icons
- "Crear Usuario" button (top-right)
- Edit modal: Form with RUT, Nombre, Perfil dropdown, Sede dropdown, Timezone, Estado toggle

**Información de Sala:**
- Two-column layout: Sala selector (left) + Date picker (right)
- Device status cards (grid below)
- Class schedule list (time-ordered)

---

## Responsive Behavior

**Desktop (1024px+):**
- Sidebar always visible
- Tables show all columns
- Multi-column filter bars

**Tablet (768-1023px):**
- Collapsible sidebar
- Tables may hide secondary columns (show via column selector)
- Stacked filters

**Mobile (<768px):**
- Hamburger menu for navigation
- Card-based table alternatives for critical views
- Single-column layouts
- Bottom sheet modals instead of centered modals

---

## Accessibility & Interactions

- Focus states: visible outline on all interactive elements
- ARIA labels for icon-only buttons
- Keyboard navigation: Tab through forms, Escape to close modals
- Loading states: Skeleton screens for tables, spinner for actions
- Success/error toast notifications (top-right corner)
- Form validation: inline error messages below fields

---

## No Animations
Keep interactions instant and functional. Avoid decorative transitions. Only essential UI feedback (button press states, modal open/close with minimal fade).