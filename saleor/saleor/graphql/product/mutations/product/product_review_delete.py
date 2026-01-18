import graphene
from django.core.exceptions import ValidationError
from django.db import transaction

from .....core.tracing import traced_atomic_transaction
from .....permission.enums import ProductPermissions
from .....product import models
from ....core import ResolveInfo
from ....core.doc_category import DOC_CATEGORY_PRODUCTS
from ....core.mutations import BaseMutation
from ....core.types import ProductError
from ....core.utils import from_global_id_or_error
from ...types import ProductReview


class ProductReviewDelete(BaseMutation):
    review = graphene.Field(ProductReview, description="The deleted product review.")

    class Arguments:
        review_id = graphene.ID(required=True, description="ID of the review to delete.")

    class Meta:
        description = "Deletes a product review. Staff with MANAGE_PRODUCTS permission can delete any review."
        doc_category = DOC_CATEGORY_PRODUCTS
        permissions = (ProductPermissions.MANAGE_PRODUCTS,)
        error_type_class = ProductError
        error_type_field = "product_errors"

    @classmethod
    @traced_atomic_transaction()
    def perform_mutation(cls, _root, info: ResolveInfo, /, **data):
        review_id = data.get("review_id")
        
        # Get user from context
        user = info.context.user
        if not user or not user.is_authenticated:
            raise ValidationError("You must be authenticated to delete a review.")
        
        try:
            _type, review_pk = from_global_id_or_error(
                review_id, only_type=ProductReview
            )
            review = models.ProductReview.objects.get(pk=review_pk)
            
            # Staff with MANAGE_PRODUCTS permission can delete any review
            # Ownership check is handled by BaseMutation permissions
            
            product = review.product
            
            # Delete the review
            review.delete()
            
            # Update product rating aggregation
            cls._update_product_rating(product)
            
            return cls(review=review)
        except models.ProductReview.DoesNotExist:
            raise ValidationError({"review_id": "Review not found."})
        except Exception as e:
            raise ValidationError({"review_id": str(e)})

    @classmethod
    def _update_product_rating(cls, product: models.Product):
        """Update product's average rating."""
        from django.db.models import Avg
        
        reviews = models.ProductReview.objects.filter(
            product=product,
            status=models.ProductReview.REVIEW_STATUS_APPROVED,
        )
        
        rating_data = reviews.aggregate(avg_rating=Avg("rating"))
        product.rating = rating_data["avg_rating"] if rating_data["avg_rating"] is not None else None
        product.save(update_fields=["rating"])

