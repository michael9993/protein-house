"""Mutation to validate a signed recovery token and return the checkout."""

import graphene
from django.core.exceptions import ValidationError

from ....checkout.error_codes import CheckoutErrorCode
from ....checkout.models import Checkout
from ....checkout.notifications import validate_recovery_token
from ...core import ResolveInfo
from ...core.context import SyncWebhookControlContext
from ...core.doc_category import DOC_CATEGORY_CHECKOUT
from ...core.mutations import BaseMutation
from ...core.types import CheckoutError
from ..types import Checkout as CheckoutType


class CheckoutRecover(BaseMutation):
    checkout = graphene.Field(CheckoutType, description="The recovered checkout.")

    class Arguments:
        token = graphene.String(
            required=True,
            description="Signed recovery token from the abandoned cart email.",
        )

    class Meta:
        description = (
            "Validate a signed recovery token from an abandoned cart email "
            "and return the associated checkout. The token is validated for "
            "authenticity and expiry (7 days)."
        )
        doc_category = DOC_CATEGORY_CHECKOUT
        error_type_class = CheckoutError
        error_type_field = "checkout_errors"

    @classmethod
    def perform_mutation(cls, _root, info: ResolveInfo, /, *, token):
        checkout_id = validate_recovery_token(token)
        if checkout_id is None:
            raise ValidationError(
                {
                    "token": ValidationError(
                        "Invalid or expired recovery token.",
                        code=CheckoutErrorCode.INVALID.value,
                    )
                }
            )

        try:
            checkout = Checkout.objects.get(token=checkout_id)
        except Checkout.DoesNotExist:
            raise ValidationError(
                {
                    "token": ValidationError(
                        "Checkout not found.",
                        code=CheckoutErrorCode.NOT_FOUND.value,
                    )
                }
            )

        return CheckoutRecover(
            checkout=SyncWebhookControlContext(node=checkout)
        )
