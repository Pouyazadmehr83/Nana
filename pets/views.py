from rest_framework import viewsets, permissions, status, parsers
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from .models import PetReport, PetImage, Sighting
from .serializers import (
    PetReportListSerializer,
    PetReportDetailSerializer,
    PetImageSerializer,
    SightingSerializer
)
from .permissions import IsOwnerOrReadOnly
from .filters import PetReportFilter


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