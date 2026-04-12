"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import type { SiteContentMarketing } from "@/types";
import { Shield, Smartphone, WifiOff, Globe, Sparkles } from "lucide-react";
import { AppPhoneMockup } from "@/components/marketing/AppPhoneMockup";
import { PawDotField, WarmBlob, FloatingEmoji } from "@/components/marketing/PetDecor";
import { heroAppScreenshot } from "@/lib/app-screenshots";

const iconMap = [Shield, Smartphone, WifiOff, Globe];

export function HeroSection({ site }: { site: SiteContentMarketing }): React.ReactElement {
  const reduce = useReducedMotion();
  const words = site.heroHeadline.split(" ");

  return (
    <section className="relative min-h-[88vh] overflow-hidden bg-paw-pattern py-20 md:py-28 lg:min-h-[90vh]">
      <PawDotField />
      <WarmBlob className="-right-24 -top-24 h-[min(90vw,28rem)] w-[min(90vw,28rem)]" />
      <WarmBlob className="-bottom-32 -left-16 h-72 w-72 opacity-70" blur="2xl" />
      <FloatingEmoji className="right-[8%] top-[18%] opacity-80" delay={0}>
        🐕
      </FloatingEmoji>
      <FloatingEmoji className="bottom-[28%] left-[4%] text-3xl opacity-70 md:bottom-[20%]" delay={1.2}>
        🐱
      </FloatingEmoji>

      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8">
        <div>
          <motion.p
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary-dark dark:border-primary/30 dark:bg-primary/15 dark:text-primary"
          >
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            Dogs &amp; cats · India-first
          </motion.p>
          <h1 className="mt-6 text-4xl font-black leading-[1.1] tracking-tight text-stone-900 dark:text-stone-50 md:text-5xl lg:text-[3.25rem] xl:text-6xl">
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
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-stone-600 dark:text-stone-400 md:text-xl">
            {site.heroSubline}
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Button href="/download">Download free</Button>
            <Button href="/#how-it-works" variant="secondary">
              See how it works
            </Button>
          </div>
          <div className="mt-12 flex flex-wrap gap-3">
            {site.trustBadges.map((text, i) => {
              const Icon = iconMap[i % iconMap.length];
              return (
                <motion.span
                  key={text}
                  initial={reduce ? false : { opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.15 + i * 0.05 }}
                  className="inline-flex items-center gap-2 rounded-full border border-stone-200/90 bg-surface/90 px-4 py-2 text-sm font-medium text-stone-700 shadow-sm backdrop-blur-sm transition hover:border-primary/40 hover:shadow-md dark:border-stone-600 dark:bg-stone-800/80 dark:text-stone-200"
                >
                  <Icon className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                  {text}
                </motion.span>
              );
            })}
          </div>
        </div>

        <div className="relative mx-auto flex w-full max-w-sm justify-center lg:max-w-none">
          <motion.div
            className="relative flex w-full max-w-[280px] justify-center sm:max-w-xs"
            initial={reduce ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <AppPhoneMockup
              image={heroAppScreenshot}
              alt="Pawfect mobile app home dashboard with pet status, health summary, and navigation"
              priority
            />
            <div className="pointer-events-none absolute -right-4 top-1/4 hidden h-14 w-14 rounded-2xl bg-primary/90 shadow-lg md:flex md:items-center md:justify-center">
              <span className="text-2xl" aria-hidden>
                🐾
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
