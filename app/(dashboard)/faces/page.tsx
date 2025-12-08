export default function FacesPage() {
  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="border-4 border-dashed border-gray-200 rounded-lg p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Your Face Library</h1>
          <p className="text-gray-600 mb-6">
            Upload and manage your face images for face swapping
          </p>
          <div className="space-y-4">
            <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
              Upload New Face
            </button>
            <p className="text-sm text-gray-500">
              Face upload functionality will be implemented here
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}


