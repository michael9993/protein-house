import django_filters
import graphene
from django.db.models import Q

from ...core.doc_category import DOC_CATEGORY_PRODUCTS
from ...core.filters import FilterInputObjectType, MetadataFilterBase
from ...core.utils import from_global_id_or_error
from ....product import models
from ..types import Product


class ProductReviewFilter(MetadataFilterBase):
    search = django_filters.CharFilter(method="filter_search")
    product = django_filters.CharFilter(method="filter_product")
    rating = django_filters.NumberFilter()
    status = django_filters.CharFilter()

    class Meta:
        model = models.ProductReview
        fields = ["rating", "status"]

    def filter_product(self, queryset, name, value):
        try:
            _type, product_pk = from_global_id_or_error(value, only_type=Product)
            return queryset.filter(product_id=product_pk)
        except Exception:
            return queryset.none()

    def filter_search(self, queryset, name, value):
        if not value:
            return queryset
        return queryset.filter(
            Q(title__icontains=value)
            | Q(body__icontains=value)
            | Q(product__name__icontains=value)
        )


class ProductReviewFilterInput(FilterInputObjectType):
    class Meta:
        doc_category = DOC_CATEGORY_PRODUCTS
        filterset_class = ProductReviewFilter

