// Seller helper functions for handling seller identification
// Supports both legacy username-based keys and new UID-based keys

export function legacySellerKeyFromUsername(username) {
  if (!username) return null;
  return 'legacy_' + String(username).replace(/[.#$\[\]\/\s]/g, '_');
}

export function getSellerKeyForProduct(product, sellerUsernameFallback) {
  if (!product) return null;
  // Use ownerUid if available and not null/empty
  if (product.ownerUid && product.ownerUid.trim?.() !== '') {
    return product.ownerUid;
  }
  // Fall back to username-based key
  const sellerName = product.username || sellerUsernameFallback;
  if (!sellerName) return null;
  return legacySellerKeyFromUsername(sellerName);
}

export function isViewerTheSeller(product, viewerUid, viewerUsername, sellerUsernameFallback) {
  if (!product) return false;
  if (product.ownerUid && viewerUid) return product.ownerUid === viewerUid;
  const sellerName = product.username || sellerUsernameFallback;
  if (sellerName && viewerUsername) return sellerName === viewerUsername;
  return false;
}

export function formatReviewDate(iso) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}
