/**
 * Workshop Document Upload API
 * POST /api/workshop-doc-upload
 * Body: { file: "base64string", contentType: "application/pdf", filename: "doc.pdf" }
 * Returns: { text: "extracted text", doc_url: "signed_url", filename: "stored_name" }
 */

const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-workshop-pin');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const { file, contentType, filename: origName } = req.body;
  if (!file) return res.status(400).json({ error: 'file (base64) is required' });

  try {
    const buffer = Buffer.from(file, 'base64');
    let text = '';

    // Extract text based on content type
    if (contentType === 'application/pdf') {
      const pdfParse = require('pdf-parse');
      const data = await pdfParse(buffer);
      text = data.text;
    } else if (
      contentType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      contentType === 'application/msword'
    ) {
      const mammoth = require('mammoth');
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    } else if (contentType === 'text/plain' || contentType === 'text/markdown') {
      text = buffer.toString('utf-8');
    } else {
      // Try as plain text fallback
      text = buffer.toString('utf-8');
    }

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Could not extract text from file' });
    }

    // Store original file in Supabase for viewing/download
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const extMap = {
      'application/pdf': 'pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
      'application/msword': 'doc',
      'text/plain': 'txt',
      'text/markdown': 'md'
    };
    const ext = extMap[contentType] || 'txt';
    const storedName = `doc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('workshop-audio')
      .upload(storedName, buffer, {
        contentType: contentType || 'application/octet-stream',
        upsert: false
      });

    if (uploadError) throw uploadError;

    const { data: urlData, error: urlError } = await supabase.storage
      .from('workshop-audio')
      .createSignedUrl(storedName, 31536000);

    if (urlError) throw urlError;

    return res.status(200).json({
      text: text.trim(),
      doc_url: urlData.signedUrl,
      filename: storedName,
      original_name: origName || storedName,
      pages: contentType === 'application/pdf' ? text.split('\f').length : null
    });
  } catch (err) {
    console.error('Doc upload error:', err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
};

module.exports.config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb'
    }
  }
};
