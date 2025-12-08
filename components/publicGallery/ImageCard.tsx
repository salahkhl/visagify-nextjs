"use client";

import React from "react";
import { GalleryImage } from "@/lib/mockData";
import { useCartContext } from "@/contexts/CartContext";

type ImageCardProps = {
  image: GalleryImage;
  showAddToCart?: boolean;
};

const ImageCard: React.FC<ImageCardProps> = ({ image, showAddToCart = true }) => {
  const { isInCart, toggleCartItem } = useCartContext();
  const itemInCart = isInCart(image.id);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    toggleCartItem(image);
    
    // Show feedback to user
    if (!itemInCart) {
      console.log(`Added "${image.title || 'Image'}" to cart`);
    } else {
      console.log(`Removed "${image.title || 'Image'}" from cart`);
    }
  };

  return (
    <div className="group relative bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden">
      <div className="aspect-w-1 aspect-h-1 relative">
        <img
          src={image.imageUrl}
          alt={image.title || 'Gallery image'}
          className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        
        {/* Overlay that appears on hover */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          {showAddToCart && (
            <button
              onClick={handleAddToCart}
              className={`px-4 py-2 rounded-md font-medium transition-colors duration-200 ${
                itemInCart
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
            >
              {itemInCart ? 'Remove from Cart' : 'Add to Cart'}
            </button>
          )}
        </div>

        {/* Cart indicator */}
        {itemInCart && (
          <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
      </div>

      {/* Image info */}
      {(image.title || image.description) && (
        <div className="p-4">
          {image.title && (
            <h3 className="text-sm font-medium text-gray-900 line-clamp-1">
              {image.title}
            </h3>
          )}
          {image.description && (
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">
              {image.description}
            </p>
          )}
          <p className="text-xs text-gray-400 mt-2">
            {new Date(image.createdAt).toLocaleDateString()}
          </p>
        </div>
      )}
    </div>
  );
};

export default ImageCard;
