from celery import shared_task
from django.conf import settings
from django.core.mail import send_mail


@shared_task
def send_verification_email(maker_id, token):
    from .models import Maker
    try:
        maker = Maker.objects.get(id=maker_id)
    except Maker.DoesNotExist:
        return

    verify_url = f"{settings.FRONTEND_URL}/verify-email?token={token}"
    send_mail(
        subject="Verify your Behavioral Assessment Platform account",
        message=f"Hi {maker.email},\n\nClick the link below to verify your account:\n{verify_url}\n\nThis link expires in 24 hours.",
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[maker.email],
        html_message=f"""
        <p>Hi {maker.email},</p>
        <p>Click the button below to verify your account:</p>
        <p><a href="{verify_url}" style="background:#4F46E5;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;">Verify Email</a></p>
        <p>Or copy this link: {verify_url}</p>
        <p>This link expires in 24 hours.</p>
        """,
    )


@shared_task
def send_password_reset_email(maker_id, token):
    from .models import Maker
    try:
        maker = Maker.objects.get(id=maker_id)
    except Maker.DoesNotExist:
        return

    reset_url = f"{settings.FRONTEND_URL}/reset-password?token={token}"
    send_mail(
        subject="Reset your Behavioral Assessment Platform password",
        message=f"Hi {maker.email},\n\nClick the link below to reset your password:\n{reset_url}\n\nThis link expires in 1 hour.",
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[maker.email],
        html_message=f"""
        <p>Hi {maker.email},</p>
        <p>Click the button below to reset your password:</p>
        <p><a href="{reset_url}" style="background:#4F46E5;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;">Reset Password</a></p>
        <p>Or copy this link: {reset_url}</p>
        <p>This link expires in 1 hour.</p>
        """,
    )
