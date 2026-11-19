from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import Maker, EmailToken


@admin.register(Maker)
class MakerAdmin(UserAdmin):
    list_display = ["email", "email_verified", "date_joined"]
    ordering = ["-date_joined"]
    fieldsets = UserAdmin.fieldsets + (
        ("BAP", {"fields": ("email_verified", "failed_login_attempts", "locked_until")}),
    )


@admin.register(EmailToken)
class EmailTokenAdmin(admin.ModelAdmin):
    list_display = ["maker", "token_type", "created_at", "expires_at", "used"]
