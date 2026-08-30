import os
import logging
from celery import shared_task
from PIL import Image
from .models import PetImage

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3, default_retry_delay=5)
def optimize_pet_image(self, image_id):
    """
    تسک پس‌زمینه سلری:
    ۱. دریافت تصویر از دیتابیس
    ۲. تبدیل مد رنگی به RGB در صورت نیاز
    ۳. ریسایز تصاویر با عرض بیش از ۱۲۰۰ پیکسل
    ۴. فشرده‌سازی کیفیت با نرخ بهینه ۸۰٪
    """
    try:
        pet_img = PetImage.objects.get(id=image_id)
        if not pet_img.image:
            return f"No image associated with PetImage id {image_id}."

        img_path = pet_img.image.path
        if not os.path.exists(img_path):
            logger.warning(f"File {img_path} does not exist on disk.")
            return f"File {img_path} does not exist."

        with Image.open(img_path) as img:
            format_to_save = img.format if img.format in ('JPEG', 'PNG', 'WEBP') else 'JPEG'

            if img.mode in ("RGBA", "LA", "P") and format_to_save == 'JPEG':
                img = img.convert("RGB")
            elif img.mode not in ("RGB", "RGBA"):
                img = img.convert("RGB")

            # ریسایز در صورت بیشتر بودن عرض از ۱۲۰۰ پیکسل
            max_width = 1200
            if img.width > max_width:
                ratio = max_width / float(img.width)
                new_height = int(float(img.height) * float(ratio))
                img = img.resize((max_width, new_height), Image.Resampling.LANCZOS)

            # ذخیره مجدد با بهینه‌سازی حجم
            if format_to_save == 'JPEG':
                img.save(img_path, format="JPEG", quality=80, optimize=True)
            elif format_to_save == 'WEBP':
                img.save(img_path, format="WEBP", quality=80)
            elif format_to_save == 'PNG':
                img.save(img_path, format="PNG", optimize=True)
            else:
                img.save(img_path, quality=80, optimize=True)

        logger.info(f"Image {image_id} successfully optimized.")
        return f"Image {image_id} successfully optimized."

    except PetImage.DoesNotExist:
        logger.error(f"PetImage {image_id} not found in database.")
        return f"PetImage {image_id} not found."
    except Exception as exc:
        logger.error(f"Error optimizing image {image_id}: {exc}")
        raise self.retry(exc=exc)
