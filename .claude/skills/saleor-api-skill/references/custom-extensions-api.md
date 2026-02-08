# Custom API Extensions Reference

This file documents all custom API additions built on top of standard Saleor for the Mansour Shoes E-Commerce Platform. **Keep this file updated** when adding or modifying custom API features.

Last updated: 2026-02-06

## Custom Permission

```python
# saleor/saleor/permission/enums.py
MANAGE_CONTACT_SUBMISSIONS = "account.manage_contact_submissions"
```

## Custom Django Models

Source: `saleor/saleor/account/models.py` (lines 456-568)

### NewsletterSubscription

```python
class NewsletterSubscription(models.Model):
    email = models.EmailField(unique=True, db_index=True)
    user = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL)
    channel = models.ForeignKey(Channel, null=True, blank=True, on_delete=models.SET_NULL)
    is_active = models.BooleanField(default=True)
    subscribed_at = models.DateTimeField(auto_now_add=True)
    unsubscribed_at = models.DateTimeField(null=True, blank=True)
    source = models.CharField(max_length=50, blank=True)  # homepage, checkout, registration, etc.
```

Indexes: email+is_active, user+is_active, channel+is_active

### ContactSubmission

```python
class ContactSubmission(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    channel = models.ForeignKey(Channel, on_delete=models.CASCADE)
    name = models.CharField(max_length=256)
    email = models.EmailField(db_index=True)
    subject = models.CharField(max_length=512)
    message = models.TextField()
    status = models.CharField(choices=ContactSubmissionStatus.choices, default="NEW")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    replied_at = models.DateTimeField(null=True, blank=True)
    replied_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL)
```

### ContactSubmissionStatus

```python
class ContactSubmissionStatus(models.TextChoices):
    NEW = "NEW"
    READ = "READ"
    REPLIED = "REPLIED"
    ARCHIVED = "ARCHIVED"
```

## Custom GraphQL Types

Source: `saleor/saleor/graphql/account/types.py` (lines 1095-1197)

### ContactSubmission

```graphql
type ContactSubmission implements Node {
  id: ID!
  channel: Channel!
  name: String!
  email: String!
  subject: String!
  message: String!
  status: ContactSubmissionStatusEnum!
  createdAt: DateTime!
  updatedAt: DateTime!
  repliedAt: DateTime
  repliedBy: User
}

type ContactSubmissionCountableConnection {
  edges: [ContactSubmissionCountableEdge!]!
  pageInfo: PageInfo!
  totalCount: Int
}
```

### NewsletterSubscription

```graphql
type NewsletterSubscription implements Node {
  id: ID!
  email: String!
  user: User
  channel: Channel
  isActive: Boolean!
  subscribedAt: DateTime!
  unsubscribedAt: DateTime
  source: String
}

type NewsletterSubscriptionCountableConnection {
  edges: [NewsletterSubscriptionCountableEdge!]!
  pageInfo: PageInfo!
  totalCount: Int
}
```

### NewsletterSubscriptionStatus

```graphql
type NewsletterSubscriptionStatus {
  isActive: Boolean!
  email: String!
}
```

### ContactSubmissionStatusEnum

Values: `NEW`, `READ`, `REPLIED`, `ARCHIVED`

## Custom Mutations

Source: `saleor/saleor/graphql/account/mutations/account/`

### contactSubmissionCreate (Public)

```graphql
mutation ContactSubmissionCreate($input: ContactSubmissionCreateInput!) {
  contactSubmissionCreate(input: $input) {
    contactSubmission {
      id
      name
      email
      subject
      message
      status
      createdAt
    }
    errors { field code message }
  }
}
```

Input: `channel` (slug), `name` (min 2 chars), `email`, `subject` (min 3 chars), `message` (min 10 chars)
Validation: email format, name length, subject length, message length, channel exists and is active
No permission required.

### contactSubmissionReply (MANAGE_CONTACT_SUBMISSIONS)

```graphql
mutation ContactSubmissionReply($id: ID!, $message: String!, $subject: String) {
  contactSubmissionReply(id: $id, message: $message, subject: $subject) {
    contactSubmission { id status repliedAt repliedBy { email } }
    errors { field code message }
  }
}
```

- Sends reply email via SMTP app integration (fallback to Django email backend)
- Updates status to REPLIED, records repliedBy and repliedAt
- Reply message minimum 10 characters
- Uses `traced_atomic_transaction` for consistency

### contactSubmissionUpdateStatus (MANAGE_CONTACT_SUBMISSIONS)

```graphql
mutation ContactSubmissionUpdateStatus($id: ID!, $status: ContactSubmissionStatusEnum!) {
  contactSubmissionUpdateStatus(id: $id, status: $status) {
    contactSubmission { id status }
    errors { field code message }
  }
}
```

### contactSubmissionDelete (MANAGE_CONTACT_SUBMISSIONS)

```graphql
mutation ContactSubmissionDelete($id: ID!) {
  contactSubmissionDelete(id: $id) {
    contactSubmission { id }
    errors { field code message }
  }
}
```

### contactSubmissionBulkDelete (MANAGE_CONTACT_SUBMISSIONS)

```graphql
mutation ContactSubmissionBulkDelete($ids: [ID!]!) {
  contactSubmissionBulkDelete(ids: $ids) {
    count
    errors { field code message }
  }
}
```

### newsletterSubscribe (Public)

```graphql
mutation NewsletterSubscribe($email: String!, $source: String, $channel: String, $isActive: Boolean) {
  newsletterSubscribe(email: $email, source: $source, channel: $channel, isActive: $isActive) {
    subscribed
    alreadySubscribed
    wasReactivated
    errors { field code message }
  }
}
```

- Creates new or updates existing subscription
- Handles reactivation of inactive subscriptions
- Links to authenticated user if available
- Triggers `NOTIFY_USER` webhook event
- Validates email format, channel (if provided)

### newsletterUnsubscribe (Public)

```graphql
mutation NewsletterUnsubscribe($email: String!) {
  newsletterUnsubscribe(email: $email) {
    unsubscribed
    errors { field code message }
  }
}
```

- Deactivates subscription, sets unsubscribedAt timestamp
- Idempotent: returns success even if email not found

## Custom Queries

Source: `saleor/saleor/graphql/account/schema.py`

### contact_submission

```graphql
query ContactSubmission($id: ID!) {
  contactSubmission(id: $id) {
    id channel { slug } name email subject message status
    createdAt updatedAt repliedAt repliedBy { email }
  }
}
```

Permission: `MANAGE_CONTACT_SUBMISSIONS`

### contact_submissions

```graphql
query ContactSubmissions($filter: ContactSubmissionFilterInput, $first: Int, $after: String) {
  contactSubmissions(filter: $filter, first: $first, after: $after) {
    edges {
      node { id name email subject status createdAt channel { slug } }
    }
    pageInfo { hasNextPage endCursor }
    totalCount
  }
}
```

Permission: `MANAGE_CONTACT_SUBMISSIONS`

### newsletter_subscription

```graphql
query NewsletterSubscription($id: ID!) {
  newsletterSubscription(id: $id) {
    id email user { email } channel { slug } isActive subscribedAt source
  }
}
```

Permission: `MANAGE_USERS`

### newsletter_subscriptions

```graphql
query NewsletterSubscriptions($filter: NewsletterSubscriptionFilterInput, $first: Int) {
  newsletterSubscriptions(filter: $filter, first: $first) {
    edges { node { id email isActive subscribedAt source channel { slug } } }
    totalCount
  }
}
```

Permission: `MANAGE_USERS`

### newsletter_subscription_status

```graphql
query NewsletterSubscriptionStatus($email: String!) {
  newsletterSubscriptionStatus(email: $email) {
    isActive
    email
  }
}
```

Authenticated user only — validates email matches the user's own email. No special permission needed.

## Custom Filters

Source: `saleor/saleor/graphql/account/filters.py` (lines 297-363)

### ContactSubmissionFilter

```graphql
input ContactSubmissionFilterInput {
  ids: [ID!]
  status: ContactSubmissionStatusEnum
  channel: String              # Channel slug
  createdAt: DateTimeRangeInput
  search: String               # Searches name, email, subject, message
}
```

### NewsletterSubscriptionFilter

```graphql
input NewsletterSubscriptionFilterInput {
  ids: [ID!]
  isActive: Boolean
  source: String
  channel: String              # Channel slug
  createdAt: DateTimeRangeInput
  search: String               # Searches email
}
```

## Custom Sorting

Source: `saleor/saleor/graphql/account/sorters.py`

### ContactSubmissionSortField

Values: `CREATED_AT`, `UPDATED_AT`, `STATUS`

### NewsletterSubscriptionSortField

Values: `CREATED_AT`, `UNSUBSCRIBED_AT`, `EMAIL`

## Custom Services

Source: `saleor/saleor/account/services/`

### ContactSubmissionEmailService

File: `saleor/saleor/account/services/contact_submission_email.py`

Methods:
- `get_store_email()` — retrieves default store email from SiteSettings
- `send_notification_email(submission)` — notifies store of new submission
- `send_auto_reply(submission)` — auto-reply to customer confirming receipt
- `send_reply(submission, reply_message, reply_subject)` — sends staff reply via SMTP app (endpoint: `/api/contact-submission-reply`) with fallback to Django email backend
- `_send_reply_direct()` — fallback using Django email backend

### SmtpConfigReader

File: `saleor/saleor/account/services/smtp_config_reader.py`

Methods:
- `get_smtp_app()` — finds active SMTP app
- `get_smtp_config()` — reads config from app metadata (private_metadata or metadata)
- `get_django_email_settings()` — converts SMTP app config to Django email settings

Config format: `{ "configurations": [...] }` with first active config used. Supports NONE, TLS, SSL encryption.

## Storefront GraphQL Operations

Source: `storefront/src/graphql/`

### Newsletter Operations
- `NewsletterSubscribe.graphql` — `mutation NewsletterSubscribe($email, $source, $channel, $isActive)`
- `NewsletterUnsubscribe.graphql` — `mutation NewsletterUnsubscribe($email)`
- `NewsletterSubscriptionStatus.graphql` — `query NewsletterSubscriptionStatus($email)`

### Stock Alert Operations
- `StockAlertSubscribe.graphql` — `mutation StockAlertSubscribe($input)`
- `StockAlertUnsubscribe.graphql` — `mutation StockAlertUnsubscribe($input)`

### Contact Form
- `ContactSubmissionCreate.graphql` — `mutation ContactSubmissionCreate($input)` with channel, name, email, subject, message

### Product Reviews
- `ProductReviews.graphql` — `query ProductReviews($productId, $first, $after, $filterByRating, $filterByVerified)`
- `CreateProductReview.graphql` — `mutation ProductReviewCreate($input)`
- `UpdateProductReview.graphql` — `mutation ProductReviewUpdate($input)`
- `DeleteProductReview.graphql` — `mutation ProductReviewDelete($id)`
- `MarkReviewHelpful.graphql` — `mutation MarkReviewHelpful($reviewId)`

### Invoicing
- `InvoiceRequest.graphql` — `mutation InvoiceRequest($orderId)`

## Source Files to Monitor

When any of these files change, update this reference document:

```
saleor/saleor/account/models.py              # Django models (lines 456-568)
saleor/saleor/graphql/account/types.py        # GraphQL types (lines 1095-1197)
saleor/saleor/graphql/account/schema.py       # Query/mutation registration
saleor/saleor/graphql/account/mutations/account/  # Custom mutation files:
  - contact_submission_create.py
  - contact_submission_reply.py
  - contact_submission_update_status.py
  - contact_submission_delete.py
  - contact_submission_bulk_delete.py
  - newsletter_subscribe.py
  - newsletter_unsubscribe.py
saleor/saleor/graphql/account/filters.py      # Custom filters (lines 297-363)
saleor/saleor/graphql/account/resolvers.py    # Custom resolvers (lines 267-359)
saleor/saleor/graphql/account/enums.py        # ContactSubmissionStatusEnum
saleor/saleor/account/services/               # Email services
saleor/saleor/permission/enums.py             # MANAGE_CONTACT_SUBMISSIONS
storefront/src/graphql/                        # All .graphql operation files
```