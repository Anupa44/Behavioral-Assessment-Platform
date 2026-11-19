from celery import shared_task
from django.conf import settings
from django.core.mail import send_mail


@shared_task
def send_invitation_email(invitation_id):
    from .models import Invitation
    try:
        inv = Invitation.objects.select_related("batch__assessment_version__assessment").get(id=invitation_id)
    except Invitation.DoesNotExist:
        return

    assessment = inv.batch.assessment_version.assessment
    link_url = f"{settings.FRONTEND_URL}/a/{inv.link_token}"
    expiry_date = inv.expires_at.strftime("%B %d, %Y")

    send_mail(
        subject=f"You've been invited to complete: {assessment.title}",
        message=(
            f"Hello,\n\nYou have been invited to complete a behavioral assessment: {assessment.title}.\n\n"
            f"Click the link below to begin:\n{link_url}\n\n"
            f"This link expires on {expiry_date}.\n\nNo account is required."
        ),
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[inv.participant_email],
        html_message=f"""
        <p>Hello,</p>
        <p>You have been invited to complete a behavioral assessment: <strong>{assessment.title}</strong>.</p>
        <p><a href="{link_url}" style="background:#4F46E5;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;">Start Assessment</a></p>
        <p>Or copy this link: {link_url}</p>
        <p>This link expires on <strong>{expiry_date}</strong>. No account is required.</p>
        """,
    )


@shared_task
def send_result_email(result_id):
    from apps.results.models import Result
    try:
        result = Result.objects.select_related(
            "session__invitation__batch__assessment_version__assessment"
        ).prefetch_related("trait_scores__trait", "trait_scores__score_band").get(id=result_id)
    except Result.DoesNotExist:
        return

    session = result.session
    invitation = session.invitation
    assessment = invitation.batch.assessment_version.assessment

    if not assessment.result_email_enabled:
        return

    email = invitation.participant_email
    completed_at = session.submitted_at.strftime("%B %d, %Y at %H:%M UTC")

    # Build profile HTML
    profile_rows = ""
    profile_text = ""
    for ts in result.trait_scores.all():
        band = ts.score_band
        band_label = band.label if band else ""
        band_text = band.interpretive_text if band else ""
        profile_rows += f"""
        <tr>
          <td style="padding:8px;border-bottom:1px solid #eee;font-weight:600">{ts.trait.name}</td>
          <td style="padding:8px;border-bottom:1px solid #eee">{ts.normalized_score:.0f}</td>
          <td style="padding:8px;border-bottom:1px solid #eee">{band_label}</td>
          <td style="padding:8px;border-bottom:1px solid #eee">{band_text}</td>
        </tr>"""
        profile_text += f"\n{ts.trait.name}: {ts.normalized_score:.0f} ({band_label})\n{band_text}\n"

    send_mail(
        subject=f"Your Behavioral Profile: {assessment.title}",
        message=f"Hello,\n\nHere is your behavioral profile for: {assessment.title}\nCompleted: {completed_at}\n{profile_text}",
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[email],
        html_message=f"""
        <h2>Your Behavioral Profile</h2>
        <p><strong>Assessment:</strong> {assessment.title}</p>
        <p><strong>Completed:</strong> {completed_at}</p>
        <table style="width:100%;border-collapse:collapse;margin-top:16px">
          <thead>
            <tr style="background:#f5f5f5">
              <th style="padding:8px;text-align:left">Trait</th>
              <th style="padding:8px;text-align:left">Score</th>
              <th style="padding:8px;text-align:left">Band</th>
              <th style="padding:8px;text-align:left">Description</th>
            </tr>
          </thead>
          <tbody>{profile_rows}</tbody>
        </table>
        """,
    )

    result.result_email_sent = True
    result.save(update_fields=["result_email_sent"])
