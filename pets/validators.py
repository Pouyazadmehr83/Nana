import os
from PIL import Image
from django.core.exceptions import ValidationError

MAX_IMAGE_SIZE_MB = 5
MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024
ALLOWED_IMAGE_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.webp'}


def validate_image_file(file):
    """
    اعتبارسنجی امنیتی تصویر:
    ۱. بررسی حداکثر حجم فایل (حداکثر ۵ مگابایت)
    ۲. بررسی پسوند معتبر (jpg, jpeg, png, webp)
    ۳. اعتبارسنجی یکپارچگی فایل تصویری با Pillow برای جلوگیری از آپلود کدهای مخرب
    """
    if not file:
        return

    # ۱. بررسی حجم فایل
    if hasattr(file, 'size') and file.size > MAX_IMAGE_SIZE_BYTES:
        raise ValidationError(
            f"حجم تصویر نباید بیشتر از {MAX_IMAGE_SIZE_MB} مگابایت باشد. (حجم فعلی: {file.size / (1024 * 1024):.2f}MB)"
        )

    # ۲. بررسی پسوند فایل
    ext = os.path.splitext(file.name)[1].lower()
    if ext not in ALLOWED_IMAGE_EXTENSIONS:
        raise ValidationError(
            f"فرمت فایل مجاز نیست. فرمت‌های مجاز: {', '.join(sorted(ALLOWED_IMAGE_EXTENSIONS))}"
        )

    # ۳. بررسی سلامت فایل تصویر با Pillow
    try:
        if hasattr(file, 'file'):
            file_pos = file.file.tell() if hasattr(file.file, 'tell') else None
            img = Image.open(file.file)
            img.verify()
            if file_pos is not None and hasattr(file.file, 'seek'):
                file.file.seek(file_pos)
    except Exception:
        raise ValidationError("فایل ارسال‌شده یک تصویر معتبر و سالم نمی‌باشد.")
