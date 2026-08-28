import type { ConversationSeed } from "@/lib/types";

export const monthlyReviewTranscript = `[2026-08-05 09:00] Elena Vasquez (Executive): Let's start with July origination quality. What was the approval rate?

[2026-08-05 09:01] Priya Shah (Sales): July approval rate was 47%. That's why we are comfortable raising the Malaysia target this quarter.

[2026-08-05 09:02] Daniel Okonkwo (Risk): No, it was 39%. We define approval rate as approved applications divided by submitted applications.

[2026-08-05 09:03] Mei Chen (Finance): The dashboard showed 42% when I pulled it this morning. I used the Credit Ops dashboard.

[2026-08-05 09:04] Priya Shah (Sales): We count approved over qualified leads. That's the number my team uses in the weekly tracker.

[2026-08-05 09:05] Elena Vasquez (Executive): We cannot set a target if we do not know which number is real. Also, Malaysia approval rate dropped to 38% last month according to the regional deck.

[2026-08-05 09:06] Tomik Lee (Malaysia Credit): That 38% is retail only. I think it was around 38%.

[2026-08-05 09:07] Mei Chen (Finance): Monthly disbursement was $12.4 million.

[2026-08-05 09:08] Priya Shah (Sales): We had $14.1 million in July. That is what the Finance tracker in my spreadsheet shows.

[2026-08-05 09:09] Sofia Rahman (Operations): If you include approved but undisbursed facilities it is closer to $13.6 million.

[2026-08-05 09:10] James Liu (Product): Active customers are at 84,000 if you count anyone who logged in.

[2026-08-05 09:11] Mei Chen (Finance): We define active customers as paying customers with an outstanding balance. That is 61,200.

[2026-08-05 09:12] Elena Vasquez (Executive): Analytics, please tell us which figures we should take into the board pack. I do not want another meeting spent reconciling numbers.`;

export const slackCreditOpsTranscript = `[2026-08-06 11:14] Priya Shah (Sales): Malaysia's approval rate is 42% based on the weekly tracker. Can we use that in the partner review?

[2026-08-06 11:16] Daniel Okonkwo (Risk): That does not match the risk pack. DPD90 is 7.4% and I want the approval number from the same book.

[2026-08-06 11:18] Arjun Patel (Analytics): Please do not paste a correction into this channel. I will verify against the catalogue.

[2026-08-06 11:19] Daniel Okonkwo (Risk): @DataDrift Is the 42% approval rate mentioned above correct for Malaysia in July?`;

export const malaysiaStandupTranscript = `[2026-08-04 16:02] Tomik Lee (Malaysia Credit): Last month approval rate dropped to 38% for Malaysia.

[2026-08-04 16:04] Sofia Rahman (Operations): The Singapore deck still quotes 47% from June. We should not compare those.

[2026-08-04 16:06] Priya Shah (Sales): Singapore is using the sales funnel number. Malaysia is using submitted applications.`;

export const financeCloseTranscript = `[2026-08-03 14:10] Mei Chen (Finance): July net disbursement is $12.4 million after cancellations.

[2026-08-03 14:12] Priya Shah (Sales): Our tracker still shows $14.1 million. The official dashboard updates too late for Monday pipeline calls so we keep the spreadsheet.

[2026-08-03 14:14] Sofia Rahman (Operations): Gross disbursement including approved undisbursed is $13.6 million. Documentation still says gross in one of the metric catalogue drafts.`;

export const conversationSeeds: ConversationSeed[] = [
  {
    id: "conv_mbr_aug",
    sourceType: "upload",
    externalSourceId: "upload://july-monthly-business-review.txt",
    title: "Monthly Business Review — July performance",
    startedAt: "2026-08-05T09:00:00+08:00",
    participantIds: [
      "elena",
      "priya",
      "daniel",
      "mei",
      "sofia",
      "james",
      "tomik",
    ],
    accessPolicy: "attendees-only",
    meetingKind: "executive_review",
    authorised: true,
    notified: true,
    transcript: monthlyReviewTranscript,
  },
  {
    id: "conv_slack_credit",
    sourceType: "slack",
    externalSourceId: "slack://credit-ops/thread-42",
    title: "#credit-ops — Malaysia approval rate",
    startedAt: "2026-08-06T11:14:00+08:00",
    participantIds: ["priya", "daniel", "arjun"],
    accessPolicy: "channel-members",
    meetingKind: "slack_thread",
    authorised: true,
    notified: true,
    channel: "#credit-ops",
    transcript: slackCreditOpsTranscript,
  },
  {
    id: "conv_my_standup",
    sourceType: "meet",
    externalSourceId: "meet://malaysia-credit-weekly",
    title: "Malaysia Credit weekly standup",
    startedAt: "2026-08-04T16:00:00+08:00",
    participantIds: ["tomik", "sofia", "priya"],
    accessPolicy: "attendees-only",
    meetingKind: "regional",
    authorised: true,
    notified: true,
    transcript: malaysiaStandupTranscript,
  },
  {
    id: "conv_finance_close",
    sourceType: "meet",
    externalSourceId: "meet://finance-weekly-close",
    title: "Finance weekly close",
    startedAt: "2026-08-03T14:00:00+08:00",
    participantIds: ["mei", "priya", "sofia"],
    accessPolicy: "attendees-only",
    meetingKind: "operational",
    authorised: true,
    notified: true,
    transcript: financeCloseTranscript,
  },
];
