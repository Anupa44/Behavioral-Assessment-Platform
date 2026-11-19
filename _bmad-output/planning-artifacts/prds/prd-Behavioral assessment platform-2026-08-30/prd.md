---
title: "PRD: Behavioral Assessment Platform"
status: final
created: 2026-08-30
updated: 2026-08-30 (polished)
---

# PRD: Behavioral Assessment Platform

## 0. Document Purpose

This PRD is the authoritative requirements reference for the Behavioral Assessment Platform — a self-serve web application for creating, distributing, and analyzing MCQ-based behavioral assessments. It is written for the builder (bap) and any downstream workflow consumers (UX, architecture, epics). All domain terms are defined in §3 Glossary and used verbatim throughout. Features are grouped in §4 with globally numbered FRs (FR-1 through FR-33) for stable cross-reference. Assumptions are tagged inline and indexed in §9.

Source input: finalized product brief (`_bmad-output/planning-artifacts/briefs/brief-Behavioral assessment platform-2026-08-30/brief.md`).

---

## 1. Vision

The Behavioral Assessment Platform automates the full HR behavioral assessment workflow — from quiz creation to Participant profiling — in a single self-serve web application. Makers create MCQ Assessments (manually or via AI), distribute them to Participants by Invitation Batch, and receive scored Results with behavioral trait analysis mapped to established Frameworks (DISC, Big Five). Participants complete Assessments via a Dedicated Link with no account required. The platform eliminates the manual work between "I want to assess this person" and "I have their Behavioral Profile."

Today, this workflow is either locked behind expensive enterprise contracts (TestGorilla, Mercer Mettl) or cobbled together from generic survey tools (Typeform, Google Forms) with no behavioral intelligence. This platform fills that gap for SMB HR managers, independent recruiters, and L&D professionals who need behavioral insight without a procurement process.

This is a portfolio project modeled on real SaaS product design.

---

## 2. Target User

### 2.1 Jobs To Be Done

**Maker**
- Screen candidates for behavioral fit before interviews without manual tabulation.
- Assess cultural or role fit post-hire without enterprise tooling.
- Run team-wide behavioral profiling (e.g., "what is our team's DISC distribution?").
- Create a professionally structured behavioral assessment without expertise in psychometric design.
- Distribute Assessments to a list of people and track who has completed them.

**Participant**
- Complete a behavioral assessment with minimal friction — no account, no app, no learning curve.
- Understand their own Behavioral Profile if the Maker shares results.

### 2.2 Non-Users (v1)

- Organizations requiring SSO or enterprise identity management.
- Teams needing multi-maker collaboration on a single Assessment.
- Users requiring custom behavioral frameworks beyond those shipped by the platform.

### 2.3 Key User Journeys

- **UJ-1. Sarah runs candidate screening for an open role.**
  - **Persona + context:** Sarah, an HR manager at a 40-person company, needs to assess five shortlisted candidates for behavioral fit before scheduling interviews.
  - **Entry state:** Authenticated, on the Assessment list page.
  - **Path:** Creates a new Assessment, selects DISC as the Framework, uses AI generation with the prompt "assertiveness and teamwork for a sales role," reviews and accepts 10 generated Questions, publishes the Assessment, creates an Invitation Batch by pasting five candidate emails, sends.
  - **Climax:** All five candidates receive their Invitation emails. As they complete the Assessment, Sarah watches the Dashboard completion rate climb and clicks into each Behavioral Profile as results arrive.
  - **Resolution:** Sarah heads into interviews with a DISC profile for each candidate. No spreadsheets touched.
  - **Edge case:** One candidate's link expires before they complete it. Sarah reissues the link from the Participant status view.

- **UJ-2. James completes an Assessment as a job candidate.**
  - **Persona + context:** James, applying for a sales role, receives an email from a company with a link to complete a behavioral assessment.
  - **Entry state:** Unauthenticated, email inbox.
  - **Path:** Clicks Dedicated Link, lands on the Assessment, reads the instructions, answers 10 MCQ Questions navigating forward and back, submits.
  - **Climax:** Confirmation page shown. James receives a Result Email shortly after with his full DISC Behavioral Profile.
  - **Resolution:** James has his profile and knows the company used a structured assessment process.
  - **Edge case:** James closes the browser halfway through. He clicks his link again from the original email and resumes from Question 6.

- **UJ-3. Marcus maps his team's behavioral profiles.**
  - **Persona + context:** Marcus, an L&D lead at a 60-person company, wants to understand the DISC distribution across his 12-person engineering team before planning a communication workshop.
  - **Entry state:** Authenticated, on the Assessment list page.
  - **Path:** Creates a new Assessment, selects DISC, uses AI generation with the prompt "team communication and collaboration styles," reviews and accepts the generated Questions, publishes, creates an Invitation Batch by uploading a CSV of 12 team member emails, sends. Configures result email delivery on so each team member receives their own Behavioral Profile.
  - **Climax:** As the team completes the Assessment over two days, Marcus watches the cohort Trait distribution chart take shape on the Dashboard — a clear spread across Dominance, Influence, Steadiness, and Conscientiousness.
  - **Resolution:** Marcus enters the workshop with a full team DISC distribution and individual Behavioral Profiles. The workshop facilitation is grounded in real data.
  - **Edge case:** Two team members have not completed after five days. Marcus filters by "Invited" status in the Dashboard and reissues their links with a fresh 7-day expiry.

---

## 3. Glossary

- **Maker** — an authenticated user who creates and manages Assessments. Has full access to Assessment configuration, Invitation Batches, and the Dashboard.
- **Participant** — a person who completes an Assessment via a Dedicated Link. Never creates an account; identified only by their email address.
- **Assessment** — the top-level object a Maker creates. Contains a Framework selection, a set of Questions, and configuration (result email on/off, time limit, link expiry). One Assessment can have many Invitation Batches and many Versions.
- **Question** — a single MCQ item within an Assessment. Each answer option is mapped to exactly one Trait from the selected Framework.
- **Framework** — a behavioral model (e.g., DISC, Big Five) that defines the Traits being measured and the scoring algorithm.
- **Trait** — a behavioral dimension within a Framework (e.g., Dominance in DISC; Openness in Big Five). Trait Scores aggregate across all Questions in an Assessment.
- **Trait Score** — the count of answer options selected by a Participant that map to a given Trait, normalized to the Framework's defined scale.
- **Score Band** — a named range of Trait Score values (low / mid / high) with an associated interpretive text block.
- **Invitation Batch** — a set of email addresses to which the system sends Invitations for a specific Assessment Version.
- **Invitation** — a transactional email sent to a Participant containing their Dedicated Link.
- **Dedicated Link** — a unique, cryptographically unguessable URL bound to one Participant + Assessment Version. Single-use and time-bounded; expires after the configured duration.
- **Session** — one Participant's active completion attempt via their Dedicated Link. A Session begins on first link access and ends on submission or expiry.
- **Result** — the scored output of a completed Session: raw Trait Scores, Score Band assignments, interpretive text, and submission timestamp.
- **Behavioral Profile** — the human-readable output assembled from a Result: Trait name, Trait Score, Score Band label, and interpretive text for each Trait in the Framework.
- **Result Email** — a transactional email sent to the Participant after their Session is processed, containing their full Behavioral Profile. Configurable per Assessment by the Maker.
- **Dashboard** — the Maker's analytics view showing Assessment activity, cohort aggregates, and individual Participant Results.
- **Version** — a numbered snapshot of an Assessment's Questions and configuration. Created automatically when a Maker edits a Published Assessment. Invitation Batches are bound to the Version active at send time.

---

## 4. Features

### 4.1 Maker Authentication

Makers register with email and password, verify their email, and access the platform via token-based sessions. No SSO or social login in v1.

**Functional Requirements:**

#### FR-1: Registration
A Maker can register with a unique email address and password.

**Consequences:**
- System sends a verification email on successful registration.
- Account is created in an unverified state.
- System rejects registration if the email is already in use.
- System enforces minimum password strength: 8 characters, at least one number, at least one special character. `[ASSUMPTION-1: standard minimum — adjust if needed]`
- Unverified Makers can log in but cannot create Assessments.

#### FR-2: Email Verification
A Maker can verify their account by clicking the link in the verification email.

**Consequences:**
- Verification link expires after 24 hours and is single-use.
- If expired, the Maker can request a new verification email.
- On successful verification, the Maker gains full access.

#### FR-3: Login and Session Management
A verified Maker can log in with their email and password.

**Consequences:**
- System issues a 24-hour access token and a refresh token on successful login.
- Access token is refreshed silently before expiry using the refresh token.
- On refresh token expiry, the Maker is redirected to login.
- Failed login attempts are rate-limited. `[ASSUMPTION-2: account locked after 5 consecutive failed attempts — confirm]`

#### FR-4: Password Reset
A Maker can request a password reset via email.

**Consequences:**
- Reset link expires after 1 hour and is single-use.
- On successful reset, all existing sessions are invalidated.

---

### 4.2 Manual Assessment Creation

A Maker creates an Assessment by selecting a Framework, writing MCQ Questions, and mapping each answer option to a Trait. Assessments exist in Draft or Published state. Editing a Published Assessment creates a new Version; existing Participants remain on the prior Version.

**Functional Requirements:**

#### FR-5: Create Assessment
A Maker can create a new Assessment with a title, optional description, and a Framework selection.

**Consequences:**
- Assessment is created in Draft state.
- Framework selection is locked once the first Invitation Batch is sent. `[ASSUMPTION-3: changing Framework after mapping would invalidate all trait assignments]`
- Maker can save a Draft and return at any time.

#### FR-6: Add and Edit Questions
A Maker can add MCQ Questions to a Draft or Published Assessment. Each Question has a prompt and between 2 and 6 answer options. `[ASSUMPTION-4: 2–6 options per question — confirm bounds]`

**Consequences:**
- Each answer option is mapped to exactly one Trait from the selected Framework.
- A Question cannot be saved unless all options are mapped to a Trait.
- Questions can be reordered, edited, or deleted while the Assessment is in Draft.

#### FR-7: Publish Assessment
A Maker can publish a Draft Assessment, making it available for Invitation Batches.

**Consequences:**
- An Assessment must have at least one Question to be published. `[ASSUMPTION-5: minimum 1 question — confirm]`
- Published status is visible in the Assessment list.

#### FR-8: Version on Edit
When a Maker edits a Published Assessment, the system creates a new Version.

**Consequences:**
- Existing Dedicated Links and active Sessions remain bound to the prior Version.
- New Invitation Batches are sent against the new Version.
- The Maker can see which Version each Invitation Batch was sent against.

#### FR-9: Assessment Configuration
A Maker can configure result email delivery and Dedicated Link expiry per Assessment.

**Consequences:**
- Result email delivery defaults to off. `[ASSUMPTION-6: default off — confirm]`
- Dedicated Link expiry defaults to 7 days, configurable per Assessment.
- Configuration changes to result email delivery apply to Sessions submitted after the change; existing issued links retain their expiry.

---

### 4.3 AI-Assisted Assessment Creation

A Maker submits a plain-language prompt and the system generates a set of MCQ Questions with Trait mappings pre-applied, aligned to the selected Framework. Generated Questions are staged for review before being added to the Assessment.

**Functional Requirements:**

#### FR-10: AI Generation Prompt
A Maker can submit a text prompt describing what they want to assess. The Framework must be selected before generation.

**Consequences:**
- System generates a set of MCQ Questions with answer options and Trait mappings pre-populated. `[ASSUMPTION-7: default 10 questions per generation — confirm or make Maker-configurable]`
- Generated Questions are placed in a staging review area, not added to the Assessment automatically.
- Generation is asynchronous; the Maker is notified when results are ready. `[ASSUMPTION-8: async generation — confirm acceptable latency]`

#### FR-11: Review and Edit Generated Questions
A Maker can review each staged Question, edit the question text, edit answer option text, and change Trait mappings before accepting.

**Consequences:**
- A Question cannot be accepted unless all answer options are mapped to a Trait.
- Edits are reflected in the accepted Question; the AI origin is not surfaced to Participants.

#### FR-12: Regenerate Single Question
A Maker can regenerate a single Question within the staged set without affecting other Questions.

**Consequences:**
- The regenerated Question replaces the previous staged Question.
- Any edits made to the previous staged Question are discarded.

#### FR-13: Regenerate Full Set
A Maker can regenerate the entire staged set using the same or a revised prompt.

**Consequences:**
- The prior staged set is discarded.
- The Maker can modify the prompt before regenerating.

#### FR-14: Accept Questions
A Maker can accept individual Questions or the full staged set, adding them to the Assessment Draft.

**Consequences:**
- Accepted Questions follow the same rules as manually created Questions (FR-6).
- Rejected Questions are discarded with no record kept.

---

### 4.4 Invitation Batch

A Maker distributes a Published Assessment by creating an Invitation Batch. Each Participant receives a unique Dedicated Link by email. Links expire after a configurable duration (default 7 days). The Maker can resend or reissue Invitations individually.

**Functional Requirements:**

#### FR-15: Create Invitation Batch
A Maker can create an Invitation Batch by pasting a comma-separated list of email addresses or uploading a CSV file. The Assessment must be Published.

**Consequences:**
- System validates each email address format before sending.
- Invalid addresses are flagged and excluded; the Maker sees the rejected list before confirming send.
- Duplicate addresses within the same Batch are de-duplicated silently.
- If a Participant email has already been invited to this Assessment Version, the system warns the Maker before allowing a duplicate Invitation. `[ASSUMPTION-9: warn but allow — confirm]`

#### FR-16: Invitation Email
The system sends an Invitation email to each Participant in the Batch containing their Dedicated Link.

**Consequences:**
- Each Dedicated Link is unique, cryptographically unguessable, and bound to one Participant + Assessment Version.
- The Dedicated Link expires after the configured duration.
- The email includes the Assessment title and the link expiry date.

#### FR-17: Link Expiry Configuration
A Maker can configure the Dedicated Link expiry duration per Assessment (default: 7 days).

**Consequences:**
- The configured expiry applies to all future Invitation Batches for that Assessment.
- Existing Dedicated Links retain the expiry duration they were issued with.

#### FR-18: Resend and Reissue Invitation
A Maker can resend or reissue an Invitation to a specific Participant from the Participant status view.

**Consequences:**
- Resend re-sends the existing Dedicated Link if it has not expired and the Session is not completed.
- Reissue generates a new Dedicated Link, invalidates the prior one, and sends a new Invitation email. Used when the prior link has expired.

---

### 4.5 Participant Assessment Experience

A Participant accesses an Assessment via their Dedicated Link with no account required. Progress is saved automatically so the Participant can return and resume. An optional time limit is configurable by the Maker. On submission, the Participant sees a generic confirmation page.

**Functional Requirements:**

#### FR-19: Link Validation
When a Participant clicks their Dedicated Link, the system validates it before granting access.

**Consequences:**
- Expired link: Participant sees an expiry message; no further action available.
- Already submitted link: Participant sees a completion message.
- Valid link: Participant lands on the Assessment.

#### FR-20: Resume Progress
If a Participant has previously opened the Assessment without submitting, returning via the same Dedicated Link resumes from their last answered Question.

**Consequences:**
- Answered Questions retain their selected options on resume.
- The Participant can navigate back to change answers before final submission.

#### FR-21: Time Limit
A Maker can configure a time limit for completing an Assessment (default: no limit).

**Consequences:**
- The countdown begins when the Participant first opens the Assessment.
- Remaining time is visible to the Participant throughout the Session.
- On expiry, the Session is automatically submitted with answers recorded up to that point. `[ASSUMPTION-10: auto-submit on expiry — confirm]`
- Resuming a timed Session does not reset the countdown.

#### FR-22: Question Navigation
A Participant can navigate forward and backward through Questions before submitting.

**Consequences:**
- Submission is only available after all Questions have been answered. `[ASSUMPTION-11: all questions required — confirm, or allow partial submission]`

#### FR-23: Submission
A Participant can submit their completed Assessment.

**Consequences:**
- The Dedicated Link is invalidated on submission (single-use enforced).
- The Participant sees a generic confirmation page with no Results displayed.
- The system triggers Result processing (FR-24).

---

### 4.6 Result Processing

On Session submission, the system scores responses, maps them to Framework Traits, and assembles a Behavioral Profile using rule-based interpretive text. Processing is automatic.

**Functional Requirements:**

#### FR-24: Trait Scoring
The system calculates a Trait Score for each Framework Trait by counting how many of the Participant's selected answer options map to that Trait, then normalizing to the Framework's defined scale.

**Consequences:**
- All Traits in the Framework receive a score, including zero.
- Normalization range is Framework-defined. `[ASSUMPTION-12: e.g., 0–100 for Big Five — confirm per Framework]`

#### FR-25: Behavioral Profile Assembly
The system maps each Trait Score to a Score Band and selects the corresponding pre-written interpretive text block.

**Consequences:**
- Each Trait has at least three Score Bands: low, mid, high. `[ASSUMPTION-13: three bands minimum — confirm]`
- The Behavioral Profile includes: Trait name, Trait Score, Score Band label, and interpretive text for each Trait.

#### FR-26: Result Storage
The system stores the completed Result — Trait Scores, Behavioral Profile, and submission timestamp — bound to the Participant's Session.

**Consequences:**
- Results are immutable after processing.
- Results are accessible to the Maker via the Dashboard.
- Results are not accessible to the Participant via any URL; only delivered via Result Email if enabled.

#### FR-27: Processing Trigger
Result processing begins immediately on Session submission.

**Consequences:**
- The confirmation page is shown after processing completes. `[ASSUMPTION-14: synchronous processing — if latency is a concern, consider async with a "results being prepared" state]`
- If processing exceeds 5 seconds (Cross-Cutting NFR threshold), the Result is queued for async delivery; the Participant still sees the confirmation page and the Maker's Dashboard updates when processing completes.
- If processing fails, the Session is flagged for retry; the Participant still sees the confirmation page.

---

### 4.7 Result Email

After Result processing, if result email delivery is enabled, the system sends the Participant a Result Email containing their full Behavioral Profile.

**Functional Requirements:**

#### FR-28: Result Email Trigger
The system sends a Result Email immediately after Result processing completes, if result email delivery is enabled on the Assessment.

**Consequences:**
- Email is sent to the Participant's address from the Invitation Batch.
- If delivery is disabled, no email is sent and no notification is given to the Participant.

#### FR-29: Result Email Content
The Result Email contains the Participant's full Behavioral Profile.

**Consequences:**
- Includes: Assessment title, completion timestamp, and for each Trait — Trait name, Trait Score, Score Band label, and interpretive text.
- The email contains no link back to the platform or Session.
- Delivered as HTML email with plain-text fallback. `[ASSUMPTION-15: confirm email format]`

---

### 4.8 Maker Analytics Dashboard

The Dashboard gives Makers visibility across three levels: an Assessment list, a per-Assessment cohort view, and an individual Participant view.

**Functional Requirements:**

#### FR-30: Assessment List
A Maker can view all their Assessments with title, status (Draft / Published), total Participants invited, and completion rate.

**Consequences:**
- Listed in reverse chronological order by creation date.
- Maker can click into any Assessment to view its analytics.

#### FR-31: Cohort Analytics View
A Maker can view aggregate analytics for a selected Assessment across all completed Sessions.

**Consequences:**
- Displays: completion rate (completed / total invited), average Trait Score per Trait, and Trait distribution charts showing Score Band spread across all Participants.
- Where multiple Versions exist, the Maker can filter analytics by Version.
- Zero state shown when no Sessions are completed yet.
- Dashboard data refreshes at most every 60 seconds. `[ASSUMPTION-16: 60s polling interval acceptable — confirm if true real-time push is required]`

#### FR-32: Participant Analytics View
A Maker can view an individual Participant's full Behavioral Profile.

**Consequences:**
- Displays: Participant email, Session completion timestamp, and for each Trait — Trait Score, Score Band label, and interpretive text.
- Only available for Participants with a completed Session; pending and expired Participants show status only.

#### FR-33: Participant Status Tracking
The Dashboard shows the status of every invited Participant for a given Assessment.

**Consequences:**
- Statuses: Invited, In Progress, Completed, Expired.
- Maker can filter by status.
- Maker can trigger Resend or Reissue (FR-18) from this view.

---

## 5. Non-Goals (Explicit)

- No question types beyond MCQ in v1 (no open-ended, rating scales, or video responses).
- No custom behavioral frameworks; only platform-shipped Frameworks (DISC, Big Five) are available.
- No team or org accounts; each Maker account is individual.
- No integrations with ATS, HRIS, or communication tools (Slack, Teams).
- No monetization or paid tiers in v1.
- No white-labeling or custom branding for Makers.
- No AI-generated analysis at result time; behavioral analysis is rule-based only.
- No Participant-facing account, history, or profile; Participants have no persistent identity on the platform.
- No native mobile app in v1. Participants may access Assessments via mobile browsers; the web experience must be responsive. A native app is a separate future decision.

---

## 6. MVP Scope

### 6.1 In Scope
- Maker account creation, email verification, login, and password reset.
- Manual MCQ Assessment creation with Framework selection and Trait mapping.
- AI-assisted Assessment generation from a text prompt, with staged review and edit.
- Assessment versioning on post-publish edit.
- Invitation Batch via email paste or CSV upload; Dedicated Link generation.
- No-login Participant experience: link validation, progress resume, time limit, submission.
- Automated scoring, Trait mapping, and Behavioral Profile assembly (rule-based).
- Configurable Result Email to Participant with full Behavioral Profile.
- Maker Dashboard: Assessment list, cohort analytics, individual Participant view, status tracking with resend/reissue.

### 6.2 Out of Scope for MVP
- Custom behavioral frameworks (deferred — high value, requires significant content infrastructure). `[NOTE FOR PM]`
- Team/org accounts and multi-maker collaboration (deferred to v2).
- ATS/HRIS integrations (deferred to v2).
- Mobile app (deferred to v2+).
- Monetization and paid tiers (decision pending — required before public launch).
- White-labeling (deferred to v2+).
- AI-generated result narratives (deferred — rule-based ships in v1, AI narrative is v2 enhancement).

---

## 7. Success Metrics

**Primary**
- **SM-1:** Time to first Invitation Batch — a Maker completes signup, creates an Assessment, and sends an Invitation Batch in under 15 minutes. Validates FR-1 through FR-16.
- **SM-2:** Participant completion rate — percentage of Invited Participants who submit their Session (target: >70% within link validity window). Validates FR-19 through FR-23.
- **SM-3:** End-to-end automation — zero manual steps required between Session submission and Result Email delivery. Validates FR-24 through FR-29.

**Secondary**
- **SM-4:** AI generation acceptance rate — percentage of AI-generated Questions accepted by Makers without full regeneration (target: >60%). Validates FR-10 through FR-14.
- **SM-5:** Dashboard engagement — Makers view cohort analytics for >80% of Assessments with at least one completed Session. Validates FR-31, FR-32.

**Counter-metrics (do not optimize)**
- **SM-C1:** Participant drop-off rate — do not optimize SM-2 by reducing question count below what produces a meaningful Behavioral Profile. A high completion rate on a trivially short Assessment is not a win.
- **SM-C2:** AI generation speed — do not optimize SM-4 by loosening Framework alignment. Faster generation that produces misaligned Trait mappings degrades the core value proposition.

---

## 8. Open Questions

1. **Monetization** — not determined. Decision required before public launch. Candidates: usage-based (tests or Participants), feature-tiered subscription, freemium with AI generation as the paywall.
2. **Frameworks at launch** — which specific Frameworks ship in v1? DISC and Big Five are confirmed minimum; others TBD.
3. **AI model** — which LLM powers quiz generation (FR-10)? What prompt guardrails ensure Framework alignment and question quality?
4. **Data retention** — how long are Participant emails, Session data, and Results stored? Relevant for GDPR compliance if the platform is used in the EU.
5. **Password strength policy** — confirm or adjust minimum requirements (ASSUMPTION-1).
6. **Failed login lockout** — confirm 5-attempt threshold (ASSUMPTION-2).
7. **Minimum questions per Assessment** — confirm 1 is acceptable or set a higher floor (ASSUMPTION-5).
8. **Default question count for AI generation** — confirm 10, or make it Maker-configurable (ASSUMPTION-7).
9. **Score Bands** — confirm three bands (low/mid/high) per Trait and define exact numeric boundaries per Framework (ASSUMPTION-13).
10. **Result processing latency** — confirm synchronous processing is acceptable or define max latency threshold (ASSUMPTION-14).

---

## 9. Assumptions Index

- **ASSUMPTION-1** (§4.1, FR-1) — Password minimum: 8 chars, 1 number, 1 special character.
- **ASSUMPTION-2** (§4.1, FR-3) — Account locked after 5 consecutive failed login attempts.
- **ASSUMPTION-3** (§4.2, FR-5) — Framework selection locked once first Invitation Batch is sent.
- **ASSUMPTION-4** (§4.2, FR-6) — 2–6 answer options per Question.
- **ASSUMPTION-5** (§4.2, FR-7) — Minimum 1 Question required to publish.
- **ASSUMPTION-6** (§4.2, FR-9) — Result email delivery defaults to off.
- **ASSUMPTION-7** (§4.3, FR-10) — Default 10 Questions generated per AI prompt.
- **ASSUMPTION-8** (§4.3, FR-10) — AI generation is asynchronous.
- **ASSUMPTION-9** (§4.4, FR-15) — Duplicate Participant email in a Batch triggers a warning, not a hard block.
- **ASSUMPTION-10** (§4.5, FR-21) — Session auto-submits on time limit expiry.
- **ASSUMPTION-11** (§4.5, FR-22) — All Questions must be answered before submission is available.
- **ASSUMPTION-12** (§4.6, FR-24) — Normalization scale is Framework-defined (e.g., 0–100 for Big Five).
- **ASSUMPTION-13** (§4.6, FR-25) — Three Score Bands per Trait: low, mid, high.
- **ASSUMPTION-14** (§4.6, FR-27) — Result processing is synchronous with Session submission.
- **ASSUMPTION-15** (§4.7, FR-29) — Result Email is HTML with plain-text fallback.
- **ASSUMPTION-16** (§4.8, FR-31) — 60-second Dashboard polling interval is acceptable; true real-time push is not required.

---

## Cross-Cutting NFRs

### Email Delivery
- All transactional emails (verification, password reset, Invitation, Result Email) must be delivered via a dedicated transactional email service (e.g., SendGrid, Postmark, AWS SES). Direct SMTP is not acceptable.
- Soft bounces must be logged; hard bounces must update Participant status in the Dashboard.

### Link Security
- Dedicated Links must be generated using cryptographically secure random identifiers (minimum 128 bits of entropy). Sequential or predictable IDs are not acceptable.
- Expired and submitted links must return a clear status page, not a 404.

### Data Privacy
- Participant email addresses and Results are PII and must be stored encrypted at rest.
- Participant data must not be shared across Maker accounts.
- Data retention policy is an open question (OQ-4); the system must support configurable retention with hard-delete capability.

### AI Quality
- AI-generated Questions must be validated for Framework Trait coverage before being returned to the staging area — at minimum, all Traits in the selected Framework must appear across the generated set. `[NOTE FOR PM: define rejection threshold]`
- Prompt injection by Makers (adversarial prompts) must be guarded against at the generation layer.

### Performance
- Assessment pages must load within 2 seconds on a standard broadband connection.
- Result processing (FR-27) must complete within 5 seconds for Assessments of up to 30 Questions.
- AI generation (FR-10) must return results within 30 seconds; if exceeded, surface a timeout state with retry.

### Participant Login Invariant
- The platform must never require Participants to create an account or authenticate in any form to complete an Assessment. This is a core design invariant — not a v1 decision to revisit. Any feature that introduces Participant authentication violates this constraint.

### Platform
- Web only in v1. Responsive layout required — Participants may complete Assessments on mobile browsers even though no native app exists.
