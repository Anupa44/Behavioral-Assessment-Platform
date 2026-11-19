from django.db import models
from apps.accounts.models import Maker
from apps.frameworks.models import Framework, Trait


class Assessment(models.Model):
    STATUS_DRAFT = "draft"
    STATUS_PUBLISHED = "published"
    STATUS_CHOICES = [("draft", "Draft"), ("published", "Published")]

    maker = models.ForeignKey(Maker, on_delete=models.CASCADE, related_name="assessments")
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    framework = models.ForeignKey(Framework, on_delete=models.PROTECT)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_DRAFT)
    result_email_enabled = models.BooleanField(default=False)
    link_expiry_days = models.IntegerField(default=7)
    time_limit_minutes = models.IntegerField(null=True, blank=True)
    framework_locked = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.title} ({self.status})"

    @property
    def current_version(self):
        return self.versions.order_by("-version_number").first()


class AssessmentVersion(models.Model):
    assessment = models.ForeignKey(Assessment, on_delete=models.CASCADE, related_name="versions")
    version_number = models.IntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-version_number"]
        unique_together = [("assessment", "version_number")]

    def __str__(self):
        return f"{self.assessment.title} v{self.version_number}"


class Question(models.Model):
    assessment_version = models.ForeignKey(
        AssessmentVersion, on_delete=models.CASCADE, related_name="questions"
    )
    prompt = models.TextField()
    order = models.IntegerField(default=0)
    ai_generated = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["order"]

    def __str__(self):
        return f"Q{self.order}: {self.prompt[:60]}"


class AnswerOption(models.Model):
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name="options")
    text = models.CharField(max_length=500)
    trait = models.ForeignKey(Trait, on_delete=models.PROTECT)
    order = models.IntegerField(default=0)

    class Meta:
        ordering = ["order"]

    def __str__(self):
        return f"{self.text[:40]} -> {self.trait.code}"


class AIGenerationJob(models.Model):
    STATUS_PENDING = "pending"
    STATUS_PROCESSING = "processing"
    STATUS_DONE = "done"
    STATUS_FAILED = "failed"
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("processing", "Processing"),
        ("done", "Done"),
        ("failed", "Failed"),
    ]

    assessment = models.ForeignKey(Assessment, on_delete=models.CASCADE, related_name="ai_jobs")
    prompt = models.TextField()
    question_count = models.IntegerField(default=10)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING)
    result_data = models.JSONField(null=True, blank=True)
    error_message = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"AI Job for {self.assessment.title} ({self.status})"


class StagedQuestion(models.Model):
    job = models.ForeignKey(AIGenerationJob, on_delete=models.CASCADE, related_name="staged_questions")
    prompt = models.TextField()
    order = models.IntegerField(default=0)
    options_data = models.JSONField(default=list)
    accepted = models.BooleanField(default=False)
    rejected = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["order"]
