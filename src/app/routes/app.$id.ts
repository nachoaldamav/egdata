import { redirect, type LoaderFunctionArgs } from '@remix-run/node';

export async function loader({ params }: LoaderFunctionArgs) {
  const { id } = params;

  if (!id) {
    return redirect('/');
  }

  return redirect(`/sandboxes/${id}`);
}

export default function Index() {
  return null;
}
