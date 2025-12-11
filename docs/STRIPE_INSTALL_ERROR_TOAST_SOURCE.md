# Where the "Couldn't Install Stripe" Error Toast Comes From

## Error Toast Location

The error toast message **"Couldn't Install Stripe - The auth data given during registration request could not be used to fetch app ID..."** is displayed in the Dashboard from the following code:

### 1. Installation Hook (`useInstallApp.ts`)

**File**: `dashboard/src/extensions/views/InstallCustomExtension/hooks/useInstallApp.ts`

**Lines 29-52**: The `useAppInstallMutation` hook handles the installation response:

```typescript
const [installApp, installAppOpts] = useAppInstallMutation({
  onCompleted: (data) => {
    const installationData = data?.appInstall?.appInstallation;

    if (data.appInstall?.errors.length === 0) {
      // Success handling...
    } else {
      // ERROR HANDLING - This is where the toast is shown
      (data?.appInstall?.errors ?? []).forEach((error) => {
        notify({
          status: "error",
          text: getAppInstallErrorMessage(error, intl),
        });
      });
    }
  },
});
```

**Line 47-50**: When there are errors, it calls `notify()` with the error message formatted by `getAppInstallErrorMessage()`.

### 2. Error Message Formatting (`utils.tsx`)

**File**: `dashboard/src/extensions/utils.tsx`

**Lines 55-71**: The `getAppInstallErrorMessage()` function formats the error:

```typescript
export function getAppInstallErrorMessage(
  err: AppErrorFragment,
  intl: IntlShape
): string | undefined {
  if (err) {
    const errorCode = err.code;
    const messageDescriptor = getAppErrorMessageDescriptor(errorCode);
    return intl.formatMessage(messageDescriptor, {
      errorCode,
      docsLink: "",
    });
  }
  return undefined;
}
```

### 3. Error Title (`messages.ts`)

**File**: `dashboard/src/extensions/messages.ts`

**Lines 158-162**: The error title "Couldn't Install {name}" is defined:

```typescript
extensionInstallError: {
  id: "TPJeJF",
  defaultMessage: "Couldn't Install {name}",
  description: "extensions list has not been installed",
},
```

## Where the Error Message Actually Comes From

The detailed error message **"The auth data given during registration request could not be used to fetch app ID. This usually means that App could not connect to Saleor during installation. Saleor URL that App tried to connect: http://localhost:8000/graphql/"** is **NOT** defined in the Dashboard code.

This error message is coming from:

1. **The Stripe App's `/api/register` endpoint** - When the Stripe app receives the installation request, it tries to connect to Saleor using the URL from the JWT token's `iss` field
2. **The Stripe app returns an error** if it can't connect
3. **Saleor API receives this error** and includes it in the GraphQL mutation response
4. **The Dashboard displays it** via the `notify()` function

## Error Flow

```
1. User clicks "Install" in Dashboard
   ↓
2. Dashboard calls GraphQL mutation: appInstall
   ↓
3. Saleor API calls Stripe app's /api/register endpoint
   ↓
4. Stripe app tries to connect to Saleor using JWT token's 'iss' URL
   ↓
5. Stripe app fails (because 'iss' is localhost:8000)
   ↓
6. Stripe app returns error to Saleor API
   ↓
7. Saleor API includes error in GraphQL response
   ↓
8. Dashboard's useAppInstallMutation.onCompleted() receives error
   ↓
9. Dashboard calls notify() with error message
   ↓
10. Toast appears: "Couldn't Install Stripe - [error message]"
```

## Fixing the Error

The error occurs because the JWT token has `localhost:8000` as the issuer. To fix it:

1. Set `PUBLIC_URL` environment variable in Saleor API to your tunnel URL
2. Recreate the API container
3. **Log out and log back into Dashboard** to get a new JWT token with the correct issuer
4. Try installing again

See `docs/JWT_TOKEN_ISSUER_FIX.md` for detailed instructions.

## Code References

- **Toast Display**: `dashboard/src/extensions/views/InstallCustomExtension/hooks/useInstallApp.ts:47-50`
- **Error Formatting**: `dashboard/src/extensions/utils.tsx:55-71`
- **Error Title**: `dashboard/src/extensions/messages.ts:158-162`
- **Installation Logic**: `saleor/saleor/app/installation_utils.py:215-310`
- **Token Sending**: `saleor/saleor/app/installation_utils.py:56-74`
