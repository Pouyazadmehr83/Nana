from django.contrib import admin
from django.urls import path, include
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.conf import settings
from django.conf.urls.static import static

@api_view(['GET'])
def health_check(request):
    """Simple API status health-check endpoint"""
    return Response({
        'status': 'ok',
        'message': 'Welcome to Nana Django REST Framework API with PostgreSQL & Docker!'
    })

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api-auth/', include('rest_framework.urls')),
    path('api/health/', health_check, name='health-check'),
]
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)