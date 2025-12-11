# PostMetric Tracking Script Security

This document outlines the security measures implemented in the PostMetric tracking script and API.

## Script Endpoint Security (`/js/script.js`)

### Security Headers

The script endpoint includes the following security headers:

- **X-Content-Type-Options: nosniff** - Prevents MIME type sniffing
- **X-Frame-Options: DENY** - Prevents clickjacking attacks
- **Referrer-Policy: strict-origin-when-cross-origin** - Controls referrer information
- **Content-Security-Policy** - Restricts resource loading (configured for tracking needs)

### Caching

- Script is cached for 1 hour with `immutable` flag for better performance
- Uses proper cache headers to prevent stale script delivery

## API Endpoint Security (`/api/track`)

### CORS Configuration

The tracking API allows cross-origin requests from any domain:

```http
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

This is necessary for tracking scripts embedded on third-party websites.

### Security Headers

- **X-Content-Type-Options: nosniff** - Prevents MIME type sniffing
- **X-Frame-Options: DENY** - Prevents clickjacking
- **Referrer-Policy: no-referrer** - Privacy protection
- **Cache-Control: no-cache, no-store, must-revalidate, private** - Prevents caching of tracking pixels

### Rate Limiting & Attack Protection

The API includes:

- **Traffic spike detection** - Automatically detects unusual traffic patterns
- **Attack mode protection** - Blocks suspicious IPs during attacks
- **Bot detection** - Client-side bot detection in the tracking script
- **IP-based rate limiting** - Prevents abuse

### Input Validation

All inputs are validated and sanitized:

- **Path sanitization** - Removes dangerous characters
- **Title sanitization** - Limits length and removes XSS vectors
- **Hostname validation** - Validates against configured domains
- **Custom data sanitization** - Limits parameters and sanitizes values

## Cookie Security

Tracking cookies use secure settings:

- **Secure flag** - Only sent over HTTPS connections
- **SameSite=Lax** - CSRF protection while allowing cross-site tracking
- **HttpOnly** - Not accessible via JavaScript (for sensitive cookies)
- **Path=/** - Available site-wide
- **Max-Age** - Explicit expiration times

### Cookie Names

- `_pm_vid` - Visitor ID (1 year expiration)
- `_pm_sid` - Session ID (30 minutes expiration)

## Subresource Integrity (SRI)

To ensure script integrity, you can use Subresource Integrity (SRI) when embedding the script:

```html
<script
  defer
  data-website-id="YOUR_TRACKING_CODE"
  data-domain="example.com"
  src="https://your-domain.com/js/script.js"
  integrity="sha384-..."
  crossorigin="anonymous"
></script>
```

### Generating SRI Hash

To generate the SRI hash for your script:

```bash
# Using OpenSSL
cat lib/tracking/script.js | openssl dgst -sha384 -binary | openssl base64 -A

# Using shasum (macOS/Linux)
shasum -b -a 384 lib/tracking/script.js | awk '{ print $1 }' | xxd -r -p | base64
```

## Client-Side Security

### Bot Detection

The tracking script includes comprehensive bot detection:

- Checks for automation tools (Selenium, Puppeteer, Playwright)
- Validates user agent strings
- Detects headless browsers
- Checks for automation framework properties

### Input Sanitization

All user inputs are sanitized:

- **Custom data** - Limited to 10 parameters, max 32 chars per key, max 255 chars per value
- **XSS prevention** - Removes dangerous characters (`<>'"&`, `javascript:`, `on*=`, etc.)
- **Path validation** - Validates URL paths
- **Event names** - Validated and sanitized

### Privacy Protection

- **LocalStorage flag** - Users can disable tracking via `localStorage.setItem('postmetric_ignore', 'true')`
- **No personal data** - Script doesn't collect PII without explicit user identification
- **Referrer cleaning** - Sensitive referrer information can be filtered

## Best Practices

### For Website Owners

1. **Use HTTPS** - Always serve the tracking script over HTTPS
2. **Enable SRI** - Use Subresource Integrity to verify script integrity
3. **Monitor traffic** - Watch for unusual patterns in your analytics
4. **Configure exclusions** - Set up IP/country/path exclusions as needed
5. **Enable attack mode** - Keep attack mode protection enabled

### For Developers

1. **Validate inputs** - Always validate and sanitize data before sending to API
2. **Use HTTPS** - Never send tracking data over HTTP
3. **Respect privacy** - Honor the `postmetric_ignore` localStorage flag
4. **Rate limit** - Implement client-side rate limiting for custom events
5. **Error handling** - Handle API errors gracefully without breaking user experience

## Security Reporting

If you discover a security vulnerability, please report it responsibly:

1. **Do not** open a public issue
2. Email security concerns to: security@yourdomain.com
3. Include details about the vulnerability
4. Allow time for the issue to be addressed before public disclosure

## Compliance

The tracking script is designed to be:

- **GDPR compliant** - Respects user privacy preferences
- **CCPA compliant** - Provides opt-out mechanisms
- **Privacy-friendly** - Minimal data collection, no PII by default

## Updates

Security measures are continuously updated. Always use the latest version of the tracking script.
