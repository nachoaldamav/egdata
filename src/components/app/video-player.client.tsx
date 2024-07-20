import 'dashjs';
import type { Media } from '~/types/media';
import { MediaPlayer, type MediaPlayerInstance, MediaProvider, Poster } from '@vidstack/react';
import { defaultLayoutIcons, DefaultVideoLayout } from '@vidstack/react/player/layouts/default';
import type { SingleOffer } from '~/types/single-offer';
import { useRef } from 'react';

export function Player({ video, offer }: { video: Media['videos'][0]; offer: SingleOffer }) {
  const player = useRef<MediaPlayerInstance>(null);

  const manifests = video.outputs.filter((output) => output.contentType === 'application/dash+xml');
  const images = video.outputs.filter((output) => output.contentType.startsWith('image/'));

  return (
    <div className="w-full max-w-[640px] mx-auto">
      <MediaPlayer
        ref={player}
        className="w-full bg-slate-900 text-white font-sans overflow-hidden rounded-md ring-media-focus data-[focus]:ring-4"
        title={offer.title}
        src={manifests[0]?.url}
        poster={images[0]?.url}
        viewType="video"
        streamType="on-demand"
        playsInline
        volume={0.05}
      >
        <MediaProvider>
          <Poster className="vds-poster" />
        </MediaProvider>
        <DefaultVideoLayout icons={defaultLayoutIcons} />
      </MediaPlayer>
    </div>
  );
}
