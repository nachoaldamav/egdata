export function getSeller({
  developerDisplayName,
  publisherDisplayName,
  seller,
}: {
  developerDisplayName: string | undefined;
  publisherDisplayName: string | undefined;
  seller: string;
}) {
  if (!developerDisplayName && !publisherDisplayName) {
    return seller;
  }

  if (developerDisplayName === publisherDisplayName) {
    return developerDisplayName;
  }

  return `${developerDisplayName} - ${publisherDisplayName}`;
}
