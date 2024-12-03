import { useQuery } from '@tanstack/react-query';
import { useState, useRef, useEffect } from 'react';
import { httpClient } from '@/lib/http-client';
import { getImage } from '@/lib/getImage';
import { cn } from '@/lib/utils';
import type { Media } from '@/types/media';
import type { SingleOffer } from '@/types/single-offer';
import { GameFeatures } from './features';
import { Image } from './image';

export function OfferHero({ offer }: { offer: SingleOffer }) {
  const { data: media } = useQuery({
    queryKey: ['media', { id: offer.id }],
    queryFn: () => httpClient.get<Media>(`/offers/${offer.id}/media`),
    retry: false,
  });
  const [isHovered, setIsHovered] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const videoUrl = media?.videos?.[0]?.outputs
    .filter((output) => output.width !== undefined)
    .sort((a, b) => (b?.width ?? 0) - (a?.width ?? 0))[0]?.url;

  useEffect(() => {
    if (videoUrl && videoRef.current) {
      videoRef.current.src = videoUrl;
      videoRef.current.load();
    }
  }, [videoUrl]);

  useEffect(() => {
    if (videoRef.current) {
      if (!isHovered) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  }, [isHovered]);

  return (
    <div
      className="relative w-full h-auto"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {videoUrl && (
        <video
          className={cn(
            'rounded-xl shadow-lg transition-opacity duration-700 absolute inset-0 ease-in-out',
            isHovered ? 'opacity-100' : 'opacity-0',
          )}
          autoPlay
          loop
          muted
          playsInline
          controls={false}
          width={'100%'}
          height={'auto'}
          src={videoUrl}
          ref={(element) => {
            videoRef.current = element;
          }}
        />
      )}
      <Image
        src={
          getImage(offer.keyImages, [
            'DieselStoreFrontWide',
            'OfferImageWide',
            'DieselGameBoxWide',
            'TakeoverWide',
          ])?.url ?? 'https://cdn.egdata.app/placeholder-1080.webp'
        }
        alt={offer.title}
        quality="original"
        width={1920}
        height={1080}
        className={cn(
          'rounded-xl shadow-lg transition-opacity duration-700 ease-in-out',
          videoUrl && isHovered ? 'opacity-0' : 'opacity-100',
        )}
        eager
        key={offer.id}
      />
      <GameFeatures id={offer.id} />
    </div>
  );
}
