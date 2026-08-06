export type FundraiserStatus =
  | 'awaiting_donations'
  | 'milestone_pending'
  | 'verified_released';

export type TimelineEventKey = 'created' | 'donated' | 'verified' | 'released';

export interface TimelineEvent {
  key: TimelineEventKey;
  label: string;
  timestamp: string | null;
  txHash: string | null;
}

export interface Fundraiser {
  id: string;
  patientName: string;
  cause: string;
  shortCause: string;
  description: string;
  goal: number;
  raised: number;
  donorCount: number;
  status: FundraiserStatus;
  milestoneLabel: string;
  milestoneDescription: string;
  verifierName: string;
  verifierAddress: string;
  escrowAddress: string;
  creatorAddress: string;
  timeline: TimelineEvent[];
}

export const fundraisers: Fundraiser[] = [
  {
    id: 'mf-001',
    patientName: 'Maria Santos',
    cause: 'Kidney Dialysis — Stage 4 CKD',
    shortCause: 'Kidney dialysis, 3x weekly',
    description:
      'Maria is a 54-year-old grandmother from Cebu diagnosed with Stage 4 Chronic Kidney Disease. She requires hemodialysis three times a week at Cebu Velez General Hospital. Her husband is a retired jeepney driver and her children are overseas workers. This fundraiser covers six months of dialysis sessions plus medications.',
    goal: 4200,
    raised: 3150,
    donorCount: 47,
    status: 'milestone_pending',
    milestoneLabel: 'Month 3 dialysis completion',
    milestoneDescription:
      'Verifier confirms Maria completed all scheduled dialysis sessions for months 1–3 and that funds were applied to her hospital account.',
    verifierName: 'Cebu Velez General Hospital',
    verifierAddress: 'GCVGH...7K2M',
    escrowAddress: 'GESC1...A4NP',
    creatorAddress: 'GCRE1...B7QX',
    timeline: [
      { key: 'created', label: 'Fundraiser created', timestamp: '2026-06-14 09:22 PHT', txHash: 'a1b2c3d4e5f6' },
      { key: 'donated', label: 'Milestone funded', timestamp: '2026-07-01 14:45 PHT', txHash: 'b2c3d4e5f6a7' },
      { key: 'verified', label: 'Awaiting verification', timestamp: null, txHash: null },
      { key: 'released', label: 'Funds to be released', timestamp: null, txHash: null },
    ],
  },
  {
    id: 'mf-002',
    patientName: 'Ernesto Reyes',
    cause: 'Heart Surgery — Coronary Bypass',
    shortCause: 'Coronary bypass surgery',
    description:
      'Ernesto, 61, is a retired public school teacher from Batangas City. He suffered a mild heart attack in May 2026 and his cardiologist has recommended a triple coronary bypass. His pension covers basic living expenses but not surgical costs. This fundraiser covers surgery, ICU care, and two weeks of post-op monitoring at Philippine Heart Center.',
    goal: 12000,
    raised: 12000,
    donorCount: 134,
    status: 'verified_released',
    milestoneLabel: 'Surgery completed & discharged',
    milestoneDescription:
      'Philippine Heart Center confirms the bypass surgery was performed successfully and Ernesto has been discharged from ICU care.',
    verifierName: 'Philippine Heart Center',
    verifierAddress: 'GPHC2...9XRT',
    escrowAddress: 'GESC2...C8WV',
    creatorAddress: 'GCRE2...D5YZ',
    timeline: [
      { key: 'created', label: 'Fundraiser created', timestamp: '2026-05-20 11:00 PHT', txHash: 'c3d4e5f6a7b8' },
      { key: 'donated', label: 'Goal reached', timestamp: '2026-06-03 08:17 PHT', txHash: 'd4e5f6a7b8c9' },
      { key: 'verified', label: 'Surgery verified', timestamp: '2026-07-18 15:30 PHT', txHash: 'e5f6a7b8c9d0' },
      { key: 'released', label: 'Funds released', timestamp: '2026-07-18 15:35 PHT', txHash: 'f6a7b8c9d0e1' },
    ],
  },
  {
    id: 'mf-003',
    patientName: 'Lourdes Mendoza',
    cause: 'Breast Cancer — Chemotherapy Cycle',
    shortCause: 'Chemotherapy, 6-cycle regimen',
    description:
      'Lourdes is a 42-year-old single mother of three from Davao City, recently diagnosed with Stage 2 breast cancer. She works as a market vendor and her income has dropped significantly since her diagnosis. This fundraiser covers her full 6-cycle AC-T chemotherapy regimen at Southern Philippines Medical Center, including anti-nausea medications and lab work.',
    goal: 6800,
    raised: 1240,
    donorCount: 18,
    status: 'awaiting_donations',
    milestoneLabel: 'Cycles 1–3 of chemotherapy',
    milestoneDescription:
      'Southern Philippines Medical Center confirms Lourdes completed the first three cycles of AC-T chemotherapy and that payment was received for those sessions.',
    verifierName: 'Southern Philippines Medical Center',
    verifierAddress: 'GSPMC...3BVR',
    escrowAddress: 'GESC3...E2KF',
    creatorAddress: 'GCRE3...F9HJ',
    timeline: [
      { key: 'created', label: 'Fundraiser created', timestamp: '2026-07-28 10:14 PHT', txHash: 'g7h8i9j0k1l2' },
      { key: 'donated', label: 'Awaiting milestone funding', timestamp: null, txHash: null },
      { key: 'verified', label: 'Pending', timestamp: null, txHash: null },
      { key: 'released', label: 'Pending', timestamp: null, txHash: null },
    ],
  },
  {
    id: 'mf-004',
    patientName: 'Rodrigo Villanueva',
    cause: 'Pediatric Leukemia — Bone Marrow Transplant',
    shortCause: "Bone marrow transplant, child age 8",
    description:
      'Rodrigo is 8 years old and was diagnosed with Acute Lymphoblastic Leukemia in January 2026. After two rounds of induction chemotherapy, his oncologist at Philippine Children\'s Medical Center recommends a bone marrow transplant. His parents are domestic workers and cannot cover the transplant cost. This fundraiser covers the transplant procedure and 30-day post-transplant isolation care.',
    goal: 28000,
    raised: 14600,
    donorCount: 203,
    status: 'awaiting_donations',
    milestoneLabel: 'Transplant procedure & isolation',
    milestoneDescription:
      'Philippine Children\'s Medical Center confirms the bone marrow transplant was performed and Rodrigo completed the 30-day post-transplant isolation protocol.',
    verifierName: "Philippine Children's Medical Center",
    verifierAddress: 'GPCMC...6NXQ',
    escrowAddress: 'GESC4...G7LP',
    creatorAddress: 'GCRE4...H3TW',
    timeline: [
      { key: 'created', label: 'Fundraiser created', timestamp: '2026-06-30 16:45 PHT', txHash: 'h8i9j0k1l2m3' },
      { key: 'donated', label: 'Donations ongoing', timestamp: '2026-07-05 09:00 PHT', txHash: 'i9j0k1l2m3n4' },
      { key: 'verified', label: 'Pending', timestamp: null, txHash: null },
      { key: 'released', label: 'Pending', timestamp: null, txHash: null },
    ],
  },
  {
    id: 'mf-005',
    patientName: 'Teresita Bautista',
    cause: 'Diabetic Foot — Below-Knee Amputation',
    shortCause: 'Surgery & prosthetics rehabilitation',
    description:
      'Teresita, 67, is a retired barangay health worker from Iloilo City. Uncontrolled Type 2 diabetes led to a severe foot infection requiring a below-knee amputation. This fundraiser covers surgical costs, two weeks of hospital stay, wound care, and the initial fitting of a prosthetic limb through an NGO partner.',
    goal: 5500,
    raised: 5500,
    donorCount: 89,
    status: 'verified_released',
    milestoneLabel: 'Surgery & prosthetic fitting complete',
    milestoneDescription:
      'Iloilo Mission Hospital and Gawad Kalinga Health confirm surgery completion and successful prosthetic limb fitting.',
    verifierName: 'Iloilo Mission Hospital & Gawad Kalinga Health',
    verifierAddress: 'GGKH5...2MCX',
    escrowAddress: 'GESC5...J1RN',
    creatorAddress: 'GCRE5...K8SB',
    timeline: [
      { key: 'created', label: 'Fundraiser created', timestamp: '2026-04-10 08:30 PHT', txHash: 'j0k1l2m3n4o5' },
      { key: 'donated', label: 'Goal reached', timestamp: '2026-04-22 19:55 PHT', txHash: 'k1l2m3n4o5p6' },
      { key: 'verified', label: 'Treatment verified', timestamp: '2026-05-30 14:10 PHT', txHash: 'l2m3n4o5p6q7' },
      { key: 'released', label: 'Funds released', timestamp: '2026-05-30 14:12 PHT', txHash: 'm3n4o5p6q7r8' },
    ],
  },
];
