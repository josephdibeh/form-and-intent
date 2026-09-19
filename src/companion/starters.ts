import type { Tool } from "./contract";
export const starters: { tool: Tool; label: string; prompt: string }[] = [
  {
    tool: "layout",
    label: "Compare service plans",
    prompt:
      "Design a home-cleaning service selection screen for busy parents. One-off clean: QAR 160, 3 hours, kitchen and bathroom deep clean. Weekly plan: QAR 120 per visit, 2 hours, general cleaning. Show two different information hierarchies using exactly these facts. Make price, duration, and inclusions easy to compare. Do not invent cancellation or payment policies.",
  },
  {
    tool: "layout",
    label: "Make booking costs clear",
    prompt:
      "Design a booking-review screen. Home cleaning, 3 hours, service QAR 150 plus supplies QAR 20; total QAR 170. Appointment: 25 October 2026, 10:00–13:00. Address: 12 Example Street, Doha. Explore two ways to organize the summary before the user continues. Preserve all facts and do not invent payment timing or cancellation rules.",
  },
  {
    tool: "copy",
    label: "Explain a failed payment",
    prompt:
      "Write three alternatives for a booking payment error. The card was declined, no money was taken, and the user can try another card. Explain the outcome calmly and give that next action. Keep each alternative under 130 characters. Do not promise a refund or retry automatically.",
  },
  {
    tool: "copy",
    label: "Clarify the next action",
    prompt:
      "Write three button labels for a service-selection screen. The user chooses a cleaning plan; the next screen lets them choose a date and time. This action does not confirm or charge for a booking. Keep each label to four words or fewer, with a short rationale for each.",
  },
  {
    tool: "feedback",
    label: "Find comparison friction",
    prompt:
      "Summarize these synthetic usability notes into themes and three prioritized improvements. Quote only these notes and distinguish observation from interpretation. P1: I kept switching between the plans to compare the duration. P2: I could see the price, but I could not tell which rooms were included. P3: I expected the next button to let me choose a time, but its label said Book now.",
  },
  {
    tool: "feedback",
    label: "Improve booking review",
    prompt:
      "Summarize these synthetic usability notes into themes and three prioritized improvements. Quote only these notes; do not infer participant frequency or outcomes beyond them. P1: I only noticed the supplies fee in the total. P2: I went back to check the appointment time. P3: I wanted to correct my address before continuing, but I did not see an edit action.",
  },
];
