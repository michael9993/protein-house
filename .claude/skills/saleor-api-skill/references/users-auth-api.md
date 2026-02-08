# Users & Authentication API Reference

Source: https://docs.saleor.io/developer/users/ + /api-reference/authentication/ + /api-reference/users/

## Key Types

### User

```graphql
type User implements Node, ObjectWithMetadata {
  id: ID!
  privateMetadata: [MetadataItem!]!
  metadata: [MetadataItem!]!
  email: String!
  firstName: String!
  lastName: String!
  isStaff: Boolean!
  isActive: Boolean!
  isConfirmed: Boolean!
  addresses: [Address!]!
  defaultShippingAddress: Address
  defaultBillingAddress: Address
  note: String
  dateJoined: DateTime!
  lastLogin: DateTime
  languageCode: LanguageCodeEnum!
  avatar(size: Int, format: ThumbnailFormatEnum = ORIGINAL): Image
  orders(before: String, after: String, first: Int, last: Int): OrderCountableConnection
  giftCards(before: String, after: String, first: Int, last: Int): GiftCardCountableConnection
  checkouts(before: String, after: String, first: Int, last: Int): CheckoutCountableConnection
  userPermissions: [UserPermission!]
  permissionGroups: [Group!]
  editableGroups: [Group!]
  storedPaymentSources(channel: String): [PaymentSource!]
  externalReference: String
}
```

### Address

```graphql
type Address implements Node {
  id: ID!
  firstName: String!
  lastName: String!
  companyName: String!
  streetAddress1: String!
  streetAddress2: String!
  city: String!
  cityArea: String!
  postalCode: String!
  country: CountryDisplay!
  countryArea: String!
  phone: String
  isDefaultShippingAddress: Boolean
  isDefaultBillingAddress: Boolean
}
```

### AddressInput

```graphql
input AddressInput {
  firstName: String
  lastName: String
  companyName: String
  streetAddress1: String
  streetAddress2: String
  city: String
  cityArea: String
  postalCode: String
  country: CountryCode
  countryArea: String
  phone: String
  metadata: [MetadataInput!]
}
```

## Authentication Mutations

### tokenCreate

```graphql
tokenCreate(
  email: String!
  password: String!
  audience: String         # Custom audience prefix with "custom:"
): CreateToken
```

Returns JWT access token and refresh token.

```graphql
mutation {
  tokenCreate(email: "user@example.com", password: "password123") {
    token          # JWT access token
    refreshToken   # Refresh token for renewal
    csrfToken      # CSRF token
    user { id email firstName lastName }
    errors { field code message }
  }
}
```

### tokenRefresh

```graphql
tokenRefresh(
  refreshToken: String
  csrfToken: String
): RefreshToken
```

### tokenVerify

```graphql
tokenVerify(token: String!): VerifyToken
```

Returns `isValid: Boolean`, `user: User`, `payload` with permissions.

### tokensDeactivateAll

```graphql
tokensDeactivateAll: DeactivateAllUserTokens
```

Deactivates all tokens for the current user. Requires authentication.

### externalAuthenticationUrl

```graphql
externalAuthenticationUrl(
  pluginId: String!
  input: JSONString!
): ExternalAuthenticationUrl
```

Returns `authenticationData: JSONString` with OAuth redirect URL.

### externalObtainAccessTokens

```graphql
externalObtainAccessTokens(
  pluginId: String!
  input: JSONString!
): ExternalObtainAccessTokens
```

Exchanges external auth code for Saleor tokens.

## User Account Mutations (Customer Self-Service)

### accountRegister

```graphql
accountRegister(input: AccountRegisterInput!): AccountRegister
```

No permission required (public).

Input: `email` (required), `password` (required), `firstName`, `lastName`, `redirectUrl` (for email confirmation), `channel`, `languageCode`, `metadata`

### accountUpdate

```graphql
accountUpdate(input: AccountInput!): AccountUpdate
```

Requires authentication. Updates the current user's profile.

Input: `firstName`, `lastName`, `languageCode`, `defaultBillingAddress`, `defaultShippingAddress`, `metadata`

### accountRequestDeletion

```graphql
accountRequestDeletion(
  channel: String
  redirectUrl: String!
): AccountRequestDeletion
```

Sends deletion confirmation email.

### accountAddressCreate

```graphql
accountAddressCreate(
  input: AddressInput!
  type: AddressTypeEnum    # BILLING, SHIPPING
): AccountAddressCreate
```

### accountAddressUpdate

```graphql
accountAddressUpdate(id: ID!, input: AddressInput!): AccountAddressUpdate
```

### accountAddressDelete

```graphql
accountAddressDelete(id: ID!): AccountAddressDelete
```

### accountSetDefaultAddress

```graphql
accountSetDefaultAddress(id: ID!, type: AddressTypeEnum!): AccountSetDefaultAddress
```

### requestEmailChange

```graphql
requestEmailChange(
  channel: String
  newEmail: String!
  password: String!
  redirectUrl: String!
): RequestEmailChange
```

### confirmEmailChange

```graphql
confirmEmailChange(channel: String, token: String!): ConfirmEmailChange
```

### requestPasswordReset

```graphql
requestPasswordReset(
  channel: String
  email: String!
  redirectUrl: String!
): RequestPasswordReset
```

### setPassword

```graphql
setPassword(email: String!, password: String!, token: String!): SetPassword
```

## Staff Mutations (Admin)

### staffCreate

```graphql
staffCreate(input: StaffCreateInput!): StaffCreate
```

Permission: `MANAGE_STAFF`

Input: `email`, `firstName`, `lastName`, `isActive`, `note`, `addGroups` (permission group IDs), `redirectUrl`

### staffUpdate

```graphql
staffUpdate(id: ID!, input: StaffUpdateInput!): StaffUpdate
```

Permission: `MANAGE_STAFF`

### permissionGroupCreate

```graphql
permissionGroupCreate(input: PermissionGroupCreateInput!): PermissionGroupCreate
```

Permission: `MANAGE_STAFF`

Input: `name`, `addPermissions` (list of PermissionEnum), `addUsers`, `addChannels`, `restrictedAccessToChannels`

### permissionGroupUpdate

```graphql
permissionGroupUpdate(id: ID!, input: PermissionGroupUpdateInput!): PermissionGroupUpdate
```

Permission: `MANAGE_STAFF`

## Queries

### me

```graphql
me: User
```

Returns current authenticated user with effective permissions (including SSO/RBAC dynamic permissions).

### user

```graphql
user(id: ID, email: String, externalReference: String): User
```

Permission: `MANAGE_USERS` or `MANAGE_STAFF`

Returns only database-stored permissions (not dynamic).

### customers

```graphql
customers(
  filter: CustomerFilterInput
  sortBy: UserSortingInput
  before: String, after: String, first: Int, last: Int
): UserCountableConnection
```

Permission: `MANAGE_USERS` or `MANAGE_STAFF`

### staffUsers

```graphql
staffUsers(
  filter: StaffUserInput
  sortBy: UserSortingInput
  before: String, after: String, first: Int, last: Int
): UserCountableConnection
```

Permission: `MANAGE_STAFF`

### permissionGroups

```graphql
permissionGroups(
  filter: PermissionGroupFilterInput
  sortBy: PermissionGroupSortingInput
  before: String, after: String, first: Int, last: Int
): GroupCountableConnection
```

Permission: `MANAGE_STAFF`

## Permissions Reference

| Permission | Scope |
|-----------|-------|
| `MANAGE_USERS` | Customer accounts and information |
| `MANAGE_STAFF` | Staff accounts and permission groups |
| `MANAGE_PRODUCTS` | Products, variants, categories, collections, warehouses |
| `MANAGE_ORDERS` | Orders, fulfillments, returns |
| `HANDLE_PAYMENTS` | Transactions, payments, refunds |
| `MANAGE_CHECKOUTS` | Checkout access and operations |
| `MANAGE_DISCOUNTS` | Vouchers, promotions, sales |
| `MANAGE_CHANNELS` | Channel CRUD |
| `MANAGE_APPS` | App management and installation |
| `MANAGE_GIFT_CARD` | Gift card operations |
| `MANAGE_MENUS` | Navigation menus |
| `MANAGE_PAGES` | CMS pages |
| `MANAGE_PAGE_TYPES_AND_ATTRIBUTES` | Page types and attributes |
| `MANAGE_PRODUCT_TYPES_AND_ATTRIBUTES` | Product types and attributes |
| `MANAGE_SHIPPING` | Shipping zones and methods |
| `MANAGE_TRANSLATIONS` | Content translations |
| `MANAGE_SETTINGS` | Store settings |
| `MANAGE_TAXES` | Tax configuration |
| `MANAGE_PLUGINS` | Plugin configuration |
| `MANAGE_OBSERVABILITY` | Observability and logging |
| `MANAGE_CONTACT_SUBMISSIONS` | Custom: contact form submissions |

### Channel-Level Permissions

Groups can restrict access to specific channels:

```graphql
mutation {
  permissionGroupCreate(input: {
    name: "US Store Managers"
    addPermissions: [MANAGE_ORDERS, MANAGE_PRODUCTS]
    restrictedAccessToChannels: true
    addChannels: ["Q2hhbm5lbDox"]
  }) {
    group { id name }
  }
}
```

If a user belongs to at least one group without channel restrictions, they have access to all channels.

## JWT Token Structure

Access tokens encode user permissions using RS256. Token payload includes a `permissions` array. Generate a new token when permissions change.