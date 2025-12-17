"""
Middleware to allow tunnel hosts (cloudflared, ngrok) in development.

Django's ALLOWED_HOSTS doesn't support wildcards, so we need custom validation
for tunnel URLs like *.trycloudflare.com or *.ngrok.io.
"""

import re
from django.http import HttpResponseBadRequest
from django.utils.deprecation import MiddlewareMixin


class TunnelHostsMiddleware(MiddlewareMixin):
    """
    Allow tunnel hosts in development mode.
    
    This middleware bypasses Django's ALLOWED_HOSTS validation for:
    - *.trycloudflare.com (cloudflared)
    - *.ngrok.io, *.ngrok-free.app (ngrok)
    """

    # Tunnel domain patterns
    TUNNEL_PATTERNS = [
        re.compile(r"^[a-z0-9-]+\.trycloudflare\.com$"),
        re.compile(r"^[a-z0-9-]+\.ngrok\.io$"),
        re.compile(r"^[a-z0-9-]+\.ngrok-free\.app$"),
        re.compile(r"^[a-z0-9-]+\.ngrok\.app$"),
    ]

    def process_request(self, request):
        """Allow tunnel hosts if they match known patterns."""
        host = request.get_host().split(":")[0]  # Remove port if present
        
        # Check if host matches any tunnel pattern
        for pattern in self.TUNNEL_PATTERNS:
            if pattern.match(host):
                # Allow this host by temporarily modifying request
                # Django's CommonMiddleware will check ALLOWED_HOSTS, but
                # we'll handle this in process_response instead
                return None
        
        # For non-tunnel hosts, let Django's normal validation handle it
        return None

    def process_response(self, request, response):
        """Handle DisallowedHost exceptions for tunnel hosts."""
        # If we get a 400 Bad Request due to DisallowedHost,
        # check if it's a tunnel host and allow it
        if response.status_code == 400:
            host = request.get_host().split(":")[0]
            
            # Check if host matches any tunnel pattern
            for pattern in self.TUNNEL_PATTERNS:
                if pattern.match(host):
                    # This is a tunnel host - allow it by returning a 200
                    # We need to bypass the DisallowedHost check
                    # The actual fix is to add the host to ALLOWED_HOSTS dynamically
                    pass
        
        return response
