import {
  LegalPage,
  LegalSection,
  LegalP,
  LegalUl,
  LegalContact,
  LegalEmail,
} from "@/components/LegalPage";

export const metadata = {
  title: "Terms and Conditions | PatronPro",
  description: "Terms and Conditions for PatronPro by La Reyna Enterprises.",
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms and Conditions" eyebrow="Terms & Conditions">
      <LegalP>
        These Terms and Conditions ("Terms") govern your access to and use of PatronPro, a platform operated by La
        Reyna Enterprises, a California Corporation ("PatronPro", "we", "us", "our"). By creating an account,
        purchasing a subscription, or using the platform, you agree to these Terms.
      </LegalP>

      <LegalSection title="1. Company information">
        <LegalP>
          La Reyna Enterprises · 10821 Cassina Avenue, South Gate, CA 90280, United States · Email: <LegalEmail />
        </LegalP>
      </LegalSection>

      <LegalSection title="2. What PatronPro provides">
        <LegalP>
          PatronPro is a business management platform for contractors and construction-related professionals. The
          platform may include customer management (CRM), messaging, SMS, email, calls, calendars, forms, landing
          pages, estimates, invoices, payments, automations, review requests, document management, pipelines,
          reporting, and related tools.
        </LegalP>
        <LegalP>
          Features and availability may change at any time. PatronPro does not guarantee that any specific feature will
          remain available indefinitely.
        </LegalP>
      </LegalSection>

      <LegalSection title="3. Eligibility">
        <LegalP>
          You must be at least 18 years of age and legally able to enter into contracts. PatronPro is intended for
          business and professional use. By using PatronPro, you represent that you meet these requirements.
        </LegalP>
      </LegalSection>

      <LegalSection title="4. Accounts and team access">
        <LegalP>
          You are responsible for maintaining the confidentiality of your account credentials. You are responsible for
          all activity that occurs under your account, including activity by team members or users you invite. You must
          notify us immediately at <LegalEmail /> if you suspect unauthorized access.
        </LegalP>
        <LegalP>
          You may invite team members or sub-users to your account. You are responsible for ensuring that all users
          comply with these Terms.
        </LegalP>
      </LegalSection>

      <LegalSection title="5. Subscriptions and pricing">
        <LegalP>PatronPro currently offers the following subscription plans:</LegalP>
        <LegalUl items={[
          "Monthly Plan: $99 per month, billed monthly",
          "Annual Plan: $999 per year, billed annually",
        ]} />
        <LegalP>
          Pricing is subject to change. We will provide notice of pricing changes before the next billing cycle.
        </LegalP>
      </LegalSection>

      <LegalSection title="6. Billing and automatic renewal">
        <LegalP>
          Subscriptions automatically renew at the end of each billing period (monthly or annual) unless cancelled
          before the renewal date. By subscribing, you authorize PatronPro to charge your payment method on file for
          each renewal period.
        </LegalP>
        <LegalP>
          You are responsible for ensuring your payment information is current and accurate. PatronPro uses Stripe for
          payment processing.
        </LegalP>
      </LegalSection>

      <LegalSection title="7. Cancellation">
        <LegalP>
          You may cancel your subscription at any time through your account settings or by contacting us at{" "}
          <LegalEmail />. Cancellation will take effect at the end of the current billing period. You will retain
          access to the platform until the end of the paid period.
        </LegalP>
        <LegalP>
          Cancellation does not entitle you to a refund except as described in our Refund Policy below.
        </LegalP>
      </LegalSection>

      <LegalSection title="8. Refund policy">
        <LegalP>
          PatronPro offers a 7-day refund window for new subscribers. If you are not satisfied within the first 7 days
          of your initial subscription, contact us at <LegalEmail /> to request a refund. After 7 days, all payments
          are non-refundable. Annual plan payments are non-refundable after the 7-day window.
        </LegalP>
        <LegalP>
          Refunds are not provided for partial months, unused features, or cancellations outside the refund window.
        </LegalP>
      </LegalSection>

      <LegalSection title="9. Failed payments">
        <LegalP>
          If a payment fails, we may retry the charge. If payment cannot be collected, your account may be suspended
          or downgraded. You will be notified of failed payments by email. PatronPro is not liable for any loss of
          access or data resulting from a failed payment.
        </LegalP>
      </LegalSection>

      <LegalSection title="10. Usage-based fees">
        <LegalP>
          Certain features, such as SMS messaging, phone numbers, calls, or email sending, may incur usage-based fees
          in addition to your subscription. These fees are charged based on actual usage and will be billed to your
          payment method on file. Current usage rates are available within your account or upon request.
        </LegalP>
      </LegalSection>

      <LegalSection title="11. Stripe and payment processing">
        <LegalP>
          PatronPro uses Stripe to process subscription payments. By subscribing, you agree to Stripe's Terms of
          Service. PatronPro does not store full payment card details. Stripe may collect and process your payment
          information subject to Stripe's own privacy policy and terms.
        </LegalP>
      </LegalSection>

      <LegalSection title="12. Communications from PatronPro">
        <LegalP>
          By creating an account, you agree to receive transactional and account-related communications from
          PatronPro, including onboarding, billing, security, product updates, and service notifications. These
          communications are required for the operation of your account and cannot be fully opted out of while your
          account is active.
        </LegalP>
        <LegalP>
          We may also send promotional communications where permitted by law. You may opt out of promotional emails
          at any time using the unsubscribe link.
        </LegalP>
      </LegalSection>

      <LegalSection title="13. SMS communications from PatronPro">
        <LegalP>
          PatronPro may send SMS messages related to your account, onboarding, billing, security, and service
          updates. Message frequency may vary. Message and data rates may apply. Reply STOP to opt out of SMS
          messages. Reply HELP or contact <LegalEmail /> for assistance.
        </LegalP>
        <LegalP>
          PatronPro does not sell, rent, or share mobile phone numbers or SMS opt-in data with third parties for
          their own marketing or promotional purposes.
        </LegalP>
      </LegalSection>

      <LegalSection title="14. Your responsibility for customer communications">
        <LegalP>
          If you use PatronPro to send SMS, emails, calls, WhatsApp messages, campaigns, or automated messages to
          your own customers or contacts, you are solely responsible for:
        </LegalP>
        <LegalUl items={[
          "Obtaining all required consents and opt-ins from your recipients",
          "Maintaining accurate opt-in and opt-out records",
          "Complying with all applicable laws and regulations",
          "Honoring opt-out and STOP requests",
          "Ensuring your messages are not spam, misleading, or unlawful",
        ]} />
        <LegalP>Applicable laws and rules include, without limitation:</LegalP>
        <LegalUl items={[
          "Telephone Consumer Protection Act (TCPA)",
          "CAN-SPAM Act",
          "A2P 10DLC registration requirements and carrier rules",
          "CTIA guidelines",
          "Twilio Messaging Policy",
          "Meta / WhatsApp Business Policy",
          "Email provider acceptable use policies",
          "All applicable state and federal laws",
        ]} />
      </LegalSection>

      <LegalSection title="15. A2P 10DLC registration">
        <LegalP>
          If you use PatronPro to send SMS messages to U.S. phone numbers using a business phone number (A2P 10DLC),
          you are responsible for registering your brand and campaign with the required carriers and registries.
          PatronPro may facilitate or require this registration. Failure to complete required registration may result
          in message delivery issues, carrier filtering, or suspension of messaging capabilities. PatronPro is not
          liable for message delivery failures, carrier filtering, or penalties resulting from non-compliance with
          A2P 10DLC requirements.
        </LegalP>
      </LegalSection>

      <LegalSection title="16. Acceptable use">
        <LegalP>You agree not to use PatronPro to:</LegalP>
        <LegalUl items={[
          "Violate any applicable law or regulation",
          "Send spam, unsolicited messages, or communications without proper consent",
          "Harass, threaten, or harm others",
          "Transmit malware, viruses, or malicious code",
          "Attempt to gain unauthorized access to the platform or other accounts",
          "Interfere with or disrupt the platform or infrastructure",
          "Use the platform to engage in fraud, deception, or misrepresentation",
          "Violate the rights of any third party, including intellectual property rights",
          "Use the platform in a way that could expose PatronPro or its users to legal liability",
          "Resell or sublicense the platform without written permission",
        ]} />
        <LegalP>
          PatronPro reserves the right to suspend or terminate accounts that violate this Acceptable Use Policy.
        </LegalP>
      </LegalSection>

      <LegalSection title="17. Customer content">
        <LegalP>
          You retain ownership of the content, data, and information you upload, create, or store in PatronPro
          ("Customer Content"). By using PatronPro, you grant us a limited license to process, store, display, and
          transmit your Customer Content solely as necessary to provide the services.
        </LegalP>
        <LegalP>
          You are responsible for ensuring that your Customer Content does not violate any law, infringe any third
          party rights, or violate these Terms.
        </LegalP>
      </LegalSection>

      <LegalSection title="18. Documents, contracts, estimates and invoices">
        <LegalP>
          PatronPro may allow you to create, manage, send, and store business documents including estimates, quotes,
          invoices, contracts, and other files. PatronPro does not provide legal, tax, accounting, or financial
          advice. You are solely responsible for reviewing, validating, and ensuring the accuracy, legality, and
          appropriateness of any documents you create or send using the platform.
        </LegalP>
      </LegalSection>

      <LegalSection title="19. AI-powered and automated features">
        <LegalP>
          PatronPro may offer features powered by artificial intelligence or automation tools, including AI-generated
          content, automated messaging, and workflow automations. You are responsible for reviewing any AI-generated
          or automated content before sending, publishing, or relying on it. PatronPro does not guarantee that
          AI-generated outputs will be accurate, complete, compliant, appropriate, or error-free.
        </LegalP>
      </LegalSection>

      <LegalSection title="20. Review requests">
        <LegalP>
          PatronPro may allow you to send review requests to your customers. You are responsible for ensuring that
          your review request practices comply with applicable platform policies (Google, Facebook, Yelp, etc.) and
          applicable laws. You may not use PatronPro to solicit or incentivize fake, misleading, or manipulated
          reviews.
        </LegalP>
      </LegalSection>

      <LegalSection title="21. Forms and landing pages">
        <LegalP>
          PatronPro may allow you to create forms, landing pages, and website widgets. You are responsible for
          ensuring that any forms or landing pages you publish comply with applicable laws, including privacy laws,
          CAN-SPAM, and TCPA. If you collect personal information or consent from third parties using PatronPro tools,
          you are responsible for maintaining appropriate records and disclosures.
        </LegalP>
      </LegalSection>

      <LegalSection title="22. Third-party services and integrations">
        <LegalP>
          PatronPro may integrate with or allow connections to third-party services. Your use of third-party services
          is subject to their own terms and policies. PatronPro is not responsible for the availability, accuracy,
          compliance, performance, pricing, or security of third-party services.
        </LegalP>
      </LegalSection>

      <LegalSection title="23. Platform availability">
        <LegalP>
          PatronPro strives to maintain a reliable and available platform, but does not guarantee uninterrupted or
          error-free service. The platform may be unavailable due to maintenance, updates, technical issues, or
          circumstances beyond our control. PatronPro is not liable for any loss or damage resulting from downtime
          or unavailability.
        </LegalP>
      </LegalSection>

      <LegalSection title="24. Customer support">
        <LegalP>
          PatronPro provides customer support via email and other channels as available. Support availability, response
          times, and scope may vary. Contact us at <LegalEmail />.
        </LegalP>
      </LegalSection>

      <LegalSection title="25. Intellectual property">
        <LegalP>
          PatronPro and all related logos, software, designs, content, and materials are owned by La Reyna Enterprises
          or its licensors. Nothing in these Terms transfers ownership of PatronPro intellectual property to you. You
          may not copy, modify, distribute, sell, or create derivative works from PatronPro's intellectual property
          without written permission.
        </LegalP>
      </LegalSection>

      <LegalSection title="26. Privacy">
        <LegalP>
          Your use of PatronPro is also governed by our Privacy Policy and Cookies Policy, which are incorporated by
          reference into these Terms.
        </LegalP>
      </LegalSection>

      <LegalSection title="27. Data retention">
        <LegalP>
          PatronPro retains account and platform data as described in our Privacy Policy. After account cancellation,
          data may be retained for up to 90 days before deletion, unless a longer retention period is required by law.
          You are responsible for exporting any data you wish to retain before cancelling your account.
        </LegalP>
      </LegalSection>

      <LegalSection title="28. Suspension and termination">
        <LegalP>
          PatronPro may suspend or terminate your account at any time if you violate these Terms, engage in
          fraudulent or abusive activity, fail to pay, or for any other reason at our discretion with reasonable
          notice where required by law. Upon termination, your right to access the platform ceases immediately.
        </LegalP>
        <LegalP>
          You may terminate your account at any time by cancelling your subscription and contacting us at{" "}
          <LegalEmail />.
        </LegalP>
      </LegalSection>

      <LegalSection title="29. Disclaimer of warranties">
        <LegalP>
          PatronPro is provided "as is" and "as available" without warranties of any kind, whether express, implied,
          or statutory. PatronPro disclaims all warranties, including but not limited to implied warranties of
          merchantability, fitness for a particular purpose, non-infringement, accuracy, and reliability. We do not
          warrant that the platform will be uninterrupted, error-free, secure, or free of viruses or other harmful
          components.
        </LegalP>
      </LegalSection>

      <LegalSection title="30. Limitation of liability">
        <LegalP>
          To the maximum extent permitted by law, La Reyna Enterprises and PatronPro shall not be liable for any
          indirect, incidental, special, consequential, punitive, or exemplary damages, including lost profits, lost
          data, loss of business, or loss of goodwill, arising out of or in connection with your use of the platform,
          even if advised of the possibility of such damages.
        </LegalP>
        <LegalP>
          PatronPro's total liability to you for any claims arising from these Terms or your use of the platform
          shall not exceed the total amount paid by you to PatronPro in the 12 months preceding the claim.
        </LegalP>
      </LegalSection>

      <LegalSection title="31. Indemnification">
        <LegalP>
          You agree to indemnify, defend, and hold harmless La Reyna Enterprises, PatronPro, and their officers,
          directors, employees, agents, and partners from and against any claims, liabilities, damages, losses, and
          expenses (including reasonable legal fees) arising out of or related to: your use of the platform, your
          Customer Content, your communications with your own customers, your violation of these Terms, or your
          violation of any applicable law.
        </LegalP>
      </LegalSection>

      <LegalSection title="32. Governing law">
        <LegalP>
          These Terms are governed by the laws of the State of California, United States, without regard to its
          conflict of law provisions. Any disputes shall be resolved in the courts of Los Angeles County, California,
          unless otherwise agreed.
        </LegalP>
      </LegalSection>

      <LegalSection title="33. Dispute resolution">
        <LegalP>
          Before filing a legal claim, you agree to contact PatronPro at <LegalEmail /> to attempt to resolve the
          dispute informally. If the dispute cannot be resolved informally within 30 days, either party may pursue
          available legal remedies.
        </LegalP>
      </LegalSection>

      <LegalSection title="34. Changes to these Terms">
        <LegalP>
          PatronPro may update these Terms at any time. We will update the "Last updated" date at the top. For
          material changes, we may provide additional notice by email or within the platform. Your continued use of
          the platform after changes become effective means you accept the updated Terms.
        </LegalP>
      </LegalSection>

      <LegalSection title="35. Assignment">
        <LegalP>
          You may not assign or transfer your rights or obligations under these Terms without our prior written
          consent. PatronPro may assign these Terms in connection with a merger, acquisition, or sale of assets.
        </LegalP>
      </LegalSection>

      <LegalSection title="36. Severability">
        <LegalP>
          If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions will
          continue in full force and effect.
        </LegalP>
      </LegalSection>

      <LegalSection title="37. No waiver">
        <LegalP>
          PatronPro's failure to enforce any provision of these Terms shall not constitute a waiver of that provision
          or any other provision.
        </LegalP>
      </LegalSection>

      <LegalSection title="38. Entire agreement">
        <LegalP>
          These Terms, together with our Privacy Policy and Cookies Policy, constitute the entire agreement between
          you and PatronPro with respect to your use of the platform and supersede all prior agreements and
          understandings.
        </LegalP>
      </LegalSection>

      <LegalSection title="39. Contact us">
        <LegalP>If you have questions about these Terms, please contact us at:</LegalP>
        <LegalContact />
      </LegalSection>
    </LegalPage>
  );
}
