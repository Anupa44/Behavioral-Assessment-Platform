from rest_framework import serializers
from .models import Framework, Trait, ScoreBand


class ScoreBandSerializer(serializers.ModelSerializer):
    class Meta:
        model = ScoreBand
        fields = ["id", "name", "min_score", "max_score", "label", "interpretive_text"]


class TraitSerializer(serializers.ModelSerializer):
    score_bands = ScoreBandSerializer(many=True, read_only=True)

    class Meta:
        model = Trait
        fields = ["id", "name", "code", "description", "order", "score_bands"]


class FrameworkSerializer(serializers.ModelSerializer):
    traits = TraitSerializer(many=True, read_only=True)

    class Meta:
        model = Framework
        fields = ["id", "name", "slug", "description", "normalization_min", "normalization_max", "traits"]
