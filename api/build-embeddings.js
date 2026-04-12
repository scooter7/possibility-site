#!/usr/bin/env node

/**
 * build-embeddings.js
 *
 * Reads strategy markdown docs, chunks them by heading sections (~500 tokens),
 * calls OpenAI text-embedding-3-small, and writes embeddings.json.
 *
 * Usage:
 *   OPENAI_API_KEY=sk-... node api/build-embeddings.js
 *   node api/build-embeddings.js --key sk-...
 */

const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const DOCS_DIR = path.resolve(__dirname, '../../The Possibility/docs');
const KNOWLEDGE_FILE = path.join(__dirname, 'knowledge.txt');
const PAGES_CONTENT_FILE = path.join(__dirname, 'pages-content.txt');
const OUTPUT_FILE = path.join(__dirname, 'embeddings.json');

const SOURCE_FILES = [
  'COMPETITIVE_ANALYSIS.md',
  'MARKETING_AUTOMATION.md',
  'ENDEL_COMPETITIVE_INTEL.md',
  'VISION.md',
  'FEATURES.md',
  'APPLE_FEATURING_STRATEGY.md',
  'PILLAR_SYSTEM.md',
  'CONTENT_DATA.md',
];

const EMBEDDING_MODEL = 'text-embedding-3-small';
const MAX_TOKENS_PER_CHUNK = 500;
// Rough chars-per-token ratio for English markdown
const CHARS_PER_TOKEN = 4;
const MAX_CHARS_PER_CHUNK = MAX_TOKENS_PER_CHUNK * CHARS_PER_TOKEN;
const OVERLAP_CHARS = 200; // ~50 token overlap between chunks
const BATCH_SIZE = 50; // embeddings per API call (API max is 2048)

// ---------------------------------------------------------------------------
// Resolve API key
// ---------------------------------------------------------------------------

function getApiKey() {
  // Check CLI arg first: --key sk-...
  const keyArgIdx = process.argv.indexOf('--key');
  if (keyArgIdx !== -1 && process.argv[keyArgIdx + 1]) {
    return process.argv[keyArgIdx + 1];
  }
  if (process.env.OPENAI_API_KEY) {
    return process.env.OPENAI_API_KEY;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Chunking
// ---------------------------------------------------------------------------

/**
 * Split markdown content into chunks by heading sections.
 * Falls back to paragraph splitting for sections that exceed MAX_CHARS_PER_CHUNK.
 */
function chunkMarkdown(content, sourceFile) {
  const chunks = [];
  // Split on ## or ### headings (keep the heading with its section)
  const sections = splitByHeadings(content);

  for (const section of sections) {
    const heading = section.heading || sourceFile;
    const text = section.text.trim();
    if (!text) continue;

    if (text.length <= MAX_CHARS_PER_CHUNK) {
      chunks.push({
        source: sourceFile,
        heading: heading,
        text: text,
      });
    } else {
      // Section too large - split by paragraphs with overlap
      const subChunks = splitByParagraphs(text, heading, sourceFile);
      chunks.push(...subChunks);
    }
  }

  return chunks;
}

/**
 * Split markdown by ## and ### headings.
 * Returns array of { heading, text } objects.
 */
function splitByHeadings(content) {
  const lines = content.split('\n');
  const sections = [];
  let currentHeading = '';
  let currentLines = [];

  for (const line of lines) {
    // Match ## or ### headings (but not # which is the doc title - include it in first section)
    if (/^#{2,3}\s+/.test(line)) {
      // Save previous section
      if (currentLines.length > 0) {
        sections.push({
          heading: currentHeading,
          text: currentLines.join('\n'),
        });
      }
      currentHeading = line.replace(/^#{2,3}\s+/, '').trim();
      currentLines = [line];
    } else {
      currentLines.push(line);
    }
  }

  // Don't forget the last section
  if (currentLines.length > 0) {
    sections.push({
      heading: currentHeading,
      text: currentLines.join('\n'),
    });
  }

  return sections;
}

/**
 * Split a large text block into chunks by paragraphs, with overlap.
 */
function splitByParagraphs(text, heading, sourceFile) {
  const paragraphs = text.split(/\n\n+/);
  const chunks = [];
  let currentChunk = '';
  let chunkIndex = 0;

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) continue;

    const combined = currentChunk ? currentChunk + '\n\n' + trimmed : trimmed;

    if (combined.length > MAX_CHARS_PER_CHUNK && currentChunk) {
      // Save current chunk
      chunks.push({
        source: sourceFile,
        heading: chunkIndex === 0 ? heading : `${heading} (cont. ${chunkIndex})`,
        text: currentChunk.trim(),
      });
      chunkIndex++;

      // Start new chunk with overlap from end of previous
      const overlapText = currentChunk.slice(-OVERLAP_CHARS);
      currentChunk = overlapText + '\n\n' + trimmed;
    } else {
      currentChunk = combined;
    }
  }

  // Final chunk
  if (currentChunk.trim()) {
    chunks.push({
      source: sourceFile,
      heading: chunkIndex === 0 ? heading : `${heading} (cont. ${chunkIndex})`,
      text: currentChunk.trim(),
    });
  }

  return chunks;
}

/**
 * Chunk the knowledge.txt file (not markdown - uses === sections).
 */
function chunkKnowledgeFile(content) {
  const chunks = [];
  // Split on === HEADING === pattern
  const sections = content.split(/\n(?====\s)/);

  for (const section of sections) {
    const text = section.trim();
    if (!text) continue;

    // Extract heading from === HEADING === pattern
    const headingMatch = text.match(/^===\s*(.+?)\s*===$/m);
    const heading = headingMatch ? headingMatch[1] : 'General';

    if (text.length <= MAX_CHARS_PER_CHUNK) {
      chunks.push({
        source: 'knowledge.txt',
        heading: heading,
        text: text,
      });
    } else {
      const subChunks = splitByParagraphs(text, heading, 'knowledge.txt');
      chunks.push(...subChunks);
    }
  }

  return chunks;
}

/**
 * Chunk pages-content.txt (extracted HTML page content).
 * Uses ======== PAGE TITLE / Source: ... ======== as page delimiters,
 * and === HEADING ===, == HEADING ==, = HEADING = as section markers.
 */
function chunkPagesContent(content) {
  const chunks = [];

  // Split into pages by the ======== delimiter
  const pages = content.split(/\n(?=={8,})/);

  for (const page of pages) {
    const trimmed = page.trim();
    if (!trimmed) continue;

    // Extract page name from header block
    const headerMatch = trimmed.match(/={8,}\s*\n\s*(.+?)\s*\n\s*Source:\s*(.+?)\s*\n\s*={8,}/);
    const pageName = headerMatch ? headerMatch[1].trim() : 'Page';
    const sourceFile = headerMatch ? headerMatch[2].trim() : 'pages-content.txt';

    // Remove the header block
    const bodyText = trimmed.replace(/={8,}[\s\S]*?={8,}\n?/, '').trim();
    if (!bodyText) continue;

    // Split by section headings (===, ==, =)
    const sectionRegex = /^(?:={1,3})\s+(.+?)\s+(?:={1,3})$/gm;
    let lastIndex = 0;
    let lastHeading = pageName;
    let match;

    const sections = [];
    while ((match = sectionRegex.exec(bodyText)) !== null) {
      if (match.index > lastIndex) {
        sections.push({
          heading: lastHeading,
          text: bodyText.slice(lastIndex, match.index).trim(),
        });
      }
      lastHeading = match[1].trim();
      lastIndex = sectionRegex.lastIndex;
    }
    // Final section
    if (lastIndex < bodyText.length) {
      sections.push({
        heading: lastHeading,
        text: bodyText.slice(lastIndex).trim(),
      });
    }

    // Chunk each section
    for (const section of sections) {
      if (!section.text) continue;
      const fullHeading = `${pageName} > ${section.heading}`;
      const sourceName = `[PAGE] ${sourceFile}`;

      if (section.text.length <= MAX_CHARS_PER_CHUNK) {
        chunks.push({
          source: sourceName,
          heading: fullHeading,
          text: section.text,
        });
      } else {
        const subChunks = splitByParagraphs(section.text, fullHeading, sourceName);
        chunks.push(...subChunks);
      }
    }
  }

  return chunks;
}

// ---------------------------------------------------------------------------
// OpenAI Embeddings API
// ---------------------------------------------------------------------------

async function embedBatch(texts, apiKey) {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: texts,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(
      `OpenAI embeddings API error ${response.status}: ${err.error?.message || response.statusText}`
    );
  }

  const data = await response.json();
  // API returns embeddings sorted by index
  return data.data.sort((a, b) => a.index - b.index).map((d) => d.embedding);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.error(
      'Error: No OpenAI API key found.\n' +
        'Set OPENAI_API_KEY env var or pass --key sk-...'
    );
    process.exit(1);
  }

  console.log('Reading source documents...');

  let allChunks = [];

  // Process markdown files
  for (const file of SOURCE_FILES) {
    const filePath = path.join(DOCS_DIR, file);
    if (!fs.existsSync(filePath)) {
      console.warn(`  Warning: ${file} not found, skipping`);
      continue;
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    const chunks = chunkMarkdown(content, file);
    console.log(`  ${file}: ${chunks.length} chunks`);
    allChunks.push(...chunks);
  }

  // Process pages-content.txt (PRIMARY source - actual page content)
  // These chunks are added FIRST so they appear before other sources in retrieval
  let pageChunks = [];
  if (fs.existsSync(PAGES_CONTENT_FILE)) {
    const content = fs.readFileSync(PAGES_CONTENT_FILE, 'utf-8');
    const chunks = chunkPagesContent(content);
    console.log(`  pages-content.txt: ${chunks.length} chunks (PRIMARY)`);
    pageChunks = chunks;
  }

  // Prepend page chunks so they get priority in dedup (first seen wins)
  allChunks = [...pageChunks, ...allChunks];

  // Process knowledge.txt
  if (fs.existsSync(KNOWLEDGE_FILE)) {
    const content = fs.readFileSync(KNOWLEDGE_FILE, 'utf-8');
    const chunks = chunkKnowledgeFile(content);
    console.log(`  knowledge.txt: ${chunks.length} chunks`);
    allChunks.push(...chunks);
  }

  console.log(`\nTotal chunks: ${allChunks.length}`);

  // Deduplicate chunks that are very similar (exact text match)
  const seen = new Set();
  allChunks = allChunks.filter((chunk) => {
    // Use first 200 chars as dedup key (catches exact dupes and near-dupes)
    const key = chunk.text.slice(0, 200);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  console.log(`After dedup: ${allChunks.length} chunks`);

  // Embed in batches
  console.log(`\nEmbedding with ${EMBEDDING_MODEL}...`);
  const totalBatches = Math.ceil(allChunks.length / BATCH_SIZE);

  for (let i = 0; i < allChunks.length; i += BATCH_SIZE) {
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const batch = allChunks.slice(i, i + BATCH_SIZE);
    const texts = batch.map((c) => c.text);

    process.stdout.write(`  Batch ${batchNum}/${totalBatches} (${batch.length} chunks)...`);
    const embeddings = await embedBatch(texts, apiKey);

    for (let j = 0; j < batch.length; j++) {
      batch[j].embedding = embeddings[j];
    }
    console.log(' done');

    // Small delay between batches to be polite to the API
    if (i + BATCH_SIZE < allChunks.length) {
      await new Promise((r) => setTimeout(r, 200));
    }
  }

  // Build output (text + embedding per chunk, no raw content bloat)
  const output = allChunks.map((chunk) => ({
    source: chunk.source,
    heading: chunk.heading,
    text: chunk.text,
    embedding: chunk.embedding,
  }));

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output));
  const sizeMB = (fs.statSync(OUTPUT_FILE).size / 1024 / 1024).toFixed(1);
  console.log(`\nWrote ${OUTPUT_FILE} (${sizeMB} MB, ${output.length} chunks)`);
}

main().catch((err) => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
