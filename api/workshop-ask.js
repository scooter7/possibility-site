/**
 * Workshop Ask AI - Contextual Q&A about workshop entries
 * POST /api/workshop-ask
 * Body: { question: "your question", context: "card content", category: "idea|note|meeting" }
 * Returns: { answer: "AI response" }
 */

const fs = require('fs');
const path = require('path');

let embeddingsData = null;
try {
  const raw = fs.readFileSync(path.join(__dirname, 'embeddings.json'), 'utf-8');
  embeddingsData = JSON.parse(raw);
} catch (e) {
  console.error('Failed to load embeddings for ask:', e.message);
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

  const { question, context: cardContent, category } = req.body;
  if (!question) return res.status(400).json({ error: 'question is required' });

  try {
    // Optionally pull strategy context via RAG
    let strategyContext = '';
    if (embeddingsData && embeddingsData.length > 0) {
      const embResp = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'text-embedding-3-small',
          input: question + (cardContent ? ' ' + cardContent.slice(0, 200) : '')
        })
      });

      if (embResp.ok) {
        const embResult = await embResp.json();
        const queryVector = embResult.data[0].embedding;
        const scored = embeddingsData.map(chunk => ({
          ...chunk,
          score: cosineSimilarity(queryVector, chunk.embedding)
        }));
        scored.sort((a, b) => b.score - a.score);
        strategyContext = scored.slice(0, 8).map((c, i) =>
          `[${i + 1}] (${c.source || 'unknown'}${c.section ? ' > ' + c.section : ''}, ${(c.score * 100).toFixed(0)}%)\n${c.text}`
        ).join('\n\n');
      }
    }

    const systemPrompt = `You are a brilliant strategic advisor for The Possibility, a meditation and personal growth iOS app. You have deep knowledge of product strategy, competitive landscape, user psychology, and growth tactics.

You are answering questions in the context of a Workshop tool where the team captures ideas, notes, and meeting transcripts. Be concise, insightful, and actionable. Use bullet points when listing items. Keep responses focused and under 300 words unless complexity demands more.

${strategyContext ? `\n## Relevant Strategy Data\n${strategyContext}` : ''}`;

    const messages = [
      { role: 'system', content: systemPrompt }
    ];

    if (cardContent) {
      messages.push({
        role: 'user',
        content: `## Context (${category || 'idea'})\n${cardContent}\n\n## Question\n${question}`
      });
    } else {
      messages.push({ role: 'user', content: question });
    }

    const chatResp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        temperature: 0.5,
        max_tokens: 1500,
        messages
      })
    });

    if (!chatResp.ok) {
      const err = await chatResp.text();
      console.error('Ask AI error:', err);
      return res.status(502).json({ error: 'AI request failed' });
    }

    const result = await chatResp.json();
    const answer = result.choices[0].message.content;

    return res.status(200).json({ answer });
  } catch (err) {
    console.error('Ask error:', err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
};
