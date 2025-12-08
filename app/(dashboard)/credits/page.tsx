export default function CreditsPage() {
  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="border-4 border-dashed border-gray-200 rounded-lg p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Credits & Billing</h1>
          <p className="text-gray-600 mb-6">
            Manage your face swap credits and subscriptions
          </p>
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow border">
              <h2 className="text-lg font-medium mb-2">Current Balance</h2>
              <div className="text-3xl font-bold text-blue-600">15 Credits</div>
              <p className="text-sm text-gray-500">Each face swap uses 1 credit</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-lg shadow border">
                <h3 className="font-medium mb-2">Buy Credits</h3>
                <p className="text-sm text-gray-600 mb-4">One-time purchase</p>
                <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                  Purchase Credits
                </button>
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow border">
                <h3 className="font-medium mb-2">Monthly Subscription</h3>
                <p className="text-sm text-gray-600 mb-4">Recurring credits</p>
                <button className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">
                  Subscribe
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


