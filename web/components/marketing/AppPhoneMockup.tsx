"use client";

import Image, { type StaticImageData } from "next/image";

type AppPhoneMockupProps = {
  image: StaticImageData;
  alt: string;
  priority?: boolean;
  className?: string;
};

export function AppPhoneMockup({
  image,
  alt,
  priority = false,
  className = "",
}: AppPhoneMockupProps): React.ReactElement {
  return (
    <div className={`relative w-full max-w-[280px] sm:max-w-xs ${className}`}>
      <div className="animate-float-soft">
        <div className="overflow-hidden rounded-[2.5rem] border-[10px] border-stone-900 shadow-2xl shadow-stone-900/40 ring-1 ring-white/10 dark:border-stone-600">
          <div className="relative aspect-[9/19] w-full bg-stone-950">
            <Image
              src={image}
              alt={alt}
              fill
              className="object-cover object-top"
              sizes="(max-width: 640px) 280px, 320px"
              priority={priority}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
