import PublicLayout from '@/components/layout/PublicLayout';

export default function Home() {
  return (
    <PublicLayout>
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-white sm:text-5xl md:text-6xl">
            <span className="block">AI-Powered</span>
            <span className="block text-bright-lavender-400">Face Swapping</span>
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-bright-lavender-200 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            Transform any photo with our advanced face swapping technology. 
            Upload your face, choose from our gallery, and create amazing results in seconds.
          </p>
          <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
            <div className="rounded-md shadow">
              <a
                href="/signup"
                className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-bright-lavender-600 hover:bg-bright-lavender-500 md:py-4 md:text-lg md:px-10 transition-colors"
              >
                Get Started
              </a>
            </div>
            <div className="mt-3 rounded-md shadow sm:mt-0 sm:ml-3">
              <a
                href="/tags"
                className="w-full flex items-center justify-center px-8 py-3 border border-bright-lavender-600 text-base font-medium rounded-md text-bright-lavender-400 bg-transparent hover:bg-bright-lavender-950 md:py-4 md:text-lg md:px-10 transition-colors"
              >
                Browse Gallery
              </a>
            </div>
          </div>
        </div>

        <div className="mt-16">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div className="pt-6">
              <div className="flow-root bg-bright-lavender-950 border border-bright-lavender-800 rounded-lg px-6 pb-8">
                <div className="-mt-6">
                  <div className="inline-flex items-center justify-center p-3 bg-bright-lavender-600 rounded-md shadow-lg">
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="mt-8 text-lg font-medium text-white tracking-tight">Upload Your Face</h3>
                  <p className="mt-5 text-base text-bright-lavender-200">
                    Upload your face photos to create a personal library for face swapping.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-6">
              <div className="flow-root bg-bright-lavender-950 border border-bright-lavender-800 rounded-lg px-6 pb-8">
                <div className="-mt-6">
                  <div className="inline-flex items-center justify-center p-3 bg-bright-lavender-600 rounded-md shadow-lg">
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <h3 className="mt-8 text-lg font-medium text-white tracking-tight">Choose Images</h3>
                  <p className="mt-5 text-base text-bright-lavender-200">
                    Browse our gallery and select images you want to swap your face onto.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-6">
              <div className="flow-root bg-bright-lavender-950 border border-bright-lavender-800 rounded-lg px-6 pb-8">
                <div className="-mt-6">
                  <div className="inline-flex items-center justify-center p-3 bg-bright-lavender-600 rounded-md shadow-lg">
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="mt-8 text-lg font-medium text-white tracking-tight">AI Magic</h3>
                  <p className="mt-5 text-base text-bright-lavender-200">
                    Our AI processes your request and creates stunning face-swapped results.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
