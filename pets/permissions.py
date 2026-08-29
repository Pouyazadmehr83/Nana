from rest_framework import permissions
from .models import PetReport, PetImage, Sighting

class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    خواندن برای همه آزاد،
    تغییر/حذف صرفاً توسط مالک همان شیء یا ادمین.
    """
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True

        if not request.user or not request.user.is_authenticated:
            return False

        if request.user.is_staff:
            return True

        # برای آگهی و گزارش دیده‌شدن که مستقیماً فیلد user دارند
        if isinstance(obj, (PetReport, Sighting)):
            return obj.user == request.user

        # برای تصاویر که متعلق به آگهی هستند
        if isinstance(obj, PetImage):
            return obj.report.user == request.user

        return False