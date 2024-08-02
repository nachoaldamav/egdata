import type { SingleOffer } from '~/types/single-offer';
import { Button } from '../ui/button';
import { Link } from '@remix-run/react';
import { EGSIcon } from '../icons/egs';
import { getSession, getTempUserId } from '~/lib/user-info';
import Bugsnag from '@bugsnag/js';

function trackEvent(offer: SingleOffer) {
  const userId = getTempUserId();
  const session = getSession();

  const trackData = {
    event: 'open-egs',
    location: window.location.href,
    params: {
      offerId: offer.id,
      offerNamespace: offer.namespace,
    },
    userId,
    session,
  };

  navigator.serviceWorker.controller?.postMessage({
    type: 'track',
    payload: trackData,
  });
}

export function OpenEgs({
  offer,
}: {
  offer: SingleOffer;
}) {
  Bugsnag.notify(new Error('Test error'));
  const urlType: 'product' | 'url' = offer.offerType === 'BASE_GAME' ? 'product' : 'url';
  const isBundle = offer.offerType === 'BUNDLE';
  const namespace = isBundle ? 'bundles' : 'product';
  const url =
    offer.customAttributes?.['com.epicgames.app.productSlug']?.value ??
    offer.offerMappings?.[0]?.pageSlug ??
    (urlType === 'product' ? offer.productSlug : offer.urlSlug);

  if (!url) {
    return null;
  }

  return (
    <Button
      asChild
      className="bg-gray-900 text-white dark:hover:text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 dark:bg-gray-800 dark:hover:bg-gray-700 dark:focus:ring-gray-700"
    >
      <Link
        to={`https://store.epicgames.com/${namespace}/${url}?utm_source=egdata.app`}
        rel="noopener noreferrer"
        referrerPolicy="no-referrer"
        target="_blank"
        onClick={() => trackEvent(offer)}
      >
        <div className="flex items-center justify-center gap-2">
          <EGSIcon className="h-6 w-6" />
          <span className="font-semibold">Store</span>
        </div>
      </Link>
    </Button>
  );
}
