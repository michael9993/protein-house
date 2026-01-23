import graphene
from django.core.exceptions import ValidationError

from ......account import models
from ......core.tracing import traced_atomic_transaction
from ......permission.enums import AccountPermissions
from .....core import ResolveInfo
from .....core.doc_category import DOC_CATEGORY_USERS
from .....core.mutations import BaseMutation
from .....core.types import AccountError, NonNullList
from .....core.dataloaders import get_database_connection_name
from ....types import ContactSubmission


class ContactSubmissionBulkDelete(BaseMutation):
    count = graphene.Int(required=True, description="Returns how many objects were affected.")
    contact_submissions = NonNullList(
        ContactSubmission, description="List of deleted contact submissions."
    )

    class Arguments:
        ids = NonNullList(
            graphene.ID, required=True, description="List of contact submission IDs to delete."
        )

    class Meta:
        description = "Deletes contact submissions."
        doc_category = DOC_CATEGORY_USERS
        error_type_class = AccountError
        error_type_field = "account_errors"
        permissions = (AccountPermissions.MANAGE_CONTACT_SUBMISSIONS,)

    @classmethod
    @traced_atomic_transaction()
    def perform_mutation(cls, _root, info: ResolveInfo, /, **data):
        ids = data.get("ids", [])

        if not ids:
            raise ValidationError({"ids": "At least one ID is required."})

        database_connection_name = get_database_connection_name(info.context)
        from .....core.utils import from_global_id_or_error

        submission_pks = []
        for submission_id in ids:
            _, submission_pk = from_global_id_or_error(
                submission_id, ContactSubmission, raise_error=True
            )
            submission_pks.append(submission_pk)

        submissions = list(
            models.ContactSubmission.objects.using(database_connection_name).filter(
                pk__in=submission_pks
            )
        )

        count = len(submissions)
        for submission in submissions:
            submission.delete()

        return cls(count=count, contact_submissions=submissions)
