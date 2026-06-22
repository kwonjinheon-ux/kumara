"use client";

import { useMemo } from "react";

import type { MarketPostImage } from "@/types/marketplace";

type Props = {
  coverImageId: string | null;
  images: MarketPostImage[];
};

export function MarketplaceImageGallery({ coverImageId, images }: Props) {
  const orderedImages = useMemo(() => {
    const coverImage = images.find((image) => image.id === coverImageId);
    const restImages = images.filter((image) => image.id !== coverImageId);
    return coverImage ? [coverImage, ...restImages] : images;
  }, [coverImageId, images]);

  if (!orderedImages.length) return null;

  return (
    <section className="market-detail-gallery" aria-label="첨부 이미지">
      <div className="market-detail-gallery__mobile">
        {orderedImages.map((image) => (
          <div className="market-detail-gallery__mobile-image" key={image.id}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt={image.alt} src={image.dataUrl} />
          </div>
        ))}
      </div>
    </section>
  );
}
