from rest_framework import serializers
from drf_spectacular.utils import extend_schema_field
from drf_spectacular.types import OpenApiTypes
from .models import PetReport, PetImage, Sighting


class PetImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = PetImage
        fields = ['id', 'image', 'is_main', 'uploaded_at']
        read_only_fields = ['id', 'uploaded_at']

    def validate_image(self, file):
        # حداکثر حجم مجاز: ۵ مگابایت
        max_size = 5 * 1024 * 1024
        if file.size > max_size:
            raise serializers.ValidationError("حجم تصویر نباید بیشتر از ۵ مگابایت باشد.")
        
        # بررسی پسوند فایل
        valid_extensions = ('.jpg', '.jpeg', '.png', '.webp', '.heic')
        if not file.name.lower().endswith(valid_extensions):
            raise serializers.ValidationError("فرمت تصویر باید یکی از موارد JPG, PNG, WEBP باشد.")
        return file


class SightingSerializer(serializers.ModelSerializer):
    user_phone = serializers.ReadOnlyField(source='user.phone_number')

    class Meta:
        model = Sighting
        fields = [
            'id', 'report', 'user', 'user_phone', 'seen_at',
            'location_description', 'latitude', 'longitude', 'image', 'created_at'
        ]
        read_only_fields = ['id', 'user', 'created_at']

    def validate_latitude(self, value):
        if value is not None:
            return round(value, 6)
        return value

    def validate_longitude(self, value):
        if value is not None:
            return round(value, 6)
        return value

    def create(self, validated_data):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            validated_data['user'] = request.user
        return super().create(validated_data)


class PetReportListSerializer(serializers.ModelSerializer):
    main_image = serializers.SerializerMethodField()

    class Meta:
        model = PetReport
        fields = [
            'id', 'title', 'report_type', 'pet_type', 'city',
            'district', 'event_date', 'reward', 'is_resolved',
            'main_image', 'created_at'
        ]

    @extend_schema_field(OpenApiTypes.URI)
    def get_main_image(self, obj):
        # واکشی امن و کش‌شده در سطح پایتون
        images = list(obj.images.all())
        if not images:
            return None
        
        main = next((img for img in images if img.is_main), images[0])
        request = self.context.get('request')
        return request.build_absolute_uri(main.image.url) if request else main.image.url


class PetReportDetailSerializer(serializers.ModelSerializer):
    images = PetImageSerializer(many=True, read_only=True)
    sightings = SightingSerializer(many=True, read_only=True)
    user_phone = serializers.ReadOnlyField(source='user.phone_number')

    class Meta:
        model = PetReport
        fields = [
            'id', 'user', 'user_phone', 'report_type', 'pet_type',
            'title', 'name', 'breed', 'color', 'gender', 'age',
            'has_collar', 'microchip_id', 'special_features',
            'event_date', 'city', 'district', 'address_description',
            'latitude', 'longitude', 'contact_phone', 'reward',
            'is_resolved', 'images', 'sightings', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']

    def validate_latitude(self, value):
        if value is not None:
            return round(value, 6)
        return value

    def validate_longitude(self, value):
        if value is not None:
            return round(value, 6)
        return value

    def validate(self, attrs):
        # بررسی دقیق مختصات با در نظر گرفتن داده‌های فعلی در حالت PATCH
        lat = attrs.get('latitude', getattr(self.instance, 'latitude', None))
        lng = attrs.get('longitude', getattr(self.instance, 'longitude', None))

        if (lat is not None and lng is None) or (lat is None and lng is not None):
            raise serializers.ValidationError("طول و عرض جغرافیایی باید هر دو وارد شوند یا هر دو خالی باشند.")
        return attrs

    def create(self, validated_data):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            validated_data['user'] = request.user
        return super().create(validated_data)