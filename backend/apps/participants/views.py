from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from apps.invitations.models import Invitation
from .models import Session, SessionAnswer
from .serializers import AssessmentPublicSerializer, SaveAnswerSerializer


def _get_valid_invitation(token):
    try:
        inv = Invitation.objects.select_related(
            "batch__assessment_version__assessment__framework"
        ).get(link_token=token, invalidated=False)
    except Invitation.DoesNotExist:
        return None, "invalid"

    if inv.status == Invitation.STATUS_COMPLETED:
        return inv, "completed"

    if inv.is_expired():
        inv.status = Invitation.STATUS_EXPIRED
        inv.save(update_fields=["status"])
        return inv, "expired"

    return inv, "valid"


@api_view(["GET"])
@permission_classes([AllowAny])
def assessment_access(request, token):
    inv, state = _get_valid_invitation(token)

    if state == "invalid":
        return Response({"error": "invalid", "message": "This link is invalid."}, status=status.HTTP_404_NOT_FOUND)

    if state == "expired":
        return Response({"error": "expired", "message": "This link has expired."}, status=status.HTTP_410_GONE)

    if state == "completed":
        return Response({"error": "completed", "message": "You have already completed this assessment."}, status=status.HTTP_409_CONFLICT)

    version = inv.batch.assessment_version
    assessment = version.assessment

    # Get or create session
    session, created = Session.objects.get_or_create(invitation=inv)
    if created:
        session.time_started = timezone.now()
        session.save(update_fields=["time_started"])
        inv.status = Invitation.STATUS_IN_PROGRESS
        inv.save(update_fields=["status"])

    # Saved answers map: question_id -> answer_option_id
    saved_answers = {
        str(a.question_id): a.answer_option_id
        for a in session.answers.all()
    }

    questions = version.questions.prefetch_related("options").all()

    data = {
        "assessment_id": assessment.id,
        "title": assessment.title,
        "description": assessment.description,
        "framework_name": assessment.framework.name,
        "time_limit_minutes": assessment.time_limit_minutes,
        "questions": questions,
        "session_id": session.id,
        "answered_question_ids": list(saved_answers.keys()),
        "saved_answers": saved_answers,
    }

    # Include elapsed time for time-limited assessments
    if assessment.time_limit_minutes:
        data["elapsed_seconds"] = session.elapsed_seconds

    serializer = AssessmentPublicSerializer(data)
    return Response(serializer.data)


@api_view(["POST"])
@permission_classes([AllowAny])
def save_answer(request, token):
    inv, state = _get_valid_invitation(token)

    if state != "valid":
        return Response({"error": state}, status=status.HTTP_409_CONFLICT)

    session = get_object_or_404(Session, invitation=inv)

    serializer = SaveAnswerSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    question_id = serializer.validated_data["question_id"]
    option = serializer.validated_data["option"]

    # Verify question belongs to this assessment version
    version = inv.batch.assessment_version
    if not version.questions.filter(id=question_id).exists():
        return Response({"error": "Question does not belong to this assessment."}, status=status.HTTP_400_BAD_REQUEST)

    SessionAnswer.objects.update_or_create(
        session=session,
        question_id=question_id,
        defaults={"answer_option": option},
    )

    return Response({"saved": True})


@api_view(["POST"])
@permission_classes([AllowAny])
def submit_assessment(request, token):
    inv, state = _get_valid_invitation(token)

    if state == "completed":
        return Response({"error": "Already submitted."}, status=status.HTTP_409_CONFLICT)

    if state not in ("valid",):
        return Response({"error": state}, status=status.HTTP_409_CONFLICT)

    session = get_object_or_404(Session, invitation=inv)
    version = inv.batch.assessment_version
    total_questions = version.questions.count()
    answered = session.answers.count()

    # Check time limit
    assessment = version.assessment
    if assessment.time_limit_minutes:
        elapsed = session.elapsed_seconds
        limit_seconds = assessment.time_limit_minutes * 60
        if elapsed > limit_seconds + 30:  # 30s grace
            pass  # auto-submit with partial answers

    if answered < total_questions and not (
        assessment.time_limit_minutes and session.elapsed_seconds >= assessment.time_limit_minutes * 60
    ):
        return Response(
            {"error": f"Please answer all {total_questions} questions before submitting. ({answered} answered)"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Submit
    now = timezone.now()
    session.submitted_at = now
    session.save(update_fields=["submitted_at"])

    inv.status = Invitation.STATUS_COMPLETED
    inv.save(update_fields=["status"])

    # Trigger result processing
    from apps.results.tasks import process_result
    process_result.delay(session.id)

    return Response({"message": "Assessment submitted successfully.", "session_id": session.id})
