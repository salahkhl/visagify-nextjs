"use client";

import Link from "next/link";
import React from "react";
import { Album } from "@/lib/mockData";

type AlbumCardProps = {
  album: Album;
};

const AlbumCard: React.FC<AlbumCardProps> = ({ album }) => {
  return (
    <Link
      href={`/albums/${album.slug}`}
      className="group block bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden"
    >
      <div className="aspect-w-16 aspect-h-9 relative">
        <img
          src={album.coverImageUrl}
          alt={`Cover for ${album.title}`}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
          <h3 className="text-lg font-semibold line-clamp-2">{album.title}</h3>
          {album.description && (
            <p className="text-sm text-gray-200 mt-1 line-clamp-2">{album.description}</p>
          )}
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-gray-300">
              {album.imageCount} image{album.imageCount !== 1 ? 's' : ''}
            </p>
            <p className="text-xs text-gray-300">
              {new Date(album.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default AlbumCard;


