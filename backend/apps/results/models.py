from django.db import models
from apps.participants.models import Session
from apps.frameworks.models import Trait, ScoreBand


class Result(models.Model):
    session = models.OneToOneField(Session, on_delete=models.CASCADE, related_name="result")
    processed_at = models.DateTimeField(auto_now_add=True)
    result_email_sent = models.BooleanField(default=False)

    def __str__(self):
        return f"Result for {self.session.invitation.participant_email}"


class TraitScore(models.Model):
    result = models.ForeignKey(Result, on_delete=models.CASCADE, related_name="trait_scores")
    trait = models.ForeignKey(Trait, on_delete=models.PROTECT)
    raw_score = models.IntegerField(default=0)
    normalized_score = models.FloatField(default=0.0)
    score_band = models.ForeignKey(ScoreBand, on_delete=models.PROTECT, null=True, blank=True)

    class Meta:
        unique_together = [("result", "trait")]
        ordering = ["trait__order"]

    def __str__(self):
        return f"{self.trait.name}: {self.normalized_score}"
