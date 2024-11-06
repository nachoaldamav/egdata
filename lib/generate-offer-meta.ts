import type { SingleOffer } from '@/types/single-offer';
import { getImage } from './get-image';

export const generateOfferMeta = (
  offer: SingleOffer,
  section?: string
): Array<React.JSX.IntrinsicElements['meta']> => {
  return [
    {
      title: `${offer?.title}${section ? ` - ${section}` : ''} | egdata.app`,
    },
    {
      name: 'description',
      content: section
        ? `Explore ${offer?.title} ${section.toLowerCase()}.`
        : `Explore ${offer?.title} information.`,
    },
    {
      name: 'og:title',
      content: `${offer?.title}${section ? ` - ${section}` : ''} | egdata.app`,
    },
    {
      name: 'og:description',
      content: section
        ? `Explore ${offer?.title} ${section.toLowerCase()}.`
        : `Explore ${offer?.title} information.`,
    },
    {
      name: 'og:image',
      content:
        getImage(offer?.keyImages ?? [], [
          'OfferImageWide',
          'DieselGameBoxWide',
          'DieselStoreFrontWide',
        ])?.url ?? '/placeholder.webp',
    },
    {
      name: 'og:type',
      content: 'website',
    },
    {
      name: 'twitter:card',
      content: 'summary_large_image',
    },
    {
      name: 'twitter:title',
      content: `${offer?.title}${section ? ` - ${section}` : ''} | egdata.app`,
    },
    {
      name: 'twitter:description',
      content: section
        ? `Explore ${offer?.title} ${section.toLowerCase()}.`
        : `Explore ${offer?.title} information.`,
    },
    {
      name: 'twitter:image',
      content:
        getImage(offer?.keyImages ?? [], [
          'OfferImageWide',
          'DieselGameBoxWide',
          'DieselStoreFrontWide',
        ])?.url ?? '/placeholder.webp',
    },
  ];
};
