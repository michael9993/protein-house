# Generated manually for ContactSubmission model

from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ('account', '0096_newslettersubscription'),
        ('channel', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='ContactSubmission',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('name', models.CharField(help_text='Customer name', max_length=256)),
                ('email', models.EmailField(db_index=True, help_text='Customer email address', max_length=254)),
                ('subject', models.CharField(help_text='Message subject', max_length=512)),
                ('message', models.TextField(help_text='Message content')),
                ('status', models.CharField(choices=[('NEW', 'New'), ('READ', 'Read'), ('REPLIED', 'Replied'), ('ARCHIVED', 'Archived')], db_index=True, default='NEW', help_text='Current status of the submission', max_length=20)),
                ('created_at', models.DateTimeField(auto_now_add=True, db_index=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('replied_at', models.DateTimeField(blank=True, help_text='When the submission was replied to', null=True)),
                ('channel', models.ForeignKey(db_index=True, help_text='Channel where the submission was made', on_delete=django.db.models.deletion.CASCADE, related_name='contact_submissions', to='channel.channel')),
                ('replied_by', models.ForeignKey(blank=True, help_text='Staff member who replied', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='contact_submission_replies', to='account.user')),
            ],
            options={
                'verbose_name': 'Contact Submission',
                'verbose_name_plural': 'Contact Submissions',
                'ordering': ('-created_at',),
            },
        ),
        migrations.AddIndex(
            model_name='contactsubmission',
            index=models.Index(fields=['channel', '-created_at'], name='account_con_channel_created_idx'),
        ),
        migrations.AddIndex(
            model_name='contactsubmission',
            index=models.Index(fields=['status', '-created_at'], name='account_con_status_created_idx'),
        ),
        migrations.AddIndex(
            model_name='contactsubmission',
            index=models.Index(fields=['email', '-created_at'], name='account_con_email_created_idx'),
        ),
        migrations.AddIndex(
            model_name='contactsubmission',
            index=models.Index(fields=['-created_at'], name='account_con_created_at_idx'),
        ),
    ]
