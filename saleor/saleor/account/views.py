"""
Custom views for account-related operations.
"""
import json
import logging
from urllib.parse import urlencode

from django.contrib.sites.models import Site
from django.core.exceptions import ObjectDoesNotExist, ValidationError
from django.http import JsonResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from ..account import models
from ..account.notifications import send_account_confirmation
from ..account.utils import RequestorAwareContext
from ..core.jwt import create_access_token, create_refresh_token
from ..core.tokens import token_generator
from ..core.utils.events import call_event
from ..core.utils.url import prepare_url, validate_storefront_url
from ..giftcard.utils import assign_user_gift_cards
from ..graphql.account.mutations.authentication.create_token import _get_new_csrf_token
from ..graphql.account.mutations.authentication.utils import update_user_last_login_if_required
from ..graphql.channel.utils import clean_channel
from ..graphql.plugins.dataloaders import get_plugin_manager_promise
from ..graphql.site.dataloaders import get_site_promise
from ..order.utils import match_orders_with_new_user

logger = logging.getLogger(__name__)


@csrf_exempt
@require_http_methods(["POST"])
def resend_confirmation_email_view(request):
    """
    Resend confirmation email without requiring authentication.
    This works the same way as the initial email sent during registration.
    """
    email = None  # Initialize email variable for exception handler
    try:
        # Parse JSON body
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse(
                {"error": "Invalid JSON"}, status=400
            )
        
        email = data.get("email", "").lower().strip()
        channel_slug = data.get("channel", "")
        redirect_url = data.get("redirect_url", "")
        
        if not email:
            return JsonResponse(
                {"error": "Email is required"}, status=400
            )
        
        if not channel_slug:
            return JsonResponse(
                {"error": "Channel is required"}, status=400
            )
        
        if not redirect_url:
            return JsonResponse(
                {"error": "Redirect URL is required"}, status=400
            )
        
        # Validate redirect URL
        try:
            validate_storefront_url(redirect_url)
        except ValidationError as e:
            return JsonResponse(
                {"error": f"Invalid redirect URL: {e.message}"}, status=400
            )
        
        # Get user by email
        try:
            user = models.User.objects.get(email=email)
        except models.User.DoesNotExist:
            # Don't reveal if user exists (security best practice)
            logger.warning(f"Resend confirmation email requested for non-existent email: {email}")
            return JsonResponse(
                {"message": "If an account exists with this email, a confirmation email has been sent."},
                status=200
            )
        
        # Check if user is already confirmed
        site = Site.objects.get_current()
        if user.is_confirmed:
            logger.info(f"Resend confirmation email requested for already confirmed user: {email}")
            return JsonResponse(
                {"error": "This account is already confirmed. Please sign in instead."},
                status=400
            )
        
        if not site.settings.enable_account_confirmation_by_email:
            logger.info(f"Resend confirmation email requested but confirmation is disabled: {email}")
            return JsonResponse(
                {"message": "Email confirmation is not required for this account."},
                status=200
            )
        
        # Check rate limiting (prevent spam)
        # Original logic: 30 seconds for recently registered users, 15 minutes for others
        # Additional limit: Maximum 2 requests per hour
        from django.conf import settings
        from datetime import timedelta
        # Note: json is already imported at the top of the file
        
        # ORIGINAL RATE LIMITING LOGIC (keep as-is)
        if user.last_confirm_email_request:
            delta = timezone.now() - user.last_confirm_email_request
            lock_time = getattr(settings, "CONFIRMATION_EMAIL_LOCK_TIME", timedelta(minutes=15))
            
            # Convert lock_time to seconds if it's a timedelta
            if isinstance(lock_time, timedelta):
                lock_seconds = lock_time.total_seconds()
            else:
                lock_seconds = lock_time
            
            # Allow resend if user was just registered (within 5 minutes)
            # This handles the case where user lands on verify-email page right after registration
            is_recently_registered = False
            if user.date_joined:
                registration_age = timezone.now() - user.date_joined
                if registration_age.total_seconds() < 300:  # 5 minutes
                    is_recently_registered = True
            
            # If recently registered, use a shorter lock time (30 seconds)
            # Otherwise use the full lock time
            effective_lock_time = 30 if is_recently_registered else lock_seconds
            
            if delta.total_seconds() < effective_lock_time:
                if is_recently_registered:
                    return JsonResponse(
                        {"error": "A confirmation email was just sent. Please check your inbox and spam folder. You can request another email in a few moments."},
                        status=429
                    )
                return JsonResponse(
                    {"error": "Please wait before requesting another confirmation email."},
                    status=429
                )
        
        # ADDITIONAL LIMIT: Maximum 2 requests per hour (on top of the above)
        # Track requests in a 1-hour sliding window using metadata
        request_metadata_key = "confirm_email_requests"
        user_metadata = user.metadata or {}
        request_data_raw = user_metadata.get(request_metadata_key)
        
        # Parse the stored JSON string
        request_data = None
        if request_data_raw:
            try:
                if isinstance(request_data_raw, str):
                    request_data = json.loads(request_data_raw)
                elif isinstance(request_data_raw, dict):
                    request_data = request_data_raw
            except (json.JSONDecodeError, ValueError, TypeError):
                request_data = None
        
        now = timezone.now()
        hour_ago = now - timedelta(hours=1)
        
        if request_data:
            try:
                window_start_str = request_data.get("window_start", "")
                if window_start_str:
                    window_start_str = window_start_str.replace('Z', '+00:00')
                    window_start = timezone.datetime.fromisoformat(window_start_str)
                else:
                    window_start = None
                count = int(request_data.get("count", 0))
            except (ValueError, AttributeError, TypeError):
                window_start = None
                count = 0
        else:
            window_start = None
            count = 0
        
        # If window has expired (more than 1 hour since first request), reset
        if window_start and window_start < hour_ago:
            window_start = None
            count = 0
        
        # Check if user has exceeded the limit (2 requests per hour)
        if count >= 2:
            # Calculate time until next request is allowed
            if window_start:
                next_allowed = window_start + timedelta(hours=1)
                time_remaining = (next_allowed - now).total_seconds()
                minutes_remaining = int(time_remaining / 60) + 1
                
                return JsonResponse(
                    {
                        "error": f"You have reached the limit of 2 confirmation emails per hour. Please try again in {minutes_remaining} minute(s)."
                    },
                    status=429
                )
        
        # Update request tracking for the 2-per-hour limit
        if not window_start:
            window_start = now
            count = 1
        else:
            count += 1
        
        # Store in metadata (we'll save this after sending the email)
        request_tracking = {
            "window_start": window_start.isoformat(),
            "count": count
        }
        
        # Clean channel
        try:
            channel = clean_channel(
                channel_slug,
                error_class=None,
                allow_replica=True,
            )
        except Exception as e:
            return JsonResponse(
                {"error": f"Invalid channel: {str(e)}"}, status=400
            )
        
        # Create context (similar to how finish_creating_user does it)
        # For a simple request without user/app, create minimal context
        context_data = {
            "allow_replica": True,
            "user_pk": None,
            "app_pk": None,
        }
        context = RequestorAwareContext.from_context_data(context_data)
        
        # Get manager and site
        manager = get_plugin_manager_promise(context).get()
        site = get_site_promise(context).get()
        
        # Generate token and send email (same as finish_creating_user task)
        try:
            token = token_generator.make_token(user)
            send_account_confirmation(
                user=user,
                redirect_url=redirect_url,
                channel_slug=channel.slug,
                manager=manager,
                token=token,
            )
        except Exception as email_error:
            logger.error(
                f"Error sending confirmation email for user {user.id} ({email}): {str(email_error)}",
                exc_info=True
            )
            return JsonResponse(
                {
                    "error": f"Failed to send confirmation email: {str(email_error)}"
                },
                status=500
            )
        
        # Update last request time and store request tracking in metadata
        try:
            user.last_confirm_email_request = timezone.now()
            # Store request tracking in metadata using the model's method
            # JSONField can store dict directly, but we'll store as JSON string for consistency
            user.store_value_in_metadata({request_metadata_key: json.dumps(request_tracking)})
            user.save(update_fields=["last_confirm_email_request", "updated_at", "metadata"])
        except Exception as save_error:
            logger.error(
                f"Error saving user metadata for user {user.id} ({email}): {str(save_error)}",
                exc_info=True
            )
            # Don't fail the request if metadata save fails - email was sent successfully
            # Just save the last_confirm_email_request without metadata
            try:
                user.save(update_fields=["last_confirm_email_request", "updated_at"])
            except Exception:
                pass
        
        # Prepare redirect URL with token (same as finish_creating_user)
        if redirect_url:
            params = urlencode({"email": user.email, "token": token})
            final_redirect_url = prepare_url(params, redirect_url)
        else:
            final_redirect_url = None
        
        # Call webhook event (same as finish_creating_user)
        call_event(
            manager.account_confirmation_requested,
            user,
            channel.slug,
            token,
            final_redirect_url,
        )
        
        logger.info(f"Confirmation email resent successfully for: {email}")
        return JsonResponse(
            {"message": "Confirmation email has been sent."},
            status=200
        )
        
    except Exception as e:
        # Get email safely (might not be defined if error occurs early)
        email_for_log = email if email is not None else "unknown"
        logger.error(
            f"Error resending confirmation email for {email_for_log}: {str(e)}",
            exc_info=True
        )
        # Provide more specific error message
        error_message = "An error occurred while sending the confirmation email."
        error_str = str(e).lower()
        if "metadata" in error_str:
            error_message = "An error occurred while processing your request. Please try again."
        elif "channel" in error_str:
            error_message = "Invalid channel configuration. Please contact support."
        elif "email" in error_str or "smtp" in error_str or "mail" in error_str:
            error_message = "Failed to send email. Please check your email configuration or try again later."
        elif "unboundlocalerror" in error_str:
            error_message = "An internal error occurred. Please try again."
        
        return JsonResponse(
            {"error": error_message},
            status=500
        )


@csrf_exempt
@require_http_methods(["POST"])
def confirm_and_login_view(request):
    """
    Confirm account and return login tokens.
    This allows automatic login after email confirmation without requiring password.
    """
    try:
        # Parse JSON body
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse(
                {"error": "Invalid JSON"}, status=400
            )
        
        email = data.get("email", "").lower().strip()
        token = data.get("token", "").strip()
        
        if not email:
            return JsonResponse(
                {"error": "Email is required"}, status=400
            )
        
        if not token:
            return JsonResponse(
                {"error": "Token is required"}, status=400
            )
        
        # Get user by email
        error = False
        try:
            user = models.User.objects.get(email=email)
        except ObjectDoesNotExist:
            # Don't reveal if user exists (security best practice)
            error = True
            user = models.User()
        
        # Verify token
        valid_token = token_generator.check_token(user, token)
        if not valid_token or error:
            logger.warning(f"Invalid confirmation token for email: {email}")
            return JsonResponse(
                {"error": "Invalid or expired confirmation token."},
                status=400
            )
        
        # Check if already confirmed
        was_already_confirmed = user.is_confirmed
        
        if not was_already_confirmed:
            # Confirm the account (same logic as ConfirmAccount mutation)
            user.is_active = True
            user.is_confirmed = True
            user.save(update_fields=["is_active", "is_confirmed", "updated_at"])
            
            # Match orders and assign gift cards (same as ConfirmAccount mutation)
            match_orders_with_new_user(user)
            assign_user_gift_cards(user)
            
            # Trigger webhook event
            context_data = {
                "allow_replica": True,
                "user_pk": user.pk,
                "app_pk": None,
            }
            context = RequestorAwareContext.from_context_data(context_data)
            manager = get_plugin_manager_promise(context).get()
            call_event(manager.account_confirmed, user)
        
        # Generate JWT tokens (same as CreateToken mutation)
        csrf_token = _get_new_csrf_token()
        access_token = create_access_token(user)
        refresh_token = create_refresh_token(
            user, additional_payload={"csrfToken": csrf_token}
        )
        
        # Update last login
        update_user_last_login_if_required(user)
        
        logger.info(f"Account confirmed and tokens generated for: {email}")
        return JsonResponse(
            {
                "success": True,
                "message": "Account confirmed successfully." if not was_already_confirmed else "Account already confirmed. Logging you in.",
                "token": access_token,
                "refresh_token": refresh_token,
                "csrf_token": csrf_token,
                "user": {
                    "id": str(user.id),
                    "email": user.email,
                    "firstName": user.first_name,
                    "lastName": user.last_name,
                },
            },
            status=200
        )
        
    except Exception as e:
        logger.error(f"Error confirming account and generating tokens: {str(e)}", exc_info=True)
        return JsonResponse(
            {"error": "An error occurred while confirming your account."},
            status=500
        )

