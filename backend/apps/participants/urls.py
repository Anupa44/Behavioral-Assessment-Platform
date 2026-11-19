from django.urls import path
from . import views

urlpatterns = [
    path("<str:token>/", views.assessment_access, name="participant-access"),
    path("<str:token>/answers/", views.save_answer, name="participant-answer"),
    path("<str:token>/submit/", views.submit_assessment, name="participant-submit"),
]
