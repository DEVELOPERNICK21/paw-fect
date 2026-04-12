import { z } from "zod";

export const contactFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  subject: z.string().min(1),
  message: z.string().min(20, "Message must be at least 20 characters"),
});

export const waitlistSchema = z.object({
  email: z.string().email("Invalid email"),
  source: z.enum(["web", "app"]).optional().default("web"),
});

export const pricingPlanWriteSchema = z
  .object({
    name: z.string().min(1),
    slug: z.string().min(1),
    priceMonthly: z.number().int().min(0),
    priceAnnual: z.number().int().min(0),
    currency: z.string().default("INR"),
    maxPets: z.number().int().min(1),
    isPopular: z.boolean(),
    isActive: z.boolean(),
    badgeText: z.string().optional(),
    ctaLabel: z.string().min(1),
    features: z
      .array(
        z.object({
          label: z.string().min(1),
          included: z.boolean(),
          tooltip: z.string().optional(),
          sortOrder: z.number().int(),
        }),
      )
      .min(3, "At least 3 features required"),
  })
  .refine((data) => data.priceAnnual < data.priceMonthly * 12, {
    message: "Annual price must be less than 12 × monthly",
    path: ["priceAnnual"],
  });
