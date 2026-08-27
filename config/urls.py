from django.contrib import admin
from django.urls import path, include
from rest_framework.decorators import api_view
from rest_framework.response import Response

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
