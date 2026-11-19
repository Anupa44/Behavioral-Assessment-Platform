from rest_framework import serializers
from .models import InvitationBatch, Invitation


class InvitationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Invitation
        fields = ["id", "participant_email", "status", "expires_at", "issued_at"]


class InvitationBatchSerializer(serializers.ModelSerializer):
    invitations = InvitationSerializer(many=True, read_only=True)
    version_number = serializers.IntegerField(source="assessment_version.version_number", read_only=True)

    class Meta:
        model = InvitationBatch
        fields = ["id", "version_number", "created_at", "sent_count", "invitations"]


class CreateBatchSerializer(serializers.Serializer):
    emails = serializers.ListField(
        child=serializers.EmailField(),
        min_length=1,
    )

    def validate_emails(self, emails):
        # De-duplicate
        return list(dict.fromkeys(e.lower().strip() for e in emails))
