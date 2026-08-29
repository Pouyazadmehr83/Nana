from django.contrib import admin
from .models import PetReport, PetImage, Sighting


class PetImageInline(admin.TabularInline):
    model = PetImage
    extra = 1


class SightingInline(admin.StackedInline):
    model = Sighting
    extra = 0
    readonly_fields = ('created_at',)


@admin.register(PetReport)
class PetReportAdmin(admin.ModelAdmin):
    list_display = ('title', 'report_type', 'pet_type', 'city', 'is_resolved', 'event_date', 'created_at')
    list_filter = ('report_type', 'pet_type', 'is_resolved', 'city', 'event_date')
    search_fields = ('title', 'breed', 'color', 'city', 'special_features')
    inlines = [PetImageInline, SightingInline]
    ordering = ('-created_at',)


@admin.register(Sighting)
class SightingAdmin(admin.ModelAdmin):
    list_display = ('report', 'user', 'seen_at', 'location_description', 'created_at')
    list_filter = ('seen_at', 'created_at')
    search_fields = ('location_description', 'report__title')
    ordering = ('-seen_at',)