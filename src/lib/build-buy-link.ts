// Bundle direct link
// https://store.epicgames.com/purchase?highlightColor=0078f2&offers=1-883178bfb8b94ce9b95e1e60bec225ed-48a399d8a7f6448daf7bdee752c8fb6d-&showNavigation=true

import type { SingleOffer } from '~/types/single-offer';

// Multioffer direct link
// https://store.epicgames.com/purchase?highlightColor=0078f2&offers=1-42c70202dc684966a827bfcb7b49ac5f-cd1610921c934f588d95b7d0d3750730-&offers=1-dbfff2d3f4dc446b8f4931ed8a353685-90d3d1bf246c4aeda03e36a167b463a2-&offers=1-e424e1d51e114ae8b6d685c943043cd7-f8b1645ba22a44439f3b68daec1ba1ee-&showNavigation=true

export function getBuyLink({
  offers,
}: {
  offers: SingleOffer[];
}): string {
  const offerList: {
    offerId: string;
    namespace: string;
    quantity: number;
  }[] = offers.map((offer) => ({
    offerId: offer.id,
    namespace: offer.namespace,
    quantity: 1,
  }));

  const url = new URL('https://store.epicgames.com/purchase');
  url.searchParams.set('showNavigation', 'true');
  url.searchParams.set('highlightColor', '4ade80');

  for (const offer of offerList) {
    url.searchParams.append('offers', `${offer.quantity}-${offer.namespace}-${offer.offerId}-`);
  }

  return url.toString();
}
