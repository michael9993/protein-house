#!/usr/bin/env python3
"""
Instagram Auto-Publisher for Pawzen Pets
=========================================
Reads instagram-posts.csv and publishes posts to Instagram via the
Meta Graph API. Supports single images and carousel (multi-image) posts.

Setup:
    1. Create a Meta App at developers.facebook.com
    2. Add Instagram Graph API product
    3. Generate a Page Access Token with permissions:
       - instagram_basic
       - instagram_content_publish
       - pages_read_engagement
    4. Find your Instagram Business Account ID:
       GET /me/accounts → GET /{page-id}?fields=instagram_business_account
    5. Set environment variables (or create scripts/.env-instagram):
       INSTAGRAM_ACCESS_TOKEN=your_token_here
       INSTAGRAM_ACCOUNT_ID=your_ig_business_account_id

Usage:
    python scripts/publish-instagram-posts.py                    # Publish all pending
    python scripts/publish-instagram-posts.py --dry-run          # Preview without posting
    python scripts/publish-instagram-posts.py --limit 5          # Publish first 5 only
    python scripts/publish-instagram-posts.py --start-from 10    # Start from post #10
    python scripts/publish-instagram-posts.py --delay 60         # 60s between posts (default: 30)
    python scripts/publish-instagram-posts.py --schedule         # Respect scheduled_date timing

Requirements:
    Python 3.10+ (stdlib only)
"""

import argparse
import csv
import json
import os
import sys
import time
import urllib.request
import urllib.error
from datetime import datetime, timezone

# ─── Configuration ───────────────────────────────────────────────────────────

GRAPH_API_BASE = "https://graph.facebook.com/v21.0"
DEFAULT_DELAY = 30  # seconds between posts (avoid rate limits)
MAX_RETRIES = 3
RETRY_DELAY = 10  # seconds between retries

# Status tracking file (so we can resume after interruption)
STATUS_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".instagram-publish-status.json")

# ─── Environment Loading ────────────────────────────────────────────────────

def load_env_file():
    """Load variables from scripts/.env-instagram if it exists."""
    env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env-instagram")
    if os.path.exists(env_path):
        with open(env_path, "r") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, _, value = line.partition("=")
                    os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))
        print(f"  Loaded credentials from {env_path}")


def get_credentials():
    """Get Instagram API credentials from environment."""
    load_env_file()
    token = os.environ.get("INSTAGRAM_ACCESS_TOKEN", "")
    account_id = os.environ.get("INSTAGRAM_ACCOUNT_ID", "")

    if not token or not account_id:
        print("ERROR: Missing credentials!")
        print()
        print("  Set these environment variables or create scripts/.env-instagram:")
        print()
        print("    INSTAGRAM_ACCESS_TOKEN=your_token_here")
        print("    INSTAGRAM_ACCOUNT_ID=your_ig_business_account_id")
        print()
        print("  How to get them:")
        print("  1. Go to developers.facebook.com → My Apps → Create App (Business)")
        print("  2. Add 'Instagram Graph API' product")
        print("  3. Tools → Graph API Explorer → Generate Access Token")
        print("     Permissions: instagram_basic, instagram_content_publish, pages_read_engagement")
        print("  4. Query: GET /me/accounts → get Page ID")
        print("  5. Query: GET /{page-id}?fields=instagram_business_account → get IG Account ID")
        sys.exit(1)

    return token, account_id


# ─── Meta Graph API Client ──────────────────────────────────────────────────

def graph_api_request(endpoint, params=None, method="POST", retries=MAX_RETRIES):
    """Make a request to the Meta Graph API."""
    url = f"{GRAPH_API_BASE}/{endpoint}"

    if method == "GET":
        if params:
            query_string = "&".join(f"{k}={urllib.parse.quote(str(v))}" for k, v in params.items())
            url = f"{url}?{query_string}"
        data = None
    else:
        data = json.dumps(params or {}).encode("utf-8")

    import urllib.parse

    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, data=data, method=method)
            if method == "POST":
                req.add_header("Content-Type", "application/json")

            with urllib.request.urlopen(req, timeout=60) as resp:
                result = json.loads(resp.read().decode("utf-8"))
                return result

        except urllib.error.HTTPError as e:
            error_body = e.read().decode("utf-8") if e.fp else ""
            try:
                error_json = json.loads(error_body)
                error_msg = error_json.get("error", {}).get("message", error_body)
                error_code = error_json.get("error", {}).get("code", "")
            except json.JSONDecodeError:
                error_msg = error_body
                error_code = ""

            # Rate limit — wait and retry
            if e.code == 429 or error_code == 32:
                wait = RETRY_DELAY * (attempt + 1)
                print(f"    ⏳ Rate limited. Waiting {wait}s... (attempt {attempt + 1}/{retries})")
                time.sleep(wait)
                continue

            # Transient server errors — retry
            if e.code >= 500 and attempt < retries - 1:
                print(f"    ⚠ Server error ({e.code}). Retrying in {RETRY_DELAY}s...")
                time.sleep(RETRY_DELAY)
                continue

            return {"error": {"message": error_msg, "code": error_code, "http_status": e.code}}

        except urllib.error.URLError as e:
            if attempt < retries - 1:
                print(f"    ⚠ Connection error. Retrying in {RETRY_DELAY}s...")
                time.sleep(RETRY_DELAY)
                continue
            return {"error": {"message": str(e), "code": "CONNECTION_ERROR"}}

    return {"error": {"message": "Max retries exceeded", "code": "MAX_RETRIES"}}


# ─── Instagram Publishing ───────────────────────────────────────────────────

def create_media_container(account_id, token, image_url, caption, is_carousel_item=False):
    """
    Step 1: Create a media container.
    For single posts: creates container with image + caption.
    For carousel items: creates container with image only (no caption).
    """
    params = {
        "image_url": image_url,
        "access_token": token,
    }

    if is_carousel_item:
        params["is_carousel_item"] = True
    else:
        params["caption"] = caption

    result = graph_api_request(f"{account_id}/media", params)
    return result


def create_carousel_container(account_id, token, children_ids, caption):
    """
    Step 1b: Create a carousel container with multiple children.
    """
    params = {
        "media_type": "CAROUSEL",
        "children": ",".join(children_ids),
        "caption": caption,
        "access_token": token,
    }
    result = graph_api_request(f"{account_id}/media", params)
    return result


def publish_media(account_id, token, creation_id):
    """
    Step 2: Publish a media container.
    The container must be in FINISHED status before publishing.
    """
    params = {
        "creation_id": creation_id,
        "access_token": token,
    }
    result = graph_api_request(f"{account_id}/media_publish", params)
    return result


def check_container_status(account_id, token, container_id):
    """Check if a media container is ready to publish."""
    import urllib.parse
    url = f"{GRAPH_API_BASE}/{container_id}?fields=status_code,status&access_token={urllib.parse.quote(token)}"
    req = urllib.request.Request(url, method="GET")
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except Exception:
        return {"status_code": "UNKNOWN"}


def wait_for_container(account_id, token, container_id, max_wait=120):
    """Wait for a media container to be ready (FINISHED status)."""
    for i in range(max_wait // 5):
        status = check_container_status(account_id, token, container_id)
        code = status.get("status_code", "")

        if code == "FINISHED":
            return True
        elif code == "ERROR":
            print(f"    ✗ Container error: {status.get('status', 'Unknown error')}")
            return False
        elif code in ("IN_PROGRESS", ""):
            time.sleep(5)
        else:
            time.sleep(5)

    print(f"    ✗ Timeout waiting for container {container_id}")
    return False


def publish_single_post(account_id, token, image_url, caption):
    """Publish a single-image Instagram post."""
    # Step 1: Create container
    result = create_media_container(account_id, token, image_url, caption)
    if "error" in result:
        return False, f"Container creation failed: {result['error'].get('message', '')}"

    container_id = result.get("id")
    if not container_id:
        return False, f"No container ID returned: {result}"

    # Wait for processing
    if not wait_for_container(account_id, token, container_id):
        return False, "Container processing timed out or failed"

    # Step 2: Publish
    pub_result = publish_media(account_id, token, container_id)
    if "error" in pub_result:
        error_msg = pub_result['error'].get('message', '')
        # Rate limit errors on publish step usually mean it DID publish
        if "request limit" in error_msg.lower():
            return True, f"RATE_LIMITED_BUT_LIKELY_PUBLISHED:{container_id}"
        return False, f"Publishing failed: {error_msg}"

    post_id = pub_result.get("id", "unknown")
    return True, post_id


def publish_carousel_post(account_id, token, image_urls, caption):
    """Publish a carousel (multi-image) Instagram post."""
    # Step 1: Create individual item containers
    children_ids = []
    for img_url in image_urls[:10]:  # Instagram max 10 carousel items
        result = create_media_container(account_id, token, img_url, "", is_carousel_item=True)
        if "error" in result:
            error_msg = result['error'].get('message', '')
            if "request limit" in error_msg.lower():
                return True, f"RATE_LIMITED_BUT_LIKELY_PUBLISHED:carousel"
            return False, f"Carousel item creation failed: {error_msg}"
        children_ids.append(result["id"])
        time.sleep(2)  # Small delay between uploads

    # Wait for all children to process
    for child_id in children_ids:
        if not wait_for_container(account_id, token, child_id):
            return False, f"Carousel item {child_id} processing failed"

    # Step 2: Create carousel container
    carousel = create_carousel_container(account_id, token, children_ids, caption)
    if "error" in carousel:
        error_msg = carousel['error'].get('message', '')
        if "request limit" in error_msg.lower():
            return True, f"RATE_LIMITED_BUT_LIKELY_PUBLISHED:carousel"
        return False, f"Carousel creation failed: {error_msg}"

    carousel_id = carousel.get("id")
    if not wait_for_container(account_id, token, carousel_id):
        return False, "Carousel processing timed out"

    # Step 3: Publish
    pub_result = publish_media(account_id, token, carousel_id)
    if "error" in pub_result:
        error_msg = pub_result['error'].get('message', '')
        if "request limit" in error_msg.lower():
            return True, f"RATE_LIMITED_BUT_LIKELY_PUBLISHED:{carousel_id}"
        return False, f"Publishing failed: {error_msg}"

    post_id = pub_result.get("id", "unknown")
    return True, post_id


# ─── Status Tracking ────────────────────────────────────────────────────────

def load_status():
    """Load publish status from tracking file."""
    if os.path.exists(STATUS_FILE):
        with open(STATUS_FILE, "r") as f:
            return json.load(f)
    return {"published": {}, "published_slugs": {}, "failed": {}, "last_run": None}


def save_status(status):
    """Save publish status to tracking file."""
    status["last_run"] = datetime.now().isoformat()
    with open(STATUS_FILE, "w") as f:
        json.dump(status, f, indent=2)


def get_product_slug(post):
    """Extract product slug from the product_link URL."""
    link = post.get("product_link", "")
    # URL format: https://pawzenpets.shop/usd/products/some-slug
    parts = link.rstrip("/").split("/")
    return parts[-1] if parts else ""


def delete_instagram_post(account_id, token, post_id):
    """Delete a post from Instagram via the Graph API."""
    import urllib.parse
    url = f"{GRAPH_API_BASE}/{post_id}?access_token={urllib.parse.quote(token)}"
    req = urllib.request.Request(url, method="DELETE")
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            result = json.loads(resp.read().decode("utf-8"))
            return result.get("success", False)
    except Exception as e:
        print(f"    ⚠ Could not delete post {post_id}: {e}")
        return False


# ─── CSV Reader ──────────────────────────────────────────────────────────────

def read_posts_csv(csv_path):
    """Read instagram posts from JSON (preferred) or CSV fallback."""
    # Prefer JSON — CSV has multiline caption issues
    json_path = csv_path.replace(".csv", ".json")
    if os.path.exists(json_path):
        with open(json_path, "r", encoding="utf-8") as f:
            posts = json.load(f)
        return posts

    # Fallback to CSV
    posts = []
    with open(csv_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            posts.append(row)
    return posts


# ─── Main ────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Publish Instagram posts from CSV via Meta Graph API")
    parser.add_argument("--csv", default=None, help="Path to instagram-posts.csv")
    parser.add_argument("--dry-run", action="store_true", help="Preview posts without publishing")
    parser.add_argument("--limit", type=int, default=0, help="Max posts to publish (0 = all)")
    parser.add_argument("--start-from", type=int, default=1, help="Start from post number N")
    parser.add_argument("--delay", type=int, default=DEFAULT_DELAY, help=f"Seconds between posts (default: {DEFAULT_DELAY})")
    parser.add_argument("--schedule", action="store_true", help="Wait until scheduled_date before posting")
    parser.add_argument("--carousel", action="store_true", help="Use additional_images for carousel posts")
    parser.add_argument("--reset", action="store_true", help="Reset publish status (re-publish all)")
    parser.add_argument("--delete-published", action="store_true", help="Delete already-published posts from Instagram before re-publishing")
    parser.add_argument("--sync", action="store_true", help="Sync status file with actual Instagram posts (fetch from API)")
    args = parser.parse_args()

    csv_path = args.csv or os.path.join(
        os.path.dirname(os.path.abspath(__file__)), "instagram-posts.csv"
    )

    print("╔══════════════════════════════════════════════════════════╗")
    print("║  Instagram Auto-Publisher                                ║")
    print("║  Pawzen Pets                                             ║")
    print("╚══════════════════════════════════════════════════════════╝")
    print()

    # Check CSV exists
    if not os.path.exists(csv_path):
        print(f"ERROR: CSV not found at {csv_path}")
        print("  Run 'python scripts/generate-instagram-posts.py' first!")
        sys.exit(1)

    # Load credentials (skip in dry-run)
    if not args.dry_run:
        token, account_id = get_credentials()
        print(f"  Account ID: {account_id[:6]}...{account_id[-4:]}")
    else:
        token, account_id = "DRY_RUN", "DRY_RUN"
        print("  Mode: DRY RUN (no posts will be published)")
    print()

    # Load posts
    posts = read_posts_csv(csv_path)
    print(f"  Loaded {len(posts)} posts from CSV")

    # Sync: fetch actual Instagram posts and rebuild status
    if args.sync and not args.dry_run:
        print("  Syncing with Instagram...")
        import urllib.parse
        url = f"{GRAPH_API_BASE}/{account_id}/media?fields=id,caption,media_url,timestamp,media_type&limit=100&access_token={urllib.parse.quote(token)}"
        req = urllib.request.Request(url, method="GET")
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                ig_data = json.loads(resp.read().decode("utf-8"))
            ig_posts = ig_data.get("data", [])
            print(f"  Found {len(ig_posts)} posts on Instagram")

            # Match IG posts to our products by finding product links in captions
            status = load_status()
            status["published_slugs"] = {}
            status["published"] = {}
            for ig_post in ig_posts:
                caption = ig_post.get("caption", "")
                post_id = ig_post.get("id", "")
                ts = ig_post.get("timestamp", "")

                # Extract product slug from the shop URL in caption
                import re
                link_match = re.search(r"pawzenpets\.shop/\w+/products/([\w-]+)", caption)
                if link_match:
                    slug = link_match.group(1)
                    # Extract product name from first line of caption
                    first_line = caption.split("\n")[0].strip()
                    # Clean up emoji and formatting
                    name = re.sub(r"[^\w\s\u2014—-]", "", first_line).strip()
                    name = re.sub(r"^(SALE ALERT|Meet the|Your pet deserves.*Introducing the)\s*", "", name).strip()
                    if not name:
                        name = slug

                    status["published_slugs"][slug] = {
                        "post_id": post_id,
                        "product": name,
                        "published_at": ts,
                    }
                    print(f"    ✓ {name[:50]} → {slug[:50]}")

            save_status(status)
            print(f"\n  Synced {len(status['published_slugs'])} products to status file")
            print()
        except Exception as e:
            print(f"  ✗ Sync failed: {e}")
            sys.exit(1)

        if not args.carousel and args.limit == 0:
            # Sync-only mode — don't publish
            return

    # Load/reset status
    if args.reset and os.path.exists(STATUS_FILE):
        os.remove(STATUS_FILE)
        print("  Status reset — all posts will be re-published")

    status = load_status()
    published_slugs = set(status.get("published_slugs", {}).keys())

    # Delete published posts from Instagram if requested
    if args.delete_published and published_slugs and not args.dry_run:
        print(f"  Deleting {len(published_slugs)} published posts from Instagram...")
        for slug, info in list(status.get("published_slugs", {}).items()):
            post_id = info.get("post_id", "")
            if post_id and post_id != "unknown":
                ok = delete_instagram_post(account_id, token, post_id)
                if ok:
                    print(f"    🗑 Deleted: {info.get('product', slug)}")
                    del status["published_slugs"][slug]
                    # Also remove from legacy published dict
                    for k, v in list(status.get("published", {}).items()):
                        if isinstance(v, dict) and v.get("post_id") == post_id:
                            del status["published"][k]
                else:
                    print(f"    ⚠ Could not delete: {info.get('product', slug)}")
        save_status(status)
        published_slugs = set(status.get("published_slugs", {}).keys())
        print()

    if published_slugs:
        print(f"  Already published: {len(published_slugs)} products (skipping by slug)")
    print()

    # Filter posts — deduplicate by product slug
    filtered = []
    for post in posts:
        post_num = post.get("post_number", "0")
        slug = get_product_slug(post)

        # Skip already published (by slug — survives CSV regeneration)
        if slug and slug in published_slugs:
            continue

        # Apply start-from filter
        if int(post_num) < args.start_from:
            continue

        filtered.append(post)

    # Apply limit
    if args.limit > 0:
        filtered = filtered[:args.limit]

    if not filtered:
        print("  No posts to publish!")
        return

    print(f"  Publishing {len(filtered)} posts ({args.delay}s delay between posts)")
    print("  Press Ctrl+C to stop at any time (progress is saved)")
    print()
    print("─" * 60)

    # Publish loop
    success_count = 0
    fail_count = 0
    rate_limit_count = 0  # Track consecutive rate limits

    try:
        for i, post in enumerate(filtered):
            post_num = post.get("post_number", str(i + 1))
            product = post.get("product_name", "Unknown")
            caption = post.get("caption", "")
            image_url = post.get("image_url", "")
            additional = post.get("additional_images", "").strip()
            scheduled = post.get("scheduled_date", "")

            slug = get_product_slug(post)

            print(f"\n  [{post_num}/{len(posts)}] {product}")
            print(f"    📸 Image: {image_url[:60]}...")

            if not image_url:
                print("    ✗ SKIP: No image URL")
                fail_count += 1
                status.setdefault("failed", {})[post_num] = "No image URL"
                save_status(status)
                continue

            # Schedule waiting
            if args.schedule and scheduled:
                try:
                    target = datetime.strptime(scheduled, "%Y-%m-%d %H:%M")
                    now = datetime.now()
                    if target > now:
                        wait_secs = (target - now).total_seconds()
                        print(f"    ⏰ Waiting until {scheduled} ({int(wait_secs)}s)...")
                        time.sleep(wait_secs)
                except ValueError:
                    pass

            if args.dry_run:
                print(f"    📝 Caption: {caption[:80]}...")
                print(f"    ✓ DRY RUN — would publish this post")
                success_count += 1
                continue

            # Determine single vs carousel
            image_urls = [image_url]
            if args.carousel and additional:
                extra = [u.strip() for u in additional.split("|") if u.strip()]
                image_urls.extend(extra)

            # Publish (NO fallback — carousel failure may mean it actually published)
            if len(image_urls) > 1:
                print(f"    📸 Carousel: {len(image_urls)} images")
                ok, result = publish_carousel_post(account_id, token, image_urls, caption)
            else:
                ok, result = publish_single_post(account_id, token, image_url, caption)

            if ok:
                is_rate_limited = isinstance(result, str) and "RATE_LIMITED" in result
                if is_rate_limited:
                    print(f"    ⚠ Rate limited but likely published (marking as success)")
                    rate_limit_count += 1
                else:
                    print(f"    ✓ Published! Post ID: {result}")
                    rate_limit_count = 0  # Reset on clean success

                success_count += 1
                status.setdefault("published", {})[post_num] = {
                    "post_id": result,
                    "product": product,
                    "published_at": datetime.now().isoformat(),
                }
                # Track by slug for cross-CSV deduplication
                if slug:
                    status.setdefault("published_slugs", {})[slug] = {
                        "post_id": result,
                        "product": product,
                        "published_at": datetime.now().isoformat(),
                    }

                # Stop after 3 consecutive rate limits to avoid burning API quota
                if rate_limit_count >= 3:
                    print(f"\n  ⚠ Hit rate limit 3 times in a row. Stopping to avoid duplicates.")
                    print(f"    Posts are likely publishing — run --sync later to verify.")
                    save_status(status)
                    break
            else:
                print(f"    ✗ FAILED: {result}")
                fail_count += 1
                rate_limit_count = 0  # Reset on non-rate-limit failure
                status.setdefault("failed", {})[post_num] = result

            save_status(status)

            # Delay between posts (except last one)
            if i < len(filtered) - 1:
                print(f"    ⏳ Waiting {args.delay}s before next post...")
                time.sleep(args.delay)

    except KeyboardInterrupt:
        print("\n\n  ⚠ Interrupted by user. Progress saved!")
        save_status(status)

    # Summary
    print()
    print("═" * 60)
    print(f"  ✓ Published: {success_count}")
    print(f"  ✗ Failed:    {fail_count}")
    print(f"  ○ Remaining: {len(filtered) - success_count - fail_count}")
    if not args.dry_run:
        print(f"\n  Status saved to: {STATUS_FILE}")
        print("  Re-run the script to continue from where you left off.")
    print()


if __name__ == "__main__":
    main()
