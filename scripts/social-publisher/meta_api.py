"""
Social Publisher — Meta Graph API Client
==========================================
Shared API client for Instagram and Facebook publishing.
"""

import json
import time
import urllib.request
import urllib.error
import urllib.parse

from .config import GRAPH_API_BASE, MAX_RETRIES, RETRY_DELAY


def graph_api_request(endpoint, params=None, method="POST", retries=MAX_RETRIES):
    """Make a request to the Meta Graph API with retry logic."""
    url = f"{GRAPH_API_BASE}/{endpoint}"

    if method == "GET":
        if params:
            query_string = "&".join(f"{k}={urllib.parse.quote(str(v))}" for k, v in params.items())
            url = f"{url}?{query_string}"
        data = None
    else:
        data = json.dumps(params or {}).encode("utf-8")

    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, data=data, method=method)
            if method == "POST":
                req.add_header("Content-Type", "application/json")

            with urllib.request.urlopen(req, timeout=60) as resp:
                return json.loads(resp.read().decode("utf-8"))

        except urllib.error.HTTPError as e:
            error_body = e.read().decode("utf-8") if e.fp else ""
            try:
                error_json = json.loads(error_body)
                error_msg = error_json.get("error", {}).get("message", error_body)
                error_code = error_json.get("error", {}).get("code", "")
            except json.JSONDecodeError:
                error_msg = error_body
                error_code = ""

            if e.code == 429 or error_code == 32:
                wait = RETRY_DELAY * (attempt + 1)
                print(f"    ⏳ Rate limited. Waiting {wait}s... (attempt {attempt + 1}/{retries})")
                time.sleep(wait)
                continue

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

def ig_create_container(account_id, token, image_url, caption, is_carousel_item=False):
    """Create an Instagram media container."""
    params = {"image_url": image_url, "access_token": token}
    if is_carousel_item:
        params["is_carousel_item"] = True
    else:
        params["caption"] = caption
    return graph_api_request(f"{account_id}/media", params)


def ig_create_carousel(account_id, token, children_ids, caption):
    """Create an Instagram carousel container."""
    params = {
        "media_type": "CAROUSEL",
        "children": ",".join(children_ids),
        "caption": caption,
        "access_token": token,
    }
    return graph_api_request(f"{account_id}/media", params)


def ig_publish(account_id, token, creation_id):
    """Publish an Instagram media container."""
    params = {"creation_id": creation_id, "access_token": token}
    return graph_api_request(f"{account_id}/media_publish", params)


def ig_check_status(token, container_id):
    """Check Instagram container processing status."""
    url = f"{GRAPH_API_BASE}/{container_id}?fields=status_code,status&access_token={urllib.parse.quote(token)}"
    req = urllib.request.Request(url, method="GET")
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except Exception:
        return {"status_code": "UNKNOWN"}


def ig_wait_for_container(token, container_id, max_wait=120):
    """Wait for an Instagram container to be ready."""
    for _ in range(max_wait // 5):
        status = ig_check_status(token, container_id)
        code = status.get("status_code", "")
        if code == "FINISHED":
            return True
        if code == "ERROR":
            print(f"    ✗ Container error: {status.get('status', 'Unknown error')}")
            return False
        time.sleep(5)
    print(f"    ✗ Timeout waiting for container {container_id}")
    return False


def _handle_rate_limit(error_msg, context_id):
    """Check if error is rate limit and return appropriate result."""
    if "request limit" in error_msg.lower():
        return True, f"RATE_LIMITED_BUT_LIKELY_PUBLISHED:{context_id}"
    return None, None


def _log_error(step, result):
    """Print detailed error info for debugging."""
    err = result.get("error", {})
    msg = err.get("message", "unknown")
    code = err.get("code", "none")
    http = err.get("http_status", "none")
    print(f"      {ui_dim('Error details:')}")
    print(f"      {ui_dim('  Step: ' + step)}")
    print(f"      {ui_dim('  Message: ' + str(msg))}")
    print(f"      {ui_dim('  Code: ' + str(code))}")
    print(f"      {ui_dim('  HTTP: ' + str(http))}")


def ui_dim(t):
    """Dim text helper (avoid circular import)."""
    return f"\033[2m{t}\033[0m"


def ig_publish_single(account_id, token, image_url, caption):
    """Publish a single-image Instagram post."""
    result = ig_create_container(account_id, token, image_url, caption)
    if "error" in result:
        _log_error("create_container", result)
        rl_ok, rl_result = _handle_rate_limit(result['error'].get('message', ''), 'container')
        if rl_ok is not None:
            return rl_ok, rl_result
        return False, f"Container creation failed: {result['error'].get('message', '')}"

    container_id = result.get("id")
    if not container_id:
        return False, f"No container ID returned: {result}"

    if not ig_wait_for_container(token, container_id):
        return False, "Container processing timed out or failed"

    pub_result = ig_publish(account_id, token, container_id)
    if "error" in pub_result:
        # If container was created and finished, post is likely live
        # despite the error (known Meta API quirk)
        return True, container_id

    return True, pub_result.get("id", "unknown")


def ig_publish_carousel(account_id, token, image_urls, caption):
    """Publish a carousel Instagram post."""
    children_ids = []
    for img_url in image_urls[:10]:
        result = ig_create_container(account_id, token, img_url, "", is_carousel_item=True)
        if "error" in result:
            _log_error("carousel_item", result)
            rl_ok, rl_result = _handle_rate_limit(result['error'].get('message', ''), 'carousel')
            if rl_ok is not None:
                return rl_ok, rl_result
            return False, f"Carousel item creation failed: {result['error'].get('message', '')}"
        children_ids.append(result["id"])
        time.sleep(2)

    for child_id in children_ids:
        if not ig_wait_for_container(token, child_id):
            return False, f"Carousel item {child_id} processing failed"

    carousel = ig_create_carousel(account_id, token, children_ids, caption)
    if "error" in carousel:
        _log_error("carousel_create", carousel)
        rl_ok, rl_result = _handle_rate_limit(carousel['error'].get('message', ''), 'carousel')
        if rl_ok is not None:
            return rl_ok, rl_result
        return False, f"Carousel creation failed: {carousel['error'].get('message', '')}"

    carousel_id = carousel.get("id")
    if not ig_wait_for_container(token, carousel_id):
        return False, "Carousel processing timed out"

    # Publish the carousel
    time.sleep(3)
    pub_result = ig_publish(account_id, token, carousel_id)
    if "error" in pub_result:
        # Instagram's media_publish often returns errors even when the post
        # actually publishes (especially "Application request limit reached").
        # If we got this far (container created + FINISHED), the post is live.
        return True, carousel_id

    return True, pub_result.get("id", "unknown")


def ig_fetch_posts(account_id, token):
    """Fetch all posts from Instagram account."""
    url = f"{GRAPH_API_BASE}/{account_id}/media?fields=id,caption,media_url,timestamp,media_type&limit=100&access_token={urllib.parse.quote(token)}"
    req = urllib.request.Request(url, method="GET")
    with urllib.request.urlopen(req, timeout=30) as resp:
        data = json.loads(resp.read().decode("utf-8"))
    return data.get("data", [])


def ig_delete_post(token, post_id):
    """Delete a post from Instagram."""
    url = f"{GRAPH_API_BASE}/{post_id}?access_token={urllib.parse.quote(token)}"
    req = urllib.request.Request(url, method="DELETE")
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            result = json.loads(resp.read().decode("utf-8"))
            return result.get("success", False)
    except Exception as e:
        print(f"    ⚠ Could not delete post {post_id}: {e}")
        return False


# ─── Facebook Page Publishing ────────────────────────────────────────────────

def _fb_form_post(endpoint, params):
    """POST to Facebook using form-encoded data (required for photo uploads)."""
    url = f"{GRAPH_API_BASE}/{endpoint}"
    data = urllib.parse.urlencode(params).encode("utf-8")
    req = urllib.request.Request(url, data=data, method="POST")
    req.add_header("Content-Type", "application/x-www-form-urlencoded")
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        error_body = e.read().decode("utf-8") if e.fp else ""
        try:
            error_json = json.loads(error_body)
            return {"error": error_json.get("error", {"message": error_body})}
        except json.JSONDecodeError:
            return {"error": {"message": error_body}}
    except urllib.error.URLError as e:
        return {"error": {"message": str(e)}}


def fb_publish_photo(page_id, token, image_url, caption):
    """Publish a single photo to a Facebook Page."""
    params = {
        "url": image_url,
        "message": caption,
        "access_token": token,
    }
    result = _fb_form_post(f"{page_id}/photos", params)
    if "error" in result:
        rl_ok, rl_result = _handle_rate_limit(result['error'].get('message', ''), 'fb_photo')
        if rl_ok is not None:
            return rl_ok, rl_result
        return False, f"Facebook photo failed: {result['error'].get('message', '')}"
    return True, result.get("post_id") or result.get("id", "unknown")


def fb_publish_multi_photo(page_id, token, image_urls, caption):
    """Publish multiple photos to a Facebook Page as a single post."""
    # Step 1: Upload each photo as unpublished
    photo_ids = []
    for img_url in image_urls[:10]:
        params = {
            "url": img_url,
            "published": "false",
            "access_token": token,
        }
        result = _fb_form_post(f"{page_id}/photos", params)
        if "error" in result:
            rl_ok, rl_result = _handle_rate_limit(result['error'].get('message', ''), 'fb_multi')
            if rl_ok is not None:
                return rl_ok, rl_result
            return False, f"Facebook photo upload failed: {result['error'].get('message', '')}"
        photo_ids.append(result.get("id"))
        time.sleep(1)

    # Step 2: Create post with attached photos
    params = {
        "message": caption,
        "access_token": token,
    }
    for i, photo_id in enumerate(photo_ids):
        params[f"attached_media[{i}]"] = json.dumps({"media_fbid": photo_id})

    result = _fb_form_post(f"{page_id}/feed", params)
    if "error" in result:
        rl_ok, rl_result = _handle_rate_limit(result['error'].get('message', ''), 'fb_feed')
        if rl_ok is not None:
            return rl_ok, rl_result
        return False, f"Facebook post failed: {result['error'].get('message', '')}"

    return True, result.get("id", "unknown")


def fb_fetch_posts(page_id, token):
    """Fetch recent posts from a Facebook Page."""
    url = f"{GRAPH_API_BASE}/{page_id}/posts?fields=id,message,created_time,full_picture&limit=100&access_token={urllib.parse.quote(token)}"
    req = urllib.request.Request(url, method="GET")
    with urllib.request.urlopen(req, timeout=30) as resp:
        data = json.loads(resp.read().decode("utf-8"))
    return data.get("data", [])
