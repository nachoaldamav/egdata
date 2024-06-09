import { getGameFeatures } from '~/lib/custom-attributes';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '~/components/ui/tooltip';

const features: Record<string, keyof typeof icons> = {
  ThirdPartyManagedApp: 'ea',
  MonitorPresense: 'discord',
  PresenceId: 'discord',
  parentPartnerLinkType: 'ubisoft',
  partnerType: 'ubisoft',
  partnerLinkId: 'ubisoft',
  partnerLinkType: 'ubisoft',
  isUplay: 'ubisoft',
};

const icons: Record<string, React.FC> = {
  ea: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="m16.635 6.162-5.928 9.377H4.24l1.508-2.3h4.024l1.474-2.335H2.264L.79 13.239h2.156L0 17.84h12.072l4.563-7.259 1.652 2.66h-1.401l-1.473 2.299h4.347l1.473 2.3H24zm-11.461.107L3.7 8.604l9.52-.035 1.474-2.3z" />
    </svg>
  ),
  discord: () => (
    <svg
      viewBox="0 0 256 199"
      width="20"
      height="20"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid"
      fill="currentColor"
    >
      <path d="M216.856 16.597A208.502 208.502 0 0 0 164.042 0c-2.275 4.113-4.933 9.645-6.766 14.046-19.692-2.961-39.203-2.961-58.533 0-1.832-4.4-4.55-9.933-6.846-14.046a207.809 207.809 0 0 0-52.855 16.638C5.618 67.147-3.443 116.4 1.087 164.956c22.169 16.555 43.653 26.612 64.775 33.193A161.094 161.094 0 0 0 79.735 175.3a136.413 136.413 0 0 1-21.846-10.632 108.636 108.636 0 0 0 5.356-4.237c42.122 19.702 87.89 19.702 129.51 0a131.66 131.66 0 0 0 5.355 4.237 136.07 136.07 0 0 1-21.886 10.653c4.006 8.02 8.638 15.67 13.873 22.848 21.142-6.58 42.646-16.637 64.815-33.213 5.316-56.288-9.08-105.09-38.056-148.36ZM85.474 135.095c-12.645 0-23.015-11.805-23.015-26.18s10.149-26.2 23.015-26.2c12.867 0 23.236 11.804 23.015 26.2.02 14.375-10.148 26.18-23.015 26.18Zm85.051 0c-12.645 0-23.014-11.805-23.014-26.18s10.148-26.2 23.014-26.2c12.867 0 23.236 11.804 23.015 26.2 0 14.375-10.148 26.18-23.015 26.18Z" />
    </svg>
  ),
  ubisoft: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 32 32"
      fill="currentColor"
    >
      <path d="M31.416 15.984C31.068-.407 9.271-6.521.875 8.844c.376.276.88.635 1.256.896a15.72 15.72 0 0 0-1.303 4.093 15.857 15.857 0 0 0-.244 2.76C.584 25.093 7.495 32 16.005 32c8.516 0 15.411-6.896 15.411-15.407zM4.385 18.729c-.203 1.667-.073 2.183-.073 2.385l-.375.131c-.14-.272-.489-1.24-.651-2.543-.407-4.957 2.979-9.421 8.14-10.265 4.724-.692 9.251 2.245 10.303 6.349l-.375.131c-.115-.115-.303-.448-1.027-1.172-5.708-5.709-14.672-3.095-15.943 4.989zm14.672 2.776a4.189 4.189 0 0 1-3.453 1.807 4.197 4.197 0 0 1-4.208-4.208 4.214 4.214 0 0 1 3.901-4.187c1.359-.057 2.629.676 3.224 1.864a3.438 3.438 0 0 1-.604 3.927c.389.276.765.537 1.14.797zm8.771.162c-2.224 5.041-6.807 7.688-11.692 7.615-9.381-.464-12.109-11.287-5.839-15.188l.276.271c-.104.147-.48.439-1.057 1.579-.677 1.385-.896 2.776-.808 3.641.489 7.561 11.089 9.109 14.729 1.619C28.078 10.96 15.76.537 4.833 8.501l-.245-.245c2.876-4.509 8.5-6.52 13.86-5.176 8.197 2.067 12.604 10.609 9.38 18.588z" />
    </svg>
  ),
};

const tooltips: Record<string, string> = {
  ea: 'EA Launcher',
  discord: 'Discord Rich Presence',
  ubisoft: 'Ubisoft Launcher',
};

interface GameFeatureProps {
  attributes: Record<string, { type: string; value: string }>;
}

const GameFeatures: React.FC<GameFeatureProps> = ({ attributes }) => {
  const gameFeatures = getGameFeatures(attributes);
  // Convert to IDs and Dedupe
  const uniqueFeatures = [
    ...new Set(gameFeatures.map((feature) => features[feature])),
  ];

  if (!uniqueFeatures.length) {
    return null;
  }

  return (
    <div className="w-full justify-center items-center flex absolute bottom-3 right-0 left-0">
      <div className="h-auto flex gap-4 w-fit bg-gray-500/30 py-2 px-6 rounded-xl justify-center items-center text-white backdrop-blur-sm">
        {uniqueFeatures.map((feature) => {
          const Icon = icons[feature];

          if (!Icon) {
            return null;
          }

          return (
            <TooltipProvider key={feature}>
              <Tooltip delayDuration={50}>
                <TooltipTrigger>
                  <Icon />
                </TooltipTrigger>
                <TooltipContent>
                  <div className="text-center">{tooltips[feature]}</div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </div>
    </div>
  );
};

export default GameFeatures;
