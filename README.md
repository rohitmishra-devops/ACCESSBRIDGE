# ACCESSBRIDGE Assistant — MVP

A Manifest V3 Chrome extension that extracts a privacy-filtered summary of the current page, sends it to a Django REST API for a simple Hindi/English explanation, and reads the result aloud.

## What is included

- Chrome extension (Vanilla JavaScript)
- DOM extraction: page title, headings, buttons, links, and form labels
- Privacy filtering in the extension before any network request
- Django + Django REST Framework endpoint: `POST /api/ai/explain/`
- OpenAI-compatible Chat Completions API integration
- Text-to-speech using `chrome.tts`, with `speechSynthesis` fallback
- Basic error handling and setup instructions

## Important limitations

- This is an MVP starter, not a production-ready accessibility product.
- It does not yet operate websites or submit forms.
- It does not guarantee that every website's purpose or controls will be understood correctly.
- The extension sends only extracted page structure/text, never form values. Password, OTP, payment/card, hidden, and other likely sensitive fields are excluded.
- AI output can be inaccurate. Users should verify important information.
- The extension currently supports local development with `http://127.0.0.1:8000`.

## Requirements

- Python 3.10+
- Google Chrome
- An API key for an OpenAI-compatible Chat Completions endpoint (optional until AI integration is tested)

## 1. Start the Django backend

Open a terminal in `backend/`:

```bash
python -m venv .venv
```

Windows PowerShell:
```powershell
.venv\Scripts\Activate.ps1
```

macOS/Linux:
```bash
source .venv/bin/activate
```

Install packages:

```bash
pip install -r requirements.txt
```

Copy `.env.example` to `.env`, then set your API key and model:

```env
LLM_API_KEY=your_api_key_here
LLM_BASE_URL=https://api.openai.com/v1
LLM_MODEL=gpt-4o-mini
```

Run migrations and server:

```bash
python manage.py migrate
python manage.py runserver 127.0.0.1:8000
```

Health check:
`http://127.0.0.1:8000/api/health/`

## 2. Load the Chrome extension

1. Open `chrome://extensions`.
2. Turn on **Developer mode**.
3. Click **Load unpacked**.
4. Select the `extension/` folder.
5. Pin ACCESSBRIDGE from the extensions menu.
6. Open a normal website and click the extension icon.
7. Choose Hindi or English, then click **Explain this page**.

The extension needs to be reloaded from `chrome://extensions` after editing its files.

## 3. Test without an LLM key

The extension will extract the page and call the backend, but the backend returns a clear configuration error if `LLM_API_KEY` is missing. Add a valid key to `.env` to receive AI explanations.

## Privacy design

- No input values are read or transmitted.
- Password, hidden, OTP, card/payment, CVV, PIN, and similarly sensitive fields are excluded.
- The extractor sends only a compact page summary.
- Avoid using this MVP on pages containing confidential information until you have reviewed the code and tested the privacy filter.
- Do not commit `.env` or API keys to GitHub.

## Project structure

```text
ACCESSBRIDGE_MVP/
├── extension/
│   ├── manifest.json
│   ├── popup.html
│   ├── popup.css
│   ├── popup.js
│   ├── content/
│   │   └── dom-reader.js
│   └── privacy/
│       └── privacy-filter.js
└── backend/
    ├── manage.py
    ├── requirements.txt
    ├── .env.example
    ├── config/
    └── ai_engine/
```

## Next milestones

1. Validate on 2–3 selected websites (shopping, government/form, general information).
2. Ask a visually impaired user to test the explanation and audio with consent.
3. Improve extraction and language/voice fallback based on test results.
4. Only then consider voice commands, navigation, dashboard, audit tooling, and SDK.
