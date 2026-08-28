import os
import uuid
from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _
from django.core.validators import MinValueValidator, MaxValueValidator


def pet_image_upload_path(instance, filename):
    ext = filename.split('.')[-1]
    unique_name = f"{uuid.uuid4().hex}.{ext}"
    return os.path.join(f"pets/report_{instance.report_id}/", unique_name)


class PetReport(models.Model):
    class ReportType(models.TextChoices):
        LOST = 'LOST', _('گمشده')
        FOUND = 'FOUND', _('پیدا شده')
        SIGHTED = 'SIGHTED', _('فقط دیده شده')

    class PetSpecies(models.TextChoices):
        DOG = 'DOG', _('سگ')
        CAT = 'CAT', _('گربه')
        BIRD = 'BIRD', _('پرنده')
        OTHER = 'OTHER', _('سایر')

    class Gender(models.TextChoices):
        MALE = 'MALE', _('نر')
        FEMALE = 'FEMALE', _('ماده')
        UNKNOWN = 'UNKNOWN', _('نامشخص')

    class Status(models.TextChoices):
        ACTIVE = 'ACTIVE', _('فعال / در جستجو')
        RESOLVED = 'RESOLVED', _('پیدا شد / بسته شد')
        EXPIRED = 'EXPIRED', _('منقضی شده')

    # روابط و مالکیت
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='pet_reports',
        verbose_name=_('کاربر ثبت‌کننده')
    )

    # مشخصات کلی
    title = models.CharField(max_length=200, verbose_name=_('عنوان آگهی'))
    report_type = models.CharField(
        max_length=10,
        choices=ReportType.choices,
        default=ReportType.LOST,
        verbose_name=_('نوع آگهی')
    )
    species = models.CharField(
        max_length=10,
        choices=PetSpecies.choices,
        default=PetSpecies.DOG,
        verbose_name=_('گونه حیوان')
    )
    breed = models.CharField(max_length=100, blank=True, verbose_name=_('نژاد'))
    gender = models.CharField(
        max_length=10,
        choices=Gender.choices,
        default=Gender.UNKNOWN,
        verbose_name=_('جنسیت')
    )
    color = models.CharField(max_length=100, verbose_name=_('رنگ اصلی'))
    distinctive_features = models.TextField(blank=True, verbose_name=_('ویژگی‌های ظاهری خاص (قلاده، جای زخم و...)'))
    has_microchip = models.BooleanField(default=False, verbose_name=_('دارای میکروچیپ'))

    # اطلاعات زمانی و مکانی
    event_date = models.DateField(verbose_name=_('تاریخ گم شدن یا پیدا شدن'))
    province = models.CharField(max_length=100, verbose_name=_('استان'))
    city = models.CharField(max_length=100, verbose_name=_('شهر'))
    district = models.CharField(max_length=150, blank=True, verbose_name=_('منطقه / محله'))
    address_description = models.TextField(blank=True, verbose_name=_('توضیحات دقیق محل'))
    
    # مختصات جغرافیایی (برای نمایش روی نقشه و جستجوی شعاعی)
    latitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        null=True,
        blank=True,
        validators=[MinValueValidator(-90.0), MaxValueValidator(90.0)],
        verbose_name=_('عرض جغرافیایی (Latitude)')
    )
    longitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        null=True,
        blank=True,
        validators=[MinValueValidator(-180.0), MaxValueValidator(180.0)],
        verbose_name=_('طول جغرافیایی (Longitude)')
    )

    # ارتباط و پاداش
    contact_phone = models.CharField(max_length=15, verbose_name=_('شماره تماس جهت هماهنگی'))
    is_reward_offered = models.BooleanField(default=False, verbose_name=_('مژدگانی دارد؟'))
    reward_amount = models.CharField(max_length=100, blank=True, verbose_name=_('مبلغ یا نوع مژدگانی'))

    # وضعیت و متاداده
    status = models.CharField(
        max_length=10,
        choices=Status.choices,
        default=Status.ACTIVE,
        verbose_name=_('وضعیت پرونده')
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name=_('تاریخ ثبت'))
    updated_at = models.DateTimeField(auto_now=True, verbose_name=_('تاریخ آخرین بروزرسانی'))

    class Meta:
        verbose_name = _('آگهی حیوان')
        verbose_name_plural = _('آگهی‌های حیوانات')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['report_type', 'species', 'status']),
            models.Index(fields=['city', 'created_at']),
        ]

    def __str__(self):
        return f"{self.get_report_type_display()} - {self.title} ({self.city})"


class PetImage(models.Model):
    report = models.ForeignKey(
        PetReport,
        on_delete=models.CASCADE,
        related_name='images',
        verbose_name=_('آگهی مربوطه')
    )
    image = models.ImageField(upload_to=pet_image_upload_path, verbose_name=_('تصویر'))
    is_cover = models.BooleanField(default=False, verbose_name=_('تصویر شاخص'))
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _('تصویر آگهی')
        verbose_name_plural = _('تصاویر آگهی')

    def __str__(self):
        return f"تصویر برای {self.report.title}"


class Sighting(models.Model):
    report = models.ForeignKey(
        PetReport,
        on_delete=models.CASCADE,
        related_name='sightings',
        verbose_name=_('آگهی مربوطه')
    )
    reporter = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name=_('گزارش‌دهنده')
    )
    sighted_at = models.DateTimeField(verbose_name=_('زمان رویت'))
    address_description = models.TextField(verbose_name=_('محل رویت'))
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    message = models.TextField(verbose_name=_('پیام یا توضیحات دیده‌شدن'))
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _('گزارش دیده‌شدن')
        verbose_name_plural = _('گزارش‌های دیده‌شدن')
        ordering = ['-sighted_at']