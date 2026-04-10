/**
 * content.js — runs on dms-siasn.bkn.go.id
 * Reads saved settings and applies dark mode + copy buttons.
 * Listens for messages from the popup to toggle on the fly.
 */

// ── Helpers ──────────────────────────────────────────────────────────────────

function applyDarkMode(enabled) {
  document.documentElement.classList.toggle('ext-dark-mode', enabled);
}

function makePasteButton(input) {
  const btn = document.createElement('button');
  btn.className = 'ext-paste-btn';
  btn.textContent = 'Paste';
  btn.addEventListener('click', async (e) => {
    e.preventDefault();
    const text = await navigator.clipboard.readText();
    input.value = text;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });
  return btn;
}

function makeClearButton(input) {
  const btn = document.createElement('button');
  btn.className = 'ext-clear-btn';
  btn.textContent = '✕';
  btn.title = 'Clear input';
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    input.value = '';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    input.focus();
  });
  return btn;
}

// Add this new function alongside injectCopyButtons()
function injectPasteButtons() {
  document.querySelectorAll('input[placeholder="Masukkan NIP"]').forEach(input => {
    if (input.dataset.extPaste === 'done') return;
    input.dataset.extPaste = 'done';
    input.style.paddingRight = '110px';

    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'position:relative; display:inline-block; width:100%;';
    input.parentNode.insertBefore(wrapper, input);
    wrapper.appendChild(input);
    wrapper.appendChild(makePasteButton(input));
    wrapper.appendChild(makeClearButton(input));
  });
}

function removePasteButtons() {
  document.querySelectorAll('.ext-paste-btn').forEach(btn => btn.remove());
  document.querySelectorAll('[data-ext-paste]').forEach(el => {
    el.style.paddingRight = '';
    // unwrap: move input back out of the wrapper div
    const wrapper = el.parentNode;
    if (wrapper && wrapper.style.position === 'relative') {
      wrapper.parentNode.insertBefore(el, wrapper);
      wrapper.remove();
    }
    delete el.dataset.extPaste;
  });
}

function applyPasteButtons(enabled) {
  if (enabled) { injectPasteButtons(); }
  else { removePasteButtons(); }
}

function makeCopyButton(text) {
  const btn = document.createElement('button');
  btn.className = 'ext-copy-btn';
  btn.title = 'Copy: ' + text;

  const copyIcon = `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-copy-icon lucide-copy"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
  `;
  // set width the button 30px
  btn.style.width = '30px';
  btn.innerHTML = copyIcon;

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text).then(() => {
      btn.textContent = '✓';
      btn.classList.add('ext-copied');

      setTimeout(() => {
        btn.innerHTML = copyIcon;
        btn.classList.remove('ext-copied');
      }, 1500);
    });
  });

  return btn;
}

// ── Copy button injection ─────────────────────────────────────────────────────
// Scans every table row and injects copy buttons into the year (col 2)
// and name (col 3) cells.
// We mark processed cells with data-ext-copy="done" to avoid duplicates.

function injectCopyButtons() {
  // Select all <td> in the 2nd and 3rd column positions inside table rows
  document.querySelectorAll('table tr').forEach((row) => {
    const cells = row.querySelectorAll('td');
    if (cells.length < 3) return;

    // Column indices (0-based): adjust if your table layout differs
    const targets = [
      { cell: cells[1], colName: 'year' },   // 1978
      { cell: cells[2], colName: 'name' },   // Michael
    ];

    targets.forEach(({ cell, colName }) => {
      if (cell.dataset.extCopy === 'done') return;
      cell.dataset.extCopy = 'done';

      const rawText = cell.innerText.trim();
      if (!rawText) return;

      cell.style.whiteSpace = 'nowrap';
      cell.appendChild(makeCopyButton(rawText));
    });
  });
}

function removeCopyButtons() {
  document.querySelectorAll('.ext-copy-btn').forEach(btn => btn.remove());
  document.querySelectorAll('[data-ext-copy]').forEach(el => {
    delete el.dataset.extCopy;
  });
}

function applyCopyButtons(enabled) {
  if (enabled) {
    injectCopyButtons();
    // Re-run when new rows are added dynamically (pagination, lazy load, etc.)
    startObserver();
  } else {
    removeCopyButtons();
    stopObserver();
  }
}

// ── MutationObserver for dynamic tables (pagination / infinite scroll) ────────

let observer = null;

function startObserver() {
  if (observer) return;
  observer = new MutationObserver(() => {
    injectCopyButtons();
    injectPasteButtons(); 
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

function stopObserver() {
  if (observer) { observer.disconnect(); observer = null; }
}

// ── Init: read saved settings ─────────────────────────────────────────────────

chrome.storage.sync.get(
  { darkMode: false, copyButtons: true, pasteButtons: true }, // add pasteButtons
  ({ darkMode, copyButtons, pasteButtons }) => {
    applyDarkMode(darkMode);
    applyCopyButtons(copyButtons);
    applyPasteButtons(pasteButtons); // add this
  }
);

// ── Listen for live toggle messages from the popup ────────────────────────────

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'SET_DARK_MODE')    applyDarkMode(msg.value);
  if (msg.type === 'SET_COPY_BUTTONS') applyCopyButtons(msg.value);
  if (msg.type === 'SET_PASTE_BUTTONS') applyPasteButtons(msg.value);
});