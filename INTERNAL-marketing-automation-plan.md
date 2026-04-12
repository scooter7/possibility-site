# INTERNAL: Marketing Automation Implementation Plan
## The Possibility App: Jim Curtis Meditation + AI Platform
### CONFIDENTIAL. Do not share with client.

---

## Stack

| Layer | Technology | Purpose |
|---|---|---|
| Automation Platform | **Braze** | Campaign orchestration, push/email/in-app/SMS delivery, segmentation, A/B testing, frequency capping, quiet hours |
| Intelligence Layer | **Jim AI** | Conversational AI that captures structured user data (mood, goals, pillar affinity, breakthroughs). Powers all personalization signals |
| Database | **Supabase (PostgreSQL)** | User profiles, segment labels, session history, mood logs, streak data, campaign attribution |
| Data Pipeline | **Supabase → Braze CDI** | Real-time sync of user events and segment transitions to Braze for trigger-based campaigns |
| Email Routing | **Braze + Stripe** | Non-transactional emails via Braze. Discount offers route through Stripe (bypass Apple's 30% IAP cut) |
| Admin CMS | **Custom (Supabase)** | Campaign builder with JSON rule schemas, template variables, A/B test configuration |
| Analytics | **Supabase + Braze** | Attribution tracking via `campaign_id` on every notification. Success metrics computed from event data |
| Hosting/Deployment | **Vercel** | Serverless functions for API endpoints, webhook handlers |

---

## Pricing Structure (Market-Validated)

| Component | Price | Scope |
|---|---|---|
| Strategy + Architecture | **$30,000** (one-time) | Complete automation blueprint, all lifecycle campaigns, behavioral triggers, intelligence layer design, competitive analysis, suppression rules, A/B testing framework, 4-phase implementation roadmap, full technical documentation (database schema, API contracts, deployment runbook) |
| Implementation | **$7,000/mo** (Phases 1-3, 12 weeks min) | Campaign buildout in Braze, template creation, behavioral trigger configuration, A/B test design, performance monitoring |
| Optimization | **$3,500/mo** (post-launch, ongoing) | Campaign performance analysis, A/B test iteration, seasonal campaign creation, long-term relationship layer management, quarterly strategy reviews, Phase 4 intelligence features |
| **Year 1 Total** | **$82,500** | Strategy ($30K) + Implementation ($7K x 3 months) + Optimization ($3.5K x 9 months) |

### Market Validation Sources
- Braze implementation partners charge $25K-$100K+ for setup alone
- Growth marketing agencies charge $7,500-$15,000/mo retainers for Series A-C startups
- Lifecycle marketing specialists (Phiture, Propel) charge $8K-$20K/mo for full-service mobile app CRM
- Fractional CMOs charge $5K-$15K/mo for strategy alone (no execution)
- Our rate is mid-market. Not discount, not premium. Defensible at every line item.

### ROI Math
- At $99/yr per subscriber, system needs to retain **834 additional users** to break even
- With 50,000 projected Year 1 downloads and a 4x retention multiplier over industry average, ROI is not a question
- Industry benchmark: meditation apps retain 3-5% at 12 months. Our target: 12-20% with this system

---

## 1. Notification Philosophy

Inspired by Waking Up's insight: "Notifications ARE the practice, not reminders to practice."

**Core principles:**
- Every notification delivers standalone value (quote, insight, breath prompt). Not just "come back"
- Users opt in per notification type (granular control = higher opt-in rate, lower opt-out)
- Quiet hours are sacred (user-configurable, default 10 PM to 7 AM local time)
- Frequency cap: max 3 push/day, max 1 email/day (hard limit)
- Every notification includes `campaign_id` for attribution tracking
- Smart timing: send at each user's peak engagement hour

---

## 2. Notification Types (User Opt-In)

Users control each type independently from Settings > Notifications.

| Type | Channel | Default | Description |
|---|---|---|---|
| Daily Practice | Push | On | Session reminder at user's preferred time |
| Daily Wisdom | Push + In-App | On | Jim's daily quote (standalone value, no CTA required) |
| Streak Nudge | Push | On | Streak milestone celebrations and gentle "keep going" prompts |
| Program Progress | Push | On | Next session in program, pillar transitions, completion |
| New Content | Push | Off | New sessions, programs, or features added |
| Jim's Insights | Push | Off | Periodic wisdom from Jim (1-2x per week) |
| Weekly Reflection | Push + Email | On | Weekly practice summary with mood trends |
| Milestone Celebrations | Push | On | Achievements, badges, journey milestones |

**Non-configurable (transactional):**
- Subscription expiry warnings
- Account security
- App update prompts

---

## 3. Lifecycle Campaigns

### 3.1 Onboarding Sequence (Days 1-15)

Trigger: `onboarding_completed` event. Goal: reach "activated" status (3+ sessions in first 7 days).

| Day | Type | Channel | Content | Condition |
|---|---|---|---|---|
| 1 | Welcome | Push | "Welcome to The Possibility. Your first session with Jim is ready." Deep links to Welcome Session (601) | Always |
| 1 | Welcome | Email | Welcome email with Jim's personal message, quick-start guide, 3 recommended first sessions | Always |
| 2 | Practice | Push | "Day 2 of your journey. [Personalized session based on onboarding answers]." | If no session on Day 1 |
| 2 | Wisdom | Push | Jim's daily quote (standalone, no CTA) | Always |
| 3 | Nudge | Push | "You've started something powerful. Ready for session 2?" | If < 2 sessions completed |
| 4 | Feature | Push | "Meet Jim AI. Your personal guide. Ask anything about your practice." | If `ai_chat_opened` not fired |
| 5 | Practice | Push | Session recommendation based on mood data or pillar affinity (if available) | If < 3 sessions completed |
| 6 | Milestone | Push | "You're building a real practice. 5 days in." | If 3+ sessions completed |
| 6 | Recovery | Push | "No pressure. Jim recorded a 5-minute session just for days like this." | If 0 sessions completed |
| 8 | Weekly | Email | First week summary: sessions completed, total time, mood trends (if logged), next steps | Always |
| 8 | Program | Push | "Ready for a deeper journey? The 14-Day Possibility Program starts here." | If not started program |
| 11 | Feature | Push | "Explore breathing exercises. 4-7-8 is a great place to start." | If `breathing_started` not fired |
| 15 | Milestone | Email | Two-week summary. If activated: celebrate. If not: gentle "Jim's still here" message with curated 3-session starter pack | Always |

**Suppression rules:**
- Do not send "come back" nudges on days when user has already opened the app
- Suppress feature discovery pushes if user already used that feature
- If user completes 5+ sessions in first 3 days, skip recovery messages entirely

### 3.2 Daily Engagement (Post-Onboarding, Ongoing)

Trigger: daily cron job. Applies to all users past Day 15 who are not in churn flows.

| Time | Type | Content | Personalization |
|---|---|---|---|
| User's peak hour | Practice | "Your [pillar] session is ready: [session_title]" | Session chosen by recommendation engine: pillar affinity + time preference + completion history. Never recommend a session they abandoned in the last 7 days |
| Morning (if opted in) | Wisdom | Jim's daily quote | Rotates through quotes, never repeats within 90 days |

**Personalization signals (from Braze user profile, synced via CDI):**
- Pillar affinity: `pillar_release`, `pillar_align`, `pillar_become`, `pillar_balanced`
- Time preference: `prefers_morning`, `prefers_evening`, `prefers_night`
- Session duration preference: `prefers_short`, `prefers_long`
- Music preference: `music_lover`, `voice_only`
- Current program progress (prioritize next program session if enrolled)
- Mood trend (if mood declining, recommend Release content)

### 3.3 Program Lifecycle

Trigger: program-related events synced to Braze.

| Event | Notification | Channel |
|---|---|---|
| `program_started` | "Day 1 of [program]. Your Release journey begins." | Push |
| `program_day_completed` | "Day [N] complete. [Pillar] progress: [X/Y days]." | Push |
| `program_pillar_transition` | "You've completed the [from] phase. Welcome to [to]." (elevated visual treatment) | Push + In-App |
| No program session in 2 days | "Day [N] of [program] is waiting. Pick up where you left off." | Push |
| No program session in 5 days | "It's okay to pause. When you're ready, Day [N] is here." | Push |
| `program_completed` | "You did it. [Program] complete. Here's what you've accomplished..." | Push + Email |
| `program_completed` + 3 days | "What's next? Explore [recommended program or standalone sessions]." | Push |

### 3.4 Streak Lifecycle

Trigger: streak-related events and daily checks via Braze Connected Content or CDI sync.

| Event | Notification | Channel |
|---|---|---|
| 3-day streak | "3 days in a row. You're building a habit." | Push |
| 7-day streak | "One full week. Your practice is becoming part of you." | Push |
| 14-day streak | "Two weeks strong. Most people never get here." | Push |
| 30-day streak | "30 days. You've transformed your daily rhythm." | Push + In-App celebration |
| 60-day streak | "60 days. This isn't a habit anymore. It's who you are." | Push + Email |
| 100-day streak | "100 days. Jim has a special message for you." (AI-generated personal message from Jim AI) | Push + In-App |
| Streak at risk (no session today, 8 PM local) | "Your [N]-day streak is still alive. Even 5 minutes counts." | Push |
| Streak broken (1 day gap) | "Streaks end. Practice doesn't. Start fresh today." | Push |

**Rules:**
- Streak-at-risk push only fires once per day
- Do not send streak-at-risk if user already completed a session today
- After a streak breaks, suppress streak-related pushes for 3 days (avoid guilt)

---

## 4. Re-Engagement Campaigns

### 4.1 Lapsed User Flow

Trigger: Braze segment transition to `lapsed` (no session in 14-30 days).

| Day Since Last Session | Content | Channel |
|---|---|---|
| 14 | "It's been a little while. Jim has a new [pillar] session that might be just what you need: [title]" | Push |
| 18 | "[Name], your [favorite pillar] practice is waiting. [Personalized recommendation based on history]." | Push |
| 21 | "We miss your presence. Here's what's new since you've been away: [1-2 new additions]" | Email |
| 25 | Jim's Wisdom. Standalone value, no ask. Just a quote that resonates with their pillar. | Push |
| 28 | "Your practice data is safe. Ready to pick back up? Here's a 5-minute session to restart." | Push |

**Personalization:**
- Always reference pillar affinity (from Braze user profile)
- Recommend sessions similar to their most-completed ones
- If they were in a program, reference it: "You were on Day [N] of [program]"
- Never use guilt or negative framing

### 4.2 Churned User Win-Back

Trigger: Braze segment transition to `churned` (no session in 30+ days).

| Day Since Last Session | Content | Channel |
|---|---|---|
| 30 | "It's been a month, [Name]. No guilt. Just possibility. [Session recommendation]." | Push + Email |
| 45 | New content announcement or feature update (if available). Give them a reason to return. | Email |
| 60 | Discount offer: "[X% off first month]." (Only for previously-paying users) | Email |
| 90 | Final touch: Jim's personal quote + "Your account is here whenever you're ready." | Email |

**Rules:**
- Discount offers (Day 60) only go to users who were previously Premium. Never to free users
- **Discounts route through Stripe (not Apple IAP) to avoid 30% cut** (following Calm's strategy)
- After 90-day email, user exits win-back. Transitions to `dormant` segment → Long-Term Relationship Layer (4.3)
- If user returns at any point, immediately exit win-back → `returned` segment flow

### 4.3 Long-Term Relationship Layer (Post Win-Back)

Trigger: user completes 90-day win-back cycle without returning. Segment transitions to `dormant` in Braze. Promotional cadence ends, but the relationship does not.

**Core principle:** No promotional outreach. No discounts. No "come back" language. Only value delivery and genuine life-moment relevance.

| Trigger | Content | Channel | Frequency Cap |
|---|---|---|---|
| Quarterly new content drop | "Jim recorded something new: [session title]. [One sentence about the session's theme]." Only sent when genuinely new content exists. | Email | Max 4x per year |
| Practice anniversary | "[Name], it's been one year since you joined The Possibility. Your data is still here: [X sessions, Y minutes, pillar journey summary]. Whenever you're ready." | Email | 1x per year |
| Seasonal wisdom (New Year) | Jim's New Year reflection. Standalone value. A practice intention prompt, not a product pitch. "What would you like to release this year?" | Email | 1x per year |
| Seasonal wisdom (Mental Health Awareness Month, May) | Jim's reflection on mental health. Links to a free session (no paywall). "This one's for everyone." | Email | 1x per year |
| Jim's book launch or major milestone | Announcement of new book, podcast appearance, or platform milestone. Celebrates Jim, not the app. | Email | As needed, max 2x per year |
| New program launch | "Jim built a new program: [title]. [One sentence]." Only for genuinely new programs, not re-promotions. | Email | Max 2x per year |

**Hard rules:**
- Maximum 1 email per month to dormant users (hard cap). Most months they receive nothing.
- Every email must contain standalone wisdom content. The email itself is the value, not the CTA.
- **No push notifications to dormant users.** Push requires recent app engagement to be respectful.
- No discount offers in long-term layer. Discounts are only in the 60-day win-back window.
- If user opens app at any point, immediately exit dormant → `returned` segment flow (4.4).
- One-click unsubscribe per email type. If user unsubscribes from all, they exit completely.
- Subject lines never use urgency, guilt, or "we miss you" framing.

**Attribution:**
- Every long-term email carries `campaign_id` with `campaign_type=long_term_relationship`
- Track: open rate, `app_opened` within 7 days, `session_started` within 7 days
- Target: 2-5% reactivation rate per touchpoint

### 4.4 Returned User Flow

Trigger: Braze segment transition to `returned` (session after 14+ day gap, from any prior segment including `dormant`).

| Timing | Content | Channel |
|---|---|---|
| On return | "Welcome back. We saved everything. Your favorites, your progress, your data." | In-App banner |
| Return + 1 day | "[Pillar] recommendation based on where they left off. If in program: 'Ready to pick up Day [N]?'" | Push |
| Return + 3 days | "You're back in rhythm. [Celebrate any new milestone]." | Push |

---

## 5. Subscription Lifecycle

### 5.1 Trial Flow

Trigger: `trial_started` event synced to Braze.

| Day | Content | Channel | Condition |
|---|---|---|---|
| 0 | "Your free trial has started. Here's how to get the most out of it: [3 premium features to try]" | Push + Email | Always |
| 3 | "Have you tried [premium feature they haven't used yet]? Unlock it during your trial." | Push | If < 3 premium features used |
| Trial end - 3 days | "Your trial ends in 3 days. Here's what you'll keep and what goes away." | Push + Email | Always |
| Trial end - 1 day | "Last day of your trial. Lock in your rate now." | Push | If not converted |
| Trial expired | "Your trial has ended. You can still access [free features]. Upgrade anytime." | Email | If not converted |
| Trial expired + 7 days | "[Name], Premium members practice [X%] more. Ready to commit?" | Email | If not converted, was active during trial |

### 5.2 Premium Lifecycle

| Event | Content | Channel |
|---|---|---|
| `subscription_started` | "Welcome to Premium. Here's your unlock guide: [top 3 premium-only features]." | Email |
| Renewal - 3 days (first renewal only) | "Your subscription renews in 3 days. Thanks for being part of The Possibility." | Push |
| `subscription_renewed` (month 3) | "3 months of practice. Here's your journey so far: [stats summary]." | Email |
| `subscription_renewed` (month 6) | "6 months. You're in the top [X%] of practitioners. [Extended stats + pillar journey]." | Email |
| `subscription_renewed` (month 12) | "One year of Possibility. Jim has a special message. [AI-generated personal reflection from Jim AI]." | Email + In-App |
| `subscription_canceled` | "We're sorry to see you go. Your access continues until [expiry date]. Feedback? [Link]." | Email |
| Expiry - 1 day | "Your Premium access ends tomorrow. Your downloads and offline content will be removed." | Push |
| Expired | "You're now on the Free plan. Your favorites and progress are saved. Upgrade anytime." | Email |

### 5.3 Book Code Lifecycle

Trigger: `book_code_redeemed` event.

| Timing | Content | Channel |
|---|---|---|
| On redemption | "The Book of Possibility is unlocked. Start with Chapter 1: [session title]." | In-App + Push |
| Day 1 | "Your book journey begins. Here's how Jim designed the companion experience." | Email |
| Every chapter completion | "Chapter [N] complete. [Pillar] insight: [brief reflection prompt]. Next: Chapter [N+1]." | Push |
| Book program complete | "You've completed the full Book of Possibility journey. Ready for the 14-Day Program?" | Push + Email |
| If book owner + free tier, Day 14 | "Book owners who go Premium practice [X%] more. Special offer: [if applicable]." | Email |

---

## 6. Event-Based Campaigns (Behavioral Triggers)

These fire in response to specific user actions via Braze action-based triggers, not on a schedule.

### 6.1 Mood-Based Triggers

| Trigger | Response | Channel |
|---|---|---|
| Pre-meditation mood logged as 1 or 2 (low) | After session: "Checking in. How are you feeling now?" (prompt post-mood log) | In-App |
| 3+ consecutive low moods (1-2) | "We noticed you've been having a tough stretch. Here are sessions specifically for times like this: [Release recommendations]." | Push |
| Mood delta > +2 on a specific session | Mark session as "mood booster" in user's Braze profile. Recommend it again on future low-mood days. | Backend (no notification) |
| No mood logged in 7+ days (was previously logging) | "Your mood check-ins help Jim AI personalize your experience. Log a quick mood?" | Push |

### 6.2 Feature Discovery Triggers

| Trigger | Response | Channel |
|---|---|---|
| 10+ meditation sessions, never tried breathing | "Between meditations, try a breathing exercise. 4-7-8 takes just 2 minutes." | Push |
| 5+ sessions, never used Jim AI | "Jim AI learns your practice. The more you chat, the better your recommendations." | Push |
| Premium user, 0 downloads | "Going offline? Download your favorite sessions for travel, commute, or airplane mode." | Push |
| 3+ shares, not a `social_sharer` yet | "You've been sharing! Know someone who'd love The Possibility? [Referral prompt]." | Push |
| First favorite added | "Great pick. Check your Favorites in the Media tab." | In-App toast |

### 6.3 Subscription Conversion Triggers

| Trigger | Response | Channel |
|---|---|---|
| `paywall_viewed` 3+ times without purchase | Personalized email: "Here's what Premium unlocks for your [pillar] practice: [specific sessions they've been blocked from]." | Email |
| `free_engaged` segment (3+ sessions/week on free) | "You're practicing like a Premium member. Unlock the full library." | Push |
| Completed 3+ free sessions, tried AI, hit limit | "You've used your 3 daily AI messages. Premium gives you unlimited Jim AI access." | In-App |
| Book owner, not Premium, Day 30+ | "You loved the book journey. The full library has [X] more sessions waiting." | Push |

---

## 7. Email Strategy

### 7.1 Email Types (Braze Campaigns)

| Type | Frequency | Purpose | Sender |
|---|---|---|---|
| Transactional | As needed | Receipts, password reset, account alerts | noreply@thepossibility.app |
| Onboarding | Days 1-15 | Welcome sequence | jim@thepossibility.app |
| Weekly Reflection | Weekly (user's preferred day) | Practice summary + wisdom | jim@thepossibility.app |
| Lifecycle | Event-driven | Trial, subscription, milestones | jim@thepossibility.app |
| Win-back | Cadenced (see Section 4.2) | Re-engagement | jim@thepossibility.app |
| Announcements | 1-2x per month max | New content, features, app updates (reaches all segments including dormant) | jim@thepossibility.app |

### 7.2 Email Design Principles

- **From Jim**: All non-transactional emails come from jim@ and are written in Jim's voice (warm, direct, possibility-focused)
- **Short**: No email should require scrolling more than 2 screens on mobile
- **One CTA**: Each email has one primary action. Never competing buttons.
- **Standalone value**: Every email includes wisdom content even if the CTA is ignored
- **Unsubscribe**: One-click unsubscribe per email type (not bulk all-or-nothing)
- **Dark mode compatible**: Email templates tested in both light and dark email clients

### 7.3 Weekly Reflection Email Template

Subject: "Your week with Possibility"

Content blocks:
1. Jim's weekly reflection (1-2 sentences, rotated from quote library)
2. Practice summary: X sessions, Y minutes, Z-day streak
3. Mood trend: average pre/post mood delta (if tracking)
4. Pillar journey: "This week you focused on [pillar]. [One sentence about that pillar's meaning]."
5. Recommended next session (one session, deep link)
6. Footer: manage notification preferences

---

## 8. Intelligent Scheduling

### 8.1 Send Time Optimization (Braze Intelligent Timing)

Every user has a `preferred_send_hour` computed from their usage patterns:

```
preferred_send_hour = mode(hour_of_day) from last 30 sessions
fallback = 8 AM local time (if < 5 sessions)
```

All non-urgent pushes are scheduled for the user's preferred hour. Braze batches sends by timezone + preferred hour. We also leverage Braze's built-in Intelligent Timing feature as a secondary optimization layer.

### 8.2 Quiet Hours

| Setting | Default | Configurable |
|---|---|---|
| Quiet start | 10:00 PM local | Yes |
| Quiet end | 7:00 AM local | Yes |
| Override for streaks | Push at 8 PM if streak at risk | Yes (can disable) |

Notifications that would land during quiet hours are held and delivered at quiet end. Implemented via Braze quiet hours with custom attribute sync.

### 8.3 Frequency Capping (Braze Global Frequency Capping)

| Channel | Daily Cap | Weekly Cap |
|---|---|---|
| Push | 3 | 15 |
| Email | 1 | 5 |
| In-App | No cap (contextual) | No cap |

Priority when user would exceed cap:
1. Transactional (always delivered)
2. Streak-at-risk (if applicable)
3. Campaign with highest historical open rate for that user's segment
4. Everything else queued for next day

### 8.4 Suppression Rules (Braze Exception Events + Custom Logic)

| Rule | Logic |
|---|---|
| Active today | Do not send "come back" pushes if `app_opened` today |
| Just completed session | Do not send practice reminder if `meditation_completed` in last 4 hours |
| Notification fatigue | If user dismissed 5+ notifications without opening in 7 days, reduce frequency to 1/day max for 14 days |
| Unsubscribed type | Never send a notification type the user has opted out of |
| Churned + win-back complete | After 90-day win-back cycle, transition to long-term layer |

---

## 9. Braze Campaign Builder (Admin CMS Integration)

The Admin CMS campaign builder uses the `campaigns` table schema with the following `rules_json` structure synced to Braze via API:

### 9.1 Campaign Rule Schema

```json
{
  "target_segments": ["lapsed", "pillar_release"],
  "exclude_segments": ["churned"],
  "trigger": {
    "type": "event",
    "event_name": "streak_broken",
    "delay_minutes": 0
  },
  "scheduling": {
    "send_at": "preferred_hour",
    "respect_quiet_hours": true,
    "frequency_cap_override": null
  },
  "content": {
    "title_template": "Your {{pillar_name}} practice misses you",
    "body_template": "{{first_name}}, it's been {{days_since_last}} days. Here's a {{duration_preference}} session: {{recommended_session_title}}",
    "deep_link": "/session/{{recommended_session_id}}",
    "image_url": null
  },
  "personalization_fields": [
    "first_name",
    "pillar_name",
    "days_since_last",
    "duration_preference",
    "recommended_session_title",
    "recommended_session_id"
  ],
  "ab_test": {
    "enabled": false,
    "variants": []
  },
  "limits": {
    "max_sends": 10000,
    "max_per_user": 1,
    "cooldown_days": 7
  }
}
```

### 9.2 Template Variables (Braze Custom Attributes + Connected Content)

| Variable | Source | Example |
|---|---|---|
| `{{first_name}}` | `users.display_name` (first word) | "Sarah" |
| `{{pillar_name}}` | Primary pillar from `segment_labels` | "Release" |
| `{{days_since_last}}` | Days since last `meditation_completed` | "12" |
| `{{streak_length}}` | Current streak | "7" |
| `{{sessions_completed}}` | Total completed sessions | "43" |
| `{{total_minutes}}` | Total meditation minutes | "320" |
| `{{recommended_session_title}}` | AI recommendation engine output (via Connected Content API call) | "Letting Go of Control" |
| `{{recommended_session_id}}` | Session ID for deep link | "305" |
| `{{program_name}}` | Current program (if enrolled) | "14-Day Possibility" |
| `{{program_day}}` | Current program day | "8" |
| `{{duration_preference}}` | "short" or "long" from segment | "10-minute" |
| `{{mood_trend}}` | "improving" / "steady" / "declining" | "improving" |
| `{{subscription_plan}}` | Current plan | "Premium" |
| `{{trial_days_remaining}}` | Days left in trial | "4" |

### 9.3 Quiet Hours Policy (Braze Configuration)

```json
{
  "enabled": true,
  "default_start": "22:00",
  "default_end": "07:00",
  "timezone_source": "user_profile",
  "override_for_transactional": true,
  "streak_exception": {
    "enabled": true,
    "send_at": "20:00",
    "only_if_streak_gte": 3
  }
}
```

---

## 10. Attribution & Measurement

### 10.1 Campaign Attribution (Braze + Supabase)

Every notification carries a `campaign_id`. When a user opens the app via a notification:

1. `notification_opened` event fires with `campaign_id` (Braze SDK)
2. `app_opened` event fires with `source=notification` (synced to Supabase)
3. Any session started within 30 minutes is attributed to the campaign (`meditation_started.source=notification`)

### 10.2 Campaign Success Metrics

| Metric | Calculation | Good | Excellent |
|---|---|---|---|
| Delivery rate | delivered / sent | > 95% | > 98% |
| Open rate | opened / delivered | > 8% | > 15% |
| Session conversion | sessions_from_campaign / opened | > 20% | > 35% |
| Reactivation rate (re-engagement) | returned_users / targeted_lapsed | > 5% | > 12% |
| Trial conversion (trial campaigns) | trial_converted / trial_campaign_opened | > 10% | > 20% |
| Unsubscribe rate | unsubscribed / sent | < 2% | < 0.5% |

### 10.3 A/B Testing (Braze Multivariate Testing)

When `ab_test.enabled = true` in campaign rules:

```json
{
  "ab_test": {
    "enabled": true,
    "variants": [
      {
        "id": "control",
        "weight": 50,
        "title": "Your practice awaits",
        "body": "A new session is ready for you."
      },
      {
        "id": "personalized",
        "weight": 50,
        "title": "Your {{pillar_name}} session is ready",
        "body": "{{first_name}}, try {{recommended_session_title}} today."
      }
    ],
    "success_metric": "session_conversion",
    "min_sample_size": 500,
    "auto_winner_after_days": 7
  }
}
```

- Users assigned to variants via deterministic hash: `hash(user_id + campaign_id) % 100`
- Winner declared when `min_sample_size` reached per variant AND statistical significance (p < 0.05)
- If no winner after `auto_winner_after_days`, variant with higher conversion rate wins
- Winning variant replaces campaign content going forward
- Braze's built-in multivariate testing handles the statistical engine; we define the variants and success metrics

---

## 11. Competitive Advantages

What we do that Calm/Headspace/Waking Up don't:

| Capability | Us | Calm | Headspace | Waking Up |
|---|---|---|---|---|
| AI-powered session recommendations in pushes | Yes (Jim AI) | No | Partial (ML timing) | No |
| Mood-responsive notification content | Yes | No | No | No |
| Pillar-personalized messaging | Yes | N/A | No | No |
| AI-generated milestone messages | Yes (Jim AI) | No | No | No |
| Granular per-type notification opt-in | Yes | No | No | Yes |
| Notifications that ARE the practice (wisdom delivery) | Yes | No | No | Yes |
| Book-to-app funnel automation | Yes | No | No | No |
| Smart quiet hours with streak exceptions | Yes | Unknown | Unknown | Unknown |
| Campaign A/B testing | Yes (Braze) | Yes | Yes (Braze) | Unknown |
| Churn prediction-driven outreach | Yes | Unknown | Yes (Databricks) | Unknown |
| Long-term dormant user nurture | Yes | Unknown | Unknown | Unknown |

**The compound advantage:** Individual features exist elsewhere, but the combination of AI conversation data, mood tracking, pillar personalization, and behavioral automation through one intelligence layer (Jim AI → Braze) is unprecedented in the category.

---

## 12. Implementation Roadmap

### Phase 1: Launch Essentials (Week 1-2)
- [ ] Configure Braze workspace, SDK integration, push certificate setup
- [ ] Supabase → Braze CDI: user profile sync, segment sync, event forwarding
- [ ] Daily practice reminder (push at preferred time via Braze Intelligent Timing)
- [ ] Daily wisdom quote (push, standalone value)
- [ ] Streak milestone notifications (3, 7, 14, 30 days)
- [ ] Streak-at-risk nudge (8 PM local, Braze action-based campaign)
- [ ] Onboarding welcome push + email (Day 1)
- [ ] Transactional emails (receipts, password reset)
- [ ] Quiet hours enforcement (Braze quiet hours configuration)
- [ ] Frequency capping (Braze global frequency capping rules)

### Phase 2: First Month (Week 3-4)
- [ ] Full onboarding sequence (Days 1-15, Braze Canvas flow)
- [ ] Program lifecycle notifications (Braze action-based campaigns)
- [ ] Trial lifecycle emails (Braze Canvas with entry trigger `trial_started`)
- [ ] Subscription lifecycle emails
- [ ] Weekly reflection email (Braze recurring campaign + Connected Content for stats)
- [ ] Book code lifecycle
- [ ] Smart send time optimization (Braze Intelligent Timing activation)

### Phase 3: Growth Engine (Week 5-8)
- [ ] Lapsed user re-engagement flow (Braze Canvas, segment trigger `lapsed`)
- [ ] Churned user win-back flow (Braze Canvas, segment trigger `churned`)
- [ ] Returned user welcome-back flow (Braze Canvas, segment trigger `returned`)
- [ ] Mood-based triggers (Braze action-based campaigns on mood events)
- [ ] Feature discovery triggers
- [ ] Subscription conversion triggers
- [ ] Campaign builder integration (Admin CMS → Braze API for custom campaigns)
- [ ] Campaign A/B testing (Braze multivariate testing)
- [ ] Discount offers via Stripe (bypassing Apple 30%)

### Phase 4: Intelligence Layer (Week 9+)
- [ ] AI-generated milestone messages via Jim AI (100-day streak, anniversary)
- [ ] Predictive churn intervention (proactive outreach before user lapses, using Braze Predictive Suite)
- [ ] Content-aware recommendations in pushes (mood booster sessions via Connected Content)
- [ ] Cross-channel optimization (push vs email effectiveness per user, Braze analytics)
- [ ] Referral program automation
- [ ] Seasonal campaigns (New Year, Mental Health Month, etc.)
- [ ] Long-term relationship layer for dormant users (quarterly content, annual anniversary, seasonal wisdom)
- [ ] Practice anniversary email with historical data summary
- [ ] New program/book launch announcements to all segments

---

## 13. Braze-Specific Implementation Notes

### Braze Workspace Setup
- Single workspace for The Possibility app
- iOS + Android app groups configured
- Push certificates: APNs (iOS) + FCM (Android)
- Email domain: thepossibility.app (SPF, DKIM, DMARC configured)
- SMS short code (if SMS channel is added later)

### Braze CDI (Cloud Data Ingestion) from Supabase
- User profile attributes synced in real-time via Braze `/users/track` API endpoint
- Custom events forwarded: `meditation_completed`, `ai_chat_opened`, `mood_logged`, `program_started`, `program_completed`, `paywall_viewed`, `trial_started`, `subscription_started`, etc.
- Segment membership computed in Supabase, synced to Braze custom attributes
- Connected Content endpoints hosted on Vercel serverless functions for dynamic personalization (session recommendations, stats summaries)

### Braze Canvas Flows (Primary Orchestration Tool)
- **Onboarding Canvas**: Entry trigger `onboarding_completed`, 15-day multi-step flow with decision splits
- **Trial Canvas**: Entry trigger `trial_started`, branches for active vs inactive trial users
- **Win-Back Canvas**: Entry trigger segment transition to `churned`, 90-day flow with exit on return
- **Long-Term Canvas**: Entry trigger segment transition to `dormant`, quarterly cadence with anniversary triggers
- **Program Canvas**: Entry trigger `program_started`, dynamic day tracking with abandonment branches

### Braze Campaign Types
- **Action-Based**: Streak milestones, mood triggers, feature discovery, subscription events
- **Scheduled**: Daily wisdom, weekly reflection
- **API-Triggered**: Custom campaigns from Admin CMS builder

---

## 14. Cross-Reference (Internal Documents)

| Topic | Document |
|---|---|
| User segments and churn model | `analytics_strategy_v2.md` Section 4-5 |
| Campaign and notification database schema | `supabase_schema_migrations_v2.sql` (campaigns, campaign_recipients, notifications tables) |
| Push/email retry and resilience | `error_handling_resilience_v2.md` Section 2.2, 3.2, 4.4 |
| Notification API endpoints | `api_contracts_v2.md` Section 10, 12 |
| Real-time notification delivery | `realtime_streaming_strategy_v2.md` Section 4.2 |
| Kill switch for campaigns | `deployment_runbook_v2.md` launch checklist |
| Notification events and attribution | `analytics_strategy_v2.md` Section 1.9 |
| Data retention for campaign data | `data_retention_policy_v2.md` |
| Competitive intelligence | Marketing playbook (jim-marketing-playbook.html) |

---

## 15. Risk Mitigation

| Risk | Mitigation |
|---|---|
| Braze costs scale with MAU | Monitor MAU tiers quarterly. At 50K users, expect $60K-80K/yr Braze platform cost. Budget accordingly. |
| Apple rejecting Stripe discount routing | Calm proved this works. Discount emails link to web checkout, not in-app. Apple cannot block web purchases. |
| Notification fatigue | Frequency caps are hard-coded. Suppression rules prevent stacking. Fatigue detection auto-reduces to 1/day. |
| Jim AI latency in Connected Content | Cache AI recommendations. Fallback to pillar-based recommendation if AI times out (< 2 sec SLA). |
| Low initial data for personalization | First 5 sessions use onboarding answers + defaults. Personalization improves with every session/mood log/AI conversation. |
| GDPR/privacy compliance | All notification preferences stored per-user. One-click unsubscribe. Data retention policies defined in `data_retention_policy_v2.md`. |
| Push certificate expiry | Calendar reminders for APNs certificate renewal. Braze dashboard alerts configured. |

---

*Last updated: 2026-03-10*
*Document owner: Possibility Strategy Team*
*Status: Ready for implementation*
