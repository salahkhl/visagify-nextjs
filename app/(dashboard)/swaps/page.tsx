export default function SwapsPage() {
  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="border-4 border-dashed border-gray-200 rounded-lg p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Your Face Swaps</h1>
          <p className="text-gray-600 mb-6">
            View the status and results of your face swap jobs
          </p>
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              Face swap history will be displayed here
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-lg shadow border">
                <div className="text-sm text-gray-500">Sample Job</div>
                <div className="text-lg font-medium">Status: Completed</div>
                <div className="text-sm text-gray-600">3 images processed</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


