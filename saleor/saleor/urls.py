from django.conf import settings
from django.conf.urls.static import static
from django.contrib.staticfiles.views import serve
from django.urls import re_path
from django.views.decorators.csrf import csrf_exempt

from .account.views import confirm_and_login_view, resend_confirmation_email_view
from .core.views import jwks
from .graphql.api import backend, schema
from .graphql.views import GraphQLView
from .plugins.views import (
    handle_global_plugin_webhook,
    handle_plugin_per_channel_webhook,
    handle_plugin_webhook,
)
from .product.views import digital_product
from .thumbnail.views import handle_thumbnail

urlpatterns = [
    re_path(
        r"^graphql/$",
        csrf_exempt(GraphQLView.as_view(backend=backend, schema=schema)),
        name="api",
    ),
    re_path(
        r"^digital-download/(?P<token>[0-9A-Za-z_\-]+)/$",
        digital_product,
        name="digital-product",
    ),
    re_path(
        r"^plugins/channel/(?P<channel_slug>[.0-9A-Za-z_\-]+)/"
        r"(?P<plugin_id>[.0-9A-Za-z_\-]+)/",
        handle_plugin_per_channel_webhook,
        name="plugins-per-channel",
    ),
    re_path(
        r"^plugins/global/(?P<plugin_id>[.0-9A-Za-z_\-]+)/",
        handle_global_plugin_webhook,
        name="plugins-global",
    ),
    re_path(
        r"^plugins/(?P<plugin_id>[.0-9A-Za-z_\-]+)/",
        handle_plugin_webhook,
        name="plugins",
    ),
    re_path(
        (
            r"^thumbnail/(?P<instance_id>[.0-9A-Za-z_=\-]+)/(?P<size>\d+)/"
            r"(?:(?P<format>[a-zA-Z]+)/)?"
        ),
        handle_thumbnail,
        name="thumbnail",
    ),
    re_path(r"^\.well-known/jwks.json$", jwks, name="jwks"),
    re_path(
        r"^resend-confirmation-email/$",
        resend_confirmation_email_view,
        name="resend-confirmation-email",
    ),
    re_path(
        r"^confirm-and-login/$",
        confirm_and_login_view,
        name="confirm-and-login",
    ),
]

if settings.DEBUG:
    from .core import views
    import warnings

    # Suppress the Django warning about MEDIA_URL within STATIC_URL
    # This is a known limitation of Django's runserver in development
    # In production, media files should be served by a web server (nginx, etc.)
    with warnings.catch_warnings():
        warnings.filterwarnings(
            "ignore",
            message=".*runserver can't serve media if MEDIA_URL is within STATIC_URL.*",
            category=UserWarning,
        )
        urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT) + [
        re_path(r"^static/(?P<path>.*)$", serve),
        re_path(r"^$", views.home, name="home"),
    ]
