from rest_framework import viewsets, permissions, status, parsers
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiParameter

from .models import PetReport, PetImage, Sighting
from .serializers import (
    PetReportListSerializer,
    PetReportDetailSerializer,
    PetImageSerializer,
    SightingSerializer
)
from .permissions import IsOwnerOrReadOnly
from .filters import PetReportFilter


@extend_schema_view(
    list=extend_schema(
        tags=['Pets'],
        summary='لیست و جستجوی پیشرفته آگهی‌های حیوانات',
        description=(
            'دریافت لیست آگهی‌ها با پشتیبانی کامل از:\n'
            '- **فیلترهای مشخصات**: نوع آگهی (LOST/FOUND)، نوع حیوان (DOG/CAT/...)، جنسیت، قلاده، شهر، محله، نژاد و رنگ.\n'
            '- **فیلترهای مژدگانی**: `min_reward`، `max_reward` و `has_reward` (true/false).\n'
            '- **فیلتر بازه زمانی**: `from_date` و `to_date` برای زمان رخداد حادثه.\n'
            '- **فیلتر شعاع مکانی**: ارسال `lat` (عرض جغرافیایی)، `lng` (طول جغرافیایی) و `radius_km` (شعاع به کیلومتر، پیش‌فرض ۱۰).\n'
            '- **جستجوی متنی (`search`)**: جستجو در عنوان، نام حیوان، نژاد، رنگ، ویژگی‌ها، شهر، محله و توضیحات آدرس.\n'
            '- **مرتب‌سازی (`ordering`)**: مرتب‌سازی بر اساس `event_date`, `created_at`, `reward`, `city`.'
        )
    ),
    retrieve=extend_schema(
        tags=['Pets'],
        summary='مشاهده جزئیات یک آگهی حیوان',
        description='دریافت کامل اطلاعات یک آگهی به همراه تصاویر آپلود شده و گزارش‌های دیده‌شدن مرتبط.'
    ),
    create=extend_schema(
        tags=['Pets'],
        summary='ثبت آگهی جدید حیوان گمشده / پیدا شده',
        description='کاربران لاگین‌شده می‌توانند آگهی جدید برای حیوان گمشده یا پیدا شده با مختصات جغرافیایی ثبت کنند.'
    ),
    update=extend_schema(
        tags=['Pets'],
        summary='ویرایش کامل آگهی حیوان',
        description='فقط مالک آگهی یا ادمین سیستم مجاز به ویرایش کامل آگهی است.'
    ),
    partial_update=extend_schema(
        tags=['Pets'],
        summary='ویرایش جزئی آگهی حیوان',
        description='فقط مالک آگهی یا ادمین سیستم مجاز به ویرایش فیلدهای انتخابی آگهی است.'
    ),
    destroy=extend_schema(
        tags=['Pets'],
        summary='حذف آگهی حیوان',
        description='فقط ثبت‌کننده آگهی یا ادمین سیستم می‌تواند آگهی را حذف نماید.'
    ),
)
class PetReportViewSet(viewsets.ModelViewSet):
    queryset = PetReport.objects.all()
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]

    # تنظیمات فیلترینگ، جستجو و مرتب‌سازی
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = PetReportFilter
    search_fields = [
        'title',
        'name',
        'breed',
        'color',
        'special_features',
        'city',
        'district',
        'address_description'
    ]
    ordering_fields = ['event_date', 'created_at', 'reward', 'city']
    ordering = ['-created_at']

    def get_queryset(self):
        # جلوگیری کامل از خطای N+1 Query
        return PetReport.objects.select_related('user').prefetch_related('images', 'sightings__user')

    def get_serializer_class(self):
        if self.action == 'list':
            return PetReportListSerializer
        return PetReportDetailSerializer

    @extend_schema(
        tags=['Pets'],
        summary='آپلود تصویر برای یک آگهی',
        description='آپلود تصویر جدید به همراه تعیین وضعیت تصویر اصلی (`is_main`). فقط مالک آگهی مجاز به آپلود تصویر است.',
        request=PetImageSerializer,
        responses={201: PetImageSerializer}
    )
    @action(
        detail=True,
        methods=['post'],
        permission_classes=[permissions.IsAuthenticated, IsOwnerOrReadOnly],
        parser_classes=[parsers.MultiPartParser, parsers.FormParser]
    )
    def upload_image(self, request, pk=None):
        """اکشن اختصاصی برای آپلود تصویر به یک آگهی خاص"""
        report = self.get_object()
        serializer = PetImageSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(report=report)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @extend_schema(
        tags=['Pets'],
        summary='لیست آگهی‌های کاربر جاری (آگهی‌های من)',
        description='دریافت لیست تمامی آگهی‌های ثبت‌شده توسط کاربری که در سیستم لاگین است (مناسب داشبورد کاربر).',
        responses={200: PetReportListSerializer(many=True)}
    )
    @action(
        detail=False,
        methods=['get'],
        permission_classes=[permissions.IsAuthenticated]
    )
    def my_reports(self, request):
        """لیست آگهی‌های کاربر لاگین‌شده با پشتیبانی از فیلتر و صفحه‌بندی"""
        queryset = self.filter_queryset(self.get_queryset().filter(user=request.user))
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @extend_schema(
        tags=['Pets'],
        summary='تغییر وضعیت پرونده به مختومه / بازگشایی مجدد',
        description='تغییر وضعیت فیلد `is_resolved` به معکوس مقدار فعلی. فقط ثبت‌کننده آگهی یا ادمین مجاز به تغییر وضعیت است.',
        responses={200: PetReportDetailSerializer}
    )
    @action(
        detail=True,
        methods=['post'],
        permission_classes=[permissions.IsAuthenticated, IsOwnerOrReadOnly]
    )
    def toggle_resolved(self, request, pk=None):
        """تغییر وضعیت پرونده آگهی (پیدا شد یا باز است)"""
        report = self.get_object()
        report.is_resolved = not report.is_resolved
        report.save(update_fields=['is_resolved', 'updated_at'])
        serializer = PetReportDetailSerializer(report, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)


@extend_schema_view(
    list=extend_schema(
        tags=['Sightings'],
        summary='لیست گزارش‌های دیده‌شدن حیوان',
        description='مشاهده لیست تمام گزارش‌های دیده‌شدن یا فیلتر بر اساس یک آگهی خاص با استفاده از پارامتر `report` یا `report_id`.'
    ),
    retrieve=extend_schema(
        tags=['Sightings'],
        summary='مشاهده جزئیات یک گزارش دیده‌شدن',
        description='دریافت اطلاعات تکمیلی، زمان و مکان مشاهده حیوان گمشده.'
    ),
    create=extend_schema(
        tags=['Sightings'],
        summary='ثبت گزارش دیده‌شدن حیوان',
        description='کاربران لاگین‌شده می‌توانند گزارش مشاهده حیوان (همراه با تصویر و مختصات اختیاری) را ثبت کنند.'
    ),
    update=extend_schema(
        tags=['Sightings'],
        summary='ویرایش کامل گزارش دیده‌شدن',
        description='تنها فرد ثبت‌کننده گزارش یا ادمین مجاز به ویرایش است.'
    ),
    partial_update=extend_schema(
        tags=['Sightings'],
        summary='ویرایش جزئی گزارش دیده‌شدن',
        description='تنها فرد ثبت‌کننده گزارش یا ادمین مجاز به ویرایش است.'
    ),
    destroy=extend_schema(
        tags=['Sightings'],
        summary='حذف گزارش دیده‌شدن',
        description='تنها فرد ثبت‌کننده گزارش یا ادمین مجاز به حذف است.'
    ),
)
class SightingViewSet(viewsets.ModelViewSet):
    queryset = Sighting.objects.select_related('report', 'user').all()
    serializer_class = SightingSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser]

    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['report']
    ordering_fields = ['seen_at', 'created_at']
    ordering = ['-seen_at']

    def get_queryset(self):
        qs = super().get_queryset()
        report_id = self.request.query_params.get('report_id')
        if report_id:
            qs = qs.filter(report_id=report_id)
        return qs