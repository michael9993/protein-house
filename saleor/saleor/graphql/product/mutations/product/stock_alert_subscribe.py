import graphene
from django.core.exceptions import ValidationError
from django.db import transaction

from .....core.tracing import traced_atomic_transaction
from .....product import models
from ....core import ResolveInfo
from ....core.doc_category import DOC_CATEGORY_PRODUCTS
from ....core.mutations import BaseMutation
from ....core.types import BaseInputObjectType, ProductError
from ....core.utils import from_global_id_or_error
from ...types import ProductVariant


class StockAlertSubscribeInput(BaseInputObjectType):
    variant_id = graphene.ID(
        required=True, description="ID of the product variant to subscribe to."
    )
    email = graphene.String(
        required=True, description="Email address to notify when stock is available."
    )

    class Meta:
        doc_category = DOC_CATEGORY_PRODUCTS


class StockAlertSubscribe(BaseMutation):
    subscribed = graphene.Boolean(description="Whether the subscription was successful.")
    already_subscribed = graphene.Boolean(
        description="Whether the email was already subscribed for this variant."
    )

    class Arguments:
        input = StockAlertSubscribeInput(
            required=True, description="Fields required to subscribe to stock alerts."
        )

    class Meta:
        description = "Subscribe to stock alerts for a product variant."
        doc_category = DOC_CATEGORY_PRODUCTS
        error_type_class = ProductError
        error_type_field = "product_errors"
        # No permissions required - customers can subscribe to stock alerts

    @classmethod
    def clean_input(cls, info: ResolveInfo, data):
        """Validate and clean input data."""
        cleaned_input = data.copy()

        # Validate email
        email = cleaned_input.get("email", "").strip().lower()
        if not email or "@" not in email:
            raise ValidationError({"email": "Please provide a valid email address."})

        cleaned_input["email"] = email

        # Resolve variant ID
        variant_id = cleaned_input.get("variant_id")
        if variant_id:
            try:
                _type, variant_pk = from_global_id_or_error(
                    variant_id, only_type=ProductVariant
                )
                variant = models.ProductVariant.objects.get(pk=variant_pk)
                cleaned_input["product_variant"] = variant
            except Exception as e:
                raise ValidationError({"variant_id": str(e)})

        # Get user from context if authenticated
        user = info.context.user if info.context.user.is_authenticated else None
        cleaned_input["user"] = user

        return cleaned_input

    @classmethod
    @traced_atomic_transaction()
    def perform_mutation(cls, _root, info: ResolveInfo, /, **data):
        input_data = data.get("input", {})
        cleaned_input = cls.clean_input(info, input_data)

        variant = cleaned_input["product_variant"]
        email = cleaned_input["email"]
        user = cleaned_input.get("user")

        # Check if alert already exists
        try:
            alert = models.StockAlert.objects.get(
                product_variant=variant, email=email, is_active=True
            )
            return cls(subscribed=True, already_subscribed=True)
        except models.StockAlert.DoesNotExist:
            # Check if there's an inactive alert to reactivate
            try:
                alert = models.StockAlert.objects.get(
                    product_variant=variant, email=email, is_active=False
                )
                alert.is_active = True
                alert.user = user  # Update user if authenticated
                alert.notified_at = None
                alert.save(update_fields=["is_active", "user", "notified_at"])
                return cls(subscribed=True, already_subscribed=False)
            except models.StockAlert.DoesNotExist:
                # Create new alert
                alert = models.StockAlert.objects.create(
                    product_variant=variant,
                    user=user,
                    email=email,
                    is_active=True,
                )
                return cls(subscribed=True, already_subscribed=False)

