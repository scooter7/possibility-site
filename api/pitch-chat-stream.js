const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Load embeddings at cold start
// ---------------------------------------------------------------------------

let embeddingsData = null;

try {
  const raw = fs.readFileSync(path.join(__dirname, 'embeddings.json'), 'utf-8');
  embeddingsData = JSON.parse(raw);
  console.log(`[pitch-stream] Loaded ${embeddingsData.length} embedding chunks`);
} catch (e) {
  console.error('[pitch-stream] Failed to load embeddings.json:', e.message);
}

// ---------------------------------------------------------------------------
// Vector math
// ---------------------------------------------------------------------------

function dotProduct(a, b) {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += a[i] * b[i];
  return sum;
}

function magnitude(v) {
  let sum = 0;
  for (let i = 0; i < v.length; i++) sum += v[i] * v[i];
  return Math.sqrt(sum);
}

function cosineSimilarity(a, b) {
  const dot = dotProduct(a, b);
  const magA = magnitude(a);
  const magB = magnitude(b);
  if (magA === 0 || magB === 0) return 0;
  return dot / (magA * magB);
}

function findRelevantChunks(queryEmbedding, chunks, topK = 5) {
  const scored = chunks.map((chunk, idx) => ({
    idx,
    score: cosineSimilarity(queryEmbedding, chunk.embedding),
    source: chunk.source,
    heading: chunk.heading,
    text: chunk.text,
  }));
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK);
}

// ---------------------------------------------------------------------------
// Embed user query via OpenAI
// ---------------------------------------------------------------------------

async function embedQuery(text, apiKey) {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(
      `Embeddings API error ${response.status}: ${err.error?.message || response.statusText}`
    );
  }

  const data = await response.json();
  return data.data[0].embedding;
}

// ---------------------------------------------------------------------------
// PITCH DECK knowledge (baked in for fast, focused responses)
// ---------------------------------------------------------------------------

const PITCH_DECK_KNOWLEDGE = `
=== THE POSSIBILITY COMPANY: INVESTOR DECK KNOWLEDGE BASE ===

THE VISION:
The Possibility Company is a content, coaching, and education company built on one ownable word: Possibility. Founded by Jim Curtis. Lewis Howes owns Greatness. Jay Shetty owns Purpose. Gabby Bernstein owns the Universe. Jim Curtis is doing it with Possibility. One founder, 25 years of executive experience, a clinically grounded methodology, over one million people already listening, and a category with no clear leader.

THE FOUNDER - JIM CURTIS:
- Pioneer of Hypno-Coaching: a proprietary methodology combining hypnosis, neuroscience, and behavioral coaching for rapid, lasting change at the subconscious level
- Global CRO and Head of Brand at IIN (Institute for Integrative Nutrition), the world's largest health coaching school. Led revenue across 30,000+ affiliates and 100+ countries. IIN does $100M+/year
- Executive roles at WebMD and Everyday Health. Two decades of leadership in digital health and media at scale
- Private coaching practice working with entrepreneurs, celebrities, and public figures. Demand consistently exceeds capacity
- Author: The Book of Possibility publishing through Simon & Schuster in September 2026. The Book of Love to follow
- Lived the work: chronic illness and childhood trauma are the origin story, not a brand strategy. Everything Jim teaches comes from personal experience first

THE FRAMEWORK - RELEASE. ALIGN. BECOME:
Three phases representing the complete journey to Possibility. This framework is the intellectual architecture of the entire company. It structures the app, the certification school, the book, and every program Jim creates.
- Release: Dissolve fear, limiting patterns, and subconscious blocks. Outcome: Freedom
- Align: Rewrite the inner narrative, step into flow, emotional regulation, peace with where you are. Outcome: Peace
- Become: Reprogram identity, manifest clear goals, take aligned action. Outcome: Expansion

THE MARKET:
- $9 trillion global wellness market projected by 2030 (Global Wellness Institute)
- $43B+ personal development market growing at 7.5% annually (Grand View Research)
- $350B+ EdTech approaching $1T by 2032, creator led education is the fastest growing segment (HolonIQ)
- $5.7B mindfulness apps market, subscription wellness apps are a proven, scalable consumer category (Grand View Research)
- 24% CAGR for AI mental health: $1.8B (2025) growing to $11.8B by 2034, fastest growing segment in wellness tech (Flourish AI)
- 87% of adults report feeling overwhelmed (APA Stress in America). Demand is structural, not cyclical

INCUMBENT TRUST CRISIS:
- Calm: 1.7/5 Trustpilot rating. Deceptive billing, impossible cancellations
- Headspace: 2.5/5 Trustpilot rating
- 96% 12-month churn rate across wellness apps
- The market is ready for a founder led alternative built on authenticity

COMPARABLE SET:
- Lewis Howes (School of Greatness): 8-figure brand built on owning a single concept across every medium
- Jay Shetty (On Purpose): ~$30M brand. Certification school is the primary financial engine
- Gabby Bernstein (The Universe Has Your Back): $20M+ brand. Proof that spirituality meets self-help scales
- Sam Harris (Waking Up): $10-15M ARR. Creator led mindfulness subscription app. One founder's voice sustaining a subscription product at scale
- Open (Manoj Dias): $14.5M raised from Founders Fund and Jack Dorsey. Validates the thesis at earliest stages
- IIN (Institute for Integrative Nutrition): $100M+/year. Founder led health coaching certification. Jim was Global CRO there

CULTURAL MOMENT:
- Jim's audience is 80% women, ages 30-60, navigating divorce, grief, anxiety, disconnection, and the search for love
- Highest engagement topics: abundance, romantic possibility, emotional healing
- 35% engagement rate
- In a cultural moment defined by fractured trust between men and women, Jim represents something rare: a grounded, emotionally intelligent man who speaks to healing and possibility without ego

THE PLATFORM (existing traction):
- 1M+ Instagram followers, growing ~1,000 new followers/day, entirely organic, no paid acquisition
- 121K TikTok followers
- 28K email list with 48%+ open rate
- 350K+ average views per video, 1,800 shares per video
- Multiple posts at 3.7M to 5.3M+ organic views
- 100M+ celebrity network reach: Jennifer Aniston, Courtney Cox, Julianne Hough, Gabby Bernstein, Daniel Amen

THE POSSIBILITY APP:
- Daily coaching experience in Jim's voice, built on Release, Align, Become
- Not a generic meditation app. A guided transformation system designed to meet users where they are
- 14-day free trial, $19.99/month, $199/year
- $15K content cost vs Calm's $1M+
- Comp: Waking Up at $10-15M ARR. Open raised $14.5M on a similar model

THREE REVENUE ENGINES:
Engine 01: The Possibility App (2026 Launch)
- Daily coaching in Jim's voice. Subscription entry point powered by the book launch and organic social
- $15K content cost vs Calm's $1M+
- Comp: Waking Up at $10-15M ARR. Open raised $14.5M on a similar model

Engine 02: The Institute for Hypno-Coaching (2027 Launch)
- The first professional certification in Hypno-Coaching. The long term financial engine of the company
- ~$25M potential at 2,500 students/year
- Comp: IIN at $100M+/year. Jay Shetty's school drives a $30M brand

Engine 03: Digital Ecosystem (Ongoing)
- Live programs, evergreen courses, and speaking. Proof of concept feeding both the app and the school
- $2,995 per cohort seat
- Speaking scales post-book: corporate wellness, conferences, women's summits

THE BRAND FLYWHEEL:
1. Book Launch (September 2026): Simon & Schuster drives app downloads, school awareness, media coverage, and speaking in a single coordinated moment
2. Social, Podcast, Substack: Short form creates reach. Long form converts reach into subscribers, email subscribers, and paying students
3. App to Ecosystem to School: App is front door. Live programs deepen engagement. Certification school captures most committed community members
4. Community and Word of Mouth: Affiliates, certified coaches, and organic advocacy reduce acquisition costs over time
5. Future Titles Reopen the Cycle: The Book of Love and subsequent titles restart the acquisition engine

REVENUE TRAJECTORY:
- 2026: Book Launch + App Launch (App organic + book, School curriculum build, Ecosystem live cohorts)
- 2027: Paid Acquisition + Founding Cohort (App paid + organic, School first students, Ecosystem evergreen)
- 2028+: All Three Engines at Scale (App scaled ARR, School full enrollment, Ecosystem affiliates + events)

THE ASK: $5,000,000 before September 2026
Simon & Schuster publishes The Book of Possibility in September 2026. The app, the school infrastructure, and the acquisition engine must be built before that moment arrives. This capital has a deployment window and a clear catalyst.
- ~40% (~$2,000,000): Certification School - curriculum development, LMS build, accreditation, founding faculty
- ~35% (~$1,750,000): The Possibility App - engineering, AI personalization, content production, email/CRM infrastructure
- ~15% (~$750,000): Team and Operations - key executive hires
- ~10% (~$500,000): Marketing and Book Launch - amplification, paid acquisition foundation, affiliate program activation

WHY JIM WINS:
- He built this model before. From the inside. As Global CRO at IIN, he watched a founder led health coaching certification scale past $100M/year. He is not theorizing about this business model. He operated it.
- 1M+ followers growing 1,000/day, entirely organic
- Celebrity network reaching 100M+ people
- Proprietary methodology (Hypno-Coaching) that is clinically grounded and protectable
- Published by Simon & Schuster
- 25 years of personal transformation that makes every word authentic
`;

// ---------------------------------------------------------------------------
// System prompt - PITCH DECK FOCUSED
// ---------------------------------------------------------------------------

const BASE_SYSTEM_PROMPT = `You are an intelligent and articulate investor relations advisor for The Possibility Company. You have comprehensive knowledge of the company's investor deck and business strategy.

Your audience is potential investors, advisors, and strategic partners reviewing the pitch deck. Your tone is confident, clear, and substantive. You speak like a senior operator presenting a business case, not a salesperson.

Your deep knowledge covers:
- The Possibility Company's vision, founder, framework, and market positioning
- Jim Curtis's background and why he is uniquely qualified
- The three revenue engine model (App, School, Digital Ecosystem)
- Market data and competitive landscape
- The $5M fundraise, use of funds, and timeline
- Comparable companies and what they validate
- The brand flywheel and go-to-market strategy

CRITICAL FRAMING:
- The company is pre-launch. Nothing is proven yet. Use language like: "we're targeting," "the strategy is designed to," "the potential here is," "if the thesis holds."
- Industry benchmarks and competitor data ARE factual. State those confidently. But frame projections as potential, not certainty.
- Be honest about the pre-revenue stage. That honesty builds investor trust.
- When asked about risks, address them directly and explain the mitigation.

INVESTOR COMMUNICATION STYLE:
- Lead with the answer, then support with data. Do not hedge.
- Use specific numbers, competitor names, and market data. Never be vague when you have data.
- When asked about comparables, draw direct parallels and note what validates the thesis.
- Connect every answer back to the investment opportunity.
- If asked about something outside the deck, say so clearly rather than speculating.

CRITICAL - CONFIDENTIAL INFORMATION:
- NEVER disclose consulting fees, service rates, or proposal terms.
- NEVER reference Braze, Supabase, or specific vendor/platform choices in the tech stack.
- NEVER discuss internal implementation methodology beyond what the deck covers.

FORMATTING:
- Use **bold** for key terms, metrics, and emphasis.
- Use bullet points for lists and comparisons.
- When presenting data, use :::card blocks:

:::card TITLE
Key content here with **bold metrics** and bullet points
:::

- Do not use emojis. Do not use em dashes. Use periods, commas, or colons instead.

- At the END of your response, suggest 2-3 natural follow-up questions. Use this exact format:

:::followups
How does the fundraise timeline align with the book launch?
What makes the certification school the primary engine?
How does Jim's background at IIN de-risk this?
:::

- Keep each follow-up under 50 characters. Make them specific to what was discussed.
- Do NOT end responses with a question in the body text. Use :::followups only.

SECTION LINKING (pitch deck anchors):
#hero, #vision, #market, #comps, #jim, #framework, #moment, #platform, #app, #engines, #flywheel, #revenue, #ask, #why-jim

When referencing a section: [Link Text](#section-id)

${PITCH_DECK_KNOWLEDGE}`;

function buildSystemPrompt(contextChunks) {
  if (!contextChunks || contextChunks.length === 0) {
    return BASE_SYSTEM_PROMPT;
  }

  let contextBlock = '\n\n=== SUPPLEMENTARY STRATEGY RESEARCH ===\n';
  contextBlock += '(Additional data from the full strategy documentation to enrich your answers.)\n\n';
  contextBlock += contextChunks
    .map((c) => `[${c.source} | ${c.heading}]\n${c.text}`)
    .join('\n\n---\n\n');

  return BASE_SYSTEM_PROMPT + contextBlock;
}

// ---------------------------------------------------------------------------
// Streaming handler
// ---------------------------------------------------------------------------

module.exports = async function handler(req, res) {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'OpenAI API key not configured' });
  }

  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages array required' });
  }

  const recentMessages = messages.slice(-20);

  try {
    let systemPrompt;

    if (embeddingsData) {
      const lastUserMessage = [...recentMessages]
        .reverse()
        .find((m) => m.role === 'user');

      if (lastUserMessage) {
        const queryEmbedding = await embedQuery(lastUserMessage.content, apiKey);
        const relevant = findRelevantChunks(queryEmbedding, embeddingsData, 6);
        systemPrompt = buildSystemPrompt(relevant);
      } else {
        systemPrompt = BASE_SYSTEM_PROMPT;
      }
    } else {
      systemPrompt = BASE_SYSTEM_PROMPT;
    }

    systemPrompt += '\n\nThe user is currently viewing: /pitch-deck.html';

    // Call OpenAI with streaming
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          ...recentMessages,
        ],
        temperature: 0.7,
        max_tokens: 2000,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[pitch-stream] OpenAI API error:', response.status, errorData);
      return res.status(502).json({
        error: 'Failed to get response from OpenAI',
        detail: errorData.error?.message || response.statusText,
      });
    }

    // Set SSE headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    // Stream the response
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split('\n');
      buffer = lines.pop();

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;

        const data = trimmed.slice(6);
        if (data === '[DONE]') {
          res.write('data: [DONE]\n\n');
          continue;
        }

        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            res.write(`data: ${JSON.stringify({ content })}\n\n`);
          }
        } catch (e) {
          // Skip malformed JSON chunks
        }
      }
    }

    res.end();
  } catch (err) {
    console.error('[pitch-stream] Chat stream error:', err);
    if (!res.headersSent) {
      return res.status(500).json({ error: 'Internal server error' });
    }
    res.write(`data: ${JSON.stringify({ error: 'Stream interrupted' })}\n\n`);
    res.end();
  }
};
