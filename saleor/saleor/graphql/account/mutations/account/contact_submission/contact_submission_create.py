import graphene
from django.core.exceptions import ValidationError
from django.db import transaction

from ......account import models
from ......channel.models import Channel
from ......core.tracing import traced_atomic_transaction
from .....core import ResolveInfo
from .....core.doc_category import DOC_CATEGORY_USERS
from .....core.mutations import BaseMutation
from .....core.types import AccountError
from .....core.dataloaders import get_database_connection_name
from ....types import ContactSubmission


class ContactSubmissionInput(graphene.InputObjectType):
    channel = graphene.String(
        required=True, description="Slug of the channel where the submission was made."
    )
    name = graphene.String(required=True, description="Customer name.")
    email = graphene.String(required=True, description="Customer email address.")
    subject = graphene.String(required=True, description="Message subject.")
    message = graphene.String(required=True, description="Message content.")


class ContactSubmissionCreate(BaseMutation):
    contact_submission = graphene.Field(
        ContactSubmission, description="Created contact submission."
    )

    class Arguments:
        input = ContactSubmissionInput(
            description="Fields required to create a contact submission.", required=True
        )

    class Meta:
        description = "Create a new contact form submission."
        doc_category = DOC_CATEGORY_USERS
        error_type_class = AccountError
        error_type_field = "account_errors"
        # No permissions required - public mutation

    @classmethod
    def clean_input(cls, info: ResolveInfo, data):
        """Validate and clean input data."""
        cleaned_input = data.copy()

        # Validate email
        email = cleaned_input.get("email", "").strip().lower()
        if not email or "@" not in email:
            raise ValidationError({"email": "Please provide a valid email address."})
        cleaned_input["email"] = email

        # Validate name
        name = cleaned_input.get("name", "").strip()
        if not name or len(name) < 2:
            raise ValidationError({"name": "Please provide a valid name."})
        cleaned_input["name"] = name

        # Validate subject
        subject = cleaned_input.get("subject", "").strip()
        if not subject or len(subject) < 3:
            raise ValidationError({"subject": "Please provide a valid subject."})
        cleaned_input["subject"] = subject

        # Validate message
        message = cleaned_input.get("message", "").strip()
        if not message or len(message) < 10:
            raise ValidationError(
                {"message": "Please provide a message with at least 10 characters."}
            )
        cleaned_input["message"] = message

        # Validate and get channel
        channel_slug = cleaned_input.get("channel", "").strip()
        if not channel_slug:
            raise ValidationError({"channel": "Channel is required."})

        database_connection_name = get_database_connection_name(info.context)
        try:
            channel = Channel.objects.using(database_connection_name).get(
                slug=channel_slug, is_active=True
            )
        except Channel.DoesNotExist:
            raise ValidationError(
                {"channel": f"Channel with slug '{channel_slug}' does not exist or is not active."}
            )
        cleaned_input["channel"] = channel

        return cleaned_input

    @classmethod
    @traced_atomic_transaction()
    def perform_mutation(cls, _root, info: ResolveInfo, /, **data):
        input_data = data.get("input", {})
        cleaned_input = cls.clean_input(info, input_data)

        # Create contact submission
        submission = models.ContactSubmission.objects.create(
            channel=cleaned_input["channel"],
            name=cleaned_input["name"],
            email=cleaned_input["email"],
            subject=cleaned_input["subject"],
            message=cleaned_input["message"],
            status=models.ContactSubmissionStatus.NEW,
        )

        return cls(contact_submission=submission)
