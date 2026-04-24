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
  title: "Privacy Policy | PatronPro",
  description: "Privacy Policy for PatronPro by La Reyna Enterprises.",
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" eyebrow="Privacy Policy">
      <LegalP>
        This Privacy Policy explains how La Reyna Enterprises, a California Corporation, doing business as PatronPro
        ("PatronPro", "we", "us" or "our"), collects, uses, stores and shares information when you visit our website,
        create an account, purchase a subscription, use our platform, communicate with us, or use any related services.
      </LegalP>
      <LegalP>
        PatronPro is a business management platform for contractors and construction-related professionals. Our service
        may include customer management, messaging, SMS, email, calls, calendars, forms, landing pages, estimates,
        invoices, payments, automations, review requests, document management and related tools.
      </LegalP>
      <LegalP>By using PatronPro, you agree to the practices described in this Privacy Policy.</LegalP>
      <LegalP>
        If you have any questions, you can contact us at: La Reyna Enterprises · 10821 Cassina Avenue, South Gate, CA
        90280, United States · Email: <LegalEmail />
      </LegalP>

      <LegalSection title="1. Information we collect">
        <LegalSubSection title="1.1 Account and business information">
          <LegalUl items={[
            "Name, Email address, Phone number, Business name, Business address",
            "Billing information, Account login information, Subscription plan",
            "Support requests, Communication preferences",
            "Any information you choose to provide to us",
          ]} />
        </LegalSubSection>

        <LegalSubSection title="1.2 Payment and billing information">
          <LegalP>Payments processed through Stripe. We do not store full card details. We may receive:</LegalP>
          <LegalUl items={[
            "Payment status, Subscription status",
            "Last four digits of a payment method, Billing email",
            "Invoices, Receipts, Failed payment notices, Refund status",
          ]} />
        </LegalSubSection>

        <LegalSubSection title="1.3 Platform usage information">
          <LegalUl items={[
            "Login activity, IP address, Browser type, Device information, Operating system",
            "Pages visited, Features used, Date and time of activity",
            "Error logs, Security logs, System events, Configuration settings",
            "Automation activity, User actions within the platform",
          ]} />
        </LegalSubSection>

        <LegalSubSection title="1.4 Customer, lead and contact information uploaded by users">
          <LegalUl items={[
            "Names, Email addresses, Phone numbers, Addresses",
            "Project or job information, Messages, SMS conversations, Email conversations, Call records",
            "Notes, Tasks, Appointments, Calendar events",
            "Estimates, Quotes, Invoices, Receipts, Contracts, Signatures, Documents, Uploaded files",
            "Payment-related records, Review request activity, Campaign and automation history",
          ]} />
          <LegalP>
            The PatronPro customer is responsible for ensuring they have the necessary rights, permissions and legal
            basis to upload, store, process and communicate with these contacts.
          </LegalP>
        </LegalSubSection>

        <LegalSubSection title="1.5 Messaging, SMS, calls and communication data">
          <LegalUl items={[
            "Phone numbers, Email addresses, Message content, Message history",
            "Call history, Call logs, Voicemail or recording information (if enabled)",
            "Delivery status, Open/click status where available",
            "Opt-in and opt-out records, STOP/HELP responses",
            "Campaign activity, Automation activity, Messaging provider logs, Communication preferences",
          ]} />
          <LegalP>
            Powered by providers such as Twilio, LeadConnector, GoHighLevel, Mailgun, Meta/WhatsApp or others.
          </LegalP>
        </LegalSubSection>

        <LegalSubSection title="1.6 Documents, contracts, estimates and invoices">
          <LegalP>
            PatronPro may allow users to create, upload, send, sign or store business documents. PatronPro does not
            provide legal, tax, accounting or financial advice. Users are responsible for reviewing and validating any
            documents they use.
          </LegalP>
        </LegalSubSection>

        <LegalSubSection title="1.7 Forms, landing pages and website tools">
          <LegalUl items={[
            "Name, Email, Phone number, Project details, Service interest, Uploaded files",
            "Appointment requests, Consent records, Source information",
            "Campaign attribution, Any other fields configured by the account owner",
          ]} />
          <LegalP>The customer is responsible for ensuring compliance with applicable laws.</LegalP>
        </LegalSubSection>

        <LegalSubSection title="1.8 Cookies and similar technologies">
          <LegalP>Used for:</LegalP>
          <LegalUl items={[
            "Website functionality, Login sessions, Security, Analytics",
            "Language preferences, Payments, Marketing attribution, Advertising",
            "Retargeting, Performance monitoring, Embedded tools, Third-party integrations",
          ]} />
          <LegalP>See our Cookies Policy for more details.</LegalP>
        </LegalSubSection>
      </LegalSection>

      <LegalSection title="2. How we use information">
        <LegalUl items={[
          "To provide, operate and maintain PatronPro",
          "To create and manage user accounts",
          "To process subscriptions, invoices, payments and refunds",
          "To provide customer support",
          "To send account, billing, security and service communications",
          "To enable SMS, email, calls, WhatsApp and messaging features",
          "To enable estimates, invoices, contracts, documents and payment workflows",
          "To enable calendars, appointments, forms, automations and campaigns",
          "To help users manage their customers, leads and business operations",
          "To troubleshoot issues and improve platform performance",
          "To personalize and improve the user experience",
          "To monitor usage, detect abuse and prevent fraud",
          "To protect the security and integrity of the platform",
          "To comply with legal obligations",
          "To enforce our Terms and Conditions",
          "To communicate updates, changes or promotional information about PatronPro, where permitted",
          "To analyze website traffic and marketing performance",
          "To support integrations with third-party providers",
          "To develop, test and improve features, including AI-enabled or automated features where applicable",
        ]} />
      </LegalSection>

      <LegalSection title="3. AI and automated features">
        <LegalP>
          PatronPro may use artificial intelligence, automation tools or third-party AI providers to support certain
          features. When AI-enabled features are used, information may be processed by PatronPro or by third-party AI
          providers. Users are responsible for reviewing AI-generated or automated content before using, sending,
          publishing or relying on it. PatronPro does not guarantee that AI-generated outputs will be accurate,
          complete, compliant, appropriate or error-free.
        </LegalP>
      </LegalSection>

      <LegalSection title="4. SMS, mobile information and messaging consent">
        <LegalP>
          PatronPro may send SMS/text messages, emails, calls or other communications related to your account,
          onboarding, billing, support, security, service updates, reminders, alerts and operational activity. Message
          frequency may vary. Message and data rates may apply. You may opt out of SMS messages by replying STOP.
          Reply HELP or contact <LegalEmail /> for help.
        </LegalP>
        <LegalP>
          PatronPro does not sell personal information. PatronPro does not sell, rent or share mobile phone numbers,
          SMS opt-in data or SMS consent information with third parties or affiliates for their own marketing or
          promotional purposes.
        </LegalP>
      </LegalSection>

      <LegalSection title="5. Customer responsibility for communications">
        <LegalP>
          If you use PatronPro to send SMS, emails, calls, WhatsApp messages, campaigns or automations to your own
          customers or contacts, you are solely responsible for ensuring you have the required consent and legal basis.
          Compliance required with:
        </LegalP>
        <LegalUl items={[
          "TCPA, CAN-SPAM, A2P 10DLC rules, CTIA guidelines",
          "Twilio policies, Meta/WhatsApp policies, Email provider policies, Mobile carrier rules",
          "Any other applicable laws",
        ]} />
        <LegalP>
          PatronPro may suspend or restrict accounts if there is spam, abuse, legal risk or non-compliance.
        </LegalP>
      </LegalSection>

      <LegalSection title="6. How we share information">
        <LegalSubSection title="6.1 Service providers">
          <LegalP>
            We work with service providers for hosting, CRM infrastructure, messaging, SMS, email delivery, payment
            processing, analytics, advertising, security, automation, AI-enabled features, and more. Providers may
            include: GoHighLevel, LeadConnector, Twilio, Mailgun, Stripe, Google, Meta / WhatsApp, LinkedIn, OpenAI or
            other AI providers, Zapier, and others.
          </LegalP>
        </LegalSubSection>
        <LegalSubSection title="6.2 Payment providers">
          <LegalP>
            Stripe and similar providers for subscriptions, invoices, failed payments, refunds and account billing.
          </LegalP>
        </LegalSubSection>
        <LegalSubSection title="6.3 Communication providers">
          <LegalP>
            If you use SMS, email, phone, WhatsApp or other messaging, information may be shared with communication
            providers as needed.
          </LegalP>
        </LegalSubSection>
        <LegalSubSection title="6.4 Legal and compliance reasons">
          <LegalUl items={[
            "To comply with law, regulation, subpoena, court order or legal process",
            "Respond to lawful requests from public authorities",
            "Enforce our Terms",
            "Protect our rights, property or safety",
            "Detect, investigate or prevent fraud, abuse, security issues or illegal activity",
          ]} />
        </LegalSubSection>
        <LegalSubSection title="6.5 Business transfers">
          <LegalP>
            If PatronPro or La Reyna Enterprises is involved in a merger, acquisition, financing, reorganization, sale
            of assets, bankruptcy or similar transaction, information may be transferred.
          </LegalP>
        </LegalSubSection>
        <LegalSubSection title="6.6 With your direction or consent">
          <LegalP>
            When you direct us to do so, connect third-party integrations, invite team members or otherwise use
            features that require sharing information.
          </LegalP>
        </LegalSubSection>
      </LegalSection>

      <LegalSection title="7. Third-party integrations and services">
        <LegalP>
          PatronPro may integrate with third-party services. Your use may be subject to their own terms and privacy
          policies. PatronPro is not responsible for the privacy, security, availability, approval, pricing,
          deliverability, compliance or performance of third-party services.
        </LegalP>
      </LegalSection>

      <LegalSection title="8. Payments made by your customers">
        <LegalP>
          PatronPro may allow contractors to create invoices, send payment links and collect payments from their own
          customers via connected payment providers such as Stripe. PatronPro does not act as a bank, payment
          processor, escrow service, financial institution or custodian of funds. You are responsible for your own
          payment processing account, fees, refunds, disputes, chargebacks, taxes, receipts and compliance.
        </LegalP>
      </LegalSection>

      <LegalSection title="9. Data retention">
        <LegalP>
          We retain information for as long as reasonably necessary to provide the service, comply with legal
          obligations, resolve disputes, enforce agreements and maintain security. After account cancellation, we may
          retain data for up to 90 days, unless a longer retention period is required by law. Some information may
          remain in backups or logs for a limited period before deletion or anonymization.
        </LegalP>
      </LegalSection>

      <LegalSection title="10. Security">
        <LegalP>
          We use reasonable administrative, technical and organizational safeguards. No system is completely secure.
          You are responsible for maintaining the confidentiality of your login credentials and managing user access
          within your account.
        </LegalP>
      </LegalSection>

      <LegalSection title="11. Your choices">
        <LegalP>
          Depending on your location and applicable law, you may have rights to:
        </LegalP>
        <LegalUl items={[
          "Request access to personal information",
          "Request correction",
          "Request deletion",
          "Opt out of certain communications",
          "Withdraw consent where applicable",
        ]} />
        <LegalP>Contact us at <LegalEmail /> to make a request.</LegalP>
      </LegalSection>

      <LegalSection title="12. California privacy rights">
        <LegalP>If you are a California resident, you may have rights under California privacy laws including:</LegalP>
        <LegalUl items={[
          "The right to know what personal information we collect",
          "The right to request access",
          "The right to request correction",
          "The right to request deletion",
          "The right to opt out of the sale or sharing of personal information",
          "The right not to be discriminated against for exercising privacy rights",
        ]} />
        <LegalP>
          PatronPro does not sell personal information. Contact <LegalEmail /> to exercise these rights.
        </LegalP>
      </LegalSection>

      <LegalSection title="13. Marketing communications">
        <LegalP>
          We may send promotional emails where permitted by law. You can unsubscribe using the unsubscribe link or by
          contacting <LegalEmail />. We may still send transactional, account, billing or service-related
          communications. For SMS, reply STOP to opt out.
        </LegalP>
      </LegalSection>

      <LegalSection title="14. Cookies, analytics and advertising">
        <LegalP>
          We may use cookies, pixels and similar technologies from providers such as Google, Meta, LinkedIn or others
          to understand traffic, improve our website, measure campaigns and deliver relevant advertising. You can
          control cookies through your browser settings. See our Cookies Policy for more information.
        </LegalP>
      </LegalSection>

      <LegalSection title="15. Children's privacy">
        <LegalP>
          PatronPro is intended for business and professional use. Not intended for children under 18. We do not
          knowingly collect personal information from children under 18. Contact <LegalEmail /> if you believe a child
          has provided personal information.
        </LegalP>
      </LegalSection>

      <LegalSection title="16. International users">
        <LegalP>
          PatronPro is operated from the United States and primarily intended for U.S. users. If you access PatronPro
          from outside the United States, your information may be processed and stored in the United States or other
          countries where our providers operate.
        </LegalP>
      </LegalSection>

      <LegalSection title="17. Changes to this Privacy Policy">
        <LegalP>
          We may update this Privacy Policy from time to time. We will update the "Last updated" date at the top. If
          changes are material, we may provide additional notice. Your continued use after changes become effective
          means you accept the updated Privacy Policy.
        </LegalP>
      </LegalSection>

      <LegalSection title="18. Contact us">
        <LegalContact />
      </LegalSection>
    </LegalPage>
  );
}
