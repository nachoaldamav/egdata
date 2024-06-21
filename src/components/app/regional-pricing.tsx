import { useQuery } from '@tanstack/react-query';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { fetchOfferPrice } from '~/queries/offer-price';

export function RegionalPricing({ id }: { id: string }) {
  const { data, error, isLoading, isError } = useQuery({
    queryKey: ['price-history', id],
    queryFn: () => fetchOfferPrice({ id }),
  });

  if (isLoading) {
    return <p>Loading...</p>;
  }

  if (isError) {
    return <p>Error: {error.message}</p>;
  }

  const priceHistory = data;

  if (!priceHistory) {
    return null;
  }

  return (
    <div className="w-full mx-auto">
      <Table className="w-3/4 mx-auto">
        <TableCaption>Regional Pricing</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Region</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Max Price</TableHead>
            <TableHead>Min Price</TableHead>
            <TableHead>USD</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Object.keys(priceHistory).map((key) => {
            const regionPricing = priceHistory[key];
            const lastPrice = regionPricing.sort(
              (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
            )[0];
            const maxPrice = regionPricing.reduce(
              (acc, price) =>
                price.totalPrice.discountPrice > acc ? price.totalPrice.discountPrice : acc,
              0,
            );
            const minPrice = regionPricing.reduce(
              (acc, price) =>
                price.totalPrice.discountPrice < acc ? price.totalPrice.discountPrice : acc,
              maxPrice,
            );

            const currencyFormatter = new Intl.NumberFormat(undefined, {
              style: 'currency',
              currency: lastPrice.totalPaymentPrice.paymentCurrencyCode,
            });
            const usdFormatter = new Intl.NumberFormat(undefined, {
              style: 'currency',
              currency: 'USD',
            });

            return (
              <TableRow key={key}>
                <TableCell>{key}</TableCell>
                <TableCell>
                  {currencyFormatter.format(lastPrice.totalPrice.discountPrice / 100)}
                </TableCell>
                <TableCell>{currencyFormatter.format(maxPrice / 100)}</TableCell>
                <TableCell>{currencyFormatter.format(minPrice / 100)}</TableCell>
                <TableCell>
                  {usdFormatter.format(lastPrice.totalPrice.basePayoutPrice / 100)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
