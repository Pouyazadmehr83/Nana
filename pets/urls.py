from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PetReportViewSet, SightingViewSet

router = DefaultRouter()
router.register(r'reports', PetReportViewSet, basename='pet-report')
router.register(r'sightings', SightingViewSet, basename='sighting')

urlpatterns = [
    path('', include(router.urls)),
]