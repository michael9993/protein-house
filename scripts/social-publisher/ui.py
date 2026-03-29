"""
Social Publisher — CLI User Interface
=======================================
Pretty printing, progress indicators, and formatted output.
"""

import sys
import os

# ─── ANSI Colors ─────────────────────────────────────────────────────────────

# Detect if terminal supports colors
_NO_COLOR = os.environ.get("NO_COLOR") or not hasattr(sys.stdout, "isatty") or not sys.stdout.isatty()


def _c(code, text):
    if _NO_COLOR:
        return text
    return f"\033[{code}m{text}\033[0m"


def bold(t):      return _c("1", t)
def dim(t):       return _c("2", t)
def green(t):     return _c("32", t)
def red(t):       return _c("31", t)
def yellow(t):    return _c("33", t)
def cyan(t):      return _c("36", t)
def magenta(t):   return _c("35", t)
def white(t):     return _c("37", t)
def bg_blue(t):   return _c("44;97", t)
def bg_green(t):  return _c("42;97", t)
def bg_red(t):    return _c("41;97", t)
def bg_yellow(t): return _c("43;30", t)


# ─── Symbols ─────────────────────────────────────────────────────────────────

OK = green("✓")
FAIL = red("✗")
WARN = yellow("⚠")
SKIP = dim("○")
ARROW = cyan("→")
PHOTO = "📸"
UPLOAD = "📤"
WAIT = "⏳"
FIRE = "🔥"
LINK = "🔗"
CART = "🛒"


# ─── Banner ──────────────────────────────────────────────────────────────────

LOGO = r"""
  ╔═══════════════════════════════════════════════════╗
  ║                                                   ║
  ║   {title}   ║
  ║   {subtitle}   ║
  ║                                                   ║
  ╚═══════════════════════════════════════════════════╝
"""


def banner(title, subtitle=""):
    """Print a styled banner."""
    t = bold(title.center(45))
    s = dim(subtitle.center(45)) if subtitle else " " * 45
    print(LOGO.format(title=t, subtitle=s))


# ─── Sections & Headers ─────────────────────────────────────────────────────

def header(text):
    """Print a section header."""
    print(f"\n  {bold(cyan(text))}")
    print(f"  {'─' * 50}")


def subheader(text):
    print(f"\n  {bold(text)}")


def divider():
    print(f"\n  {'═' * 55}")


# ─── Info Lines ──────────────────────────────────────────────────────────────

def info(label, value, indent=2):
    """Print a labeled info line."""
    spaces = " " * indent
    print(f"{spaces}{dim(label + ':')} {bold(str(value))}")


def success(msg, indent=4):
    print(f"{' ' * indent}{OK} {msg}")


def fail(msg, indent=4):
    print(f"{' ' * indent}{FAIL} {red(msg)}")


def warn(msg, indent=4):
    print(f"{' ' * indent}{WARN} {yellow(msg)}")


def skip(msg, indent=4):
    print(f"{' ' * indent}{SKIP} {dim(msg)}")


def step(msg, indent=4):
    print(f"{' ' * indent}{ARROW} {msg}")


# ─── Progress ───────────────────────────────────────────────────────────────

def progress_bar(current, total, width=30, label=""):
    """Print an inline progress bar."""
    if total == 0:
        return
    pct = current / total
    filled = int(width * pct)
    bar = "█" * filled + "░" * (width - filled)
    pct_str = f"{pct * 100:.0f}%"
    lbl = f" {label}" if label else ""
    sys.stdout.write(f"\r  {bar} {bold(pct_str)} ({current}/{total}){lbl}  ")
    sys.stdout.flush()
    if current >= total:
        print()


def post_header(num, total, product_name):
    """Print a post publishing header."""
    counter = dim(f"[{num}/{total}]")
    print(f"\n  {counter} {bold(product_name)}")


# ─── Tables ──────────────────────────────────────────────────────────────────

def table(rows, headers=None, indent=2):
    """Print a simple aligned table."""
    if not rows:
        return

    # Calculate column widths
    all_rows = [headers] + rows if headers else rows
    cols = len(all_rows[0])
    widths = [0] * cols
    for row in all_rows:
        for i, cell in enumerate(row):
            widths[i] = max(widths[i], len(str(cell)))

    spaces = " " * indent

    # Header
    if headers:
        hdr = "  ".join(bold(str(h).ljust(widths[i])) for i, h in enumerate(headers))
        print(f"{spaces}{hdr}")
        print(f"{spaces}{'──'.join('─' * w for w in widths)}")

    # Rows
    for row in rows:
        line = "  ".join(str(c).ljust(widths[i]) for i, c in enumerate(row))
        print(f"{spaces}{line}")


# ─── Summary Box ─────────────────────────────────────────────────────────────

def summary_box(title, items):
    """Print a summary box with key-value items."""
    divider()
    print(f"  {bold(title)}")
    print(f"  {'─' * 50}")
    for label, value in items:
        color = green if "Published" in label or "Success" in label else (
            red if "Failed" in label else (
                yellow if "Rate" in label or "Remaining" in label else white
            )
        )
        print(f"  {label + ':':<20} {color(str(value))}")
    print()


# ─── Platform Badge ─────────────────────────────────────────────────────────

def platform_badge(platform):
    """Return a colored platform badge."""
    colors = {
        "instagram": magenta,
        "facebook": cyan,
    }
    color = colors.get(platform, white)
    return color(f"[{platform}]")


# ─── Confirmations ──────────────────────────────────────────────────────────

def confirm(msg, default=True):
    """Ask for user confirmation."""
    suffix = " [Y/n] " if default else " [y/N] "
    try:
        answer = input(f"  {WARN} {msg}{suffix}").strip().lower()
        if not answer:
            return default
        return answer in ("y", "yes")
    except (EOFError, KeyboardInterrupt):
        print()
        return False
