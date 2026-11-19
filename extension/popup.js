const API_URL = "http://127.0.0.1:8000/api/ai/explain/";

const explainButton = document.getElementById("explain");
const readButton = document.getElementById("read");
const stopButton = document.getElementById("stop");
const languageSelect = document.getElementById("language");
const statusNode = document.getElementById("status");
const resultNode = document.getElementById("result");

let lastExplanation = "";

function setStatus(message) {
  statusNode.textContent = message;
}

function stopSpeech() {
  try { chrome.tts.stop(); } catch (_error) {}
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  stopButton.disabled = true;
}

function speak(text, language) {
  stopSpeech();
  if (!text) return;

  const lang = language === "Hindi" ? "hi-IN" : "en-US";
  if (chrome.tts?.speak) {
    chrome.tts.speak(text, {
      lang,
      rate: 0.9,
      onEvent: event => {
        if (event.type === "end" || event.type === "error") stopButton.disabled = true;
      }
    });
    stopButton.disabled = false;
    return;
  }

  if ("speechSynthesis" in window) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.9;
    utterance.onend = () => { stopButton.disabled = true; };
    window.speechSynthesis.speak(utterance);
    stopButton.disabled = false;
  } else {
    setStatus("Is device par text-to-speech available nahi hai. Explanation neeche padh sakte hain.");
  }
}

async function extractCurrentPage(tab) {
  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ["privacy/privacy-filter.js", "content/dom-reader.js"]
  });

  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tab.id, { type: "ACCESSBRIDGE_EXTRACT_PAGE" }, response => {
      if (chrome.runtime.lastError) {
        reject(new Error("Page read nahi ho paayi. Page reload karke dobara try karein."));
        return;
      }
      if (!response?.ok) {
        reject(new Error(response?.error || "Page extraction failed."));
        return;
      }
      resolve(response.page);
    });
  });
}

explainButton.addEventListener("click", async () => {
  explainButton.disabled = true;
  resultNode.textContent = "";
  lastExplanation = "";
  setStatus("Page ko safely read kiya ja raha hai...");

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id || !/^https?:/.test(tab.url || "")) {
      throw new Error("Chrome internal pages ya local extension pages read nahi kiye ja sakte. Ek normal website open karein.");
    }

    const page = await extractCurrentPage(tab);
    setStatus("Simple explanation ban rahi hai...");

    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ page, language: languageSelect.value })
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || `Backend error (${response.status}).`);
    }

    lastExplanation = data.explanation || "";
    if (!lastExplanation) throw new Error("AI se empty explanation mili.");
    resultNode.textContent = lastExplanation;
    setStatus("Explanation ready. Aap ise sun sakte hain.");
    speak(lastExplanation, languageSelect.value);
    readButton.disabled = false;
  } catch (error) {
    setStatus(error.message || "Kuch problem hui. Backend check karein.");
  } finally {
    explainButton.disabled = false;
  }
});

readButton.addEventListener("click", () => speak(lastExplanation, languageSelect.value));
stopButton.addEventListener("click", stopSpeech);
