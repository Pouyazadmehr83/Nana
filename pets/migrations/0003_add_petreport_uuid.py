import uuid
from django.db import migrations, models


def populate_unique_uuids(apps, schema_editor):
    PetReport = apps.get_model('pets', 'PetReport')
    for report in PetReport.objects.all():
        report.uuid = uuid.uuid4()
        report.save(update_fields=['uuid'])


class Migration(migrations.Migration):

    dependencies = [
        ('pets', '0002_alter_petimage_image_alter_sighting_image'),
    ]

    operations = [
        # مرحله ۱: اضافه کردن فیلد با امکان null برای جلوگیری از مقدار تکراری در سطرهای موجود
        migrations.AddField(
            model_name='petreport',
            name='uuid',
            field=models.UUIDField(
                default=uuid.uuid4,
                null=True,
                editable=False,
                verbose_name='شناسه یکتا'
            ),
        ),
        # مرحله ۲: تولید UUID اختصاصی و یکتا برای تک‌تک آگهی‌های از پیش ثبت‌شده
        migrations.RunPython(populate_unique_uuids, reverse_code=migrations.RunPython.noop),
        # مرحله ۳: اعمال محدودیت‌های یکتا و غیرقابل خالی بودن (unique & not null)
        migrations.AlterField(
            model_name='petreport',
            name='uuid',
            field=models.UUIDField(
                db_index=True,
                default=uuid.uuid4,
                editable=False,
                null=False,
                unique=True,
                verbose_name='شناسه یکتا'
            ),
        ),
    ]
