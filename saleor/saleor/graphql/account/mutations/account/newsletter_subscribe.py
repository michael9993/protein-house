import graphene
from django.core.exceptions import ValidationError

from .....account import models
from .....core.tracing import traced_atomic_transaction
from .....webhook.event_types import WebhookEventAsyncType
from ....core import ResolveInfo
from ....core.doc_category import DOC_CATEGORY_USERS
from ....core.mutations import BaseMutation
from ....core.types import AccountError
from ....core.utils import WebhookEventInfo
from ....channel.utils import clean_channel


class NewsletterSubscribe(BaseMutation):
    subscribed = graphene.Boolean(description="Whether the subscription was successful.")
    already_subscribed = graphene.Boolean(description="Whether the email was already actively subscribed.")
    was_reactivated = graphene.Boolean(description="Whether an inactive subscription was reactivated.")

    class Arguments:
        email = graphene.String(
            required=True,
            description="Email address to subscribe to the newsletter.",
        )
        source = graphene.String(
            required=False,
            description="Source of the subscription (e.g., 'homepage', 'checkout').",
        )
        channel = graphene.String(
            required=False,
            description="Channel slug where the subscription was made.",
        )

    class Meta:
        description = "Subscribe an email address to the newsletter."
        doc_category = DOC_CATEGORY_USERS
        error_type_class = AccountError
        error_type_field = "account_errors"
        webhook_events_info = [
            WebhookEventInfo(
                type=WebhookEventAsyncType.NOTIFY_USER,
                description="A notification for newsletter subscription.",
            ),
        ]
        # No permissions required - anyone can subscribe

    @classmethod
    def clean_input(cls, info: ResolveInfo, data):
        """Validate and clean input data."""
        cleaned_input = data.copy()

        # Validate email
        email = cleaned_input.get("email", "").strip().lower()
        if not email or "@" not in email:
            raise ValidationError({"email": "Please provide a valid email address."})

        cleaned_input["email"] = email

        # Get user from context if authenticated
        user = None
        if info.context.user and hasattr(info.context.user, 'is_authenticated') and info.context.user.is_authenticated:
            user = info.context.user
        cleaned_input["user"] = user

        # Get and validate channel if provided
        channel_slug = cleaned_input.get("channel", "")
        channel = None
        if channel_slug:
            try:
                channel = clean_channel(
                    channel_slug,
                    error_class=AccountError,
                    allow_replica=info.context.allow_replica,
                )
            except ValidationError:
                # If channel validation fails, we'll continue without channel
                # This allows backward compatibility
                pass
        cleaned_input["channel"] = channel

        return cleaned_input

    @classmethod
    @traced_atomic_transaction()
    def perform_mutation(cls, _root, info: ResolveInfo, /, **data):
        input_data = data.copy()
        cleaned_input = cls.clean_input(info, input_data)

        email = cleaned_input["email"]
        user = cleaned_input.get("user")
        source = cleaned_input.get("source", "")
        channel = cleaned_input.get("channel")

        # Check if subscription already exists
        try:
            subscription = models.NewsletterSubscription.objects.get(email=email)
            
            # If already subscribed and active, return success (no email needed)
            if subscription.is_active:
                return cls(subscribed=True, already_subscribed=True, was_reactivated=False)
            
            # If exists but inactive, reactivate it (send welcome back email)
            subscription.is_active = True
            subscription.user = user  # Update user if authenticated
            subscription.unsubscribed_at = None
            subscription.source = source or subscription.source
            if channel:
                subscription.channel = channel
            subscription.save(update_fields=["is_active", "user", "unsubscribed_at", "source", "channel"])
            
            return cls(subscribed=True, already_subscribed=False, was_reactivated=True)
        except models.NewsletterSubscription.DoesNotExist:
            # Create new subscription (send welcome email)
            subscription = models.NewsletterSubscription.objects.create(
                email=email,
                user=user,
                is_active=True,
                source=source,
                channel=channel,
            )
            
            return cls(subscribed=True, already_subscribed=False, was_reactivated=False)

