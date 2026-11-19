from django.urls import path
from . import views

urlpatterns = [
    path("", views.assessment_list, name="assessment-list"),
    path("<int:pk>/", views.assessment_detail, name="assessment-detail"),
    path("<int:pk>/publish/", views.publish_assessment, name="assessment-publish"),
    path("<int:pk>/questions/", views.question_list, name="question-list"),
    path("<int:pk>/questions/<int:qid>/", views.question_detail, name="question-detail"),
    path("<int:pk>/questions/reorder/", views.reorder_questions, name="question-reorder"),
    path("<int:pk>/ai-generate/", views.ai_generate, name="ai-generate"),
    path("<int:pk>/ai-generate/<int:job_id>/", views.ai_job_status, name="ai-job-status"),
    path("<int:pk>/ai-generate/<int:job_id>/accept/", views.ai_accept_questions, name="ai-accept"),
    path("<int:pk>/ai-generate/<int:job_id>/questions/<int:staged_id>/regenerate/", views.ai_regenerate_question, name="ai-regenerate-question"),
]
