import { redirect, type LoaderFunctionArgs } from '@remix-run/node';
import { client, getQueryClient } from '~/lib/client';

export async function loader({ params }: LoaderFunctionArgs) {
  const { id } = params;

  if (!id) {
    return redirect('/');
  }

  const queryClient = getQueryClient();
  const offer = await queryClient.fetchQuery({
    queryKey: ['product', { id }],
    queryFn: () =>
      client
        .get<{
          id: string;
        }>(`/offer-by-slug/${id}`)
        .then((res) => res.data),
  });

  if (!offer) {
    return redirect('/');
  }

  return redirect(`/offers/${offer.id}`);
}

export default function Index() {
  return null;
}
