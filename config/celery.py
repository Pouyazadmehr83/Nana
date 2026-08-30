import os
from celery import Celery

# تنظیم ماژول پیش‌فرض تنظیمات جنگو برای سلری
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

app = Celery('config')

# خواندن تنظیمات با پیشوند CELERY_ از django settings
app.config_from_object('django.conf:settings', namespace='CELERY')

# کشف خودکار فایل‌های tasks.py داخل تمام اپلیکیشن‌های ثبت‌شده در INSTALLED_APPS
app.autodiscover_tasks()


@app.task(bind=True, ignore_result=True)
def debug_task(self):
    print(f'Request: {self.request!r}')
