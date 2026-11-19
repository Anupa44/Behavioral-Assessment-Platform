---
name: BehaviorAssess
status: implemented
created: 2026-09-06
updated: 2026-11-17
implementation: frontend/tailwind.config.js + frontend/src/index.css
sources:
  - _bmad-output/planning-artifacts/prds/prd-Behavioral assessment platform-2026-08-30/prd.md
brand:
  mark: frontend/public/favicon.svg + frontend/src/components/ui/Logo.tsx
  wordmark: BehaviorAssess
colors:
  primary: '#4F46E5'      # indigo-600 — action, selection, active state
  primary-foreground: '#FFFFFF'
  success: '#16A34A'
  success-foreground: '#FFFFFF'
  neutral-ramp: custom cool gray (overrides Tailwind `gray`)
  band-low: '#818CF8'     # ordinal ramp, light
  band-mid: '#4F46E5'
  band-high: '#312E81'    # ordinal ramp, dark
typography:
  family: Inter (variable), system fallbacks
  features: "cv11, ss01; tabular-nums on data"
rounded:
  md: 6px   # buttons, inputs
  lg: 8px   # option cards, tab pills
  xl: 12px  # cards
  2xl: 16px # modals, auth cards
  full: pill — status badges only
---

> **Audience:** engineers and designers working in `frontend/`. This documents the
> system as built, not an aspiration — every token here exists in
> `tailwind.config.js` or `src/index.css`.

## The prototypes are superseded — do not build from them

`mockups/prototype.html`, `mockups/prototype-part2.html` and the
`.working/direction-*.html` explorations predate this redesign and no longer
reflect the product. They were exploratory, they were never the source for any
shipped screen, and their markup conflicts with the token layer described here.

**This document and `frontend/src/index.css` are the only sources of truth.** Keep
the prototypes as historical record of the exploration if useful, but never copy
markup, color or spacing out of them.

## What changed from the original spec

The first version of this document specified **shadcn/ui** as the component
contract. That was never implemented — the app is hand-rolled Tailwind. Rather
than retrofit shadcn across 14 pages, the decision was to keep plain Tailwind and
invest in the **token layer** instead. The brand discipline from the original
(restraint, two brand colors, no decorative gradients, no display font) is kept
and still holds. Two rules were revised, both documented below: the ordinal band
palette, and where section navigation lives.

## Brand & Style

BehaviorAssess is a self-serve behavioral assessment tool for HR managers,
recruiters and L&D professionals. The expression is **premium through precision,
not decoration** — the register of Linear or Stripe rather than a consumer app.
Quality comes from typography, spacing rhythm, a real shadow hierarchy and
restrained color. It never comes from gradients, illustration or ornament.

Two surfaces:

- **Maker** — top bar + in-content tabs, data-dense, desktop-first, `max-w-7xl`.
- **Participant** — no chrome, one question at a time, mobile-first, `max-w-xl`.

### The logo

Four uneven bars in a rounded indigo square. The bars read as a behavioral
profile, and they are deliberately uneven — a real DISC or Big Five profile never
comes out flat. Four bars also matches DISC's four dimensions.

- `frontend/public/favicon.svg` — the standalone mark (browser tab).
- `Logo.tsx` exports `LogoMark` (mark only) and `Logo` (mark + wordmark).
- Never re-draw the mark inline; import the component. Never place it on a
  colored field other than white or `gray-50`.

## Color

Two brand colors, and that rule is unchanged.

- **Indigo `#4F46E5`** — action, selection, active state, progress fill. Never
  decorative, never used to make something merely look nicer.
- **Success `#16A34A`** — published/completed status and success confirmations.

**The neutral ramp is custom.** Tailwind's built-in `gray` is overridden in
`tailwind.config.js` with a cooler, lower-chroma scale (`gray-200` is `#e7ebf0`,
`gray-500` is `#697586`). This is deliberate: because the scale keeps the name
`gray`, every existing `text-gray-*` and `border-gray-*` in the app inherits it
with no call-site change. Do not reintroduce Tailwind's default gray.

### Ordinal data is not categorical — the revised rule

The original spec gave status and trait badges unrelated hues (red/yellow/green/
blue). That is correct for **status**, which is categorical — `invited` is not
"more" than `completed`.

It is **wrong for score bands**. `low → mid → high` is ordered, so it gets one hue
light-to-dark, never a rainbow:

| Band | Hex | Role |
|---|---|---|
| low | `#818CF8` | lightest step |
| mid | `#4F46E5` | brand step |
| high | `#312E81` | darkest step |

These live in `src/lib/bands.ts` and are shared by the analytics charts and the
participant result page, so the two always agree. The steps were validated, not
eyeballed: worst adjacent CVD separation ΔE 15.6, normal-vision ΔE 17.9, lightness
monotonic. The lightest step falls below 3:1 contrast on white, so **anything
using this ramp must also carry a visible label or legend** — that obligation is
not optional.

Status badges keep their categorical hues: draft `gray`, published/completed
`success`, invited `blue`, in-progress `amber`, expired `red`.

## Typography

**Inter**, loaded as a variable font, with `cv11` and `ss01` enabled and
`tabular-nums` applied to tables and any element carrying the `.tabular` class.
Numbers that change must not reflow the layout around them.

The type scale tightens tracking as size grows — this is the single biggest reason
default Tailwind headings read as generic:

| Token | Size | Tracking |
|---|---|---|
| `text-sm` | 14px | 0 |
| `text-base` | 15px | 0 |
| `text-lg` | 17px | -0.011em |
| `text-xl` | 19px | -0.014em |
| `text-2xl` | 23px | -0.019em |
| `text-3xl` | 28px | -0.021em |

Roles: `.page-title` (page h1), `.section-title` (card/section head),
`.page-subtitle` (muted supporting line). Use weight for emphasis, never a new
size token.

## Elevation

Shadows are **multi-layer at low alpha**. A single flat shadow is the other
giveaway of an unstyled Tailwind app.

- `shadow-xs` / `shadow-sm` — inputs, resting cards
- `shadow-lg` — auth cards, hover state on interactive cards
- `shadow-2xl` — modals
- `shadow-raised` — an inset white top highlight plus a hairline drop, used on
  filled buttons and the logo mark so they feel physical

Elevation is never the primary hierarchy device; borders and spacing carry that.

## Components

Defined once in `src/index.css`, used everywhere. Changing these changes the whole
app, which is the point.

- `.btn` + `.btn-primary` / `.btn-secondary` / `.btn-danger`, sizes `.btn-sm` /
  `.btn-lg`. 36px default height, `active:translate-y-px`.
- `.input` (+ `.input-error`), `.label`
- `.card`, `.card-tight`, `.card-interactive` (lifts on hover)
- `.badge` + status variants — **pill shape is reserved for status badges**
- `.skeleton`, `.focus-ring`, `.truncate-flex`, `.tabular`

Shared React primitives in `src/components/ui/`: `Layout`, `AssessmentTabs`,
`AuthShell`, `StatusCard`, `EmptyState`, `Modal`, `ErrorMessage`,
`LoadingSpinner`, `Logo`.

**Native `alert()` and `confirm()` are not acceptable UI.** Use `Modal`.

## Navigation — the revised rule

Section navigation for an assessment lives in **in-content tabs**
(`AssessmentTabs`), under the breadcrumb. A left sidebar was tried and rejected:
it duplicated the tabs and ate horizontal space that the tables and charts need.

- Top bar: logo, breadcrumbs, account, sign out. Sticky, translucent, blurred.
- Tabs: Settings / Questions / Invitations / Analytics.
- Active state is derived from the router (`useLocation`), never from
  `window.location`, which does not re-render on client-side navigation.

## Motion & accessibility

- 150ms, `ease-out`. Entrances use `animate-fade-in` / `animate-fade-in-up`.
- All motion is wrapped by a `prefers-reduced-motion` guard in `index.css`.
- Focus rings are `:focus-visible` only — keyboard users get a ring, mouse users
  don't get one left behind after a click.
- Participant answer options are a real `radiogroup` with `aria-checked`.
- Every icon-only button carries an `aria-label`.
- Never rely on color alone: bands carry labels, statuses carry text.

## Charts

Recharts, following the dataviz method:

- Horizontal bars for trait comparison — trait names like "Conscientiousness" are
  unreadable rotated under vertical columns.
- One hue for a single series; the ordinal ramp above for bands.
- Stacked segments get a 2px white stroke, which reads as a gap.
- Recessive grid (`#e7ebf0`, dashed, one axis only), axis text in `gray-500`,
  never in a series color.
- Direct labels on bars; a legend whenever there are 2+ series.
- **No pie charts.** The band distribution was nine pies; it is now one stacked
  bar that can actually be compared across traits.

## Do's and Don'ts

| Do | Don't |
|---|---|
| Change `.card` / `.btn` / `.input` to restyle the app | Hand-roll one-off variants at the call site |
| Use indigo for action and selection | Use indigo decoratively |
| Use one hue light→dark for ordered data | Use a rainbow for `low/mid/high` |
| Reserve pills for status badges | Make buttons or cards `rounded-full` |
| Use `Modal` for confirms | Use `confirm()` or `alert()` |
| Put section nav in `AssessmentTabs` | Add a second nav for the same destinations |
| Derive active state from `useLocation` | Read `window.location` in render |
| Give data `tabular-nums` | Let numbers reflow on update |
| Validate a new palette with a tool | Eyeball contrast or CVD safety |
