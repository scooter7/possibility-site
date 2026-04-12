/**
 * Workshop Transcribe API - Whisper speech-to-text
 * POST /api/workshop-transcribe
 * Body: { audio: "base64string", contentType: "audio/webm" }
 */

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

  const { audio, contentType } = req.body;
  if (!audio) return res.status(400).json({ error: 'audio (base64) is required' });

  try {
    // Decode base64 to buffer
    const buffer = Buffer.from(audio, 'base64');

    // Determine file extension from content type
    const extMap = {
      'audio/webm': 'webm',
      'audio/mp4': 'm4a',
      'audio/mpeg': 'mp3',
      'audio/ogg': 'ogg',
      'audio/wav': 'wav'
    };
    const ext = extMap[contentType] || 'webm';

    // Build multipart form data for Whisper API
    const boundary = '----FormBoundary' + Math.random().toString(36).slice(2);
    const parts = [];

    // File part
    parts.push(
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="file"; filename="recording.${ext}"\r\n` +
      `Content-Type: ${contentType || 'audio/webm'}\r\n\r\n`
    );
    parts.push(buffer);
    parts.push('\r\n');

    // Model part
    parts.push(
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="model"\r\n\r\n` +
      `whisper-1\r\n`
    );

    // Language part (optional, helps accuracy)
    parts.push(
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="language"\r\n\r\n` +
      `en\r\n`
    );

    parts.push(`--${boundary}--\r\n`);

    // Combine parts into a single buffer
    const bodyParts = parts.map(p => typeof p === 'string' ? Buffer.from(p) : p);
    const body = Buffer.concat(bodyParts);

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`
      },
      body
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Whisper API error:', err);
      return res.status(502).json({ error: 'Transcription failed', details: err });
    }

    const result = await response.json();
    return res.status(200).json({ text: result.text });
  } catch (err) {
    console.error('Transcribe error:', err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
};

// Allow larger body for audio data (4MB)
module.exports.config = {
  api: {
    bodyParser: {
      sizeLimit: '4mb'
    }
  }
};
