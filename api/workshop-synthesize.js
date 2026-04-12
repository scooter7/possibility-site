/**
 * Workshop Synthesize API - AI-powered breakdown of ideas, notes, and transcripts
 * POST /api/workshop-synthesize
 * Body: { content: "raw text", category: "idea|note|meeting" }
 * Returns: { synthesis: { summary, key_takeaways, action_items, insights, questions, topics } }
 */

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-workshop-pin');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const { content, category } = req.body;
  if (!content) return res.status(400).json({ error: 'content is required' });

  const cat = category || 'idea';

  const systemPrompts = {
    idea: `You are a strategic product analyst for The Possibility, a meditation and personal growth iOS app. Analyze this idea and produce a structured breakdown.

Return valid JSON:
{
  "summary": "2-3 sentence executive summary of the idea",
  "key_takeaways": ["3-5 core insights from this idea"],
  "action_items": ["specific next steps to explore or implement"],
  "strategic_fit": "How this aligns with a meditation/wellness app strategy",
  "risks": ["potential challenges or concerns"],
  "topics": ["auto-generated tags, 2-4 words each, lowercase"],
  "priority": "high|medium|low"
}`,

    note: `You are a strategic analyst. Synthesize these notes into structured, actionable intelligence for The Possibility, a meditation and personal growth iOS app.

Return valid JSON:
{
  "summary": "2-3 sentence summary capturing the core substance",
  "key_takeaways": ["the most important points, distilled"],
  "action_items": ["concrete next steps derived from the notes"],
  "connections": ["how these notes relate to broader strategy themes"],
  "open_questions": ["unresolved questions or areas needing more exploration"],
  "topics": ["auto-generated tags, 2-4 words each, lowercase"],
  "priority": "high|medium|low"
}`,

    meeting: `You are an expert meeting analyst. Transform this meeting transcript into a comprehensive, actionable brief for The Possibility, a meditation and personal growth iOS app.

Return valid JSON:
{
  "summary": "3-4 sentence executive summary of the meeting",
  "key_takeaways": ["the most critical points discussed"],
  "decisions_made": ["any decisions that were reached"],
  "action_items": [{"task": "description", "owner": "if mentioned, else null", "deadline": "if mentioned, else null"}],
  "open_questions": ["unresolved topics or items needing follow-up"],
  "insights": ["strategic observations or patterns noticed"],
  "sentiment": "overall tone/energy of the meeting",
  "topics": ["auto-generated tags, 2-4 words each, lowercase"],
  "priority": "high|medium|low"
}`
  };

  try {
    const chatResp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        temperature: 0.3,
        max_tokens: 2000,
        messages: [
          { role: 'system', content: systemPrompts[cat] || systemPrompts.idea },
          { role: 'user', content }
        ]
      })
    });

    if (!chatResp.ok) {
      const err = await chatResp.text();
      console.error('Synthesis API error:', err);
      return res.status(502).json({ error: 'Synthesis failed' });
    }

    const result = await chatResp.json();
    const raw = result.choices[0].message.content;

    let synthesis;
    try {
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      synthesis = JSON.parse(cleaned);
    } catch {
      synthesis = { summary: raw, key_takeaways: [], action_items: [], topics: [] };
    }

    return res.status(200).json({ synthesis });
  } catch (err) {
    console.error('Synthesize error:', err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
};
