// Mock data for Visagify

export type Tag = {
  slug: string;
  name: string;
  imageUrl?: string;
  description?: string;
  albumCount?: number;
};

export type Album = {
  id: string;
  slug: string;
  title: string;
  description?: string;
  coverImageUrl: string;
  imageCount: number;
  tags: string[]; // tag slugs
  createdAt: string;
};

export type GalleryImage = {
  id: string;
  albumId: string;
  imageUrl: string;
  title?: string;
  description?: string;
  createdAt: string;
};

export const mockTags: Tag[] = [
  {
    slug: "beach",
    name: "Beach",
    imageUrl: "/images/placeholder-beach.jpg",
    description: "Beautiful beach and ocean scenes",
    albumCount: 3,
  },
  {
    slug: "portrait",
    name: "Portrait",
    imageUrl: "/images/placeholder-portrait.webp",
    description: "Professional portrait photography",
    albumCount: 5,
  },
  {
    slug: "urban",
    name: "Urban",
    imageUrl: "/images/placeholder-beach.jpg", // Using available image
    description: "City life and urban landscapes",
    albumCount: 2,
  },
  {
    slug: "nature",
    name: "Nature",
    imageUrl: "/images/placeholder-portrait.webp", // Using available image
    description: "Natural landscapes and wildlife",
    albumCount: 4,
  },
  {
    slug: "fashion",
    name: "Fashion",
    imageUrl: "/images/placeholder-beach.jpg", // Using available image
    description: "Fashion and style photography",
    albumCount: 3,
  },
  {
    slug: "sports",
    name: "Sports",
    imageUrl: "/images/placeholder-portrait.webp", // Using available image
    description: "Action and sports photography",
    albumCount: 2,
  },
];

export const mockAlbums: Album[] = [
  {
    id: "1",
    slug: "sunset-beach",
    title: "Sunset Beach Collection",
    description: "Beautiful sunset moments at the beach",
    coverImageUrl: "/images/placeholder-beach.jpg",
    imageCount: 12,
    tags: ["beach"],
    createdAt: "2024-01-15",
  },
  {
    id: "2",
    slug: "professional-headshots",
    title: "Professional Headshots",
    description: "Corporate and professional portrait collection",
    coverImageUrl: "/images/placeholder-portrait.webp",
    imageCount: 8,
    tags: ["portrait"],
    createdAt: "2024-01-20",
  },
  {
    id: "3",
    slug: "city-nights",
    title: "City Nights",
    description: "Urban nightlife and city scenes",
    coverImageUrl: "/images/placeholder-beach.jpg",
    imageCount: 15,
    tags: ["urban"],
    createdAt: "2024-01-25",
  },
  {
    id: "4",
    slug: "tropical-paradise",
    title: "Tropical Paradise",
    description: "Exotic beach destinations",
    coverImageUrl: "/images/placeholder-beach.jpg",
    imageCount: 20,
    tags: ["beach", "nature"],
    createdAt: "2024-02-01",
  },
  {
    id: "5",
    slug: "fashion-week",
    title: "Fashion Week Highlights",
    description: "Best moments from fashion week",
    coverImageUrl: "/images/placeholder-portrait.webp",
    imageCount: 25,
    tags: ["fashion", "portrait"],
    createdAt: "2024-02-10",
  },
];

export const mockImages: GalleryImage[] = [
  // Sunset Beach Collection
  {
    id: "img-1",
    albumId: "1",
    imageUrl: "/images/placeholder-beach.jpg",
    title: "Golden Hour",
    description: "Perfect sunset moment",
    createdAt: "2024-01-15",
  },
  {
    id: "img-2",
    albumId: "1",
    imageUrl: "/images/placeholder-beach.jpg",
    title: "Wave Reflection",
    description: "Waves reflecting the sunset",
    createdAt: "2024-01-15",
  },
  // Professional Headshots
  {
    id: "img-3",
    albumId: "2",
    imageUrl: "/images/placeholder-portrait.webp",
    title: "Executive Portrait",
    description: "Professional business portrait",
    createdAt: "2024-01-20",
  },
  {
    id: "img-4",
    albumId: "2",
    imageUrl: "/images/placeholder-portrait.webp",
    title: "Creative Professional",
    description: "Artistic professional headshot",
    createdAt: "2024-01-20",
  },
  // City Nights
  {
    id: "img-5",
    albumId: "3",
    imageUrl: "/images/placeholder-beach.jpg",
    title: "Neon Lights",
    description: "City street with neon signs",
    createdAt: "2024-01-25",
  },
  // Add more images as needed...
];

// Helper functions
export const getAlbumsByTag = (tagSlug: string): Album[] => {
  return mockAlbums.filter(album => album.tags.includes(tagSlug));
};

export const getImagesByAlbum = (albumId: string): GalleryImage[] => {
  return mockImages.filter(image => image.albumId === albumId);
};

export const getAlbumById = (albumId: string): Album | undefined => {
  return mockAlbums.find(album => album.id === albumId);
};

export const getTagBySlug = (slug: string): Tag | undefined => {
  return mockTags.find(tag => tag.slug === slug);
};
