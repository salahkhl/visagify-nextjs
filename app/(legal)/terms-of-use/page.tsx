import PublicLayout from '@/components/layout/PublicLayout';

export default function TermsOfUsePage() {
  return (
    <PublicLayout>
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="prose prose-invert max-w-none">
          <h1 className="text-4xl font-bold text-white mb-8">Terms of Use</h1>
          
          <p className="text-bright-lavender-200 text-lg mb-8">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">1. Acceptance of Terms</h2>
              <p className="text-bright-lavender-200 mb-4">
                By accessing and using Visagify, you accept and agree to be bound by the terms and provision 
                of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">2. Description of Service</h2>
              <p className="text-bright-lavender-200 mb-4">
                Visagify is an AI-powered face swapping platform that allows users to:
              </p>
              <ul className="list-disc list-inside text-bright-lavender-200 space-y-2">
                <li>Upload and manage face images</li>
                <li>Perform face swapping operations using AI technology</li>
                <li>Access a gallery of available images for swapping</li>
                <li>Purchase credits or subscribe to premium features</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">3. User Responsibilities</h2>
              <p className="text-bright-lavender-200 mb-4">
                As a user of Visagify, you agree to:
              </p>
              <ul className="list-disc list-inside text-bright-lavender-200 space-y-2">
                <li>Only upload images you own or have permission to use</li>
                <li>Not upload inappropriate, offensive, or illegal content</li>
                <li>Respect the intellectual property rights of others</li>
                <li>Use the service responsibly and ethically</li>
                <li>Not attempt to reverse engineer or hack the platform</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">4. Prohibited Uses</h2>
              <p className="text-bright-lavender-200 mb-4">
                You may not use Visagify for:
              </p>
              <ul className="list-disc list-inside text-bright-lavender-200 space-y-2">
                <li>Creating deepfakes for malicious purposes</li>
                <li>Impersonating others without consent</li>
                <li>Generating content that violates laws or regulations</li>
                <li>Harassment, bullying, or defamation</li>
                <li>Commercial use without proper licensing</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">5. Payment Terms</h2>
              <p className="text-bright-lavender-200 mb-4">
                Payment processing is handled securely through Stripe. By making a purchase, you agree to:
              </p>
              <ul className="list-disc list-inside text-bright-lavender-200 space-y-2">
                <li>Provide accurate payment information</li>
                <li>Pay all charges incurred under your account</li>
                <li>Understand that credits are non-refundable</li>
                <li>Accept that subscription fees are billed in advance</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">6. Intellectual Property</h2>
              <p className="text-bright-lavender-200 mb-4">
                The Visagify platform, including its AI technology, design, and content, is protected by 
                intellectual property laws. You retain ownership of images you upload, but grant us a 
                license to process them for the service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">7. Limitation of Liability</h2>
              <p className="text-bright-lavender-200 mb-4">
                Visagify is provided "as is" without warranties of any kind. We are not liable for any 
                damages arising from your use of the service, including but not limited to direct, 
                indirect, incidental, or consequential damages.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">8. Termination</h2>
              <p className="text-bright-lavender-200 mb-4">
                We reserve the right to terminate or suspend your account at any time for violations 
                of these terms. You may also terminate your account at any time through your account settings.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">9. Changes to Terms</h2>
              <p className="text-bright-lavender-200 mb-4">
                We reserve the right to modify these terms at any time. Changes will be effective 
                immediately upon posting. Your continued use of the service constitutes acceptance of the modified terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">10. Contact Information</h2>
              <p className="text-bright-lavender-200">
                For questions about these Terms of Use, please contact us at:
                <br />
                <a href="mailto:legal@visagify.com" className="text-bright-lavender-400 hover:text-bright-lavender-300">
                  legal@visagify.com
                </a>
              </p>
            </section>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
