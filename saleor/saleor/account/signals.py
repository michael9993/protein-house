from django.db.models.signals import post_save
from django.dispatch import receiver

from ..core.tasks import delete_from_storage_task
from .models import ContactSubmission
from .services.contact_submission_email import ContactSubmissionEmailService


def delete_avatar(sender, instance, **kwargs):
    if avatar := instance.avatar:
        delete_from_storage_task.delay(avatar.name)


@receiver(post_save, sender=ContactSubmission)
def send_contact_submission_notification(sender, instance, created, **kwargs):
    """Send email notification when a new contact submission is created."""
    if created:
        # Send notification to store admin
        ContactSubmissionEmailService.send_notification_email(instance)
        
        # Optionally send auto-reply to customer
        # Uncomment the line below if you want to enable auto-replies
        # ContactSubmissionEmailService.send_auto_reply(instance)
