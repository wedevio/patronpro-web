import {
  LegalPage,
  LegalSection,
  LegalSubSection,
  LegalP,
  LegalUl,
  LegalContact,
  LegalEmail,
} from "@/components/LegalPage";

export const metadata = {
  title: "Cookies Policy | PatronPro",
  description: "Cookies Policy for PatronPro by La Reyna Enterprises.",
};

export default function CookiesPage() {
  return (
    <LegalPage title="Cookies Policy" eyebrow="Cookies Policy">
      <LegalSection title="1. What are cookies?">
        <LegalP>
          Cookies are small text files placed on your device when you visit a website. They are widely used to make
          websites work or work more efficiently, as well as to provide information to website owners.
        </LegalP>
      </LegalSection>

      <LegalSection title="2. Why we use cookies">
        <LegalP>
          PatronPro uses cookies and similar tracking technologies (such as pixels, web beacons, and local storage) to:
        </LegalP>
        <LegalUl items={[
          "Operate and maintain the website and platform",
          "Keep you logged in to your account",
          "Remember your preferences and settings",
          "Understand how visitors use our website",
          "Measure marketing and campaign performance",
          "Deliver relevant advertising and retargeting",
          "Ensure security and prevent fraud",
          "Support payment processing",
          "Enable third-party integrations and embedded tools",
        ]} />
      </LegalSection>

      <LegalSection title="3. Types of cookies we use">
        <LegalSubSection title="3.1 Essential cookies">
          <LegalP>
            These cookies are necessary for the website and platform to function. They enable core features such as
            login sessions, account security, navigation, and access to protected areas. You cannot opt out of these
            cookies without affecting how the platform works.
          </LegalP>
        </LegalSubSection>

        <LegalSubSection title="3.2 Analytics and performance cookies">
          <LegalP>
            These cookies help us understand how visitors interact with our website. We may use tools such as Google
            Analytics to collect information about pages visited, time spent, traffic sources, and user behavior. This
            helps us improve the website and platform experience.
          </LegalP>
        </LegalSubSection>

        <LegalSubSection title="3.3 Marketing and advertising cookies">
          <LegalP>
            These cookies are used to track visitors across websites and deliver relevant advertisements. We may use
            cookies from providers such as Google, Meta (Facebook/Instagram), LinkedIn, or other advertising platforms
            to measure campaign performance, attribute conversions, and serve retargeted ads.
          </LegalP>
        </LegalSubSection>

        <LegalSubSection title="3.4 Functional cookies">
          <LegalP>
            These cookies allow the website to remember choices you make (such as language preferences or display
            settings) and provide a more personalized experience.
          </LegalP>
        </LegalSubSection>

        <LegalSubSection title="3.5 Payment and transaction cookies">
          <LegalP>
            When you make a purchase or manage a subscription, cookies may be used by payment providers such as Stripe
            to facilitate the transaction, prevent fraud, and ensure security.
          </LegalP>
        </LegalSubSection>

        <LegalSubSection title="3.6 Security cookies">
          <LegalP>
            These cookies help detect and prevent unauthorized access, abuse, and fraud on the platform.
          </LegalP>
        </LegalSubSection>

        <LegalSubSection title="3.7 Third-party and embedded tool cookies">
          <LegalP>
            Some pages or features may include content or tools from third parties, such as embedded videos, maps,
            forms, chat widgets, or integrations. These third parties may set their own cookies. PatronPro does not
            control third-party cookies and is not responsible for the privacy practices of third-party providers.
          </LegalP>
        </LegalSubSection>
      </LegalSection>

      <LegalSection title="4. Cookies placed by PatronPro customers">
        <LegalP>
          PatronPro allows customers to create forms, landing pages, and website widgets that may be embedded on
          external websites. If you are visiting a website that uses a PatronPro-powered form or tool, the PatronPro
          customer who owns that website is responsible for the cookie consent and privacy disclosures applicable to
          their website. PatronPro is not responsible for how its customers use these tools on their own websites.
        </LegalP>
      </LegalSection>

      <LegalSection title="5. How long do cookies last?">
        <LegalP>
          Cookies may be session cookies (deleted when you close your browser) or persistent cookies (which remain on
          your device for a set period of time or until deleted). The duration depends on the type and purpose of each
          cookie.
        </LegalP>
      </LegalSection>

      <LegalSection title="6. Your choices">
        <LegalP>
          You can control and manage cookies in several ways:
        </LegalP>
        <LegalUl items={[
          "Browser settings — Most browsers allow you to view, block, or delete cookies. Refer to your browser's help documentation for instructions.",
          "Opt-out tools — You may opt out of interest-based advertising through tools such as the Network Advertising Initiative (NAI) opt-out or the Digital Advertising Alliance (DAA) opt-out.",
          "Google Analytics — You can opt out of Google Analytics by installing the Google Analytics Opt-out Browser Add-on.",
          "Meta / Facebook — You can manage ad preferences through your Facebook account settings.",
        ]} />
        <LegalP>
          Please note that blocking or disabling certain cookies may affect the functionality of the PatronPro website
          and platform, including the ability to log in and use account features.
        </LegalP>
      </LegalSection>

      <LegalSection title="7. Do Not Track (DNT)">
        <LegalP>
          Some browsers include a Do Not Track (DNT) feature. Because there is no universally accepted standard for
          responding to DNT signals, PatronPro does not currently alter its data collection practices based on DNT
          signals.
        </LegalP>
      </LegalSection>

      <LegalSection title="8. Cookies and personal information">
        <LegalP>
          Some cookies may be associated with personal information, such as account identifiers or email addresses, when
          you are logged in to your PatronPro account. Our use of this information is governed by our Privacy Policy.
        </LegalP>
      </LegalSection>

      <LegalSection title="9. Updates to this Cookies Policy">
        <LegalP>
          We may update this Cookies Policy from time to time to reflect changes in technology, law, or our practices.
          We will update the "Last updated" date at the top when changes are made. Your continued use of the website
          after changes become effective means you accept the updated Cookies Policy.
        </LegalP>
      </LegalSection>

      <LegalSection title="10. Contact us">
        <LegalP>If you have questions about our use of cookies, please contact us at:</LegalP>
        <LegalContact />
      </LegalSection>
    </LegalPage>
  );
}
