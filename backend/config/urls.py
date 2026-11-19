from django.urls import path
from ai_engine.views import ExplainPageView, HealthView

urlpatterns = [
    path("api/health/", HealthView.as_view(), name="health"),
    path("api/ai/explain/", ExplainPageView.as_view(), name="explain-page"),
]
