"use client";

import Image, { type StaticImageData } from "next/image";
import { motion, useMotionTemplate, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";

type AppPhoneMockupProps = {
  image: StaticImageData;
  alt: string;
  priority?: boolean;
  className?: string;
  float?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
  caption?: string;
  /**
   * Chassis style. Pawfect screenshots are Android, so gallery/hero default to android.
   */
  variant?: "android" | "ios";
  /** Subtle mouse-follow 3D tilt with moving glass glare. */
  tilt?: boolean;
};

const sizeStyles: Record<
  NonNullable<AppPhoneMockupProps["size"]>,
  { wrap: string; sizes: string }
> = {
  sm: { wrap: "max-w-[170px] sm:max-w-[190px]", sizes: "(max-width: 640px) 170px, 190px" },
  md: { wrap: "max-w-[210px] sm:max-w-[240px]", sizes: "(max-width: 640px) 210px, 240px" },
  lg: { wrap: "max-w-[270px] sm:max-w-[300px]", sizes: "(max-width: 640px) 270px, 300px" },
  xl: { wrap: "max-w-[300px] sm:max-w-[340px]", sizes: "(max-width: 640px) 300px, 340px" },
};

/**
 * Marketing phone chassis. Android variant matches real app screenshots
 * (thin bezel + punch-hole). iOS variant keeps Dynamic Island for generic use.
 */
export function AppPhoneMockup({
  image,
  alt,
  priority = false,
  className = "",
  float = true,
  size = "lg",
  caption,
  variant = "android",
  tilt = false,
}: AppPhoneMockupProps): React.ReactElement {
  const styles = sizeStyles[size];
  const isAndroid = variant === "android";
  const reduce = useReducedMotion();
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const sx = useSpring(px, { stiffness: 160, damping: 18 });
  const sy = useSpring(py, { stiffness: 160, damping: 18 });
  const rotY = useTransform(sx, [0, 1], tilt && !reduce ? [-12, 12] : [0, 0]);
  const rotX = useTransform(sy, [0, 1], tilt && !reduce ? [10, -10] : [0, 0]);
  const glareX = useTransform(sx, [0, 1], ["0%", "100%"]);
  const glareY = useTransform(sy, [0, 1], ["0%", "100%"]);
  const glare = useMotionTemplate`radial-gradient(circle at ${glareX} ${glareY}, rgba(255,255,255,0.28), transparent 45%)`;
  const onMove = (e: React.PointerEvent<HTMLDivElement>): void => {
    if (!tilt) return;
    const r = e.currentTarget.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width);
    py.set((e.clientY - r.top) / r.height);
  };
  const onLeave = (): void => {
    px.set(0.5);
    py.set(0.5);
  };

  return (
    <figure className={`relative w-full ${styles.wrap} ${className}`}>
      <div className={float ? "animate-float-soft" : undefined} style={{ perspective: 1100 }}>
        <motion.div
          className="relative"
          style={{ rotateX: rotX, rotateY: rotY, transformStyle: "preserve-3d" }}
          onPointerMove={onMove}
          onPointerLeave={onLeave}
        >
          <div
            className="pointer-events-none absolute -inset-6 rounded-[3rem] bg-[radial-gradient(circle_at_50%_30%,rgba(242,140,40,0.28),transparent_62%)] opacity-90 blur-2xl"
            aria-hidden
          />

          {/* Volume + power */}
          <div className="pointer-events-none absolute -left-0.5 top-[16%] z-20 space-y-3" aria-hidden>
            <span className="block h-6 w-[3px] rounded-l-full bg-gradient-to-b from-zinc-400 to-zinc-700" />
            <span className="block h-9 w-[3px] rounded-l-full bg-gradient-to-b from-zinc-400 to-zinc-700" />
            <span className="block h-9 w-[3px] rounded-l-full bg-gradient-to-b from-zinc-400 to-zinc-700" />
          </div>
          <div className="pointer-events-none absolute -right-0.5 top-[24%] z-20" aria-hidden>
            <span className="block h-12 w-[3px] rounded-r-full bg-gradient-to-b from-zinc-400 to-zinc-700" />
          </div>

          <div
            className={`relative ${isAndroid ? "rounded-[1.85rem] p-[10px] sm:rounded-[2rem] sm:p-[11px]" : "rounded-[2.4rem] p-[11px] sm:rounded-[2.65rem] sm:p-3"}`}
            style={{
              background: isAndroid
                ? "linear-gradient(160deg, #6b6b70 0%, #2a2a2e 22%, #111113 55%, #3a3a3e 78%, #0c0c0e 100%)"
                : "linear-gradient(150deg, #d9d6cf 0%, #8f8b84 18%, #3a3935 48%, #a7a39b 72%, #4a4843 100%)",
              boxShadow:
                "0 30px 60px -20px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.25), inset 0 -1px 0 rgba(0,0,0,0.5)",
            }}
          >
            <div
              className={`relative overflow-hidden bg-black ${isAndroid ? "rounded-[1.35rem] sm:rounded-[1.45rem]" : "rounded-[1.9rem] sm:rounded-[2.1rem]"}`}
            >
              {/* Camera */}
              {isAndroid ? (
                <div
                  className="pointer-events-none absolute left-1/2 top-2.5 z-20 -translate-x-1/2"
                  aria-hidden
                >
                  <span className="relative flex h-3 w-3 items-center justify-center rounded-full bg-zinc-950 ring-1 ring-white/15">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#12253a] ring-1 ring-sky-500/50" />
                  </span>
                </div>
              ) : (
                <div
                  className="pointer-events-none absolute left-1/2 top-3 z-20 -translate-x-1/2"
                  aria-hidden
                >
                  <div className="flex h-6 w-24 items-center justify-end rounded-full bg-black px-2.5">
                    <span className="mr-auto h-2 w-2 rounded-full bg-zinc-900 ring-1 ring-white/10" />
                    <span className="h-1.5 w-1.5 rounded-full bg-[#0e2a4a] ring-1 ring-sky-400/40" />
                  </div>
                </div>
              )}

              <div className="relative aspect-[9/19.5] w-full">
                <Image
                  src={image}
                  alt={alt}
                  fill
                  className="object-cover object-top"
                  sizes={styles.sizes}
                  priority={priority}
                />
              </div>

              <motion.div className="pointer-events-none absolute inset-0 z-10" style={{ background: tilt ? glare : undefined }} aria-hidden />
              <div
                className="pointer-events-none absolute inset-0 z-10 bg-[linear-gradient(115deg,transparent_38%,rgba(255,255,255,0.10)_46%,transparent_54%)]"
                aria-hidden
              />

              {!isAndroid ? (
                <div
                  className="pointer-events-none absolute inset-x-0 bottom-2 z-10 flex justify-center"
                  aria-hidden
                >
                  <span className="h-1 w-20 rounded-full bg-white/80" />
                </div>
              ) : null}
            </div>
          </div>
        </motion.div>
      </div>
      {caption ? (
        <figcaption className="mt-3 text-center text-xs font-semibold tracking-wide text-stone-600 dark:text-stone-300">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}
