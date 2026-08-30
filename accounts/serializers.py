from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password

User = get_user_model()

class UserRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)
    email = serializers.EmailField(required=False, allow_blank=True, allow_null=True)

    class Meta:
        model = User
        fields = ['phone_number', 'email', 'first_name', 'last_name', 'password', 'password2']

    def validate_email(self, value):
        if not value or not value.strip():
            return None
        value = value.strip().lower()
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("این ایمیل قبلاً در سیستم ثبت شده است.")
        return value

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "رمز عبور با تکرار آن یکسان نیست."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        if not validated_data.get('email'):
            validated_data['email'] = None
        user = User.objects.create_user(**validated_data)
        return user


class UserProfileSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(required=False, allow_blank=True, allow_null=True)

    class Meta:
        model = User
        fields = ['id', 'phone_number', 'email', 'first_name', 'last_name', 'date_joined']
        read_only_fields = ['id', 'phone_number', 'date_joined']

    def validate_email(self, value):
        if not value or not value.strip():
            return None
        value = value.strip().lower()
        user = self.instance
        if User.objects.filter(email=value).exclude(id=getattr(user, 'id', None)).exists():
            raise serializers.ValidationError("این ایمیل قبلاً در سیستم ثبت شده است.")
        return value
