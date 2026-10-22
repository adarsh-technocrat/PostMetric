(function() {
  'use strict';

  // Get the current script element to read data attributes
  const script = document.currentScript;
  const DATA_PREFIX = 'data-';
  const getAttr = script.getAttribute.bind(script);

  const websiteId = getAttr(DATA_PREFIX + 'website-id');
  const domain = getAttr(DATA_PREFIX + 'domain');
  
  function getApiUrl() {
    try {
      const scriptSrc = script.src;
      const scriptUrl = new URL(scriptSrc);
      // Construct API URL from script origin
      // If script is at /js/script.js, API will be at /api/track
      return new URL('/api/track', scriptUrl.origin).href;
    } catch (e) {
      return '/api/track';
    }
  }
  
  const DEFAULT_API_URL = getApiUrl();

  function isLocalhost(hostname) {
    if (!hostname) return false;
    const h = hostname.toLowerCase();
    return (
      ['localhost', '127.0.0.1', '::1'].includes(h) ||
      /^127(\.[0-9]+){0,3}$/.test(h) ||
      /^(\[)?::1?\]?$/.test(h) ||
      h.endsWith('.local') ||
      h.endsWith('.localhost')
    );
  }

 
  function isBot() {
    try {
      if (
        window.navigator.webdriver === true ||
        window.callPhantom ||
        window._phantom ||
        window.__nightmare
      ) {
        return true;
      }

      if (
        !window.navigator ||
        !window.location ||
        !window.document ||
        typeof window.navigator !== 'object' ||
        typeof window.location !== 'object' ||
        typeof window.document !== 'object'
      ) {
        return true;
      }

      const nav = window.navigator;

      if (
        !nav.userAgent ||
        nav.userAgent === '' ||
        nav.userAgent === 'undefined' ||
        nav.userAgent.length < 5
      ) {
        return true;
      }

      const ua = nav.userAgent.toLowerCase();

      if (
        ua.includes('headlesschrome') ||
        ua.includes('phantomjs') ||
        ua.includes('selenium') ||
        ua.includes('webdriver') ||
        ua.includes('puppeteer') ||
        ua.includes('playwright')
      ) {
        return true;
      }

     const automationProps = [
        '__webdriver_evaluate',
        '__selenium_evaluate',
        '__webdriver_script_function',
        '__webdriver_unwrapped',
        '__fxdriver_evaluate',
        '__driver_evaluate',
        '_Selenium_IDE_Recorder',
        '_selenium',
        'calledSelenium',
        '$cdc_asdjflasutopfhvcZLmcfl_',
      ];

      for (const prop of automationProps) {
        if (window[prop] !== undefined) {
          return true;
        }
      }
      
      if (document.documentElement) {
        if (
          document.documentElement.getAttribute('webdriver') ||
          document.documentElement.getAttribute('selenium') ||
          document.documentElement.getAttribute('driver')
        ) {
          return true;
        }
      }

      // Check for HTTP client user agents
      if (
        ua.includes('python') ||
        ua.includes('curl') ||
        ua.includes('wget') ||
        ua.includes('java/') ||
        ua.includes('go-http') ||
        ua.includes('node.js') ||
        ua.includes('axios') ||
        ua.includes('postman')
      ) {
        return true;
      }
    } catch (e) {
      return false;
    }

    return false;
  }

  function isIpAddress(hostname) {
    return /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname) || hostname.indexOf(':') !== -1;
  }

  function normalizeDomain(value) {
    return (value || '').trim().toLowerCase().replace(/^\.+/, '').replace(/\.+$/, '');
  }

  /**
   * The cookie domain to use, or null for a host-only cookie.
   */
  function getCookieDomain() {
    try {
      if (window.location.protocol === 'file:') return null;
      const hostname = (window.location.hostname || '').toLowerCase();
      if (!hostname || isLocalhost(hostname) || isIpAddress(hostname)) return null;
      const configured = normalizeDomain(getAttr(DATA_PREFIX + 'domain'));
      // A single-label domain (e.g. "intranet") cannot carry a domain attribute.
      if (!configured || configured.indexOf('.') === -1) return null;
      if (hostname === configured || hostname.endsWith('.' + configured)) {
        return configured;
      }
    } catch (e) {}
    return null;
  }

  function setCookie(name, value, days) {
    let expires = '';
    if (days) {
      const date = new Date();
      date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
      expires = '; expires=' + date.toUTCString();
    }

    let cookie = name + '=' + (value || '') + expires + '; path=/';

    // Scope cookies to .<data-domain> whenever we are on that domain or one of
    // its subdomains, so the apex and its subdomains share one visitor.
    // Localhost, IP addresses and file: pages keep host-only cookies.
    const cookieDomain = getCookieDomain();
    if (cookieDomain) {
      cookie += '; domain=.' + cookieDomain;
    }

    if (window.location.protocol === 'https:') {
      cookie += '; Secure';
    }
    cookie += '; SameSite=Lax';

    document.cookie = cookie;
    
    // Verify cookie was set correctly (for debugging)
    if (debug) {
      const readBack = getCookie(name);
      if (readBack !== value) {
        log('warn', `Cookie ${name} may not have been set correctly. Expected: ${value}, Got: ${readBack}`);
      }
    }
  }

  function getCookie(name) {
    const nameEQ = name + '=';
    const ca = document.cookie.split(';');
    
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') {
        c = c.substring(1, c.length);
      }
      if (c.indexOf(nameEQ) === 0) {
        return c.substring(nameEQ.length, c.length);
      }
    }
    return null;
  }

  function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  // Cache visitor and session IDs to prevent regeneration during SPA navigation
  let cachedVisitorId = null;
  let cachedSessionId = null;
  // A session ends after 30 minutes without activity (matches the server).
  const SESSION_TIMEOUT_MS = 30 * 60 * 1000;
  let lastSessionActivity = 0;

  // Cross-domain ids passed as ?_pm_vid=...&_pm_sid=... by isAllowedHostname
  // links. Both are read once, before either is removed from the URL.
  let crossDomainIds = null;

  function readCrossDomainIds() {
    if (crossDomainIds) return crossDomainIds;
    crossDomainIds = { vid: null, sid: null };
    try {
      const url = new URL(window.location.href);
      const vid = url.searchParams.get('_pm_vid');
      const sid = url.searchParams.get('_pm_sid');
      crossDomainIds.vid = vid || null;
      crossDomainIds.sid = sid || null;
      if (url.searchParams.has('_pm_vid') || url.searchParams.has('_pm_sid')) {
        url.searchParams.delete('_pm_vid');
        url.searchParams.delete('_pm_sid');
        try {
          window.history.replaceState(window.history.state, '', url.toString());
        } catch (e) {}
      }
    } catch (e) {}
    return crossDomainIds;
  }

  function isValidId(value) {
    return typeof value === 'string' && /^[A-Za-z0-9_-]{1,64}$/.test(value);
  }

  function getVisitorId() {
    // Return cached value if available (prevents regeneration during SPA navigation)
    if (cachedVisitorId) {
      return cachedVisitorId;
    }
    // First, try to read from cookie (most reliable source)
    let vid = getCookie('_pm_vid');

    // If not in cookie, check URL parameter (for cross-domain tracking)
    if (!vid) {
      const fromUrl = readCrossDomainIds().vid;
      if (isValidId(fromUrl)) {
        vid = fromUrl;
        setCookie('_pm_vid', vid, 365);
      }
    }

    // No cookie and no URL param - generate new visitor ID
    if (!vid) {
      vid = generateUUID();
      setCookie('_pm_vid', vid, 365);
      
      if (debug) {
        log('info', 'Generated new visitor ID:', vid);
      }
    }

    // Cache the visitor ID for this page load
    cachedVisitorId = vid;
    return vid;
  }

  function getSessionId() {
    // Return the cached value during SPA navigation, but never past 30 minutes
    // of inactivity: an idle tab must start a new session.
    if (cachedSessionId) {
      if (Date.now() - lastSessionActivity < SESSION_TIMEOUT_MS) {
        return cachedSessionId;
      }
      cachedSessionId = null;
    }

    // First, try to read from cookie (most reliable source). The cookie
    // expires 30 minutes after the last event, in any tab.
    let sid = getCookie('_pm_sid');

    // If not in cookie, check URL parameter (for cross-domain tracking)
    if (!sid) {
      const fromUrl = readCrossDomainIds().sid;
      if (isValidId(fromUrl)) {
        sid = fromUrl;
        // Consume it: an expired session must not be revived from the URL.
        crossDomainIds.sid = null;
        setCookie('_pm_sid', sid, 1/48); // 30 minutes
      }
    }

    // No cookie and no URL param - the session expired or never existed
    if (!sid) {
      sid = 's' + generateUUID();
      setCookie('_pm_sid', sid, 1/48); // 30 minutes

      if (debug) {
        log('info', 'Generated new session ID:', sid);
      }
    }

    // Cache the session ID for this page load
    cachedSessionId = sid;
    lastSessionActivity = Date.now();
    return sid;
  }

  /**
   * Record activity on the current session: keeps the cached id alive and
   * pushes the session cookie's 30-minute expiry forward.
   */
  function touchSession(sid) {
    if (!isValidId(sid)) return;
    cachedSessionId = sid;
    lastSessionActivity = Date.now();
    setCookie('_pm_sid', sid, 1/48);
  }

  /**
   * The server may start a new session (e.g. the old one expired); adopt the
   * id it returns. Uses getAllResponseHeaders so a missing header never logs
   * a CORS error.
   */
  function adoptServerSessionId(xhr) {
    try {
      const headers = xhr.getAllResponseHeaders() || '';
      const match = headers.match(/^x-pm-session-id:\s*([^\r\n]+)/im);
      if (match && isValidId(match[1].trim())) {
        return match[1].trim();
      }
    } catch (e) {}
    return null;
  }

  // Process queued calls
  let queuedCalls = [];
  if (window.postmetric && window.postmetric.q && Array.isArray(window.postmetric.q)) {
    queuedCalls = window.postmetric.q.map(call => Array.from(call));
  }

  // Check if tracking is enabled
  let trackingEnabled = true;
  let disabledReason = '';

  // Bot detection
  if (trackingEnabled && isBot()) {
    trackingEnabled = false;
    disabledReason = 'Tracking disabled - bot detected';
  }

  // Localhost and file protocol checks
  const allowFileProtocol = getAttr(DATA_PREFIX + 'allow-file-protocol') === 'true';
  const disablePayments = getAttr(DATA_PREFIX + 'disable-payments') === 'true';
  const allowLocalhost = getAttr(DATA_PREFIX + 'allow-localhost') === 'true';

  if (
    trackingEnabled &&
    ((isLocalhost(window.location.hostname) && !allowLocalhost) ||
     (window.location.protocol === 'file:' && !allowFileProtocol))
  ) {
    trackingEnabled = false;
    disabledReason =
      window.location.protocol === 'file:'
        ? "Tracking disabled on file protocol (use data-allow-file-protocol='true' to enable)"
        : "Tracking disabled on localhost (use data-allow-localhost='true' to enable)";
  }

  // Iframe check
  const debug = getAttr(DATA_PREFIX + 'debug') === 'true';
  const disableConsole = getAttr(DATA_PREFIX + 'disable-console') === 'true';

  if (trackingEnabled && window !== window.parent && !debug) {
    trackingEnabled = false;
    disabledReason = 'Tracking disabled inside an iframe';
  }

  // Required configuration (already set above from data attributes)
  const allowedHostnames = getAttr(DATA_PREFIX + 'allowed-hostnames');
  const allowedHostnamesList = allowedHostnames
    ? allowedHostnames.split(',').map(h => h.trim()).filter(Boolean)
    : [];

  if (!trackingEnabled || (!websiteId || !domain)) {
    trackingEnabled = false;
    disabledReason = 'Missing website ID or domain';
  }

  // ============================================================================
  // Logging
  // ============================================================================

  function log(level, message, ...args) {
    if (disableConsole) return;
    
    const prefix = 'PostMetric:';
    switch (level) {
      case 'info':
      default:
        break;
      case 'warn':
        break;
      case 'error':
        break;
    }
  }

  // ============================================================================
  // API Configuration
  // ============================================================================

  // Determine API URL
  let apiUrl;
  const customApiUrl = getAttr(DATA_PREFIX + 'api-url');

  if (customApiUrl) {
    try {
      new URL(customApiUrl);
      apiUrl = customApiUrl;
    } catch {
      try {
        apiUrl = new URL(customApiUrl, window.location.origin).href;
      } catch {
        log('error', `Could not construct valid URL from data-api-url "${customApiUrl}". Falling back to ${DEFAULT_API_URL}`);
        apiUrl = DEFAULT_API_URL;
      }
    }
  } else {
    // Use the API URL determined from script location
    apiUrl = DEFAULT_API_URL;
  }

  /**
   * Resolve the goals / identify endpoint.
   * 1. An explicit data-goals-url / data-identify-url attribute wins.
   * 2. If apiUrl ends with /api/track (optionally behind a proxy prefix),
   *    swap that suffix: /pm/api/track -> /pm/api/goals/track.
   * 3. Otherwise (custom data-api-url path), use apiUrl's origin + defaultPath.
   */
  function resolveEndpoint(attrName, defaultPath) {
    const custom = getAttr(DATA_PREFIX + attrName);
    if (custom) {
      try {
        return new URL(custom, window.location.origin).href;
      } catch (e) {
        log('error', `Invalid data-${attrName} "${custom}". Ignoring it.`);
      }
    }
    try {
      const url = new URL(apiUrl, window.location.origin);
      if (/\/api\/track\/?$/.test(url.pathname)) {
        url.pathname = url.pathname.replace(/\/api\/track\/?$/, defaultPath);
        url.search = '';
        url.hash = '';
        return url.href;
      }
      return new URL(defaultPath, url.origin).href;
    } catch (e) {
      return defaultPath;
    }
  }

  const goalsUrl = resolveEndpoint('goals-url', '/api/goals/track');
  const identifyUrl = resolveEndpoint('identify-url', '/api/identify');

  // ============================================================================
  // Data Collection
  // ============================================================================

  function isSelfReferrerHost(referrerHost) {
    const host = (referrerHost || '').toLowerCase();
    if (!host) return false;
    if (host === (window.location.hostname || '').toLowerCase()) return true;
    const configured = normalizeDomain(domain).replace(/^www\./, '');
    if (configured && (host === configured || host.endsWith('.' + configured))) {
      return true;
    }
    for (const allowed of allowedHostnamesList) {
      const a = normalizeDomain(allowed);
      if (a && host === a) return true;
    }
    return false;
  }

  function collectPageData() {
    const href = window.location.href;
    if (!href) {
      log('warn', 'Unable to collect href. This may indicate incorrect script implementation or browser issues.');
      return;
    }

    const url = new URL(href);
    const adClickIds = {};

    // Extract ad click IDs
    const fbclid = url.searchParams.get('fbclid');
    const gclid = url.searchParams.get('gclid');
    const gclsrc = url.searchParams.get('gclsrc');
    const wbraid = url.searchParams.get('wbraid');
    const gbraid = url.searchParams.get('gbraid');
    const li_fat_id = url.searchParams.get('li_fat_id');
    const msclkid = url.searchParams.get('msclkid');
    const ttclid = url.searchParams.get('ttclid');
    const twclid = url.searchParams.get('twclid');

    if (gclid) adClickIds.gclid = gclid;
    if (gclsrc) adClickIds.gclsrc = gclsrc;
    if (wbraid) adClickIds.wbraid = wbraid;
    if (gbraid) adClickIds.gbraid = gbraid;
    if (li_fat_id) adClickIds.li_fat_id = li_fat_id;
    if (fbclid) adClickIds.fbclid = fbclid;
    if (msclkid) adClickIds.msclkid = msclkid;
    if (ttclid) adClickIds.ttclid = ttclid;
    if (twclid) adClickIds.twclid = twclid;

    // Extract UTM parameters
    const utmParams = {};
    const utmSource = url.searchParams.get('utm_source');
    const utmMedium = url.searchParams.get('utm_medium');
    const utmCampaign = url.searchParams.get('utm_campaign');
    const utmTerm = url.searchParams.get('utm_term');
    const utmContent = url.searchParams.get('utm_content');

    if (utmSource) utmParams.utm_source = utmSource;
    if (utmMedium) utmParams.utm_medium = utmMedium;
    if (utmCampaign) utmParams.utm_campaign = utmCampaign;
    if (utmTerm) utmParams.utm_term = utmTerm;
    if (utmContent) utmParams.utm_content = utmContent;

    

    const attributeReferrer = () => {
      const params = new URLSearchParams(window.location.search);    
      const paramSource =
        params.get("utm_source") ||
        params.get("ref") ||
        params.get("via");
    
      if (paramSource) return paramSource;
    
      if (document.referrer) {
        let referrerHost;
        try {
          referrerHost = new URL(document.referrer).hostname;
        } catch {
          return document.referrer;
        }
        // Navigation within the site (same host, the data-domain or its
        // subdomains, or a cross-domain allowed hostname) is not a source.
        if (isSelfReferrerHost(referrerHost)) return "direct";
        return referrerHost;
      }
      return "direct";
    };
    
    
    return {
      websiteId: websiteId,
      domain: domain,
      href: href,
      referrer: attributeReferrer(),
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      visitorId: getVisitorId(),
      sessionId: getSessionId(),
      adClickIds: Object.keys(adClickIds).length > 0 ? adClickIds : undefined,
      utmParams: Object.keys(utmParams).length > 0 ? utmParams : undefined,
    };
  }

  function sendEvent(eventData, callback) {
    if (localStorage.getItem('postmetric_ignore') === 'true') {
      log('info', 'Event ignored - tracking disabled via localStorage flag');
      if (callback) callback({ status: 200 });
      return;
    }

    if (isBot()) {
      log('info', 'Event ignored - bot detected');
      if (callback) callback({ status: 200 });
      return;
    }

    // Log event data being sent (for debugging)
    log('info', `[Tracking] Sending ${eventData.type || 'event'} to backend:`, {
      type: eventData.type,
      path: eventData.path,
      visitorId: eventData.visitorId,
      sessionId: eventData.sessionId,
      hostname: eventData.hostname,
      title: eventData.title
    });

    // Count this event as session activity right away (not only on success),
    // so the 30-minute inactivity window is measured from the last event.
    if (eventData.sessionId) touchSession(eventData.sessionId);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', apiUrl + '?site=' + encodeURIComponent(websiteId), true);
    xhr.setRequestHeader('Content-Type', 'application/json');

    xhr.onreadystatechange = function() {
      if (xhr.readyState === XMLHttpRequest.DONE) {
        if (xhr.status === 200) {
          log('info', `[Tracking] ${eventData.type || 'Event'} tracked successfully`, {
            path: eventData.path,
            visitorId: eventData.visitorId
          });
          const serverSid = adoptServerSessionId(xhr);
          touchSession(serverSid || eventData.sessionId || getSessionId());
        } else {
          log('error', `[Tracking] Failed to track ${eventData.type || 'event'} - HTTP ${xhr.status}`, {
            path: eventData.path,
            visitorId: eventData.visitorId
          });
        }
        if (callback) callback({ status: xhr.status });
      }
    };

    xhr.send(JSON.stringify(eventData));
  }

  let lastPageviewTime = 0;
  let lastPageviewUrl = '';

  /** Page identity for pageview de-duplication: ignores the URL hash. */
  function getPageKey() {
    return window.location.origin + window.location.pathname + window.location.search;
  }

  function trackPageview(callback) {
    if (!trackingEnabled) {
      log('info', `Pageview ignored - ${disabledReason}`);
      if (callback) callback({ status: 200 });
      return;
    }

    const now = Date.now();
    // The page is identified by origin + pathname + search: a hash-only
    // change is the same page.
    const currentUrl = getPageKey();

    // Throttle: ignore if same URL within 1 minute
    if (currentUrl === lastPageviewUrl && now - lastPageviewTime < 60000) {
      log('info', 'Pageview ignored - throttled (same URL within 1 minute)');
      if (callback) callback({ status: 200 });
      return;
    }

    lastPageviewTime = now;
    lastPageviewUrl = currentUrl;

    // Save to sessionStorage
    try {
      sessionStorage.setItem(
        'postmetric_pageview_state',
        JSON.stringify({ time: now, url: currentUrl })
      );
    } catch (e) {}

    const eventData = collectPageData();
    eventData.type = 'pageview';
    eventData.path = window.location.pathname + window.location.search;
    eventData.title = document.title;
    eventData.hostname = window.location.hostname;

    // Log current page path and visitor ID with more details
    log('info', `[Pageview] Tracking pageview:`, {
      path: eventData.path,
      fullUrl: window.location.href,
      title: eventData.title,
      visitorId: eventData.visitorId,
      sessionId: eventData.sessionId,
      hostname: eventData.hostname
    });

    sendEvent(eventData, callback);
  }

  /**
   * Track payment event
   */
  function trackPayment(provider, sessionId, callback) {
    if (!trackingEnabled) {
      log('info', `Payment event ignored - ${disabledReason}`);
      if (callback) callback({ status: 200 });
      return;
    }

    const eventData = collectPageData();
    eventData.type = 'payment';

    if (provider === 'email') {
      eventData.extraData = { email: sessionId };
    } else if (provider === 'stripe') {
      eventData.extraData = { stripe_session_id: sessionId };
    } else if (provider === 'lemonsqueezy') {
      eventData.extraData = { lemonsqueezy_order_id: sessionId };
    } else if (provider === 'polar') {
      eventData.extraData = { polar_checkout_id: sessionId };
    }

    sendEvent(eventData, callback);
  }

  /**
   * Track custom goal event
   * Supports: trackGoal("signup") or trackGoal("initiate_checkout", { price: "49", currency: "USD" })
   */
  function trackGoal(eventName, customData, callback) {
    if (!trackingEnabled) {
      log('info', `Goal '${eventName}' ignored - ${disabledReason}`);
      if (callback) callback({ status: 200 });
      return;
    }

    const path = window.location.pathname + window.location.search;
    // The _pm_* cookies live on this site's domain and are not sent to the
    // PostMetric host, so the ids travel with the goal explicitly.
    const visitorId = getVisitorId();
    const sessionId = getSessionId();
    touchSession(sessionId);

    // Use POST when we have custom params (beyond value) for richer analytics
    const hasCustomParams = customData && Object.keys(customData).length > 0;
    const usePost = hasCustomParams;

    if (usePost) {
      const payload = {
        event: eventName,
        path: path,
        value: customData && customData.value != null ? Number(customData.value) : undefined,
        visitorId: visitorId,
        sessionId: sessionId,
      };
      const sanitized = sanitizeCustomData(customData);
      if (sanitized && typeof sanitized === 'object') {
        for (const [k, v] of Object.entries(sanitized)) {
          if (
            k !== 'value' &&
            k !== 'event' &&
            k !== 'path' &&
            k !== 'eventname' &&
            k !== 'visitorid' &&
            k !== 'sessionid'
          ) {
            payload[k] = v;
          }
        }
      }
      const xhr = new XMLHttpRequest();
      xhr.open('POST', goalsUrl + '?site=' + encodeURIComponent(websiteId), true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.onreadystatechange = function() {
        if (xhr.readyState === XMLHttpRequest.DONE && callback) callback({ status: xhr.status });
      };
      xhr.send(JSON.stringify(payload));
    } else {
      // GET beacon for simple goals (no custom params)
      const goalUrl =
        goalsUrl +
        '?site=' + encodeURIComponent(websiteId) +
        '&event=' + encodeURIComponent(eventName) +
        (customData && customData.value != null ? '&value=' + encodeURIComponent(customData.value) : '') +
        '&path=' + encodeURIComponent(path) +
        '&visitorId=' + encodeURIComponent(visitorId) +
        '&sessionId=' + encodeURIComponent(sessionId);
      const img = new Image(1, 1);
      img.src = goalUrl;
      if (callback) callback({ status: 200 });
    }
  }

  /**
   * Sanitize custom data
   */
  function sanitizeCustomData(data) {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      log('warn', 'customData must be a non-null object');
      return {};
    }

    const sanitized = {};
    let paramCount = 0;

    function sanitizeValue(value) {
      if (value == null) return '';
      let str = String(value);
      // Limit length to prevent DoS
      if (str.length > 255) str = str.substring(0, 255);
      // Remove XSS vectors
      str = str
        .replace(/[<>'"&]/g, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+=/gi, '')
        .replace(/data:/gi, '')
        .replace(/vbscript:/gi, '')
        .replace(/expression\(/gi, '')
        .replace(/import\s+/gi, '')
        .replace(/@import/gi, '')
        .trim();
      return str;
    }

    for (const [key, value] of Object.entries(data)) {
      if (key === 'eventName') {
        sanitized[key] = sanitizeValue(value);
        continue;
      }

      if (paramCount >= 10) {
        log('error', 'Maximum 10 custom parameters allowed');
        return null;
      }

      if (
        typeof key !== 'string' ||
        key.length === 0 ||
        key.length > 32 ||
        !/^[a-z0-9_-]+$/.test(key.toLowerCase())
      ) {
        log(
          'error',
          `Invalid property name "${key}". Use only lowercase letters, numbers, underscores, and hyphens. Max 32 characters.`
        );
        return null;
      }

      const lowerKey = key.toLowerCase();
      sanitized[lowerKey] = sanitizeValue(value);
      paramCount++;
    }

    return sanitized;
  }

  /**
   * Main tracking function (public API)
   * postmetric("signup") - track goal by name
   * postmetric("initiate_checkout", { price: "49", currency: "USD" }) - goal with custom params
   * postmetric("payment", { email: "..." }) - payment event
   * postmetric("identify", { user_id: "...", email: "..." }) - identify user
   */
  function postmetric(goalName, customData, callback) {
    if (!trackingEnabled) {
      log('info', `Event '${goalName}' ignored - ${disabledReason}`);
      if (callback) callback({ status: 200 });
      return;
    }

    if (!goalName || typeof goalName !== 'string') {
      log('warn', 'Missing goal name');
      return;
    }

    // Payment event
    if (goalName === 'payment') {
      if (!customData || !customData.email) {
        log('warn', 'Missing email for payment event');
        return;
      }
      // Not a goal: the email lets the server tie this customer's payment
      // to the visitor when the provider syncs it.
      trackPayment('email', String(customData.email), callback);
      return;
    }

    // Identify event
    if (goalName === 'identify') {
      if (!customData || !customData.user_id) {
        log('warn', 'Missing user_id for identify event');
        return;
      }
      identifyUser(customData.user_id, customData, callback);
      return;
    }

    // Goal tracking - first arg is the goal/event name
    const params = customData && typeof customData === 'object' && !Array.isArray(customData)
      ? customData
      : {};
    const sanitized = sanitizeCustomData(params);
    if (sanitized === null) {
      log('error', 'Goal params rejected due to validation errors');
      return;
    }
    trackGoal(goalName, sanitized, callback);
  }

  /**
   * Identify user
   */
  function identifyUser(userId, userData, callback) {
    if (!trackingEnabled) {
      log('info', `Identify event ignored - ${disabledReason}`);
      if (callback) callback({ status: 200 });
      return;
    }

    const xhr = new XMLHttpRequest();
    xhr.open('POST', identifyUrl, true);
    xhr.setRequestHeader('Content-Type', 'application/json');

    xhr.onreadystatechange = function() {
      if (xhr.readyState === XMLHttpRequest.DONE) {
        if (xhr.status === 200) {
          log('info', 'User identified successfully');
        } else {
          log('error', 'Failed to identify user - HTTP ' + xhr.status);
        }
        if (callback) callback({ status: xhr.status });
      }
    };

    xhr.send(
      JSON.stringify({
        site: websiteId,
        userId: userId,
        email: userData.email,
        name: userData.name,
        visitorId: getVisitorId(),
        sessionId: getSessionId(),
      })
    );
  }

  // ============================================================================
  // External Link Tracking
  // ============================================================================

  /**
   * Get root domain
   */
  function getRootDomain(hostname) {
    if (!hostname) return null;
    const parts = hostname.replace(/^www\./, '').split('.');
    return parts.length >= 2 ? parts.slice(-2).join('.') : hostname;
  }

  /**
   * Check if hostname is allowed
   */
  function isAllowedHostname(hostname) {
    if (!hostname) return false;
    if (hostname === domain) return true;
    for (const allowed of allowedHostnamesList) {
      if (hostname === allowed) return true;
    }
    return false;
  }

  /**
   * Track external link click
   */
  function trackExternalLink(link) {
    if (!link || !link.href) return;

    try {
      const url = new URL(link.href);
      if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

      const linkHostname = url.hostname;
      const currentHostname = window.location.hostname;

      // Same hostname - don't track
      if (linkHostname === currentHostname) return;

      // Same root domain - don't track
      if (getRootDomain(linkHostname) === getRootDomain(currentHostname)) return;

      // Allowed hostname - add tracking params but don't track as external
      if (isAllowedHostname(linkHostname)) {
        try {
          const linkUrl = new URL(link.href);
          linkUrl.searchParams.set('_pm_vid', getVisitorId());
          linkUrl.searchParams.set('_pm_sid', getSessionId());
          link.href = linkUrl.toString();
        } catch {}
        return;
      }

      const eventData = collectPageData();
      eventData.type = 'exit_link';
      eventData.path = window.location.pathname + window.location.search;
      eventData.title = document.title;
      eventData.hostname = window.location.hostname;
      eventData.extraData = {
        exitUrl: link.href,
        exitLinkText: link.textContent.trim().substring(0, 255),
      };

      sendEvent(eventData);
    } catch (e) {}
  }

  // ============================================================================
  // Goal Tracking via Data Attributes
  // ============================================================================

  /**
   * Track goal from data attribute
   * <button data-postmetric-goal="initiate_checkout" data-postmetric-goal-price="49">
   * Sends event "initiate_checkout" with { price: "49" }
   */
  function trackGoalFromElement(element) {
    const eventName = element.getAttribute('data-postmetric-goal');
    if (!eventName || !eventName.trim()) return;

    const goalParams = {};

    // Collect data-postmetric-goal-* attributes as custom params
    for (const attr of element.attributes) {
      if (
        attr.name.startsWith('data-postmetric-goal-') &&
        attr.name !== 'data-postmetric-goal'
      ) {
        // Strip the 21-char 'data-postmetric-goal-' prefix
        const key = attr.name.substring('data-postmetric-goal-'.length).replace(/-/g, '_');
        if (key) {
          goalParams[key] = attr.value;
        }
      }
    }

    const sanitized = sanitizeCustomData(Object.keys(goalParams).length ? goalParams : null);
    trackGoal(eventName.trim(), sanitized || {}, function() {});
  }

  // ============================================================================
  // Scroll Tracking
  // ============================================================================

  /**
   * Calculate scroll percentage
   */
  function getScrollPercentage() {
    const docHeight = Math.max(
      document.body.scrollHeight,
      document.body.offsetHeight,
      document.documentElement.clientHeight,
      document.documentElement.scrollHeight,
      document.documentElement.offsetHeight
    );
    const winHeight = window.innerHeight;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const trackLength = docHeight - winHeight;
    
    return trackLength <= 0 ? 100 : Math.min(100, Math.round((scrollTop / trackLength) * 100));
  }

  /**
   * Track scroll event for element
   */
  function trackScrollForElement(element, observer) {
    const eventName = element.getAttribute('data-postmetric-scroll');
    if (!eventName || !eventName.trim()) return;

    const delayAttr = element.getAttribute('data-postmetric-scroll-delay');
    let delay = 0;
    if (delayAttr !== null) {
      const parsed = parseInt(delayAttr, 10);
      if (!isNaN(parsed) && parsed >= 0) {
        delay = parsed;
      }
    }

    const track = () => {
      const rect = element.getBoundingClientRect();
      if (!(rect.bottom > 0 && rect.top < window.innerHeight)) {
        observer.unobserve(element);
        return;
      }

      const scrollPct = getScrollPercentage();
      const thresholdAttr = element.getAttribute('data-postmetric-scroll-threshold');
      let threshold = 0.5;
      if (thresholdAttr !== null) {
        const parsed = parseFloat(thresholdAttr);
        if (!isNaN(parsed) && parsed >= 0 && parsed <= 1) {
          threshold = parsed;
        }
      }

      const scrollData = {
        eventName: eventName.trim(),
        scroll_percentage: scrollPct.toString(),
        threshold: threshold.toString(),
        delay: delay.toString(),
      };

      // Collect additional data attributes
      for (const attr of element.attributes) {
        if (
          attr.name.startsWith('data-postmetric-scroll-') &&
          attr.name !== 'data-postmetric-scroll' &&
          attr.name !== 'data-postmetric-scroll-threshold' &&
          attr.name !== 'data-postmetric-scroll-delay'
        ) {
          // Strip the 23-char 'data-postmetric-scroll-' prefix
          const key = attr.name.substring('data-postmetric-scroll-'.length);
          if (key) {
            scrollData[key.replace(/-/g, '_')] = attr.value;
          }
        }
      }

      const sanitized = sanitizeCustomData(scrollData);
      if (sanitized !== null) {
        // Record the goal under its real name, not a generic "custom".
        delete sanitized.eventName;
        trackGoal(eventName.trim(), sanitized);
      }

      observer.unobserve(element);
    };

    if (delay > 0) {
      setTimeout(track, delay);
    } else {
      track();
    }
  }

  /**
   * Initialize scroll tracking
   */
  function initScrollTracking() {
    if (!window.IntersectionObserver) {
      log('warn', 'Intersection Observer not supported, scroll tracking disabled');
      return;
    }

    const elements = document.querySelectorAll('[data-postmetric-scroll]');
    if (elements.length === 0) return;

    // Group elements by threshold
    const thresholdMap = new Map();

    elements.forEach(element => {
      const thresholdAttr = element.getAttribute('data-postmetric-scroll-threshold');
      let threshold = 0.5;
      if (thresholdAttr !== null) {
        const parsed = parseFloat(thresholdAttr);
        if (!isNaN(parsed) && parsed >= 0 && parsed <= 1) {
          threshold = parsed;
        } else {
          log(
            'warn',
            `Invalid threshold value "${thresholdAttr}" for element. Using default 0.5. Threshold must be between 0 and 1.`
          );
        }
      }

      if (!thresholdMap.has(threshold)) {
        thresholdMap.set(threshold, []);
      }
      thresholdMap.get(threshold).push(element);
    });

    // Create observers for each threshold
    thresholdMap.forEach((elements, threshold) => {
      const observer = new IntersectionObserver(
        entries => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              trackScrollForElement(entry.target, observer);
            }
          });
        },
        {
          root: null,
          rootMargin: '0px',
          threshold: threshold,
        }
      );

      elements.forEach(element => {
        observer.observe(element);
      });
    });
  }

  // ============================================================================
  // Initialization
  // ============================================================================

  // Restore pageview state from sessionStorage
  (function() {
    try {
      const state = sessionStorage.getItem('postmetric_pageview_state');
      if (state) {
        const parsed = JSON.parse(state);
        lastPageviewTime = parsed.time || 0;
        lastPageviewUrl = parsed.url || '';
      }
    } catch (e) {
      lastPageviewTime = 0;
      lastPageviewUrl = '';
    }
  })();

  // Set up event listeners
  document.addEventListener('click', function(e) {
    const goalElement = e.target.closest('[data-postmetric-goal]');
    if (goalElement) {
      trackGoalFromElement(goalElement);
    }
    trackExternalLink(e.target.closest('a'));
  });

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      const goalElement = e.target.closest('[data-postmetric-goal]');
      if (goalElement) {
        trackGoalFromElement(goalElement);
      }
      trackExternalLink(e.target.closest('a'));
    }
  });

  // Initialize scroll tracking
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initScrollTracking);
  } else {
    initScrollTracking();
  }

  // ============================================================================
  // SPA Navigation Tracking (Framework Agnostic)
  // ============================================================================

  let navigationTimeout = null;
  // Strip cross-domain ?_pm_vid/_pm_sid params before recording the initial
  // URL, so cleaning them up does not look like a navigation.
  if (trackingEnabled) readCrossDomainIds();
  let lastTrackedUrl = getPageKey();

  /**
   * Handle navigation and auto-detect payment providers
   */
  function handleNavigation() {
    trackPageview();

    // Auto-detect payment providers. Sites that send visitor ids in checkout
    // metadata set data-disable-payments="true" so a payment isn't recorded
    // from both the success URL and the server.
    if (disablePayments) return;
    detectStripePayment();
    detectPolarPayment();
    detectLemonSqueezyPayment();
  }

  function detectStripePayment() {
    try {
      const url = new URL(window.location.href);
      const sessionId = url.searchParams.get('session_id');
      if (sessionId && sessionId.startsWith('cs_')) {
        const key = 'postmetric_stripe_payment_sent_' + sessionId;
        if (!sessionStorage.getItem(key)) {
          trackPayment('stripe', sessionId);
          sessionStorage.setItem(key, '1');
        }
      }
    } catch (e) {
      log('error', 'Error auto detecting Stripe session ID:', e);
    }
  }

  function detectPolarPayment() {
    try {
      const url = new URL(window.location.href);
      const checkoutId = url.searchParams.get('checkout_id');
      if (checkoutId) {
        const key = 'postmetric_polar_payment_sent_' + checkoutId;
        if (!sessionStorage.getItem(key)) {
          trackPayment('polar', checkoutId);
          sessionStorage.setItem(key, '1');
        }
      }
    } catch (e) {
      log('error', 'Error auto detecting Polar checkout ID:', e);
    }
  }

  function detectLemonSqueezyPayment() {
    try {
      const url = new URL(window.location.href);
      const orderId = url.searchParams.get('order_id');
      if (orderId) {
        const key = 'postmetric_lemonsqueezy_payment_sent_' + orderId;
        if (!sessionStorage.getItem(key)) {
          trackPayment('lemonsqueezy', orderId);
          sessionStorage.setItem(key, '1');
        }
      }
    } catch (e) {
      log('error', 'Error auto detecting Lemonsqueezy order ID:', e);
    }
  }

  /**
   * Debounced navigation handler to prevent duplicate tracking
   */
  function debouncedNavigation() {
    if (navigationTimeout) clearTimeout(navigationTimeout);
    navigationTimeout = setTimeout(handleNavigation, 100);
  }

  /**
   * Check if URL has changed and trigger tracking if needed
   */
  function checkUrlChange() {
    // Compare pathname + search only: hash-only changes are not new pages
    const currentUrl = getPageKey();
    const currentPath = window.location.pathname + window.location.search;

    // Only track if the URL has actually changed
    if (currentUrl !== lastTrackedUrl) {
      const previousUrl = lastTrackedUrl;
      lastTrackedUrl = currentUrl;
      
      // Log navigation event for debugging
      log('info', `[Navigation] URL changed:`, {
        from: previousUrl,
        to: currentUrl,
        path: currentPath,
        visitorId: getVisitorId(),
        sessionId: getSessionId()
      });
      
      debouncedNavigation();
      return true;
    }
    
    return false;
  }

  // ============================================================================
  // Setup Navigation Listeners
  // ============================================================================

  // Track initial pageview
  handleNavigation();

  // Method 1: History API interception (pushState/replaceState)
  // This catches most SPA navigation (React Router, Vue Router, Angular, etc.)
  const originalPushState = window.history.pushState;
  const originalReplaceState = window.history.replaceState;

  window.history.pushState = function() {
    originalPushState.apply(this, arguments);
    checkUrlChange();
  };

  window.history.replaceState = function() {
    originalReplaceState.apply(this, arguments);
    checkUrlChange();
  };

  // Method 2: Popstate event (browser back/forward buttons)
  window.addEventListener('popstate', function() {
    checkUrlChange();
  });

  // Method 3: Hash changes (for hash-based routing)
  window.addEventListener('hashchange', function() {
    checkUrlChange();
  });

  // Method 4: Polling fallback for frameworks that don't use History API
  // Some older SPAs or custom routing solutions may not trigger the above events
  let lastPolledUrl = window.location.href;
  const pollInterval = setInterval(function() {
    const currentUrl = window.location.href;
    if (currentUrl !== lastPolledUrl) {
      lastPolledUrl = currentUrl;
      checkUrlChange();
    }
  }, 2000); // Check every 2 seconds

  // Method 5: Visibility change (when user returns to tab)
  // This ensures we catch any navigation that happened while tab was hidden
  document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
      checkUrlChange();
    }
  });

  // Clean up interval on page unload (good practice)
  window.addEventListener('beforeunload', function() {
    if (pollInterval) {
      clearInterval(pollInterval);
    }
  });

  // ============================================================================
  // Public API
  // ============================================================================

  // Expose global function
  window.postmetric = postmetric;

  // Process queued calls
  if (window.postmetric.q) {
    delete window.postmetric.q;
  }

  (function() {
    while (queuedCalls.length > 0) {
      const call = queuedCalls.shift();
      if (Array.isArray(call) && call.length > 0) {
        try {
          postmetric.apply(null, call);
        } catch (e) {
          log('error', 'Error processing queued call:', e, call);
        }
      }
    }
  })();

  // Warn if tracking is disabled
  if (!trackingEnabled) {
    log('warn', disabledReason);
  }
})();