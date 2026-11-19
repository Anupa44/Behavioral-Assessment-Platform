import secrets
from django.db import models
from django.utils import timezone
from apps.assessments.models import AssessmentVersion


class InvitationBatch(models.Model):
    assessment_version = models.ForeignKey(
        AssessmentVersion, on_delete=models.CASCADE, related_name="batches"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    sent_count = models.IntegerField(default=0)

    def __str__(self):
        return f"Batch for {self.assessment_version} ({self.sent_count} invites)"


class Invitation(models.Model):
    STATUS_INVITED = "invited"
    STATUS_IN_PROGRESS = "in_progress"
    STATUS_COMPLETED = "completed"
    STATUS_EXPIRED = "expired"
    STATUS_CHOICES = [
        ("invited", "Invited"),
        ("in_progress", "In Progress"),
        ("completed", "Completed"),
        ("expired", "Expired"),
    ]

    batch = models.ForeignKey(InvitationBatch, on_delete=models.CASCADE, related_name="invitations")
    participant_email = models.EmailField()
    link_token = models.CharField(max_length=86, unique=True, db_index=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_INVITED)
    expires_at = models.DateTimeField()
    issued_at = models.DateTimeField(auto_now_add=True)
    invalidated = models.BooleanField(default=False)

    class Meta:
        indexes = [models.Index(fields=["link_token"]), models.Index(fields=["participant_email"])]

    @classmethod
    def create_for(cls, batch, email, expiry_days):
        token = secrets.token_urlsafe(64)
        return cls.objects.create(
            batch=batch,
            participant_email=email,
            link_token=token,
            expires_at=timezone.now() + timezone.timedelta(days=expiry_days),
        )

    def is_valid(self):
        return (
            not self.invalidated
            and self.status != self.STATUS_COMPLETED
            and timezone.now() <= self.expires_at
        )

    def is_expired(self):
        return timezone.now() > self.expires_at

    @property
    def assessment_version(self):
        return self.batch.assessment_version

    def __str__(self):
        return f"Invite for {self.participant_email} ({self.status})"
