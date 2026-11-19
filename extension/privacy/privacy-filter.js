// Privacy filtering runs in the extension before any data is sent to the backend.
(() => {
  const SENSITIVE_WORDS =
    /\b(password|passwd|passcode|otp|one.?time.?password|verification.?code|security.?code|cvv|cvc|card.?number|credit.?card|debit.?card|account.?number|pin|secret)\b/i;

  function isSensitiveElement(element) {
    if (!(element instanceof Element)) return true;

    const tag = element.tagName.toLowerCase();
    if (tag === "input") {
      const type = (element.getAttribute("type") || "text").toLowerCase();
      if (["password", "hidden"].includes(type)) return true;
      if (["number", "text", "tel"].includes(type)) {
        const descriptor = [
          element.getAttribute("name"),
          element.getAttribute("id"),
          element.getAttribute("autocomplete"),
          element.getAttribute("aria-label"),
          element.getAttribute("placeholder")
        ].filter(Boolean).join(" ");
        if (SENSITIVE_WORDS.test(descriptor)) return true;
      }
    }

    if (element.matches('input[type="hidden"], [hidden], [aria-hidden="true"]')) return true;

    const descriptor = [
      element.getAttribute("name"),
      element.getAttribute("id"),
      element.getAttribute("autocomplete"),
      element.getAttribute("aria-label"),
      element.getAttribute("placeholder")
    ].filter(Boolean).join(" ");

    if (SENSITIVE_WORDS.test(descriptor)) return true;
    if (element.closest('[hidden], [aria-hidden="true"]')) return true;
    return false;
  }

  function cleanText(value, max = 240) {
    return String(value || "").replace(/\s+/g, " ").trim().slice(0, max);
  }

  window.AccessBridgePrivacy = { isSensitiveElement, cleanText };
})();
