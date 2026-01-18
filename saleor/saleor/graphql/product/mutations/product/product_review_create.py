import graphene
from django.core.exceptions import ValidationError
from django.db import transaction

from .....core.tracing import traced_atomic_transaction
from .....product import models
from ....core import ResolveInfo
from ....core.doc_category import DOC_CATEGORY_PRODUCTS
from ....core.mutations import BaseMutation
from ....core.types import BaseInputObjectType, NonNullList, ProductError
from ....core.utils import from_global_id_or_error
from ....core.validators import validate_one_of_args_is_in_mutation
from ...types import Product, ProductReview


class ProductReviewInput(BaseInputObjectType):
    product_id = graphene.ID(required=True, description="ID of the product being reviewed.")
    rating = graphene.Int(required=True, description="Rating from 1 to 5.")
    title = graphene.String(required=True, description="Review title.")
    body = graphene.String(required=True, description="Review body text.")
    images = NonNullList(
        graphene.String,
        required=False,
        description="List of image URLs for the review.",
    )

    class Meta:
        doc_category = DOC_CATEGORY_PRODUCTS


class ProductReviewCreate(BaseMutation):
    review = graphene.Field(ProductReview, description="The created product review.")

    class Arguments:
        input = ProductReviewInput(
            required=True, description="Fields required to create a product review."
        )

    class Meta:
        description = "Creates a new product review. Requires authentication."
        doc_category = DOC_CATEGORY_PRODUCTS
        error_type_class = ProductError
        error_type_field = "product_errors"
        # Requires authentication - only authenticated users can review products

    @classmethod
    def clean_input(cls, info: ResolveInfo, data):
        """Validate and clean input data."""
        cleaned_input = data.copy()
        
        # Validate rating
        rating = cleaned_input.get("rating")
        if rating is None or rating < 1 or rating > 5:
            raise ValidationError({"rating": "Rating must be between 1 and 5."})
        
        # Resolve product ID
        product_id = cleaned_input.get("product_id")
        if product_id:
            try:
                _type, product_pk = from_global_id_or_error(
                    product_id, only_type=Product
                )
                cleaned_input["product"] = models.Product.objects.get(pk=product_pk)
            except Exception as e:
                raise ValidationError({"product_id": str(e)})
        
        # Require authentication - only authenticated users can create reviews
        user = info.context.user
        if not user or not user.is_authenticated:
            raise ValidationError("You must be authenticated to create a review.")
        
        cleaned_input["user"] = user
        
        # Check for duplicate reviews (prevent same user from reviewing same product within 30 days)
        from django.utils import timezone
        from datetime import timedelta
        
        time_limit = timedelta(days=30)
        cutoff_date = timezone.now() - time_limit
        
        existing_review = models.ProductReview.objects.filter(
            product=cleaned_input["product"],
            user=user,
            created_at__gte=cutoff_date,
        ).first()
        
        if existing_review:
            raise ValidationError(
                "You have already reviewed this product recently. "
                "Please wait 30 days before submitting another review."
            )
        
        # Check if user has purchased the product (for verified purchase badge)
        from .....order.models import OrderLine
        has_purchased = OrderLine.objects.filter(
            order__user=user,
            variant__product=cleaned_input["product"],
            order__status__in=["confirmed", "fulfilled", "partially_fulfilled"],
        ).exists()
        cleaned_input["is_verified_purchase"] = has_purchased
        
        # Set default status (pending for moderation, or approved if auto-approve)
        # For now, auto-approve. Can be made configurable later.
        cleaned_input["status"] = models.ProductReview.REVIEW_STATUS_APPROVED
        
        return cleaned_input

    @classmethod
    @traced_atomic_transaction()
    def perform_mutation(cls, _root, info: ResolveInfo, /, **data):
        input_data = data.get("input", {})
        cleaned_input = cls.clean_input(info, input_data)
        
        # Create the review
        review = models.ProductReview.objects.create(
            product=cleaned_input["product"],
            user=cleaned_input["user"],
            rating=cleaned_input["rating"],
            title=cleaned_input["title"],
            body=cleaned_input["body"],
            images=cleaned_input.get("images", []),
            status=cleaned_input["status"],
            is_verified_purchase=cleaned_input["is_verified_purchase"],
        )
        
        # Update product rating aggregation (can be optimized with signals later)
        cls._update_product_rating(review.product)
        
        return cls(review=review)

    @classmethod
    def _update_product_rating(cls, product: models.Product):
        """Update product's average rating and review count."""
        from django.db.models import Avg, Count
        
        reviews = models.ProductReview.objects.filter(
            product=product,
            status=models.ProductReview.REVIEW_STATUS_APPROVED,
        )
        
        rating_data = reviews.aggregate(
            avg_rating=Avg("rating"),
            review_count=Count("id"),
        )
        
        # Update rating (can be None if no reviews)
        product.rating = rating_data["avg_rating"] if rating_data["avg_rating"] is not None else None
        product.save(update_fields=["rating"])

