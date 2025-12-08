import { notFound } from 'next/navigation';
import { getTagBySlug, getAlbumsByTag } from '@/lib/mockData';
import AlbumCard from '@/components/publicGallery/AlbumCard';
import PublicLayout from '@/components/layout/PublicLayout';

interface TagDetailPageProps {
  params: {
    tagSlug: string;
  };
}

export default function TagDetailPage({ params }: TagDetailPageProps) {
  const tag = getTagBySlug(params.tagSlug);
  const albums = getAlbumsByTag(params.tagSlug);

  if (!tag) {
    notFound();
  }

  return (
    <PublicLayout>
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <nav className="flex" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-4">
              <li>
                <a href="/tags" className="text-gray-500 hover:text-gray-700">
                  Gallery
                </a>
              </li>
              <li>
                <svg className="flex-shrink-0 h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-900 font-medium">{tag.name}</span>
              </li>
            </ol>
          </nav>

          <div className="mt-4">
            <h1 className="text-3xl font-bold text-white">{tag.name}</h1>
            {tag.description && (
              <p className="mt-2 text-bright-lavender-200">{tag.description}</p>
            )}
            <p className="mt-1 text-sm text-bright-lavender-300">
              {albums.length} album{albums.length !== 1 ? 's' : ''} available
            </p>
          </div>
        </div>

        {albums.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No albums found</h3>
            <p className="mt-1 text-sm text-gray-500">
              There are no albums available for this category yet.
            </p>
            <div className="mt-6">
              <a
                href="/tags"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Browse Other Categories
              </a>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {albums.map((album) => (
              <AlbumCard key={album.id} album={album} />
            ))}
          </div>
        )}
      </div>
    </PublicLayout>
  );
}
