// domExtractor.js — inject into Chrome extension content script
// Extracts full DOM + accessibility tree for VAIGA agent

function extractDOM() {
  const elements = [];
  const screenW = window.innerWidth;
  const screenH = window.innerHeight;

  const BROWSER_SKIP = [
    'tab','terminal','address bar','devtools',
    'toolbar','bookmark','minimize','maximize'
  ]

  // ✅ Specific selectors — not querySelectorAll("*")
  document.querySelectorAll(`
    button, a, input, textarea, select, label,
    [role], [aria-label], [contenteditable="true"]
  `).forEach((el) => {
    const rect  = el.getBoundingClientRect();
    const style = window.getComputedStyle(el);

    // Skip invisible
    if (
      rect.width <= 0 || rect.height <= 0 ||
      style.visibility === "hidden" ||
      style.display === "none" ||
      style.opacity === "0"
    ) return;

    if (rect.width < 5 || rect.height < 5) return;

    const tag         = el.tagName;
    // ✅ textContent instead of innerText
    const text        = (el.textContent || el.value || el.placeholder || "").slice(0, 120).trim();
    const aria        = el.getAttribute("aria-label") || "";
    const role        = el.getAttribute("role") || "";
    const id          = el.id || "";
    const name        = el.getAttribute("name") || "";
    const type        = el.getAttribute("type") || "";
    const href        = el.getAttribute("href") || "";
    const placeholder = el.getAttribute("placeholder") || "";

    const isClickable =
      el.onclick != null ||
      el.getAttribute("onclick") != null ||
      ["BUTTON","A","INPUT","SELECT","TEXTAREA","LABEL"].includes(tag) ||
      role === "button" || role === "link" || role === "menuitem" ||
      style.cursor === "pointer";

    const isInput =
      ["INPUT","TEXTAREA","SELECT"].includes(tag) ||
      el.contentEditable === "true";

    const x_pct = round((rect.x + rect.width  / 2) / screenW * 100, 1);
    const y_pct = round((rect.y + rect.height / 2) / screenH * 100, 1);

    if (!text && !aria && !role && !placeholder && !isInput) return;

    // Skip browser chrome elements
    const labelCheck = (text + aria + role).toLowerCase()
    if (BROWSER_SKIP.some(b => labelCheck.includes(b))) return

    elements.push({
      tag, text, aria, role, id, name, type, href, placeholder,
      x_pct, y_pct,
      width:     round(rect.width  / screenW * 100, 1),
      height:    round(rect.height / screenH * 100, 1),
      clickable: isClickable,
      input:     isInput,
    });
  });

  const accessTree = extractAccessibilityTree();

  // ✅ slice(0, 100) — was 300
  return { elements: elements.slice(0, 100), accessibility: accessTree, url: window.location.href };
}

function extractAccessibilityTree() {
  const tree = [];
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_ELEMENT,
    null
  );

  let node;
  while ((node = walker.nextNode())) {
    const role  = node.getAttribute("role") || node.tagName.toLowerCase();
    const label = node.getAttribute("aria-label") ||
                  node.getAttribute("aria-labelledby") ||
                  node.getAttribute("title") || "";
    const text  = (node.textContent || "").slice(0, 80).trim();

    if (label || (text && ["button","a","input","select","h1","h2","h3"].includes(node.tagName.toLowerCase()))) {
      const rect = node.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        tree.push({
          role,
          label: label || text,
          x_pct: round((rect.x + rect.width  / 2) / window.innerWidth  * 100, 1),
          y_pct: round((rect.y + rect.height / 2) / window.innerHeight * 100, 1),
        });
      }
    }
  }
  return tree.slice(0, 40);
}

function round(val, dec) {
  return Math.round(val * Math.pow(10, dec)) / Math.pow(10, dec);
}

// Listen for VAIGA messages
window.addEventListener("message", (e) => {
  if (e.data?.type === "vaiga-get-dom") {
    const domData = extractDOM();
    window.postMessage({ type: "vaiga-dom-response", data: domData }, "*");
  }
});

// Auto-extract on page load and send to extension
if (typeof chrome !== "undefined" && chrome.runtime?.id) {
  const sendDOM = () => {
    try {
  chrome.runtime.sendMessage({
    type: "vaiga-dom-update",
    data: extractDOM()
  });
} catch (e) {
  console.log("VAIGA DOM send failed", e);
}
  };

  sendDOM();

  // ✅ Debounced MutationObserver — was 500ms
  let domTimer = null;
  const observer = new MutationObserver(() => {
    clearTimeout(domTimer);
    domTimer = setTimeout(() => { sendDOM(); }, 700);
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

console.log("🤖 VAIGA DOM Extractor active on", window.location.href);