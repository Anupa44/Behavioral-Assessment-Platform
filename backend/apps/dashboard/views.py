from django.shortcuts import get_object_or_404
from django.db.models import Avg, Count
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.assessments.models import Assessment
from apps.invitations.models import Invitation
from apps.results.models import Result, TraitScore


def _get_maker_assessment(maker, assessment_id):
    return get_object_or_404(Assessment, id=assessment_id, maker=maker)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def cohort_analytics(request, assessment_id):
    assessment = _get_maker_assessment(request.user, assessment_id)
    version_id = request.query_params.get("version")

    invitations = Invitation.objects.filter(batch__assessment_version__assessment=assessment)
    if version_id:
        invitations = invitations.filter(batch__assessment_version_id=version_id)

    total = invitations.count()
    completed = invitations.filter(status=Invitation.STATUS_COMPLETED).count()
    in_progress = invitations.filter(status=Invitation.STATUS_IN_PROGRESS).count()
    invited = invitations.filter(status=Invitation.STATUS_INVITED).count()
    expired = invitations.filter(status=Invitation.STATUS_EXPIRED).count()

    completion_rate = round(completed / total * 100, 1) if total else None

    # Trait averages and band distributions
    results = Result.objects.filter(session__invitation__in=invitations)
    trait_analytics = []

    for trait in assessment.framework.traits.all():
        scores = TraitScore.objects.filter(result__in=results, trait=trait)
        avg = scores.aggregate(avg=Avg("normalized_score"))["avg"]

        band_dist = {}
        for ts in scores.select_related("score_band"):
            band_name = ts.score_band.name if ts.score_band else "unknown"
            band_dist[band_name] = band_dist.get(band_name, 0) + 1

        trait_analytics.append({
            "trait_id": trait.id,
            "trait_name": trait.name,
            "trait_code": trait.code,
            "average_score": round(avg, 1) if avg is not None else None,
            "band_distribution": band_dist,
            "scores": list(scores.values_list("normalized_score", flat=True)),
        })

    return Response({
        "total": total,
        "completed": completed,
        "in_progress": in_progress,
        "invited": invited,
        "expired": expired,
        "completion_rate": completion_rate,
        "trait_analytics": trait_analytics,
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def participant_result(request, assessment_id, invitation_id):
    assessment = _get_maker_assessment(request.user, assessment_id)
    invitation = get_object_or_404(
        Invitation, id=invitation_id, batch__assessment_version__assessment=assessment
    )

    if invitation.status != Invitation.STATUS_COMPLETED:
        return Response({
            "participant_email": invitation.participant_email,
            "status": invitation.status,
            "result": None,
        })

    try:
        result = Result.objects.prefetch_related(
            "trait_scores__trait", "trait_scores__score_band"
        ).get(session__invitation=invitation)
    except Result.DoesNotExist:
        return Response({
            "participant_email": invitation.participant_email,
            "status": invitation.status,
            "result": None,
        })

    trait_scores = []
    for ts in result.trait_scores.all():
        band = ts.score_band
        trait_scores.append({
            "trait_id": ts.trait.id,
            "trait_name": ts.trait.name,
            "trait_code": ts.trait.code,
            "raw_score": ts.raw_score,
            "normalized_score": ts.normalized_score,
            "band_name": band.name if band else None,
            "band_label": band.label if band else None,
            "interpretive_text": band.interpretive_text if band else None,
        })

    return Response({
        "participant_email": invitation.participant_email,
        "status": invitation.status,
        "completed_at": result.session.submitted_at,
        "result": {
            "id": result.id,
            "processed_at": result.processed_at,
            "trait_scores": trait_scores,
        },
    })
