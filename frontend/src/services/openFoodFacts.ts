// Optional product lookup via Open Food Facts. The app works fully without it:
// any failure (offline, not found, timeout) resolves to a graceful null.

export interface OffProduct {
  name: string | null;
  brand: string | null;
  imageUrl: string | null;
}

const TIMEOUT_MS = 6000;

export async function lookupBarcode(
  barcode: string,
): Promise<OffProduct | null> {
  const code = barcode.trim();
  if (!code) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(
      code,
    )}.json?fields=product_name,brands,image_front_small_url`;
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "BelegGuard/1.0 (Facil Labs; local-first app)",
      },
    });
    if (!res.ok) return null;
    const json = await res.json();
    if (json?.status !== 1 || !json?.product) return null;

    const p = json.product;
    const name = (p.product_name || "").trim();
    const brand = (p.brands || "").split(",")[0]?.trim() || null;
    return {
      name: name || null,
      brand,
      imageUrl: p.image_front_small_url || null,
    };
  } catch {
    // offline / timeout / parse error — caller falls back to manual entry
    return null;
  } finally {
    clearTimeout(timer);
  }
}
