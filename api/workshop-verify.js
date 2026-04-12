/**
 * Workshop Verify API - Cross-reference an idea against strategy data
 * POST /api/workshop-verify
 * Body: { content: "idea text" }
 * Returns: { verification: { supports: [], contradicts: [], gaps: [], summary: "" } }
 */

const fs = require('fs');
const path = require('path');

// Load embeddings at cold start
let embeddingsData = null;
try {
  const raw = fs.readFileSync(path.join(__dirname, 'embeddings.json'), 'utf-8');
  embeddingsData = JSON.parse(raw);
} catch (e) {
  console.error('Failed to load embeddings for verify:', e.message);
}

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

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-workshop-pin');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  // PIN check disabled during dev
  // if (req.headers['x-workshop-pin'] !== process.env.IDEAS_PIN) {
  //   return res.status(401).json({ error: 'Unauthorized' });
  // }

  const { content } = req.body;
  if (!content) return res.status(400).json({ error: 'content is required' });

  if (!embeddingsData || embeddingsData.length === 0) {
    return res.status(503).json({ error: 'Embeddings not loaded' });
  }

  try {
    // 1. Embed the idea text
    const embResp = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: content
      })
    });

    if (!embResp.ok) throw new Error('Embedding API failed');
    const embResult = await embResp.json();
    const queryVector = embResult.data[0].embedding;

    // 2. Find top 12 most relevant chunks from strategy data
    const scored = embeddingsData.map(chunk => ({
      ...chunk,
      score: cosineSimilarity(queryVector, chunk.embedding)
    }));
    scored.sort((a, b) => b.score - a.score);
    const topChunks = scored.slice(0, 12);

    // 3. Build context from relevant chunks
    const context = topChunks.map((c, i) => {
      const source = c.source || 'unknown';
      const section = c.section || '';
      return `[${i + 1}] (${source}${section ? ' > ' + section : ''}, relevance: ${(c.score * 100).toFixed(0)}%)\n${c.text}`;
    }).join('\n\n');

    // 4. Ask GPT-4o to analyze the idea against the data
    const chatResp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        temperature: 0.4,
        max_tokens: 1200,
        messages: [
          {
            role: 'system',
            content: `You are a strategic analyst for The Possibility, a meditation and personal growth iOS app. You verify ideas by cross-referencing them against existing strategy documents, competitive analysis, and research data.

Given an idea and relevant strategy context, provide a structured analysis:

1. SUPPORTS: What data points, research findings, or strategic decisions support this idea? Be specific.
2. CONTRADICTS: What existing data or decisions conflict with this idea? Be honest.
3. GAPS: What information is missing that would be needed to fully validate this idea?
4. VERDICT: A 1-2 sentence summary. Is this idea aligned with existing strategy, a novel insight worth exploring, or potentially misguided?
5. CONFIDENCE: A score from 0-100 indicating how confident you are in the verdict based on available data.

Respond in valid JSON format:
{
  "supports": ["point 1", "point 2"],
  "contradicts": ["point 1"],
  "gaps": ["what we'd need to know"],
  "verdict": "summary statement",
  "confidence": 75
}`
          },
          {
            role: 'user',
            content: `## Idea to Verify\n${content}\n\n## Strategy Context\n${context}`
          }
        ]
      })
    });

    if (!chatResp.ok) throw new Error('Chat API failed');
    const chatResult = await chatResp.json();
    const raw = chatResult.choices[0].message.content;

    // Parse JSON from response (handle markdown code blocks)
    let verification;
    try {
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      verification = JSON.parse(cleaned);
    } catch {
      verification = {
        supports: [],
        contradicts: [],
        gaps: [],
        verdict: raw,
        confidence: 50
      };
    }

    // Add source references
    verification.sources = topChunks.slice(0, 5).map(c => ({
      source: c.source,
      section: c.section,
      relevance: Math.round(c.score * 100)
    }));

    return res.status(200).json({ verification });
  } catch (err) {
    console.error('Verify error:', err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
};
