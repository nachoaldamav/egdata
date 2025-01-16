import { Button } from '@/components/ui/button';
import { authClient } from '@/lib/auth-client';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/auth/login-v2')({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div>
      <Button
        onClick={() =>
          authClient.signIn.oauth2({
            providerId: 'epic',
          })
        }
      >
        Login
      </Button>
    </div>
  );
}
