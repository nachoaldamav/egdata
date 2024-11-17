/// <reference types="vinxi/types/client" />
import { startTransition, StrictMode } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { StartClient } from '@tanstack/start';
import { createRouter } from './router';

function clearBrowserExtensionInjectionsBeforeHydration() {
  const selectors = [
    'html > *:not(body, head)',
    'script[src*="extension://"]',
    'link[href*="extension://"]',
  ];

  for (const selector of document.querySelectorAll(selectors.join(', '))) {
    selector.parentNode?.removeChild(selector);
  }

  const $targets = {
    html: {
      $elm: document.querySelector('html') as HTMLHtmlElement,
      allowedAttributes: ['lang', 'dir', 'class'],
    },
    head: {
      $elm: document.querySelector('head') as HTMLHeadElement,
      allowedAttributes: [''],
    },
    body: {
      $elm: document.querySelector('body') as HTMLBodyElement,
      allowedAttributes: ['class'],
    },
  };

  for (const [targetName, target] of Object.entries($targets)) {
    for (const attr of target.$elm.getAttributeNames()) {
      if (!target.allowedAttributes.includes(attr)) {
        target.$elm.removeAttribute(attr);
        console.log(`Removed ${attr} from ${targetName}`);
      }
    }
  }
}

const router = createRouter();

function waitForHydration() {
  clearBrowserExtensionInjectionsBeforeHydration();
  startTransition(() => {
    hydrateRoot(
      document,
      <StrictMode>
        <StartClient router={router} />
      </StrictMode>,
    );
  });
}

if (window.requestIdleCallback) {
  window.requestIdleCallback(waitForHydration);
} else {
  // Safari doesn't support requestIdleCallback
  // https://caniuse.com/requestidlecallback
  window.setTimeout(waitForHydration, 1);
}
