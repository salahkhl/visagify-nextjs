export default function PublicHeader() {
  return (
    <nav className="bg-black border-b border-bright-lavender-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <a href="/" className="text-2xl font-bold text-bright-lavender-400">
              Visagify
            </a>
          </div>
          
          <div className="flex items-center space-x-4">
            <a href="/tags" className="text-bright-lavender-200 hover:text-bright-lavender-100 transition-colors">
              Gallery
            </a>
            <a href="/login" className="text-bright-lavender-200 hover:text-bright-lavender-100 transition-colors">
              Login
            </a>
            <a href="/signup" className="bg-bright-lavender-600 text-white px-4 py-2 rounded-md hover:bg-bright-lavender-500 font-medium transition-colors">
              Sign Up
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}


