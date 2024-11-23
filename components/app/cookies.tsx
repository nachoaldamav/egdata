import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useCookies } from '@/hooks/use-cookies';
import { Link } from '@tanstack/react-router';

export function CookieBanner() {
  const [showCustomize, setShowCustomize] = useState(false);
  const [selfHostedAnalytics, setSelfHostedAnalytics] = useState(true);
  const [googleAnalytics, setGoogleAnalytics] = useState(false);
  const { selection, setSelection } = useCookies();

  const handleAcceptAll = () => {
    setSelection({
      googleAnalytics: true,
      selfHostedAnalytics: true,
    });
  };

  const handleRequiredOnly = () => {
    setSelection({
      googleAnalytics: false,
      selfHostedAnalytics: true,
    });
  };

  const handleSavePreferences = () => {
    setSelection({
      googleAnalytics,
      selfHostedAnalytics,
    });
  };

  return (
    <Card className="fixed bottom-4 left-4 right-4 max-w-lg mx-auto">
      <CardHeader>
        <CardTitle>Cookie Preferences</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          We use cookies to enhance your browsing experience and analyze our
          traffic. Please choose your preferences below.
          <Link
            className="text-sm text-muted-foreground ml-2 mt-2 underline decoration-dotted decoration-muted-foreground"
            to="/privacy"
          >
            Learn more
          </Link>
        </p>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              onClick={() => setShowCustomize(!showCustomize)}
            >
              {showCustomize ? 'Hide Options' : 'Customize'}
            </Button>
            <div className="space-x-2">
              <Button variant="outline" onClick={handleRequiredOnly}>
                Required Only
              </Button>
              <Button variant="default" onClick={handleAcceptAll}>
                Accept All
              </Button>
            </div>
          </div>
          {showCustomize && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="google-analytics" className="flex flex-col">
                  <span>Google Analytics</span>
                  <span className="font-normal text-sm text-muted-foreground">
                    Allow Google Analytics tracking
                  </span>
                </Label>
                <Switch
                  id="google-analytics"
                  checked={selection?.googleAnalytics}
                  onCheckedChange={(value) =>
                    setGoogleAnalytics(value as boolean)
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="self-hosted-analytics"
                  className="flex flex-col"
                >
                  <span>Self-hosted Analytics</span>
                  <span className="font-normal text-sm text-muted-foreground">
                    Allow our own analytics tracking (always on)
                  </span>
                </Label>
                <Switch
                  id="self-hosted-analytics"
                  checked={selfHostedAnalytics}
                  onCheckedChange={setSelfHostedAnalytics}
                  disabled
                />
              </div>
            </div>
          )}
        </div>
      </CardContent>
      {showCustomize && (
        <CardFooter>
          <Button onClick={handleSavePreferences} className="w-full">
            Save Preferences
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
