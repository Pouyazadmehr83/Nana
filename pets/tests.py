import io
from datetime import timedelta
from PIL import Image
from django.urls import reverse
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.cache import cache
from rest_framework import status
from rest_framework.test import APITestCase
from pets.models import PetReport, Sighting, PetImage

User = get_user_model()


def generate_test_image(filename="test.jpg", format="JPEG", size=(100, 100), color="blue"):
    """تولید فایل تصویر تستی در حافظه با Pillow"""
    file = io.BytesIO()
    img = Image.new("RGB", size, color=color)
    img.save(file, format=format)
    file.seek(0)
    content_type = f"image/{format.lower()}"
    return SimpleUploadedFile(filename, file.getvalue(), content_type=content_type)


class PetReportAPITests(APITestCase):
    def setUp(self):
        cache.clear()
        # ساخت دو کاربر تستی
        self.user_a = User.objects.create_user(phone_number="09121111111", password="password123")
        self.user_b = User.objects.create_user(phone_number="09122222222", password="password123")

        # ساخت یک آگهی متعلق به کاربر A
        self.report = PetReport.objects.create(
            user=self.user_a,
            title="گربه گمشده پرشین",
            pet_type="CAT",
            report_type="LOST",
            color="سفید",
            city="تهران",
            event_date=timezone.now(),
            latitude=35.6892,
            longitude=51.3890
        )

        self.list_create_url = reverse('pet-report-list')
        self.detail_url = reverse('pet-report-detail', kwargs={'pk': self.report.pk})
        self.my_reports_url = reverse('pet-report-my-reports')
        self.toggle_resolved_url = reverse('pet-report-toggle-resolved', kwargs={'pk': self.report.pk})
        self.upload_image_url = reverse('pet-report-upload-image', kwargs={'pk': self.report.pk})

    def test_unauthenticated_user_can_list_reports(self):
        """کاربر مهمان باید بتواند لیست آگهی‌ها را ببیند"""
        response = self.client.get(self.list_create_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results'] if isinstance(response.data, dict) and 'results' in response.data else response.data
        self.assertEqual(len(results), 1)

    def test_unauthenticated_user_cannot_create_report(self):
        """کاربر مهمان نباید بتواند آگهی ثبت کند"""
        payload = {
            "title": "سگ هاسکی پیدا شده",
            "pet_type": "DOG",
            "report_type": "FOUND",
            "color": "طوسی و سفید",
            "city": "تبریز",
            "event_date": timezone.now().isoformat(),
        }
        response = self.client.post(self.list_create_url, payload)
        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])

    def test_authenticated_user_can_create_report(self):
        """کاربر لاگین‌شده می‌تواند آگهی بسازد و فیلد user به او اختصاص می‌یابد"""
        self.client.force_authenticate(user=self.user_a)
        payload = {
            "title": "سگ هاسکی پیدا شده",
            "pet_type": "DOG",
            "report_type": "FOUND",
            "color": "طوسی و سفید",
            "city": "تبریز",
            "event_date": timezone.now().isoformat(),
            "latitude": 38.0800,
            "longitude": 46.2919
        }
        response = self.client.post(self.list_create_url, payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['user'], self.user_a.id)

    def test_user_cannot_update_others_report(self):
        """کاربر B نباید بتواند آگهی کاربر A را تغییر دهد"""
        self.client.force_authenticate(user=self.user_b)
        payload = {"title": "تغییر غیرمجاز عنوان"}
        response = self.client.patch(self.detail_url, payload)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_owner_can_update_their_report(self):
        """مالک آگهی باید بتواند آگهی خود را ویرایش کند"""
        self.client.force_authenticate(user=self.user_a)
        payload = {"title": "عنوان جدید اصلاح شده"}
        response = self.client.patch(self.detail_url, payload)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.report.refresh_from_db()
        self.assertEqual(self.report.title, "عنوان جدید اصلاح شده")

    def test_coordinates_validation_both_or_none(self):
        """اعتبارسنجی: اگر فقط یکی از طول یا عرض جغرافیایی ارسال شود، باید خطا بدهد"""
        self.client.force_authenticate(user=self.user_a)
        payload = {
            "title": "پرنده گمشده",
            "pet_type": "BIRD",
            "report_type": "LOST",
            "color": "سبز",
            "city": "اصفهان",
            "event_date": timezone.now().isoformat(),
            "latitude": 32.6546,
            # longitude ارسال نشده است
        }
        response = self.client.post(self.list_create_url, payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_my_reports_action(self):
        """دریافت آگهی‌های ثبت‌شده توسط کاربر جاری"""
        # ساخت یک آگهی برای کاربر B
        PetReport.objects.create(
            user=self.user_b,
            title="آگهی کاربر دوم",
            pet_type="DOG",
            report_type="LOST",
            color="قهوه‌ای",
            city="شیراز",
            event_date=timezone.now()
        )

        # درخواست با کاربر A
        self.client.force_authenticate(user=self.user_a)
        response = self.client.get(self.my_reports_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['title'], "گربه گمشده پرشین")

        # درخواست مهمان
        self.client.logout()
        res_unauth = self.client.get(self.my_reports_url)
        self.assertEqual(res_unauth.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_toggle_resolved_action(self):
        """تغییر وضعیت پرونده به پیدا شد / فعال توسط مالک"""
        self.client.force_authenticate(user=self.user_a)
        self.assertFalse(self.report.is_resolved)

        # تغییر به پیدا شد (True)
        response1 = self.client.post(self.toggle_resolved_url)
        self.assertEqual(response1.status_code, status.HTTP_200_OK)
        self.assertTrue(response1.data['is_resolved'])
        self.report.refresh_from_db()
        self.assertTrue(self.report.is_resolved)

        # تغییر مجدد به فعال (False)
        response2 = self.client.post(self.toggle_resolved_url)
        self.assertEqual(response2.status_code, status.HTTP_200_OK)
        self.assertFalse(response2.data['is_resolved'])

    def test_toggle_resolved_forbidden_for_other_users(self):
        """کاربر غیر مالک نباید بتواند وضعیت آگهی را تغییر دهد"""
        self.client.force_authenticate(user=self.user_b)
        response = self.client.post(self.toggle_resolved_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class PetImageUploadSecurityTests(APITestCase):
    """تست‌های امنیت و اعتبارسنجی آپلود تصاویر"""

    def setUp(self):
        cache.clear()
        self.user = User.objects.create_user(phone_number="09129990011", password="password123")
        self.report = PetReport.objects.create(
            user=self.user,
            title="گربه گمشده",
            pet_type="CAT",
            report_type="LOST",
            color="سفید",
            city="تهران",
            event_date=timezone.now()
        )
        self.upload_url = reverse('pet-report-upload-image', kwargs={'pk': self.report.pk})
        self.client.force_authenticate(user=self.user)

    def test_upload_valid_image_success(self):
        """آپلود موفق تصویر استاندارد JPEG و PNG"""
        image_file = generate_test_image("pet.jpg", "JPEG")
        response = self.client.post(self.upload_url, {"image": image_file, "is_main": True}, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(PetImage.objects.filter(report=self.report).count(), 1)

    def test_upload_invalid_file_extension(self):
        """رد فایل با پسوند غیرمجاز (مثلاً .txt یا .pdf)"""
        fake_file = SimpleUploadedFile("malicious.txt", b"This is a text file", content_type="text/plain")
        response = self.client.post(self.upload_url, {"image": fake_file}, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("image", response.data)

    def test_upload_file_size_limit(self):
        """رد فایلی با حجم بیش از ۵ مگابایت"""
        # ساخت فایل بزرگ فرضی (بیش از ۵ مگابایت)
        large_content = b"x" * (6 * 1024 * 1024)
        large_file = SimpleUploadedFile("large_image.jpg", large_content, content_type="image/jpeg")
        response = self.client.post(self.upload_url, {"image": large_file}, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("image", response.data)

    def test_optimize_pet_image_task(self):
        """بررسی عملکرد تسک سلری در ریسایز و فشرده‌سازی تصاویر"""
        from pets.tasks import optimize_pet_image
        large_img_file = generate_test_image("large.jpg", "JPEG", size=(1600, 1200))
        pet_img = PetImage.objects.create(report=self.report, image=large_img_file)

        result = optimize_pet_image(pet_img.id)
        self.assertIn("successfully optimized", result)

        with Image.open(pet_img.image.path) as img:
            self.assertLessEqual(img.width, 1200)


class SightingAPITests(APITestCase):
    def setUp(self):
        cache.clear()
        self.reporter_owner = User.objects.create_user(phone_number="09123333333", password="password123")
        self.sighting_user = User.objects.create_user(phone_number="09124444444", password="password123")

        self.report = PetReport.objects.create(
            user=self.reporter_owner,
            title="گربه گمشده",
            pet_type="CAT",
            report_type="LOST",
            color="مشکی",
            city="شیراز",
            event_date=timezone.now()
        )

        self.sighting = Sighting.objects.create(
            report=self.report,
            user=self.sighting_user,
            seen_at=timezone.now(),
            location_description="نزدیک میدان شهرداری"
        )
        self.sighting_detail_url = reverse('sighting-detail', kwargs={'pk': self.sighting.pk})

    def test_report_owner_cannot_edit_others_sighting(self):
        """صاحب آگهی اصلی نباید بتواند گزارش دیده‌شدنی که کاربر دیگر ثبت کرده را ویرایش کند"""
        self.client.force_authenticate(user=self.reporter_owner)
        payload = {"location_description": "تغییر غیرمجاز توسط صاحب آگهی"}
        response = self.client.patch(self.sighting_detail_url, payload)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_sighting_creator_can_edit_their_sighting(self):
        """فردی که گزارش دیده‌شدن را ثبت کرده باید بتواند آن را ویرایش کند"""
        self.client.force_authenticate(user=self.sighting_user)
        payload = {"location_description": "توضیحات تکمیلی محل رویت"}
        response = self.client.patch(self.sighting_detail_url, payload)
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class PetReportFilterAPITests(APITestCase):
    """تست‌های اختصاصی فیلترینگ پیشرفته، جستجو و مرتب‌سازی"""

    def setUp(self):
        cache.clear()
        self.user = User.objects.create_user(phone_number="09127777777", password="password123")
        self.url = reverse('pet-report-list')
        now = timezone.now()

        # ساخت سه رکورد با موقعیت و خصوصیات مختلف
        self.report_tehran = PetReport.objects.create(
            user=self.user,
            title="گربه گمشده پرشین تهران",
            name="برفی",
            breed="پرشین",
            pet_type="CAT",
            report_type="LOST",
            gender="FEMALE",
            color="سفید",
            city="تهران",
            district="سعادت آباد",
            reward=500000,
            has_collar=True,
            is_resolved=False,
            event_date=now - timedelta(days=2),
            latitude=35.6892,
            longitude=51.3890
        )
        self.report_tabriz = PetReport.objects.create(
            user=self.user,
            title="سگ هاسکی تبریز",
            name="مکس",
            breed="هاسکی",
            pet_type="DOG",
            report_type="FOUND",
            gender="MALE",
            color="طوسی و سفید",
            city="تبریز",
            district="ولیعصر",
            reward=0,
            has_collar=False,
            is_resolved=False,
            event_date=now - timedelta(days=10),
            latitude=38.0800,
            longitude=46.2919
        )
        self.report_isfahan = PetReport.objects.create(
            user=self.user,
            title="طوطی برزیلی سبز اصفهان",
            name="فندق",
            breed="برزیلی",
            pet_type="BIRD",
            report_type="LOST",
            gender="UNKNOWN",
            color="سبز فسفری",
            city="اصفهان",
            district="چهارباغ",
            reward=1200000,
            has_collar=False,
            is_resolved=True,
            event_date=now - timedelta(days=1),
            latitude=32.6546,
            longitude=51.6680
        )

    def test_filter_by_pet_type(self):
        """فیلتر بر اساس نوع حیوان (فقط سگ‌ها برگردانده شوند)"""
        response = self.client.get(self.url, {'pet_type': 'DOG'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['title'], "سگ هاسکی تبریز")

    def test_filter_by_report_type(self):
        """فیلتر بر اساس نوع آگهی (LOST vs FOUND)"""
        response = self.client.get(self.url, {'report_type': 'FOUND'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['id'], self.report_tabriz.id)

    def test_filter_by_city_case_insensitive(self):
        """فیلتر بر اساس شهر"""
        response = self.client.get(self.url, {'city': 'تهران'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['city'], "تهران")

    def test_filter_by_reward_range(self):
        """فیلتر بازه مژدگانی (حداقل و حداکثر)"""
        response = self.client.get(self.url, {'min_reward': 600000, 'max_reward': 2000000})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['id'], self.report_isfahan.id)

    def test_filter_has_reward(self):
        """فیلتر آگهی‌های دارای مژدگانی یا بدون مژدگانی"""
        response = self.client.get(self.url, {'has_reward': 'true'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 2)

        response_no_reward = self.client.get(self.url, {'has_reward': 'false'})
        self.assertEqual(response_no_reward.status_code, status.HTTP_200_OK)
        self.assertEqual(response_no_reward.data['count'], 1)
        self.assertEqual(response_no_reward.data['results'][0]['id'], self.report_tabriz.id)

    def test_search_by_keyword(self):
        """جستجوی متنی روی کلمه پرشین یا نام حیوان یا توضیحات"""
        response = self.client.get(self.url, {'search': 'پرشین'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['id'], self.report_tehran.id)

        response_name = self.client.get(self.url, {'search': 'فندق'})
        self.assertEqual(response_name.status_code, status.HTTP_200_OK)
        self.assertEqual(response_name.data['count'], 1)
        self.assertEqual(response_name.data['results'][0]['id'], self.report_isfahan.id)

    def test_filter_by_radius(self):
        """فیلتر شعاعی نزدیک تهران (مختصات میدان آزادی) نباید آگهی تبریز یا اصفهان را بیاورد"""
        response = self.client.get(self.url, {
            'lat': 35.7000,
            'lng': 51.3300,
            'radius_km': 15
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['city'], "تهران")

    def test_ordering_by_reward(self):
        """مرتب‌سازی آگهی‌ها بر اساس مژدگانی نزولی (-reward)"""
        response = self.client.get(self.url, {'ordering': '-reward'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        rewards = [r['reward'] for r in results]
        self.assertEqual(rewards, sorted(rewards, reverse=True))

    def test_filter_by_date_range(self):
        """فیلتر بازه زمانی حادثه"""
        now = timezone.now()
        from_date = (now - timedelta(days=5)).isoformat()
        response = self.client.get(self.url, {'from_date': from_date})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # آگهی تبریز مربوط به ۱۰ روز قبل است و نباید باشد، تهران (۲ روز پیش) و اصفهان (۱ روز پیش) باید باشند
        self.assertEqual(response.data['count'], 2)


class PetReportCachingAPITests(APITestCase):
    """تست‌های اختصاصی کشینگ و ابطال کش در Redis"""

    def setUp(self):
        cache.clear()
        self.user = User.objects.create_user(phone_number="09121113355", password="password123")
        self.url = reverse('pet-report-list')
        self.report = PetReport.objects.create(
            user=self.user,
            title="گربه گمشده تستی",
            pet_type="CAT",
            report_type="LOST",
            color="طوسی",
            city="تهران",
            event_date=timezone.now()
        )

    def test_cache_hit_and_miss_lifecycle(self):
        """درخواست اول Cache Miss و درخواست دوم Cache Hit است"""
        # درخواست اول: خواندن از دیتابیس و ذخیره در کش
        res1 = self.client.get(self.url)
        self.assertEqual(res1.status_code, status.HTTP_200_OK)
        self.assertEqual(res1.headers.get('X-Cache'), 'MISS')

        # درخواست دوم: بازگرداندن مستقیم از Redis
        res2 = self.client.get(self.url)
        self.assertEqual(res2.status_code, status.HTTP_200_OK)
        self.assertEqual(res2.headers.get('X-Cache'), 'HIT')

    def test_cache_invalidation_on_new_report(self):
        """ثبت آگهی جدید باید کش قبلی را نامعتبر کند"""
        # پر کردن کش
        res1 = self.client.get(self.url)
        self.assertEqual(res1.data['count'], 1)
        self.assertEqual(res1.headers.get('X-Cache'), 'MISS')

        # ایجاد آگهی جدید
        self.client.force_authenticate(user=self.user)
        payload = {
            "title": "سگ ژرمن جدید",
            "pet_type": "DOG",
            "report_type": "FOUND",
            "color": "مشکی و قهوه‌ای",
            "city": "کرج",
            "event_date": timezone.now().isoformat()
        }
        create_res = self.client.post(self.url, payload)
        self.assertEqual(create_res.status_code, status.HTTP_201_CREATED)

        # درخواست مجدد: باید کش پاک شده باشد (MISS) و تعداد به ۲ افزایش یابد
        res2 = self.client.get(self.url)
        self.assertEqual(res2.headers.get('X-Cache'), 'MISS')
        self.assertEqual(res2.data['count'], 2)

    def test_cache_key_order_independence(self):
        """ترتیب پارامترهای ارسالی در کوئری نباید باعث تولید دو کلید کش مجزا شود"""
        res1 = self.client.get(self.url, {'city': 'تهران', 'pet_type': 'CAT'})
        self.assertEqual(res1.headers.get('X-Cache'), 'MISS')

        # همان درخواست با جابجایی ترتیب کلیدها
        res2 = self.client.get(self.url, {'pet_type': 'CAT', 'city': 'تهران'})
        self.assertEqual(res2.headers.get('X-Cache'), 'HIT')