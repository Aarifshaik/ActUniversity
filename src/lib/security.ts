export function setupCSP() {
  const meta = document.createElement('meta');
  meta.httpEquiv = 'Content-Security-Policy';
  meta.content = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://*.supabase.co",
    "media-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join('; ');

  document.head.appendChild(meta);
}

export function preventDevTools() {
  document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
  });

  document.addEventListener('keydown', (e) => {
    if (
      e.key === 'F12' ||
      (e.ctrlKey && e.shiftKey && e.key === 'I') ||
      (e.ctrlKey && e.shiftKey && e.key === 'J') ||
      (e.ctrlKey && e.key === 'U')
    ) {
      e.preventDefault();
    }
  });

  if (typeof window !== 'undefined') {
    const detectDevTools = () => {
      const threshold = 160;
      if (
        window.outerWidth - window.innerWidth > threshold ||
        window.outerHeight - window.innerHeight > threshold
      ) {
        console.log('Security notice: DevTools usage is monitored');
      }
    };

    setInterval(detectDevTools, 1000);
  }
}

export function preventScreenCapture() {
  const style = document.createElement('style');
  style.textContent = `
    @media print {
      body { display: none !important; }
    }
    * {
      -webkit-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
      user-select: none;
    }
    input, textarea {
      -webkit-user-select: text;
      -moz-user-select: text;
      -ms-user-select: text;
      user-select: text;
    }
  `;
  document.head.appendChild(style);
}

export function detectAutomation(): boolean {
  if (typeof navigator === 'undefined') return false;

  return !!(
    (navigator as any).webdriver ||
    (window as any).document.documentElement.getAttribute('webdriver') ||
    (navigator as any).plugins?.length === 0 ||
    !(navigator as any).languages
  );
}

export class RateLimiter {
  private requests: Map<string, number[]> = new Map();

  constructor(
    private maxRequests: number = 10,
    private windowMs: number = 60000
  ) {}

  check(key: string): boolean {
    const now = Date.now();
    const timestamps = this.requests.get(key) || [];

    const validTimestamps = timestamps.filter(
      (timestamp) => now - timestamp < this.windowMs
    );

    if (validTimestamps.length >= this.maxRequests) {
      return false;
    }

    validTimestamps.push(now);
    this.requests.set(key, validTimestamps);

    return true;
  }
}

export function generateSignedUrl(
  contentUrl: string,
  ttlSeconds: number = 60
): string {
  const expires = Date.now() + ttlSeconds * 1000;
  const token = btoa(`${contentUrl}:${expires}`);

  return `/api/content/stream?token=${token}`;
}

export function validateSignedUrl(token: string): { valid: boolean; url?: string } {
  try {
    const decoded = atob(token);
    const [url, expiresStr] = decoded.split(':');
    const expires = parseInt(expiresStr, 10);

    if (Date.now() > expires) {
      return { valid: false };
    }

    return { valid: true, url };
  } catch {
    return { valid: false };
  }
}

export function createWatermark(empId: string, sessionId: string): string {
  const timestamp = new Date().toISOString();
  return `${empId} | ${timestamp} | ${sessionId.slice(0, 8)}`;
}

export function applyWatermarkToElement(element: HTMLElement, watermark: string): void {
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: absolute;
    top: 10px;
    right: 10px;
    background: rgba(255, 255, 255, 0.8);
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 10px;
    font-family: monospace;
    color: #64748B;
    pointer-events: none;
    z-index: 9999;
  `;
  overlay.textContent = watermark;

  if (element.style.position === '' || element.style.position === 'static') {
    element.style.position = 'relative';
  }

  element.appendChild(overlay);
}
