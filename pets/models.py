import uuid
from decimal import Decimal
from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from .validators import validate_image_file


class PetReport(models.Model):
    uuid = models.UUIDField(
        default=uuid.uuid4,
        editable=False,
        unique=True,
        db_index=True,
        verbose_name="شناسه یکتا"
    )

    # کلاس‌های Choices باید حتماً قبل از فیلدها تعریف شوند
    class ReportType(models.TextChoices):
        LOST = 'LOST', 'گمشده'
        FOUND = 'FOUND', 'پیدا شده'

    class PetType(models.TextChoices):
        DOG = 'DOG', 'سگ'
        CAT = 'CAT', 'گربه'
        BIRD = 'BIRD', 'پرنده'
        OTHER = 'OTHER', 'سایر'

    class Gender(models.TextChoices):
        MALE = 'MALE', 'نر'
        FEMALE = 'FEMALE', 'ماده'
        UNKNOWN = 'UNKNOWN', 'نامشخص'

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='pet_reports',
        verbose_name="کاربر ثبت‌کننده"
    )
    report_type = models.CharField(
        max_length=10,
        choices=ReportType.choices,
        default=ReportType.LOST,
        verbose_name="نوع آگهی"
    )
    pet_type = models.CharField(
        max_length=10,
        choices=PetType.choices,
        verbose_name="نوع حیوان"
    )
    title = models.CharField(max_length=200, verbose_name="عنوان آگهی")
    name = models.CharField(max_length=100, blank=True, verbose_name="نام حیوان")
    breed = models.CharField(max_length=100, blank=True, verbose_name="نژاد")
    color = models.CharField(max_length=100, verbose_name="رنگ و طرح")
    gender = models.CharField(
        max_length=10,
        choices=Gender.choices,
        default=Gender.UNKNOWN,
        verbose_name="جنسیت"
    )
    age = models.CharField(max_length=50, blank=True, verbose_name="سن تقریبی")
    has_collar = models.BooleanField(default=False, verbose_name="قلاده دارد؟")
    microchip_id = models.CharField(max_length=100, blank=True, verbose_name="شماره میکروچیپ")
    special_features = models.TextField(blank=True, verbose_name="ویژگی‌های ظاهری و رفتاری خاص")
    
    event_date = models.DateTimeField(verbose_name="تاریخ و زمان حادثه")
    city = models.CharField(max_length=100, verbose_name="شهر")
    district = models.CharField(max_length=100, blank=True, verbose_name="محله / منطقه")
    address_description = models.TextField(blank=True, verbose_name="توضیحات دقیق محل")
    
    latitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        null=True,
        blank=True,
        validators=[MinValueValidator(Decimal('-90.0')), MaxValueValidator(Decimal('90.0'))],
        verbose_name="عرض جغرافیایی"
    )
    longitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        null=True,
        blank=True,
        validators=[MinValueValidator(Decimal('-180.0')), MaxValueValidator(Decimal('180.0'))],
        verbose_name="طول جغرافیایی"
    )

    contact_phone = models.CharField(max_length=15, blank=True, verbose_name="شماره تماس اضطراری")
    reward = models.PositiveIntegerField(default=0, help_text="مبلغ به تومان", verbose_name="مژدگانی")
    is_resolved = models.BooleanField(default=False, verbose_name="پرونده مختومه شده؟ (پیدا شد)")
    
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="تاریخ ثبت")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="آخرین بروزرسانی")

    class Meta:
        verbose_name = "آگهی حیوان"
        verbose_name_plural = "آگهی‌های حیوانات"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['city', 'report_type']),
            models.Index(fields=['latitude', 'longitude']),
        ]

    def __str__(self):
        return f"{self.get_report_type_display()} - {self.title} ({self.city})"


class PetImage(models.Model):
    report = models.ForeignKey(
        PetReport,
        on_delete=models.CASCADE,
        related_name='images',
        verbose_name="آگهی مربوطه"
    )
    image = models.ImageField(upload_to='pets/%Y/%m/', validators=[validate_image_file], verbose_name="تصویر")
    is_main = models.BooleanField(default=False, verbose_name="تصویر اصلی؟")
    uploaded_at = models.DateTimeField(auto_now_add=True, verbose_name="تاریخ آپلود")

    class Meta:
        verbose_name = "تصویر حیوان"
        verbose_name_plural = "تصاویر حیوانات"

    def __str__(self):
        return f"Image for {self.report.title}"


class Sighting(models.Model):
    report = models.ForeignKey(
        PetReport,
        on_delete=models.CASCADE,
        related_name='sightings',
        verbose_name="آگهی مربوطه"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='sightings',
        verbose_name="کاربر گزارش‌دهنده"
    )
    seen_at = models.DateTimeField(verbose_name="زمان مشاهده")
    location_description = models.TextField(verbose_name="توضیحات محل مشاهده")
    latitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        null=True,
        blank=True,
        verbose_name="عرض جغرافیایی"
    )
    longitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        null=True,
        blank=True,
        verbose_name="طول جغرافیایی"
    )
    image = models.ImageField(upload_to='sightings/%Y/%m/', null=True, blank=True, validators=[validate_image_file], verbose_name="تصویر حیوان دیده‌شده")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="زمان ثبت گزارش")

    class Meta:
        verbose_name = "گزارش دیده‌شدن"
        verbose_name_plural = "گزارش‌های دیده‌شدن"
        ordering = ['-seen_at']

    def __str__(self):
        return f"Sighting for {self.report.title} at {self.seen_at}"