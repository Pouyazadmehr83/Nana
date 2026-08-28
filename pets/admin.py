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
    list_display = ('title', 'report_type', 'species', 'city', 'status', 'event_date', 'created_at')
    list_filter = ('report_type', 'species', 'status', 'city', 'event_date')
    search_fields = ('title', 'breed', 'color', 'city', 'distinctive_features')
    inlines = [PetImageInline, SightingInline]
    ordering = ('-created_at',)


@admin.register(Sighting)
class SightingAdmin(admin.ModelAdmin):
    list_display = ('report', 'sighted_at', 'address_description', 'created_at')
    search_fields = ('address_description', 'message')