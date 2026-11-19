from django.urls import path
from . import views

urlpatterns = [
    path("assessments/<int:assessment_id>/batches/", views.batch_list, name="batch-list"),
    path("assessments/<int:assessment_id>/participants/", views.participant_list, name="participant-list"),
    path("assessments/<int:assessment_id>/participants/<int:invitation_id>/resend/", views.resend_invitation, name="invitation-resend"),
    path("assessments/<int:assessment_id>/participants/<int:invitation_id>/reissue/", views.reissue_invitation, name="invitation-reissue"),
]
