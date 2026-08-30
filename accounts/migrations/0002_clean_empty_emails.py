from django.db import migrations

def clean_empty_emails(apps, schema_editor):
    CustomUser = apps.get_model('accounts', 'CustomUser')
    CustomUser.objects.filter(email='').update(email=None)

class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(clean_empty_emails, migrations.RunPython.noop),
    ]
