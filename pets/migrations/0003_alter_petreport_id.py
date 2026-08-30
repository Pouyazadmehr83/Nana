import uuid
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('pets', '0002_alter_petimage_image_alter_sighting_image'),
    ]

    operations = [
        migrations.AlterField(
            model_name='petreport',
            name='id',
            field=models.UUIDField(
                default=uuid.uuid4,
                editable=False,
                primary_key=True,
                serialize=False,
                verbose_name='شناسه یکتا'
            ),
        ),
    ]
