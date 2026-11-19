from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Assessment, AssessmentVersion, Question, AnswerOption, AIGenerationJob, StagedQuestion
from .serializers import (
    AssessmentListSerializer,
    AssessmentDetailSerializer,
    AssessmentWriteSerializer,
    QuestionSerializer,
    QuestionWriteSerializer,
    AIGenerationJobSerializer,
    StagedQuestionSerializer,
)
from .tasks import run_ai_generation


def _get_maker_assessment(maker, assessment_id):
    return get_object_or_404(Assessment, id=assessment_id, maker=maker)


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def assessment_list(request):
    if request.method == "GET":
        assessments = Assessment.objects.filter(maker=request.user)
        return Response(AssessmentListSerializer(assessments, many=True).data)

    serializer = AssessmentWriteSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    assessment = serializer.save(maker=request.user)
    # Create initial version
    AssessmentVersion.objects.create(assessment=assessment, version_number=1)
    return Response(AssessmentDetailSerializer(assessment).data, status=status.HTTP_201_CREATED)


@api_view(["GET", "PATCH", "DELETE"])
@permission_classes([IsAuthenticated])
def assessment_detail(request, pk):
    assessment = _get_maker_assessment(request.user, pk)

    if request.method == "GET":
        return Response(AssessmentDetailSerializer(assessment).data)

    if request.method == "PATCH":
        serializer = AssessmentWriteSerializer(assessment, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save()
        return Response(AssessmentDetailSerializer(assessment).data)

    assessment.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def publish_assessment(request, pk):
    assessment = _get_maker_assessment(request.user, pk)
    version = assessment.current_version

    if not version or version.questions.count() == 0:
        return Response(
            {"error": "Assessment must have at least one question before publishing."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    assessment.status = Assessment.STATUS_PUBLISHED
    assessment.save(update_fields=["status"])
    return Response(AssessmentDetailSerializer(assessment).data)


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def question_list(request, pk):
    assessment = _get_maker_assessment(request.user, pk)
    version = assessment.current_version

    if request.method == "GET":
        if not version:
            return Response([])
        return Response(QuestionSerializer(version.questions.all(), many=True).data)

    if assessment.status == Assessment.STATUS_PUBLISHED:
        # Create new version for edits on published assessment
        new_version_num = (version.version_number if version else 0) + 1
        new_version = AssessmentVersion.objects.create(
            assessment=assessment, version_number=new_version_num
        )
        # Copy existing questions to new version
        if version:
            for q in version.questions.all():
                old_opts = list(q.options.all())
                q.pk = None
                q.assessment_version = new_version
                q.save()
                for opt in old_opts:
                    opt.pk = None
                    opt.question = q
                    opt.save()
        version = new_version

    serializer = QuestionWriteSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    question = serializer.save(assessment_version=version)
    return Response(QuestionSerializer(question).data, status=status.HTTP_201_CREATED)


@api_view(["PUT", "DELETE"])
@permission_classes([IsAuthenticated])
def question_detail(request, pk, qid):
    assessment = _get_maker_assessment(request.user, pk)
    version = assessment.current_version
    question = get_object_or_404(Question, id=qid, assessment_version=version)

    if request.method == "DELETE":
        question.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    serializer = QuestionWriteSerializer(question, data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    serializer.save()
    return Response(QuestionSerializer(question).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def reorder_questions(request, pk):
    assessment = _get_maker_assessment(request.user, pk)
    version = assessment.current_version
    order_map = request.data.get("order", {})  # {question_id: new_order}

    for qid, order in order_map.items():
        Question.objects.filter(id=qid, assessment_version=version).update(order=order)

    return Response(QuestionSerializer(version.questions.all(), many=True).data)


# AI Generation
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def ai_generate(request, pk):
    assessment = _get_maker_assessment(request.user, pk)
    prompt = request.data.get("prompt", "")
    question_count = int(request.data.get("question_count", 10))

    if not prompt:
        return Response({"error": "Prompt is required."}, status=status.HTTP_400_BAD_REQUEST)

    job = AIGenerationJob.objects.create(
        assessment=assessment, prompt=prompt, question_count=question_count
    )
    run_ai_generation.delay(job.id)

    return Response(AIGenerationJobSerializer(job).data, status=status.HTTP_202_ACCEPTED)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def ai_job_status(request, pk, job_id):
    assessment = _get_maker_assessment(request.user, pk)
    job = get_object_or_404(AIGenerationJob, id=job_id, assessment=assessment)
    return Response(AIGenerationJobSerializer(job).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def ai_accept_questions(request, pk, job_id):
    """Accept all or specific staged questions into the assessment."""
    assessment = _get_maker_assessment(request.user, pk)
    job = get_object_or_404(AIGenerationJob, id=job_id, assessment=assessment, status="done")
    version = assessment.current_version

    staged_ids = request.data.get("staged_ids")  # None = accept all
    staged_qs = job.staged_questions.filter(accepted=False, rejected=False)
    if staged_ids:
        staged_qs = staged_qs.filter(id__in=staged_ids)

    from apps.frameworks.models import Trait

    created = []
    for sq in staged_qs:
        q = Question.objects.create(
            assessment_version=version,
            prompt=sq.prompt,
            order=version.questions.count(),
            ai_generated=True,
        )
        for opt in sq.options_data:
            try:
                trait = Trait.objects.get(
                    framework=assessment.framework, code=opt["trait_code"]
                )
                AnswerOption.objects.create(question=q, text=opt["text"], trait=trait)
            except Trait.DoesNotExist:
                pass
        sq.accepted = True
        sq.save(update_fields=["accepted"])
        created.append(q)

    return Response(QuestionSerializer(created, many=True).data, status=status.HTTP_201_CREATED)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def ai_regenerate_question(request, pk, job_id, staged_id):
    assessment = _get_maker_assessment(request.user, pk)
    job = get_object_or_404(AIGenerationJob, id=job_id, assessment=assessment)
    staged = get_object_or_404(StagedQuestion, id=staged_id, job=job)

    from .ai_service import generate_questions

    try:
        traits = assessment.framework.traits.all()
        result = generate_questions(assessment.framework, traits, job.prompt, 1)
        if result:
            q = result[0]
            staged.prompt = q["prompt"]
            staged.options_data = q["options"]
            staged.save(update_fields=["prompt", "options_data"])
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    return Response(StagedQuestionSerializer(staged).data)
