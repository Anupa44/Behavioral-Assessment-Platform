import logging
import re
from django.conf import settings
from django.contrib.auth import authenticate
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Maker, EmailToken
from .serializers import (
    RegisterSerializer,
    LoginSerializer,
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer,
    MakerSerializer,
)
from .tasks import send_verification_email, send_password_reset_email

logger = logging.getLogger(__name__)


def _issue_tokens(user):
    refresh = RefreshToken.for_user(user)
    return {
        "access": str(refresh.access_token),
        "refresh": str(refresh),
        "user": MakerSerializer(user).data,
    }


@api_view(["POST"])
@permission_classes([AllowAny])
def register(request):
    serializer = RegisterSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    maker = serializer.save()
    token = EmailToken.create_for(maker, "verification")
    send_verification_email.delay(maker.id, token.token)

    return Response(
        {"message": "Registration successful. Please check your email to verify your account."},
        status=status.HTTP_201_CREATED,
    )


@api_view(["POST"])
@permission_classes([AllowAny])
def google_login(request):
    """Verify a Google ID token from the frontend and issue JWT tokens."""
    credential = request.data.get("credential")
    if not credential:
        return Response({"error": "Google credential is required."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        from google.oauth2 import id_token
        from google.auth.transport import requests as google_requests

        client_id = settings.GOOGLE_CLIENT_ID
        id_info = id_token.verify_oauth2_token(credential, google_requests.Request(), client_id)
        email = id_info.get("email")
        if not email:
            raise ValueError("No email in token")
    except Exception as e:
        logger.warning(
            "Google token verification failed (%s): %s | expected audience=%s",
            type(e).__name__, e, settings.GOOGLE_CLIENT_ID or "(unset)",
        )
        return Response({"error": f"Invalid Google token: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

    maker, created = Maker.objects.get_or_create(
        email=email,
        defaults={"username": email, "email_verified": True},
    )
    if created:
        maker.set_unusable_password()
        maker.email_verified = True
        maker.save()

    return Response(_issue_tokens(maker))


@api_view(["POST"])
@permission_classes([AllowAny])
def verify_email(request):
    token_value = request.data.get("token")
    if not token_value:
        return Response({"error": "Token is required."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        token = EmailToken.objects.get(token=token_value, token_type="verification")
    except EmailToken.DoesNotExist:
        return Response({"error": "Invalid token."}, status=status.HTTP_400_BAD_REQUEST)

    if not token.is_valid():
        return Response(
            {"error": "Token has expired or already been used."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    token.maker.email_verified = True
    token.maker.save(update_fields=["email_verified"])
    token.consume()

    return Response({"message": "Email verified successfully."})


@api_view(["POST"])
@permission_classes([AllowAny])
def resend_verification(request):
    email = request.data.get("email")
    try:
        maker = Maker.objects.get(email=email, email_verified=False)
    except Maker.DoesNotExist:
        return Response({"message": "If this email exists and is unverified, a new link has been sent."})

    token = EmailToken.create_for(maker, "verification")
    send_verification_email.delay(maker.id, token.token)
    return Response({"message": "If this email exists and is unverified, a new link has been sent."})


@api_view(["POST"])
@permission_classes([AllowAny])
def login(request):
    serializer = LoginSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    email = serializer.validated_data["email"]
    password = serializer.validated_data["password"]

    try:
        maker = Maker.objects.get(email=email)
    except Maker.DoesNotExist:
        return Response({"error": "Invalid credentials."}, status=status.HTTP_401_UNAUTHORIZED)

    if maker.is_locked():
        return Response(
            {"error": "Account is temporarily locked due to multiple failed login attempts."},
            status=status.HTTP_403_FORBIDDEN,
        )

    user = authenticate(request, username=email, password=password)
    if not user:
        maker.record_failed_login()
        return Response({"error": "Invalid credentials."}, status=status.HTTP_401_UNAUTHORIZED)

    maker.reset_failed_login()
    return Response(_issue_tokens(user))


@api_view(["POST"])
@permission_classes([AllowAny])
def password_reset_request(request):
    serializer = PasswordResetRequestSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    try:
        maker = Maker.objects.get(email=serializer.validated_data["email"])
        token = EmailToken.create_for(maker, "password_reset")
        send_password_reset_email.delay(maker.id, token.token)
    except Maker.DoesNotExist:
        pass

    return Response({"message": "If this email exists, a password reset link has been sent."})


@api_view(["POST"])
@permission_classes([AllowAny])
def password_reset_confirm(request):
    serializer = PasswordResetConfirmSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    try:
        token = EmailToken.objects.get(
            token=serializer.validated_data["token"], token_type="password_reset"
        )
    except EmailToken.DoesNotExist:
        return Response({"error": "Invalid token."}, status=status.HTTP_400_BAD_REQUEST)

    if not token.is_valid():
        return Response(
            {"error": "Token has expired or already been used."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    maker = token.maker
    maker.set_password(serializer.validated_data["password"])
    maker.save()
    token.consume()

    return Response({"message": "Password reset successfully. Please log in with your new password."})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me(request):
    return Response(MakerSerializer(request.user).data)
