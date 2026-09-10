/**
 * Web Checkout de Wompi. CloudFront bloquea 403 si `redirect-url` apunta a
 * http://localhost (WAF). `URLSearchParams` también convierte `signature:integrity`
 * en `signature%3Aintegrity`; Wompi exige el nombre con dos puntos literal.
 */
export function buildWompiCheckoutUrl(input: {
  publicKey: string;
  amountInCents: number;
  reference: string;
  signature: string;
  redirectUrl?: string;
  currency?: string;
}): string {
  const params = new URLSearchParams();
  params.set('public-key', input.publicKey);
  params.set('currency', input.currency ?? 'COP');
  params.set('amount-in-cents', String(input.amountInCents));
  params.set('reference', input.reference);
  const redirect = input.redirectUrl?.trim();
  if (redirect && isAllowedWompiRedirect(redirect)) {
    params.set('redirect-url', redirect);
  }
  return `https://checkout.wompi.co/p/?${params.toString()}&signature:integrity=${encodeURIComponent(input.signature)}`;
}

function isAllowedWompiRedirect(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') return false;
    const host = parsed.hostname.toLowerCase();
    return host !== 'localhost' && host !== '127.0.0.1';
  } catch {
    return false;
  }
}
