export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-black border-t border-bright-lavender-800 mt-auto">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          {/* Logo and Copyright */}
          <div className="flex flex-col items-center md:items-start">
            <h3 className="text-lg font-semibold text-bright-lavender-400 mb-2">Visagify</h3>
            <p className="text-bright-lavender-300 text-sm">
              © {currentYear} Visagify. All rights reserved.
            </p>
          </div>

          {/* Legal Links */}
          <div className="flex space-x-6">
            <a 
              href="/privacy-policy" 
              className="text-bright-lavender-200 hover:text-bright-lavender-100 text-sm transition-colors"
            >
              Privacy Policy
            </a>
            <a 
              href="/terms-of-use" 
              className="text-bright-lavender-200 hover:text-bright-lavender-100 text-sm transition-colors"
            >
              Terms of Use
            </a>
            <a 
              href="/contact" 
              className="text-bright-lavender-200 hover:text-bright-lavender-100 text-sm transition-colors"
            >
              Contact
            </a>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-6 pt-6 border-t border-bright-lavender-900">
          <p className="text-center text-bright-lavender-400 text-xs">
            AI-Powered Face Swapping Technology • Made with ❤️ for creative expression
          </p>
        </div>
      </div>
    </footer>
  );
}


