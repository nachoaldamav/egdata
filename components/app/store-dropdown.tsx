import { ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import type { SingleOffer } from '@/types/single-offer';
import { EpicGamesIcon } from '../icons/epic';
import { EGSIcon } from '../icons/egs';

export function StoreDropdown({ offer }: { offer: SingleOffer }) {
  return (
    <div className="w-[200px]">
      <DropdownMenu>
        <DropdownMenuTrigger className="flex w-full items-center justify-between rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800">
          <span className="flex items-center gap-2">View Store Page</span>
          <ChevronDown className="h-4 w-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-[200px] bg-zinc-900 text-white">
          <OpenEgs offer={offer} />
          <OpenEgl offer={offer} />
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function trackEvent(offer: SingleOffer) {
  window.umami.track('open-egs', {
    id: offer.id,
    namespace: offer.namespace,
  });
}

function OpenEgl({ offer }: { offer: SingleOffer }) {
  const urlType: 'product' | 'url' =
    offer.offerType === 'BASE_GAME' ? 'product' : 'url';
  const isBundle = offer.offerType === 'BUNDLE';
  const namespace = isBundle ? 'bundles' : 'product';
  const url =
    offer.customAttributes?.['com.epicgames.app.productSlug']?.value ??
    offer.offerMappings?.[0]?.pageSlug ??
    offer.urlSlug ??
    (urlType === 'product' ? offer.productSlug : offer.urlSlug);

  if (!url) {
    return null;
  }

  return (
    <DropdownMenuItem
      className="flex items-center gap-3 px-4 py-2 hover:bg-zinc-800 cursor-pointer"
      onClick={() => {
        trackEvent(offer);
        open(
          `com.epicgames.launcher://store/${namespace}/${url}?utm_source=egdata.app`,
        );
      }}
    >
      <div className="flex items-center justify-center gap-2">
        <EpicGamesIcon className="size-5" />
        <span className="font-semibold">Launcher</span>
      </div>
    </DropdownMenuItem>
  );
}

function OpenEgs({ offer }: { offer: SingleOffer }) {
  const urlType: 'product' | 'url' =
    offer.offerType === 'BASE_GAME' ? 'product' : 'url';
  const isBundle = offer.offerType === 'BUNDLE';
  const namespace = isBundle ? 'bundles' : 'product';
  const url =
    offer.customAttributes?.['com.epicgames.app.productSlug']?.value ??
    offer.offerMappings?.[0]?.pageSlug ??
    offer.urlSlug ??
    (urlType === 'product' ? offer.productSlug : offer.urlSlug);

  if (!url) {
    return null;
  }

  return (
    <DropdownMenuItem
      asChild
      className="flex items-center gap-3 px-4 py-2 hover:bg-zinc-800 cursor-pointer"
    >
      <a
        href={`https://store.epicgames.com/${namespace}/${url}?utm_source=egdata.app`}
        rel="noopener noreferrer"
        referrerPolicy="no-referrer"
        target="_blank"
        onClick={() => trackEvent(offer)}
      >
        <div className="flex items-center justify-center gap-2">
          <EGSIcon className="size-6 w-[20px]" />
          <span className="font-semibold">Web Browser</span>
        </div>
      </a>
    </DropdownMenuItem>
  );
}