import { Form } from '@remix-run/react';
import { Button } from '~/components/ui/button';

export default function Login() {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <Form action="/auth/discord" method="post">
        <Button>Login with Discord</Button>
      </Form>
    </div>
  );
}
