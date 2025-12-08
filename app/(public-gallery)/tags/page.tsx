import { mockTags } from "@/lib/mockData";
import TagsList from "@/components/publicGallery/TagsList";
import PublicLayout from "@/components/layout/PublicLayout";

export default function TagsPage() {
  return (
    <PublicLayout>
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Browse Gallery</h1>
          <p className="mt-2 text-bright-lavender-200">
            Choose a category to explore our collection of images for face swapping
          </p>
        </div>

        <TagsList tags={mockTags} />
      </div>
    </PublicLayout>
  );
}
