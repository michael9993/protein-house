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


class StockAlertUnsubscribeInput(BaseInputObjectType):
    variant_id = graphene.ID(
        required=True, description="ID of the product variant to unsubscribe from."
    )
    email = graphene.String(
        required=True, description="Email address that was subscribed."
    )

    class Meta:
        doc_category = DOC_CATEGORY_PRODUCTS


class StockAlertUnsubscribe(BaseMutation):
    unsubscribed = graphene.Boolean(description="Whether the unsubscription was successful.")

    class Arguments:
        input = StockAlertUnsubscribeInput(
            required=True, description="Fields required to unsubscribe from stock alerts."
        )

    class Meta:
        description = "Unsubscribe from stock alerts for a product variant."
        doc_category = DOC_CATEGORY_PRODUCTS
        error_type_class = ProductError
        error_type_field = "product_errors"
        # No permissions required - customers can unsubscribe

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

        return cleaned_input

    @classmethod
    @traced_atomic_transaction()
    def perform_mutation(cls, _root, info: ResolveInfo, /, **data):
        input_data = data.get("input", {})
        cleaned_input = cls.clean_input(info, input_data)

        variant = cleaned_input["product_variant"]
        email = cleaned_input["email"]

        # Find and deactivate alert
        try:
            alert = models.StockAlert.objects.get(
                product_variant=variant, email=email, is_active=True
            )
            alert.is_active = False
            alert.save(update_fields=["is_active"])
            return cls(unsubscribed=True)
        except models.StockAlert.DoesNotExist:
            # If doesn't exist, consider it already unsubscribed
            return cls(unsubscribed=True)

