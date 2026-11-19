from django.urls import path
from . import views

urlpatterns = [
    path("assessments/<int:assessment_id>/analytics/", views.cohort_analytics, name="cohort-analytics"),
    path("assessments/<int:assessment_id>/participants/<int:invitation_id>/result/", views.participant_result, name="participant-result"),
]
