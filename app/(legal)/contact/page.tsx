import PublicLayout from '@/components/layout/PublicLayout';

export default function ContactPage() {
  return (
    <PublicLayout>
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Contact Us</h1>
          <p className="text-bright-lavender-200 text-lg">
            We're here to help! Reach out to us with any questions or concerns.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Contact Information */}
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-semibold text-white mb-6">Get in Touch</h2>
              
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-bright-lavender-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm">📧</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-white">General Support</h3>
                    <p className="text-bright-lavender-200">
                      <a href="mailto:support@visagify.com" className="hover:text-bright-lavender-100">
                        support@visagify.com
                      </a>
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-bright-lavender-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm">🔒</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-white">Privacy & Legal</h3>
                    <p className="text-bright-lavender-200">
                      <a href="mailto:privacy@visagify.com" className="hover:text-bright-lavender-100">
                        privacy@visagify.com
                      </a>
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-bright-lavender-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm">💳</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-white">Billing & Payments</h3>
                    <p className="text-bright-lavender-200">
                      <a href="mailto:billing@visagify.com" className="hover:text-bright-lavender-100">
                        billing@visagify.com
                      </a>
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-bright-lavender-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm">🚀</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-white">Business Inquiries</h3>
                    <p className="text-bright-lavender-200">
                      <a href="mailto:business@visagify.com" className="hover:text-bright-lavender-100">
                        business@visagify.com
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-white mb-4">Response Time</h3>
              <p className="text-bright-lavender-200">
                We typically respond to all inquiries within 24-48 hours during business days. 
                For urgent matters, please mark your email as "URGENT" in the subject line.
              </p>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-bright-lavender-950 p-8 rounded-lg border border-bright-lavender-800">
            <h2 className="text-2xl font-semibold text-white mb-6">Send us a Message</h2>
            
            <form className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-bright-lavender-200 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  className="w-full px-4 py-3 bg-black border border-bright-lavender-700 rounded-md text-white placeholder-bright-lavender-400 focus:outline-none focus:ring-2 focus:ring-bright-lavender-500 focus:border-transparent"
                  placeholder="Your full name"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-bright-lavender-200 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  className="w-full px-4 py-3 bg-black border border-bright-lavender-700 rounded-md text-white placeholder-bright-lavender-400 focus:outline-none focus:ring-2 focus:ring-bright-lavender-500 focus:border-transparent"
                  placeholder="your.email@example.com"
                />
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-bright-lavender-200 mb-2">
                  Subject
                </label>
                <select
                  id="subject"
                  name="subject"
                  className="w-full px-4 py-3 bg-black border border-bright-lavender-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-bright-lavender-500 focus:border-transparent"
                >
                  <option value="">Select a subject</option>
                  <option value="general">General Question</option>
                  <option value="technical">Technical Support</option>
                  <option value="billing">Billing Issue</option>
                  <option value="feature">Feature Request</option>
                  <option value="bug">Bug Report</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-bright-lavender-200 mb-2">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={6}
                  className="w-full px-4 py-3 bg-black border border-bright-lavender-700 rounded-md text-white placeholder-bright-lavender-400 focus:outline-none focus:ring-2 focus:ring-bright-lavender-500 focus:border-transparent"
                  placeholder="Please describe your question or issue in detail..."
                />
              </div>

              <button
                type="submit"
                className="w-full bg-bright-lavender-600 text-white py-3 px-6 rounded-md hover:bg-bright-lavender-500 focus:outline-none focus:ring-2 focus:ring-bright-lavender-500 focus:ring-offset-2 focus:ring-offset-black transition-colors font-medium"
              >
                Send Message
              </button>
            </form>

            <p className="mt-4 text-sm text-bright-lavender-300">
              Note: This form is currently for display purposes. Please use the email addresses above to contact us directly.
            </p>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
