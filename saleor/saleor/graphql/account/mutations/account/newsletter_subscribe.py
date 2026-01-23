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


class NewsletterSubscribe(BaseMutation):
    subscribed = graphene.Boolean(description="Whether the subscription was successful.")
    already_subscribed = graphene.Boolean(description="Whether the email was already subscribed.")

    class Arguments:
        email = graphene.String(
            required=True,
            description="Email address to subscribe to the newsletter.",
        )
        source = graphene.String(
            required=False,
            description="Source of the subscription (e.g., 'homepage', 'checkout').",
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

        return cleaned_input

    @classmethod
    @traced_atomic_transaction()
    def perform_mutation(cls, _root, info: ResolveInfo, /, **data):
        input_data = data.copy()
        cleaned_input = cls.clean_input(info, input_data)

        email = cleaned_input["email"]
        user = cleaned_input.get("user")
        source = cleaned_input.get("source", "")

        # Check if subscription already exists
        try:
            subscription = models.NewsletterSubscription.objects.get(email=email)
            
            # If already subscribed and active, return success
            if subscription.is_active:
                return cls(subscribed=True, already_subscribed=True)
            
            # If exists but inactive, reactivate it
            subscription.is_active = True
            subscription.user = user  # Update user if authenticated
            subscription.unsubscribed_at = None
            subscription.source = source or subscription.source
            subscription.save(update_fields=["is_active", "user", "unsubscribed_at", "source"])
            
            return cls(subscribed=True, already_subscribed=False)
        except models.NewsletterSubscription.DoesNotExist:
            # Create new subscription
            subscription = models.NewsletterSubscription.objects.create(
                email=email,
                user=user,
                is_active=True,
                source=source,
            )
            
            return cls(subscribed=True, already_subscribed=False)

