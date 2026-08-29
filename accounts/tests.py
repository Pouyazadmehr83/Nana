from django.test import TestCase
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()


class CustomUserModelTests(TestCase):
    """تست‌های واحد برای مدل کاربر و منیجر اختصاصی"""

    def setUp(self):
        self.phone_number = "09121234567"
        self.password = "StrongPass123!"

    def test_create_user_successful(self):
        """ساخت کاربر عادی با موفقیت"""
        user = User.objects.create_user(
            phone_number=self.phone_number,
            password=self.password,
            first_name="Ali",
            last_name="Rezaei",
            email="ali@example.com"
        )
        self.assertEqual(user.phone_number, self.phone_number)
        self.assertEqual(user.first_name, "Ali")
        self.assertEqual(user.last_name, "Rezaei")
        self.assertEqual(user.email, "ali@example.com")
        self.assertTrue(user.is_active)
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)
        self.assertTrue(user.check_password(self.password))

    def test_create_user_without_phone_raises_value_error(self):
        """ساخت کاربر بدون شماره موبایل باید خطا ایجاد کند"""
        with self.assertRaises(ValueError) as ctx:
            User.objects.create_user(phone_number="", password=self.password)
        self.assertIn("شماره موبایل الزامی است", str(ctx.exception))

    def test_create_user_normalizes_email(self):
        """نرمال‌سازی ایمیل (تبدیل دامنه به حروف کوچک)"""
        user = User.objects.create_user(
            phone_number=self.phone_number,
            password=self.password,
            email="TestUser@EXAMPLE.COM"
        )
        self.assertEqual(user.email, "TestUser@example.com")

    def test_create_superuser_successful(self):
        """ساخت سوپریوزر با موفقیت"""
        admin = User.objects.create_superuser(
            phone_number="09129999999",
            password=self.password
        )
        self.assertTrue(admin.is_staff)
        self.assertTrue(admin.is_superuser)
        self.assertTrue(admin.is_active)

    def test_create_superuser_invalid_flags(self):
        """بررسی خطای ساخت سوپریوزر با فلگ‌های نامعتبر"""
        with self.assertRaises(ValueError):
            User.objects.create_superuser(
                phone_number="09128888888",
                password=self.password,
                is_staff=False
            )
        with self.assertRaises(ValueError):
            User.objects.create_superuser(
                phone_number="09127777777",
                password=self.password,
                is_superuser=False
            )

    def test_phone_number_regex_validation(self):
        """اعتبارسنجی فرمت شماره موبایل با Regex"""
        invalid_phones = [
            "08123456789",    # شروع با ۰۸ به جای ۰۹
            "0912345678",     # ۱۰ رقمی
            "091234567890",   # ۱۲ رقمی
            "0912abcd123",    # دارای حروف
            "9123456789",     # بدون ۰ اول
        ]
        for phone in invalid_phones:
            user = User(phone_number=phone)
            with self.assertRaises(ValidationError):
                user.full_clean()

    def test_unique_phone_number(self):
        """عدم امکان ثبت شماره موبایل تکراری"""
        User.objects.create_user(phone_number=self.phone_number, password=self.password)
        with self.assertRaises(IntegrityError):
            User.objects.create_user(phone_number=self.phone_number, password="other_password")

    def test_user_str_representation(self):
        """متد __str__ باید شماره موبایل را بازگرداند"""
        user = User.objects.create_user(phone_number=self.phone_number, password=self.password)
        self.assertEqual(str(user), self.phone_number)


class UserRegistrationAPITests(APITestCase):
    """تست‌های اندپوینت ثبت‌نام (/api/v1/auth/register/)"""

    def setUp(self):
        self.register_url = reverse('auth-register')
        self.valid_payload = {
            "phone_number": "09121112233",
            "first_name": "سارا",
            "last_name": "احمدی",
            "password": "StrongPassword123!",
            "password2": "StrongPassword123!"
        }

    def test_register_valid_user_success(self):
        """ثبت‌نام موفق کاربر جدید"""
        response = self.client.post(self.register_url, self.valid_payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['phone_number'], self.valid_payload['phone_number'])
        self.assertEqual(response.data['first_name'], self.valid_payload['first_name'])
        self.assertNotIn('password', response.data)
        self.assertNotIn('password2', response.data)

        # بررسی ذخیره‌سازی در دیتابیس و هش شدن پسورد
        user = User.objects.get(phone_number=self.valid_payload['phone_number'])
        self.assertTrue(user.check_password(self.valid_payload['password']))

    def test_register_password_mismatch(self):
        """عدم تطابق رمز عبور و تکرار آن"""
        payload = self.valid_payload.copy()
        payload['password2'] = "DifferentPassword123!"
        response = self.client.post(self.register_url, payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('password', response.data)

    def test_register_weak_password(self):
        """عدم پذیرش رمز عبور ضعیف (اعتبارسنجی رمزهای جنگو)"""
        payload = self.valid_payload.copy()
        payload['password'] = "123"
        payload['password2'] = "123"
        response = self.client.post(self.register_url, payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_invalid_phone_number(self):
        """عدم پذیرش شماره موبایل نامعتبر در ثبت‌نام"""
        payload = self.valid_payload.copy()
        payload['phone_number'] = "12345"
        response = self.client.post(self.register_url, payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('phone_number', response.data)

    def test_register_duplicate_phone_number(self):
        """عدم پذیرش شماره موبایل تکراری"""
        self.client.post(self.register_url, self.valid_payload)
        response = self.client.post(self.register_url, self.valid_payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('phone_number', response.data)

    def test_register_with_email_and_duplicate_email(self):
        """ثبت‌نام با ایمیل و جلوگیری از ایمیل تکراری"""
        payload1 = self.valid_payload.copy()
        payload1['phone_number'] = "09121110001"
        payload1['email'] = "user1@example.com"
        response1 = self.client.post(self.register_url, payload1)
        self.assertEqual(response1.status_code, status.HTTP_201_CREATED)

        payload2 = self.valid_payload.copy()
        payload2['phone_number'] = "09121110002"
        payload2['email'] = "user1@example.com"
        response2 = self.client.post(self.register_url, payload2)
        self.assertEqual(response2.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response2.data)


class JWTAuthenticationAPITests(APITestCase):
    """تست‌های احراز هویت و دریافت JWT (/api/v1/auth/token/)"""

    def setUp(self):
        self.token_obtain_url = reverse('token_obtain_pair')
        self.phone_number = "09125556677"
        self.password = "ValidPassword123!"
        self.user = User.objects.create_user(
            phone_number=self.phone_number,
            password=self.password,
            first_name="Mahdi",
            last_name="Hosseini"
        )
        self.profile_url = reverse('user-profile')

    def test_obtain_token_success(self):
        """دریافت توکن‌های access و refresh با مشخصات صحیح"""
        payload = {
            "phone_number": self.phone_number,
            "password": self.password
        }
        response = self.client.post(self.token_obtain_url, payload)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)

    def test_obtain_token_invalid_password(self):
        """خطا در صورت اشتباه بودن رمز عبور"""
        payload = {
            "phone_number": self.phone_number,
            "password": "WrongPassword!"
        }
        response = self.client.post(self.token_obtain_url, payload)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_obtain_token_nonexistent_user(self):
        """خطا در صورت عدم وجود شماره موبایل"""
        payload = {
            "phone_number": "09120000000",
            "password": self.password
        }
        response = self.client.post(self.token_obtain_url, payload)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_obtain_token_inactive_user(self):
        """کاربر غیرفعال (is_active=False) نمی‌تواند توکن دریافت کند"""
        self.user.is_active = False
        self.user.save()
        payload = {
            "phone_number": self.phone_number,
            "password": self.password
        }
        response = self.client.post(self.token_obtain_url, payload)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_access_protected_view_with_bearer_token(self):
        """دسترسی به اندپوینت نیازمند لاگین با توکن Bearer"""
        login_res = self.client.post(self.token_obtain_url, {
            "phone_number": self.phone_number,
            "password": self.password
        })
        access_token = login_res.data['access']

        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        response = self.client.get(self.profile_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['phone_number'], self.phone_number)

    def test_access_protected_view_with_invalid_token(self):
        """دسترسی به اندپوینت محافظت‌شده با توکن نامعتبر"""
        self.client.credentials(HTTP_AUTHORIZATION='Bearer invalid_token_string_here')
        response = self.client.get(self.profile_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class JWTRefreshAndBlacklistAPITests(APITestCase):
    """تست‌های تمدید توکن و خروج (Blacklist)"""

    def setUp(self):
        self.token_refresh_url = reverse('token_refresh')
        self.token_blacklist_url = reverse('token_blacklist')
        self.user = User.objects.create_user(
            phone_number="09127778899",
            password="Password123!"
        )
        self.refresh = RefreshToken.for_user(self.user)

    def test_token_refresh_success(self):
        """تمدید موفق Access Token و دریافت توکن‌های چرخشی (Rotation)"""
        payload = {"refresh": str(self.refresh)}
        response = self.client.post(self.token_refresh_url, payload)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        # چون ROTATE_REFRESH_TOKENS فعال است، توکن refresh جدید هم برگردانده می‌شود
        self.assertIn('refresh', response.data)

    def test_old_refresh_token_blacklisted_after_rotation(self):
        """توکن قبلی پس از چرخش باید باطل (Blacklist) شود"""
        payload = {"refresh": str(self.refresh)}
        res1 = self.client.post(self.token_refresh_url, payload)
        self.assertEqual(res1.status_code, status.HTTP_200_OK)

        # تلاش مجدد با توکن رفرش قدیمی باید با خطا روبرو شود
        res2 = self.client.post(self.token_refresh_url, payload)
        self.assertEqual(res2.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_token_blacklist_on_logout(self):
        """باطل‌سازی دستی توکن رفرش در هنگام خروج کاربر"""
        payload = {"refresh": str(self.refresh)}
        response = self.client.post(self.token_blacklist_url, payload)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # توکن باطل‌شده دیگر نمی‌تواند اکسس‌توکن جدید بگیرد
        refresh_res = self.client.post(self.token_refresh_url, payload)
        self.assertEqual(refresh_res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_refresh_with_invalid_token(self):
        """تمدید با توکن نامعتبر باید رد شود"""
        response = self.client.post(self.token_refresh_url, {"refresh": "fake_token"})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class UserProfileAPITests(APITestCase):
    """تست‌های مدیریت پروفایل کاربر (/api/v1/auth/me/)"""

    def setUp(self):
        self.profile_url = reverse('user-profile')
        self.user = User.objects.create_user(
            phone_number="09123334455",
            password="Password123!",
            first_name="Reza",
            last_name="Moradi",
            email="reza@example.com"
        )

    def test_unauthenticated_user_cannot_access_profile(self):
        """کاربر مهمان نباید بتواند پروفایل را ببیند"""
        response = self.client.get(self.profile_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_authenticated_user_can_retrieve_profile(self):
        """کاربر لاگین‌شده مشخصات پروفایل خود را دریافت می‌کند"""
        self.client.force_authenticate(user=self.user)
        response = self.client.get(self.profile_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['phone_number'], self.user.phone_number)
        self.assertEqual(response.data['email'], self.user.email)
        self.assertEqual(response.data['first_name'], self.user.first_name)
        self.assertEqual(response.data['last_name'], self.user.last_name)
        self.assertIn('date_joined', response.data)

    def test_authenticated_user_can_update_profile(self):
        """کاربر می‌تواند نام، نام خانوادگی و ایمیل خود را ویرایش کند"""
        self.client.force_authenticate(user=self.user)
        payload = {
            "first_name": "رضا جدید",
            "last_name": "مرادی جدید",
            "email": "new_reza@example.com"
        }
        response = self.client.patch(self.profile_url, payload)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.first_name, "رضا جدید")
        self.assertEqual(self.user.last_name, "مرادی جدید")
        self.assertEqual(self.user.email, "new_reza@example.com")

    def test_phone_number_is_readonly(self):
        """شماره موبایل نباید از طریق اندپوینت پروفایل قابل تغییر باشد"""
        self.client.force_authenticate(user=self.user)
        payload = {"phone_number": "09129990000"}
        response = self.client.patch(self.profile_url, payload)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.phone_number, "09123334455")
