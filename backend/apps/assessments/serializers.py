from rest_framework import serializers
from .models import Assessment, AssessmentVersion, Question, AnswerOption, AIGenerationJob, StagedQuestion
from apps.frameworks.models import Framework, Trait


class AnswerOptionSerializer(serializers.ModelSerializer):
    trait_code = serializers.CharField(source="trait.code", read_only=True)
    trait_name = serializers.CharField(source="trait.name", read_only=True)

    class Meta:
        model = AnswerOption
        fields = ["id", "text", "trait", "trait_code", "trait_name", "order"]


class AnswerOptionWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = AnswerOption
        fields = ["id", "text", "trait", "order"]


class QuestionSerializer(serializers.ModelSerializer):
    options = AnswerOptionSerializer(many=True, read_only=True)

    class Meta:
        model = Question
        fields = ["id", "prompt", "order", "ai_generated", "options"]


class QuestionWriteSerializer(serializers.ModelSerializer):
    options = AnswerOptionWriteSerializer(many=True)

    class Meta:
        model = Question
        fields = ["id", "prompt", "order", "options"]

    def validate_options(self, options):
        if len(options) < 2 or len(options) > 6:
            raise serializers.ValidationError("Questions must have between 2 and 6 options.")
        return options

    def create(self, validated_data):
        options_data = validated_data.pop("options")
        question = Question.objects.create(**validated_data)
        for i, option_data in enumerate(options_data):
            option_data["order"] = i
            AnswerOption.objects.create(question=question, **option_data)
        return question

    def update(self, instance, validated_data):
        options_data = validated_data.pop("options", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if options_data is not None:
            instance.options.all().delete()
            for i, option_data in enumerate(options_data):
                option_data["order"] = i
                AnswerOption.objects.create(question=instance, **option_data)

        return instance


class AssessmentVersionSerializer(serializers.ModelSerializer):
    question_count = serializers.IntegerField(source="questions.count", read_only=True)

    class Meta:
        model = AssessmentVersion
        fields = ["id", "version_number", "created_at", "question_count"]


class AssessmentListSerializer(serializers.ModelSerializer):
    framework_name = serializers.CharField(source="framework.name", read_only=True)
    framework_slug = serializers.CharField(source="framework.slug", read_only=True)
    question_count = serializers.SerializerMethodField()
    total_invited = serializers.SerializerMethodField()
    completion_rate = serializers.SerializerMethodField()

    class Meta:
        model = Assessment
        fields = [
            "id", "title", "description", "framework", "framework_name", "framework_slug",
            "status", "result_email_enabled", "link_expiry_days", "time_limit_minutes",
            "framework_locked", "question_count", "total_invited", "completion_rate",
            "created_at", "updated_at",
        ]

    def get_question_count(self, obj):
        v = obj.current_version
        return v.questions.count() if v else 0

    def get_total_invited(self, obj):
        from apps.invitations.models import Invitation
        return Invitation.objects.filter(batch__assessment_version__assessment=obj).count()

    def get_completion_rate(self, obj):
        from apps.invitations.models import Invitation
        total = Invitation.objects.filter(batch__assessment_version__assessment=obj).count()
        if not total:
            return None
        completed = Invitation.objects.filter(
            batch__assessment_version__assessment=obj, status="completed"
        ).count()
        return round(completed / total * 100, 1)


class AssessmentDetailSerializer(AssessmentListSerializer):
    versions = AssessmentVersionSerializer(many=True, read_only=True)

    class Meta(AssessmentListSerializer.Meta):
        fields = AssessmentListSerializer.Meta.fields + ["versions"]


class AssessmentWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Assessment
        fields = [
            "title", "description", "framework",
            "result_email_enabled", "link_expiry_days", "time_limit_minutes",
        ]

    def validate_framework(self, framework):
        instance = self.instance
        if instance and instance.framework_locked and instance.framework != framework:
            raise serializers.ValidationError(
                "Framework cannot be changed after the first invitation batch is sent."
            )
        return framework


class StagedQuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = StagedQuestion
        fields = ["id", "prompt", "order", "options_data", "accepted", "rejected"]


class AIGenerationJobSerializer(serializers.ModelSerializer):
    staged_questions = StagedQuestionSerializer(many=True, read_only=True)

    class Meta:
        model = AIGenerationJob
        fields = ["id", "prompt", "question_count", "status", "error_message", "created_at", "staged_questions"]
