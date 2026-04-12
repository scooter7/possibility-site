# The Possibility: Front-End App Specification

> **Document scope:** Front-end iOS app development only. Marketing automation, backend/API architecture, and infrastructure are covered in separate documents.
>
> **Status:** Internal directive. Not for public distribution.

---

## Table of Contents

1. [Product Vision](#1-product-vision)
2. [The Three Pillars: Release, Align, Become](#2-the-three-pillars)
3. [Content Taxonomy](#3-content-taxonomy)
4. [Content Library & Session Architecture](#4-content-library)
5. [Onboarding Flow](#5-onboarding-flow)
6. [Home Screen & Navigation](#6-home-screen--navigation)
7. [Session Player](#7-session-player)
8. [Jim AI Companion](#8-jim-ai-companion)
9. [14-Day Trial Experience](#9-14-day-trial-experience)
10. [Paywall & Conversion](#10-paywall--conversion)
11. [Free Tier](#11-free-tier)
12. [Streaks, Milestones & Progress](#12-streaks-milestones--progress)
13. [Notifications & Reminders](#13-notifications--reminders)
14. [Sleep Mode](#14-sleep-mode)
15. [Book Companion Integration](#15-book-companion-integration)
16. [Design System](#16-design-system)
17. [Accessibility & Trust Principles](#17-accessibility--trust-principles)
18. [Target Metrics](#18-target-metrics)

---

## 1. Product Vision

The Possibility is a meditation app built around a single thesis: **structure beats content, and a teacher beats a library.**

The industry has $440M+ in funding, 50K+ minutes of content, and 4% twelve-month retention. Users don't leave because the content isn't good enough. They leave because they feel like strangers in the app. No one notices when they stop.

The Possibility solves this with three things no competitor offers together:

1. **A transformation framework** (Release, Align, Become) instead of a content library
2. **A single teacher** (Jim Curtis) whose voice powers every surface of the app
3. **An AI companion** (Jim AI) that remembers, adapts, and coaches across the entire experience

Every screen, every session, every notification exists to serve one question: *"What does this person need next in their transformation?"*

### Core Philosophy

- Volume is not transformation. Curation and progression create commitment.
- Every competitor organizes content around what it *is*. We organize content around what it *does for you*.
- Every session has a human behind it, a framework beneath it, and a journey ahead.
- We convert through completion, not restriction.

### The Three Screens

The entire app experience resolves to three core screens:

| Screen | Purpose | Role |
|--------|---------|------|
| **Home** | Your daily session, your journey | Curated session recommendations based on progression |
| **Jim AI** | Personal coaching, always on | Conversational intelligence, reflection, guidance |
| **Session Player** | Immersive session experience | Full-screen, binaural, haptic-enabled playback |

---

## 2. The Three Pillars

The pillar system is not a content taxonomy. It is a **psychological progression model** where each phase builds on the last, and every session earns the next.

### Release (Phase 1)

> *"Let go of what no longer serves you."*

- **Psychology:** Clear patterns, anxiety, stress, fear, sleep issues. Users surface what they're carrying.
- **Session focus:** Clinical hypnotherapy techniques, body scans, breathwork
- **Topics:** Anxiety, Sleep, Stress, Fear, Letting Go, Grief, Anger
- **Visual identity:** Warm (sunset tonality)
- **Color:** `#E8758A` (rose/pink, for small UI elements only, never card backgrounds)
- **Duration default:** 5 minutes (habit formation; completion over ambition)

### Align (Phase 2)

> *"Reconnect with what matters."*

- **Psychology:** Inward turning after weight lifts. Clarity arrives. Centering energy, building after release.
- **Session focus:** Deep guided meditations, heart coherence, gratitude
- **Topics:** Presence, Clarity, Gratitude, Self-Compassion, Focus, Emotional Balance, Relationships
- **Visual identity:** Cool, centered
- **Color:** `#6366F1` (indigo, for small UI elements only)
- **Duration default:** 10 minutes (doubled after proving completion rate in Release)

### Become (Phase 3)

> *"You are already everything you seek to become."*

- **Psychology:** Identity shift, not endpoint. Integration of previous work. Practice becomes who you are.
- **Session focus:** Visualization, affirmation, manifestation, integration
- **Topics:** Confidence, Manifestation, Energy, Purpose, Abundance, Creativity
- **Visual identity:** Expansive, luminous
- **Color:** `#34D399` (teal green, for small UI elements only)
- **Duration default:** 15 minutes (mastery-ready)

### Pillar Progression Rules

- Users progress Release → Align → Become during the 14-day trial
- Progression is **earned through completion**, not unlocked by time
- If 5 of 6 Release sessions complete, advance to Align
- Jim AI references previous pillar context when coaching in the next phase
- Post-trial subscribers can re-run the full arc or access sessions from any pillar

---

## 3. Content Taxonomy

### Level 1: Pillars (Primary Axis)

The transformation arc. Everything in the app maps to Release, Align, or Become.

### Level 2: Themes (Subcategories Within Each Pillar)

**Release Themes:**
| Theme | Specifics |
|-------|-----------|
| Anxiety & Worry | Racing thoughts, nervous energy, social anxiety |
| Fear | Fear of failure, change, the unknown |
| Pain | Chronic/acute pain, body tension, headaches |
| Stress | Work stress, overwhelm, burnout |
| Sleep | Falling asleep, staying asleep, sleep anxiety, insomnia |
| Grief & Loss | Letting go of people, places, identities |
| Anger & Frustration | Resentment, irritation, rage |

**Align Themes:**
| Theme | Specifics |
|-------|-----------|
| Presence & Mindfulness | Being here now, awareness, attention |
| Gratitude | Appreciation, thankfulness, noticing goodness |
| Self-Compassion | Self-love, inner critic, forgiveness |
| Relationships | Connection, empathy, communication, boundaries |
| Emotional Balance | Mood regulation, emotional intelligence, equanimity |
| Sleep | Evening wind-down, bedtime gratitude, heart coherence |
| Focus & Clarity | Concentration, mental clarity, decision-making |

**Become Themes:**
| Theme | Specifics |
|-------|-----------|
| Confidence | Self-belief, public speaking, imposter syndrome |
| Manifestation | Goal-setting, visualization, intention |
| Energy & Motivation | Morning energy, drive, momentum |
| Purpose | Life direction, meaning, calling |
| Abundance | Prosperity mindset, generosity, receiving |
| Creativity | Inspiration, flow state, creative blocks |
| Sleep | Morning-after recovery, rest as fuel, sleep intention |

### Level 3: Content Types (Orthogonal to Pillars)

These 7 content types rotate to prevent format fatigue. No two consecutive days should repeat the same format.

| Type | Description | Unique to Possibility? |
|------|-------------|----------------------|
| **Guided Meditation** | Teacher-led with narration | No (industry standard) |
| **Hypno-Meditation** | Clinical hypnotherapy blend | **Yes** (Jim's signature) |
| **Breathwork** | Structured breathing patterns (box, 4-7-8, coherence) | No |
| **Visualization** | Guided imagery, mental rehearsal | No |
| **Affirmation** | Positive declarations, identity statements | No |
| **Soundscape** | Ambient audio environments with binaural beats | No |
| **Focus Exercise** | Visual/interactive focus aids (orbit, pendulum, candle) | Partially |

### Level 4: Programs vs. Singles

| Type | Description |
|------|-------------|
| **Programs** | Multi-day structured journeys (14-Day Possibility, Book Companion, post-trial tracks) |
| **Singles** | Standalone sessions for situational use (SOS anxiety, sleep aid, quick focus) |

### Level 5: Metadata Per Session

Every session carries this metadata:

```
- pillar: Release | Align | Become
- theme: [from Level 2 list]
- content_type: [from Level 3 list]
- duration: 3 | 5 | 10 | 15 | 20 | 30 | 45 min
- program_or_single: program | single
- tier: free | premium
- time_of_day: morning | afternoon | evening | sleep
- mood_association: [what emotional need this addresses]
- difficulty: beginner | intermediate | all_levels
- music: with | without
- narrator: jim_curtis
- binaural_beats: delta | theta | alpha | beta | gamma | none
- is_new: boolean
- lifecycle_trigger: [when to surface in user journey]
```

---

## 4. Content Library

### Launch Library: 72 Sessions

| Pillar | Count | Duration Range | Types |
|--------|-------|---------------|-------|
| Release | 20 sessions | 5, 10, 15 min | Guided (8), Body Scan (4), Breathwork (4), Hypno (4) |
| Align | 20 sessions | 5, 10, 15 min | Guided (8), Body Scan (4), Breathwork (4), Hypno (4) |
| Become | 20 sessions | 5, 10, 15 min | Guided (8), Body Scan (4), Breathwork (4), Hypno (4) |
| Sleep Stories | 12 (cross-pillar) | 20-45 min | Narrative stories |

### Session Duration Strategy

| Phase | Default Length | Rationale |
|-------|--------------|-----------|
| Release (Days 1-5) | 5 min | BJ Fogg "Tiny Habits": make it easy enough they can't fail |
| Align (Days 6-10) | 10 min | Doubled after proving completion rate |
| Become (Days 11-14) | 15 min | Mastery-ready; user has earned longer investment |
| Sleep Stories | 20-45 min | 78% of app usage is lying down to sleep |

**Critical research:** Reducing default session length from 12 to 6 minutes cut abandonment by 22%. Never default to sessions longer than 6 minutes in early days.

### Content Delivery Philosophy

- **Curated, not algorithmic.** Every session is recorded by Jim Curtis personally.
- **Original music** composed to match Jim's tonal cadence.
- **Binaural beats** engineered per pillar (delta for sleep/Release, alpha for focus/Align, gamma for activation/Become).
- **No filler, no celebrity guests, no algorithmic variations.**
- This is not a content library. It is a **scored experience.**

### Year 1 Content Roadmap

- **Launch:** 72 sessions
- **Ongoing:** 2-4 new sessions per week
- **Year 1 target:** 152-232 total sessions
- **Post-trial specialized tracks:** Pain, Anxiety, Sleep (deeper dives for subscribers)

---

## 5. Onboarding Flow

### Core Principle

> *"Every screen must earn the right to ask for the next one."*

### Six Design Principles (No Exceptions)

1. **Emotion before information.** First two screens contain zero data collection. They exist only to create a feeling.
2. **Every screen earns the next.** No screen assumes the user will continue. Target >90% screen-to-screen completion.
3. **Stillness is a feature.** 5-second intentional delay on Screen 1. Intentional silence on the processing screen. Silence communicates confidence.
4. **No dark patterns, ever.** Free option presented with same visual dignity as premium. No grayed-out text, no guilt language.
5. **Animation as communication.** Every animation has purpose. Nothing moves without meaning.
6. **Account creation comes last.** 2-3 minutes of emotional investment before email request.

### Three Iron Rules

1. **No notification permissions during onboarding.** Defer until after first completed session.
2. **No health or biometric permissions.** Zero permission requests during onboarding.
3. **First session before home screen.** Users must experience the product before seeing navigation.

### Recommended Flow: Option A (Stillness-First)

**9 screens. Paywall at Step 8.**

| Step | Screen | Purpose | Data Collected |
|------|--------|---------|----------------|
| 1 | **Stillness** | 5-second intentional delay. Abstract/meditative imagery. Zero interaction. | None |
| 2 | **Jim Introduction** | Jim's face and welcome. Brief context about the journey. Warm, direct tone. | None |
| 3 | **Goal** | "What brings you here?" Multiple choice or open input. | Intention/goal |
| 4 | **Experience** | "Have you meditated before?" Beginner/experienced toggle. | Experience level |
| 5 | **Preferences** | Time-of-day preference + duration preference. | Schedule, duration |
| 6 | **Build (Processing)** | Animated sequence showing how answers shape the week. 2-3 second intentional hold. No button immediately. | None |
| 7 | **Reveal** | Personalized summary. "You want clarity. We built your first week in the Align pillar." Shows first 3 session recommendations. | None |
| 8 | **Paywall** | Two options with equal visual dignity: Premium trial + Free/Scholarship path. Jim's photo present. | Pricing choice |
| 9 | **Account Creation** | Email + password only. No phone, no health permissions. | Account info |

### A/B Test Variant: Option E (Hybrid)

**7 screens. Paywall at Step 6.** Combines stillness + Jim + single combined question + processing + reveal + pricing + account. Strongest A/B test candidate against Option A.

### Post-Onboarding Sequence (All Options)

1. **First session plays immediately** (before home screen loads)
2. **Daily reminder prompt** appears after first session completion
3. **Push notification soft-ask** after value delivery (91.1% vs 43.9% opt-in)
4. **Morning anchor** established (sessions framed as "your morning session")

---

## 6. Home Screen & Navigation

### Primary Navigation

The app resolves to three core destinations:

| Tab | Label | Purpose |
|-----|-------|---------|
| 1 | **Home** | Daily session, journey progress, curated recommendations |
| 2 | **Jim AI** | Conversational coaching, reflections, check-ins |
| 3 | **Library** | Browse all content by pillar, type, theme, duration |

### Home Screen Layout

**Top Section:**
- Greeting from Jim (time-of-day aware: "Good morning," "Good evening,")
- Current streak count
- Current pillar badge (Release / Align / Become)

**Primary Card:**
- Today's recommended session (large, prominent)
- Session title, duration, content type, pillar badge
- Single tap to begin

**Secondary Section:**
- "Continue your journey" (next 2-3 sessions in sequence)
- Progress visualization (pillar progression bar)

**Explore Section:**
- Sleep quick-access (prominent after 9pm)
- Quick sessions (5 min or less)
- Recently played

### Content Browsing (Library Tab)

**Browse by Pillar:**
- Three horizontal sections: Release, Align, Become
- Each shows curated sessions within that pillar
- Pillar color accent on section headers (small indicators only, never card backgrounds)

**Browse by Type:**
- Filter: Guided, Hypno-Meditation, Breathwork, Visualization, Affirmation, Soundscape, Focus
- Cross-pillar results

**Browse by Theme:**
- Emotional need categories (Anxiety, Sleep, Focus, Confidence, etc.)
- Maps to Level 2 taxonomy

**Filters:**
- Duration (5, 10, 15, 20+ min)
- New content flag
- Free vs. Premium indicator

### Recommendation Logic

Sessions surface based on this priority stack:

1. **Lifecycle stage** (which pillar phase the user is in)
2. **Time of day** (morning = Become/energy, afternoon = Align/focus, evening = Release/wind-down)
3. **User's stated goal** (from onboarding)
4. **Content type variety** (rotate to prevent plateau; no consecutive same-type)
5. **Session history** (don't repeat recent sessions)
6. **Completion patterns** (gauge difficulty escalation readiness)
7. **Mood association** (match emotional need)

### Personalization Pacing

- **Days 1-5:** Show 1 option per day (Release phase, no choice paralysis)
- **Days 6-10:** Show 2-3 options (Align phase, earned variety)
- **Days 11+:** Show fuller variety (Become phase, subscriber library)
- **Never** show the entire library at once

---

## 7. Session Player

### Full-Screen Immersive Experience

The session player is the heart of the app. When a session begins, the entire screen transforms.

**Player Elements:**
- Full-bleed background (cinematic gradient or nature imagery, pillar-themed)
- Session title and pillar badge
- Play/pause control (large, centered)
- Progress bar (minimal, elegant)
- Duration remaining
- Volume control
- Close/minimize button

**Audio Features:**
- Binaural beats layered with Jim's voice (frequency mapped to pillar)
- Original music scored to match tonal cadence
- Background ambient option (nature sounds, rain, silence)

**Haptic Feedback:**
- Tuned to emotional weight of the session
- Subtle pulses at breathing cues
- Celebration haptic at session completion

**Session Completion:**
- Gentle fade-out (no abrupt stop)
- Completion celebration (subtle animation, not aggressive)
- Transition to Jim AI reflection (see Section 8)

### Post-Session Flow

After every session completion:
1. Brief pause (2-3 seconds of stillness)
2. Jim AI reflection prompt appears: *"How did that feel?"* or *"What came up for you?"*
3. User can respond (text or skip)
4. Jim AI processes response, offers brief coaching reflection
5. Return to Home screen with updated progress

---

## 8. Jim AI Companion

### What Jim AI Is

Jim AI is a conversational coaching companion that powers the entire app experience. It is not a chatbot siloed in a chat tab. It is the intelligence layer behind every notification, every recommendation, every email, and every post-session reflection.

### What Jim AI Knows

| Data Type | Source | Purpose |
|-----------|--------|---------|
| Session completions | App usage | Progression tracking |
| Session preferences | Usage patterns | Content recommendations |
| Emotional state | Post-session reflections | Coaching personalization |
| Stated goals | Onboarding answers | Journey framing |
| Time-of-day patterns | Usage data | Notification timing |
| Streak data | Completion records | Motivation coaching |
| Pillar progress | Journey state | Phase transition coaching |
| Conversational history | Jim AI interactions | Cumulative context |

### Three-Phase Rollout

**Phase 1: Reflection Partner (Launch MVP)**
- Post-session micro-interaction: *"How did that feel?"* + *"What came up for you?"*
- Captures emotional/cognitive state immediately after meditation
- Builds data foundation for behavior patterns
- Available in Jim AI tab for freeform conversation

**Phase 2: Proactive Check-Ins (6-12 weeks post-launch)**
- Mood pattern recognition based on Phase 1 data
- Scheduled check-in messages triggered by patterns
- Example: *"You tend to practice better in mornings. Want to lock in 7am?"*
- 3+ day inactivity detection triggers personalized re-engagement

**Phase 3: Full Intelligence Loop (3+ months post-launch)**
- Powers entire notification system
- Powers all email sequences (Jim's voice, not generic marketing)
- Powers recommendation engine
- Predicts churn, adapts session sequencing
- References early conversations in later sessions: *"You mentioned sleep back in your first week. Let's revisit that."*

### Privacy Model

- On-device processing via SwiftData + Core ML where possible
- Conversational data stays private to the user
- No data sharing, no ad targeting, no third-party analytics on personal reflections

### Key Differentiator

Every competitor's AI (Headspace Ebb, Calm's Amazon Personalize) is reactive and siloed. Jim AI is **proactive and integrated across every surface.** It closes the loop: insight from reflection → action in recommendation → follow-up in coaching.

---

## 9. 14-Day Trial Experience

### Trial Model: Reverse Trial (No Credit Card Required)

Full access to everything for 14 days. Then soft-land into the free tier. No content is visible-but-locked during trial. No frustration gating.

### The Complete 14-Day Arc

#### Release Phase: Days 1-5

> *"What are you carrying?"*

| Day | Session | Notes |
|-----|---------|-------|
| 1 | First hypno-meditation | Jim asks opening question: "What are you carrying?" Jim AI personalizes from Day 1. |
| 2 | Release guided meditation | 5 min. References Day 1. |
| 3 | Release breathwork | 5 min. Builds on previous sessions. |
| 4 | Release body scan | 5 min. Jim AI check-in. |
| 5 | Release integration | 5 min. Completes Release if 5/6 sessions done. |

**Touchpoints:**
- Day 0: Welcome email from Jim
- Day 2: First session reminder (push)
- Day 3: Post-session reflection (email)
- Day 4: Jim AI check-in (in-app)

#### Align Phase: Days 6-10

> *"The weight lifts. The centering begins."*

| Day | Session | Notes |
|-----|---------|-------|
| 6 | Align guided meditation | 10 min. Pillar shift celebrated visually. Jim sends personal message. |
| 7 | Align breathwork | 10 min. Jim AI remembers Release context. |
| 8 | Align sleep story | Push notification permission soft-ask (after value). |
| 9 | Align visualization | 10 min. Cumulative intelligence deepens. |
| 10 | Align integration | 10 min. Day 10 = 80% probability of 30-day retention. |

**Touchpoints:**
- Day 6: Pillar shift celebration email: *"Release is complete. Welcome to Align."*
- Day 8: Push permission ask (+157% opt-in uplift vs. asking at install)

#### Become Phase: Days 11-13

> *"Visualization. Possibility. Integration."*

| Day | Session | Notes |
|-----|---------|-------|
| 11 | Become visualization | 15 min. 10-day streak = 80% probability of 30-day retention. Celebration. |
| 12 | Become affirmation | 15 min. Sessions build on days of personal context. |
| 13 | Become integration | 15 min. Transparent preview: what you've built, what's next, free vs. paid. |

**Touchpoints:**
- Day 10: Pillar shift to Become (email)
- Day 11: Streak celebration (email)
- Day 13: Transparent preview (email, no urgency, no guilt)

#### Day 14: The Question

> *"Do you want to continue becoming?"*

No hard sell. No countdown timer. Just a single question.

**Achievement-based conversion** (not expiration-based):
- Jim celebrates with actual user data: mood trend visualization, sessions completed count, longest streak, full pillar journey summary
- Frame: *"Here is what you built, and here is what is next."*
- NOT: *"Your trial expires today."*
- Achievement-based triggers convert **258% higher** than expiration-based triggers.

### Bifurcated Engagement Tracks

**Active User Track** (completed 1+ sessions):
- Post-session reflections from Jim AI
- Content recommendations based on progress
- Pillar transition celebrations
- Achievement-based conversion at Day 14

**Inactive User Track** (no session after Day 1):
- Gentle nudges: *"No pressure, but Day 1 is waiting."*
- Quick-win offers: 5-min Welcome session
- Empathetic check-ins from Jim AI
- Never guilt. Never urgency.

---

## 10. Paywall & Conversion

### Pricing Tiers

| Tier | Price | Positioning |
|------|-------|-------------|
| **Monthly** | $14.99/mo | No commitment, flexible |
| **Annual (Featured)** | $99.99/yr | "$8.33/mo. Two months free." Highlighted with teal accent. |
| **Founding Member** | $79.99/yr | Launch only, first year. Early adopter reward. |

### Paywall Screen Design

**Elements:**
- Jim's photo (human connection, not cold commerce)
- Visible trial countdown (transparency)
- Annual price shown first; monthly available on tap
- *"Can't afford this?"* scholarship link on every paywall (dignity over conversion)
- Both free and paid paths trigger celebration animation

**What the paywall is NOT:**
- No countdown timers
- No "last chance" language
- No auto-charging without warning
- No hidden cancel buttons
- No grayed-out free option
- No "are you sure?" guilt screens

### Pre-Charge Safeguards

- 48-hour charge warning notification before any billing
- 24-hour reminder email
- One-tap cancellation (no phone call, no guilt screens, no surveys blocking cancel)
- Refund window honored without friction

### Scholarship Model (Waking Up-Inspired)

- Anyone who requests free access receives it. No questions asked.
- Link visible on every paywall surface.
- Removes pricing objection entirely.
- Builds word-of-mouth and trust.

### Conversion Timing

- **Day 14:** Primary conversion moment (achievement-based)
- **Day 30:** Personalized progress summary for non-converters
- **Day 45:** First gentle pricing mention
- **Day 60:** Social proof + new content highlight
- **Day 90:** Final outreach. After this, stop selling entirely.

**Strategic principle:** *"The conversion driver is not frustration. It is desire."* No competitor stops selling. That's exactly why stopping works.

---

## 11. Free Tier

### What's Free Forever (After Trial)

| Feature | Details |
|---------|---------|
| **Guided sessions** | 1-2 per pillar (curated, not random). ~17 sessions total (28% of library). |
| **Daily quote/micro-reflection** | Jim's voice every day. The habit continues. |
| **Basic session history** | Track what you've done. |
| **Jim AI** | 3 messages per day (enough to maintain relationship). |
| **Streak tracking** | Keep the habit visible. |

### What's Premium Only

| Feature | Details |
|---------|---------|
| **Full session library** | All sessions across all pillars |
| **All hypno-meditations** | Jim's 9 signature clinical sessions |
| **Unlimited Jim AI** | Full conversational coaching |
| **Intelligence loop** | Behavior-driven recommendations, emails, push |
| **Release/Align/Become engine** | Unlimited re-runs of full arc |
| **Post-trial specialized tracks** | Pain, Anxiety, Sleep deep-dives |
| **Advanced progress analytics** | Detailed journey visualization |

### Free Tier Philosophy

- Free users should still feel Jim's voice daily. That IS the habit.
- The free tier is the long game, not a punishment for not paying.
- 50% of eventual conversions happen AFTER the formal trial ends.
- Never gate basic meditation entirely (Headspace tried; 1.4 Trustpilot, "bait and switch" complaints).
- No visible-but-locked content. If something is free, it's fully accessible. If it's premium, it doesn't appear in the free browse.

---

## 12. Streaks, Milestones & Progress

### Streak System

- **Visible counter** on Home screen (prominent, teal accent)
- **Daily return incentive:** Counter increments with each day of completed session
- **Streak freeze:** Consider offering 1 free freeze per week (prevents frustration without removing incentive)

### Milestone Celebrations

| Milestone | Celebration |
|-----------|-------------|
| **Day 3 streak** | Particle burst animation + milestone badge |
| **Day 7 streak** | Confetti/wave animation + "Week 1" badge + share prompt + Jim congratulatory message |
| **Pillar completion** | Pillar badge unlock + Jim reflection on journey through that phase |
| **14-day completion** | Full journey summary with stats, mood trends, achievements |
| **30-day streak** | Major celebration + progress visualization |

### Animation Specs

- **Badge reveal:** Scale 0.6 → 1.0, easing `cubic-bezier(0.34, 1.56, 0.64, 1)`
- **Particle burst:** Teal-tinted particles, 0.8s duration, fade out
- **Confetti:** Multi-color (pillar colors), gravity fall, 1.5s duration
- **Progress bar fill:** Animated, easing `cubic-bezier(0.22, 1, 0.36, 1)` (the --zen curve)

### Streak Break Handling

- If user breaks streak on Day 3+, Jim AI sends personalized check-in
- Position as "continuation" not "failure"
- No shaming language
- Offer quick 3-minute session to restart

### Progress Visualization

- **Pillar progression bar:** Linear bar showing Release → Align → Become with current position
- **Session count:** Total completed, broken down by type
- **Streak counter:** Current + personal best
- **Time invested:** Total minutes of practice
- **Journey timeline:** Visual map of the sessions completed, milestones hit

---

## 13. Notifications & Reminders

### Permission Request Timing

- **Never during onboarding.**
- Ask after first completed session (Day 1-2).
- Soft-ask format: *"Want daily reminders to keep your streak?"*
- 91.1% opt-in vs. 43.9% baseline when timed after value delivery.

### Notification Types

| Type | Content | Frequency |
|------|---------|-----------|
| **Audio Clip** | 30-60 sec Jim audio (actual content, not reminder) | Daily |
| **Daily Reminder** | Time-optimized link to today's session | Daily at user's set time |
| **Milestone Alert** | Streak reached, badge unlocked | Event-based |
| **Re-engagement Nudge** | Jim AI personalized check-in | After 3+ days inactive |
| **Pillar Transition** | Celebration of phase completion | Event-based |
| **Charge Warning** | 48-hour and 24-hour billing notice | Pre-charge |

### Notification Principles

- **Maximum 1 push per day** (except Days 12-13 trial charge warnings)
- **Notifications ARE the value.** Jim's daily quote requires no clickthrough to get value.
- **ML-powered send-time optimization** per user
- **Granular opt-in:** Users choose categories (morning quote, session reminder, weekly reflection)
- **Never:** "Don't forget to meditate!" or generic urgency language

### Morning Anchor Strategy

- Default recommendation: 7am practice time
- User sets preferred time during onboarding or first-use
- Push notification fires at exact user time (not generic "sometime today")
- Morning meditation is significantly associated with 3x higher long-term retention
- Sessions framed as "your morning session"

---

## 14. Sleep Mode

### Sleep as Cross-Cutting Mode (Not a Fourth Pillar)

Sleep is not its own pillar. It draws from all three pillars based on the user's sleep need:

| Sleep Need | Pillar Source | Why |
|------------|--------------|-----|
| Can't fall asleep (racing mind) | Release | Letting go of the day |
| Can't fall asleep (anxiety) | Release | Releasing fear, worry, tension |
| Can't fall asleep (physical tension) | Release | Body scan, releasing stored tension |
| Waking at 3am | Release | Letting go of activation |
| Better sleep quality | Align | Heart coherence, circadian alignment |
| Evening wind-down ritual | Align | Centering, gratitude, self-compassion |
| Morning after poor sleep | Become | Energy, intention, resilience |
| Sleep as transformation fuel | Become | Rest as fuel for becoming |

### Sleep Section UI

- **Prominent entry point** on Home screen (not a pillar tab, but easy to find)
- **Auto-activates after 9pm** (Sleep section surfaces automatically in recommendations)
- **Each sleep session still belongs to a pillar** (pillar badge visible)
- **Sleep Stories** featured prominently (12 at launch, 20-45 min each)
- **Soundscapes** available as background (nature, rain, binaural)
- **SOS content** for mid-night wake-ups (3-5 min, calming, Release-pillar)

### Sleep Player Modifications

- **Dimmed UI** (lower brightness, darker backgrounds)
- **Auto-stop timer** (session fades to silence after completion)
- **No post-session Jim AI prompt** (user is falling asleep)
- **Morning follow-up** instead (Jim AI checks in next morning: *"How did you sleep?"*)

---

## 15. Book Companion Integration

### QR Code Integration

- Physical book contains QR codes linking to **specific companion sessions** (not generic landing page)
- Each QR maps a chapter to a relevant meditation/exercise in the app

### Book Reader Onboarding Path

- Dedicated onboarding flow for book readers
- Skips basics (assumes context from the book)
- Goes straight to companion content
- Must be designed **before manuscript is finalized** (print window closes integration window permanently)

### Book Companion Content Tier

- Specific sessions designed as chapter companions
- Accessible to book readers (potentially free or with book purchase code)
- Extends the book experience into daily practice

---

## 16. Design System

### Color Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--bg-light` | `#FAF8F5` | Light mode background |
| `--bg-dark` | `#080A0F` | Dark mode background |
| `--teal` | `#2E9E9E` | Primary brand color |
| `--teal-bright` | `#33A3A3` | Interactive elements, CTAs |
| `--release` | `#E8758A` | Release pillar accent (text/small indicators ONLY) |
| `--align` | `#6366F1` | Align pillar accent (text/small indicators ONLY) |
| `--become` | `#34D399` | Become pillar accent (text/small indicators ONLY) |
| `--release-soft` | `rgba(232,117,138,0.12)` | Release subtle background |
| `--align-soft` | `rgba(99,102,241,0.12)` | Align subtle background |
| `--become-soft` | `rgba(52,211,153,0.12)` | Become subtle background |
| `--neutral-card` | `rgba(26,20,16,0.025)` | Light section card background |
| `--neutral-card-dark` | `rgba(255,255,255,0.03)` | Dark section card background |
| `--neutral-divider` | `rgba(26,20,16,0.08)` | Section dividers |

### Typography

- System font stack with serif accents for headings
- Jim's voice tone consistent across all text surfaces

### Animation Curves

| Curve | Value | Usage |
|-------|-------|-------|
| `--zen` | `cubic-bezier(0.22, 1, 0.36, 1)` | Primary easing. Snappy, organic. |
| `--bounce` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Milestone/badge celebrations |

### Touch Targets

- **44px minimum** on all interactive elements (Apple HIG)
- No exceptions for "aesthetics"

### Responsive Breakpoints (If iPad Support)

- 1024px, 900px, 768px, 480px, 375px, 320px

### Card Design Rules

- **No colored accent borders** (no `border-top/left/right/bottom` with pillar colors)
- **No pink/red/release-colored card backgrounds** (Release color is for text labels and tiny indicators only)
- **No colored gradient dividers** (use `rgba(26,20,16,0.08)` for all dividers)
- **Neutral card backgrounds only:** `rgba(26,20,16,0.025)` for light, `rgba(255,255,255,0.03)` for dark

---

## 17. Accessibility & Trust Principles

### Trust Architecture

| Principle | Implementation |
|-----------|---------------|
| **Visible trial countdown** | Always show days remaining. Transparency, not dark pattern. |
| **48-hour charge warning** | Proactive notification before any billing. |
| **"Can't afford this?" link** | On every paywall. Dignity over conversion. |
| **Jim's photo on paywall** | Human connection, not cold commerce. |
| **Equal visual dignity** | Free path styled identically to premium path. |
| **One-tap cancellation** | No phone call, no surveys blocking cancel, no guilt screens. |
| **No auto-upgrade** | Never move free users to paid without explicit consent. |
| **No grandfathered price changes** | Existing subscribers keep their price. |

### What We Will Never Do

Based on competitor failures and FTC enforcement:

- Hidden charges or auto-renewal traps (Calm: class action, F rating BBB)
- Bait-and-switch content removal (Headspace: 1.4 Trustpilot)
- Keystroke tracking or third-party analytics on personal data (Calm: Twilio SDK, VPPA class action)
- Countdown timers or "last chance" urgency language
- Different prices for different users without transparency
- Revoking plans mid-term (Endel: trust collapse)

### Accessibility

- VoiceOver support on all screens
- Dynamic Type support
- High contrast mode
- Reduced motion option (respects iOS settings)
- Audio descriptions for visual meditation cues
- Haptic alternatives for audio cues

---

## 18. Target Metrics

### Acquisition

| Metric | Target | Industry Baseline |
|--------|--------|-------------------|
| Onboarding completion rate | >70% | Calm: ~60%, Open: <50% |
| Screen-to-screen completion | >90% | Varies |
| First session completion | >80% | ~50% industry |
| Trial start rate | 10-15% | Industry median: 7% |

### Retention

| Metric | Target | Industry Baseline |
|--------|--------|-------------------|
| Day 1 retention | >40% | 27% median |
| Day 1 → Day 2 retention | >50% | Calm: ~20% |
| Day 7 retention | >30% | 12% median |
| Day 30 retention | >20% | 4.7% median |
| 12-month retention | >50% | 4% median, 92% Waking Up |

### Conversion

| Metric | Target | Industry Baseline |
|--------|--------|-------------------|
| Trial-to-paid conversion | 45%+ | 27% (7-day), 39.9% median |
| Post-trial conversion (after Day 14) | +50% of total | Unique to this model |
| Push notification opt-in | >91% | 43.9% baseline |

### Engagement

| Metric | Target | Why |
|--------|--------|-----|
| Sessions per user (lifetime) | >10 | Industry average: 4.3 |
| Content type diversity | 4+ types per user | JMIR: variety = better outcomes |
| Morning session percentage | >50% | 3x retention correlation |
| Jim AI interaction rate | >60% post-session | Builds intelligence loop |
| Streak 7-day rate | >40% | 2.3x daily engagement |

---

## Open Decisions (Require Resolution Before Engineering)

1. **Jim AI scope at launch:** Reflection partner only (Phase 1)? Or include proactive check-ins (Phase 2)?
2. **Book companion timeline:** When does the manuscript finalize? QR integration must be designed before print window closes.
3. **Beta strategy:** 200-500 users from Jim's audience. What's the feedback loop mechanism?
4. **iPad support:** At launch or post-launch?
5. **Offline support:** Download sessions for offline playback? If so, what's the storage/DRM model?
6. **Sleep timer:** Auto-stop after session, or configurable background ambient continuation?
7. **Social/community features:** Any sharing, community, or friend mechanics at launch?
8. **HealthKit integration:** Mindful minutes tracking? Sleep data sync? Or stay fully independent?

---

*This document synthesizes findings from The Thesis, Strategy Briefing, Content Architecture, Onboarding Teardown, Free Trial Flow, Retention Playbook, Pricing Strategy, Variance Analysis, Executive Summary, and Taxonomy Research.*
