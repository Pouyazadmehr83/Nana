from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import PetReport, PetImage, Sighting
from .caching import invalidate_pet_reports_cache


@receiver([post_save, post_delete], sender=PetReport)
def pet_report_cache_invalidation(sender, instance, **kwargs):
    """ابطال خودکار کش در هنگام ساخت، ویرایش یا حذف آگهی (از طریق API، پنل ادمین یا دستورات)"""
    invalidate_pet_reports_cache()


@receiver([post_save, post_delete], sender=PetImage)
def pet_image_cache_invalidation(sender, instance, **kwargs):
    """ابطال خودکار کش در هنگام تغییر تصاویر آگهی"""
    invalidate_pet_reports_cache()


@receiver([post_save, post_delete], sender=Sighting)
def sighting_cache_invalidation(sender, instance, **kwargs):
    """ابطال خودکار کش در هنگام ثبت یا تغییر گزارش‌های دیده‌شدن"""
    invalidate_pet_reports_cache()
