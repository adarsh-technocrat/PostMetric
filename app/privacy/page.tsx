import { LANDING_MAX_W } from "@/lib/landing-layout";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Postmetric",
  description:
    "Postmetric’s privacy policy explains how we collect, use, and protect your data when you use our analytics platform.",
};

export default function PrivacyPage() {
  return (
    <div className="flex flex-col w-full items-center min-h-screen antialiased font-sans bg-stone-50">
      <Navbar />
      <main
        className={`items-center w-full ${LANDING_MAX_W} border-x border-stone-200 flex flex-col bg-white`}
      >
        {/* Hero */}
        <div className="w-full px-6 lg:px-12 py-16 lg:py-24 border-b border-stone-200">
          <div className="flex flex-col gap-4 max-w-3xl">
            <h1 className="font-cooper text-[32px] lg:text-[48px] leading-tight text-stone-900">
              Privacy Policy
            </h1>
            <p className="text-stone-500 text-lg leading-relaxed">
              Last updated: February 18, 2025. Postmetric LLC
              (&quot;Postmetric,&quot; &quot;we,&quot; &quot;us,&quot; or
              &quot;our&quot;) is committed to protecting your privacy. This
              policy describes how we collect, use, store, and share information
              when you use our analytics platform and related services.
            </p>
          </div>
        </div>

        {/* Content */}
        <article className="w-full px-6 lg:px-12 py-12 lg:py-16">
          <div className="max-w-3xl space-y-12">
            <section>
              <h2 className="text-xl font-semibold text-stone-900 mb-4">
                1. Overview
              </h2>
              <p className="text-stone-600 leading-relaxed mb-4">
                Postmetric provides privacy-friendly, cookie-free web analytics
                for developers and makers. We believe in transparent data
                practices. We do not use cookies for tracking, and we design our
                analytics to minimize the collection of personally identifiable
                information (PII) from your visitors.
              </p>
              <p className="text-stone-600 leading-relaxed">
                This policy applies to the Postmetric website (postmetric.io),
                the Postmetric dashboard, our tracking script, API, and any
                integrated services such as Stripe billing, GitHub, Twitter/X,
                or Google Search Console.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-stone-900 mb-4">
                2. Information We Collect
              </h2>
              <h3 className="text-base font-medium text-stone-800 mb-2">
                Account and billing information
              </h3>
              <p className="text-stone-600 leading-relaxed mb-4">
                When you create an account or use our services, we collect your
                email address, name (if provided), and password. For paid plans,
                billing is processed by Stripe; we receive and store limited
                billing information such as your billing email and subscription
                status. We do not store full payment card numbers.
              </p>
              <h3 className="text-base font-medium text-stone-800 mb-2">
                Visitor analytics data (from your sites)
              </h3>
              <p className="text-stone-600 leading-relaxed mb-4">
                Our tracking script collects anonymized, aggregated data about
                how visitors interact with your websites. This may include page
                views, referrers, hostnames, device and browser information,
                country-level geolocation, and similar metrics. We do not use
                cookies for this tracking. We do not collect names, emails, or
                other PII from your visitors unless you explicitly send such
                data to us via custom events.
              </p>
              <h3 className="text-base font-medium text-stone-800 mb-2">
                Integration data
              </h3>
              <p className="text-stone-600 leading-relaxed">
                If you connect GitHub, Twitter/X, Google Search Console, or
                other integrations, we receive data permitted by those services.
                We use this data solely to provide analytics and insights within
                the Postmetric dashboard. We do not sell or share integration
                data with third parties for marketing purposes.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-stone-900 mb-4">
                3. How We Use Your Information
              </h2>
              <p className="text-stone-600 leading-relaxed mb-4">
                We use the information we collect to:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-stone-600">
                <li>Operate, maintain, and improve the Postmetric platform</li>
                <li>
                  Provide analytics, reports, and actionable insights to your
                  dashboard
                </li>
                <li>Process payments and manage your subscription</li>
                <li>
                  Send you product updates, security notices, and support
                  communications
                </li>
                <li>Detect and prevent fraud, abuse, and security incidents</li>
                <li>
                  Comply with applicable laws and respond to legal requests
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-stone-900 mb-4">
                4. Data Storage and Retention
              </h2>
              <p className="text-stone-600 leading-relaxed mb-4">
                We store your data on secure servers. Visitor analytics data is
                retained according to your plan and configuration. You can
                request deletion of your account and associated data at any
                time; we will process such requests within a reasonable period
                as required by law.
              </p>
              <p className="text-stone-600 leading-relaxed">
                We retain certain information as needed for legal, regulatory,
                or security purposes, such as billing records or logs related to
                fraud prevention.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-stone-900 mb-4">
                5. Third-Party Services
              </h2>
              <p className="text-stone-600 leading-relaxed mb-4">
                We use trusted third-party services to operate Postmetric:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-stone-600 mb-4">
                <li>
                  <strong>Stripe</strong> – Payment processing. Stripe&apos;s
                  privacy policy applies to their handling of your payment data.
                </li>
                <li>
                  <strong>Firebase</strong> – Authentication and account
                  management.
                </li>
                <li>
                  <strong>Vercel</strong> – Hosting and infrastructure for our
                  application.
                </li>
              </ul>
              <p className="text-stone-600 leading-relaxed">
                These providers are bound by their own privacy policies and
                contractual obligations. We do not sell your personal
                information to third parties.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-stone-900 mb-4">
                6. Your Rights
              </h2>
              <p className="text-stone-600 leading-relaxed mb-4">
                Depending on your location, you may have the right to:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-stone-600 mb-4">
                <li>Access the personal data we hold about you</li>
                <li>Request correction of inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Object to or restrict certain processing</li>
                <li>Data portability</li>
              </ul>
              <p className="text-stone-600 leading-relaxed">
                To exercise these rights, contact us at{" "}
                <a
                  href="mailto:privacy@postmetric.io"
                  className="text-brand-600 hover:underline"
                >
                  privacy@postmetric.io
                </a>
                . If you are in the EEA or UK, you may also have the right to
                lodge a complaint with your local data protection authority.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-stone-900 mb-4">
                7. Data Security
              </h2>
              <p className="text-stone-600 leading-relaxed">
                We implement industry-standard security measures including
                encryption in transit (TLS), access controls, and regular
                security reviews. While we strive to protect your data, no
                method of transmission or storage over the internet is 100%
                secure.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-stone-900 mb-4">
                8. Children&apos;s Privacy
              </h2>
              <p className="text-stone-600 leading-relaxed">
                Postmetric is not intended for use by individuals under 16 years
                of age. We do not knowingly collect personal information from
                children. If you believe we have collected such information,
                please contact us and we will delete it promptly.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-stone-900 mb-4">
                9. Changes to This Policy
              </h2>
              <p className="text-stone-600 leading-relaxed">
                We may update this privacy policy from time to time. We will
                notify you of material changes by posting the updated policy on
                this page and updating the &quot;Last updated&quot; date. Your
                continued use of Postmetric after such changes constitutes
                acceptance of the updated policy.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-stone-900 mb-4">
                10. Contact Us
              </h2>
              <p className="text-stone-600 leading-relaxed">
                For questions about this privacy policy or our data practices,
                contact Postmetric LLC at{" "}
                <a
                  href="mailto:privacy@postmetric.io"
                  className="text-brand-600 hover:underline"
                >
                  privacy@postmetric.io
                </a>
                .
              </p>
            </section>
          </div>
        </article>

        <Footer />
      </main>
    </div>
  );
}
