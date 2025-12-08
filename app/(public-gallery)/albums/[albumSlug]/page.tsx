import { notFound } from 'next/navigation';
import { mockAlbums, getImagesByAlbum } from '@/lib/mockData';
import ImageCard from '@/components/publicGallery/ImageCard';
import PublicLayout from '@/components/layout/PublicLayout';

interface AlbumDetailPageProps {
  params: {
    albumSlug: string;
  };
}

export default function AlbumDetailPage({ params }: AlbumDetailPageProps) {
  const album = mockAlbums.find(a => a.slug === params.albumSlug);
  const images = album ? getImagesByAlbum(album.id) : [];

  if (!album) {
    notFound();
  }

  return (
    <PublicLayout>
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <nav className="flex" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-4">
              <li>
                <a href="/tags" className="text-bright-lavender-400 hover:text-bright-lavender-300">
                  Gallery
                </a>
              </li>
              <li>
                <svg className="flex-shrink-0 h-5 w-5 text-bright-lavender-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-white font-medium">{album.title}</span>
              </li>
            </ol>
          </nav>

          <div className="mt-4">
            <h1 className="text-3xl font-bold text-white">{album.title}</h1>
            {album.description && (
              <p className="mt-2 text-bright-lavender-200">{album.description}</p>
            )}
            <div className="mt-2 flex items-center space-x-4 text-sm text-bright-lavender-300">
              <span>{images.length} image{images.length !== 1 ? 's' : ''}</span>
              <span>•</span>
              <span>Created {new Date(album.createdAt).toLocaleDateString()}</span>
              <span>•</span>
              <div className="flex items-center space-x-1">
                <span>Tags:</span>
                {album.tags.map((tag, index) => (
                  <span key={tag} className="inline-flex items-center">
                    <a href={`/tags/${tag}`} className="text-indigo-600 hover:text-indigo-800">
                      {tag}
                    </a>
                    {index < album.tags.length - 1 && <span className="ml-1">,</span>}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {images.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-white">No images found</h3>
            <p className="mt-1 text-sm text-bright-lavender-300">
              This album doesn't contain any images yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {images.map((image) => (
              <ImageCard key={image.id} image={image} />
            ))}
          </div>
        )}
      </div>
    </PublicLayout>
  );
}
