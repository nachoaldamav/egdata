import type { MetaFunction } from '@remix-run/node';
import { Link } from '@remix-run/react';

export const meta: MetaFunction = () => {
  return [
    {
      title: 'Privacy Policy - egdata.app',
    },
  ];
};

export default function Privacy() {
  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">Privacy Policy for EGData App</h1>
      <p className="mb-4">
        <strong>Effective Date:</strong> July 3, 2024
      </p>

      <h2 className="text-2xl font-semibold mb-2">1. Introduction</h2>
      <p className="mb-4">
        Welcome to EGData App ("we", "our", "us"). We are committed to protecting and respecting
        your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your
        information when you visit our website{' '}
        <a href="https://egdata.app" className="text-blue-500">
          https://egdata.app
        </a>{' '}
        (the "Site"). Please read this policy carefully to understand our views and practices
        regarding your personal data and how we will treat it.
      </p>
      <p className="mb-4">
        The first time you visit our Site, you will be asked to consent to our use of cookies in
        accordance with the terms of this Privacy Policy. If the user does not consent to the use of
        cookies, the Site won't allow Google Analytics to collect any data directly. Instead, the
        Site will collect anonymized data that cannot be used to identify the user.
      </p>

      <h2 className="text-2xl font-semibold mb-2">2. Information We Collect</h2>
      <p className="mb-4">When you visit our Site, we may collect the following information:</p>
      <ul className="list-disc list-inside mb-4">
        <li>
          <strong>Personal Data</strong>: We do not collect any personal data directly. Any
          information collected is through the use of Google Analytics.
        </li>
        <li>
          <strong>Usage Data</strong>: We may automatically collect certain information about your
          device and usage of our Site. This information is collected through Google Analytics and
          may include your IP address, browser type, operating system, referring URLs, information
          on actions taken on the Site, and dates and times of Site visits.
        </li>
      </ul>

      <h2 className="text-2xl font-semibold mb-2">3. Use of Your Information</h2>
      <p className="mb-4">
        We use the information we collect via Google Analytics for the following purposes:
      </p>
      <ul className="list-disc list-inside mb-4">
        <li>To analyze and improve the functionality and user experience of our Site.</li>
        <li>To monitor and analyze trends, usage, and activities in connection with our Site.</li>
      </ul>

      <h2 className="text-2xl font-semibold mb-2">4. Google Analytics</h2>
      <p className="mb-4">
        Our Site uses Google Analytics, a web analytics service provided by Google, Inc. ("Google").
        Google Analytics uses cookies (text files placed on your computer) to help the website
        analyze how users use the Site. The information generated by the cookie about your use of
        the Site (including your IP address) will be transmitted to and stored by Google on servers
        in the United States and other countries.
      </p>
      <p className="mb-4">
        Google will use this information for the purpose of evaluating your use of the Site,
        compiling reports on website activity for website operators, and providing other services
        relating to website activity and internet usage. Google may also transfer this information
        to third parties where required to do so by law, or where such third parties process the
        information on Google's behalf.
      </p>
      <p className="mb-4">
        Google complies with the EU-U.S. Privacy Shield Framework and adheres to standard
        contractual clauses, ensuring an adequate level of protection for data transferred outside
        the European Economic Area (EEA).
      </p>
      <p className="mb-4">
        You can opt-out of Google Analytics by installing the Google Analytics opt-out browser
        add-on. For more information on how Google collects and processes data, please visit{' '}
        <Link
          to="https://policies.google.com/privacy"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500"
        >
          Google's Privacy & Terms
        </Link>
        .
      </p>

      <h2 className="text-2xl font-semibold mb-2">5. Data Security</h2>
      <p className="mb-4">
        We have implemented security measures designed to protect the information we collect via
        Google Analytics. However, please be aware that no security measures are perfect or
        impenetrable, and we cannot guarantee the absolute security of your data.
      </p>

      <h2 className="text-2xl font-semibold mb-2">6. Changes to This Privacy Policy</h2>
      <p className="mb-4">
        We may update this Privacy Policy from time to time in order to reflect changes to our
        practices or for other operational, legal, or regulatory reasons. Any changes will be posted
        on this page, and we will update the "Effective Date" at the top of this Privacy Policy. We
        encourage you to review this Privacy Policy periodically to stay informed about our
        information practices.
      </p>

      <h2 className="text-2xl font-semibold mb-2">7. Contact Us</h2>
      <p className="mb-4">
        If you have any questions about this Privacy Policy, please contact us at:
      </p>
      <p className="mb-4">
        Email:{' '}
        <a href="mailto:privacy@egdata.app" className="text-blue-500">
          privacy@egdata.app
        </a>
      </p>

      <p className="mb-4">
        <h6
          className="text-sm text-gray-500"
          style={{ textAlign: 'center', marginTop: '2rem', marginBottom: '2rem' }}
        >
          <ol className="list-decimal list-inside">
            <li>
              <strong>Anonymized Data:</strong> When the user does not consent to the use of
              cookies, the Site will generate a random temporary ID for the user. This ID is used to
              track the user's session and is not stored for more than a browser session.
              <br />
              The functionality of this logic is implemented in the following file:{' '}
              <Link
                to="https://github.com/nachoaldamav/egdata/blob/main/src/context/cookies.tsx"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500"
              >
                src/context/cookies.tsx
              </Link>
            </li>
          </ol>
        </h6>
      </p>
    </div>
  );
}
