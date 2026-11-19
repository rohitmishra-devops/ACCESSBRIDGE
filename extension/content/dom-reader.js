(() => {
  const MAX_ITEMS = 35;
  const MAX_TEXT = 240;

  function clean(value) {
    return window.AccessBridgePrivacy.cleanText(value, MAX_TEXT);
  }

  function visible(element) {
    if (!element || !element.isConnected) return false;
    const style = window.getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return style.display !== "none" && style.visibility !== "hidden" &&
      Number(style.opacity) !== 0 && (rect.width > 0 || rect.height > 0);
  }

  function uniqueTexts(elements, getText) {
    const seen = new Set();
    const output = [];
    for (const element of elements) {
      if (window.AccessBridgePrivacy.isSensitiveElement(element)) continue;
      if (!visible(element)) continue;
      const text = clean(getText(element));
      if (!text || seen.has(text)) continue;
      seen.add(text);
      output.push(text);
      if (output.length >= MAX_ITEMS) break;
    }
    return output;
  }

  function extractPage() {
    const headings = uniqueTexts(
      document.querySelectorAll("h1, h2, h3, h4, h5, h6"),
      el => el.innerText || el.textContent
    );

    const buttons = uniqueTexts(
      document.querySelectorAll('button, input[type="button"], input[type="submit"], [role="button"]'),
      el => el.getAttribute("aria-label") || el.innerText || el.value || el.textContent
    );

    const links = uniqueTexts(
      document.querySelectorAll("a[href]"),
      el => el.getAttribute("aria-label") || el.innerText || el.textContent
    );

    // Only field labels are extracted. Input values are never read.
    const formLabels = uniqueTexts(
      document.querySelectorAll("label, input, select, textarea"),
      el => {
        if (el.tagName.toLowerCase() === "label") return el.innerText || el.textContent;
        if (window.AccessBridgePrivacy.isSensitiveElement(el)) return "";
        const id = el.getAttribute("id");
        const associated = id ? document.querySelector(`label[for="${CSS.escape(id)}"]`) : null;
        return associated?.innerText || el.getAttribute("aria-label") || el.getAttribute("placeholder") || "";
      }
    );

    const main = document.querySelector("main, [role='main'], article");
    const pageText = clean(main?.innerText || document.body?.innerText || "").slice(0, 1800);

    return {
      title: clean(document.title, 180),
      url: location.origin + location.pathname,
      headings,
      buttons,
      links,
      form_labels: formLabels,
      visible_text_excerpt: pageText
    };
  }

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type === "ACCESSBRIDGE_EXTRACT_PAGE") {
      try {
        sendResponse({ ok: true, page: extractPage() });
      } catch (_error) {
        sendResponse({ ok: false, error: "Could not read this page." });
      }
    }
    return true;
  });
})();
