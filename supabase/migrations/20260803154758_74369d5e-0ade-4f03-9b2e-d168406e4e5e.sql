-- ENUMS
CREATE TYPE public.app_role AS ENUM ('patient', 'verifier', 'admin');
CREATE TYPE public.fundraiser_status AS ENUM ('open', 'funded', 'completed', 'cancelled');
CREATE TYPE public.milestone_status AS ENUM ('pending', 'awaiting_verification', 'verified', 'released', 'rejected');
CREATE TYPE public.verifier_kind AS ENUM ('Hospital', 'NGO');
CREATE TYPE public.ledger_kind AS ENUM ('created', 'donated', 'evidence_submitted', 'verified', 'rejected', 'released');

-- SHARED TRIGGER FN
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  location TEXT,
  payout_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_public_read" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_own_insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_own_update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'display_name', NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1)))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ROLES
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE POLICY "user_roles_self_read" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "user_roles_admin_write" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- VERIFIERS
CREATE TABLE public.verifiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  slug TEXT NOT NULL UNIQUE,
  org TEXT NOT NULL,
  kind public.verifier_kind NOT NULL DEFAULT 'Hospital',
  contact TEXT NOT NULL,
  stellar_address TEXT,
  approved BOOLEAN NOT NULL DEFAULT false,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.verifiers TO authenticated;
GRANT SELECT ON public.verifiers TO anon;
GRANT ALL ON public.verifiers TO service_role;
ALTER TABLE public.verifiers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "verifiers_public_read_approved" ON public.verifiers FOR SELECT USING (approved = true);
CREATE POLICY "verifiers_own_read" ON public.verifiers FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "verifiers_apply" ON public.verifiers FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND approved = false);
CREATE POLICY "verifiers_own_update" ON public.verifiers FOR UPDATE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin')) WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER verifiers_updated_at BEFORE UPDATE ON public.verifiers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- FUNDRAISERS
CREATE TABLE public.fundraisers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  slug TEXT NOT NULL UNIQUE,
  patient TEXT NOT NULL,
  cause TEXT NOT NULL,
  summary TEXT NOT NULL DEFAULT '',
  location TEXT NOT NULL DEFAULT 'Philippines',
  goal_amount NUMERIC(14,2) NOT NULL CHECK (goal_amount > 0),
  raised_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  released_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  payout_address TEXT,
  status public.fundraiser_status NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.fundraisers TO authenticated;
GRANT SELECT ON public.fundraisers TO anon;
GRANT ALL ON public.fundraisers TO service_role;
ALTER TABLE public.fundraisers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fundraisers_public_read" ON public.fundraisers FOR SELECT USING (true);
CREATE POLICY "fundraisers_owner_insert" ON public.fundraisers FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "fundraisers_owner_update" ON public.fundraisers FOR UPDATE TO authenticated USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin')) WITH CHECK (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER fundraisers_updated_at BEFORE UPDATE ON public.fundraisers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- MILESTONES
CREATE TABLE public.milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fundraiser_id UUID NOT NULL REFERENCES public.fundraisers(id) ON DELETE CASCADE,
  verifier_id UUID REFERENCES public.verifiers(id) ON DELETE SET NULL,
  position INTEGER NOT NULL DEFAULT 1,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  status public.milestone_status NOT NULL DEFAULT 'pending',
  verifier_note TEXT,
  verified_at TIMESTAMPTZ,
  released_at TIMESTAMPTZ,
  release_tx TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (fundraiser_id, position)
);
CREATE INDEX milestones_fundraiser_idx ON public.milestones (fundraiser_id, position);
GRANT SELECT, INSERT, UPDATE ON public.milestones TO authenticated;
GRANT SELECT ON public.milestones TO anon;
GRANT ALL ON public.milestones TO service_role;
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "milestones_public_read" ON public.milestones FOR SELECT USING (true);
CREATE POLICY "milestones_owner_insert" ON public.milestones FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.fundraisers f WHERE f.id = fundraiser_id AND f.owner_id = auth.uid()));
CREATE POLICY "milestones_owner_or_verifier_update" ON public.milestones FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.fundraisers f WHERE f.id = fundraiser_id AND f.owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.verifiers v WHERE v.id = verifier_id AND v.user_id = auth.uid() AND v.approved)
    OR public.has_role(auth.uid(), 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.fundraisers f WHERE f.id = fundraiser_id AND f.owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.verifiers v WHERE v.id = verifier_id AND v.user_id = auth.uid() AND v.approved)
    OR public.has_role(auth.uid(), 'admin')
  );
CREATE TRIGGER milestones_updated_at BEFORE UPDATE ON public.milestones FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- DONATIONS
CREATE TABLE public.donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fundraiser_id UUID NOT NULL REFERENCES public.fundraisers(id) ON DELETE CASCADE,
  donor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  donor_address TEXT NOT NULL,
  amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  asset TEXT NOT NULL DEFAULT 'USDC',
  tx_hash TEXT NOT NULL UNIQUE,
  confirmed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX donations_fundraiser_idx ON public.donations (fundraiser_id, created_at DESC);
CREATE INDEX donations_donor_idx ON public.donations (donor_id, created_at DESC);
GRANT SELECT ON public.donations TO authenticated, anon;
GRANT ALL ON public.donations TO service_role;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "donations_public_read" ON public.donations FOR SELECT USING (true);

-- EVIDENCE
CREATE TABLE public.milestone_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  milestone_id UUID NOT NULL REFERENCES public.milestones(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  storage_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  content_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL DEFAULT 0,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX milestone_evidence_milestone_idx ON public.milestone_evidence (milestone_id, created_at DESC);
GRANT SELECT, INSERT, DELETE ON public.milestone_evidence TO authenticated;
GRANT ALL ON public.milestone_evidence TO service_role;
ALTER TABLE public.milestone_evidence ENABLE ROW LEVEL SECURITY;
CREATE POLICY "evidence_read_involved" ON public.milestone_evidence FOR SELECT TO authenticated USING (
  auth.uid() = uploaded_by
  OR EXISTS (
    SELECT 1 FROM public.milestones m
    JOIN public.fundraisers f ON f.id = m.fundraiser_id
    WHERE m.id = milestone_id AND f.owner_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.milestones m
    JOIN public.verifiers v ON v.id = m.verifier_id
    WHERE m.id = milestone_id AND v.user_id = auth.uid() AND v.approved
  )
  OR public.has_role(auth.uid(), 'admin')
);
CREATE POLICY "evidence_owner_insert" ON public.milestone_evidence FOR INSERT TO authenticated WITH CHECK (
  auth.uid() = uploaded_by
  AND EXISTS (
    SELECT 1 FROM public.milestones m
    JOIN public.fundraisers f ON f.id = m.fundraiser_id
    WHERE m.id = milestone_id AND f.owner_id = auth.uid()
  )
);
CREATE POLICY "evidence_owner_delete" ON public.milestone_evidence FOR DELETE TO authenticated USING (auth.uid() = uploaded_by);

-- LEDGER
CREATE TABLE public.ledger_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fundraiser_id UUID REFERENCES public.fundraisers(id) ON DELETE CASCADE,
  milestone_id UUID REFERENCES public.milestones(id) ON DELETE SET NULL,
  kind public.ledger_kind NOT NULL,
  amount NUMERIC(14,2),
  actor TEXT,
  detail TEXT,
  tx_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ledger_events_created_idx ON public.ledger_events (created_at DESC);
CREATE INDEX ledger_events_fundraiser_idx ON public.ledger_events (fundraiser_id, created_at DESC);
GRANT SELECT ON public.ledger_events TO authenticated, anon;
GRANT ALL ON public.ledger_events TO service_role;
ALTER TABLE public.ledger_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ledger_public_read" ON public.ledger_events FOR SELECT USING (true);