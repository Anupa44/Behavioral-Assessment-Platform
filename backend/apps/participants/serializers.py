from rest_framework import serializers
from apps.assessments.models import Question, AnswerOption
from apps.invitations.models import Invitation
from .models import Session, SessionAnswer


class AnswerOptionPublicSerializer(serializers.ModelSerializer):
    class Meta:
        model = AnswerOption
        fields = ["id", "text", "order"]


class QuestionPublicSerializer(serializers.ModelSerializer):
    options = AnswerOptionPublicSerializer(many=True, read_only=True)

    class Meta:
        model = Question
        fields = ["id", "prompt", "order", "options"]


class AssessmentPublicSerializer(serializers.Serializer):
    """What a participant sees when they open their link."""
    assessment_id = serializers.IntegerField()
    title = serializers.CharField()
    description = serializers.CharField()
    framework_name = serializers.CharField()
    time_limit_minutes = serializers.IntegerField(allow_null=True)
    questions = QuestionPublicSerializer(many=True)
    session_id = serializers.IntegerField()
    answered_question_ids = serializers.ListField(child=serializers.IntegerField())
    saved_answers = serializers.DictField(child=serializers.IntegerField())


class SaveAnswerSerializer(serializers.Serializer):
    question_id = serializers.IntegerField()
    answer_option_id = serializers.IntegerField()

    def validate(self, data):
        q_id = data["question_id"]
        opt_id = data["answer_option_id"]
        try:
            option = AnswerOption.objects.get(id=opt_id, question_id=q_id)
        except AnswerOption.DoesNotExist:
            raise serializers.ValidationError("Invalid question/option combination.")
        data["option"] = option
        return data
