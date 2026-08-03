-- STORAGE POLICIES for private 'evidence' bucket
CREATE POLICY "evidence_upload_own_folder" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'evidence' AND owner = auth.uid());
CREATE POLICY "evidence_read_involved" ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'evidence' AND (
      owner = auth.uid()
      OR public.has_role(auth.uid(), 'admin')
      OR EXISTS (
        SELECT 1 FROM public.milestone_evidence e
        JOIN public.milestones m ON m.id = e.milestone_id
        JOIN public.fundraisers f ON f.id = m.fundraiser_id
        WHERE e.storage_path = storage.objects.name AND f.owner_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM public.milestone_evidence e
        JOIN public.milestones m ON m.id = e.milestone_id
        JOIN public.verifiers v ON v.id = m.verifier_id
        WHERE e.storage_path = storage.objects.name AND v.user_id = auth.uid() AND v.approved
      )
    )
  );
CREATE POLICY "evidence_delete_own" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'evidence' AND owner = auth.uid());

-- SEED VERIFIERS
INSERT INTO public.verifiers (id, slug, org, kind, contact, stellar_address, approved, applied_at) VALUES
  ('11111111-1111-4111-8111-000000000001', 'chong-hua', 'Chong Hua Hospital — Billing Office', 'Hospital', 'billing@chonghua.example.ph', 'GCHONGHUA7Q2XK4M9PJTLVZ8RD3NWFY6BSAE1CQXU2MKD5RTP', true, '2026-01-12T08:00:00Z'),
  ('11111111-1111-4111-8111-000000000002', 'kythe', 'Kythe Foundation (NGO)', 'NGO', 'verify@kythe.example.ph', 'GKYTHE9PL3MX2QVD7RNB4TSJ8WCFA6EUHO5KZI1YRXM2DPTV', true, '2026-02-04T08:00:00Z'),
  ('11111111-1111-4111-8111-000000000003', 'spmc', 'Southern Philippines Medical Center', 'Hospital', 'records@spmc.example.ph', 'GSPMC4KD8LQ2ZX7VNRJ9TYE3WB6MFAH5UCPO1DSKR2XVL9TN', true, '2026-02-20T08:00:00Z');

-- SEED FUNDRAISERS
INSERT INTO public.fundraisers (id, slug, patient, cause, summary, location, goal_amount, raised_amount, released_amount, status, created_at) VALUES
  ('22222222-2222-4222-8222-000000000001', 'maria-dialysis', 'Maria Dela Cruz', 'Twice-weekly dialysis, 3 months', 'Maria, 54, from Cebu City has stage 5 kidney disease. Funds cover 24 dialysis sessions at Chong Hua Hospital while she waits for a transplant match.', 'Cebu City', 4800, 4800, 0, 'funded', '2026-06-02T09:14:00Z'),
  ('22222222-2222-4222-8222-000000000002', 'jomar-surgery', 'Jomar Aquino', 'Emergency appendectomy & recovery', 'Jomar, 17, was admitted in Davao after an appendix rupture. Escrow covers the surgical package and five days of post-op care.', 'Davao City', 2200, 2200, 2200, 'completed', '2026-04-11T03:20:00Z'),
  ('22222222-2222-4222-8222-000000000003', 'elena-chemo', 'Elena Bautista', 'Breast cancer — 4 chemotherapy cycles', 'Elena, 41, a public school teacher in Quezon City, needs four cycles of chemotherapy. Funds release per completed cycle, verified by her oncology unit.', 'Quezon City', 6500, 2140, 0, 'open', '2026-07-21T13:02:00Z'),
  ('22222222-2222-4222-8222-000000000004', 'renz-prosthesis', 'Renz Villanueva', 'Below-knee prosthesis fitting', 'Renz, 29, a fisherman from Iloilo, lost his lower leg in a boat accident. Escrow covers the prosthesis and eight rehab sessions.', 'Iloilo City', 3100, 950, 0, 'open', '2026-07-26T05:55:00Z');

-- SEED MILESTONES
INSERT INTO public.milestones (id, fundraiser_id, verifier_id, position, title, description, amount, status, verified_at, released_at, created_at) VALUES
  ('33333333-3333-4333-8333-000000000001', '22222222-2222-4222-8222-000000000001', '11111111-1111-4111-8111-000000000001', 1, 'First 12 dialysis sessions', '12 sessions completed and invoiced by Chong Hua Hospital', 2400, 'awaiting_verification', NULL, NULL, '2026-06-02T09:14:00Z'),
  ('33333333-3333-4333-8333-000000000002', '22222222-2222-4222-8222-000000000001', '11111111-1111-4111-8111-000000000001', 2, 'Final 12 dialysis sessions', 'Remaining 12 sessions completed and invoiced', 2400, 'pending', NULL, NULL, '2026-06-02T09:14:00Z'),
  ('33333333-3333-4333-8333-000000000003', '22222222-2222-4222-8222-000000000002', '11111111-1111-4111-8111-000000000003', 1, 'Surgery performed', 'Appendectomy performed and operative report issued', 1500, 'released', '2026-05-02T07:31:00Z', '2026-05-02T07:33:00Z', '2026-04-11T03:20:00Z'),
  ('33333333-3333-4333-8333-000000000004', '22222222-2222-4222-8222-000000000002', '11111111-1111-4111-8111-000000000003', 2, 'Discharge & post-op care', 'Five days of post-op care completed, discharge summary issued', 700, 'released', '2026-05-02T07:31:00Z', '2026-05-02T07:33:00Z', '2026-04-11T03:20:00Z'),
  ('33333333-3333-4333-8333-000000000005', '22222222-2222-4222-8222-000000000003', '11111111-1111-4111-8111-000000000002', 1, 'Chemotherapy cycles 1–2', 'First two cycles administered at the oncology unit', 3250, 'pending', NULL, NULL, '2026-07-21T13:02:00Z'),
  ('33333333-3333-4333-8333-000000000006', '22222222-2222-4222-8222-000000000003', '11111111-1111-4111-8111-000000000002', 2, 'Chemotherapy cycles 3–4', 'Final two cycles administered and treatment summary issued', 3250, 'pending', NULL, NULL, '2026-07-21T13:02:00Z'),
  ('33333333-3333-4333-8333-000000000007', '22222222-2222-4222-8222-000000000004', '11111111-1111-4111-8111-000000000002', 1, 'Prosthesis fitted', 'Below-knee prosthesis fitted and signed off', 2200, 'pending', NULL, NULL, '2026-07-26T05:55:00Z'),
  ('33333333-3333-4333-8333-000000000008', '22222222-2222-4222-8222-000000000004', '11111111-1111-4111-8111-000000000002', 2, 'Eight rehabilitation sessions', 'Rehab programme completed', 900, 'pending', NULL, NULL, '2026-07-26T05:55:00Z');

-- SEED LEDGER
INSERT INTO public.ledger_events (fundraiser_id, milestone_id, kind, amount, actor, detail, created_at) VALUES
  ('22222222-2222-4222-8222-000000000001', NULL, 'created', 4800, 'Maria Dela Cruz', 'Fundraiser created with 2 milestones', '2026-06-02T09:14:00Z'),
  ('22222222-2222-4222-8222-000000000001', NULL, 'donated', 4800, 'Community donors', 'Goal reached', '2026-07-18T22:05:00Z'),
  ('22222222-2222-4222-8222-000000000002', NULL, 'created', 2200, 'Jomar Aquino', 'Fundraiser created with 2 milestones', '2026-04-11T03:20:00Z'),
  ('22222222-2222-4222-8222-000000000002', NULL, 'donated', 2200, 'Community donors', 'Goal reached', '2026-04-19T11:48:00Z'),
  ('22222222-2222-4222-8222-000000000002', '33333333-3333-4333-8333-000000000003', 'verified', 1500, 'Southern Philippines Medical Center', 'Surgery verified', '2026-05-02T07:31:00Z'),
  ('22222222-2222-4222-8222-000000000002', '33333333-3333-4333-8333-000000000003', 'released', 1500, 'MedFund escrow', 'Funds released to patient payout address', '2026-05-02T07:33:00Z'),
  ('22222222-2222-4222-8222-000000000002', '33333333-3333-4333-8333-000000000004', 'verified', 700, 'Southern Philippines Medical Center', 'Discharge verified', '2026-05-02T07:31:00Z'),
  ('22222222-2222-4222-8222-000000000002', '33333333-3333-4333-8333-000000000004', 'released', 700, 'MedFund escrow', 'Funds released to patient payout address', '2026-05-02T07:33:00Z'),
  ('22222222-2222-4222-8222-000000000003', NULL, 'created', 6500, 'Elena Bautista', 'Fundraiser created with 2 milestones', '2026-07-21T13:02:00Z'),
  ('22222222-2222-4222-8222-000000000003', NULL, 'donated', 2140, 'Community donors', 'Partial funding', '2026-07-29T18:40:00Z'),
  ('22222222-2222-4222-8222-000000000004', NULL, 'created', 3100, 'Renz Villanueva', 'Fundraiser created with 2 milestones', '2026-07-26T05:55:00Z'),
  ('22222222-2222-4222-8222-000000000004', NULL, 'donated', 950, 'Community donors', 'Partial funding', '2026-07-30T02:11:00Z');