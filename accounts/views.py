from rest_framework import generics, permissions
from django.contrib.auth import get_user_model
from drf_spectacular.utils import extend_schema, extend_schema_view
from .serializers import UserRegisterSerializer, UserProfileSerializer

User = get_user_model()


@extend_schema(
    tags=['Auth'],
    summary='ثبت‌نام کاربر جدید',
    description='ایجاد حساب کاربری با شماره موبایل معتبر ایران (۰۹...)، رمز عبور، تکرار آن و فیلدهای اختیاری نام، نام خانوادگی و ایمیل.'
)
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = [permissions.AllowAny]
    serializer_class = UserRegisterSerializer
    throttle_scope = 'auth'


@extend_schema_view(
    get=extend_schema(
        tags=['Auth'],
        summary='دریافت اطلاعات پروفایل کاربر لاگین‌شده',
        description='مشاهده مشخصات حساب کاربری لاگین‌شده شامل شناسه، شماره موبایل، ایمیل، نام و تاریخ عضویت.'
    ),
    put=extend_schema(
        tags=['Auth'],
        summary='ویرایش کامل اطلاعات پروفایل',
        description='ویرایش نام، نام خانوادگی و ایمیل کاربر.'
    ),
    patch=extend_schema(
        tags=['Auth'],
        summary='ویرایش جزئی پروفایل',
        description='ویرایش یک یا چند فیلد دلخواه از مشخصات کاربر (نام، نام خانوادگی، ایمیل).'
    ),
)
class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user