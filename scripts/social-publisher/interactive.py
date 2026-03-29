"""
Social Publisher — Interactive Mode
=====================================
Full interactive CLI with menus, selections, and guided workflows.
"""

import os
import sys

from . import ui
from .config import (
    BRAND_NAME, DEFAULT_API_URL, DEFAULT_CHANNEL, DEFAULT_DELAY,
    DEFAULT_PER_CATEGORY, OUTPUT_CSV, STATUS_FILE,
    load_status, get_published_slugs, get_credentials,
)


# ─── Input Helpers ───────────────────────────────────────────────────────────

def ask(prompt, default=""):
    """Ask for text input with optional default."""
    suffix = f" [{default}]" if default else ""
    try:
        val = input(f"  {prompt}{suffix}: ").strip()
        return val if val else default
    except (EOFError, KeyboardInterrupt):
        print()
        return default


def ask_int(prompt, default=0):
    """Ask for integer input."""
    val = ask(prompt, str(default))
    try:
        return int(val)
    except ValueError:
        return default


def ask_yn(prompt, default=True):
    """Ask yes/no question."""
    suffix = " [Y/n]" if default else " [y/N]"
    try:
        val = input(f"  {prompt}{suffix}: ").strip().lower()
        if not val:
            return default
        return val in ("y", "yes")
    except (EOFError, KeyboardInterrupt):
        print()
        return default


def choose(title, options, allow_back=True):
    """
    Display a numbered menu and return the chosen option.
    Options: list of (key, label) or (key, label, description) tuples.
    Returns the key of the chosen option, or None if back.
    """
    print()
    print(f"  {ui.bold(title)}")
    print(f"  {'─' * 50}")

    for i, opt in enumerate(options, 1):
        key, label = opt[0], opt[1]
        desc = opt[2] if len(opt) > 2 else ""
        num = ui.cyan(f"  {i}.")
        if desc:
            print(f"{num} {ui.bold(label)}")
            print(f"     {ui.dim(desc)}")
        else:
            print(f"{num} {label}")

    if allow_back:
        print(f"  {ui.dim('0. Back')}")

    print()
    while True:
        try:
            val = input(f"  {ui.cyan('Choose')}: ").strip()
        except (EOFError, KeyboardInterrupt):
            print()
            return None

        if val == "0" and allow_back:
            return None
        try:
            idx = int(val) - 1
            if 0 <= idx < len(options):
                return options[idx][0]
        except ValueError:
            # Try matching by key name
            for opt in options:
                if opt[0].lower() == val.lower():
                    return opt[0]

        print(f"    {ui.dim('Invalid choice. Try again.')}")


def choose_multi(title, options):
    """
    Display checkboxes and let user toggle selections.
    Returns list of selected keys.
    """
    selected = set()
    for opt in options:
        if len(opt) > 3 and opt[3]:  # 4th element = default selected
            selected.add(opt[0])

    while True:
        print()
        print(f"  {ui.bold(title)}")
        print(f"  {'─' * 50}")

        for i, opt in enumerate(options, 1):
            key, label = opt[0], opt[1]
            check = ui.green("■") if key in selected else ui.dim("□")
            print(f"  {check} {ui.cyan(str(i) + '.')} {label}")

        print()
        print(f"  {ui.dim('Enter number to toggle, or')} {ui.bold('done')} {ui.dim('to continue')}")

        try:
            val = input(f"  {ui.cyan('Toggle')}: ").strip().lower()
        except (EOFError, KeyboardInterrupt):
            print()
            return list(selected)

        if val in ("done", "d", ""):
            return list(selected)

        try:
            idx = int(val) - 1
            if 0 <= idx < len(options):
                key = options[idx][0]
                if key in selected:
                    selected.discard(key)
                else:
                    selected.add(key)
        except ValueError:
            pass


# ─── Status Display ──────────────────────────────────────────────────────────

def show_quick_status():
    """Show a compact status summary."""
    status = load_status()
    ig = len(get_published_slugs(status, "instagram"))
    fb = len(get_published_slugs(status, "facebook"))

    print()
    print(f"  {ui.dim('Status:')} Instagram: {ui.bold(str(ig))} posts | Facebook: {ui.bold(str(fb))} posts")

    # Check for posts file
    has_posts = os.path.exists(OUTPUT_CSV.replace(".csv", ".json"))
    if has_posts:
        import json
        with open(OUTPUT_CSV.replace(".csv", ".json"), "r", encoding="utf-8") as f:
            posts = json.load(f)
        print(f"  {ui.dim('Pending:')} {ui.bold(str(len(posts)))} posts in queue")
    else:
        print(f"  {ui.dim('Pending:')} No posts generated yet")


# ─── Interactive Workflows ───────────────────────────────────────────────────

def workflow_generate():
    """Interactive generate workflow."""
    ui.header("Generate Posts")

    # Target platform
    target = choose("Which platform are you generating for?", [
        ("instagram", "Instagram", "Exclude products already on Instagram"),
        ("facebook", "Facebook", "Exclude products already on Facebook"),
        ("all", "Both platforms", "Exclude only products on BOTH platforms"),
    ], allow_back=True)
    if target is None:
        return

    # Selection mode
    mode = choose("How many products?", [
        ("curated", f"Curated — {DEFAULT_PER_CATEGORY} per category", "Best products from each category (recommended)"),
        ("custom", "Custom per category", "Choose how many per category"),
        ("all", "All products", "Every in-stock product not yet published"),
    ])
    if mode is None:
        return

    per_cat = DEFAULT_PER_CATEGORY
    use_all = False
    if mode == "custom":
        per_cat = ask_int("Products per category", DEFAULT_PER_CATEGORY)
    elif mode == "all":
        use_all = True

    # Channel
    channel = choose("Channel?", [
        ("usd", "USD — English", "International store"),
        ("default-channel", "ILS — Hebrew", "Israel store"),
    ])
    if channel is None:
        return

    lang = "HE" if channel == "default-channel" else "EN"

    # Schedule
    posts_per_day = ask_int("Posts per day in schedule", 2)

    # Confirm
    ui.header("Ready to Generate")
    ui.info("Target", target)
    ui.info("Selection", "All products" if use_all else f"{per_cat} per category")
    ui.info("Channel", channel)
    ui.info("Language", lang)
    ui.info("Schedule", f"{posts_per_day} posts/day")

    if not ask_yn("\nProceed?"):
        return

    # Build args and run
    class Args:
        pass
    args = Args()
    args.api_url = os.environ.get("SALEOR_API_URL", DEFAULT_API_URL)
    args.channel = channel
    args.lang = lang
    args.output = OUTPUT_CSV
    args.per_cat = per_cat
    args.all = use_all
    args.posts_per_day = posts_per_day
    args.target = target

    from .__main__ import cmd_generate
    cmd_generate(args)


def workflow_publish():
    """Interactive publish workflow."""
    ui.header("Publish Posts")

    # Check for posts
    import json
    json_path = OUTPUT_CSV.replace(".csv", ".json")
    if not os.path.exists(json_path):
        ui.fail("No posts found! Run 'Generate' first.")
        return

    with open(json_path, "r", encoding="utf-8") as f:
        all_posts = json.load(f)
    ui.info("Posts available", len(all_posts))

    # Platform
    platforms = choose_multi("Publish to:", [
        ("instagram", "Instagram", "", True),
        ("facebook", "Facebook", "", False),
    ])
    if not platforms:
        ui.warn("No platform selected")
        return

    # Check credentials
    try:
        token, fb_token, ig_account, fb_page = get_credentials()
        if "instagram" in platforms and not ig_account:
            ui.fail("INSTAGRAM_ACCOUNT_ID not set in .env")
            return
        if "facebook" in platforms and not fb_page:
            ui.fail("FACEBOOK_PAGE_ID not set in .env")
            return
    except SystemExit:
        return

    # Carousel
    carousel = ask_yn("Use carousel/multi-image posts?", True)

    # Limit
    limit_mode = choose("How many posts?", [
        ("all", f"All {len(all_posts)} posts"),
        ("limit", "Custom limit", "Set a specific number"),
        ("test", "Test — just 3 posts", "Verify everything works"),
    ])
    if limit_mode is None:
        return

    limit = 0
    if limit_mode == "limit":
        limit = ask_int("Number of posts", 10)
    elif limit_mode == "test":
        limit = 3

    # Delay
    delay = ask_int("Delay between posts (seconds)", DEFAULT_DELAY)

    # Dry run option
    dry_run = ask_yn("Preview only (dry run)?", False)

    # Confirm
    ui.header("Ready to Publish")
    ui.info("Platforms", ", ".join(p.title() for p in platforms))
    ui.info("Carousel", "Yes" if carousel else "No")
    ui.info("Posts", "All" if limit == 0 else limit)
    ui.info("Delay", f"{delay}s")
    ui.info("Mode", "DRY RUN" if dry_run else "LIVE")

    if not dry_run:
        if not ask_yn(f"\n{ui.yellow('This will publish to live accounts. Continue?')}"):
            return
    else:
        if not ask_yn("\nProceed with dry run?"):
            return

    # Build args and run
    class Args:
        pass
    args = Args()
    args.csv = None
    args.dry_run = dry_run
    args.limit = limit
    args.start_from = 1
    args.delay = delay
    args.carousel = carousel
    args.reset = False
    args.facebook = "facebook" in platforms and "instagram" in platforms
    args.facebook_only = platforms == ["facebook"]

    from .__main__ import cmd_publish
    cmd_publish(args)


def workflow_sync():
    """Interactive sync workflow."""
    ui.header("Sync with Live Posts")

    platforms = choose_multi("Sync which platforms?", [
        ("instagram", "Instagram", "", True),
        ("facebook", "Facebook", "", False),
    ])
    if not platforms:
        return

    class Args:
        pass
    args = Args()
    args.facebook = "facebook" in platforms
    args.facebook_only = platforms == ["facebook"]

    from .__main__ import cmd_sync
    cmd_sync(args)


def workflow_status():
    """Show full status."""
    from .__main__ import cmd_status
    class Args:
        pass
    cmd_status(Args())


def workflow_catalog():
    """Interactive catalog generation."""
    ui.header("Generate Product Catalog")

    channel = choose("Channel?", [
        ("usd", "USD — English", "International catalog"),
        ("default-channel", "ILS — Hebrew", "Israel catalog"),
    ])
    if channel is None:
        return

    lang = "HE" if channel == "default-channel" else "EN"

    class Args:
        pass
    args = Args()
    args.api_url = os.environ.get("SALEOR_API_URL", DEFAULT_API_URL)
    args.channel = channel
    args.lang = lang
    args.output = None

    from .__main__ import cmd_catalog
    cmd_catalog(args)


# ─── Main Menu ───────────────────────────────────────────────────────────────

def run():
    """Run the interactive CLI."""
    while True:
        ui.banner("Pawzen Social Publisher", "Interactive Mode")
        show_quick_status()

        choice = choose("What would you like to do?", [
            ("generate", "Generate Posts", "Create post content from your Saleor catalog"),
            ("publish", "Publish Posts", "Send posts to Instagram and/or Facebook"),
            ("sync", "Sync Status", "Fetch live posts and update tracking"),
            ("status", "View Status", "See what's published where"),
            ("catalog", "Product Catalog", "Generate Facebook Commerce catalog CSV"),
        ], allow_back=False)

        if choice is None:
            print(f"\n  {ui.dim('Goodbye!')}\n")
            break

        try:
            workflows = {
                "generate": workflow_generate,
                "publish": workflow_publish,
                "sync": workflow_sync,
                "status": workflow_status,
                "catalog": workflow_catalog,
            }
            workflows[choice]()
        except KeyboardInterrupt:
            print(f"\n\n  {ui.warn('Interrupted')}")
            continue
        except Exception as e:
            ui.fail(f"Error: {e}")
            import traceback
            traceback.print_exc()
            continue

        # After action, pause before returning to menu
        print()
        try:
            input(f"  {ui.dim('Press Enter to return to menu...')}")
        except (EOFError, KeyboardInterrupt):
            print(f"\n  {ui.dim('Goodbye!')}\n")
            break
