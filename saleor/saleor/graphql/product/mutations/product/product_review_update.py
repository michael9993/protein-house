import graphene
from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils import timezone
from datetime import timedelta

from .....core.tracing import traced_atomic_transaction
from .....permission.enums import ProductPermissions
from .....product import models
from ....core import ResolveInfo
from ....core.doc_category import DOC_CATEGORY_PRODUCTS
from ....core.mutations import BaseMutation
from ....core.types import BaseInputObjectType, NonNullList, ProductError
from ....core.utils import from_global_id_or_error
from ...types import ProductReview


class ProductReviewUpdateInput(BaseInputObjectType):
    review_id = graphene.ID(required=True, description="ID of the review to update.")
    rating = graphene.Int(required=False, description="Rating from 1 to 5.")
    title = graphene.String(required=False, description="Review title.")
    body = graphene.String(required=False, description="Review body text.")
    images = NonNullList(
        graphene.String,
        required=False,
        description="List of image URLs for the review.",
    )

    class Meta:
        doc_category = DOC_CATEGORY_PRODUCTS


class ProductReviewUpdate(BaseMutation):
    review = graphene.Field(ProductReview, description="The updated product review.")

    class Arguments:
        input = ProductReviewUpdateInput(
            required=True, description="Fields required to update a product review."
        )

    class Meta:
        description = "Updates an existing product review. Staff with MANAGE_PRODUCTS permission can update any review."
        doc_category = DOC_CATEGORY_PRODUCTS
        permissions = (ProductPermissions.MANAGE_PRODUCTS,)
        error_type_class = ProductError
        error_type_field = "product_errors"

    @classmethod
    def clean_input(cls, info: ResolveInfo, data):
        """Validate and clean input data."""
        cleaned_input = data.copy()
        
        # Get user from context
        user = info.context.user
        if not user or not user.is_authenticated:
            raise ValidationError("You must be authenticated to update a review.")
        
        # Resolve review ID - this is required
        # Graphene automatically converts GraphQL camelCase (reviewId) to Python snake_case (review_id)
        review_id = cleaned_input.get("review_id")
        if not review_id:
            raise ValidationError({"reviewId": "Review ID is required."})
        
        try:
            _type, review_pk = from_global_id_or_error(
                review_id, only_type=ProductReview
            )
            review = models.ProductReview.objects.get(pk=review_pk)
            
            # Staff with MANAGE_PRODUCTS permission can update any review
            # Ownership check is handled by BaseMutation permissions
            # No time limit for staff updates
            
            cleaned_input["review"] = review
        except models.ProductReview.DoesNotExist:
            raise ValidationError({"review_id": "Review not found."})
        except Exception as e:
            raise ValidationError({"review_id": str(e)})
        
        # Validate rating if provided
        rating = cleaned_input.get("rating")
        if rating is not None and (rating < 1 or rating > 5):
            raise ValidationError({"rating": "Rating must be between 1 and 5."})
        
        return cleaned_input

    @classmethod
    @traced_atomic_transaction()
    def perform_mutation(cls, _root, info: ResolveInfo, /, **data):
        input_data = data.get("input", {})
        cleaned_input = cls.clean_input(info, input_data)
        
        review = cleaned_input["review"]
        
        # Update fields if provided
        if "rating" in cleaned_input:
            review.rating = cleaned_input["rating"]
        if "title" in cleaned_input:
            review.title = cleaned_input["title"]
        if "body" in cleaned_input:
            review.body = cleaned_input["body"]
        if "images" in cleaned_input:
            review.images = cleaned_input["images"]
        
        review.save()
        
        # Update product rating aggregation
        cls._update_product_rating(review.product)
        
        return cls(review=review)

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

