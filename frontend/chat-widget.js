/* ============================================================
   Crawford Coaching — Floating Chat Widget
   Drop this <script> tag before </body> on any page.
   ============================================================ */
(function() {
  'use strict';

  const FUNCTION_URL = 'https://yxndmpwqvdatkujcukdv.supabase.co/functions/v1/faq-bot';
  const STORAGE_KEY  = 'crawford_chat_history';
  const MAX_HISTORY  = 20;
  const WELCOME      = "Hi — I'm Scott's AI assistant. Ask me anything about coaching, Synergize Fitness, the WHOLE Program, or general health and fitness.";
  const currentScript = document.currentScript ||
    Array.from(document.getElementsByTagName('script')).find((script) =>
      /chat-widget\.js(?:\?|$)/.test(script.src)
    );
  const scriptBase = currentScript?.src
    ? new URL('.', currentScript.src).href
    : `${window.location.origin}/`;
  const LOGO_URL = new URL('scottlogo.png', scriptBase).href;

  const SHORTCUTS = [
    "What is coaching, exactly?",
    "Am I fit enough for Synergize?",
    "What is the WHOLE Program?",
    "What groups have free spots?",
    "How much does coaching cost?",
    "What's the difference between coaching and training?",
    "Tell me your closure dates",
  ];

  // ── FONTS (inject if not already on page) ─────────────────
  if (!document.querySelector('link[href*="Cormorant+Garamond"]')) {
    const preconnect1 = document.createElement('link');
    preconnect1.rel = 'preconnect';
    preconnect1.href = 'https://fonts.googleapis.com';
    document.head.appendChild(preconnect1);

    const preconnect2 = document.createElement('link');
    preconnect2.rel = 'preconnect';
    preconnect2.href = 'https://fonts.gstatic.com';
    preconnect2.crossOrigin = 'anonymous';
    document.head.appendChild(preconnect2);

    const fontLink = document.createElement('link');
    fontLink.rel = 'stylesheet';
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500&family=Jost:wght@200;300;400;500&display=swap';
    document.head.appendChild(fontLink);
  }

  // ── STYLES ──────────────────────────────────────────────────
  const css = `
  #cc-widget-btn {
    position: fixed;
    bottom: 2rem;
    right: 2rem;
    z-index: 9998;
    background: #1c2330;
    border: 1px solid rgba(45,134,196,0.4);
    border-radius: 1px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.7rem;
    padding: 0.6rem 1rem 0.6rem 0.6rem;
    box-shadow: 0 4px 24px rgba(0,0,0,0.5);
    transition: border-color 0.2s, transform 0.2s, background 0.2s;
  }
  #cc-widget-btn:hover {
    background: #232f3e;
    border-color: rgba(45,134,196,0.7);
    transform: translateY(-2px);
  }
  .cc-widget-avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    overflow: hidden;
    flex-shrink: 0;
    border: 1px solid rgba(45,134,196,0.4);
  }
  .cc-widget-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center top;
  }
  .cc-widget-label {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.1rem;
  }
  .cc-widget-label-name {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-weight: 400;
    font-size: 0.95rem;
    color: #f5f3ef;
    line-height: 1;
    white-space: nowrap;
  }
  .cc-widget-label-sub {
    font-family: 'Jost', sans-serif;
    font-weight: 300;
    font-size: 0.58rem;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: #c8d4de;
    white-space: nowrap;
  }
  #cc-widget-btn .cc-badge {
    position: absolute;
    top: -4px;
    right: -4px;
    width: 9px;
    height: 9px;
    background: #7a9b6d;
    border-radius: 50%;
    border: 2px solid #0e0f10;
  }

  #cc-widget-panel {
    position: fixed;
    bottom: 5.5rem;
    right: 2rem;
    z-index: 9999;
    width: 380px;
    max-height: 580px;
    display: flex;
    flex-direction: column;
    background: #0e0f10;
    border: 1px solid rgba(255,255,255,0.08);
    box-shadow: 0 16px 48px rgba(0,0,0,0.6);
    transform: translateY(12px) scale(0.97);
    opacity: 0;
    pointer-events: none;
    transition: transform 0.25s ease, opacity 0.2s ease;
    font-family: 'Jost', -apple-system, sans-serif;
    -webkit-font-smoothing: antialiased;
  }
  #cc-widget-panel.open {
    transform: translateY(0) scale(1);
    opacity: 1;
    pointer-events: all;
  }

  /* Header */
  .ccw-header {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    padding: 0.9rem 1rem;
    border-bottom: 1px solid rgba(255,255,255,0.07);
    background: #1c2330;
    flex-shrink: 0;
  }
  .ccw-avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    overflow: hidden;
    flex-shrink: 0;
    border: 1px solid rgba(45,134,196,0.35);
  }
  .ccw-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center top;
  }
  .ccw-title {
    flex: 1;
    min-width: 0;
  }
  .ccw-title strong {
    display: block;
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-weight: 400;
    font-size: 1rem;
    color: #f5f3ef;
    line-height: 1.1;
  }
  .ccw-title span {
    font-size: 0.6rem;
    font-weight: 200;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: #c8d4de;
  }
  .ccw-header-btns {
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }
  .ccw-btn-sm {
    background: none;
    border: 1px solid rgba(122,143,163,0.25);
    color: #7a8fa3;
    font-family: 'Jost', sans-serif;
    font-size: 0.6rem;
    font-weight: 300;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    padding: 0.3rem 0.6rem;
    cursor: pointer;
    border-radius: 1px;
    transition: color 0.2s, border-color 0.2s;
    white-space: nowrap;
  }
  .ccw-btn-sm:hover { color: #c8d4de; border-color: rgba(122,143,163,0.5); }
  .ccw-close {
    background: none;
    border: none;
    color: #7a8fa3;
    font-size: 1.1rem;
    line-height: 1;
    cursor: pointer;
    padding: 0.2rem 0.3rem;
    transition: color 0.2s;
  }
  .ccw-close:hover { color: #f5f3ef; }

  /* Disclaimer */
  .ccw-disclaimer {
    overflow: hidden;
    max-height: 0;
    transition: max-height 0.3s ease;
    flex-shrink: 0;
  }
  .ccw-disclaimer.open { max-height: 200px; }
  .ccw-disclaimer-inner {
    padding: 0.8rem 1rem;
    background: #1c2330;
    border-bottom: 1px solid rgba(255,255,255,0.06);
    font-size: 0.72rem;
    font-weight: 300;
    line-height: 1.6;
    color: #7a8fa3;
  }
  .ccw-disclaimer-inner strong { color: #c8d4de; font-weight: 400; }
  .ccw-disclaimer-label {
    font-size: 0.58rem;
    font-weight: 400;
    letter-spacing: 0.26em;
    text-transform: uppercase;
    color: #2d86c4;
    margin-bottom: 0.5rem;
  }
  .ccw-disclaimer-inner a { color: #2d86c4; }

  /* Shortcuts */
  .ccw-shortcuts {
    padding: 0.7rem 1rem;
    border-bottom: 1px solid rgba(255,255,255,0.06);
    flex-shrink: 0;
    overflow: hidden;
    max-height: 150px;
    opacity: 1;
    transition: max-height 0.22s ease, opacity 0.18s ease, padding 0.2s;
  }
  .ccw-shortcuts.hidden {
    max-height: 0;
    opacity: 0;
    padding-top: 0;
    padding-bottom: 0;
  }
  .ccw-shortcuts-label {
    font-size: 0.58rem;
    font-weight: 300;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: #7a8fa3;
    margin-bottom: 0.5rem;
  }
  .ccw-shortcuts-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }
  .ccw-shortcut {
    font-family: 'Jost', sans-serif;
    font-size: 0.68rem;
    font-weight: 300;
    color: #7a8fa3;
    background: none;
    border: 1px solid rgba(122,143,163,0.2);
    padding: 0.3rem 0.7rem;
    border-radius: 1px;
    cursor: pointer;
    transition: color 0.2s, border-color 0.2s, background 0.2s;
    text-align: left;
    line-height: 1.3;
  }
  .ccw-shortcut:hover {
    color: #f5f3ef;
    border-color: rgba(45,134,196,0.5);
    background: rgba(45,134,196,0.06);
  }

  /* Chat box */
  .ccw-chat {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    scroll-behavior: smooth;
    background: #0e0f10;
  }
  .ccw-chat::-webkit-scrollbar { width: 3px; }
  .ccw-chat::-webkit-scrollbar-thumb { background: #3d4a58; }

  .ccw-msg {
    max-width: 85%;
    font-size: 0.82rem;
    line-height: 1.6;
    font-weight: 300;
    animation: ccwIn 0.18s ease;
  }
  @keyframes ccwIn {
    from { opacity: 0; transform: translateY(5px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .ccw-msg.user {
    align-self: flex-end;
    background: #2d86c4;
    color: #f5f3ef;
    padding: 0.6rem 0.9rem;
  }
  .ccw-msg.assistant {
    align-self: flex-start;
    background: #1c2330;
    color: #c8d4de;
    padding: 0.7rem 0.9rem;
    border-left: 2px solid rgba(45,134,196,0.4);
  }
  .ccw-msg.assistant p + p { margin-top: 0.4rem; }
  .ccw-msg.assistant ul { margin: 0.4rem 0 0.4rem 1rem; }
  .ccw-msg.assistant li { margin-bottom: 0.25rem; }
  .ccw-msg.assistant strong { color: #f5f3ef; font-weight: 400; }
  .ccw-msg.assistant a {
    color: #5eaee6;
    text-decoration: underline;
    text-underline-offset: 2px;
    word-break: break-word;
  }
  .ccw-msg.assistant a:hover { color: #8ec8f0; }

  .ccw-typing {
    align-self: flex-start;
    display: flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0.6rem 0.9rem;
    background: #1c2330;
    border-left: 2px solid rgba(45,134,196,0.4);
  }
  .ccw-typing span {
    width: 4px;
    height: 4px;
    background: #7a8fa3;
    border-radius: 50%;
    animation: ccwDot 1.2s infinite;
  }
  .ccw-typing span:nth-child(2) { animation-delay: 0.2s; }
  .ccw-typing span:nth-child(3) { animation-delay: 0.4s; }
  @keyframes ccwDot {
    0%,80%,100% { opacity:0.3; transform:scale(0.8); }
    40% { opacity:1; transform:scale(1); }
  }

  /* Input */
  .ccw-input-area {
    display: flex;
    border-top: 1px solid rgba(255,255,255,0.07);
    flex-shrink: 0;
  }
  #ccw-input {
    flex: 1;
    background: #1c2330;
    border: none;
    color: #f5f3ef;
    font-family: 'Jost', sans-serif;
    font-weight: 300;
    font-size: 0.82rem;
    padding: 0.75rem 0.9rem;
    outline: none;
    border-right: 1px solid rgba(255,255,255,0.06);
    transition: background 0.2s;
  }
  #ccw-input::placeholder { color: #3d4a58; }
  #ccw-input:focus { background: #232f3e; }
  .ccw-send {
    background: #2d86c4;
    border: none;
    color: #f5f3ef;
    font-family: 'Jost', sans-serif;
    font-weight: 400;
    font-size: 0.65rem;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    padding: 0.75rem 1rem;
    cursor: pointer;
    transition: background 0.2s;
    white-space: nowrap;
  }
  .ccw-send:hover { background: #4fa3d8; }
  .ccw-send:disabled { background: #3d4a58; cursor: not-allowed; }

  @media (max-width: 480px) {
    #cc-widget-panel {
      right: 0;
      bottom: 0;
      width: 100vw;
      max-height: 80vh;
      border-left: none;
      border-right: none;
      border-bottom: none;
    }
    #cc-widget-btn {
      bottom: 1.2rem;
      right: 1.2rem;
    }
  }
  `;

  // ── HTML ─────────────────────────────────────────────────────
  const html = `
  <button id="cc-widget-btn" onclick="ccwToggle()" aria-label="Ask Scott">
    <div class="cc-widget-avatar">
      <img src="${LOGO_URL}" alt="Scott Crawford">
    </div>
    <div class="cc-widget-label">
      <span class="cc-widget-label-name">Ask Scott</span>
      <span class="cc-widget-label-sub">Instant answers</span>
    </div>
    <div class="cc-badge"></div>
  </button>

  <div id="cc-widget-panel" role="dialog" aria-label="Ask Scott assistant">
    <div class="ccw-header">
      <div class="ccw-avatar">
        <img src="${LOGO_URL}" alt="Scott Crawford">
      </div>
      <div class="ccw-title">
        <strong>Ask Scott</strong>
        <span>AI Assistant · Crawford Coaching</span>
      </div>
      <div class="ccw-header-btns">
        <button class="ccw-btn-sm" onclick="ccwToggleDisclaimer()">i</button>
        <button class="ccw-btn-sm" onclick="ccwClear()">Clear</button>
        <button class="ccw-close" onclick="ccwToggle()" aria-label="Close">✕</button>
      </div>
    </div>

    <div class="ccw-disclaimer" id="ccw-disclaimer">
      <div class="ccw-disclaimer-inner">
        <div class="ccw-disclaimer-label">About this assistant</div>
        <p>AI-generated responses based on Scott's knowledge and services. Not a substitute for professional medical advice. Verify important details directly with Scott at <a href="mailto:scott@crawford-coaching.ca">scott@crawford-coaching.ca</a>.</p>
      </div>
    </div>

    <div class="ccw-shortcuts" id="ccw-shortcuts">
      <div class="ccw-shortcuts-label">Quick questions</div>
      <div class="ccw-shortcuts-list" id="ccw-shortcuts-list"></div>
    </div>

    <div class="ccw-chat" id="ccw-chat"></div>

    <div class="ccw-input-area">
      <input id="ccw-input" type="text" placeholder="Ask a question..." autocomplete="off">
      <button class="ccw-send" id="ccw-send" onclick="ccwSend()">Send</button>
    </div>
  </div>
  `;

  // ── INJECT ───────────────────────────────────────────────────
  const styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  const div = document.createElement('div');
  div.innerHTML = html;
  document.body.appendChild(div);

  // Populate shortcuts
  const shortcutList = document.getElementById('ccw-shortcuts-list');
  SHORTCUTS.forEach(q => {
    const btn = document.createElement('button');
    btn.className = 'ccw-shortcut';
    btn.textContent = q;
    btn.onclick = () => ccwAsk(q);
    shortcutList.appendChild(btn);
  });

  // Init
  ccwLoadHistory();

  const input = document.getElementById('ccw-input');
  input.addEventListener('keypress', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ccwSend(); }
  });
  input.addEventListener('focus', () => ccwCollapseShortcuts(true));
  input.addEventListener('blur', () => setTimeout(() => ccwCollapseShortcuts(false), 120));

  // ── FUNCTIONS ─────────────────────────────────────────────────
  window.ccwToggle = function() {
    document.getElementById('cc-widget-panel').classList.toggle('open');
    if (document.getElementById('cc-widget-panel').classList.contains('open')) {
      input.focus();
      ccwScrollToBottom();
    }
  };

  window.ccwToggleDisclaimer = function() {
    document.getElementById('ccw-disclaimer').classList.toggle('open');
  };

  window.ccwCollapseShortcuts = function(collapse) {
    document.getElementById('ccw-shortcuts').classList.toggle('hidden', collapse);
  };

  window.ccwClear = function() {
    localStorage.removeItem(STORAGE_KEY);
    document.getElementById('ccw-chat').innerHTML = '';
    ccwAppend(WELCOME, 'assistant');
    document.getElementById('ccw-shortcuts').classList.remove('hidden');
  };

  function ccwLoadHistory() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) { ccwAppend(WELCOME, 'assistant'); return; }
    const history = JSON.parse(stored);
    if (history.length === 0) { ccwAppend(WELCOME, 'assistant'); return; }
    history.forEach(m => ccwAppend(m.content, m.role));
  }

  window.ccwSend = async function() {
    const text = input.value.trim();
    if (!text) return;

    ccwAppend(text, 'user');
    ccwSaveMessage(text, 'user');
    input.value = '';
    input.disabled = true;
    document.getElementById('ccw-send').disabled = true;
    ccwCollapseShortcuts(true);

    const typing = document.createElement('div');
    typing.className = 'ccw-typing';
    typing.id = 'ccw-typing';
    typing.innerHTML = '<span></span><span></span><span></span>';
    document.getElementById('ccw-chat').appendChild(typing);
    ccwScrollToBottom();

    try {
      const history  = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      const messages = history.slice(-MAX_HISTORY);
      const res = await fetch(FUNCTION_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages })
      });
      const data = await res.json();
      document.getElementById('ccw-typing')?.remove();
      ccwAppend(data.reply || "Sorry, I couldn't get a response.", 'assistant');
      if (data.reply) ccwSaveMessage(data.reply, 'assistant');
    } catch(err) {
      document.getElementById('ccw-typing')?.remove();
      ccwAppend("Something went wrong. Please try again.", 'assistant');
    } finally {
      input.disabled = false;
      document.getElementById('ccw-send').disabled = false;
      input.focus();
    }
  };

  window.ccwAsk = function(text) {
    input.value = text;
    ccwSend();
  };

  function ccwSaveMessage(content, role) {
    const history = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    history.push({ role, content });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  }

  function ccwScrollToBottom() {
    const chat = document.getElementById('ccw-chat');
    chat.scrollTop = chat.scrollHeight;
  }

  function ccwRenderMarkdown(text) {
    let out = text
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')
      .replace(/\*(.+?)\*/g,'<em>$1</em>')
      .replace(/\[([^\]]+)\]\(((https?:\/\/|mailto:)[^)]+)\)/g,'<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
      .replace(/(^|[^"'>])(https?:\/\/[^\s<)]+)/g,'$1<a href="$2" target="_blank" rel="noopener noreferrer">$2</a>')
      .replace(/^- (.+)$/gm,'<li>$1</li>')
      .replace(/(<li>.*<\/li>)/gs,'<ul>$1</ul>')
      .replace(/\n\n/g,'</p><p>')
      .replace(/\n/g,'<br>');
    return `<p>${out}</p>`.replace(/<p><\/p>/g,'');
  }

  function ccwAppend(text, role) {
    const chat = document.getElementById('ccw-chat');
    const div = document.createElement('div');
    div.className = `ccw-msg ${role}`;
    div.innerHTML = role === 'user'
      ? text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      : ccwRenderMarkdown(text);
    chat.appendChild(div);
    ccwScrollToBottom();
  }

})();
