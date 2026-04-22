/**
 * content.js — runs on dms-siasn.bkn.go.id
 * Reads saved settings and applies dark mode + copy buttons.
 * Listens for messages from the popup to toggle on the fly.
 */

/**
 * Clipboard bar will be shown if the user enables it from the popup.
 * It adds a floating layer at the bottom of the page with a close button.
 * In each NIP, Name, and Nama Dokumen cell has a button to send it to clipboard bar
 * so the user can easily copy and paste it to other applications.
 */

// ── Helpers ──────────────────────────────────────────────────────────────────

function applyDarkMode(enabled) {
  document.documentElement.classList.toggle("ext-dark-mode", enabled);
}

// ── Paste button  ───────────────────────────────────────────────────
function makePasteButton(input) {
  const btn = document.createElement("button");
  btn.className = "ext-paste-btn";
  btn.textContent = "Paste";
  btn.addEventListener("click", async (e) => {
    e.preventDefault();
    const text = await navigator.clipboard.readText();
    input.value = text;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  return btn;
}

function makeClearButton(input) {
  const btn = document.createElement("button");
  btn.className = "ext-clear-btn";
  btn.textContent = "✕";
  btn.title = "Clear input";
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    input.value = "";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
    input.focus();
  });
  return btn;
}

// Add this new function alongside injectCopyButtons()
function injectPasteButtons() {
  document
    .querySelectorAll('input[placeholder="Masukkan NIP"]')
    .forEach((input) => {
      if (input.dataset.extPaste === "done") return;
      input.dataset.extPaste = "done";
      input.style.paddingRight = "110px";

      const wrapper = document.createElement("div");
      wrapper.style.cssText =
        "position:relative; display:inline-block; width:100%;";
      input.parentNode.insertBefore(wrapper, input);
      wrapper.appendChild(input);
      wrapper.appendChild(makePasteButton(input));
      wrapper.appendChild(makeClearButton(input));
    });
}

function removePasteButtons() {
  document.querySelectorAll(".ext-paste-btn").forEach((btn) => btn.remove());
  document.querySelectorAll("[data-ext-paste]").forEach((el) => {
    el.style.paddingRight = "";
    // unwrap: move input back out of the wrapper div
    const wrapper = el.parentNode;
    if (wrapper && wrapper.style.position === "relative") {
      wrapper.parentNode.insertBefore(el, wrapper);
      wrapper.remove();
    }
    delete el.dataset.extPaste;
  });
}

function applyPasteButtons(enabled) {
  if (enabled) {
    injectPasteButtons();
  } else {
    removePasteButtons();
  }
}

// ── Copy button  ─────────────────────────────────────────────────────
function makeCopyButton(text) {
  const btn = document.createElement("button");
  btn.className = "ext-copy-btn";
  btn.title = "Copy: " + text;

  const copyIcon = `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-copy-icon lucide-copy"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
  `;
  // set width the button 30px
  btn.style.width = "30px";
  btn.innerHTML = copyIcon;

  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text).then(() => {
      btn.textContent = "✓";
      btn.classList.add("ext-copied");

      setTimeout(() => {
        btn.innerHTML = copyIcon;
        btn.classList.remove("ext-copied");
      }, 1500);
    });
  });

  return btn;
}

// ── Copy button injection ─────────────────────────────────────────────────────
// Scans every table row and injects copy buttons into the nip (col 2)
// and name (col 3) cells.
// We mark processed cells with data-ext-copy="done" to avoid duplicates.

function injectCopyButtons() {
  // Select all <td> in the 2nd and 3rd column positions inside table rows
  document.querySelectorAll("table tr").forEach((row) => {
    const cells = row.querySelectorAll("td");
    if (cells.length < 3) return;

    // Column indices (0-based): adjust if your table layout differs
    const targets = [
      { cell: cells[1], colName: "nip" }, // 1978
      { cell: cells[2], colName: "name" }, // Michael
    ];

    targets.forEach(({ cell, colName }) => {
      if (cell.dataset.extCopy === "done") return;
      cell.dataset.extCopy = "done";

      const rawText = cell.innerText.trim();
      if (!rawText) return;

      cell.style.whiteSpace = "nowrap";
      cell.appendChild(makeCopyButton(rawText));
    });
  });
}

function removeCopyButtons() {
  document.querySelectorAll(".ext-copy-btn").forEach((btn) => btn.remove());
  document.querySelectorAll("[data-ext-copy]").forEach((el) => {
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

// ── Clipboard Bar in bottom

// function makeClipboardBar(){
//   // add new layer in bottom of screen, it has 60% width and 200px height, and has white background with 0.9 opacity with rounded corners, and has a close button in top right corner
//   const layer = document.createElement('div');
//   layer.style.cssText = `
//     position: fixed;
//     bottom: 20px;
//     left: 50%;
//     transform: translateX(-50%);
//     width: 60%;
//     height: 200px;
//     background: rgba(255, 255, 255, 0.9);
//     border-radius: 10px;
//     box-shadow: 0 2px 10px rgba(0,0,0,0.1);
//     display: flex;
//     justify-content: center;
//     align-items: center;
//     z-index: 9999;
//   `;
//   const closeBtn = document.createElement('button');
//   closeBtn.textContent = 'Close';
//   closeBtn.style.cssText = `
//     position: absolute;
//     top: 10px;
//     right: 10px;
//     background: transparent;
//     border: none;
//     font-size: 16px;
//     cursor: pointer;
//   `;
//   closeBtn.addEventListener('click', () => {
//     layer.remove();
//   });
//   layer.appendChild(closeBtn);
//   console.log('Adding new layer to the page');
//   document.body.appendChild(layer);
// }

// function injectClipboardBar() {
//   console.log('Injecting clipboard bar');
//   if (document.getElementById('ext-clipboard-bar')) return;
//   console.log('Creating clipboard bar');
//   const bar = makeClipboardBar();
//   bar.id = 'ext-clipboard-bar';
//   document.body.appendChild(bar);
// }

// function removeClipboardBar() {
//   const bar = document.getElementById('ext-clipboard-bar');
//   if (bar) bar.remove();
// }

// function applyClipboardBar(enabled) {
//   if (enabled) { injectClipboardBar(); }
//   else { removeClipboardBar(); }
// }

// ── Clipboard Bar ─────────────────────────────────────────────────────────────
// DRH, SK CPNS, SK PNS, D2NP, SPMT CPNS, GOLONGAN, PENDIDIKAN,
// JABATAN, PINDAH INSTANSI, PENGHARGAAN, SKP22, ANGKA KREDIT, MASA KERJA, CUTI LN, DIKLAT, SERTIFIKASI, PATEN, PENULISAN ILMIAH, KURSUS

let clipboardBarData = {
  nip: "",
  name: "",
  instansi: "",
  status: "",
  type: [],
};

function createClipboardBar() {
  if (document.getElementById("ext-clipboard-bar")) return;

  const bar = document.createElement("div");
  bar.id = "ext-clipboard-bar";
  bar.innerHTML = `
    <div class="ext-cb-inner">
      <div class="ext-cb-left">
        <div class="ext-cb-field-h">
          <span class="ext-cb-label">NIP</span>
          <span class="ext-cb-value" id="ext-cb-nip">—</span>
        </div>
        <div class="ext-cb-field-h">
          <span class="ext-cb-label">Name</span>
          <span class="ext-cb-value" id="ext-cb-name">—</span>
        </div>
        <div class="ext-cb-field-h">
          <span class="ext-cb-label">Instansi</span>
          <input
            type="text"
            class="ext-cb-input"
            placeholder="Nama Instansi"
            id="ext-cb-institution"
          />
        </div>
      </div>
      <div class="ext-cb-divider"></div>
      <div class="ext-cb-center">
        <div class="ext-cb-field">
          <span class="ext-cb-label"
            >Dokumen
            <p id="ext-cb-type-count" class="ext-cb-type-count">(0)</p></span
          >
          <div class="ext-cb-type" id="ext-cb-type"></div>
        </div>
      </div>

      <div class="ext-cb-divider"></div>
      <div class="ext-cb-right">
        <select class="ext-cb-select" id="ext-cb-status">
          <option value="">Pilih Status</option>
          <option value="TERSEDIA">Tersedia</option>
          <option value="TERISI">Terisi</option>
          <option value="LENGKAP">Lengkap</option>
          <option value="VERIFIKASI">Verifikasi</option>
        </select>
        <button class="ext-cb-copy-btn" id="ext-cb-copy">⧉ Copy All</button>
       
      </div>
       <button class="ext-cb-clear-btn" id="ext-cb-clear">Reset</button>
    </div>

  `;
  document.body.appendChild(bar);

  // add event listener to save value ext-cb-institution and save it into clipboardBarData
  document
    .getElementById("ext-cb-institution")
    .addEventListener("keyup", function (event) {
      clipboardBarData.instansi = event.target.value;
    });

  document
    .getElementById("ext-cb-status")
    .addEventListener("change", (event) => {
      clipboardBarData.status = event.target.value;
    });

  document.getElementById("ext-cb-copy").addEventListener("click", () => {
    console.log(clipboardBarData);
    const { nip, name, instansi, status, type } = clipboardBarData;
    const text = `${nip}\t${name}\t${instansi}\t${status}\t${type}`;
    
    // create alert which fields are not filled yet
    const missingFields = [];
    if (!nip) missingFields.push("NIP");
    if (!name) missingFields.push("Name");
    if (!instansi) missingFields.push("Instansi");
    if (!status) missingFields.push("Status");
    if (type.length === 0) missingFields.push("Dokumen");
    if (missingFields.length > 0) {
      alert(`Data Belum Lengkap, Mohon Isi Field Berikut:\n${missingFields.join(", ").toUpperCase()}`);
      return;
    }

    navigator.clipboard.writeText(text).then(() => {
      const btn = document.getElementById("ext-cb-copy");
      btn.textContent = "✓ Copied!";
      setTimeout(() => (btn.textContent = "⧉ Copy All"), 1500);
    });
  });

  document.getElementById("ext-cb-clear").addEventListener("click", () => {
    clipboardBarData.nip = "";
    clipboardBarData.name = "";
    clipboardBarData.type = [];
    updateClipboardBar();
  });
}

function updateClipboardBar() {
  const y = document.getElementById("ext-cb-nip");
  const n = document.getElementById("ext-cb-name");
  const i = document.getElementById("ext-cb-institution");
  const s = document.getElementById("ext-cb-status");
  const t = document.getElementById("ext-cb-type");
  const tc = document.getElementById("ext-cb-type-count");
  if (y) y.textContent = clipboardBarData.nip || "—";
  if (n) n.textContent = clipboardBarData.name || "—";
  if (i) i.textContent = clipboardBarData.instansi || "—";
  if (tc) tc.textContent = `(${clipboardBarData.type.length})`;


  // show all types in array, create a badge for each type, add x button to remove each type from clipboardBarData
  if (t) {
    t.innerHTML = "";
    if (clipboardBarData.type.length === 0) {
      t.textContent = "—";
    } else {
      console.log("Updating clipboard bar types:", clipboardBarData.type);
      console.log("Number of types:", clipboardBarData.type);

      clipboardBarData.type.map((type, index) => {
        const badge = document.createElement("span");
        badge.className = "ext-cb-type-badge";
        badge.textContent = type;
        const removeBtn = document.createElement("button");
        removeBtn.className = "ext-cb-remove-type-btn";
        removeBtn.textContent = "✕";
        removeBtn.addEventListener("click", () => {
          clipboardBarData.type.splice(index, 1);
          updateClipboardBar();
        });
        badge.appendChild(removeBtn);
        t.appendChild(badge);
      });
    }
  }
}

function removeClipboardBar() {
  document.getElementById("ext-clipboard-bar")?.remove();
  // remove the send buttons from cells
  document.querySelectorAll(".ext-send-btn").forEach((b) => b.remove());
  document
    .querySelectorAll("[data-ext-send]")
    .forEach((el) => delete el.dataset.extSend);
}

function applyClipboardBar(enabled) {
  if (enabled) {
    createClipboardBar();
    injectSendButtons();
  } else {
    removeClipboardBar();
  }
}

// ── Send buttons (→ clipboard bar) ───────────────────────────────────────────

function makeSendButton(field, getValue) {
  const btn = document.createElement("button");
  btn.className = "ext-send-btn";
  btn.title = `Send to clipboard bar`;
  const sendIcon = `
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-panel-bottom-close-icon lucide-panel-bottom-close"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 15h18"/><path d="m15 8-3 3-3-3"/></svg>
  `;
  const checkIcon = `
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check-icon lucide-check"><path d="M20 6 9 17l-5-5"/></svg>
  `;
  btn.innerHTML = sendIcon;
  btn.style.width = "30px";
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (field === "type") {
      const value = getValue();
      if (!clipboardBarData.type.includes(value)) {
        let newValue = String(value)
          .replace("Dokumen ", "")
          .replace("_", " ")
          .toUpperCase()
          .replace("DITERIMA", "")
          .replace("DITOLAK", "")
          .trim();
        // prevent duplicate type
        if (clipboardBarData.type.includes(newValue)) return;
        // spmt_cpns, cpns, pns, pindah_instansi, skp22, angka_kredit, masa_kerja,
        if (newValue === "CPNS") newValue = "SK CPNS";
        if (newValue === "PNS") newValue = "SK PNS";
        clipboardBarData.type.push(newValue);
      }
    } else {
      clipboardBarData[field] = getValue();
    }
    updateClipboardBar();
    btn.innerHTML = checkIcon;
    btn.classList.add("ext-sent");
    setTimeout(() => {
      btn.innerHTML = sendIcon;
      btn.classList.remove("ext-sent");
    }, 1000);
  });
  return btn;
}

function injectSendButtons() {
  document.querySelectorAll("table tr").forEach((row) => {
    const cells = row.querySelectorAll("td");
    if (cells.length < 3) return;

    // nip cell (index 1)
    if (!cells[1].dataset.extSend) {
      cells[1].dataset.extSend = "done";
      cells[1].appendChild(
        makeSendButton("nip", () =>
          cells[1].innerText.replace("→", "").replace("✓", "").trim(),
        ),
      );
    }

    // Name cell (index 2)
    if (!cells[2].dataset.extSend) {
      cells[2].dataset.extSend = "done";
      cells[2].appendChild(
        makeSendButton("name", () =>
          cells[2].innerText.replace("→", "").replace("✓", "").trim(),
        ),
      );
    }

    // Type cell (index 3)
    if (!cells[3].dataset.extSend) {
      cells[3].dataset.extSend = "done";
      cells[3].appendChild(
        makeSendButton("type", () =>
          cells[3].innerText.replace("→", "").replace("✓", "").trim(),
        ),
      );
    }
  });

  // Type: read from the badge cell (index 6 based on your HTML — the "Usulan" badge)
  // Adjust index if needed
  // document.querySelectorAll('table tr').forEach((row) => {
  //   const cells = row.querySelectorAll('td');
  //   if (cells.length < 7) return;
  //   if (!cells[6].dataset.extSend) {
  //     cells[6].dataset.extSend = 'done';
  //     cells[6].appendChild(makeSendButton('type', () => cells[6].innerText.replace('→','').replace('✓','').trim()));
  //   }
  // });
}

// ── MutationObserver for dynamic tables (pagination / infinite scroll) ────────

let observer = null;

function startObserver() {
  if (observer) return;
  observer = new MutationObserver(() => {
    injectCopyButtons();
    injectPasteButtons();
    injectSendButtons();
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

function stopObserver() {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
}

// ── Init: read saved settings ─────────────────────────────────────────────────

chrome.storage.sync.get(
  {
    darkMode: false,
    copyButtons: true,
    pasteButtons: true,
    clipboardBar: false,
  }, // add clipboardBar
  ({ darkMode, copyButtons, pasteButtons, clipboardBar }) => {
    applyDarkMode(darkMode);
    applyCopyButtons(copyButtons);
    applyPasteButtons(pasteButtons); // add this
    applyClipboardBar(clipboardBar); // add this
    console.log("Settings loaded:", {
      darkMode,
      copyButtons,
      pasteButtons,
      clipboardBar,
    });
  },
);

// ── Listen for live toggle messages from the popup ────────────────────────────

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "SET_DARK_MODE") applyDarkMode(msg.value);
  if (msg.type === "SET_COPY_BUTTONS") applyCopyButtons(msg.value);
  if (msg.type === "SET_PASTE_BUTTONS") applyPasteButtons(msg.value);
  if (msg.type === "SET_CLIPBOARD_BAR") applyClipboardBar(msg.value);
});
