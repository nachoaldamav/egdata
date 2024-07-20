import Plyr from 'plyr';
import { useRef, useState, useEffect } from 'react';
import type { Media } from '~/types/media';

export function Player({ video }: { video: Media['videos'][0] }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isDashJsLoaded, setIsDashJsLoaded] = useState(false);

  const manifests = video.outputs.filter((output) => output.contentType === 'application/dash+xml');

  useEffect(() => {
    if (typeof window !== 'undefined' && manifests.length > 0) {
      import('dashjs').then((dashjs) => {
        if (!videoRef.current) return;
        const dashPlayer = dashjs.MediaPlayer().create();
        dashPlayer.initialize(videoRef.current, manifests[0].url, false); // Set autoplay to false here
        setIsDashJsLoaded(true);
      });
    }
  }, [manifests]);

  useEffect(() => {
    if (!isDashJsLoaded) return;

    const videoElement = videoRef.current;
    const audioElement = audioRef.current;

    const handlePlay = () => {
      audioElement?.play();
    };

    const handlePause = () => {
      audioElement?.pause();
    };

    const handleSeeking = () => {
      if (audioElement) {
        audioElement.currentTime = videoElement?.currentTime || 0;
      }
    };

    const handleTimeUpdate = () => {
      if (
        videoElement &&
        audioElement &&
        Math.abs(videoElement.currentTime - audioElement.currentTime) > 0.3
      ) {
        audioElement.currentTime = videoElement.currentTime;
      }
    };

    videoElement?.addEventListener('play', handlePlay);
    videoElement?.addEventListener('pause', handlePause);
    videoElement?.addEventListener('seeking', handleSeeking);
    videoElement?.addEventListener('timeupdate', handleTimeUpdate);

    const Player = new Plyr(videoElement as HTMLVideoElement, {
      controls: ['play', 'progress', 'current-time', 'mute', 'volume', 'fullscreen'],
      autoplay: false,
      clickToPlay: true,
      volume: 0.5,
    });

    return () => {
      videoElement?.removeEventListener('play', handlePlay);
      videoElement?.removeEventListener('pause', handlePause);
      videoElement?.removeEventListener('seeking', handleSeeking);
      videoElement?.removeEventListener('timeupdate', handleTimeUpdate);
      Player.destroy();
    };
  }, [isDashJsLoaded]);

  return (
    <div className="w-full">
      <video ref={videoRef} className="plyr" controls />
    </div>
  );
}
