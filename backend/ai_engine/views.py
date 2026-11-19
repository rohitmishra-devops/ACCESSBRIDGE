from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
from .services import create_explanation

class HealthView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        return Response({"status": "ok", "service": "ACCESSBRIDGE Assistant API"})

class ExplainPageView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        page = request.data.get("page")
        language = request.data.get("language", "Hindi")

        if not isinstance(page, dict):
            return Response({"error": "A page object is required."}, status=status.HTTP_400_BAD_REQUEST)

        if language not in ("Hindi", "English"):
            return Response({"error": "Language must be Hindi or English."}, status=status.HTTP_400_BAD_REQUEST)

        # Enforce small request bounds even though the extension also trims the DOM.
        safe_page = {
            "title": str(page.get("title", ""))[:180],
            "url": str(page.get("url", ""))[:500],
            "headings": [str(x)[:240] for x in page.get("headings", [])[:35]],
            "buttons": [str(x)[:240] for x in page.get("buttons", [])[:35]],
            "links": [str(x)[:240] for x in page.get("links", [])[:35]],
            "form_labels": [str(x)[:240] for x in page.get("form_labels", [])[:35]],
            "visible_text_excerpt": str(page.get("visible_text_excerpt", ""))[:1800],
        }

        try:
            explanation = create_explanation(safe_page, language)
            return Response({"explanation": explanation, "language": language})
        except RuntimeError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except Exception:
            return Response(
                {"error": "Explanation service failed. Check backend logs and LLM configuration."},
                status=status.HTTP_502_BAD_GATEWAY
            )
