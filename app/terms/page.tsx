import { LANDING_MAX_W } from "@/lib/landing-layout";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | Postmetric",
  description:
    "Terms of Service governing your use of Postmetric analytics and related services.",
};

export default function TermsPage() {
  return (
    <div className="flex flex-col w-full items-center min-h-screen antialiased font-sans bg-stone-50">
      <Navbar />
      <main
        className={`items-center w-full ${LANDING_MAX_W} border-x border-stone-200 flex flex-col bg-white`}
      >
        <div className="w-full px-6 lg:px-12 py-16 lg:py-24 border-b border-stone-200">
          <div className="flex flex-col gap-4 max-w-3xl">
            <h1 className="font-cooper text-[32px] lg:text-[48px] leading-tight text-stone-900">
              Terms of Service
            </h1>
            <p className="text-stone-500 text-lg leading-relaxed">
              Last updated: February 18, 2025. These Terms of Service
              (&quot;Terms&quot;) govern your access to and use of Postmetric
              LLC&apos;s (&quot;Postmetric,&quot; &quot;we,&quot;
              &quot;us,&quot; or &quot;our&quot;) analytics platform, website,
              and related services. By using Postmetric, you agree to these
              Terms.
            </p>
          </div>
        </div>

        <article className="w-full px-6 lg:px-12 py-12 lg:py-16">
          <div className="max-w-3xl space-y-12">
            <section>
              <h2 className="text-xl font-semibold text-stone-900 mb-4">
                1. Description of Service
              </h2>
              <p className="text-stone-600 leading-relaxed mb-4">
                Postmetric provides a web analytics platform that enables you to
                track visitor behavior, measure revenue attribution, analyze
                traffic sources, and gain actionable insights about your
                websites and applications. Our service includes a cookie-free
                tracking script, a web-based dashboard, API access, and optional
                integrations with GitHub, Twitter/X, Google Search Console, and
                payment processors.
              </p>
              <p className="text-stone-600 leading-relaxed">
                We reserve the right to modify, suspend, or discontinue any part
                of the service with reasonable notice. We will strive to provide
                advance notice of material changes where practicable.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-stone-900 mb-4">
                2. Account Registration and Responsibility
              </h2>
              <p className="text-stone-600 leading-relaxed mb-4">
                To use Postmetric, you must create an account and provide
                accurate, complete information. You are responsible for
                maintaining the confidentiality of your account credentials and
                for all activity that occurs under your account. You must notify
                us immediately of any unauthorized access or use.
              </p>
              <p className="text-stone-600 leading-relaxed">
                You must be at least 16 years old and have the legal authority
                to enter into these Terms. If you are using Postmetric on behalf
                of an organization, you represent that you have the authority to
                bind that organization.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-stone-900 mb-4">
                3. Acceptable Use
              </h2>
              <p className="text-stone-600 leading-relaxed mb-4">
                You agree to use Postmetric only for lawful purposes. You may
                not:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-stone-600 mb-4">
                <li>
                  Use the service in violation of any applicable laws or
                  regulations
                </li>
                <li>
                  Track or collect data from visitors in a way that violates
                  their privacy or applicable privacy laws
                </li>
                <li>
                  Attempt to gain unauthorized access to our systems, other
                  accounts, or third-party services
                </li>
                <li>
                  Reverse engineer, decompile, or disassemble the service except
                  as permitted by law
                </li>
                <li>
                  Resell, sublicense, or redistribute Postmetric to third
                  parties without our written consent
                </li>
                <li>
                  Use the service to send spam, distribute malware, or engage in
                  fraud
                </li>
                <li>
                  Interfere with or disrupt the integrity or performance of the
                  service
                </li>
              </ul>
              <p className="text-stone-600 leading-relaxed">
                We may suspend or terminate your account if we reasonably
                believe you have violated these Terms or engaged in conduct
                harmful to the service or other users.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-stone-900 mb-4">
                4. Billing and Payment
              </h2>
              <p className="text-stone-600 leading-relaxed mb-4">
                Paid plans are billed on a monthly or annual basis through
                Stripe. By subscribing, you authorize us to charge your payment
                method for recurring fees until you cancel. Prices are stated on
                our pricing page and may change with notice. Price changes will
                not apply to your current billing period.
              </p>
              <p className="text-stone-600 leading-relaxed mb-4">
                You may cancel your subscription at any time. Cancellation takes
                effect at the end of the current billing period; you will retain
                access until then. We do not provide refunds for partial billing
                periods, except where required by law or at our discretion.
              </p>
              <p className="text-stone-600 leading-relaxed">
                If payment fails, we may suspend your access to paid features
                after a grace period. You remain responsible for any outstanding
                fees.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-stone-900 mb-4">
                5. Your Data and Privacy
              </h2>
              <p className="text-stone-600 leading-relaxed mb-4">
                You retain ownership of the data you provide to Postmetric,
                including visitor analytics and custom events. By using our
                service, you grant us a limited license to process, store, and
                display that data as necessary to operate the platform.
              </p>
              <p className="text-stone-600 leading-relaxed">
                Our collection and use of personal information are described in
                our{" "}
                <a href="/privacy" className="text-brand-600 hover:underline">
                  Privacy Policy
                </a>
                , which is incorporated into these Terms by reference.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-stone-900 mb-4">
                6. Intellectual Property
              </h2>
              <p className="text-stone-600 leading-relaxed mb-4">
                Postmetric and its content, features, design, branding, and
                technology are owned by Postmetric LLC and protected by
                intellectual property laws. You may not copy, modify,
                distribute, or create derivative works of our service without
                our prior written consent.
              </p>
              <p className="text-stone-600 leading-relaxed">
                We welcome feedback; if you provide suggestions or ideas, we may
                use them without obligation to you.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-stone-900 mb-4">
                7. Disclaimers
              </h2>
              <p className="text-stone-600 leading-relaxed">
                THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS
                AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR
                IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF
                MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR
                NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE
                UNINTERRUPTED, ERROR-FREE, OR SECURE. YOU USE THE SERVICE AT
                YOUR OWN RISK.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-stone-900 mb-4">
                8. Limitation of Liability
              </h2>
              <p className="text-stone-600 leading-relaxed mb-4">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, POSTMETRIC LLC AND ITS
                OFFICERS, DIRECTORS, EMPLOYEES, AND AFFILIATES SHALL NOT BE
                LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR
                PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS, DATA, REVENUE, OR
                GOODWILL, ARISING FROM YOUR USE OF OR INABILITY TO USE THE
                SERVICE.
              </p>
              <p className="text-stone-600 leading-relaxed">
                OUR TOTAL LIABILITY FOR ANY CLAIM ARISING FROM THESE TERMS OR
                THE SERVICE SHALL NOT EXCEED THE AMOUNT YOU PAID US IN THE
                TWELVE (12) MONTHS PRECEDING THE CLAIM, OR ONE HUNDRED US
                DOLLARS ($100), WHICHEVER IS GREATER.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-stone-900 mb-4">
                9. Indemnification
              </h2>
              <p className="text-stone-600 leading-relaxed">
                You agree to indemnify, defend, and hold harmless Postmetric LLC
                and its officers, directors, employees, and affiliates from any
                claims, damages, losses, or expenses (including reasonable
                attorneys&apos; fees) arising from your use of the service, your
                violation of these Terms, or your violation of any third-party
                rights.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-stone-900 mb-4">
                10. Termination
              </h2>
              <p className="text-stone-600 leading-relaxed mb-4">
                You may stop using Postmetric at any time and cancel your
                account. We may suspend or terminate your access to the service
                if you breach these Terms, for non-payment, or for any other
                reason we deem necessary.
              </p>
              <p className="text-stone-600 leading-relaxed">
                Upon termination, your right to use the service ceases
                immediately. We may retain certain data as required by law or
                for legitimate business purposes. Sections that by their nature
                should survive termination (including Intellectual Property,
                Disclaimers, Limitation of Liability, and Indemnification) will
                remain in effect.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-stone-900 mb-4">
                11. Dispute Resolution and Governing Law
              </h2>
              <p className="text-stone-600 leading-relaxed mb-4">
                These Terms are governed by the laws of the State of Delaware,
                United States, without regard to conflict of law principles. Any
                dispute arising from these Terms or the service shall be
                resolved in the state or federal courts located in Delaware, and
                you consent to the personal jurisdiction of such courts.
              </p>
              <p className="text-stone-600 leading-relaxed">
                If you are located outside the United States, you may have
                additional rights under your local consumer protection laws.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-stone-900 mb-4">
                12. Changes to Terms
              </h2>
              <p className="text-stone-600 leading-relaxed">
                We may modify these Terms from time to time. We will notify you
                of material changes by posting the updated Terms on this page
                and updating the &quot;Last updated&quot; date. Your continued
                use of Postmetric after the changes take effect constitutes
                acceptance of the revised Terms. If you do not agree, you must
                stop using the service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-stone-900 mb-4">
                13. General
              </h2>
              <p className="text-stone-600 leading-relaxed mb-4">
                These Terms constitute the entire agreement between you and
                Postmetric regarding the service. If any provision is found
                unenforceable, the remaining provisions will remain in effect.
                Our failure to enforce any right does not waive that right.
              </p>
              <p className="text-stone-600 leading-relaxed">
                Contact us at{" "}
                <a
                  href="mailto:legal@postmetric.io"
                  className="text-brand-600 hover:underline"
                >
                  legal@postmetric.io
                </a>{" "}
                for questions about these Terms.
              </p>
            </section>
          </div>
        </article>

        <Footer />
      </main>
    </div>
  );
}
