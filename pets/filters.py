import math
import django_filters
from .models import PetReport


class PetReportFilter(django_filters.FilterSet):
    """
    فیلترست پیشرفته برای جستجو و پالایش آگهی‌های حیوانات
    """
    city = django_filters.CharFilter(field_name='city', lookup_expr='icontains')
    district = django_filters.CharFilter(field_name='district', lookup_expr='icontains')
    breed = django_filters.CharFilter(field_name='breed', lookup_expr='icontains')
    color = django_filters.CharFilter(field_name='color', lookup_expr='icontains')
    
    # فیلترهای مژدگانی
    min_reward = django_filters.NumberFilter(field_name='reward', lookup_expr='gte')
    max_reward = django_filters.NumberFilter(field_name='reward', lookup_expr='lte')
    has_reward = django_filters.BooleanFilter(method='filter_has_reward')

    # فیلتر بازه زمانی گمشدن / پیداشدن
    from_date = django_filters.DateTimeFilter(field_name='event_date', lookup_expr='gte')
    to_date = django_filters.DateTimeFilter(field_name='event_date', lookup_expr='lte')

    # فیلتر شعاع مکانی (بر حسب کیلومتر)
    lat = django_filters.NumberFilter(method='filter_by_radius')
    lng = django_filters.NumberFilter(method='filter_by_radius')
    radius_km = django_filters.NumberFilter(method='filter_by_radius')

    class Meta:
        model = PetReport
        fields = [
            'report_type',
            'pet_type',
            'gender',
            'has_collar',
            'is_resolved',
            'city',
            'district',
            'breed',
            'color',
            'min_reward',
            'max_reward',
            'from_date',
            'to_date',
        ]

    def filter_has_reward(self, queryset, name, value):
        """فیلتر آگهی‌های دارای مژدگانی (reward > 0) یا بدون مژدگانی (reward = 0)"""
        if value is True:
            return queryset.filter(reward__gt=0)
        elif value is False:
            return queryset.filter(reward=0)
        return queryset

    def filter_by_radius(self, queryset, name, value):
        """
        محاسبه فیلتر محدوده شعاعی بر حسب کیلومتر با استفاده از Bounding Box دقیق جغرافیایی
        """
        # برای جلوگیری از تکرار فیلتر هنگام ارسال همزمان lat، lng و radius_km:
        # فیلتر تنها زمانی که name == 'lat' باشد اعمال می‌شود.
        if name != 'lat':
            return queryset

        lat_val = value
        lng_val = self.data.get('lng')
        radius_val = self.data.get('radius_km', 10)  # مقدار پیش‌فرض ۱۰ کیلومتر

        if lat_val is None or lng_val is None:
            return queryset

        try:
            lat = float(lat_val)
            lng = float(lng_val)
            radius = float(radius_val)
        except (ValueError, TypeError):
            return queryset

        if radius <= 0:
            return queryset

        # ۱ درجه عرض جغرافیایی ~ ۱۱۱ کیلومتر
        deg_lat = radius / 111.0

        # ۱ درجه طول جغرافیایی بر حسب عرض جغرافیایی محل: ۱۱۱ * cos(lat)
        cos_lat = math.cos(math.radians(lat))
        # در صورتی که عرض جغرافیایی نزدیک به قطب‌ها نباشد
        deg_lng = radius / (111.0 * cos_lat) if abs(cos_lat) > 0.001 else radius / 111.0

        return queryset.filter(
            latitude__isnull=False,
            longitude__isnull=False,
            latitude__gte=lat - deg_lat,
            latitude__lte=lat + deg_lat,
            longitude__gte=lng - deg_lng,
            longitude__lte=lng + deg_lng,
        )
