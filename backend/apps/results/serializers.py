from rest_framework import serializers
from .models import Result, TraitScore


class TraitScoreSerializer(serializers.ModelSerializer):
    trait_name = serializers.CharField(source="trait.name", read_only=True)
    trait_code = serializers.CharField(source="trait.code", read_only=True)
    band_name = serializers.SerializerMethodField()
    band_label = serializers.SerializerMethodField()
    interpretive_text = serializers.SerializerMethodField()

    class Meta:
        model = TraitScore
        fields = ["trait", "trait_name", "trait_code", "raw_score", "normalized_score",
                  "band_name", "band_label", "interpretive_text"]

    def get_band_name(self, obj):
        return obj.score_band.name if obj.score_band else None

    def get_band_label(self, obj):
        return obj.score_band.label if obj.score_band else None

    def get_interpretive_text(self, obj):
        return obj.score_band.interpretive_text if obj.score_band else None


class ResultSerializer(serializers.ModelSerializer):
    trait_scores = TraitScoreSerializer(many=True, read_only=True)

    class Meta:
        model = Result
        fields = ["id", "processed_at", "result_email_sent", "trait_scores"]
