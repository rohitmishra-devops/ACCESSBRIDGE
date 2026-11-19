
import time
import requests
from django.conf import settings


def create_explanation(page, language):

    api_key = settings.LLM_API_KEY

    if not api_key:
        raise RuntimeError("Gemini API key missing.")

    base_url = settings.LLM_BASE_URL.rstrip("/")
    url = f"{base_url}/chat/completions"

    # Primary model + backup model
    models = [
        settings.LLM_MODEL,
        "gemini-3.8-flash",
    ]

    system_prompt = """
    You are ACCESSBRIDGE, an accessibility assistant.

    Explain webpages using only the supplied page summary.

    Rules:
    - Never invent buttons, prices or website features.
    - Never expose passwords, OTPs or payment details.
    - Use simple language.
    - Make explanations accessible to visually impaired users.
    - Explain important sections and controls.
    - Clearly mention uncertainty.
    - Keep the explanation concise and structured.
    """

    user_prompt = f"""
    Explain this webpage in {language}.

    Start by explaining the purpose of the webpage.
    Then explain its important sections, buttons and links.
    Explain form labels without asking for personal values.

    Page summary:
    {page}
    """

    last_error = "Unknown Gemini error."

    for model in dict.fromkeys(models):

        for attempt in range(2):

            try:
                response = requests.post(
                    url,
                    headers={
                        "Authorization": f"Bearer {api_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": model,
                        "messages": [
                            {
                                "role": "system",
                                "content": system_prompt,
                            },
                            {
                                "role": "user",
                                "content": user_prompt,
                            },
                        ],
                        "temperature": 0.2,
                    },
                    timeout=45,
                )

                if response.status_code in [429, 500, 502, 503, 504]:
                    last_error = (
                        f"Model {model}: "
                        f"HTTP {response.status_code}"
                    )

                    if attempt == 0:
                        time.sleep(2)
                        continue

                    break

                if not response.ok:
                    raise RuntimeError(
                        f"Gemini API Error {response.status_code}: "
                        f"{response.text[:500]}"
                    )

                data = response.json()

                explanation = (
                    data["choices"][0]["message"]["content"]
                )

                if isinstance(explanation, str) and explanation.strip():
                    return explanation.strip()[:6000]

                last_error = f"Empty response from {model}."
                break

            except requests.exceptions.Timeout:
                last_error = f"Timeout while contacting {model}."

                if attempt == 0:
                    time.sleep(2)

            except requests.exceptions.ConnectionError:
                raise RuntimeError(
                    "Gemini connection failed. Check your internet."
                )

            except (KeyError, IndexError, TypeError, ValueError):
                raise RuntimeError(
                    "Gemini returned an unexpected response."
                )

    raise RuntimeError(
        f"All Gemini models failed. Last error: {last_error}"
    )
