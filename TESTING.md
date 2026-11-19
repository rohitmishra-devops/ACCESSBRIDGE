cd backend# Manual MVP test checklist

1. Backend health endpoint returns `{"status":"ok", ...}`.
2. Extension loads from `chrome://extensions` without manifest errors.
3. Open a regular public page and click Explain this page.
4. Confirm the extension shows a short explanation and reads it aloud.
5. Inspect the request payload in DevTools Network: it must not contain form values.
6. Test on a page with password, OTP, and payment fields; verify those field labels are not sent.
7. Try Hindi and English output. If a Hindi voice is unavailable, test the browser/device speech fallback.
8. Test at least one shopping page and one public form page.

Do not test with real payment credentials, passwords, or personal records.
