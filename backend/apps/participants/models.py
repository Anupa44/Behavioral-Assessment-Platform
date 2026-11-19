from django.db import models
from django.utils import timezone
from apps.invitations.models import Invitation
from apps.assessments.models import Question, AnswerOption


class Session(models.Model):
    invitation = models.OneToOneField(Invitation, on_delete=models.CASCADE, related_name="session")
    started_at = models.DateTimeField(auto_now_add=True)
    submitted_at = models.DateTimeField(null=True, blank=True)
    time_started = models.DateTimeField(null=True, blank=True)

    @property
    def is_submitted(self):
        return self.submitted_at is not None

    @property
    def elapsed_seconds(self):
        if not self.time_started:
            return 0
        end = self.submitted_at or timezone.now()
        return int((end - self.time_started).total_seconds())

    def __str__(self):
        return f"Session for {self.invitation.participant_email}"


class SessionAnswer(models.Model):
    session = models.ForeignKey(Session, on_delete=models.CASCADE, related_name="answers")
    question = models.ForeignKey(Question, on_delete=models.CASCADE)
    answer_option = models.ForeignKey(AnswerOption, on_delete=models.CASCADE)
    answered_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = [("session", "question")]

    def __str__(self):
        return f"Answer by {self.session.invitation.participant_email} for Q{self.question.id}"
