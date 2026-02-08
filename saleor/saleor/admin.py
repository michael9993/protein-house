"""Django Admin model registrations (DEBUG only).

Auto-registers all Saleor models for browsing via /admin/.
No custom ModelAdmin classes — just basic list views.
"""
from django.contrib import admin
from django.apps import apps

# Models already registered by Django or not useful in admin
SKIP_MODELS = {"ContentType", "Session", "LogEntry"}

for model in apps.get_models():
    if model.__name__ in SKIP_MODELS:
        continue
    if not admin.site.is_registered(model):
        try:
            admin.site.register(model)
        except admin.sites.AlreadyRegistered:
            pass
