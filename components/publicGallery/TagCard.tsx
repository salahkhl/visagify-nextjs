"use client";

import Link from "next/link";
import React from "react";
import { Tag } from "@/lib/mockData";

type TagCardProps = {
  tag: Tag;
};

const TagCard: React.FC<TagCardProps> = ({ tag }) => {
  return (
    <Link
      href={`/tags/${tag.slug}`}
      className="group block bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden"
    >
      <div className="aspect-w-16 aspect-h-9 relative">
        {tag.imageUrl ? (
          <img
            src={tag.imageUrl}
            alt={`Thumbnail for ${tag.name}`}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
            <span className="text-gray-500">No Image</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
          <h3 className="text-lg font-semibold">{tag.name}</h3>
          {tag.description && (
            <p className="text-sm text-gray-200 mt-1">{tag.description}</p>
          )}
          {tag.albumCount && (
            <p className="text-xs text-gray-300 mt-2">
              {tag.albumCount} album{tag.albumCount !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
};

export default TagCard;
