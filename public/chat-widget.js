// The Possibility - Strategy Chat Widget
// Premium glass morphism chat with streaming, rich cards, copy, smart scroll
(function () {
  'use strict';

  var STREAM_URL = '/api/chat-stream';
  var FALLBACK_URL = '/api/chat';
  var MAX_HISTORY = 40;

  var STORAGE_KEY = 'poss-chat-history';
  var isOpen = false;
  var isExpanded = false;
  var messages = [];
  var isLoading = false;
  var userHasScrolled = false;
  var isStreaming = false;

  // --- Persistence ---
  function saveMessages() {
    try {
      var toSave = messages.slice(-MAX_HISTORY);
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ messages: toSave, ts: Date.now() }));
    } catch (e) { /* quota exceeded or private mode */ }
  }

  function loadMessages() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      var data = JSON.parse(raw);
      // Expire after 24 hours
      if (Date.now() - data.ts > 86400000) {
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }
      return data.messages || null;
    } catch (e) { return null; }
  }

  function clearHistory() {
    messages = [];
    localStorage.removeItem(STORAGE_KEY);
  }

  // --- Inject Styles ---
  var style = document.createElement('style');
  style.textContent = [

    /* ===== FAB BUTTON ===== */
    '.poss-chat-fab {',
    '  position: fixed; bottom: 28px; right: 28px; z-index: 99999;',
    '  width: 60px; height: 60px; border-radius: 50%;',
    '  background: linear-gradient(135deg, #E8758A 0%, #6366F1 40%, #34D399 70%, #2E9E9E 100%);',
    '  background-size: 300% 300%; animation: poss-fab-gradient 6s ease infinite;',
    '  border: none; cursor: pointer;',
    '  display: flex; align-items: center; justify-content: center;',
    '  transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease;',
    '  box-shadow: 0 6px 24px rgba(46,158,158,0.35), 0 2px 8px rgba(0,0,0,0.08);',
    '}',
    '@keyframes poss-fab-gradient {',
    '  0% { background-position: 0% 50%; }',
    '  50% { background-position: 100% 50%; }',
    '  100% { background-position: 0% 50%; }',
    '}',

    /* Pulse ring */
    '.poss-chat-fab::before {',
    '  content: ""; position: absolute; inset: -4px; border-radius: 50%;',
    '  background: linear-gradient(135deg, rgba(46,158,158,0.3), rgba(99,102,241,0.2));',
    '  animation: poss-pulse 3s ease-in-out infinite;',
    '  z-index: -1;',
    '}',
    '@keyframes poss-pulse {',
    '  0%, 100% { transform: scale(1); opacity: 0.6; }',
    '  50% { transform: scale(1.18); opacity: 0; }',
    '}',
    '.poss-chat-fab.open::before { animation: none; opacity: 0; }',

    '.poss-chat-fab:hover {',
    '  transform: scale(1.1);',
    '  box-shadow: 0 8px 32px rgba(46,158,158,0.5), 0 0 0 8px rgba(46,158,158,0.06);',
    '}',
    '.poss-chat-fab:active { transform: scale(0.94); }',

    /* Icon transitions */
    '.poss-chat-fab svg {',
    '  width: 26px; height: 26px; fill: white;',
    '  transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.2s;',
    '  filter: drop-shadow(0 1px 2px rgba(0,0,0,0.15));',
    '}',
    '.poss-chat-fab .icon-chat {',
    '  position: absolute;',
    '}',
    '.poss-chat-fab svg.icon-close {',
    '  position: absolute;',
    '  transform: rotate(-90deg) scale(0.6); opacity: 0;',
    '}',
    '.poss-chat-fab.open .icon-chat {',
    '  transform: rotate(90deg) scale(0.6); opacity: 0;',
    '}',
    '.poss-chat-fab.open svg.icon-close {',
    '  transform: rotate(0deg) scale(1); opacity: 1;',
    '}',

    /* ===== PANEL ===== */
    '.poss-chat-panel {',
    '  position: fixed; bottom: 100px; right: 28px; z-index: 99998;',
    '  width: 420px; max-width: calc(100vw - 56px);',
    '  height: 560px; max-height: calc(100vh - 140px);',
    '  border-radius: 24px; overflow: hidden;',
    '  background: rgba(250,248,245,0.88);',
    '  backdrop-filter: blur(60px) saturate(1.9); -webkit-backdrop-filter: blur(60px) saturate(1.9);',
    '  border: 0.5px solid rgba(255,255,255,0.5);',
    '  box-shadow:',
    '    0 24px 80px rgba(0,0,0,0.12),',
    '    0 8px 32px rgba(0,0,0,0.06),',
    '    0 0 0 0.5px rgba(255,255,255,0.4) inset,',
    '    0 0 80px rgba(46,158,158,0.04);',
    '  display: flex; flex-direction: column;',
    '  opacity: 0; transform: translateY(20px) scale(0.92); pointer-events: none;',
    '  transition: opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1),',
    '              transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);',
    '}',
    '.poss-chat-panel.visible {',
    '  opacity: 1; transform: translateY(0) scale(1); pointer-events: auto;',
    '}',

    /* Inner top-edge catch light */
    '.poss-chat-panel::before {',
    '  content: ""; position: absolute; top: 0; left: 0; right: 0;',
    '  height: 1px;',
    '  background: linear-gradient(90deg, transparent 10%, rgba(255,255,255,0.7) 50%, transparent 90%);',
    '  z-index: 5;',
    '}',

    /* ===== HEADER ===== */
    '.poss-chat-header {',
    '  padding: 18px 20px 16px; display: flex; align-items: center; gap: 12px;',
    '  border-bottom: 0.5px solid rgba(0,0,0,0.05);',
    '  background: linear-gradient(180deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.2) 100%);',
    '  position: relative;',
    '}',

    /* Gradient accent bar under header */
    '.poss-chat-header::after {',
    '  content: ""; position: absolute; bottom: -0.5px; left: 20px; right: 20px;',
    '  height: 1.5px; border-radius: 1px;',
    '  background: linear-gradient(90deg, #E8758A, #6366F1, #34D399);',
    '  opacity: 0.5;',
    '}',

    '.poss-chat-header-icon {',
    '  width: 36px; height: 36px; border-radius: 10px;',
    '  background: linear-gradient(135deg, rgba(200,165,92,0.12), rgba(200,165,92,0.06));',
    '  display: flex; align-items: center; justify-content: center;',
    '  flex-shrink: 0;',
    '}',
    '.poss-chat-header-icon svg { width: 24px; height: 24px; }',

    '.poss-chat-header-text { flex: 1; }',
    '.poss-chat-header-title {',
    '  font-size: 14.5px; font-weight: 650; color: #1A1410;',
    '  letter-spacing: -0.2px; line-height: 1.2;',
    '}',
    '.poss-chat-header-sub {',
    '  font-size: 11px; color: rgba(26,20,16,0.42); font-weight: 500;',
    '  letter-spacing: 0.2px; margin-top: 2px;',
    '}',

    '.poss-chat-header-status {',
    '  display: flex; align-items: center; gap: 5px;',
    '  padding: 4px 10px; border-radius: 100px;',
    '  background: rgba(46,158,158,0.08); flex-shrink: 0;',
    '}',
    '.poss-chat-header-status-dot {',
    '  width: 6px; height: 6px; border-radius: 50%; background: #2E9E9E;',
    '  animation: poss-status-pulse 2s ease-in-out infinite;',
    '}',
    '@keyframes poss-status-pulse {',
    '  0%, 100% { opacity: 1; } 50% { opacity: 0.4; }',
    '}',
    '.poss-chat-header-status span {',
    '  font-size: 10px; font-weight: 600; color: #2E9E9E;',
    '  letter-spacing: 0.5px; text-transform: uppercase;',
    '}',

    /* ===== MESSAGES AREA ===== */
    '.poss-chat-messages {',
    '  flex: 1; overflow-y: auto; padding: 20px 18px 12px;',
    '  display: flex; flex-direction: column; gap: 12px;',
    '  scrollbar-width: thin; scrollbar-color: rgba(0,0,0,0.08) transparent;',
    '  scroll-behavior: auto;',
    '}',
    '.poss-chat-messages::-webkit-scrollbar { width: 3px; }',
    '.poss-chat-messages::-webkit-scrollbar-track { background: transparent; }',
    '.poss-chat-messages::-webkit-scrollbar-thumb {',
    '  background: rgba(0,0,0,0.08); border-radius: 3px;',
    '}',

    /* Scroll anchor indicator */
    '.poss-chat-scroll-anchor {',
    '  position: sticky; bottom: 0; align-self: center;',
    '  width: 36px; height: 36px; border-radius: 50%;',
    '  background: rgba(255,255,255,0.9); border: 0.5px solid rgba(0,0,0,0.08);',
    '  backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);',
    '  display: flex; align-items: center; justify-content: center;',
    '  cursor: pointer; opacity: 0; pointer-events: none;',
    '  transition: opacity 0.25s, transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);',
    '  transform: translateY(8px);',
    '  box-shadow: 0 2px 12px rgba(0,0,0,0.08);',
    '  z-index: 10; margin-top: -44px;',
    '}',
    '.poss-chat-scroll-anchor.visible {',
    '  opacity: 1; pointer-events: auto; transform: translateY(0);',
    '}',
    '.poss-chat-scroll-anchor svg {',
    '  width: 16px; height: 16px; fill: #2E9E9E;',
    '}',

    /* Message bubbles */
    '.poss-chat-msg {',
    '  max-width: 82%; padding: 11px 15px; border-radius: 18px;',
    '  font-size: 13.5px; line-height: 1.6; word-wrap: break-word;',
    '  animation: poss-msg-in 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) both;',
    '  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif;',
    '  position: relative;',
    '}',
    '@keyframes poss-msg-in {',
    '  from { opacity: 0; transform: translateY(8px) scale(0.95); }',
    '  to { opacity: 1; transform: translateY(0) scale(1); }',
    '}',

    '.poss-chat-msg.user {',
    '  align-self: flex-end;',
    '  background: linear-gradient(135deg, #2E9E9E, #2AB5A0);',
    '  color: white; border-bottom-right-radius: 6px;',
    '  box-shadow: 0 2px 12px rgba(46,158,158,0.2);',
    '}',

    '.poss-chat-msg.assistant {',
    '  align-self: flex-start;',
    '  background: rgba(255,255,255,0.75);',
    '  backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);',
    '  color: #1A1410; border: 0.5px solid rgba(0,0,0,0.05);',
    '  border-bottom-left-radius: 6px;',
    '  box-shadow: 0 1px 6px rgba(0,0,0,0.03);',
    '}',
    '.poss-chat-msg.assistant strong { font-weight: 650; color: #0F0D0B; }',
    '.poss-chat-msg.assistant em { font-style: italic; color: rgba(26,20,16,0.7); }',
    '.poss-chat-msg.assistant code {',
    '  background: rgba(46,158,158,0.07); padding: 2px 6px; border-radius: 5px;',
    '  font-size: 12.5px; font-family: "SF Mono", "Fira Code", monospace;',
    '}',
    '.poss-chat-link {',
    '  color: #2E9E9E; text-decoration: none; font-weight: 550;',
    '  border-bottom: 1px solid rgba(46,158,158,0.3);',
    '  transition: border-color 0.2s, color 0.2s;',
    '  cursor: pointer;',
    '}',
    '.poss-chat-link:hover {',
    '  color: #237a7a; border-bottom-color: #2E9E9E;',
    '}',

    /* ===== COPY BUTTON ===== */
    '.poss-chat-copy-wrap {',
    '  position: relative;',
    '}',
    '.poss-chat-copy {',
    '  position: absolute; top: 8px; right: 8px;',
    '  width: 28px; height: 28px; border-radius: 8px;',
    '  background: rgba(255,255,255,0.7); border: 0.5px solid rgba(0,0,0,0.06);',
    '  backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);',
    '  display: flex; align-items: center; justify-content: center;',
    '  cursor: pointer; opacity: 0; transition: opacity 0.2s, transform 0.15s, background 0.15s;',
    '  z-index: 2;',
    '}',
    '.poss-chat-copy svg { width: 14px; height: 14px; fill: rgba(26,20,16,0.4); transition: fill 0.15s; }',
    '.poss-chat-copy-wrap:hover .poss-chat-copy { opacity: 1; }',
    '.poss-chat-copy:hover { background: rgba(46,158,158,0.1); transform: scale(1.08); }',
    '.poss-chat-copy:hover svg { fill: #2E9E9E; }',
    '.poss-chat-copy:active { transform: scale(0.92); }',
    '.poss-chat-copy.copied { background: rgba(46,158,158,0.15); }',
    '.poss-chat-copy.copied svg { fill: #2E9E9E; }',

    /* ===== RICH DATA CARDS ===== */
    '.poss-data-card {',
    '  margin: 8px 0 4px; border-radius: 14px; overflow: hidden;',
    '  border: 0.5px solid rgba(46,158,158,0.15);',
    '  background: linear-gradient(135deg, rgba(46,158,158,0.04), rgba(99,102,241,0.03));',
    '}',
    /* Pillar-coded cards */
    '.poss-data-card.pillar-release {',
    '  border-color: rgba(232,117,138,0.2);',
    '  background: linear-gradient(135deg, rgba(232,117,138,0.05), rgba(232,117,138,0.02));',
    '}',
    '.poss-data-card.pillar-release .poss-data-card-header {',
    '  background: linear-gradient(135deg, rgba(232,117,138,0.08), rgba(232,117,138,0.03));',
    '  border-bottom-color: rgba(232,117,138,0.12);',
    '}',
    '.poss-data-card.pillar-release .poss-data-card-header-icon {',
    '  background: linear-gradient(135deg, rgba(232,117,138,0.18), rgba(232,117,138,0.08));',
    '}',
    '.poss-data-card.pillar-release .poss-data-card-header-icon svg { fill: #E8758A; }',
    '.poss-data-card.pillar-release .poss-data-card-pillar { color: #E8758A; }',

    '.poss-data-card.pillar-align {',
    '  border-color: rgba(99,102,241,0.2);',
    '  background: linear-gradient(135deg, rgba(99,102,241,0.05), rgba(99,102,241,0.02));',
    '}',
    '.poss-data-card.pillar-align .poss-data-card-header {',
    '  background: linear-gradient(135deg, rgba(99,102,241,0.08), rgba(99,102,241,0.03));',
    '  border-bottom-color: rgba(99,102,241,0.12);',
    '}',
    '.poss-data-card.pillar-align .poss-data-card-header-icon {',
    '  background: linear-gradient(135deg, rgba(99,102,241,0.18), rgba(99,102,241,0.08));',
    '}',
    '.poss-data-card.pillar-align .poss-data-card-header-icon svg { fill: #6366F1; }',
    '.poss-data-card.pillar-align .poss-data-card-pillar { color: #6366F1; }',

    '.poss-data-card.pillar-become {',
    '  border-color: rgba(52,211,153,0.2);',
    '  background: linear-gradient(135deg, rgba(52,211,153,0.05), rgba(52,211,153,0.02));',
    '}',
    '.poss-data-card.pillar-become .poss-data-card-header {',
    '  background: linear-gradient(135deg, rgba(52,211,153,0.08), rgba(52,211,153,0.03));',
    '  border-bottom-color: rgba(52,211,153,0.12);',
    '}',
    '.poss-data-card.pillar-become .poss-data-card-header-icon {',
    '  background: linear-gradient(135deg, rgba(52,211,153,0.18), rgba(52,211,153,0.08));',
    '}',
    '.poss-data-card.pillar-become .poss-data-card-header-icon svg { fill: #34D399; }',
    '.poss-data-card.pillar-become .poss-data-card-pillar { color: #059669; }',

    '.poss-data-card-header {',
    '  padding: 10px 14px 8px; display: flex; align-items: center; gap: 8px;',
    '  border-bottom: 0.5px solid rgba(46,158,158,0.1);',
    '  background: linear-gradient(135deg, rgba(46,158,158,0.06), rgba(99,102,241,0.04));',
    '}',
    '.poss-data-card-header-icon {',
    '  width: 22px; height: 22px; border-radius: 6px;',
    '  background: linear-gradient(135deg, rgba(46,158,158,0.15), rgba(52,211,153,0.1));',
    '  display: flex; align-items: center; justify-content: center;',
    '  flex-shrink: 0;',
    '}',
    '.poss-data-card-header-icon svg { width: 12px; height: 12px; fill: #2E9E9E; }',
    '.poss-data-card-title {',
    '  font-size: 10.5px; font-weight: 650; color: #1A1410;',
    '  letter-spacing: 0.3px; text-transform: uppercase; flex: 1;',
    '}',
    '.poss-data-card-pillar {',
    '  font-size: 9px; font-weight: 700; letter-spacing: 0.8px;',
    '  text-transform: uppercase; color: #2E9E9E; opacity: 0.7;',
    '}',
    '.poss-data-card-body {',
    '  padding: 10px 14px 12px; font-size: 13px; line-height: 1.55; color: #1A1410;',
    '}',
    '.poss-data-card-body strong { font-weight: 650; color: #0F0D0B; }',

    /* Pillar gradient bar at bottom of cards */
    '.poss-data-card-footer {',
    '  height: 2px;',
    '  background: linear-gradient(90deg, #E8758A, #6366F1, #34D399);',
    '  opacity: 0.4;',
    '}',

    /* ===== TABLES ===== */
    '.poss-chat-table-wrap {',
    '  overflow-x: auto; margin: 8px 0;',
    '}',
    '.poss-chat-table {',
    '  border-collapse: collapse; width: 100%; font-size: 12px;',
    '}',
    '.poss-chat-table th {',
    '  background: rgba(46,158,158,0.06); font-weight: 650; color: #1A1410;',
    '  text-align: left; padding: 6px 10px;',
    '  border-bottom: 1.5px solid rgba(46,158,158,0.15);',
    '  font-size: 10.5px; letter-spacing: 0.2px; text-transform: uppercase;',
    '}',
    '.poss-chat-table td {',
    '  padding: 5px 10px; border-bottom: 0.5px solid rgba(0,0,0,0.05);',
    '  color: #1A1410;',
    '}',
    '.poss-chat-table tr:last-child td { border-bottom: none; }',
    '.poss-chat-table tr:hover td { background: rgba(46,158,158,0.03); }',

    /* ===== FOLLOW-UP CHIPS ===== */
    '.poss-chat-followups {',
    '  display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px;',
    '}',
    '.poss-chat-followup {',
    '  padding: 6px 12px; border-radius: 100px;',
    '  border: 1px solid rgba(46,158,158,0.2);',
    '  background: rgba(46,158,158,0.04);',
    '  font-size: 12px; font-weight: 500; color: #2E9E9E;',
    '  cursor: pointer; text-align: left;',
    '  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif;',
    '  transition: background 0.2s, border-color 0.2s, transform 0.15s;',
    '  line-height: 1.3;',
    '}',
    '.poss-chat-followup:hover {',
    '  background: rgba(46,158,158,0.1); border-color: rgba(46,158,158,0.35);',
    '  transform: translateY(-1px);',
    '}',
    '.poss-chat-followup:active { transform: scale(0.97); }',

    /* ===== STREAMING CURSOR ===== */
    '.poss-stream-cursor {',
    '  display: inline-block; width: 2.5px; height: 15px;',
    '  background: linear-gradient(180deg, #E8758A, #6366F1, #34D399);',
    '  background-size: 100% 300%; animation: poss-cursor-blink 0.8s ease-in-out infinite, poss-cursor-gradient 3s ease infinite;',
    '  border-radius: 1.5px; margin-left: 2px; vertical-align: text-bottom;',
    '}',
    '@keyframes poss-cursor-blink {',
    '  0%, 100% { opacity: 1; }',
    '  50% { opacity: 0.15; }',
    '}',
    '@keyframes poss-cursor-gradient {',
    '  0% { background-position: 0% 0%; }',
    '  50% { background-position: 0% 100%; }',
    '  100% { background-position: 0% 0%; }',
    '}',

    /* Typing indicator */
    '.poss-chat-typing {',
    '  align-self: flex-start; display: flex; align-items: center; gap: 4px;',
    '  padding: 14px 20px; background: rgba(255,255,255,0.75);',
    '  backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);',
    '  border-radius: 18px; border-bottom-left-radius: 6px;',
    '  border: 0.5px solid rgba(0,0,0,0.05);',
    '  animation: poss-msg-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) both;',
    '}',
    '.poss-chat-typing span {',
    '  width: 7px; height: 7px; border-radius: 50%;',
    '  background: linear-gradient(135deg, #2E9E9E, #34D399);',
    '  animation: poss-typing 1.4s ease-in-out infinite;',
    '}',
    '.poss-chat-typing span:nth-child(2) { animation-delay: 0.2s; }',
    '.poss-chat-typing span:nth-child(3) { animation-delay: 0.4s; }',
    '@keyframes poss-typing {',
    '  0%, 70%, 100% { transform: translateY(0) scale(0.85); opacity: 0.35; }',
    '  35% { transform: translateY(-8px) scale(1); opacity: 1; }',
    '}',

    /* ===== INPUT AREA ===== */
    '.poss-chat-input-area {',
    '  padding: 14px 16px 16px; display: flex; align-items: flex-end; gap: 10px;',
    '  border-top: 0.5px solid rgba(0,0,0,0.04);',
    '  background: linear-gradient(0deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.15) 100%);',
    '}',
    '.poss-chat-input {',
    '  flex: 1; border: 1px solid rgba(0,0,0,0.08);',
    '  background: rgba(255,255,255,0.65); border-radius: 14px;',
    '  padding: 10px 16px; font-size: 13.5px; color: #1A1410;',
    '  outline: none; resize: none; line-height: 1.45;',
    '  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif;',
    '  transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;',
    '}',
    '.poss-chat-input:focus {',
    '  border-color: rgba(46,158,158,0.35);',
    '  box-shadow: 0 0 0 3px rgba(46,158,158,0.08);',
    '  background: rgba(255,255,255,0.85);',
    '}',
    '.poss-chat-input::placeholder { color: rgba(26,20,16,0.3); }',

    '.poss-chat-send {',
    '  width: 40px; height: 40px; border-radius: 12px; border: none;',
    '  background: linear-gradient(135deg, #6366F1, #2E9E9E);',
    '  cursor: pointer; flex-shrink: 0;',
    '  display: flex; align-items: center; justify-content: center;',
    '  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1),',
    '              box-shadow 0.2s, opacity 0.2s;',
    '  box-shadow: 0 2px 8px rgba(46,158,158,0.25);',
    '}',
    '.poss-chat-send:hover {',
    '  transform: scale(1.06);',
    '  box-shadow: 0 4px 16px rgba(46,158,158,0.35);',
    '}',
    '.poss-chat-send:active { transform: scale(0.94); }',
    '.poss-chat-send:disabled { opacity: 0.35; cursor: default; transform: none; box-shadow: none; }',
    '.poss-chat-send svg {',
    '  width: 18px; height: 18px; fill: white;',
    '  filter: drop-shadow(0 1px 1px rgba(0,0,0,0.1));',
    '}',

    /* ===== WELCOME STATE ===== */
    '.poss-chat-welcome {',
    '  text-align: center; padding: 36px 24px 24px;',
    '  display: flex; flex-direction: column; align-items: center; gap: 14px;',
    '}',
    '.poss-chat-welcome-icon {',
    '  width: 56px; height: 56px; border-radius: 16px;',
    '  background: linear-gradient(135deg, rgba(200,165,92,0.1), rgba(200,165,92,0.05));',
    '  display: flex; align-items: center; justify-content: center;',
    '  position: relative;',
    '}',
    '.poss-chat-welcome-icon::after {',
    '  content: ""; position: absolute; inset: 0; border-radius: 16px;',
    '  border: 0.5px solid rgba(200,165,92,0.15);',
    '}',
    '.poss-chat-welcome-icon svg { width: 36px; height: 36px; }',
    '.poss-chat-welcome h3 {',
    '  font-size: 17px; font-weight: 650; color: #1A1410; margin: 0;',
    '  letter-spacing: -0.3px;',
    '}',
    '.poss-chat-welcome .poss-tagline {',
    '  font-family: "Georgia", "Times New Roman", serif;',
    '  font-style: italic; font-size: 13.5px; font-weight: 400;',
    '  color: rgba(26,20,16,0.45); letter-spacing: 0.3px; margin: 0;',
    '}',
    '.poss-chat-welcome p {',
    '  font-size: 13px; color: rgba(26,20,16,0.5); line-height: 1.6; margin: 0;',
    '  max-width: 300px;',
    '}',

    '.poss-chat-suggestions {',
    '  display: flex; flex-direction: column; gap: 5px; width: 100%; margin-top: 12px;',
    '}',
    '.poss-chat-suggestion {',
    '  padding: 10px 14px; border-radius: 12px;',
    '  border: 0.5px solid rgba(0,0,0,0.05);',
    '  background: rgba(255,255,255,0.5);',
    '  font-size: 12.5px; color: #1A1410; line-height: 1.35;',
    '  cursor: pointer; text-align: left;',
    '  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif;',
    '  transition: background 0.2s, border-color 0.2s, transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s;',
    '  display: flex; align-items: center; gap: 11px;',
    '  position: relative;',
    '}',
    '.poss-chat-suggestion .sg-icon {',
    '  width: 28px; height: 28px; border-radius: 8px;',
    '  display: flex; align-items: center; justify-content: center;',
    '  flex-shrink: 0; font-size: 13px;',
    '}',
    '.poss-chat-suggestion .sg-text {',
    '  display: flex; flex-direction: column; gap: 1px;',
    '}',
    '.poss-chat-suggestion .sg-label {',
    '  font-size: 9.5px; font-weight: 650; letter-spacing: 0.6px;',
    '  text-transform: uppercase; opacity: 0.45;',
    '}',
    '.poss-chat-suggestion .sg-question {',
    '  font-size: 12.5px; font-weight: 450;',
    '}',
    '.poss-chat-suggestion:hover {',
    '  transform: translateX(4px);',
    '  box-shadow: 0 2px 8px rgba(0,0,0,0.04);',
    '}',
    '.poss-chat-suggestion.sg-compete .sg-icon { background: rgba(239,68,68,0.08); color: #DC2626; }',
    '.poss-chat-suggestion.sg-compete:hover { background: rgba(239,68,68,0.04); border-color: rgba(239,68,68,0.12); }',
    '.poss-chat-suggestion.sg-strategy .sg-icon { background: rgba(46,158,158,0.08); color: #2E9E9E; }',
    '.poss-chat-suggestion.sg-strategy:hover { background: rgba(46,158,158,0.04); border-color: rgba(46,158,158,0.12); }',
    '.poss-chat-suggestion.sg-growth .sg-icon { background: rgba(99,102,241,0.08); color: #6366F1; }',
    '.poss-chat-suggestion.sg-growth:hover { background: rgba(99,102,241,0.04); border-color: rgba(99,102,241,0.12); }',
    '.poss-chat-suggestion.sg-data .sg-icon { background: rgba(52,211,153,0.08); color: #059669; }',
    '.poss-chat-suggestion.sg-data:hover { background: rgba(52,211,153,0.04); border-color: rgba(52,211,153,0.12); }',

    /* ===== TIMESTAMP ===== */
    '.poss-chat-timestamp {',
    '  text-align: center; font-size: 10px; color: rgba(26,20,16,0.3);',
    '  font-weight: 500; letter-spacing: 0.3px; padding: 4px 0;',
    '}',

    /* ===== EXPAND BUTTON ===== */
    '.poss-chat-expand {',
    '  width: 32px; height: 32px; border-radius: 8px; border: none;',
    '  background: rgba(0,0,0,0.04); cursor: pointer;',
    '  display: flex; align-items: center; justify-content: center;',
    '  transition: background 0.2s, transform 0.15s;',
    '  flex-shrink: 0; margin-left: auto; margin-right: 4px;',
    '}',
    '.poss-chat-expand:hover { background: rgba(46,158,158,0.1); transform: scale(1.08); }',
    '.poss-chat-expand:active { transform: scale(0.94); }',
    '.poss-chat-expand svg { width: 16px; height: 16px; fill: rgba(26,20,16,0.45); transition: fill 0.2s; }',
    '.poss-chat-expand:hover svg { fill: #2E9E9E; }',

    /* New chat button */
    '.poss-chat-new {',
    '  width: 32px; height: 32px; border-radius: 8px; border: none;',
    '  background: rgba(0,0,0,0.04); cursor: pointer;',
    '  display: flex; align-items: center; justify-content: center;',
    '  transition: background 0.2s, transform 0.15s;',
    '  flex-shrink: 0;',
    '}',
    '.poss-chat-new:hover { background: rgba(46,158,158,0.1); transform: scale(1.08); }',
    '.poss-chat-new:active { transform: scale(0.94); }',
    '.poss-chat-new svg { width: 16px; height: 16px; fill: rgba(26,20,16,0.45); transition: fill 0.2s; }',
    '.poss-chat-new:hover svg { fill: #2E9E9E; }',

    /* Export button */
    '.poss-chat-export {',
    '  width: 32px; height: 32px; border-radius: 8px; border: none;',
    '  background: rgba(0,0,0,0.04); cursor: pointer;',
    '  display: flex; align-items: center; justify-content: center;',
    '  transition: background 0.2s, transform 0.15s;',
    '  flex-shrink: 0;',
    '}',
    '.poss-chat-export:hover { background: rgba(46,158,158,0.1); transform: scale(1.08); }',
    '.poss-chat-export:active { transform: scale(0.94); }',
    '.poss-chat-export svg { width: 16px; height: 16px; fill: rgba(26,20,16,0.45); transition: fill 0.2s; }',
    '.poss-chat-export:hover svg { fill: #2E9E9E; }',

    /* Expanded state */
    '.poss-chat-panel.expanded {',
    '  bottom: 0 !important; right: 0 !important; top: 0 !important; left: 0 !important;',
    '  width: 100% !important; max-width: 100% !important;',
    '  height: 100vh !important; max-height: 100vh !important;',
    '  height: 100dvh !important; max-height: 100dvh !important;',
    '  border-radius: 0 !important;',
    '  z-index: 999999 !important;',
    '}',
    '.poss-chat-panel.expanded .poss-chat-messages {',
    '  padding: 24px 10% 16px;',
    '}',
    '.poss-chat-panel.expanded .poss-chat-msg {',
    '  max-width: 720px;',
    '  font-size: 15px;',
    '}',
    '.poss-chat-panel.expanded .poss-chat-copy-wrap {',
    '  max-width: 720px !important;',
    '}',
    '.poss-chat-panel.expanded .poss-chat-input-area {',
    '  padding: 16px 10% 20px;',
    '}',
    '.poss-chat-panel.expanded .poss-chat-input {',
    '  font-size: 15px; padding: 14px 20px; border-radius: 16px;',
    '  max-width: 720px;',
    '}',
    '.poss-chat-panel.expanded .poss-chat-welcome {',
    '  padding: 60px 24px 36px;',
    '}',
    '.poss-chat-panel.expanded .poss-chat-welcome h3 {',
    '  font-size: 22px;',
    '}',
    '.poss-chat-panel.expanded .poss-chat-suggestions {',
    '  max-width: 480px;',
    '}',
    '.poss-chat-panel.expanded .poss-data-card {',
    '  border-radius: 16px;',
    '}',

    /* Tablet expanded - constrain center column */
    '@media (min-width: 769px) {',
    '  .poss-chat-panel.expanded .poss-chat-messages {',
    '    padding: 28px calc(50% - 380px) 16px;',
    '  }',
    '  .poss-chat-panel.expanded .poss-chat-input-area {',
    '    padding: 16px calc(50% - 380px) 24px;',
    '  }',
    '}',

    /* Hide expand button on small screens (already fullscreen) */
    '@media (max-width: 480px) {',
    '  .poss-chat-expand { display: none; }',
    '}',

    /* ===== HEADER CLOSE BUTTON (mobile only) ===== */
    '.poss-chat-header-close {',
    '  display: none; width: 32px; height: 32px; border-radius: 8px; border: none;',
    '  background: rgba(0,0,0,0.04); cursor: pointer;',
    '  align-items: center; justify-content: center;',
    '  transition: background 0.2s, transform 0.15s;',
    '  flex-shrink: 0; order: 10;',
    '}',
    '.poss-chat-header-close:hover { background: rgba(0,0,0,0.08); transform: scale(1.08); }',
    '.poss-chat-header-close:active { transform: scale(0.94); }',
    '.poss-chat-header-close svg { width: 16px; height: 16px; fill: rgba(26,20,16,0.45); }',

    /* ===== MOBILE ===== */
    '@media (max-width: 480px) {',
    '  .poss-chat-panel {',
    '    bottom: 0; right: 0; left: 0; top: 0; width: 100%; max-width: 100%;',
    '    height: 100%; max-height: 100%;',
    '    height: 100dvh; max-height: 100dvh;',
    '    border-radius: 0;',
    '    transform: translateY(20px); opacity: 0;',
    '  }',
    '  .poss-chat-panel.visible {',
    '    transform: translateY(0); opacity: 1;',
    '  }',
    '  .poss-chat-fab { bottom: 20px; right: 20px; width: 54px; height: 54px; }',
    '  .poss-chat-fab.open { display: none; }',
    '  .poss-chat-header-close { display: flex; }',
    '  .poss-chat-copy { opacity: 1; }',
    '  .poss-chat-input-area {',
    '    padding-bottom: max(16px, env(safe-area-inset-bottom, 16px));',
    '  }',
    '  .poss-chat-messages {',
    '    -webkit-overflow-scrolling: touch;',
    '  }',
    '  .poss-chat-input {',
    '    font-size: 16px;',
    '  }',
    '  .poss-chat-msg {',
    '    font-size: 14px; max-width: 92%;',
    '  }',
    '  .poss-chat-header {',
    '    padding: 14px 16px 12px;',
    '  }',
    '  .poss-chat-welcome h3 {',
    '    font-size: 18px;',
    '  }',
    '  .poss-chat-welcome p {',
    '    font-size: 13px;',
    '  }',
    '  .poss-ask-section { display: none !important; }',
    '}',

    /* ===== DARK MODE ===== */
    '@media (prefers-color-scheme: dark) {',
    '  .poss-chat-panel {',
    '    background: rgba(28,25,22,0.92);',
    '    border-color: rgba(255,255,255,0.08);',
    '    box-shadow: 0 24px 80px rgba(0,0,0,0.4), 0 8px 32px rgba(0,0,0,0.2), 0 0 80px rgba(46,158,158,0.06);',
    '  }',
    '  .poss-chat-panel::before { background: linear-gradient(90deg, transparent 10%, rgba(255,255,255,0.1) 50%, transparent 90%); }',
    '  .poss-chat-header { background: linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%); border-bottom-color: rgba(255,255,255,0.06); }',
    '  .poss-chat-header-title { color: #F5F0EB; }',
    '  .poss-chat-header-sub { color: rgba(245,240,235,0.4); }',
    '  .poss-chat-header-icon { background: linear-gradient(135deg, rgba(200,165,92,0.15), rgba(200,165,92,0.08)); }',
    '  .poss-chat-msg.assistant { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.06); color: #E8E3DE; }',
    '  .poss-chat-msg.assistant strong { color: #F5F0EB; }',
    '  .poss-chat-msg.assistant em { color: rgba(245,240,235,0.6); }',
    '  .poss-chat-msg.assistant code { background: rgba(46,158,158,0.12); color: #E8E3DE; }',
    '  .poss-chat-input-area { border-top-color: rgba(255,255,255,0.04); background: linear-gradient(0deg, rgba(28,25,22,0.6) 0%, transparent 100%); }',
    '  .poss-chat-input { background: rgba(255,255,255,0.06); border-color: rgba(255,255,255,0.1); color: #F5F0EB; }',
    '  .poss-chat-input:focus { border-color: rgba(46,158,158,0.4); box-shadow: 0 0 0 3px rgba(46,158,158,0.12); background: rgba(255,255,255,0.1); }',
    '  .poss-chat-input::placeholder { color: rgba(245,240,235,0.3); }',
    '  .poss-chat-copy { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.06); }',
    '  .poss-chat-copy svg { fill: rgba(245,240,235,0.4); }',
    '  .poss-chat-copy:hover { background: rgba(46,158,158,0.15); }',
    '  .poss-chat-new, .poss-chat-export, .poss-chat-expand, .poss-chat-header-close { background: rgba(255,255,255,0.06); }',
    '  .poss-chat-new:hover, .poss-chat-export:hover, .poss-chat-expand:hover, .poss-chat-header-close:hover { background: rgba(46,158,158,0.15); }',
    '  .poss-chat-new svg, .poss-chat-export svg, .poss-chat-expand svg, .poss-chat-header-close svg { fill: rgba(245,240,235,0.4); }',
    '  .poss-chat-welcome h3 { color: #F5F0EB; }',
    '  .poss-chat-welcome p { color: rgba(245,240,235,0.5); }',
    '  .poss-chat-welcome .poss-tagline { color: rgba(245,240,235,0.35); }',
    '  .poss-chat-suggestion { background: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.06); color: #E8E3DE; }',
    '  .poss-chat-suggestion .sg-label { opacity: 0.5; }',
    '  .poss-chat-typing { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.06); }',
    '  .poss-data-card { border-color: rgba(46,158,158,0.12); background: linear-gradient(135deg, rgba(46,158,158,0.06), rgba(99,102,241,0.04)); }',
    '  .poss-data-card-header { background: linear-gradient(135deg, rgba(46,158,158,0.08), rgba(99,102,241,0.05)); border-bottom-color: rgba(46,158,158,0.1); }',
    '  .poss-data-card-title { color: #F5F0EB; }',
    '  .poss-data-card-body { color: #E8E3DE; }',
    '  .poss-data-card-body strong { color: #F5F0EB; }',
    '  .poss-chat-table th { background: rgba(46,158,158,0.1); color: #F5F0EB; border-bottom-color: rgba(46,158,158,0.2); }',
    '  .poss-chat-table td { color: #E8E3DE; border-bottom-color: rgba(255,255,255,0.04); }',
    '  .poss-chat-table tr:hover td { background: rgba(46,158,158,0.05); }',
    '  .poss-chat-followup { background: rgba(46,158,158,0.08); border-color: rgba(46,158,158,0.2); }',
    '  .poss-chat-followup:hover { background: rgba(46,158,158,0.15); }',
    '  .poss-chat-scroll-anchor { background: rgba(28,25,22,0.9); border-color: rgba(255,255,255,0.08); }',
    '  .poss-chat-timestamp { color: rgba(245,240,235,0.25); }',
    '}',
  ].join('\n');
  document.head.appendChild(style);

  // --- Possibility Logo (uses real SVG file) ---
  var LOGO_PATH = '/possibility-logo.svg';

  function makeLogo(size) {
    return '<img src="' + LOGO_PATH + '" width="' + (size || 24) + '" height="' + (size || 24) + '" alt="The Possibility" style="object-fit:contain;">';
  }

  function makeLogoWhite(size) {
    return '<img src="' + LOGO_PATH + '" width="' + (size || 26) + '" height="' + (size || 26) + '" alt="The Possibility" style="object-fit:contain;filter:brightness(0) invert(1);opacity:0.95;">';
  }

  // --- Build DOM ---
  var fab = document.createElement('button');
  fab.className = 'poss-chat-fab';
  fab.setAttribute('aria-label', 'Open strategy chat');
  fab.innerHTML =
    '<span class="icon-chat" style="position:absolute;display:flex;align-items:center;justify-content:center;transition:transform 0.35s cubic-bezier(0.34,1.56,0.64,1),opacity 0.2s;">' + makeLogoWhite(28) + '</span>' +
    '<svg class="icon-close" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>';
  document.body.appendChild(fab);

  var panel = document.createElement('div');
  panel.className = 'poss-chat-panel';
  panel.innerHTML =
    '<div class="poss-chat-header">' +
      '<div class="poss-chat-header-icon">' +
        makeLogo(24) +
      '</div>' +
      '<div class="poss-chat-header-text">' +
        '<div class="poss-chat-header-title">The Possibility</div>' +
        '<div class="poss-chat-header-sub">Strategy intelligence - Release. Align. Become.</div>' +
      '</div>' +
      '<button class="poss-chat-new" id="possChatNew" aria-label="New conversation" title="New conversation">' +
        '<svg viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>' +
      '</button>' +
      '<button class="poss-chat-export" id="possChatExport" aria-label="Export conversation" title="Export conversation">' +
        '<svg viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>' +
      '</button>' +
      '<button class="poss-chat-expand" id="possChatExpand" aria-label="Expand chat">' +
        '<svg class="expand-icon" viewBox="0 0 24 24"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>' +
        '<svg class="collapse-icon" viewBox="0 0 24 24" style="display:none;"><path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/></svg>' +
      '</button>' +
      '<div class="poss-chat-header-status">' +
        '<div class="poss-chat-header-status-dot"></div>' +
        '<span>Live</span>' +
      '</div>' +
      '<button class="poss-chat-header-close" id="possChatClose" aria-label="Close chat">' +
        '<svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>' +
      '</button>' +
    '</div>' +
    '<div class="poss-chat-messages" id="possChatMessages"></div>' +
    '<div class="poss-chat-scroll-anchor" id="possChatScrollAnchor">' +
      '<svg viewBox="0 0 24 24"><path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z"/></svg>' +
    '</div>' +
    '<div class="poss-chat-input-area">' +
      '<textarea class="poss-chat-input" id="possChatInput" placeholder="Ask about strategy, competitors, pricing..." rows="1"></textarea>' +
      '<button class="poss-chat-send" id="possChatSend" aria-label="Send message">' +
        '<svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>' +
      '</button>' +
    '</div>';
  document.body.appendChild(panel);

  var messagesEl = document.getElementById('possChatMessages');
  var inputEl = document.getElementById('possChatInput');
  var sendBtn = document.getElementById('possChatSend');
  var scrollAnchor = document.getElementById('possChatScrollAnchor');
  var expandBtn = document.getElementById('possChatExpand');
  var newChatBtn = document.getElementById('possChatNew');
  var exportBtn = document.getElementById('possChatExport');
  var closeBtn = document.getElementById('possChatClose');

  // --- Smart auto-scroll ---
  function isNearBottom() {
    var threshold = 80;
    return messagesEl.scrollHeight - messagesEl.scrollTop - messagesEl.clientHeight < threshold;
  }

  function smartScroll() {
    if (!userHasScrolled || isNearBottom()) {
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }
  }

  function updateScrollAnchor() {
    if (userHasScrolled && !isNearBottom()) {
      scrollAnchor.classList.add('visible');
    } else {
      scrollAnchor.classList.remove('visible');
      userHasScrolled = false;
    }
  }

  messagesEl.addEventListener('scroll', function () {
    if (isStreaming || isLoading) {
      if (!isNearBottom()) {
        userHasScrolled = true;
      } else {
        userHasScrolled = false;
      }
    }
    updateScrollAnchor();
  });

  scrollAnchor.addEventListener('click', function () {
    userHasScrolled = false;
    messagesEl.scrollTo({ top: messagesEl.scrollHeight, behavior: 'smooth' });
    scrollAnchor.classList.remove('visible');
  });

  // --- Welcome state (page-aware, rotating suggestions) ---
  var SUGGESTION_POOLS = {
    '/the-thesis.html': [
      { cls: 'sg-strategy', icon: '&#9670;', label: 'Thesis', q: 'What is the core investment thesis?' },
      { cls: 'sg-compete', icon: '&#9876;', label: 'Opportunity', q: 'What gap does The Possibility fill?' },
      { cls: 'sg-growth', icon: '&#9650;', label: 'Moat', q: 'What makes this defensible long term?' },
      { cls: 'sg-data', icon: '&#9632;', label: 'Projections', q: 'Walk me through the revenue projections' },
      { cls: 'sg-strategy', icon: '&#9670;', label: 'Framework', q: 'Explain Release, Align, Become' },
    ],
    '/jim-strategy-briefing.html': [
      { cls: 'sg-strategy', icon: '&#9670;', label: 'Pricing', q: 'How does our pricing compare to competitors?' },
      { cls: 'sg-compete', icon: '&#9876;', label: 'SWOT', q: 'What are our biggest strategic risks?' },
      { cls: 'sg-growth', icon: '&#9650;', label: 'Onboarding', q: 'What makes our onboarding unique?' },
      { cls: 'sg-data', icon: '&#9632;', label: 'Revenue', q: 'Break down the revenue model' },
      { cls: 'sg-strategy', icon: '&#9670;', label: 'Content', q: 'What is the content strategy?' },
    ],
    '/jim-marketing-playbook.html': [
      { cls: 'sg-compete', icon: '&#9876;', label: 'Competitive', q: 'Breakdown Waking Up\'s onboarding' },
      { cls: 'sg-strategy', icon: '&#9670;', label: 'Strategy', q: 'What should our free trial include?' },
      { cls: 'sg-growth', icon: '&#9650;', label: 'Growth', q: 'How can The Possibility win at marketing?' },
      { cls: 'sg-data', icon: '&#9632;', label: 'Intel', q: 'How does the competitive intel loop work?' },
      { cls: 'sg-compete', icon: '&#9876;', label: 'Launch', q: 'What is the launch strategy?' },
    ],
    '/the-philosophy.html': [
      { cls: 'sg-strategy', icon: '&#9670;', label: 'Philosophy', q: 'What is Jim Curtis\'s core teaching?' },
      { cls: 'sg-growth', icon: '&#9650;', label: 'Journey', q: 'Tell me about Jim\'s background' },
      { cls: 'sg-compete', icon: '&#9876;', label: 'Book', q: 'What is The Book of Possibility about?' },
      { cls: 'sg-data', icon: '&#9632;', label: 'Method', q: 'How does the transformation program work?' },
    ],
    '/executive-summary.html': [
      { cls: 'sg-strategy', icon: '&#9670;', label: 'Summary', q: 'What are the key takeaways?' },
      { cls: 'sg-growth', icon: '&#9650;', label: 'Focus', q: 'What should we focus on first?' },
      { cls: 'sg-data', icon: '&#9632;', label: 'Recs', q: 'Walk me through the recommendations' },
    ],
    '/pricing-strategy.html': [
      { cls: 'sg-strategy', icon: '&#9670;', label: 'Model', q: 'What pricing model are we using?' },
      { cls: 'sg-compete', icon: '&#9876;', label: 'Trial', q: 'Why a 14-day free trial?' },
      { cls: 'sg-data', icon: '&#9632;', label: 'Compare', q: 'How does our pricing compare to competitors?' },
      { cls: 'sg-growth', icon: '&#9650;', label: 'Free Tier', q: 'Should we have a free tier?' },
    ],
    '/retention-playbook.html': [
      { cls: 'sg-strategy', icon: '&#9670;', label: 'Retention', q: 'What is our retention strategy?' },
      { cls: 'sg-data', icon: '&#9632;', label: 'First 14', q: 'What happens in the first 14 days?' },
      { cls: 'sg-compete', icon: '&#9876;', label: 'Benchmarks', q: 'What are competitor retention rates?' },
      { cls: 'sg-growth', icon: '&#9650;', label: 'Habits', q: 'How do we build habit loops?' },
    ],
    '/onboarding-teardown.html': [
      { cls: 'sg-compete', icon: '&#9876;', label: 'Teardown', q: 'How do competitors handle onboarding?' },
      { cls: 'sg-strategy', icon: '&#9670;', label: 'Principles', q: 'What are the onboarding design principles?' },
      { cls: 'sg-data', icon: '&#9632;', label: 'Metrics', q: 'What onboarding metrics should we track?' },
    ],
    '/free-trial-flow.html': [
      { cls: 'sg-strategy', icon: '&#9670;', label: 'Trial', q: 'How does the free trial conversion work?' },
      { cls: 'sg-growth', icon: '&#9650;', label: 'Journey', q: 'Walk me through the 14-day journey' },
      { cls: 'sg-compete', icon: '&#9876;', label: 'Compare', q: 'How do competitors handle trials?' },
    ],
    '/content-architecture.html': [
      { cls: 'sg-strategy', icon: '&#9670;', label: 'Sessions', q: 'How long should meditation sessions be?' },
      { cls: 'sg-data', icon: '&#9632;', label: 'Library', q: 'How many sessions do we need at launch?' },
      { cls: 'sg-compete', icon: '&#9876;', label: 'Types', q: 'What content types should we build?' },
      { cls: 'sg-growth', icon: '&#9650;', label: 'Science', q: 'What does the behavioral science say?' },
    ],
    '/variance-analysis.html': [
      { cls: 'sg-strategy', icon: '&#9670;', label: 'Analysis', q: 'What are the key strategic variances?' },
      { cls: 'sg-data', icon: '&#9632;', label: 'Scenarios', q: 'Walk me through the scenario analysis' },
      { cls: 'sg-growth', icon: '&#9650;', label: 'Pricing', q: 'What pricing risks should we watch?' },
    ],
    default: [
      { cls: 'sg-compete', icon: '&#9876;', label: 'Competitive', q: 'Breakdown Waking Up\'s onboarding' },
      { cls: 'sg-strategy', icon: '&#9670;', label: 'Strategy', q: 'What should our free trial include?' },
      { cls: 'sg-growth', icon: '&#9650;', label: 'Growth', q: 'How can The Possibility win at marketing?' },
      { cls: 'sg-data', icon: '&#9632;', label: 'Data', q: 'What are the key industry benchmarks?' },
    ]
  };

  function getPageSuggestions() {
    var pool = SUGGESTION_POOLS[window.location.pathname] || SUGGESTION_POOLS['default'];
    // Shuffle and take 3
    var shuffled = pool.slice();
    for (var i = shuffled.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = shuffled[i]; shuffled[i] = shuffled[j]; shuffled[j] = tmp;
    }
    return shuffled.slice(0, 3);
  }

  function showWelcome() {
    var suggestions = getPageSuggestions();
    var suggestionsHtml = '';
    for (var i = 0; i < suggestions.length; i++) {
      var s = suggestions[i];
      suggestionsHtml += '<button class="poss-chat-suggestion ' + s.cls + '">' +
        '<div class="sg-icon">' + s.icon + '</div>' +
        '<div class="sg-text"><span class="sg-label">' + s.label + '</span><span class="sg-question">' + s.q + '</span></div>' +
        '</button>';
    }

    messagesEl.innerHTML =
      '<div class="poss-chat-welcome">' +
        '<div class="poss-chat-welcome-icon">' +
          makeLogo(48) +
        '</div>' +
        '<h3>The Possibility</h3>' +
        '<p class="poss-tagline">Release. Align. Become.</p>' +
        '<div class="poss-chat-suggestions">' + suggestionsHtml + '</div>' +
      '</div>';

    var suggestions = messagesEl.querySelectorAll('.poss-chat-suggestion');
    suggestions.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var questionEl = btn.querySelector('.sg-question');
        sendMessage(questionEl ? questionEl.textContent : btn.textContent);
      });
    });
  }

  // --- Follow-up chip click handler ---
  messagesEl.addEventListener('click', function (e) {
    var chip = e.target.closest('[data-followup]');
    if (!chip) return;
    var question = chip.getAttribute('data-followup');
    if (question) sendMessage(question);
  });

  // --- Chat link click handler (smooth scroll to sections) ---
  messagesEl.addEventListener('click', function (e) {
    var link = e.target.closest('[data-chat-link]');
    if (!link) return;
    e.preventDefault();

    var href = link.getAttribute('href');
    if (!href) return;

    // Parse the href to determine if it's same-page or cross-page
    var hashIndex = href.indexOf('#');
    var pagePath = hashIndex > 0 ? href.slice(0, hashIndex) : (hashIndex === 0 ? '' : href);
    var sectionId = hashIndex >= 0 ? href.slice(hashIndex + 1) : '';

    var currentPath = window.location.pathname;
    // Normalize paths: /the-thesis.html and /the-thesis should match
    var normalizedPage = pagePath.replace(/\.html$/, '');
    var normalizedCurrent = currentPath.replace(/\.html$/, '').replace(/\/$/, '');

    if (!pagePath || normalizedPage === normalizedCurrent) {
      // Same page: smooth scroll to the section
      if (sectionId) {
        var target = document.getElementById(sectionId);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    } else {
      // Different page: navigate there
      window.location.href = href;
    }
  });

  // --- Copy SVG icons ---
  var COPY_ICON = '<svg viewBox="0 0 24 24"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>';
  var CHECK_ICON = '<svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>';
  var CARD_ICON = '<svg viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM7 10h2v7H7zm4-3h2v10h-2zm4 6h2v4h-2z"/></svg>';

  // --- Render helpers ---

  // Parse :::card TITLE ... ::: blocks out of markdown
  function parseCards(text) {
    var parts = [];
    var regex = /:::card\s+(.+?)\n([\s\S]*?):::/g;
    var lastIndex = 0;
    var match;

    while ((match = regex.exec(text)) !== null) {
      // Text before card
      if (match.index > lastIndex) {
        parts.push({ type: 'text', content: text.slice(lastIndex, match.index) });
      }
      parts.push({ type: 'card', title: match[1].trim(), content: match[2].trim() });
      lastIndex = regex.lastIndex;
    }

    // Remaining text
    if (lastIndex < text.length) {
      parts.push({ type: 'text', content: text.slice(lastIndex) });
    }

    return parts.length > 0 ? parts : [{ type: 'text', content: text }];
  }

  function formatMarkdown(text) {
    // Markdown tables - process before other formatting
    text = text.replace(/((?:^\|.+\|$\n?){2,})/gm, function(tableBlock) {
      var rows = tableBlock.trim().split('\n');
      if (rows.length < 2) return tableBlock;
      var html = '<div class="poss-chat-table-wrap"><table class="poss-chat-table">';
      for (var r = 0; r < rows.length; r++) {
        var row = rows[r].trim();
        if (!row.startsWith('|')) continue;
        // Skip separator row (|---|---|)
        if (/^\|[\s\-:]+\|/.test(row) && row.indexOf('---') !== -1) continue;
        var cells = row.split('|').filter(function(c, i, arr) { return i > 0 && i < arr.length - 1; });
        var tag = r === 0 ? 'th' : 'td';
        html += '<tr>';
        for (var c = 0; c < cells.length; c++) {
          html += '<' + tag + '>' + cells[c].trim() + '</' + tag + '>';
        }
        html += '</tr>';
      }
      html += '</table></div>';
      return html;
    });
    // Markdown links [text](url) - parse before bold since link text may contain bold
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, function(match, linkText, href) {
      return '<a class="poss-chat-link" href="' + escapeHtml(href) + '" data-chat-link="true">' + linkText + '</a>';
    });
    // Bold
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Italic
    text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
    // Inline code
    text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
    // Bullet lists
    text = text.replace(/^[-] (.+)/gm, '<span style="display:flex;gap:8px;align-items:baseline;"><span style="color:#2E9E9E;font-weight:700;flex-shrink:0;">-</span><span>$1</span></span>');
    // Numbered lists
    text = text.replace(/^(\d+)\. (.+)/gm, '<span style="display:flex;gap:8px;align-items:baseline;"><span style="color:#2E9E9E;font-weight:600;flex-shrink:0;font-size:12px;">$1.</span><span>$2</span></span>');
    // Line breaks
    text = text.replace(/\n/g, '<br>');
    return text;
  }

  // Detect pillar from card title/content
  function detectPillar(title, content) {
    var combined = (title + ' ' + content).toLowerCase();
    // Weighted keyword matching for each pillar
    var releaseWords = ['release', 'let go', 'anxiety', 'stress', 'churn', 'pain point', 'problem', 'frustration', 'competitor', 'weakness', 'gap', 'risk'];
    var alignWords = ['align', 'strategy', 'position', 'framework', 'approach', 'pricing', 'model', 'conversion', 'funnel', 'comparison', 'benchmark'];
    var becomeWords = ['become', 'growth', 'scale', 'revenue', 'projection', 'future', 'potential', 'opportunity', 'vision', 'target', 'goal'];

    var rScore = 0, aScore = 0, bScore = 0;
    releaseWords.forEach(function(w) { if (combined.indexOf(w) !== -1) rScore++; });
    alignWords.forEach(function(w) { if (combined.indexOf(w) !== -1) aScore++; });
    becomeWords.forEach(function(w) { if (combined.indexOf(w) !== -1) bScore++; });

    if (rScore > aScore && rScore > bScore) return 'release';
    if (bScore > aScore && bScore > rScore) return 'become';
    if (aScore > 0) return 'align';
    return '';
  }

  var PILLAR_LABELS = { release: 'Release', align: 'Align', become: 'Become' };
  var PILLAR_ICONS = {
    release: '<svg viewBox="0 0 24 24"><path d="M14 6l-3.75 5 2.85 3.8-1.6 1.2C9.81 13.75 7 10 7 10l-6 8h22L14 6z"/></svg>',
    align: '<svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>',
    become: '<svg viewBox="0 0 24 24"><path d="M12 2L9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2z"/></svg>'
  };

  function renderCard(title, content) {
    var pillar = detectPillar(title, content);
    var pillarClass = pillar ? ' pillar-' + pillar : '';

    var html = '<div class="poss-data-card' + pillarClass + '">';
    html += '<div class="poss-data-card-header">';
    html += '<div class="poss-data-card-header-icon">' + (pillar && PILLAR_ICONS[pillar] ? PILLAR_ICONS[pillar] : CARD_ICON) + '</div>';
    html += '<div class="poss-data-card-title">' + escapeHtml(title) + '</div>';
    if (pillar) {
      html += '<div class="poss-data-card-pillar">' + PILLAR_LABELS[pillar] + '</div>';
    }
    html += '</div>';
    html += '<div class="poss-data-card-body">' + formatMarkdown(content) + '</div>';
    html += '<div class="poss-data-card-footer"></div>';
    html += '</div>';
    return html;
  }

  // Parse :::followups ... ::: blocks out of text
  function extractFollowups(text) {
    var regex = /:::followups\n([\s\S]*?):::/g;
    var followups = [];
    var cleaned = text.replace(regex, function(match, content) {
      var lines = content.trim().split('\n');
      for (var i = 0; i < lines.length; i++) {
        var line = lines[i].trim().replace(/^\d+[\.\)]\s*/, '').replace(/^[-*]\s*/, '');
        if (line) followups.push(line);
      }
      return '';
    });
    return { text: cleaned.trim(), followups: followups };
  }

  function renderFollowups(followups) {
    if (!followups || followups.length === 0) return '';
    var html = '<div class="poss-chat-followups">';
    for (var i = 0; i < followups.length; i++) {
      html += '<button class="poss-chat-followup" data-followup="' + escapeHtml(followups[i]) + '">' + escapeHtml(followups[i]) + '</button>';
    }
    html += '</div>';
    return html;
  }

  function formatReply(text, includeFollowups) {
    var result = extractFollowups(text);
    var parts = parseCards(result.text);
    var html = '';
    for (var i = 0; i < parts.length; i++) {
      if (parts[i].type === 'card') {
        html += renderCard(parts[i].title, parts[i].content);
      } else {
        html += formatMarkdown(parts[i].content);
      }
    }
    if (includeFollowups !== false) {
      html += renderFollowups(result.followups);
    }
    return html;
  }

  function clearWelcome() {
    var welcome = messagesEl.querySelector('.poss-chat-welcome');
    if (welcome) {
      welcome.style.opacity = '0';
      welcome.style.transform = 'scale(0.95)';
      welcome.style.transition = 'opacity 0.2s, transform 0.2s';
      setTimeout(function () { welcome.remove(); }, 200);
    }
  }

  var lastTimestamp = 0;

  function formatTimestamp(date) {
    var now = Date.now();
    var diff = now - date;
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago';
    if (diff < 86400000) return Math.floor(diff / 3600000) + 'h ago';
    return new Date(date).toLocaleDateString();
  }

  function maybeAddTimestamp() {
    var now = Date.now();
    // Show timestamp if more than 5 minutes since last one
    if (now - lastTimestamp > 300000) {
      lastTimestamp = now;
      var ts = document.createElement('div');
      ts.className = 'poss-chat-timestamp';
      ts.textContent = formatTimestamp(now);
      messagesEl.appendChild(ts);
    }
  }

  function appendMessage(role, content) {
    clearWelcome();
    maybeAddTimestamp();

    if (role === 'assistant') {
      // Wrap assistant messages in copy-wrap
      var wrap = document.createElement('div');
      wrap.className = 'poss-chat-copy-wrap';
      wrap.style.alignSelf = 'flex-start';
      wrap.style.maxWidth = '82%';

      var div = document.createElement('div');
      div.className = 'poss-chat-msg assistant';
      div.style.maxWidth = '100%';
      div.innerHTML = formatReply(content);

      var copyBtn = document.createElement('button');
      copyBtn.className = 'poss-chat-copy';
      copyBtn.setAttribute('aria-label', 'Copy message');
      copyBtn.innerHTML = COPY_ICON;
      copyBtn.addEventListener('click', function () {
        copyToClipboard(content, copyBtn);
      });

      wrap.appendChild(div);
      wrap.appendChild(copyBtn);
      messagesEl.appendChild(wrap);
    } else {
      var div = document.createElement('div');
      div.className = 'poss-chat-msg user';
      div.innerHTML = escapeHtml(content);
      messagesEl.appendChild(div);
    }

    smartScroll();
  }

  // --- Restore previous conversation or show welcome ---
  var savedMessages = loadMessages();
  if (savedMessages && savedMessages.length > 0) {
    messages = savedMessages;
    for (var i = 0; i < messages.length; i++) {
      appendMessage(messages[i].role, messages[i].content);
    }
  } else {
    showWelcome();
  }

  // Create a streaming message element and return controls
  function createStreamingMessage() {
    clearWelcome();

    var wrap = document.createElement('div');
    wrap.className = 'poss-chat-copy-wrap';
    wrap.style.alignSelf = 'flex-start';
    wrap.style.maxWidth = '82%';

    var div = document.createElement('div');
    div.className = 'poss-chat-msg assistant';
    div.style.maxWidth = '100%';
    div.innerHTML = '<span class="poss-stream-cursor"></span>';

    wrap.appendChild(div);
    messagesEl.appendChild(wrap);
    smartScroll();

    var rawText = '';
    var displayText = '';
    var charBuffer = '';
    var dripping = false;

    function dripChars() {
      if (charBuffer.length === 0) { dripping = false; return; }
      dripping = true;
      // Drip 2-4 chars at a time for natural feel
      var chunkSize = Math.min(3, charBuffer.length);
      displayText += charBuffer.slice(0, chunkSize);
      charBuffer = charBuffer.slice(chunkSize);
      div.innerHTML = formatReply(displayText, false) + '<span class="poss-stream-cursor"></span>';
      smartScroll();
      requestAnimationFrame(dripChars);
    }

    return {
      element: div,
      wrapElement: wrap,
      append: function (chunk) {
        rawText += chunk;
        charBuffer += chunk;
        if (!dripping) dripChars();
      },
      finish: function () {
        // Flush remaining buffer
        displayText = rawText;
        charBuffer = '';
        dripping = false;
        // Final render without cursor, with followups
        div.innerHTML = formatReply(rawText);

        // Add copy button
        var copyBtn = document.createElement('button');
        copyBtn.className = 'poss-chat-copy';
        copyBtn.setAttribute('aria-label', 'Copy message');
        copyBtn.innerHTML = COPY_ICON;
        copyBtn.addEventListener('click', function () {
          copyToClipboard(rawText, copyBtn);
        });
        wrap.appendChild(copyBtn);

        return rawText;
      },
      getRawText: function () {
        return rawText;
      }
    };
  }

  function showTyping() {
    var div = document.createElement('div');
    div.className = 'poss-chat-typing';
    div.id = 'possChatTyping';
    div.innerHTML = '<span></span><span></span><span></span>';
    messagesEl.appendChild(div);
    smartScroll();
  }

  function hideTyping() {
    var el = document.getElementById('possChatTyping');
    if (el) {
      el.style.opacity = '0';
      el.style.transition = 'opacity 0.15s';
      setTimeout(function () { el.remove(); }, 150);
    }
  }

  function escapeHtml(text) {
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // --- Copy to clipboard ---
  function copyToClipboard(text, btn) {
    // Strip markdown formatting for plain text copy
    var plain = text
      .replace(/:::card\s+.+?\n/g, '')
      .replace(/:::/g, '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/`([^`]+)`/g, '$1')
      .trim();

    navigator.clipboard.writeText(plain).then(function () {
      btn.classList.add('copied');
      btn.innerHTML = CHECK_ICON;
      setTimeout(function () {
        btn.classList.remove('copied');
        btn.innerHTML = COPY_ICON;
      }, 2000);
    }).catch(function () {
      // Fallback for older browsers
      var textarea = document.createElement('textarea');
      textarea.value = plain;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      btn.classList.add('copied');
      btn.innerHTML = CHECK_ICON;
      setTimeout(function () {
        btn.classList.remove('copied');
        btn.innerHTML = COPY_ICON;
      }, 2000);
    });
  }

  // --- Send message (streaming) ---
  async function sendMessage(text) {
    if (!text || !text.trim() || isLoading) return;
    text = text.trim();

    messages.push({ role: 'user', content: text });
    saveMessages();
    appendMessage('user', text);
    inputEl.value = '';
    autoResize();
    isLoading = true;
    isStreaming = false;
    userHasScrolled = false;
    sendBtn.disabled = true;
    showTyping();

    try {
      // Try streaming first
      var resp = await fetch(STREAM_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messages.slice(-MAX_HISTORY),
          currentPage: window.location.pathname,
        }),
      });

      hideTyping();
      await new Promise(function (r) { setTimeout(r, 120); });

      if (!resp.ok) {
        // If stream endpoint fails, fall back to non-streaming
        var fallbackResp = await fetch(FALLBACK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: messages.slice(-MAX_HISTORY),
            currentPage: window.location.pathname,
          }),
        });
        var fallbackData = await fallbackResp.json();
        if (!fallbackResp.ok) {
          appendMessage('assistant', 'Something went wrong: ' + (fallbackData.detail || fallbackData.error || 'Unknown error'));
        } else {
          messages.push({ role: 'assistant', content: fallbackData.reply });
          saveMessages();
          appendMessage('assistant', fallbackData.reply);
        }
      } else {
        // Stream the response
        isStreaming = true;
        var stream = createStreamingMessage();
        var reader = resp.body.getReader();
        var decoder = new TextDecoder();
        var buffer = '';

        while (true) {
          var result = await reader.read();
          if (result.done) break;

          buffer += decoder.decode(result.value, { stream: true });

          // Process SSE lines
          var lines = buffer.split('\n');
          buffer = lines.pop();

          for (var i = 0; i < lines.length; i++) {
            var line = lines[i].trim();
            if (!line || !line.startsWith('data: ')) continue;

            var data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              var parsed = JSON.parse(data);
              if (parsed.content) {
                stream.append(parsed.content);
              }
              if (parsed.error) {
                stream.append('\n\n[Stream error: ' + parsed.error + ']');
              }
            } catch (e) {
              // Skip malformed chunks
            }
          }
        }

        var finalText = stream.finish();
        isStreaming = false;
        messages.push({ role: 'assistant', content: finalText });
        saveMessages();
      }
    } catch (err) {
      hideTyping();
      isStreaming = false;
      await new Promise(function (r) { setTimeout(r, 120); });
      appendMessage('assistant', 'Connection error. Please check your internet and try again.');
    }

    isLoading = false;
    sendBtn.disabled = false;
    inputEl.focus();
    updateScrollAnchor();
  }

  // --- Auto-resize textarea ---
  function autoResize() {
    inputEl.style.height = 'auto';
    inputEl.style.height = Math.min(inputEl.scrollHeight, 100) + 'px';
  }

  // --- Expand / collapse ---
  function toggleExpand() {
    isExpanded = !isExpanded;
    panel.classList.toggle('expanded', isExpanded);
    var expandIcon = expandBtn.querySelector('.expand-icon');
    var collapseIcon = expandBtn.querySelector('.collapse-icon');
    expandIcon.style.display = isExpanded ? 'none' : '';
    collapseIcon.style.display = isExpanded ? '' : 'none';
    expandBtn.setAttribute('aria-label', isExpanded ? 'Collapse chat' : 'Expand chat');
    // Hide FAB when expanded
    fab.style.display = isExpanded ? 'none' : '';
    smartScroll();
  }

  expandBtn.addEventListener('click', toggleExpand);

  newChatBtn.addEventListener('click', function () {
    clearHistory();
    messagesEl.innerHTML = '';
    showWelcome();
  });

  exportBtn.addEventListener('click', function () {
    if (messages.length === 0) return;
    var text = 'The Possibility - Strategy Chat Export\n';
    text += 'Date: ' + new Date().toLocaleDateString() + '\n';
    text += '='.repeat(50) + '\n\n';
    for (var i = 0; i < messages.length; i++) {
      var label = messages[i].role === 'user' ? 'You' : 'The Possibility';
      var content = messages[i].content
        .replace(/:::card\s+.+?\n/g, '')
        .replace(/:::followups[\s\S]*?:::/g, '')
        .replace(/:::/g, '')
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .trim();
      text += label + ':\n' + content + '\n\n';
    }
    var blob = new Blob([text], { type: 'text/plain' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'possibility-chat-' + new Date().toISOString().slice(0, 10) + '.txt';
    a.click();
    URL.revokeObjectURL(url);
  });

  // --- Event listeners ---
  fab.addEventListener('click', function () {
    isOpen = !isOpen;
    fab.classList.toggle('open', isOpen);
    panel.classList.toggle('visible', isOpen);
    if (isOpen) {
      setTimeout(function () { inputEl.focus(); }, 400);
    } else {
      panel.style.height = '';
      panel.style.maxHeight = '';
    }
  });

  closeBtn.addEventListener('click', function () {
    isOpen = false;
    fab.classList.remove('open');
    panel.classList.remove('visible');
    panel.style.height = '';
    panel.style.maxHeight = '';
  });

  sendBtn.addEventListener('click', function () {
    sendMessage(inputEl.value);
  });

  inputEl.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputEl.value);
    }
  });

  inputEl.addEventListener('input', autoResize);

  // --- Mobile keyboard: resize panel to visible viewport ---
  if (window.visualViewport) {
    var vpHandler = function () {
      if (!isOpen) return;
      var vv = window.visualViewport;
      // Only apply on mobile-sized screens
      if (window.innerWidth > 480) return;
      panel.style.height = vv.height + 'px';
      panel.style.maxHeight = vv.height + 'px';
      // Scroll input into view
      setTimeout(function () { smartScroll(); }, 50);
    };
    window.visualViewport.addEventListener('resize', vpHandler);
    window.visualViewport.addEventListener('scroll', vpHandler);
    // Reset when chat closes
    var origClose = closeBtn.onclick;
    closeBtn.addEventListener('click', function () {
      panel.style.height = '';
      panel.style.maxHeight = '';
    });
  }

  // Prevent body scroll when chat is open on mobile
  panel.addEventListener('touchmove', function (e) {
    e.stopPropagation();
  }, { passive: true });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (isExpanded) {
        toggleExpand();
      } else if (isOpen) {
        isOpen = false;
        fab.classList.remove('open');
        panel.classList.remove('visible');
      }
    }
  });

  // --- "Ask about this section" floating button ---
  var SECTION_IDS = {
    '/the-thesis.html': { hero: 'The Thesis Hero', 'the-letter': 'The Letter', opportunity: 'The Opportunity', 'the-gap': 'The Gap', framework: 'The Framework', engine: 'The Engine', moat: 'The Moat', projections: 'Projections' },
    '/jim-strategy-briefing.html': { hero: 'Strategy Hero', thesis: 'The Thesis', landscape: 'Competitive Landscape', swot: 'SWOT Analysis', churn: 'Churn Factors', who: 'Target Audience', framework: 'Framework', differentiators: 'Differentiators', content: 'Content Strategy', taxonomy: 'Content Taxonomy', programs: 'Programs', onboarding: 'Onboarding', pricing: 'Pricing', trial: 'Free Trial', book: 'The Book', launch: 'Launch Strategy', 'revenue-model': 'Revenue Model', funnel: 'Conversion Funnel', jimai: 'Jim AI', presence: 'Brand Presence', trust: 'Trust', tech: 'Tech Stack', design: 'Design', features: 'Features', showcase: 'App Showcase' },
    '/jim-marketing-playbook.html': { hero: 'Playbook Hero', competitors: 'Competitor Analysis', 'jim-intro': 'Jim Introduction', 'intel-loop': 'Intel Loop', 'book-funnel': 'Book Funnel', scoreboard: 'Scoreboard', 'jim-ai': 'Jim AI', 'app-showcase': 'App Showcase', 'our-solution': 'Our Solution', platform: 'Platform', implementation: 'Implementation', sources: 'Sources', 'unfair-advantage': 'Unfair Advantage', launch: 'Launch', featuring: 'App Store Featuring' },
    '/the-philosophy.html': { hero: 'Philosophy Hero', 'the-man': 'The Man', journey: 'The Journey', program: 'The Program', teachings: 'Teachings', book: 'The Book', toolkit: 'Toolkit', quotes: 'Quotes', worldview: 'Worldview', essence: 'The Essence', sources: 'Sources' },
    '/executive-summary.html': { hero: 'Executive Summary Hero', takeaways: 'Key Takeaways', focus: 'Strategic Focus', recommendations: 'Recommendations' },
    '/pricing-strategy.html': { hero: 'Pricing Hero', rule: 'The Rule', model: 'Pricing Model', 'trial-length': 'Trial Length', 'free-tier': 'Free Tier', 'credit-card': 'Credit Card', pricing: 'Price Points', scholarship: 'Scholarship', transition: 'Transition', checklist: 'Checklist', architecture: 'Architecture' },
    '/retention-playbook.html': { hero: 'Retention Hero', problem: 'The Problem', funnel: 'Retention Funnel', first14: 'First 14 Days', habits: 'Habit Building', notifications: 'Notifications', lifecycle: 'Lifecycle', competitors: 'Competitors', architecture: 'Architecture', targets: 'Targets' },
    '/onboarding-teardown.html': { hero: 'Onboarding Hero', cost: 'Cost of Churn', competitors: 'Competitor Teardowns', comparison: 'Comparison', options: 'Options', principles: 'Design Principles', metrics: 'Metrics' },
    '/free-trial-flow.html': { hero: 'Trial Hero', 'bold-claim': 'Bold Claim', philosophy: 'Philosophy', 'the-journey': 'The Journey', 'conversion-engine': 'Conversion Engine', 'after-trial': 'After Trial', competitors: 'Competitors' },
    '/content-architecture.html': { duration: 'Session Duration', completion: 'Completion Rates', types: 'Content Types', library: 'Library at Launch', durations: 'Duration Architecture', lifecycle: 'Lifecycle Mapping', science: 'Behavioral Science', competitive: 'Competitive Intel', production: 'Production Roadmap', recommendation: 'The Recommendation' },
    '/variance-analysis.html': { hero: 'Variance Hero', overview: 'Overview', alignment: 'Alignment', 'locked-content': 'Locked Content', 'trial-length': 'Trial Length', pricing: 'Pricing', 'morning-anchor': 'Morning Anchor', scenarios: 'Scenarios', paths: 'Paths' }
  };

  var currentPageSections = SECTION_IDS[window.location.pathname] || {};
  var sectionElements = [];
  Object.keys(currentPageSections).forEach(function (id) {
    var el = document.getElementById(id);
    if (el) sectionElements.push({ el: el, id: id, name: currentPageSections[id] });
  });

  if (sectionElements.length > 0) {
    var askBtn = document.createElement('button');
    askBtn.className = 'poss-ask-section';
    askBtn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/></svg><span></span>';
    askBtn.style.cssText = 'position:fixed;bottom:100px;right:28px;z-index:99997;display:none;align-items:center;gap:8px;padding:8px 14px 8px 10px;border-radius:100px;border:1px solid rgba(46,158,158,0.2);background:rgba(255,255,255,0.92);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);cursor:pointer;font-size:12px;font-weight:550;color:#2E9E9E;font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text",system-ui,sans-serif;box-shadow:0 4px 16px rgba(0,0,0,0.08);transition:transform 0.2s,opacity 0.3s,box-shadow 0.2s;opacity:0;transform:translateY(8px);';
    document.body.appendChild(askBtn);

    var currentSection = null;

    function updateAskButton() {
      if (isOpen) {
        askBtn.style.display = 'none';
        return;
      }
      var scrollY = window.scrollY + window.innerHeight * 0.4;
      var found = null;
      for (var i = sectionElements.length - 1; i >= 0; i--) {
        if (sectionElements[i].el.offsetTop <= scrollY) {
          found = sectionElements[i];
          break;
        }
      }
      if (found && found.id !== 'hero') {
        if (currentSection !== found.id) {
          currentSection = found.id;
          askBtn.querySelector('span').textContent = 'Ask about ' + found.name;
        }
        askBtn.style.display = 'flex';
        requestAnimationFrame(function () {
          askBtn.style.opacity = '1';
          askBtn.style.transform = 'translateY(0)';
        });
      } else {
        askBtn.style.opacity = '0';
        askBtn.style.transform = 'translateY(8px)';
        setTimeout(function () {
          if (askBtn.style.opacity === '0') askBtn.style.display = 'none';
        }, 300);
        currentSection = null;
      }
    }

    var askScrollTimer;
    window.addEventListener('scroll', function () {
      clearTimeout(askScrollTimer);
      askScrollTimer = setTimeout(updateAskButton, 100);
    }, { passive: true });

    askBtn.addEventListener('mouseenter', function () {
      askBtn.style.transform = 'translateY(-2px)';
      askBtn.style.boxShadow = '0 6px 24px rgba(46,158,158,0.2)';
    });
    askBtn.addEventListener('mouseleave', function () {
      askBtn.style.transform = 'translateY(0)';
      askBtn.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)';
    });

    askBtn.addEventListener('click', function () {
      if (!currentSection) return;
      var name = currentPageSections[currentSection];
      // Open chat and prefill
      if (!isOpen) {
        isOpen = true;
        fab.classList.add('open');
        panel.classList.add('visible');
      }
      inputEl.value = 'Tell me about the ' + name + ' section';
      inputEl.focus();
      autoResize();
      askBtn.style.display = 'none';
    });

    // Hide ask button when chat opens
    var origFabClick = fab.onclick;
    fab.addEventListener('click', function () {
      setTimeout(updateAskButton, 50);
    });
  }
})();
