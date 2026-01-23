"""
Service to read SMTP configuration from the SMTP app's metadata.
"""
import json
import logging
from typing import Optional

from django.conf import settings
from django.core.exceptions import ImproperlyConfigured

from ...app.models import App

logger = logging.getLogger(__name__)


class SmtpConfigReader:
    """Read SMTP configuration from SMTP app metadata."""

    SMTP_APP_IDENTIFIER = "smtp"
    METADATA_KEY = "smtp-config"

    @classmethod
    def get_smtp_app(cls) -> Optional[App]:
        """Get the SMTP app instance."""
        try:
            return App.objects.filter(
                identifier=cls.SMTP_APP_IDENTIFIER, is_active=True, is_installed=True
            ).first()
        except Exception as e:
            logger.warning(f"Error fetching SMTP app: {e}")
            return None

    @classmethod
    def get_smtp_config(cls) -> Optional[dict]:
        """
        Get SMTP configuration from SMTP app metadata.
        Returns the first active configuration, or None if not found.
        """
        app = cls.get_smtp_app()
        if not app:
            logger.debug("SMTP app not found or not active")
            return None

        # Try to get config from private_metadata first (encrypted)
        config_json = app.get_value_from_private_metadata(cls.METADATA_KEY)
        if not config_json:
            # Fallback to metadata (unencrypted)
            config_json = app.get_value_from_metadata(cls.METADATA_KEY)

        if not config_json:
            logger.debug("SMTP config not found in app metadata")
            return None

        try:
            # Config might be stored as JSON string or already parsed
            if isinstance(config_json, str):
                config = json.loads(config_json)
            else:
                config = config_json

            # SMTP app stores configs as: { "configurations": [...] }
            # We need to find the first active configuration
            configurations = config.get("configurations", [])
            if not configurations:
                logger.debug("No SMTP configurations found")
                return None

            # Find first active configuration
            for smtp_config in configurations:
                if smtp_config.get("active", False):
                    return smtp_config

            logger.debug("No active SMTP configuration found")
            return None

        except (json.JSONDecodeError, KeyError, TypeError) as e:
            logger.warning(f"Error parsing SMTP config: {e}")
            return None

    @classmethod
    def get_django_email_settings(cls) -> dict:
        """
        Get Django email backend settings from SMTP app configuration.
        Returns a dict with EMAIL_HOST, EMAIL_PORT, EMAIL_HOST_USER, etc.
        """
        smtp_config = cls.get_smtp_config()
        if not smtp_config:
            # Fallback to Django's default email settings
            return {
                "EMAIL_HOST": getattr(settings, "EMAIL_HOST", None),
                "EMAIL_PORT": getattr(settings, "EMAIL_PORT", 587),
                "EMAIL_HOST_USER": getattr(settings, "EMAIL_HOST_USER", None),
                "EMAIL_HOST_PASSWORD": getattr(settings, "EMAIL_HOST_PASSWORD", None),
                "EMAIL_USE_TLS": getattr(settings, "EMAIL_USE_TLS", True),
                "EMAIL_USE_SSL": getattr(settings, "EMAIL_USE_SSL", False),
                "EMAIL_FROM": getattr(
                    settings, "DEFAULT_FROM_EMAIL", getattr(settings, "EMAIL_HOST_USER", None)
                ),
            }

        # Map SMTP app config to Django email settings
        encryption = smtp_config.get("encryption", "NONE").upper()
        use_tls = encryption == "TLS"
        use_ssl = encryption == "SSL"

        sender_email = smtp_config.get("senderEmail") or smtp_config.get("smtpUser")
        sender_name = smtp_config.get("senderName", "")

        # Format from email with name if available
        from_email = sender_email
        if sender_name and sender_email:
            from_email = f"{sender_name} <{sender_email}>"

        return {
            "EMAIL_HOST": smtp_config.get("smtpHost"),
            "EMAIL_PORT": int(smtp_config.get("smtpPort", 587)),
            "EMAIL_HOST_USER": smtp_config.get("smtpUser"),
            "EMAIL_HOST_PASSWORD": smtp_config.get("smtpPassword"),
            "EMAIL_USE_TLS": use_tls,
            "EMAIL_USE_SSL": use_ssl,
            "EMAIL_FROM": from_email or sender_email,
        }
