import { Form } from '@remix-run/react';
import { Button } from '~/components/ui/button';

export default function Login() {
  return (
    <div className="flex flex-col items-center justify-center h-screen gap-4">
      <Form action="/auth/epic" method="post">
        <Button>Login with Epic</Button>
      </Form>
    </div>
  );
}
