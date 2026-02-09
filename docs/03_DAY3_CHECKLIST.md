# Day 3 Checklist — App Skeleton

## 0️⃣ Pre-flight
- [x] Opened 03_EXECUTION_PLAN.txt.
- [x] Re-read Day 3 — Step 1: Routing & Monetization Logic.
- [x] Confirmed: no logic allowed today.
- [x] Confirmed: static only.

## 1️⃣ Project / App Shell
- [x] Expo app boots cleanly.
- [x] SafeArea handling applied.
- [x] Single root navigator (Stack) in place.
- [ ] Auth (must NOT exist).
- [ ] Persistence (must NOT exist).
- [ ] State management beyond navigation (must NOT exist).
- [ ] Theming systems (must NOT exist).

## 2️⃣ Navigation Structure (STATIC)
- [x] Routes: Welcome.
- [x] Routes: Home.
- [x] Routes: Chat.
- [x] Routes: Paywall.
- [x] App start → Welcome.
- [x] Welcome → Home.
- [x] Home → Chat (coach type passed as param).
- [x] Chat → Paywall (manual navigation).
- [ ] Conditional routing (must NOT exist).
- [ ] Auto-routing between coaches (must NOT exist).
- [ ] Message limits (must NOT exist).
- [ ] Paywall triggers (must NOT exist).

## 3️⃣ Welcome Screen (STATIC)
- [x] App one-liner text.
- [x] One text input (context).
- [x] “Skip for now” action → Home.
- [ ] Saving context (must NOT exist).
- [ ] Validation (must NOT exist).
- [ ] Required fields (must NOT exist).

## 4️⃣ Home Screen (STATIC, CRITICAL)
- [x] Title: “What do you need right now?”
- [x] 3 tappable cards: Focus Coach, Decision Coach, Reflection Coach.
- [x] Each card navigates to Chat.
- [x] Each card passes coach identifier (string).
- [x] All 3 cards fit on screen without scrolling.
- [ ] Coach descriptions changing (must NOT exist).
- [ ] Dynamic layouts (must NOT exist).
- [ ] Animations (must NOT exist).
- [ ] Auto-selection logic (must NOT exist).

## 5️⃣ Chat Screen (STATIC SHELL)
- [x] Header showing coach name.
- [x] Messages area (static placeholder messages).
- [x] Input field.
- [x] Send button (does nothing).
- [ ] AI calls (must NOT exist).
- [ ] Message sending (must NOT exist).
- [ ] Message limits (must NOT exist).
- [ ] Loading states (must NOT exist).
- [ ] Persistence (must NOT exist).
- [ ] Opening messages (must NOT exist).

## 6️⃣ Paywall Screen (STATIC)
- [x] Headline: “Unlimited calm, when you need it.”
- [x] One short supporting line.
- [x] One primary action button.
- [x] Restore link (non-functional).
- [ ] RevenueCat (must NOT exist).
- [ ] Pricing logic (must NOT exist).
- [ ] Purchase handling (must NOT exist).

## 7️⃣ What MUST NOT exist yet (critical)
- [ ] OpenAI.
- [ ] RevenueCat.
- [ ] Message counting.
- [ ] Daily limits.
- [ ] Auto-routing.
- [ ] Coach editing.
- [ ] Persistence.
- [ ] Clever shortcuts.

## 8️⃣ Navigation Sanity Pass
- [x] Welcome → Home.
- [x] Home → Chat (each coach).
- [x] Chat → Paywall (manual).
- [x] Back navigation works.
- [x] No dead ends.

## 9️⃣ End-of-Day Lock
- [x] App is fully clickable.
- [x] No crashes.
- [x] No missing screens.
- [x] No extra features.
- [x] You feel slightly bored.

## 🧠 Final Self-Question
- [x] “Did I express behavior — or invent it?”
