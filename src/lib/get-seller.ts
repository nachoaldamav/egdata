export function getSeller({
  developerDisplayName,
  publisherDisplayName,
  seller,
  customAttributes,
}: {
  developerDisplayName: string | undefined | null;
  publisherDisplayName: string | undefined | null;
  seller: string;
  customAttributes?: {
    [key: string]: {
      type: string;
      value: string;
    };
  };
}) {
  // Get developer name from customAttributes or fallback to developerDisplayName
  const developer = customAttributes?.developerName?.value ?? developerDisplayName;

  // If both developer and publisher display names are missing, return the seller
  if (!developer && !publisherDisplayName) {
    return seller;
  }

  // If developer and publisher display names are the same, return the developer
  if (developer === publisherDisplayName) {
    return developer;
  }

  // If there is no publisher display name, return the developer name only
  if (publisherDisplayName === null || publisherDisplayName === undefined) {
    return developer;
  }

  // Return a combination of developer and publisher display names
  return `${developer !== null && developer !== undefined ? `${developer} - ` : ''}${publisherDisplayName}`;
}
