from celery import shared_task
from django.utils import timezone


@shared_task
def run_ai_generation(job_id):
    from .models import AIGenerationJob, StagedQuestion
    from .ai_service import generate_questions

    try:
        job = AIGenerationJob.objects.get(id=job_id)
    except AIGenerationJob.DoesNotExist:
        return

    job.status = AIGenerationJob.STATUS_PROCESSING
    job.save(update_fields=["status"])

    try:
        framework = job.assessment.framework
        traits = framework.traits.all()
        questions = generate_questions(framework, traits, job.prompt, job.question_count)

        StagedQuestion.objects.filter(job=job).delete()
        for i, q in enumerate(questions):
            StagedQuestion.objects.create(
                job=job,
                prompt=q["prompt"],
                order=i,
                options_data=q["options"],
            )

        job.status = AIGenerationJob.STATUS_DONE
        job.completed_at = timezone.now()
        job.save(update_fields=["status", "completed_at"])

    except Exception as e:
        job.status = AIGenerationJob.STATUS_FAILED
        job.error_message = str(e)
        job.save(update_fields=["status", "error_message"])
