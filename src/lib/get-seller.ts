export function getSeller({
  developerDisplayName,
  publisherDisplayName,
  seller,
  customAttributes,
}: {
  developerDisplayName: string | undefined;
  publisherDisplayName: string | undefined;
  seller: string;
  customAttributes?: {
    [key: string]: {
      type: string;
      value: string;
    };
  };
}) {
  console.log({
    developerDisplayName,
    publisherDisplayName,
    seller,
    customAttributes,
  });
  const developer = customAttributes?.developerName?.value ?? developerDisplayName;
  if (!developer && !publisherDisplayName) {
    return seller;
  }

  if (developer === publisherDisplayName) {
    return developer;
  }

  return `${developer !== null ? `${developer} - ` : ''}${publisherDisplayName}`;
}
