---
name: BehaviorAssess
status: final
created: 2026-09-06
updated: 2026-09-06
sources:
  - _bmad-output/planning-artifacts/prds/prd-Behavioral assessment platform-2026-08-30/prd.md
---

# BehaviorAssess — Experience Spine

> Paired with `DESIGN.md` (visual identity). DESIGN.md wins on visual conflicts; this spine owns behavior, IA, and interaction rules.

## Foundation

Responsive web application. shadcn/ui component library on Next.js + Tailwind CSS. No native mobile app in v1 — Participants may access via mobile browsers; the Maker surface is desktop-first.

Two distinct user contexts with separate layout shells:

- **Maker** — authenticated, email/password, fixed left sidebar (`w-60`), desktop-first (`lg+` primary). Creates and manages Assessments, sends Invitation Batches, views analytics.
- **Participant** — unauthenticated, Dedicated Link entry only, no sidebar, centered card layout (`max-w-xl`), mobile-responsive. Completes Assessments; never creates an account.

`DESIGN.md` is the visual identity reference. All token references (`{colors.primary}`, `{rounded.md}`, etc.) resolve there.

---

## Information Architecture

### Maker Surfaces

| Surface | Reached from | Purpose |
|---|---|---|
| Login | Direct URL / any unauthenticated route | Email + password authentication |
| Sign Up | Login page link | New Maker account creation |
| Email Verification Pending | Post sign-up | Prompt to verify email before full access |
| Password Reset | Login "Forgot password?" link | Self-service reset via email link |
| Dashboard — Assessment List | Login success / sidebar "Assessments" | All Maker's Assessments with status, invite count, completion rate |
| Create Assessment — Step 1: Setup | "+ New Assessment" button | Title, description, Framework selection, link expiry (default 7 days), time limit (default: none), result email toggle |
| Create Assessment — Step 2: Questions | Step 1 "Next" | Manual question creation and AI-generation staging; two tabs |
| Publish & Send | Step 2 "Publish" | Publish Assessment, create Invitation Batch (paste or CSV), send |
| Analytics — Cohort View | Dashboard row click | Completion rate, Trait distribution charts, Participant status table |
| Analytics — Participant Profile | Participant row click | Full Behavioral Profile slide-in panel |
| Account Settings | Sidebar "Settings" | Name, email (read-only + verified badge), password change |

### Participant Surfaces

| Surface | Reached from | Purpose |
|---|---|---|
| Assessment Landing | Dedicated Link in email | Introduction and "Start Assessment" CTA |
| Resume Prompt | Dedicated Link (returning, incomplete Session) | Continue from last Question or start over |
| Question Screen | Landing "Start" / Resume "Continue" | MCQ question with options, progress bar, optional timer |
| Submission Confirmation | Question screen "Submit" | Generic success acknowledgement; no Results displayed |
| Link Expired | Dedicated Link (past expiry date) | Informs Participant link is no longer valid |
| Already Submitted | Dedicated Link (completed Session) | Informs Participant they already completed |
| Time Expired | Auto-submit on countdown expiry | Informs Participant their answers were submitted automatically |

Sidebar collapses to a `Sheet` triggered from the top bar on `< md` (768px) for Maker surfaces. Modal dialogs stack one level deep maximum — no modal-on-modal.

→ Composition reference: `.working/prototype.html` (core flows), `.working/prototype-part2.html` (edge cases and error states). Spines win on conflict.

---

## Voice and Tone

Microcopy. Direct and minimal — no filler, no celebration, no hand-holding. The platform trusts both Makers and Participants to understand what they're doing. Brand aesthetic lives in `DESIGN.md`.

| Do | Don't |
|---|---|
| "5 invitations sent." | "Great news! Your invitations have been sent successfully! 🎉" |
| "Assessment submitted." | "You've completed the assessment. Thank you for your participation!" |
| "Link expired." | "Oops! It looks like this link is no longer valid." |
| "No results yet. 5 participants invited." | "Waiting for participants to complete their assessments..." |
| "Delete this assessment? This cannot be undone." | "Are you sure you want to delete? This action is permanent and irreversible." |
| "Generate questions aligned to DISC." | "Let our AI create personalized questions for your specific needs!" |
| "Invalid email or password." | "We couldn't find an account with those details. Please try again." |
| "Editing creates Version 2. Existing participants stay on Version 1." | "Warning: changes may affect participants who have already received invitations." |

Empty states: one short sentence, one action. No illustrations unless shadcn ships one. No motivational copy.

---

## Component Patterns

Behavioral. Visual specs live in `DESIGN.md.Components`.

| Component | Used on | Behavioral rules |
|---|---|---|
| Assessment row | Dashboard | Click anywhere on row navigates to Analytics — Cohort View. Row shows: title, Framework badge, Status badge, invited count, completion %. Hover reveals "Edit" and "Delete" action buttons (right-aligned). Delete disabled for Published Assessments (use Edit → version flow instead). |
| Question card (Participant) | Question Screen | Displays one Question at a time. Not scrollable past the visible question — Participant must answer before "Next" activates. Previous is always enabled except on Question 1. |
| MCQ option card | Question Screen | shadcn `Card` variant. Click selects; click again on selected deselects (allows changing answer). Only one option selectable per Question. Selected state: `{colors.primary}` border (2px) + indigo-50 background. "Next" activates only after one option is selected. |
| Status badge | Dashboard, Analytics participant table | Read-only pill. Six variants per `DESIGN.md.Components`. No interaction. |
| Trait badge (DISC) | Analytics participant table, Participant Profile panel | Read-only pill showing single letter (D / I / S / C). No interaction. Used to surface dominant Trait at a glance. |
| Participant row | Analytics — Cohort View | Click opens Profile slide-in panel. Row shows: email, Status badge, dominant Trait badge (Completed only), completion date (Completed only). "Resend" / "Reissue" action button visible for Invited and Expired rows. |
| Profile slide-in panel | Analytics — Participant Profile | shadcn `Sheet` (right anchor, `w-96`). Opens on Participant row click. Shows full Behavioral Profile: all Traits with Score, Score Band label, and interpretive text. Close via X button or clicking backdrop. |
| Modal dialogs | Edit-published warning, Delete confirm, Duplicate invitation warning, Resend/Reissue | shadcn `Dialog`. Max-width 480px. One primary action, one cancel. Never stacked. Destructive actions use red/destructive button variant. Confirm/Cancel always present — no auto-confirm. |
| Invitation batch input | Publish & Send | Two modes toggled by tabs: "Paste emails" (Textarea, comma-separated) and "Upload CSV" (drop zone). On submit: validate format, show invalid addresses in amber alert, require confirmation before send. |
| AI staging card | Step 2 Questions — AI tab | Each generated Question appears as a shadcn `Card` with: question text (read-only by default), answer options with Trait labels, three actions — "Accept", "Edit" (expands inline edit mode), "Regenerate". Accepted Questions move to the manual list below. Rejected are discarded. |
| Progress bar (Participant) | Question Screen | shadcn `Progress`. Fill color `{colors.primary}`. Shows "Question N of M" label above. Updates on each Next/Previous navigation. |
| Timer display | Question Screen (timed Assessments only) | Top-right of question area. Format: `MM:SS`. Color: `text-muted-foreground` by default; transitions to `text-amber-600 font-semibold` when ≤ 2 minutes remain. Amber banner appears simultaneously (see State Patterns). |
| Question reorder controls | Step 2 Questions — Manual tab | Up / Down arrow buttons on each question card (right-aligned). Clicking Up moves the question one position earlier; Down moves it one later. Disabled on first (Up) and last (Down) positions. No drag-to-reorder in v1. |
| Participant status filter | Analytics — Cohort View | Dropdown above participant table: "All statuses ▾". Options: All, Invited, In Progress, Completed, Expired. Filtering updates the table in place; aggregate stats (completion rate, Trait bars) remain unfiltered. |

---

## State Patterns

| State | Surface | Treatment |
|---|---|---|
| Loading / skeleton | Dashboard, Analytics | shadcn `Skeleton` rows matching expected layout. No spinner. Resolves on data. |
| Empty — no Assessments | Dashboard | Single centered empty state: "No assessments yet." below the table header, "+ New Assessment" primary button. |
| Empty — no completions | Analytics — Cohort View | Trait bars at 0%, completion rate shows "0 of N". Above bars: "Results appear as Participants complete the Assessment." No chart rendered until ≥ 1 completion. |
| Login error | Login | Inline error below password field: "Invalid email or password." No page reload. Input border turns destructive. |
| AI generation loading | Step 2 AI tab | CSS spinner + "Generating questions aligned to {Framework}…" Estimated time: "Usually takes 10–20 seconds." "Cancel" text link. |
| AI generation error | Step 2 AI tab | Red inline alert: "Generation failed. Try rephrasing your prompt." "Try again" button + "Edit prompt" link. No toast — error is in-context. |
| Invalid emails in batch | Publish & Send | Amber alert above valid list: "{N} addresses removed: {list}." Valid addresses shown below. "Send Invitations" remains available for the valid set. |
| Duplicate invitation warning | Publish & Send | shadcn `Dialog`: "{email} was already invited to Version {N}. Send again?" — "Send Anyway" (primary), "Skip This Address", "Cancel". |
| Invitations sent | Publish & Send | Inline success state (no modal): green checkmark icon, "N invitations sent.", "View Dashboard →" link. |
| Edit published Assessment | Dashboard / Step 1 | shadcn `Dialog` warning: "Editing creates Version 2. Existing Participants stay on Version 1." — "Edit & Create Version 2" (primary), "Cancel". |
| Delete Assessment | Dashboard (Draft only) | shadcn `Dialog`: "Delete this assessment? This cannot be undone." — "Delete" (destructive), "Cancel". Published Assessments cannot be deleted — action disabled. |
| Resume prompt | Participant — Dedicated Link (incomplete) | Centered card: "Welcome back. You left off at Question N of M." Progress bar at N/M fill. "Continue" (primary), "Start over" (outline). |
| Time warning | Question Screen | Amber banner below progress bar: "⚠ 2 minutes remaining — answers are saved." Timer turns amber. Banner persists until submission. |
| Time expired | Question Screen → auto-submit | Screen transitions to: "Time's up. Your answers have been submitted." Then auto-navigates to Submission Confirmation after 2 seconds. |
| Submission Confirmation | Post-submit | Centered card: checkmark icon, "Assessment submitted.", "You'll receive your results by email." (if result email enabled) or just "Assessment submitted." (if disabled). No Results displayed. |
| Link expired | Participant — Dedicated Link | Centered card: clock icon, "This link has expired.", "Contact the person who sent you this assessment to request a new link." No CTA (dead end by design). |
| Already submitted | Participant — Dedicated Link | Centered card: checkmark icon, "Assessment already completed.", "Thank you for participating." No CTA. |
| Autosave (Step 1 & 2) | Create Assessment | Subtle "Saved" indicator (top-right of form, `text-xs text-muted-foreground`) appears 1s after any field change. Disappears after 3s. No toast. |
| Result processing pending | Analytics — Cohort View | When a Session is submitted but processing has not yet completed (queued state per FR-27), the Participant row shows "Processing" in place of a Status badge — `text-muted-foreground` italic. Resolves automatically on next Dashboard refresh (≤ 60s). No Maker action required. |
| Version filter | Analytics | Dropdown above participant table: "Version {N} (current) ▾". Selecting a prior Version reloads analytics for that Version. |

---

## Interaction Primitives

**Click-driven.** BehaviorAssess is not a keyboard-first product. Mouse and touch are the primary input modalities.

**Maker interactions:**
- Click rows to navigate (Assessment row → Analytics, Participant row → Profile panel)
- Click "+ New Assessment" → Step 1 form
- Tabs (Manual / AI Generate) switch without navigation
- Modals for destructive or version-creating actions — always explicit confirm/cancel
- Slide-in Sheet for Participant Profile — closes on backdrop click or X button
- Switch toggle for result email configuration — immediate, no save button
- Form "Next" / "Back" for multi-step Assessment creation; progress retained between steps

**Participant interactions:**
- Click MCQ option card to select (one at a time, toggleable)
- "Next" activates only after selection; "Previous" always available except on Question 1
- "Submit" available only after all Questions answered
- Progress bar and question counter update on every navigation step
- No keyboard shortcuts required

**Banned everywhere:**
- Drag-to-reorder (v1 scope out)
- Hover-only affordances on mobile viewports
- Modal stacks deeper than one level
- Auto-submit without user action (exception: time expiry — documented in State Patterns)
- Confirmation dialogs for non-destructive actions

---

## Accessibility Floor

Best-effort for v1 (portfolio/learning project — no WCAG compliance requirement).

- Semantic HTML: `<button>` for actions, `<a>` for navigation, `<form>` with proper `<label>` associations
- Visible focus rings: inherit shadcn's `ring` token — no custom outline suppression
- shadcn components carry ARIA attributes by default — do not override `role`, `aria-label`, or `aria-expanded` without purpose
- Color is not the sole differentiator for Status badges — text label always present
- No strict screen reader or keyboard navigation audit required for v1

---

## Responsive & Platform

| Breakpoint | Maker behavior | Participant behavior |
|---|---|---|
| `≥ lg` (1024px+) | Full sidebar (240px) + main content. Primary target. | Centered card (`max-w-xl`), comfortable padding. |
| `md` (768–1023px) | Sidebar collapses to icon strip or Sheet. Tables remain; horizontal scroll on overflow. | Centered card, slightly reduced padding. |
| `< md` / `sm` (< 768px) | Sidebar becomes a `Sheet` from top bar. Maker experience degraded but functional. | Full-width card (`px-4`). MCQ option cards stack. Primary Participant target. |
| `< sm` (< 640px) | Not a supported Maker target — warn if viewport too narrow. | Full-width, minimal padding. Question and options fill screen. |

Participant question screen tested at 390px (iPhone 14 reference). All interactive elements (MCQ options, Next/Previous/Submit) must be thumb-reachable.

---

## Key Flows

### Flow 1 — Sarah creates an AI-generated DISC assessment and invites candidates

1. Sarah logs in. Dashboard loads — one prior Draft Assessment in the table.
2. She clicks "+ New Assessment". Step 1: she types "Sales Role DISC Screen", selects DISC, leaves link expiry at 7 days, toggles result email off (internal screening).
3. She clicks "Next". Step 2: she selects the AI tab, types "assertiveness and teamwork for a sales role", clicks "Generate".
4. AI loading state — spinner, "Generating 10 questions aligned to DISC…" — resolves in ~15s.
5. Ten staged question cards appear. She reads the first three, accepts them. She edits Question 4 — changes the wording — then accepts. She regenerates Question 7 (too generic), accepts the replacement. Accepts the remaining five.
6. She clicks "Publish". Edit-warning modal does not appear (first publish). Assessment is now Published.
7. Publish & Send screen: she pastes five candidate emails into the textarea. One is malformed — amber alert removes it. She confirms send with four valid emails.
8. **Climax:** "4 invitations sent." Success state. Sarah clicks "View Dashboard →". The Analytics view loads: 0/4 completed, all four Participants show "Invited" status.
9. Over the next two days she returns to the Dashboard and watches completions tick up. She clicks each completed Participant row to open the profile panel and read their DISC profile before interviews.

Failure: AI generation fails → inline error, "Try again" — Sarah rephrases the prompt and regenerates successfully.

---

### Flow 2 — James completes an assessment as a candidate

1. James opens his email, sees "You've been invited to complete a behavioral assessment." He clicks the Dedicated Link.
2. Assessment Landing card: "Sales Role Behavioral Assessment. This takes approximately 10 minutes. No account required." He clicks "Start Assessment."
3. Question screen loads. Progress bar: "Question 1 of 10." He reads the question, clicks an MCQ option card — it highlights with `{colors.primary}` border. "Next" activates.
4. He navigates forward to Question 6. He pauses — closes the browser to take a call.
5. Later, he clicks the link again from his email. Resume Prompt: "Welcome back. You left off at Question 6 of 10." He clicks "Continue." Resumes at Question 6 with his prior answers intact.
6. He finishes Question 10. "Submit" button activates.
7. **Climax:** He clicks Submit. Dedicated Link invalidates. Confirmation card: "Assessment submitted. You'll receive your results by email." Shortly after, a Result Email arrives with his full DISC Behavioral Profile — four Traits, each with score, band label, and interpretive text.
8. James reads the profile. He recognizes the description of his Dominant trait as accurate.

Failure: James's link expires before he returns. He clicks it — "This link has expired. Contact the person who sent you this assessment." He emails the recruiter; Sarah reissues his link from the Participant status view.

---

### Flow 3 — Marcus checks the team DISC distribution

1. Marcus logs in. Dashboard shows "Engineering Team DISC Profile" — Published, 12 invited, 9 completed.
2. He clicks the row. Analytics — Cohort View loads: completion rate 75% (9/12). Four DISC Trait bars show the team distribution: high Conscientiousness, mixed Dominance and Steadiness, lower Influence.
3. Marcus filters by "Invited" status in the Participant table. Three rows show — two "Invited" (not started), one "Expired." He selects the expired row, clicks "Reissue." Resend/Reissue modal opens: "Reissue link for diana@eng.co — generate a new 7-day link." He confirms.
4. He clicks the "Invited" rows and also resends their invitations.
5. He clicks a "Completed" row — the Profile panel slides in from the right: Alex Chen, Dominant trait C (Conscientiousness), full interpretive text for all four traits.
6. **Climax:** Marcus screenshots the Trait distribution chart. He now has a clear picture of where the team sits across all four DISC dimensions — and one clear outlier in Dominance to be mindful of when designing workshop group activities.
7. He closes the panel. The cohort view remains. He exports the participant list (CSV export button — non-destructive, data only) and heads into workshop planning.
