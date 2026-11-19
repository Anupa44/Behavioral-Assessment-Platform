from django.urls import path
from . import views

urlpatterns = [
    path("", views.framework_list, name="framework-list"),
    path("<slug:slug>/", views.framework_detail, name="framework-detail"),
]
