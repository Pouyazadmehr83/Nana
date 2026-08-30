from django.contrib import admin
from django.urls import path, include
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)
from drf_spectacular.utils import extend_schema, OpenApiResponse


@extend_schema(
    tags=['General'],
    summary='بررسی وضعیت سلامت API',
    description='این اندپوینت وضعیت فعال بودن سرویس و اتصال به سیستم را بازمی‌گرداند.',
    responses={
        200: OpenApiResponse(description='سرویس فعال است و مشکلی ندارد.')
    }
)
@api_view(['GET', 'HEAD'])
@permission_classes([AllowAny])
def health_check(request):
    """Simple API status health-check endpoint"""
    return Response({
        'status': 'ok',
        'message': 'Welcome to Nana Django REST Framework API with PostgreSQL & Docker!'
    })


@extend_schema(
    tags=['General'],
    summary='صفحه اصلی API',
    description='خوش‌آمدگویی و راهنمای اندپوینت‌های API پلتفرم نانا',
    responses={
        200: OpenApiResponse(description='سرویس فعال است.')
    }
)
@api_view(['GET', 'HEAD'])
@permission_classes([AllowAny])
def root_view(request):
    """Root API endpoint providing service info and links"""
    return Response({
        'status': 'online',
        'name': 'Nana Pet Lost & Found API',
        'version': '1.0.0',
        'docs': '/api/docs/swagger/',
        'health': '/api/health/',
        'endpoints': {
            'pets': '/api/v1/pets/reports/',
            'auth': '/api/v1/auth/',
            'sightings': '/api/v1/pets/sightings/',
        }
    })


urlpatterns = [
    path('', root_view, name='root'),
    path('admin/', admin.site.urls),
    path('api-auth/', include('rest_framework.urls')),
    path('api/health/', health_check, name='health-check'),
    path('api/v1/pets/', include('pets.urls')),
    path('api/v1/auth/', include('accounts.urls')),

    # مستندات OpenAPI و Swagger / Redoc
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/swagger/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/docs/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]

from django.urls import re_path
from django.views.static import serve

urlpatterns += [
    re_path(r'^media/(?P<path>.*)$', serve, {'document_root': settings.MEDIA_ROOT}),
]