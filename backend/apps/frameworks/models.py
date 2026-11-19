from django.db import models


class Framework(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)
    normalization_min = models.IntegerField(default=0)
    normalization_max = models.IntegerField(default=100)

    def __str__(self):
        return self.name


class Trait(models.Model):
    framework = models.ForeignKey(Framework, on_delete=models.CASCADE, related_name="traits")
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=10)
    description = models.TextField(blank=True)
    order = models.IntegerField(default=0)

    class Meta:
        ordering = ["order"]
        unique_together = [("framework", "code")]

    def __str__(self):
        return f"{self.framework.slug}/{self.name}"


class ScoreBand(models.Model):
    BAND_NAMES = [
        ("low", "Low"),
        ("mid", "Mid"),
        ("high", "High"),
    ]

    trait = models.ForeignKey(Trait, on_delete=models.CASCADE, related_name="score_bands")
    name = models.CharField(max_length=10, choices=BAND_NAMES)
    min_score = models.IntegerField()
    max_score = models.IntegerField()
    label = models.CharField(max_length=100)
    interpretive_text = models.TextField()

    class Meta:
        ordering = ["min_score"]
        unique_together = [("trait", "name")]

    def __str__(self):
        return f"{self.trait.name} - {self.name}"
