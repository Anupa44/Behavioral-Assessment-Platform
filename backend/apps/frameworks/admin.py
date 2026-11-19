from django.contrib import admin
from .models import Framework, Trait, ScoreBand


class TraitInline(admin.TabularInline):
    model = Trait
    extra = 0


class ScoreBandInline(admin.TabularInline):
    model = ScoreBand
    extra = 0


@admin.register(Framework)
class FrameworkAdmin(admin.ModelAdmin):
    list_display = ["name", "slug"]
    inlines = [TraitInline]


@admin.register(Trait)
class TraitAdmin(admin.ModelAdmin):
    list_display = ["name", "code", "framework", "order"]
    inlines = [ScoreBandInline]
