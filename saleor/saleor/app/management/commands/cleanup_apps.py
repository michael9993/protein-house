"""Management command to clean up duplicate apps and set correct permissions."""

from collections import defaultdict

from django.core.management.base import BaseCommand

from saleor.app.models import App
from saleor.permission.models import Permission


# Permissions each app declares in its manifest
APP_PERMISSIONS = {
    "stripe": [
        "HANDLE_PAYMENTS",
    ],
    "saleor.app.smtp": [
        "MANAGE_ORDERS",
        "MANAGE_USERS",
        "MANAGE_GIFT_CARD",
    ],
    "saleor.app.invoices": [
        "MANAGE_ORDERS",
    ],
    "saleor.app.storefront-control": [
        "MANAGE_APPS",
        "MANAGE_DISCOUNTS",
    ],
    "saleor.app.newsletter": [
        "MANAGE_APPS",
        "MANAGE_USERS",
    ],
    "saleor.app.sales-analytics": [
        "MANAGE_ORDERS",
        "MANAGE_PRODUCTS",
        "MANAGE_CHANNELS",
    ],
    "saleor.app.bulk-manager": [
        "MANAGE_PRODUCTS",
        "MANAGE_ORDERS",
        "MANAGE_USERS",
        "MANAGE_APPS",
        "MANAGE_DISCOUNTS",
        "MANAGE_GIFT_CARD",
        "MANAGE_PRODUCT_TYPES_AND_ATTRIBUTES",
        "MANAGE_PAGES",
        "MANAGE_PAGE_TYPES_AND_ATTRIBUTES",
        "MANAGE_TRANSLATIONS",
    ],
    "saleor.app.image-studio": [
        "MANAGE_PRODUCTS",
        "MANAGE_APPS",
    ],
    "saleor.app.dropship-orchestrator": [
        "MANAGE_PRODUCTS",
        "MANAGE_PRODUCT_TYPES_AND_ATTRIBUTES",
        "MANAGE_ORDERS",
        "MANAGE_APPS",
        "MANAGE_SHIPPING",
        "MANAGE_CHECKOUTS",
        "MANAGE_CHANNELS",
    ],
    "saleor.app.tax-manager": [
        "HANDLE_TAXES",
        "MANAGE_APPS",
    ],
    # Storefront app
    "QXBwOjE=": [
        "MANAGE_PLUGINS",
        "MANAGE_APPS",
        "IMPERSONATE_USER",
        "MANAGE_PRODUCT_TYPES_AND_ATTRIBUTES",
        "MANAGE_PAGE_TYPES_AND_ATTRIBUTES",
        "MANAGE_DISCOUNTS",
    ],
}


def resolve_permissions(codenames):
    """Resolve permission codenames like MANAGE_ORDERS to Permission objects."""
    perms = []
    for codename in codenames:
        # Saleor permissions use lowercase codenames with the app label
        lower = codename.lower()
        try:
            perm = Permission.objects.get(codename=lower)
            perms.append(perm)
        except Permission.DoesNotExist:
            # Try without transformation
            try:
                perm = Permission.objects.get(codename=codename)
                perms.append(perm)
            except Permission.DoesNotExist:
                pass
    return perms


class Command(BaseCommand):
    help = "Remove duplicate apps and set correct manifest permissions."

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Show what would change without actually changing.",
        )
        parser.add_argument(
            "--skip-permissions",
            action="store_true",
            help="Skip fixing permissions.",
        )
        parser.add_argument(
            "--skip-cleanup",
            action="store_true",
            help="Skip duplicate removal.",
        )

    def handle(self, *args, **options):
        dry_run = options["dry_run"]
        skip_permissions = options["skip_permissions"]
        skip_cleanup = options["skip_cleanup"]

        # --- Phase 1: Remove duplicates ---
        if not skip_cleanup:
            self.stdout.write("\n=== Phase 1: Cleaning up duplicate apps ===\n")

            groups = defaultdict(list)
            for app in App.objects.all().order_by("-id"):
                groups[app.identifier].append(app)

            total_removed = 0
            for identifier, apps in groups.items():
                if len(apps) <= 1:
                    continue

                keep = apps[0]
                to_delete = apps[1:]

                self.stdout.write(
                    f"  {identifier}: keeping #{keep.id} '{keep.name}', "
                    f"deleting {len(to_delete)} duplicate(s)"
                )

                for old_app in to_delete:
                    self.stdout.write(
                        f"    - Deleting #{old_app.id} '{old_app.name}'"
                    )
                    if not dry_run:
                        old_app.delete()
                    total_removed += 1

            if total_removed > 0:
                action = "Would remove" if dry_run else "Removed"
                self.stdout.write(
                    self.style.SUCCESS(f"\n  {action} {total_removed} duplicate(s).")
                )
            else:
                self.stdout.write(self.style.SUCCESS("\n  No duplicates found."))

        # --- Phase 2: Fix permissions ---
        if not skip_permissions:
            self.stdout.write("\n=== Phase 2: Setting correct permissions ===\n")

            for app in App.objects.all():
                expected_codenames = APP_PERMISSIONS.get(app.identifier)

                if expected_codenames is None:
                    self.stdout.write(
                        f"  '{app.name}' ({app.identifier}) — "
                        f"no manifest entry, leaving as-is ({app.permissions.count()} perms)"
                    )
                    continue

                expected_perms = resolve_permissions(expected_codenames)
                current_perms = set(app.permissions.values_list("id", flat=True))
                expected_ids = {p.id for p in expected_perms}

                if current_perms == expected_ids:
                    self.stdout.write(
                        f"  '{app.name}' — correct ({len(expected_perms)} perms)"
                    )
                    continue

                action = "Would set" if dry_run else "Setting"
                self.stdout.write(
                    f"  {action} '{app.name}': {len(current_perms)} -> {len(expected_perms)} perms"
                )
                for p in expected_perms:
                    self.stdout.write(f"    + {p.codename}")

                if not dry_run:
                    app.permissions.clear()
                    app.permissions.add(*expected_perms)

            self.stdout.write(self.style.SUCCESS("\n  Permissions fixed."))

        # --- Summary ---
        self.stdout.write("\n=== Summary ===")
        self.stdout.write(f"  Total apps: {App.objects.count()}\n")
        for app in App.objects.all().order_by("identifier"):
            pcount = app.permissions.count()
            pnames = ", ".join(
                app.permissions.values_list("codename", flat=True)
            )
            self.stdout.write(
                f"  #{app.id} | {app.identifier} | {app.name} | "
                f"{pcount} perms: [{pnames}]"
            )
        self.stdout.write("")
