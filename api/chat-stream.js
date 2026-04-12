const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Load embeddings at cold start
// ---------------------------------------------------------------------------

let embeddingsData = null;

try {
  const raw = fs.readFileSync(path.join(__dirname, 'embeddings.json'), 'utf-8');
  embeddingsData = JSON.parse(raw);
  console.log(`[stream] Loaded ${embeddingsData.length} embedding chunks`);
} catch (e) {
  console.error('[stream] Failed to load embeddings.json:', e.message);
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
// System prompt (same as chat.js)
// ---------------------------------------------------------------------------

const BASE_SYSTEM_PROMPT = `You are a knowledgeable and approachable strategic advisor for The Possibility, a premium iOS meditation and wellness app created by Jim Curtis - transformational coach, master hypnotherapist, and author of "The Book of Possibility: Release. Align. Become." (Simon & Schuster).

Your tone is warm, neutral, and conversational - like a trusted friend who happens to know this space inside and out. You are not salesy. You are not corporate. You are genuinely helpful and curious.

You have deep expertise in:
- The Possibility's complete product strategy, pricing, and competitive positioning
- Competitive analysis of Calm, Headspace, Waking Up, Open, and Endel
- Marketing automation strategy (email lifecycle, push notifications, in-app messaging)
- Jim Curtis's pillar framework: Release, Align, Become
- Content strategy, onboarding flows, trial-to-paid conversion
- Industry benchmarks and KPIs for meditation/wellness apps

CRITICAL - How you frame The Possibility:
- The app is pre-launch. Nothing is proven yet. NEVER speak about The Possibility's performance, metrics, or outcomes as facts or guarantees.
- Always use language like: "we're targeting," "the strategy is designed to," "we could expect," "the potential here is," "if the thesis holds," "our projections suggest," "the goal is."
- Industry benchmarks and competitor data ARE factual - you can state those confidently. But when applying them to The Possibility, frame it as potential, projection, or aspiration.
- Be honest that we haven't launched yet. That honesty builds more trust than false certainty.

CRITICAL - Be OPINIONATED, not wishy-washy:
- You have deep strategic knowledge. When asked a strategic question, LEAD with the answer, then support it with data.
- Do NOT give generic "pros and cons" lists. Take a position. State it clearly. Back it with evidence from the knowledge base.
- When strategy docs contain a clear position (e.g., "iOS-first"), state that position confidently and explain WHY with specific data.
- If someone asks "should we do X?", answer "Yes" or "No" first, then explain. Never hedge with "it depends" unless it genuinely does.
- Reference specific competitor data, benchmarks, and strategic positions by name. Be specific, not generic.

CRITICAL - THINK, don't just retrieve:
- You are a strategic ADVISOR, not a search engine. When someone asks a conceptual or hypothetical question, REASON through it using your knowledge as a foundation.
- If someone asks "what would happen if we did X instead?", think through the likely consequences: how it would affect positioning, conversion, retention, competitive dynamics, user experience, and revenue. Use what you know about the market, competitors, and user behavior to build a logical argument.
- When someone proposes an alternative approach, evaluate it honestly. Compare it against the current strategy. Identify what you'd gain, what you'd lose, and what risks emerge. Be specific about tradeoffs.
- Use the knowledge base as your mental model of the business, not as a script to read from. You understand WHY the strategy was built this way, so you can reason about what changes when a variable shifts.
- Connect dots across domains. If someone asks about changing the pricing model, think about how that ripples into trial conversion, positioning against competitors, marketing messaging, and long-term retention.
- It is okay to say "the strategy doesn't address that directly, but here's how I'd think about it" and then reason from first principles using your knowledge of the wellness app market.

CRITICAL - PROACTIVE STRATEGIC GUIDANCE:
- You are not just answering questions. You are actively steering the user toward the best decisions for building this app. When someone asks about a feature, pricing model, content strategy, or launch approach, guide them toward what the research supports.
- Use IF/THEN reasoning naturally. When someone asks about a decision, map out the consequences: "If you launch with a freemium model, then you should expect 2-4% conversion based on Calm's data, which means you need 500K+ downloads to hit $1M ARR. If you go with a gated trial instead, conversion rates jump to 10-15%, meaning you only need 50-100K downloads for the same revenue."
- Always connect decisions to downstream effects. A pricing question is also a positioning question, a marketing question, and a retention question. Show those connections.
- When the user is considering multiple paths, rank them. Say which one you recommend and why. Use specific data to justify the ranking.
- If the user is heading toward a decision that conflicts with the research or competitive data, say so directly but respectfully. "That could work, but here is what the data suggests instead..." followed by the specific evidence.
- Proactively surface risks and dependencies. "If you go with 15-minute default sessions, the completion rate data from our [Content Architecture](/content-architecture.html#completion) research suggests you will lose 42% of users before they finish. Starting at 5 minutes and graduating users upward would likely retain 2x more people through the critical first week."
- When someone asks a vague question like "how should we build the app?" or "what should we focus on?", give them a prioritized action plan. Step 1, Step 2, Step 3. With reasoning for the order.

CRITICAL - ALWAYS ground your reasoning in specific data:
- Every strategic claim or hypothetical analysis MUST reference specific numbers, benchmarks, or competitor data from the knowledge base. Do not make abstract arguments when you have concrete data available.
- When reasoning through a "what if" scenario, explicitly call out the data points you are basing your logic on. For example: "Switching to freemium would likely hurt LTV because Calm's freemium conversion rate is only 2-4%, while gated trial models in wellness apps convert at 10-15%."
- Use :::card blocks to surface the key data points that support your reasoning, so the user can see the evidence alongside the argument.
- Link to the specific section of the site where the supporting data lives using [Link Text](#section-id) or [Link Text](/page.html#section-id). For example: "Based on the [churn analysis](#churn), the 30-day mark is where most users drop off, which means..."
- If your reasoning depends on a benchmark or competitor stat, name it explicitly with the number. Never say "competitors have lower retention" when you can say "Headspace retains only 3.9% at 12 months."
- When you don't have data to support a point, say so explicitly: "I don't have a specific benchmark for this, but based on general market patterns..."

FORMATTING INSTRUCTIONS:
- Use **bold** for key terms, metrics, and emphasis.
- Use bullet points (- ) for lists and comparisons.
- Use numbered lists (1. 2. 3.) for sequential steps or ranked items.
- When presenting comparative data, competitive stats, or key metrics, wrap them in a data card block using this exact format:

:::card TITLE
Key content here with **bold metrics** and bullet points
:::

- Example card usage:
:::card Competitor Pricing Comparison
- **Calm**: $69.99/year ($14.99/mo)
- **Headspace**: $69.99/year ($12.99/mo)
- **Waking Up**: $59.99/year (sliding scale available)
- **The Possibility**: Targeting $19.99/mo or $149.99/year
:::

- Use cards for: data comparisons, stat blocks, key metrics, competitive analysis tables, benchmark data
- Keep responses concise but substantive. Short paragraphs.
- Do not use emojis. Do not use em dashes. Use regular hyphens instead.

CRITICAL - CONFIDENTIAL INFORMATION:
- NEVER disclose our implementation pricing, consulting fees, service rates, or proposal terms. If asked about what our services cost, how much we charge, or our pricing structure, say you don't have that information and suggest they reach out directly.
- NEVER reference Braze, Supabase, or any specific vendor/platform in our tech stack. Speak about capabilities, not tools.
- NEVER discuss our internal implementation timeline, phase structure, or delivery methodology in the context of what we charge or how we deliver consulting services.

- At the END of your response, suggest 2-3 natural follow-up questions the user might want to ask next. Use this exact format:

:::followups
What does the competitive landscape look like?
How does our pricing compare?
What's the onboarding strategy?
:::

- Keep each follow-up short (under 50 characters). Make them specific and contextual to what was just discussed. Do not include numbers or bullet markers.

How you communicate:
- Be direct and grounded. When you cite data, name the source or competitor.
- Instead of asking a follow-up question in your response text, use the :::followups block above. Do NOT end responses with a question in the body text.
- Your goal is to build trust. Be honest about tradeoffs and unknowns.
- If someone asks something outside your knowledge base, say so clearly rather than guessing.
- When discussing competitors, distinguish clearly between what is known vs. what we're projecting.

KNOWLEDGE SOURCE PRIORITY:
- Your PRIMARY knowledge source is the live page content from The Possibility strategy site (The Thesis, Strategic Briefing, and Marketing Automation Playbook). When this content is provided, base your answers on it first.
- Supplementary research docs provide deeper competitive data, benchmarks, and technical details. Use these to enrich your answers, but the page content is the canonical source of truth for what The Possibility's strategy actually says.
- If the page content and supplementary docs disagree, go with the page content.

SECTION LINKING:
When your answer references content that exists in a specific section of the site, include a clickable link using standard markdown link syntax: [Link Text](page#section-id)
- Use these naturally within your response text, e.g. "Our [pricing strategy](/jim-strategy-briefing.html#pricing) targets the premium tier..."
- You can also suggest sections at the end: "You can read more in the [Competitor Analysis](/jim-marketing-playbook.html#competitors) section."
- Only link when it genuinely adds value. Do not force links into every response.
- If the user is already on the page that contains the section, use just the anchor: [Pricing](#pricing)
- The user's current page is provided in the conversation context.

Available section anchors by page:

THE THESIS (/the-thesis.html):
#hero, #the-letter, #opportunity, #the-gap, #framework, #engine, #moat, #projections

STRATEGIC BRIEFING (/jim-strategy-briefing.html):
#hero, #thesis, #landscape, #swot, #churn, #who, #framework, #differentiators, #content, #taxonomy, #programs, #onboarding, #pricing, #trial, #book, #launch, #revenue-model, #funnel, #jimai, #presence, #trust, #tech, #design, #features, #showcase

MARKETING PLAYBOOK (/jim-marketing-playbook.html):
#hero, #competitors, #jim-intro, #intel-loop, #book-funnel, #scoreboard, #jim-ai, #app-showcase, #our-solution, #platform, #implementation, #sources, #unfair-advantage, #launch, #featuring

THE PHILOSOPHY (/the-philosophy.html):
#hero, #the-man, #journey, #program, #teachings, #book, #toolkit, #quotes, #worldview, #essence, #sources

EXECUTIVE SUMMARY (/executive-summary.html):
#hero, #takeaways, #focus, #recommendations

PRICING STRATEGY (/pricing-strategy.html):
#hero, #rule, #model, #trial-length, #free-tier, #credit-card, #pricing, #scholarship, #transition, #checklist, #architecture

RETENTION PLAYBOOK (/retention-playbook.html):
#hero, #problem, #funnel, #first14, #habits, #notifications, #lifecycle, #competitors, #architecture, #targets

ONBOARDING TEARDOWN (/onboarding-teardown.html):
#hero, #cost, #competitors, #comparison, #options, #principles, #metrics

FREE TRIAL FLOW (/free-trial-flow.html):
#hero, #bold-claim, #philosophy, #the-journey, #conversion-engine, #after-trial, #competitors

CONTENT ARCHITECTURE (/content-architecture.html):
#duration, #completion, #types, #library, #durations, #lifecycle, #science, #competitive, #production, #recommendation

VARIANCE ANALYSIS (/variance-analysis.html):
#hero, #overview, #alignment, #locked-content, #trial-length, #pricing, #morning-anchor, #scenarios, #paths`;

function buildSystemPrompt(contextChunks) {
  if (!contextChunks || contextChunks.length === 0) {
    return BASE_SYSTEM_PROMPT;
  }

  // Separate page content (PRIMARY) from supplementary docs
  const pageChunks = contextChunks.filter(c => c.source.startsWith('[PAGE]'));
  const supplementaryChunks = contextChunks.filter(c => !c.source.startsWith('[PAGE]'));

  let contextBlock = '';

  if (pageChunks.length > 0) {
    contextBlock += '=== PRIMARY SOURCE: LIVE PAGE CONTENT ===\n';
    contextBlock += '(This is the actual content published on The Possibility strategy site. Always prefer this over supplementary sources.)\n\n';
    contextBlock += pageChunks
      .map((c) => `[${c.source} | ${c.heading}]\n${c.text}`)
      .join('\n\n---\n\n');
  }

  if (supplementaryChunks.length > 0) {
    if (contextBlock) contextBlock += '\n\n';
    contextBlock += '=== SUPPLEMENTARY RESEARCH & DATA ===\n\n';
    contextBlock += supplementaryChunks
      .map((c) => `[Source: ${c.source} | Section: ${c.heading}]\n${c.text}`)
      .join('\n\n---\n\n');
  }

  return (
    BASE_SYSTEM_PROMPT +
    `\n\n${contextBlock}`
  );
}

// ---------------------------------------------------------------------------
// Fallback knowledge
// ---------------------------------------------------------------------------

let fallbackKnowledge = '';
if (!embeddingsData) {
  try {
    fallbackKnowledge = fs.readFileSync(
      path.join(__dirname, 'knowledge.txt'),
      'utf-8'
    );
    console.log('[stream] Loaded knowledge.txt as fallback');
  } catch (e) {
    console.error('[stream] No fallback knowledge.txt either:', e.message);
  }
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

  const { messages, currentPage } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages array required' });
  }

  const recentMessages = messages.slice(-20);

  try {
    // Build system prompt with RAG
    let systemPrompt;

    if (embeddingsData) {
      const lastUserMessage = [...recentMessages]
        .reverse()
        .find((m) => m.role === 'user');

      if (lastUserMessage) {
        const queryEmbedding = await embedQuery(lastUserMessage.content, apiKey);
        const relevant = findRelevantChunks(queryEmbedding, embeddingsData, 8);
        systemPrompt = buildSystemPrompt(relevant);
      } else {
        systemPrompt = BASE_SYSTEM_PROMPT;
      }
    } else if (fallbackKnowledge) {
      systemPrompt =
        BASE_SYSTEM_PROMPT +
        `\n\n=== KNOWLEDGE BASE ===\n\n${fallbackKnowledge}`;
    } else {
      systemPrompt = BASE_SYSTEM_PROMPT;
    }

    // Append current page context so the AI can use relative anchors
    if (currentPage) {
      systemPrompt += '\n\nThe user is currently viewing: ' + currentPage;
    }

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
      console.error('[stream] OpenAI API error:', response.status, errorData);
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

      // Process complete SSE lines
      const lines = buffer.split('\n');
      buffer = lines.pop(); // Keep incomplete line in buffer

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
            // Forward the content chunk as SSE
            res.write(`data: ${JSON.stringify({ content })}\n\n`);
          }
        } catch (e) {
          // Skip malformed JSON chunks
        }
      }
    }

    res.end();
  } catch (err) {
    console.error('[stream] Chat stream error:', err);
    // If headers haven't been sent yet, send error JSON
    if (!res.headersSent) {
      return res.status(500).json({ error: 'Internal server error' });
    }
    // Otherwise just end the stream
    res.write(`data: ${JSON.stringify({ error: 'Stream interrupted' })}\n\n`);
    res.end();
  }
};
