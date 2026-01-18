import graphene
from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils import timezone

from .....account import models
from .....core.tracing import traced_atomic_transaction
from ....core import ResolveInfo
from ....core.doc_category import DOC_CATEGORY_USERS
from ....core.mutations import BaseMutation
from ....core.types import AccountError


class NewsletterUnsubscribe(BaseMutation):
    unsubscribed = graphene.Boolean(description="Whether the unsubscription was successful.")

    class Arguments:
        email = graphene.String(
            required=True,
            description="Email address to unsubscribe from the newsletter.",
        )

    class Meta:
        description = "Unsubscribe an email address from the newsletter."
        doc_category = DOC_CATEGORY_USERS
        error_type_class = AccountError
        error_type_field = "account_errors"
        # No permissions required - anyone can unsubscribe

    @classmethod
    def clean_input(cls, info: ResolveInfo, data):
        """Validate and clean input data."""
        cleaned_input = data.copy()

        # Validate email
        email = cleaned_input.get("email", "").strip().lower()
        if not email or "@" not in email:
            raise ValidationError({"email": "Please provide a valid email address."})

        cleaned_input["email"] = email

        return cleaned_input

    @classmethod
    @traced_atomic_transaction()
    def perform_mutation(cls, _root, info: ResolveInfo, /, **data):
        input_data = data.copy()
        cleaned_input = cls.clean_input(info, input_data)

        email = cleaned_input["email"]

        # Find and deactivate subscription
        try:
            subscription = models.NewsletterSubscription.objects.get(email=email)
            
            if subscription.is_active:
                subscription.is_active = False
                subscription.unsubscribed_at = timezone.now()
                subscription.save(update_fields=["is_active", "unsubscribed_at"])
            
            return cls(unsubscribed=True)
        except models.NewsletterSubscription.DoesNotExist:
            # If doesn't exist, consider it already unsubscribed
            return cls(unsubscribed=True)

