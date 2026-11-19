from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include("apps.accounts.urls")),
    path("api/frameworks/", include("apps.frameworks.urls")),
    path("api/assessments/", include("apps.assessments.urls")),
    path("api/", include("apps.invitations.urls")),
    path("api/p/", include("apps.participants.urls")),
    path("api/", include("apps.dashboard.urls")),
]
