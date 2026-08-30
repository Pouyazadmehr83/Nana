import uuid
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('pets', '0002_alter_petimage_image_alter_sighting_image'),
    ]

    operations = [
        migrations.AddField(
            model_name='petreport',
            name='uuid',
            field=models.UUIDField(
                db_index=True,
                default=uuid.uuid4,
                editable=False,
                unique=True,
                verbose_name='شناسه یکتا'
            ),
        ),
    ]
