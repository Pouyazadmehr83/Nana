from django.urls import path
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenBlacklistView,
)
from drf_spectacular.utils import extend_schema, extend_schema_view
from .views import RegisterView, UserProfileView
from .serializers import CustomTokenObtainPairSerializer


@extend_schema_view(
    post=extend_schema(
        tags=['Auth'],
        summary='ورود و دریافت توکن JWT (Access و Refresh)',
        description='با ارسال شماره موبایل و رمز عبور، جفت توکن دسترسی و تمدید صادر می‌شود.'
    )
)
class ThrottledTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
    throttle_scope = 'auth'


@extend_schema_view(
    post=extend_schema(
        tags=['Auth'],
        summary='تمدید توکن دسترسی (Token Refresh)',
        description='با ارسال توکن معتبر refresh، توکن جدید access (و توکن رفرش چرخشی جدید) دریافت می‌شود.'
    )
)
class ThrottledTokenRefreshView(TokenRefreshView):
    throttle_scope = 'auth'


@extend_schema_view(
    post=extend_schema(
        tags=['Auth'],
        summary='خروج کاربر و باطل‌سازی توکن (Token Blacklist)',
        description='با ارسال توکن refresh هنگام خروج، آن توکن در لیست سیاه قرار گرفته و منقضی می‌گردد.'
    )
)
class ThrottledTokenBlacklistView(TokenBlacklistView):
    throttle_scope = 'auth'


urlpatterns = [
    path('register/', RegisterView.as_view(), name='auth-register'),
    path('token/', ThrottledTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', ThrottledTokenRefreshView.as_view(), name='token_refresh'),
    path('token/blacklist/', ThrottledTokenBlacklistView.as_view(), name='token_blacklist'),
    path('me/', UserProfileView.as_view(), name='user-profile'),
]