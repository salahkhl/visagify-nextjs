import PublicLayout from '@/components/layout/PublicLayout';

export default function PrivacyPolicyPage() {
  return (
    <PublicLayout>
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="prose prose-invert max-w-none">
          <h1 className="text-4xl font-bold text-white mb-8">Privacy Policy</h1>
          
          <p className="text-bright-lavender-200 text-lg mb-8">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">1. Information We Collect</h2>
              <p className="text-bright-lavender-200 mb-4">
                At Visagify, we collect information you provide directly to us, such as when you create an account, 
                upload images for face swapping, or contact us for support.
              </p>
              <ul className="list-disc list-inside text-bright-lavender-200 space-y-2">
                <li>Account information (email, username, profile data)</li>
                <li>Images and photos you upload for face swapping</li>
                <li>Payment information (processed securely through Stripe)</li>
                <li>Usage data and analytics</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">2. How We Use Your Information</h2>
              <p className="text-bright-lavender-200 mb-4">
                We use the information we collect to:
              </p>
              <ul className="list-disc list-inside text-bright-lavender-200 space-y-2">
                <li>Provide and improve our face swapping services</li>
                <li>Process your payments and manage your account</li>
                <li>Send you important updates about our service</li>
                <li>Ensure the security and integrity of our platform</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">3. Image Processing and Storage</h2>
              <p className="text-bright-lavender-200 mb-4">
                Your uploaded images are processed using our AI face swapping technology. We take the following measures:
              </p>
              <ul className="list-disc list-inside text-bright-lavender-200 space-y-2">
                <li>Images are encrypted during transmission and storage</li>
                <li>Processing is done on secure servers</li>
                <li>Images may be temporarily cached for processing efficiency</li>
                <li>You can delete your images at any time from your account</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">4. Data Sharing</h2>
              <p className="text-bright-lavender-200 mb-4">
                We do not sell, trade, or otherwise transfer your personal information to third parties except:
              </p>
              <ul className="list-disc list-inside text-bright-lavender-200 space-y-2">
                <li>With your explicit consent</li>
                <li>To trusted service providers who assist in operating our service</li>
                <li>When required by law or to protect our rights</li>
                <li>In connection with a business transfer or acquisition</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">5. Data Security</h2>
              <p className="text-bright-lavender-200 mb-4">
                We implement appropriate security measures to protect your personal information against 
                unauthorized access, alteration, disclosure, or destruction.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">6. Your Rights</h2>
              <p className="text-bright-lavender-200 mb-4">
                You have the right to:
              </p>
              <ul className="list-disc list-inside text-bright-lavender-200 space-y-2">
                <li>Access and update your personal information</li>
                <li>Delete your account and associated data</li>
                <li>Opt out of marketing communications</li>
                <li>Request a copy of your data</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">7. Contact Us</h2>
              <p className="text-bright-lavender-200">
                If you have any questions about this Privacy Policy, please contact us at:
                <br />
                <a href="mailto:privacy@visagify.com" className="text-bright-lavender-400 hover:text-bright-lavender-300">
                  privacy@visagify.com
                </a>
              </p>
            </section>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
