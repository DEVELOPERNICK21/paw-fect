"use client";

import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import { useRef } from "react";
import { Button } from "@/components/ui/Button";
import type { SiteContentMarketing } from "@/types";
import { Sparkles } from "lucide-react";
import { AppPhoneMockup } from "@/components/marketing/AppPhoneMockup";
import { PawDotField, WarmBlob } from "@/components/marketing/PetDecor";
import { heroAppScreenshot } from "@/lib/app-screenshots";

export function HeroSection({ site }: { site: SiteContentMarketing }): React.ReactElement {
  const reduce = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const words = site.heroHeadline.split(" ");

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  const smooth = useSpring(scrollYProgress, { stiffness: 90, damping: 28, restDelta: 0.001 });

  const copyY = useTransform(smooth, [0, 1], [0, reduce ? 0 : -72]);
  const copyOpacity = useTransform(smooth, [0, 0.55], [1, reduce ? 1 : 0]);
  const phoneY = useTransform(smooth, [0, 1], [0, reduce ? 0 : 120]);
  const phoneScale = useTransform(smooth, [0, 1], [1, reduce ? 1 : 0.88]);
  const phoneRotate = useTransform(smooth, [0, 1], [0, reduce ? 0 : -6]);
  const phoneOpacity = useTransform(smooth, [0, 0.75], [1, reduce ? 1 : 0.35]);
  const blobA = useTransform(smooth, [0, 1], [0, reduce ? 0 : -80]);
  const blobB = useTransform(smooth, [0, 1], [0, reduce ? 0 : 60]);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-[100dvh] overflow-hidden bg-paw-pattern pb-16 pt-16 md:pb-20 md:pt-20 lg:min-h-[100dvh] lg:pt-24"
    >
      <PawDotField />
      <motion.div style={{ y: blobA }} className="pointer-events-none absolute inset-0" aria-hidden>
        <WarmBlob className="-right-24 -top-24 h-[min(90vw,28rem)] w-[min(90vw,28rem)]" />
      </motion.div>
      <motion.div style={{ y: blobB }} className="pointer-events-none absolute inset-0" aria-hidden>
        <WarmBlob className="-bottom-32 -left-16 h-72 w-72 opacity-70" blur="2xl" />
      </motion.div>

      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8">
        <motion.div style={{ y: copyY, opacity: copyOpacity }}>
          <motion.p
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary-dark dark:border-primary/30 dark:bg-primary/15 dark:text-primary"
          >
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            Dogs &amp; cats, India-first
          </motion.p>
          <h1 className="mt-5 max-w-xl text-4xl font-black leading-[1.1] tracking-tight text-stone-900 dark:text-stone-50 md:text-5xl lg:text-[3.25rem]">
            {reduce ? (
              site.heroHeadline
            ) : (
              <span className="flex flex-wrap gap-x-2 gap-y-1">
                {words.map((w, i) => (
                  <motion.span
                    key={`${w}-${i}`}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  >
                    {w}
                  </motion.span>
                ))}
              </span>
            )}
          </h1>
          <motion.p
            className="mt-5 max-w-xl text-lg leading-relaxed text-stone-600 dark:text-stone-400 md:text-xl"
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.45 }}
          >
            {site.heroSubline}
          </motion.p>
          <motion.div
            className="mt-8 flex flex-wrap gap-4"
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.45 }}
          >
            <Button href="/download">Get the app</Button>
            <Button href="/#how-it-works" variant="secondary">
              See how it works
            </Button>
          </motion.div>
        </motion.div>

        <div className="relative mx-auto flex w-full max-w-md justify-center lg:max-w-none lg:justify-end">
          <motion.div
            className="relative flex w-full max-w-[300px] justify-center sm:max-w-[320px]"
            style={{
              y: phoneY,
              scale: phoneScale,
              rotate: phoneRotate,
              opacity: phoneOpacity,
            }}
            initial={reduce ? false : { opacity: 0, y: 28 }}
            animate={reduce ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <AppPhoneMockup
              image={heroAppScreenshot}
              alt="Pawfect mobile app home dashboard with pet status, health summary, and navigation"
              priority
              size="xl"
              float={false}
              variant="android"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
