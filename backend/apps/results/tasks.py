from celery import shared_task


@shared_task
def process_result(session_id):
    from apps.participants.models import Session
    from apps.frameworks.models import ScoreBand
    from .models import Result, TraitScore

    try:
        session = Session.objects.select_related(
            "invitation__batch__assessment_version__assessment__framework"
        ).prefetch_related(
            "answers__answer_option__trait",
            "invitation__batch__assessment_version__assessment__framework__traits__score_bands",
        ).get(id=session_id)
    except Session.DoesNotExist:
        return

    assessment = session.invitation.batch.assessment_version.assessment
    framework = assessment.framework
    traits = list(framework.traits.all())

    # Count raw scores per trait
    raw_scores = {t.id: 0 for t in traits}
    for answer in session.answers.all():
        trait_id = answer.answer_option.trait_id
        if trait_id in raw_scores:
            raw_scores[trait_id] += 1

    total_questions = session.invitation.batch.assessment_version.questions.count()

    result = Result.objects.create(session=session)

    for trait in traits:
        raw = raw_scores.get(trait.id, 0)
        # Normalize to 0–100
        norm = (raw / max(total_questions, 1)) * 100

        # Find score band
        band = None
        for sb in trait.score_bands.all():
            if sb.min_score <= norm <= sb.max_score:
                band = sb
                break

        TraitScore.objects.create(
            result=result,
            trait=trait,
            raw_score=raw,
            normalized_score=round(norm, 1),
            score_band=band,
        )

    # Send result email if enabled
    if assessment.result_email_enabled:
        from apps.invitations.tasks import send_result_email
        send_result_email.delay(result.id)
