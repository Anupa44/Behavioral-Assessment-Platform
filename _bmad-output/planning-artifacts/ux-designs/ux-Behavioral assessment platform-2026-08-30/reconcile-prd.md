# Reconciliation: PRD → UX Spines

## Gaps (PRD requirements not reflected in spines)

- **FR-6 [Question reordering]**: PRD requires Questions to be reorderable while Assessment is in Draft. EXPERIENCE.md covers Add/Edit/Delete on the AI staging card and manual question flow but does not specify a reorder interaction (drag handle, up/down buttons) in Component Patterns.
- **FR-9 [Assessment Configuration — time limit surface]**: FR-9 specifies configurable link expiry and result email toggle per Assessment (Step 1 Setup). FR-21 adds a configurable time limit. EXPERIENCE.md covers the Participant-side timer display but does not specify where/how the Maker sets the time limit (Step 1 form field vs. separate config section).
- **FR-27 [Async processing fallback state]**: PRD specifies that if processing exceeds 5s, the Result is queued for async delivery and Dashboard updates later. EXPERIENCE.md covers Time Expired and Submission Confirmation states but has no state entry for "processing queued / result pending" on the Maker Dashboard side.
- **FR-33 [Status filter]**: PRD requires Maker to filter Participant table by status (Invited / In Progress / Completed / Expired). EXPERIENCE.md's Participant row component covers status badges and resend/reissue actions but does not specify the filter control behavior (dropdown, tab strip, or checkbox).

## Confirmed coverage

- FR-1/FR-2/FR-3/FR-4: covered at EXPERIENCE.md IA (Login, Sign Up, Email Verification Pending, Password Reset surfaces)
- FR-5/FR-7/FR-8: covered at EXPERIENCE.md IA (Create Assessment Steps 1–2, Publish & Send) and State Patterns (edit-published warning modal)
- FR-10/FR-11/FR-12/FR-13/FR-14: covered at EXPERIENCE.md Component Patterns (AI staging card with Accept/Edit/Regenerate) and State Patterns (AI loading, AI error)
- FR-15: covered at EXPERIENCE.md Component Patterns (invitation batch input — paste + CSV modes, invalid email amber alert, duplicate warning modal)
- FR-16/FR-17/FR-18: covered at EXPERIENCE.md State Patterns (invitations sent success) and Component Patterns (Participant row resend/reissue)
- FR-19: covered at EXPERIENCE.md IA (Link Expired, Already Submitted surfaces) and State Patterns
- FR-20: covered at EXPERIENCE.md IA (Resume Prompt surface) and State Patterns (resume prompt)
- FR-21: covered at EXPERIENCE.md Component Patterns (timer display) and State Patterns (time warning, time expired)
- FR-22: covered at EXPERIENCE.md Component Patterns (MCQ option card — Next activates only after selection; Previous always enabled except Q1)
- FR-23: covered at EXPERIENCE.md IA (Submission Confirmation) and State Patterns
- FR-24/FR-25/FR-26: backend — no UX surface required; covered implicitly via Profile slide-in panel displaying Trait Scores + Score Band labels
- FR-28/FR-29: backend + email — no Maker UI surface; Result Email design not in scope for EXPERIENCE.md (email template is a separate artifact)
- FR-30: covered at EXPERIENCE.md IA (Dashboard — Assessment List) and Component Patterns (Assessment row)
- FR-31: covered at EXPERIENCE.md IA (Analytics — Cohort View) and State Patterns (empty analytics)
- FR-32: covered at EXPERIENCE.md Component Patterns (Profile slide-in panel)
- FR-33 (status display): covered at EXPERIENCE.md Component Patterns (Participant row, status badges) — filter control behavior is the gap noted above
