"use client";

import { StoreButtons } from "@/components/marketing/StoreButtons";
import { motion, useReducedMotion } from "framer-motion";

export function DownloadCTA(): React.ReactElement {
  const reduce = useReducedMotion();

  return (
    <section className="relative overflow-hidden py-20 md:py-28">
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
        <h2 className="text-3xl font-black tracking-tight text-white drop-shadow-sm md:text-4xl lg:text-5xl">
          Every week without a plan is another date that can slip
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-lg text-white/90">
          Download free. Add your pet once. Get reminders before doses are due and keep every
          record in one place.
        </p>
        <StoreButtons source="cta_band" tone="light" className="mt-10 justify-center" />
        <p className="mt-8 text-sm font-medium text-white/80">
          Free forever plan. No credit card. Same Pawfect app on iOS and Android.
        </p>
      </motion.div>
    </section>
  );
}
