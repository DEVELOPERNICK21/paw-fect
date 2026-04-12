"use client";

import { Button } from "@/components/ui/Button";
import { motion, useReducedMotion } from "framer-motion";
import { Download, Smartphone } from "lucide-react";

export function DownloadCTA(): React.ReactElement {
  const reduce = useReducedMotion();

  return (
    <section className="relative overflow-hidden py-24 md:py-32">
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-dark to-accent" />
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `radial-gradient(circle at 20% 50%, white 0 1px, transparent 2px)`,
          backgroundSize: "28px 28px",
        }}
        aria-hidden
      />
      <motion.div
        className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8"
        initial={reduce ? false : { opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/90">Start free today</p>
        <h2 className="mt-4 text-3xl font-black tracking-tight text-white drop-shadow-sm md:text-4xl lg:text-5xl">
          Give your pet the schedule they deserve
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-lg text-white/90">
          Free forever plan · No credit card · Works offline for clinic visits
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Button
            href="/download"
            variant="secondary"
            className="!border-0 !bg-stone-950 !px-8 !py-3.5 !text-white !shadow-xl hover:!bg-stone-900 dark:!bg-stone-950"
          >
            <span className="inline-flex items-center gap-2">
              <Download className="h-5 w-5" aria-hidden />
              App Store
            </span>
          </Button>
          <Button
            href="/download"
            variant="secondary"
            className="!border-0 !bg-stone-950 !px-8 !py-3.5 !text-white !shadow-xl hover:!bg-stone-900 dark:!bg-stone-950"
          >
            <span className="inline-flex items-center gap-2">
              <Smartphone className="h-5 w-5" aria-hidden />
              Google Play
            </span>
          </Button>
        </div>
        <p className="mt-10 text-sm font-medium text-white/75">Scan QR on the Download page · Same Pawfect app</p>
      </motion.div>
    </section>
  );
}
