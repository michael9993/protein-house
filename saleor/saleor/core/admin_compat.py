"""
Compatibility shim for Django Admin (DEBUG only).

Saleor replaced django.contrib.auth with its own models. Django admin's
import chain (middleware → views → forms → models) expects auth to be
fully installed. We pre-empt these modules in sys.modules with minimal
fakes that point to Saleor's models.
"""
import sys
import types

from django import forms
from django.utils.functional import SimpleLazyObject

from saleor.account.models import Group, User
from saleor.permission.models import Permission, PermissionsMixin

# ── 1. Fake django.contrib.auth.models ──────────────────────────────────


class AnonymousUser:
    id = None
    pk = None
    username = ""
    is_staff = False
    is_active = False
    is_superuser = False

    def __str__(self):
        return "AnonymousUser"

    def has_perm(self, perm, obj=None):
        return False

    def has_perms(self, perm_list, obj=None):
        return False

    def has_module_perms(self, module):
        return False

    def get_username(self):
        return ""

    @property
    def is_anonymous(self):
        return True

    @property
    def is_authenticated(self):
        return False


_models = types.ModuleType("django.contrib.auth.models")
_models.__package__ = "django.contrib.auth"
_models.Permission = Permission  # type: ignore[attr-defined]
_models.Group = Group  # type: ignore[attr-defined]
_models.PermissionsMixin = PermissionsMixin  # type: ignore[attr-defined]
_models.User = User  # type: ignore[attr-defined]
_models.AnonymousUser = AnonymousUser  # type: ignore[attr-defined]
sys.modules["django.contrib.auth.models"] = _models

# ── 2. Fake django.contrib.auth.forms ───────────────────────────────────


class AuthenticationForm(forms.Form):
    """Minimal admin login form that works with email-based User."""

    username = forms.EmailField(label="Email")
    password = forms.CharField(widget=forms.PasswordInput)

    error_messages = {
        "invalid_login": "Please enter a correct email and password.",
        "inactive": "This account is inactive.",
    }

    def __init__(self, request=None, *args, **kwargs):
        self.request = request
        self.user_cache = None
        super().__init__(*args, **kwargs)

    def clean(self):
        from django.contrib.auth import authenticate

        email = self.cleaned_data.get("username")
        password = self.cleaned_data.get("password")
        if email and password:
            self.user_cache = authenticate(
                self.request, username=email, password=password
            )
            if self.user_cache is None:
                raise forms.ValidationError("Invalid email or password.")
        return self.cleaned_data

    def get_user(self):
        return self.user_cache


_Stub = type("_Stub", (), {})
_forms = types.ModuleType("django.contrib.auth.forms")
_forms.__package__ = "django.contrib.auth"
_forms.AuthenticationForm = AuthenticationForm  # type: ignore[attr-defined]
_forms.PasswordChangeForm = _Stub  # type: ignore[attr-defined]
_forms.PasswordResetForm = _Stub  # type: ignore[attr-defined]
_forms.SetPasswordForm = _Stub  # type: ignore[attr-defined]
_forms.AdminPasswordChangeForm = _Stub  # type: ignore[attr-defined]
_forms.UserChangeForm = _Stub  # type: ignore[attr-defined]
_forms.UserCreationForm = _Stub  # type: ignore[attr-defined]
sys.modules["django.contrib.auth.forms"] = _forms

# ── 3. Fake django.contrib.auth.views ───────────────────────────────────


def redirect_to_login(next, login_url=None, redirect_field_name="next"):
    from django.http import HttpResponseRedirect
    from urllib.parse import urlencode

    url = login_url or "/admin/login/"
    return HttpResponseRedirect(f"{url}?{urlencode({redirect_field_name: next})}")


class LoginView:
    """Minimal LoginView for Django Admin login (called via .as_view())."""

    def __init__(self, **kwargs):
        for k, v in kwargs.items():
            setattr(self, k, v)

    @classmethod
    def as_view(cls, **initkwargs):
        def view(request):
            self = cls(**initkwargs)
            self.request = request
            if request.method == "POST":
                return self.post(request)
            return self.get(request)
        return view

    def _get_form_class(self):
        return getattr(self, "authentication_form", None) or AuthenticationForm

    def _get_next(self, request):
        return request.POST.get("next") or request.GET.get("next") or "/admin/"

    def _context(self, request, form):
        ctx = {"form": form, "next": self._get_next(request)}
        ctx.update(getattr(self, "extra_context", None) or {})
        return ctx

    def get(self, request):
        from django.shortcuts import render
        form = self._get_form_class()(request=request)
        tpl = getattr(self, "template_name", "admin/login.html")
        return render(request, tpl, self._context(request, form))

    def post(self, request):
        from django.shortcuts import render
        from django.http import HttpResponseRedirect
        from django.contrib.auth import login as auth_login

        FormClass = self._get_form_class()
        form = FormClass(request=request, data=request.POST)
        if form.is_valid():
            auth_login(request, form.get_user())
            return HttpResponseRedirect(self._get_next(request))
        tpl = getattr(self, "template_name", "admin/login.html")
        return render(request, tpl, self._context(request, form))


class SuccessURLAllowedHostsMixin:
    success_url_allowed_hosts = set()


_views = types.ModuleType("django.contrib.auth.views")
_views.__package__ = "django.contrib.auth"
_views.redirect_to_login = redirect_to_login  # type: ignore[attr-defined]
_views.LoginView = LoginView  # type: ignore[attr-defined]
_views.SuccessURLAllowedHostsMixin = SuccessURLAllowedHostsMixin  # type: ignore[attr-defined]
sys.modules["django.contrib.auth.views"] = _views

# ── 4. Fake django.contrib.auth.middleware ──────────────────────────────


class AuthenticationMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        from django.contrib.auth import get_user as _get_user

        request.user = SimpleLazyObject(lambda: _get_user(request))
        return self.get_response(request)


_middleware = types.ModuleType("django.contrib.auth.middleware")
_middleware.__package__ = "django.contrib.auth"
_middleware.AuthenticationMiddleware = AuthenticationMiddleware  # type: ignore[attr-defined]
sys.modules["django.contrib.auth.middleware"] = _middleware
