import { redirect, useParams } from '@remix-run/react';
import { RegionalPricing } from '~/components/app/regional-pricing';

export default function PriceSection() {
  const params = useParams();

  const id = params.id;

  if (!id) {
    redirect('/');
    return null;
  }

  return (
    <section id="offer-information" className="w-full h-full">
      <h2 className="text-2xl font-bold">Price</h2>
      <RegionalPricing id={id} />
    </section>
  );
}
