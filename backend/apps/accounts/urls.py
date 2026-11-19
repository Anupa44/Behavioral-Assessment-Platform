from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    path("register/", views.register, name="auth-register"),
    path("verify-email/", views.verify_email, name="auth-verify-email"),
    path("resend-verification/", views.resend_verification, name="auth-resend-verification"),
    path("login/", views.login, name="auth-login"),
    path("google/", views.google_login, name="auth-google"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    path("password-reset/", views.password_reset_request, name="auth-password-reset"),
    path("password-reset/confirm/", views.password_reset_confirm, name="auth-password-reset-confirm"),
    path("me/", views.me, name="auth-me"),
]
