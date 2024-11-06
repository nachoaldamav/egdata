import { RegionalPricing } from '@/components/app/regional-pricing';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/offers/$id/price')({
  component: () => {
    const { id } = Route.useParams();

    return (
      <section id="offer-information" className="w-full h-full">
        <h2 className="text-2xl font-bold">Price</h2>
        <RegionalPricing id={id} />
      </section>
    );
  },
});
