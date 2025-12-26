from django.contrib.sites.models import Site
from django.contrib.staticfiles.storage import staticfiles_storage
from django.core.exceptions import ImproperlyConfigured

from ..utils import build_absolute_uri, get_domain

LOGO_URL = "images/saleor-logo-sign.png"


def get_site_context():
    site: Site = Site.objects.get_current()
    
    # Try to get logo URL, but handle the case where staticfiles storage
    # can't be initialized (e.g., MEDIA_URL within STATIC_URL in development)
    logo_url = None
    try:
        logo_url = build_absolute_uri(staticfiles_storage.url(LOGO_URL))
    except (ImproperlyConfigured, KeyError, AttributeError) as e:
        # In development, staticfiles storage might not be properly configured
        # This is a non-critical error - we can still send emails without the logo
        import logging
        logger = logging.getLogger(__name__)
        logger.warning(
            "Could not generate logo URL for site context: %s. "
            "This is likely due to MEDIA_URL/STATIC_URL configuration in development. "
            "Email will be sent without logo URL.",
            str(e)
        )
        # Optionally, try to construct a fallback URL
        # For now, we'll just leave it as None
    
    site_context = {
        "domain": get_domain(),
        "site_name": site.name,
        "logo_url": logo_url,
    }
    return site_context
