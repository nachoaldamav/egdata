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
        <strong>Effective Date:</strong> August 22, 2024
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
        By using our Site, you consent to the collection and use of information in accordance with
        this Privacy Policy.
      </p>

      <h3 className="text-lg font-medium mb-2">1.1 What is egdata.app?</h3>
      <p className="mb-4">
        egdata.app is a website that tracks changes in games, downloadable content (DLCs), add-ons,
        and apps available on the Epic Games Store. We provide information about these changes,
        including pricing history and updates. Our goal is to offer users a comprehensive overview
        of the evolving landscape of the Epic Games Store's offerings.
      </p>

      <h3 className="text-lg font-medium mb-2">1.2 What is NOT egdata.app?</h3>
      <p className="mb-4">
        It's important to understand that egdata.app is not a platform for downloading, hacking, or
        pirating any of the games or content we track. We do not provide any downloadable content
        whatsoever. All data displayed on egdata.app is publicly available information gathered from
        the Epic Games Store.
      </p>

      <h2 className="text-2xl font-semibold mb-2">2. Information We Collect</h2>
      <p className="mb-4">When you visit our Site, we may collect the following information:</p>
      <ul className="list-disc list-inside mb-4">
        <li>
          <strong>Personal Data</strong>: We do not collect any personal data directly, except for
          data collected via the "Login with Epic Games" feature and "Discord registration." The
          data collected includes user IDs, usernames, and any information provided by Discord
          during the registration process. This data is used solely for the functionality of our
          Site.
        </li>
        <li>
          <strong>Usage Data</strong>: We may automatically collect certain information about your
          device and usage of our Site. This information is collected through Google Analytics and
          may include your IP address, browser type, operating system, referring URLs, information
          on actions taken on the Site, and dates and times of Site visits.
        </li>
      </ul>

      <h2 className="text-2xl font-semibold mb-2">3. How We Use Your Information</h2>
      <p className="mb-4">We use the information we collect for the following purposes:</p>
      <ul className="list-disc list-inside mb-4">
        <li>To provide and maintain our Site's functionality.</li>
        <li>To analyze and improve the functionality and user experience of our Site.</li>
        <li>To monitor and analyze trends, usage, and activities in connection with our Site.</li>
        <li>
          To detect, prevent, and address technical issues and improve the security of our Site.
        </li>
        <li>To provide user-specific features that require login with Epic Games data.</li>
        <li>
          To allow users to register via Discord and link their Discord and Epic Games accounts for
          enhanced features.
        </li>
      </ul>

      <h2 className="text-2xl font-semibold mb-2">
        4. Discord Registration and Epic Games Account Linking
      </h2>
      <p className="mb-4">
        Our Site allows users to register using their Discord account. During the registration
        process, we may collect certain data provided by Discord, such as your Discord ID, username,
        and avatar. This information is used to create your account on our Site and is not shared
        with third parties, except as necessary to provide our services.
      </p>
      <p className="mb-4">
        After registration, users have the option to link their Epic Games account to their Discord
        account. The linking of these accounts enables enhanced features on our Site. We collect and
        store the Epic Games user ID and username, which are used solely to provide these features.
        Users can unlink their accounts at any time by contacting us at{' '}
        <a href="mailto:privacy@egdata.app" className="text-blue-500">
          privacy@egdata.app
        </a>
        .
      </p>

      <h2 className="text-2xl font-semibold mb-2">5. Data Retention and Deletion</h2>
      <p className="mb-4">
        We retain personal data, including user IDs and usernames, for as long as necessary to
        provide our services or as required by applicable laws. Users who wish to delete their
        information, including unlinking their Discord and Epic Games accounts, can do so by
        contacting us directly at{' '}
        <a href="mailto:privacy@egdata.app" className="text-blue-500">
          privacy@egdata.app
        </a>
        . Upon request, we will delete all personal data associated with the user's account, subject
        to any legal obligations to retain certain information.
      </p>

      <h2 className="text-2xl font-semibold mb-2">6. Google Analytics</h2>
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

      <h2 className="text-2xl font-semibold mb-2">7. Data Security</h2>
      <p className="mb-4">
        We have implemented security measures designed to protect the information we collect.
        However, please be aware that no security measures are perfect or impenetrable, and we
        cannot guarantee the absolute security of your data.
      </p>

      <h2 className="text-2xl font-semibold mb-2">8. Changes to This Privacy Policy</h2>
      <p className="mb-4">
        We may update this Privacy Policy from time to time to reflect changes to our practices or
        for other operational, legal, or regulatory reasons. Any changes will be posted on this
        page, and we will update the "Effective Date" at the top of this Privacy Policy. We
        encourage you to review this Privacy Policy periodically to stay informed about our
        information practices.
      </p>

      <h2 className="text-2xl font-semibold mb-2">9. Contact Us</h2>
      <p className="mb-4">
        If you have any questions about this Privacy Policy, please contact us at:
      </p>
      <p className="mb-4">
        Email:{' '}
        <a href="mailto:privacy@egdata.app" className="text-blue-500">
          privacy@egdata.app
        </a>
      </p>
    </div>
  );
}
