import type { FaqItem } from "@/types";

/** Home-page FAQ. Every answer must describe what the shipped app actually does. */
export const homeFaqs: FaqItem[] = [
  {
    id: "what",
    question: "What is Pawfect?",
    answer:
      "Pawfect is a pet care app for dogs and cats. Add your pet once and it builds a vaccine and deworming schedule from their species and age, reminds you before things are due, and keeps their health records in one place.",
  },
  {
    id: "free",
    question: "Is it free? What do I get on the free plan?",
    answer:
      "Yes. The free plan covers one pet with schedules, reminders and three months of care history, and needs no credit card. Upgrade in the app when you want more pets or your full history.",
  },
  {
    id: "careplus",
    question: "What does Care+ add?",
    answer:
      "Care+ covers up to three pets, keeps unlimited history, adds offline access with sync, and unlocks the wellness score and extra care tasks. It is available weekly, monthly or annually.",
  },
  {
    id: "family",
    question: "What is the Family plan?",
    answer:
      "Family is for bigger households: up to ten pets, everything in Care+, and priority support.",
  },
  {
    id: "vet",
    question: "Does Pawfect replace my vet?",
    answer:
      "No. Pawfect is a scheduling and record-keeping tool, not a medical device. Schedules are informational and based on common protocols, so always confirm vaccines, dosing and timing with your veterinarian.",
  },
  {
    id: "devices",
    question: "Which phones does it work on?",
    answer:
      "iPhone and iPad (iOS 15.1 or later) and Android phones (Android 7.0 or later). It is a free download on the App Store and Google Play.",
  },
  {
    id: "cancel",
    question: "How do I cancel or manage my subscription?",
    answer:
      "Subscriptions are billed by the App Store or Google Play, so you manage and cancel them in your store account settings. Refunds follow the store's refund policy.",
  },
];
