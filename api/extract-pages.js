#!/usr/bin/env node
/**
 * Extract visible text content from the three HTML pages.
 * No external dependencies required.
 */
const fs = require('fs');
const path = require('path');

// IMPORTANT: Do NOT add marketing-plan.html here. That page contains
// client-facing pricing and proposal details that the AI chat must never
// reference or expose. It is intentionally excluded from all AI knowledge sources.
const pages = [
  { file: 'public/the-thesis.html', title: 'THE THESIS' },
  { file: 'public/jim-strategy-briefing.html', title: 'STRATEGIC BRIEFING' },
  { file: 'public/jim-marketing-playbook.html', title: 'MARKETING AUTOMATION PLAYBOOK' },
  { file: 'public/executive-summary.html', title: 'EXECUTIVE SUMMARY' },
  { file: 'public/pricing-strategy.html', title: 'PRICING STRATEGY' },
  { file: 'public/retention-playbook.html', title: 'RETENTION PLAYBOOK' },
  { file: 'public/onboarding-teardown.html', title: 'ONBOARDING TEARDOWN' },
  { file: 'public/free-trial-flow.html', title: 'FREE TRIAL FLOW' },
  { file: 'public/content-architecture.html', title: 'CONTENT ARCHITECTURE & SESSION DESIGN' },
  { file: 'public/variance-analysis.html', title: 'VARIANCE ANALYSIS' },
  { file: 'public/taxonomy.html', title: 'CONTENT TAXONOMY' },
  { file: 'public/competitive-landscape.html', title: 'COMPETITIVE LANDSCAPE' },
  { file: 'public/waking-up-teardown.html', title: 'WAKING UP TEARDOWN' },
  { file: 'public/book-app-integration.html', title: 'BOOK + APP INTEGRATION' },
  { file: 'public/post-trial-conversion.html', title: 'POST-TRIAL CONVERSION STRATEGY' },
];

const ROOT = path.resolve(__dirname, '..');

function extractText(html) {
  let body = html;

  // Extract only <body> content
  const bodyMatch = body.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  if (bodyMatch) body = bodyMatch[1];

  // Remove <style> blocks
  body = body.replace(/<style[\s\S]*?<\/style>/gi, '');

  // Remove <script> blocks
  body = body.replace(/<script[\s\S]*?<\/script>/gi, '');

  // Remove <noscript> blocks
  body = body.replace(/<noscript[\s\S]*?<\/noscript>/gi, '');

  // Remove aria-hidden="true" elements (self-closing or with content)
  // Handle nested tags by repeating
  for (let i = 0; i < 5; i++) {
    body = body.replace(/<([a-z][a-z0-9]*)\b[^>]*aria-hidden\s*=\s*"true"[^>]*>[\s\S]*?<\/\1>/gi, '');
    body = body.replace(/<([a-z][a-z0-9]*)\b[^>]*aria-hidden\s*=\s*"true"[^>]*\/>/gi, '');
  }

  // Remove navigation elements
  // Helper: remove a block element with nested children by counting open/close tags
  function removeBlock(html, openPattern) {
    let result = html;
    let match;
    while ((match = openPattern.exec(result)) !== null) {
      const tagName = match[1].toLowerCase();
      const startIdx = match.index;
      // Count nested tags to find the correct closing tag
      let depth = 1;
      let pos = startIdx + match[0].length;
      const openRe = new RegExp(`<${tagName}\\b`, 'gi');
      const closeRe = new RegExp(`</${tagName}>`, 'gi');
      let endIdx = -1;
      while (depth > 0 && pos < result.length) {
        openRe.lastIndex = pos;
        closeRe.lastIndex = pos;
        const nextOpen = openRe.exec(result);
        const nextClose = closeRe.exec(result);
        if (!nextClose) break;
        if (nextOpen && nextOpen.index < nextClose.index) {
          depth++;
          pos = nextOpen.index + nextOpen[0].length;
        } else {
          depth--;
          if (depth === 0) {
            endIdx = nextClose.index + nextClose[0].length;
          }
          pos = nextClose.index + nextClose[0].length;
        }
      }
      if (endIdx > startIdx) {
        result = result.substring(0, startIdx) + result.substring(endIdx);
        openPattern.lastIndex = startIdx; // reset for next search
      } else {
        break; // couldn't find close, bail
      }
    }
    return result;
  }

  // Remove sidebar nav
  body = removeBlock(body, /<(nav)\b[^>]*class="[^"]*sidebar[^"]*"[^>]*>/gi);

  // Remove top-nav
  body = removeBlock(body, /<(nav)\b[^>]*class="[^"]*top-nav[^"]*"[^>]*>/gi);

  // Remove mob-overlay (both nav and div variants)
  body = removeBlock(body, /<(nav)\b[^>]*class="[^"]*mob-overlay[^"]*"[^>]*>/gi);
  body = removeBlock(body, /<(div)\b[^>]*class="[^"]*mob-overlay[^"]*"[^>]*>/gi);

  // Remove mob-burger buttons
  body = removeBlock(body, /<(button)\b[^>]*class="[^"]*mob-burger[^"]*"[^>]*>/gi);

  // Scroll progress bar
  body = removeBlock(body, /<(div)\b[^>]*class="[^"]*scroll-progress[^"]*"[^>]*>/gi);

  // Remove SVG elements
  body = body.replace(/<svg[\s\S]*?<\/svg>/gi, '');

  // Remove <img> tags entirely (we don't want alt text per instructions)
  body = body.replace(/<img[^>]*>/gi, '');

  // Collapse inline <span> tags so heading text flows together
  body = body.replace(/<span[^>]*>/gi, '');
  body = body.replace(/<\/span>/gi, '');

  // Convert headings to markers, collapsing internal whitespace
  function collapseWS(match, content, tag) {
    // Preserve <br> as newlines, then collapse remaining whitespace
    const cleaned = content.replace(/<br\s*\/?>/gi, '\n').replace(/\s+/g, ' ').trim();
    const levels = { h1: '===', h2: '==', h3: '=', h4: '=', h5: '=', h6: '=' };
    const marker = levels[tag.toLowerCase()] || '=';
    return `\n${marker} ${cleaned} ${marker}\n`;
  }
  body = body.replace(/<(h1)[^>]*>([\s\S]*?)<\/h1>/gi, (m, tag, c) => collapseWS(m, c, tag));
  body = body.replace(/<(h2)[^>]*>([\s\S]*?)<\/h2>/gi, (m, tag, c) => collapseWS(m, c, tag));
  body = body.replace(/<(h3)[^>]*>([\s\S]*?)<\/h3>/gi, (m, tag, c) => collapseWS(m, c, tag));
  body = body.replace(/<(h4)[^>]*>([\s\S]*?)<\/h4>/gi, (m, tag, c) => collapseWS(m, c, tag));
  body = body.replace(/<(h5)[^>]*>([\s\S]*?)<\/h5>/gi, (m, tag, c) => collapseWS(m, c, tag));
  body = body.replace(/<(h6)[^>]*>([\s\S]*?)<\/h6>/gi, (m, tag, c) => collapseWS(m, c, tag));

  // Convert blockquotes
  body = body.replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, '\n> $1\n');

  // Convert list items
  body = body.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '- $1\n');

  // Convert <br> to newline
  body = body.replace(/<br\s*\/?>/gi, '\n');

  // Convert block elements to newlines
  body = body.replace(/<\/(p|div|section|article|header|footer|main|aside|figure|figcaption|ul|ol|table|tr|td|th|thead|tbody|details|summary)>/gi, '\n');
  body = body.replace(/<(p|div|section|article|header|footer|main|aside|figure|figcaption|ul|ol|table|tr|details|summary)\b[^>]*>/gi, '\n');

  // Remove all remaining HTML tags
  body = body.replace(/<[^>]+>/g, '');

  // Decode common HTML entities
  body = body.replace(/&amp;/g, '&');
  body = body.replace(/&lt;/g, '<');
  body = body.replace(/&gt;/g, '>');
  body = body.replace(/&quot;/g, '"');
  body = body.replace(/&#39;/g, "'");
  body = body.replace(/&apos;/g, "'");
  body = body.replace(/&nbsp;/g, ' ');
  body = body.replace(/&#8212;/g, '\u2014');
  body = body.replace(/&#8220;/g, '\u201C');
  body = body.replace(/&#8221;/g, '\u201D');
  body = body.replace(/&#8216;/g, '\u2018');
  body = body.replace(/&#8217;/g, '\u2019');
  body = body.replace(/&rarr;/g, '\u2192');
  body = body.replace(/&larr;/g, '\u2190');
  body = body.replace(/&darr;/g, '\u2193');
  body = body.replace(/&uarr;/g, '\u2191');
  body = body.replace(/&middot;/g, '\u00B7');
  body = body.replace(/&ndash;/g, '\u2013');
  body = body.replace(/&mdash;/g, '\u2014');
  body = body.replace(/&hellip;/g, '\u2026');
  body = body.replace(/&bull;/g, '\u2022');
  body = body.replace(/&copy;/g, '\u00A9');
  body = body.replace(/&trade;/g, '\u2122');
  body = body.replace(/&reg;/g, '\u00AE');
  body = body.replace(/&lsquo;/g, '\u2018');
  body = body.replace(/&rsquo;/g, '\u2019');
  body = body.replace(/&ldquo;/g, '\u201C');
  body = body.replace(/&rdquo;/g, '\u201D');
  body = body.replace(/&#\d+;/g, ''); // remove any remaining numeric entities
  body = body.replace(/&[a-z]+;/g, ''); // remove any remaining named entities

  // Clean up heading markers: strip inner tags that were already converted
  // (headings may have had <span> etc inside them, now just text)

  // Trim each line, remove blank-only lines, collapse multiple blank lines
  const lines = body.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  // Collapse runs of identical lines
  const deduped = [];
  for (const line of lines) {
    if (deduped.length === 0 || deduped[deduped.length - 1] !== line) {
      deduped.push(line);
    }
  }

  return deduped.join('\n');
}

// Build output
let output = '';

for (const page of pages) {
  const filePath = path.join(ROOT, page.file);
  const html = fs.readFileSync(filePath, 'utf8');
  const text = extractText(html);

  output += `${'='.repeat(72)}\n`;
  output += `  ${page.title}\n`;
  output += `  Source: ${page.file}\n`;
  output += `${'='.repeat(72)}\n\n`;
  output += text;
  output += '\n\n\n';
}

// Final cleanup: no more than 2 consecutive blank lines
output = output.replace(/\n{4,}/g, '\n\n\n');
output = output.trim() + '\n';

const outPath = path.join(ROOT, 'api', 'pages-content.txt');
fs.writeFileSync(outPath, output, 'utf8');

const wordCount = output.split(/\s+/).filter(w => w.length > 0).length;
const lineCount = output.split('\n').length;
console.log(`Written to: ${outPath}`);
console.log(`Lines: ${lineCount}`);
console.log(`Words: ${wordCount}`);
console.log(`Size: ${(Buffer.byteLength(output) / 1024).toFixed(1)} KB`);
