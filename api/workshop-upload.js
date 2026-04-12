/**
 * Workshop Upload API - Upload audio to Supabase Storage
 * POST /api/workshop-upload
 * Body: { audio: "base64string", contentType: "audio/webm" }
 * Returns: { audio_url: "signed_url" }
 */

const { createClient } = require('@supabase/supabase-js');

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
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const buffer = Buffer.from(audio, 'base64');
    const extMap = {
      'audio/webm': 'webm',
      'audio/mp4': 'm4a',
      'audio/mpeg': 'mp3',
      'audio/ogg': 'ogg',
      'audio/wav': 'wav'
    };
    const ext = extMap[contentType] || 'webm';
    const filename = `idea-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('workshop-audio')
      .upload(filename, buffer, {
        contentType: contentType || 'audio/webm',
        upsert: false
      });

    if (uploadError) throw uploadError;

    // Create a signed URL valid for 1 year
    const { data: urlData, error: urlError } = await supabase.storage
      .from('workshop-audio')
      .createSignedUrl(filename, 31536000);

    if (urlError) throw urlError;

    return res.status(200).json({ audio_url: urlData.signedUrl, filename });
  } catch (err) {
    console.error('Upload error:', err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
};

module.exports.config = {
  api: {
    bodyParser: {
      sizeLimit: '4mb'
    }
  }
};
