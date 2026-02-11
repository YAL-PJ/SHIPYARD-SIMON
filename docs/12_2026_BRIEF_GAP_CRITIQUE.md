# Shipyard 2026 Brief Gap Critique

## Purpose
This document compares the **current app implementation** to Simon’s 2026 Better Creating brief and identifies the highest-impact gaps to close.

---

## Executive Summary
The current app is a solid MVP shell with three core coach modes, onboarding context capture, and subscription plumbing. It proves feasibility, but it is still much closer to a **functional AI chat utility** than the brief’s target of a **calm, human-centered coaching product that feels intentional, trustworthy, and progress-oriented**.

The largest gaps are not around basic chat mechanics; they are around:

1. **Perceived coaching depth and progression** (sessions produce messages, not durable outcomes)
2. **Memory and continuity** (little longitudinal intelligence)
3. **Mobile-first emotional UX** (usable, but not yet “meditation-grade calm”)
4. **Audience-specific framing** (does not yet fully embody Better Creating voice and anti-overwhelm posture)
5. **Product trust and safety boundaries** (insufficiently explicit for real-world coaching contexts)
6. **Monetization strategy alignment** (paywall exists, but no clear “advanced portal” concept)

---

## What Already Aligns Well

### 1) Tight coach scope
The app limits coaching to Focus, Decision, and Reflection, which matches the brief’s guidance to avoid mode sprawl and maintain clarity.

### 2) Immediate conversation start
Users can move from onboarding into active coaching quickly, preserving the “moment of stuckness” value proposition.

### 3) Opinionated coaching constitution
The prompt architecture already enforces concise, direct, non-hype coaching behavior.

### 4) Monetization foundation
The app has a free-to-paid structure with daily limits and unlockable personalization features.

These are strong foundations worth preserving.

---

## Core Gaps vs. the 2026 Brief

## A) Product Positioning Gap: “AI chat app” vs “intentional coaching companion”

### What’s missing
The current product language and flow mostly frame value as chat access + features (free vs pro), not as a guided transformation loop (clarity -> decision -> action -> reflection).

### Why this matters
Simon’s brief emphasizes *human-centered intentionality* and practical progress, not just conversational access. Without a visible progress model, users may perceive interactions as disposable.

### Recommended direction
- Introduce a lightweight “session outcome” object after each chat (priority, decision, or insight).
- Surface this as a timeline of meaningful outcomes, not raw transcripts.
- Reframe product copy around “better thinking and better decisions” rather than “chat limits.”

---

## B) Coaching UX Gap: Calm aesthetic is present, calm interaction model is not complete

### What’s missing
The UI is clean, but coaching interactions still behave like standard messaging:
- no session pacing states,
- no intentional check-in/check-out ritual,
- no explicit transition from insight to action.

### Why this matters
The brief compares desired feel to meditation apps. That implies intentional pacing and emotional ergonomics, not just minimal visual design.

### Recommended direction
- Add session containers (Start -> Clarify -> Close) with subtle state cues.
- End each session with a single “takeaway card” users can save.
- Add optional “2-minute mode” for in-the-moment use.

---

## C) Memory & Context Gap: Context exists, longitudinal intelligence does not

### What’s missing
There is onboarding context and per-coach edits, but no robust memory model for:
- recurring themes,
- past commitments,
- unresolved decisions,
- historical summaries.

### Why this matters
The brief explicitly asks for historic understanding and auto-generated session reports. Without memory continuity, coaching quality plateaus.

### Recommended direction
- Add structured memory layers:
  - **Profile memory** (stable user context)
  - **Session memory** (what happened today)
  - **Trajectory memory** (patterns over weeks)
- Generate a short “session report” after each session and store it.
- Add weekly reflection synthesis (“what keeps recurring”).

---

## D) Outcome Clarity Gap: No explicit “clear takeaways” mechanism

### What’s missing
Conversations conclude in chat bubbles without an explicit artifact the user can review later.

### Why this matters
The brief highlights conversations leading to clear takeaways. The current experience relies on user memory and scrolling.

### Recommended direction
- Auto-create post-session outputs:
  - Focus Coach -> “One priority + first step”
  - Decision Coach -> “Chosen direction + tradeoff accepted”
  - Reflection Coach -> “Key insight + question to carry forward”
- Add pin/share/export options for these outcomes.

---

## E) Accessibility Gap: Friendly enough for builders, still steep for broader audience

### What’s missing
The app is straightforward for existing AI users, but broader users may still lack:
- guardrails for prompting effectively,
- examples by life domain,
- confidence-building scaffolding.

### Why this matters
The brief targets people who are AI-curious but intimidated by technical complexity.

### Recommended direction
- Add starter intents per coach (tap chips like “I can’t prioritize this week”).
- Add coach selection helper (“What are you experiencing?” -> mode recommendation).
- Add plain-language microcopy to reduce ambiguity around what to type.

---

## F) Better Creating Audience Fit Gap: Not enough “intentional tech” signature

### What’s missing
The app has minimalism, but less of the Better Creating signature of practical systems thinking and designed intentionality.

### Why this matters
Audience-product resonance drives trust and adoption. The product should feel like it came from that ecosystem, not a generic AI wrapper.

### Recommended direction
- Tune tone and UI copy around “do more with less” principles.
- Add gentle constraints that reduce option overload.
- Add periodic “intentional reset” prompts tied to priorities and values.

---

## G) Trust, Boundaries, and Safety Gap

### What’s missing
Prompt rules prohibit therapizing, but product-level safeguards are limited:
- no visible boundary statements,
- no crisis routing pattern,
- no clear distinction between coaching and clinical support in UX copy.

### Why this matters
If positioned as coaching, boundaries must be explicit and user-facing, not only hidden in prompts.

### Recommended direction
- Add visible coaching scope statement.
- Add escalation copy/resources for mental health crisis signals.
- Add “not medical/legal/financial advice” handling where relevant.

---

## H) Monetization Strategy Gap: Subscription present, “advanced paid portal” not yet realized

### What’s missing
Current monetization is a standard pro unlock. It does not yet deliver the brief’s strategic idea:
- free trial experience,
- paid advanced instructions,
- external context connectors as premium capability.

### Why this matters
The long-term business model likely depends on differentiated premium intelligence, not just removing limits.

### Recommended direction
- Add tiered value ladder:
  1. Free: core coaches + limited sessions
  2. Plus: unlimited + memory + reports
  3. Advanced Portal: premium coach packs, deeper context integrations
- Build “instruction packs” as configurable premium content (without reusing AgentOS IP).

---

## I) Technical Product Maturity Gap (for production readiness)

### What’s missing
- No evident analytics instrumentation for coaching outcomes and retention loops.
- No transparent reliability UX (e.g., degraded mode behavior beyond generic errors).
- Limited observability around prompt quality drift and session effectiveness.

### Why this matters
To iterate toward product-market fit, you need measurable evidence of improved decisions and sustained usage.

### Recommended direction
- Add event model for coaching funnel and outcome quality.
- Add quality review pipeline for anonymized session output grading.
- Track longitudinal KPIs (return rate, completion of next step, repeat mode usage).

---

## Prioritized 60-Day Gap-Closing Plan

## Phase 1 (Weeks 1-2): Outcome clarity + calm flow
- Add session ending cards with explicit takeaways.
- Introduce “session close” interaction state.
- Reframe key copy to outcome language.

## Phase 2 (Weeks 3-4): Memory and continuity
- Implement session reports and history view.
- Add recurring theme extraction and weekly recap.
- Let users edit core profile context in-app.

## Phase 3 (Weeks 5-6): Accessibility and audience fit
- Add starter intent chips and mode recommendation helper.
- Improve onboarding examples for life domains.
- Tighten Better Creating tone pass across all copy.

## Phase 4 (Weeks 7-8): Monetization and trust hardening
- Add advanced tier concept scaffold.
- Add user-visible coaching boundaries + safety routing.
- Launch instrumentation for activation, retention, and outcome efficacy.

---

## Product Acceptance Criteria for “Brief Alignment”
A future version should be considered aligned when:

1. Users consistently leave sessions with a saved, concrete takeaway.
2. The app demonstrates memory of prior sessions in a useful, non-creepy way.
3. New users can get value without knowing how to “prompt.”
4. The experience feels calm and deliberate, not like a generic chatbot.
5. Premium value is based on deeper coaching capability, not only usage caps.
6. Coaching boundaries and trust policies are visible and understandable in-product.

---

## Final Assessment
Current state: **Strong MVP baseline**
Target brief: **Human-centered coaching product with continuity, outcomes, and accessible intentional UX**

Gap severity: **Medium-high**, but highly addressable. The core architecture is good enough to evolve; the next leap is product intelligence and experience design, not a full rebuild.
