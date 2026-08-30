import hashlib
import logging
from urllib.parse import urlencode
from django.core.cache import cache

logger = logging.getLogger(__name__)

CACHE_TTL_PET_LIST = 600  # ۱۰ دقیقه


def get_normalized_cache_key(prefix: str, query_dict) -> str:
    """
    تولید کلید کش قطعی و یکتا بر اساس مرتب‌سازی الفبایی پارامترها و هش MD5
    مثال: ?city=Tehran&pet_type=DOG و ?pet_type=DOG&city=Tehran هر دو یک کلید تولید می‌کنند.
    """
    if not query_dict:
        return f"{prefix}:all"

    # تبدیل به لیست مرتب شده از تاپل‌های کلید-مقدار (بدون در نظر گرفتن ترتیب ارسال)
    sorted_items = []
    for k in sorted(query_dict.keys()):
        values = sorted(query_dict.getlist(k)) if hasattr(query_dict, 'getlist') else sorted([str(query_dict[k])])
        for v in values:
            if v is not None and str(v).strip() != '':
                sorted_items.append((k, str(v).strip()))

    if not sorted_items:
        return f"{prefix}:all"

    normalized_querystring = urlencode(sorted_items)
    query_hash = hashlib.md5(normalized_querystring.encode('utf-8')).hexdigest()
    return f"{prefix}:{query_hash}"


def invalidate_pet_reports_cache():
    """
    ابطال هوشمند و دقیق تمام کلیدهای مربوط به لیست آگهی‌ها با الگوی SCAN در ردیس
    بدون پاک کردن کل ردیس یا اثرگذاری روی سایر اپلیکیشن‌ها
    """
    try:
        # دریافت کلاینت ردیس درایور اصلی جنگو
        raw_client = getattr(cache, '_cache', None)
        if raw_client and hasattr(raw_client, 'get_client'):
            client = raw_client.get_client()
            # جستجو و حذف امن با scan_iter
            pattern = "*pet_reports_list:*"
            keys_to_delete = list(client.scan_iter(match=pattern))
            if keys_to_delete:
                client.delete(*keys_to_delete)
                logger.info(f"Invalidated {len(keys_to_delete)} Redis cache keys for pet reports.")
            return
    except Exception as e:
        logger.warning(f"Error occurred during Redis pattern deletion: {e}")

    # Fallback در صورتی که ردیس پشتیبانی نکند
    try:
        cache.clear()
    except Exception as e:
        logger.error(f"Error clearing cache fallback: {e}")
