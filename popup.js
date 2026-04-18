/**
 * popup.js — controls the extension popup UI
 * Reads saved settings, renders toggle states,
 * saves changes, and messages the active tab's content.js.
 */

const toggleDark = document.getElementById('toggle-dark');
const toggleCopy = document.getElementById('toggle-copy');
const togglePaste = document.getElementById('toggle-paste');
const toggleClipboard = document.getElementById('toggle-clipboard');

// ── Load saved settings into UI ───────────────────────────────────────────────
chrome.storage.sync.get({ darkMode: false, copyButtons: true, pasteButtons: true, clipboardBar: false }, ({ darkMode, copyButtons, pasteButtons, clipboardBar }) => {
  toggleDark.checked = darkMode;
  toggleCopy.checked = copyButtons;
  togglePaste.checked = pasteButtons;
  toggleClipboard.checked = clipboardBar;
});

// ── Send message to the active tab's content script ───────────────────────────
async function messageTab(msg) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id) {
    chrome.tabs.sendMessage(tab.id, msg).catch(() => {
      // Tab may not have the content script (e.g. on a different page) — safe to ignore
    });
  }
}

// ── Toggle listeners ──────────────────────────────────────────────────────────
toggleDark.addEventListener('change', () => {
  const value = toggleDark.checked;
  chrome.storage.sync.set({ darkMode: value });
  messageTab({ type: 'SET_DARK_MODE', value });
});

toggleCopy.addEventListener('change', () => {
  const value = toggleCopy.checked;
  chrome.storage.sync.set({ copyButtons: value });
  messageTab({ type: 'SET_COPY_BUTTONS', value });
});

togglePaste.addEventListener('change', () => {
  const value = togglePaste.checked;
  chrome.storage.sync.set({ pasteButtons: value });
  messageTab({ type: 'SET_PASTE_BUTTONS', value });
});

toggleClipboard.addEventListener('change', () => {
  const value = toggleClipboard.checked;
  chrome.storage.sync.set({ clipboardBar: value });
  messageTab({ type: 'SET_CLIPBOARD_BAR', value });
});

// ── Display extension version in footer ───────────────────────────────────────
chrome.runtime.getPackageDirectoryEntry((root) => {
  root.getFile('manifest.json', {}, (fileEntry) => {
    fileEntry.file((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const manifest = JSON.parse(e.target.result);
        document.getElementById('version').textContent = `Version ${manifest.version}`;
      };
      reader.readAsText(file);
    });
  });
});