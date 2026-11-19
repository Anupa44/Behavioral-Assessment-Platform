# Reconciliation: Brief → PRD

## Gaps (brief content not reflected in PRD)

- **"Why now" / market timing signal**: Brief explicitly frames the SMB/indie gap and names competitors (TestGorilla, Mercer Mettl, Typeform) as context for why this product exists now. PRD mentions competitors in §1 Vision but does not carry a "Why Now" section or timing rationale — acceptable for a portfolio project, but worth noting if the PRD is ever used as an external pitch artifact.
- **L&D secondary user JTBD depth**: Brief describes L&D use case as "team-wide behavioral mapping" and "post-hire development." PRD §2.1 lists it but UJ-1 and UJ-2 cover only the HR screening scenario. No L&D journey is represented, leaving that user's flow unvalidated.
- **"No participant login as key differentiator" framing**: Brief calls this "the single biggest drop-off point in assessment tools" — a strong product thesis. PRD captures it as FR-19/FR-23 but does not elevate it as a design constraint in the NFRs or as a success metric. If future engineers optimize away the frictionless path (e.g., add optional login), there is no PRD guardrail.

## Confirmed coverage

- Maker account + auth: FR-1 through FR-4
- Manual MCQ creation with framework selection and trait mapping: FR-5 through FR-9
- AI-assisted generation with review/edit/regenerate: FR-10 through FR-14
- Email batch invitation with dedicated links: FR-15 through FR-17
- No-login participant experience with resume and time limit: FR-19 through FR-23
- Automated scoring, behavioral analysis, trait mapping: FR-24 through FR-27
- Configurable result email with full Behavioral Profile: FR-28 through FR-29
- Maker dashboard (list, cohort, individual, status): FR-30 through FR-33
- Out-of-scope items (custom frameworks, integrations, monetization, mobile): §5 Non-Goals
- Open question on monetization: OQ-1
- Vision and differentiators: §1 Vision
