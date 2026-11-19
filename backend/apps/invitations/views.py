from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.assessments.models import Assessment
from .models import InvitationBatch, Invitation
from .serializers import InvitationBatchSerializer, CreateBatchSerializer
from .tasks import send_invitation_email


def _get_maker_assessment(maker, assessment_id):
    return get_object_or_404(Assessment, id=assessment_id, maker=maker)


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def batch_list(request, assessment_id):
    assessment = _get_maker_assessment(request.user, assessment_id)

    if request.method == "GET":
        batches = InvitationBatch.objects.filter(
            assessment_version__assessment=assessment
        ).order_by("-created_at")
        return Response(InvitationBatchSerializer(batches, many=True).data)

    if assessment.status != Assessment.STATUS_PUBLISHED:
        return Response(
            {"error": "Assessment must be published before sending invitations."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    serializer = CreateBatchSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    emails = serializer.validated_data["emails"]
    version = assessment.current_version
    expiry_days = assessment.link_expiry_days

    # Warn about duplicates already invited to this version
    existing = set(
        Invitation.objects.filter(
            batch__assessment_version=version
        ).values_list("participant_email", flat=True)
    )
    duplicates = [e for e in emails if e in existing]

    batch = InvitationBatch.objects.create(assessment_version=version, sent_count=len(emails))

    invitations = []
    for email in emails:
        inv = Invitation.create_for(batch, email, expiry_days)
        invitations.append(inv)
        send_invitation_email.delay(inv.id)

    # Lock framework after first batch
    if not assessment.framework_locked:
        assessment.framework_locked = True
        assessment.save(update_fields=["framework_locked"])

    response_data = InvitationBatchSerializer(batch).data
    if duplicates:
        response_data["warnings"] = {
            "duplicate_emails": duplicates,
            "message": f"{len(duplicates)} email(s) were already invited to this version.",
        }

    return Response(response_data, status=status.HTTP_201_CREATED)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def participant_list(request, assessment_id):
    assessment = _get_maker_assessment(request.user, assessment_id)
    status_filter = request.query_params.get("status")

    # Update expired statuses
    now = timezone.now()
    Invitation.objects.filter(
        batch__assessment_version__assessment=assessment,
        status=Invitation.STATUS_INVITED,
        expires_at__lt=now,
    ).update(status=Invitation.STATUS_EXPIRED)

    invitations = Invitation.objects.filter(
        batch__assessment_version__assessment=assessment
    ).order_by("-issued_at")

    if status_filter:
        invitations = invitations.filter(status=status_filter)

    from .serializers import InvitationSerializer
    return Response(InvitationSerializer(invitations, many=True).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def resend_invitation(request, assessment_id, invitation_id):
    assessment = _get_maker_assessment(request.user, assessment_id)
    inv = get_object_or_404(
        Invitation, id=invitation_id, batch__assessment_version__assessment=assessment
    )

    if inv.status == Invitation.STATUS_COMPLETED:
        return Response({"error": "Cannot resend a completed invitation."}, status=status.HTTP_400_BAD_REQUEST)

    if inv.is_expired():
        return Response(
            {"error": "Link is expired. Use reissue to generate a new link."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    send_invitation_email.delay(inv.id)
    return Response({"message": "Invitation resent."})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def reissue_invitation(request, assessment_id, invitation_id):
    assessment = _get_maker_assessment(request.user, assessment_id)
    old_inv = get_object_or_404(
        Invitation, id=invitation_id, batch__assessment_version__assessment=assessment
    )

    if old_inv.status == Invitation.STATUS_COMPLETED:
        return Response({"error": "Cannot reissue a completed invitation."}, status=status.HTTP_400_BAD_REQUEST)

    old_inv.invalidated = True
    old_inv.save(update_fields=["invalidated"])

    new_inv = Invitation.create_for(
        old_inv.batch, old_inv.participant_email, assessment.link_expiry_days
    )
    send_invitation_email.delay(new_inv.id)

    from .serializers import InvitationSerializer
    return Response(InvitationSerializer(new_inv).data, status=status.HTTP_201_CREATED)
