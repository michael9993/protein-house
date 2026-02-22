"""Abandoned checkout notification helpers."""

import logging
from typing import TYPE_CHECKING

from django.conf import settings
from django.core.signing import BadSignature, SignatureExpired, TimestampSigner

from ..core.notification.utils import get_site_context
from ..core.notify import NotifyHandler, UserNotifyEvent
from ..core.prices import quantize_price
from ..graphql.core.utils import to_global_id_or_none
from ..product import ProductMediaTypes
from ..thumbnail import THUMBNAIL_SIZES
from ..thumbnail.utils import get_image_or_proxy_url

if TYPE_CHECKING:
    from ..plugins.manager import PluginsManager
    from .models import Checkout

logger = logging.getLogger(__name__)

# Recovery link expiry: 7 days
RECOVERY_LINK_MAX_AGE = 7 * 24 * 60 * 60  # seconds


def create_recovery_url(checkout: "Checkout", storefront_url: str) -> str:
    """Create a signed recovery URL for the abandoned checkout.

    Uses Django's TimestampSigner so the token expires after RECOVERY_LINK_MAX_AGE.
    """
    signer = TimestampSigner()
    signed_token = signer.sign(str(checkout.token))
    channel_slug = checkout.channel.slug
    return f"{storefront_url}/api/recover-cart?channel={channel_slug}&token={signed_token}"


def validate_recovery_token(signed_token: str) -> str | None:
    """Validate a signed recovery token and return the checkout ID.

    Returns None if the token is invalid or expired.
    """
    signer = TimestampSigner()
    try:
        checkout_id = signer.unsign(signed_token, max_age=RECOVERY_LINK_MAX_AGE)
        return checkout_id
    except (SignatureExpired, BadSignature):
        return None


def _get_checkout_line_payload(line) -> dict:
    """Build payload dict for a single checkout line."""
    variant = line.variant
    product = variant.product if variant else None
    currency = line.currency

    # Get first product image thumbnail URL
    thumbnail_url = ""
    if product:
        media = product.media.filter(type=ProductMediaTypes.IMAGE).first()
        if media:
            try:
                thumbnail_url = get_image_or_proxy_url(
                    None, str(media.id), "ProductMedia", 256, None
                )
            except Exception:
                pass

    # Use undiscounted_unit_price_amount (always populated) for unit price.
    # total_price_gross_amount may be 0 if checkout hasn't been calculated yet,
    # so fall back to unit_price * quantity.
    unit_price = line.undiscounted_unit_price_amount or 0
    total = line.total_price_gross_amount
    if not total:
        total = unit_price * line.quantity

    return {
        "id": to_global_id_or_none(line),
        "product_name": str(product) if product else "",
        "variant_name": str(variant) if variant else "",
        "product_sku": variant.sku if variant else "",
        "quantity": line.quantity,
        "currency": currency,
        "unit_price_gross_amount": str(quantize_price(unit_price, currency)),
        "total_gross_amount": str(quantize_price(total, currency)),
        "thumbnail_url": thumbnail_url,
    }


def send_abandoned_checkout_notification(
    checkout: "Checkout",
    manager: "PluginsManager",
    recovery_url: str,
    email_number: int,
) -> None:
    """Send an abandoned checkout recovery email via the NOTIFY_USER webhook.

    Args:
        checkout: The abandoned checkout instance.
        manager: The plugins manager for dispatching notifications.
        recovery_url: Signed URL the customer clicks to recover their cart.
        email_number: Which email in the sequence (1, 2, or 3).
    """

    def _generate_payload() -> dict:
        lines_data = []
        checkout_lines = (
            checkout.lines.select_related("variant__product__product_type")
            .prefetch_related("variant__product__media")
            .all()
        )
        for line in checkout_lines:
            lines_data.append(_get_checkout_line_payload(line))

        site_context = get_site_context()
        currency = checkout.currency

        # Checkout-level totals may be 0 if prices haven't been calculated.
        # Fall back to summing line totals.
        subtotal = checkout.subtotal_gross_amount or 0
        total = checkout.total_gross_amount or 0
        if not subtotal and lines_data:
            from decimal import Decimal

            subtotal = sum(
                Decimal(ld["total_gross_amount"]) for ld in lines_data
            )
        if not total:
            total = subtotal

        return {
            "checkout_id": str(checkout.token),
            "recipient_email": checkout.email,
            "channel_slug": checkout.channel.slug,
            "domain": site_context["domain"],
            "site_name": site_context["site_name"],
            "logo_url": site_context.get("logo_url", ""),
            "recover_url": recovery_url,
            "email_number": email_number,
            "lines": lines_data,
            "subtotal_gross_amount": str(
                quantize_price(subtotal, currency)
            ),
            "total_gross_amount": str(
                quantize_price(total, currency)
            ),
            "currency": currency,
        }

    handler = NotifyHandler(_generate_payload)
    manager.notify(
        UserNotifyEvent.ABANDONED_CHECKOUT,
        payload_func=handler.payload,
        channel_slug=checkout.channel.slug,
    )
