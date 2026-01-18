import graphene
from django.core.exceptions import ValidationError
from django.db import transaction

from .....core.tracing import traced_atomic_transaction
from .....product import models
from ....core import ResolveInfo
from ....core.doc_category import DOC_CATEGORY_PRODUCTS
from ....core.mutations import BaseMutation
from ....core.types import ProductError
from ....core.utils import from_global_id_or_error
from ...types import ProductReview


class ProductReviewMarkHelpful(BaseMutation):
    review = graphene.Field(ProductReview, description="The updated product review.")
    marked = graphene.Boolean(description="Whether the review was marked as helpful.")

    class Arguments:
        review_id = graphene.ID(required=True, description="ID of the review to mark as helpful.")

    class Meta:
        description = "Marks a product review as helpful."
        doc_category = DOC_CATEGORY_PRODUCTS
        error_type_class = ProductError
        error_type_field = "product_errors"
        # No permissions required - customers can mark reviews as helpful

    @classmethod
    @traced_atomic_transaction()
    def perform_mutation(cls, _root, info: ResolveInfo, /, **data):
        review_id = data.get("review_id")
        
        try:
            _type, review_pk = from_global_id_or_error(
                review_id, only_type=ProductReview
            )
            review = models.ProductReview.objects.get(pk=review_pk)
        except Exception as e:
            raise ValidationError({"review_id": str(e)})
        
        # Get user from context (safely check if user exists and is authenticated)
        user = None
        if hasattr(info.context, 'user') and info.context.user is not None:
            if hasattr(info.context.user, 'is_authenticated') and info.context.user.is_authenticated:
                user = info.context.user
        
        # Get guest identifier (IP address or session)
        guest_identifier = None
        if not user:
            # Try to get IP address from request
            request = info.context
            if hasattr(request, 'META'):
                x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
                if x_forwarded_for:
                    guest_identifier = x_forwarded_for.split(',')[0].strip()
                else:
                    guest_identifier = request.META.get('REMOTE_ADDR', '')
        
        # Check if user/guest has already voted
        from .....product.models import ProductReviewHelpfulVote
        
        vote_exists = False
        if user:
            vote_exists = ProductReviewHelpfulVote.objects.filter(
                review=review,
                user=user
            ).exists()
        elif guest_identifier:
            vote_exists = ProductReviewHelpfulVote.objects.filter(
                review=review,
                guest_identifier=guest_identifier
            ).exists()
        
        if vote_exists:
            raise ValidationError("You have already marked this review as helpful.")
        
        # Create the vote
        ProductReviewHelpfulVote.objects.create(
            review=review,
            user=user,
            guest_identifier=guest_identifier if not user else None,
        )
        
        # Increment helpful count
        review.helpful_count += 1
        review.save(update_fields=["helpful_count"])
        
        return cls(review=review, marked=True)

