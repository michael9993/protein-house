"""
Service to send email notifications for contact form submissions.
"""
import logging
from typing import Optional
import requests

from django.conf import settings
from django.core.mail import EmailMessage, get_connection
from django.template.loader import render_to_string
from django.utils.html import strip_tags

from ...account.models import ContactSubmission
from ...site.models import SiteSettings
from ...app.models import App
from .smtp_config_reader import SmtpConfigReader

logger = logging.getLogger(__name__)


class ContactSubmissionEmailService:
    """Service for sending emails related to contact submissions."""

    @classmethod
    def get_store_email(cls) -> Optional[str]:
        """Get the store's contact/support email address."""
        try:
            site_settings = SiteSettings.objects.first()
            if site_settings and site_settings.default_mail_sender_address:
                return site_settings.default_mail_sender_address
        except Exception as e:
            logger.warning(f"Error getting store email: {e}")
        return getattr(settings, "CONTACT_EMAIL", getattr(settings, "DEFAULT_FROM_EMAIL", "noreply@yourstore.com"))

    @classmethod
    def send_notification_email(cls, submission: ContactSubmission) -> bool:
        """
        Send email notification to store admin when a new submission is created.
        Returns True if email was sent successfully, False otherwise.
        """
        try:
            store_email = cls.get_store_email()
            if not store_email:
                logger.warning("No store email configured, skipping notification")
                return False

            # Get SMTP settings
            email_settings = SmtpConfigReader.get_django_email_settings()

            # Prepare email content
            subject = f"New Contact Form Submission: {submission.subject}"
            context = {
                "submission": submission,
                "store_name": getattr(settings, "SITE_NAME", "Store"),
            }

            # Create plain text message
            message = f"""
New contact form submission received:

Name: {submission.name}
Email: {submission.email}
Subject: {submission.subject}
Channel: {submission.channel.name}
Submitted: {submission.created_at.strftime('%Y-%m-%d %H:%M:%S')}

Message:
{submission.message}

---
You can view and manage this submission in the Saleor dashboard.
"""

            # Send email using Django's email backend
            # Configure connection with SMTP settings if available
            connection = None
            if email_settings.get("EMAIL_HOST"):
                connection = get_connection(
                    host=email_settings["EMAIL_HOST"],
                    port=email_settings["EMAIL_PORT"],
                    username=email_settings["EMAIL_HOST_USER"],
                    password=email_settings["EMAIL_HOST_PASSWORD"],
                    use_tls=email_settings.get("EMAIL_USE_TLS", False),
                    use_ssl=email_settings.get("EMAIL_USE_SSL", False),
                )

            # Use CONTACT_FROM_EMAIL for contact notifications, fall back to CONTACT_EMAIL, then SMTP sender
            from_email = (
                getattr(settings, "CONTACT_FROM_EMAIL", None)
                or getattr(settings, "CONTACT_EMAIL", None)
                or email_settings.get("EMAIL_FROM")
                or store_email
            )

            email = EmailMessage(
                subject=subject,
                body=message,
                from_email=from_email,
                to=[store_email],
                connection=connection,
            )

            email.send(fail_silently=False)
            logger.info(f"Contact submission notification email sent to {store_email}")
            return True

        except Exception as e:
            logger.error(f"Error sending contact submission notification email: {e}", exc_info=True)
            return False

    @classmethod
    def send_auto_reply(cls, submission: ContactSubmission) -> bool:
        """
        Send auto-reply email to customer confirming their submission.
        Returns True if email was sent successfully, False otherwise.
        """
        try:
            # Get SMTP settings
            email_settings = SmtpConfigReader.get_django_email_settings()
            if not email_settings.get("EMAIL_HOST"):
                logger.debug("SMTP not configured, skipping auto-reply")
                return False

            store_email = cls.get_store_email()
            if not store_email:
                logger.warning("No store email configured, skipping auto-reply")
                return False

            # Prepare email content
            subject = f"Re: {submission.subject}"
            message = f"""
Dear {submission.name},

Thank you for contacting us. We have received your message and will get back to you as soon as possible.

Your message:
{submission.subject}

{submission.message}

---
Best regards,
{getattr(settings, 'SITE_NAME', 'Store Team')}
"""

            # Configure connection with SMTP settings
            connection = get_connection(
                host=email_settings["EMAIL_HOST"],
                port=email_settings["EMAIL_PORT"],
                username=email_settings["EMAIL_HOST_USER"],
                password=email_settings["EMAIL_HOST_PASSWORD"],
                use_tls=email_settings.get("EMAIL_USE_TLS", False),
                use_ssl=email_settings.get("EMAIL_USE_SSL", False),
            )

            from_email = email_settings.get("EMAIL_FROM") or store_email

            email = EmailMessage(
                subject=subject,
                body=message,
                from_email=from_email,
                to=[submission.email],
                connection=connection,
            )

            email.send(fail_silently=False)
            logger.info(f"Contact submission auto-reply sent to {submission.email}")
            return True

        except Exception as e:
            logger.error(f"Error sending contact submission auto-reply: {e}", exc_info=True)
            return False

    @classmethod
    def send_reply(cls, submission: ContactSubmission, reply_message: str, reply_subject: Optional[str] = None) -> bool:
        """
        Send a reply email to the customer using the SMTP app.
        Returns True if email was sent successfully, False otherwise.
        """
        try:
            # Try to find the SMTP app
            smtp_app = App.objects.filter(
                identifier="saleor.app.smtp",
                is_active=True,
                removed_at__isnull=True
            ).first()
            
            if not smtp_app or not smtp_app.app_url:
                logger.warning("SMTP app not found or not configured, falling back to direct email")
                return cls._send_reply_direct(submission, reply_message, reply_subject)

            # Prepare payload for SMTP app
            app_url = smtp_app.app_url.rstrip('/')
            endpoint_url = f"{app_url}/api/contact-submission-reply"
            
            payload = {
                "submission": {
                    "id": str(submission.id),
                    "name": submission.name,
                    "email": submission.email,
                    "subject": submission.subject,
                    "message": submission.message,
                    "created_at": submission.created_at.isoformat(),
                    "channel_slug": submission.channel.slug,
                },
                "reply_message": reply_message,
                "reply_subject": reply_subject,
                "saleor_url": getattr(settings, "SALEOR_URL", ""),  # Pass Saleor URL for auth
            }

            # Call SMTP app endpoint
            response = requests.post(
                endpoint_url,
                json=payload,
                timeout=30,
                headers={"Content-Type": "application/json"},
            )

            if response.status_code == 200:
                logger.info(f"Contact submission reply sent via SMTP app to {submission.email}")
                return True
            else:
                logger.warning(
                    f"SMTP app returned error {response.status_code}: {response.text}. "
                    "Falling back to direct email."
                )
                return cls._send_reply_direct(submission, reply_message, reply_subject)

        except requests.RequestException as e:
            logger.warning(f"Error calling SMTP app: {e}. Falling back to direct email.")
            return cls._send_reply_direct(submission, reply_message, reply_subject)
        except Exception as e:
            logger.error(f"Error sending contact submission reply: {e}", exc_info=True)
            # Try fallback
            return cls._send_reply_direct(submission, reply_message, reply_subject)

    @classmethod
    def _send_reply_direct(cls, submission: ContactSubmission, reply_message: str, reply_subject: Optional[str] = None) -> bool:
        """
        Fallback method to send reply email directly using Django's email backend.
        """
        try:
            # Get SMTP settings
            email_settings = SmtpConfigReader.get_django_email_settings()
            if not email_settings.get("EMAIL_HOST"):
                logger.warning("SMTP not configured, cannot send reply")
                return False

            store_email = cls.get_store_email()
            if not store_email:
                logger.warning("No store email configured, cannot send reply")
                return False

            # Prepare email content
            subject = reply_subject or f"Re: {submission.subject}"
            
            # Include original message for context
            message = f"""
Dear {submission.name},

Thank you for contacting us regarding: {submission.subject}

{reply_message}

---
Original message:
{submission.message}

---
Best regards,
{getattr(settings, 'SITE_NAME', 'Store Team')}
"""

            # Configure connection with SMTP settings
            connection = get_connection(
                host=email_settings["EMAIL_HOST"],
                port=email_settings["EMAIL_PORT"],
                username=email_settings["EMAIL_HOST_USER"],
                password=email_settings["EMAIL_HOST_PASSWORD"],
                use_tls=email_settings.get("EMAIL_USE_TLS", False),
                use_ssl=email_settings.get("EMAIL_USE_SSL", False),
            )

            from_email = email_settings.get("EMAIL_FROM") or store_email

            email = EmailMessage(
                subject=subject,
                body=message,
                from_email=from_email,
                to=[submission.email],
                connection=connection,
            )

            email.send(fail_silently=False)
            logger.info(f"Contact submission reply sent directly to {submission.email}")
            return True

        except Exception as e:
            logger.error(f"Error sending contact submission reply directly: {e}", exc_info=True)
            return False
