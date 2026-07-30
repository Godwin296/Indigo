-- ============================================================================
-- Module 4 (complément) + Module 7 §3 : cycle de vie du Mode Contrat et
-- gestion des litiges ("bouton de secours"). Nouvelle migration plutôt que
-- de modifier 0005 (déjà poussée) — on n'édite jamais une migration déjà
-- partagée, cf docs/LOCAL_DEV.md.
-- ============================================================================

alter table public.messages add column is_system boolean not null default false;

alter table public.conversations add column proposed_by uuid references public.profiles(id);

-- ============================================================================
-- Passage en Mode Contrat : formalisation en 2 temps (propose -> confirme),
-- pas une simple case à cocher unilatérale — cohérent avec "Mutation
-- Identitaire" du Module 4 §1 qui doit être un choix mutuel assumé.
-- ============================================================================
create or replace function public.propose_contract_mode(p_conversation_id uuid)
returns void as $$
declare
  v_conversation record;
begin
  select * into v_conversation from public.conversations where id = p_conversation_id;

  if auth.uid() not in (v_conversation.participant_a, v_conversation.participant_b) then
    raise exception 'Accès refusé';
  end if;

  update public.conversations
    set type = 'contract', contract_status = 'pending', proposed_by = auth.uid()
    where id = p_conversation_id;

  insert into public.messages (conversation_id, sender_id, content, is_system)
    values (p_conversation_id, auth.uid(), 'a proposé de passer en Mode Contrat.', true);
end;
$$ language plpgsql security definer;

create or replace function public.confirm_contract_mode(p_conversation_id uuid)
returns void as $$
declare
  v_conversation record;
begin
  select * into v_conversation from public.conversations where id = p_conversation_id;

  if auth.uid() not in (v_conversation.participant_a, v_conversation.participant_b) then
    raise exception 'Accès refusé';
  end if;
  if v_conversation.contract_status != 'pending' or v_conversation.proposed_by = auth.uid() then
    raise exception 'Aucune proposition en attente de votre confirmation.';
  end if;

  update public.conversations set contract_status = 'active' where id = p_conversation_id;

  insert into public.messages (conversation_id, sender_id, content, is_system)
    values (p_conversation_id, auth.uid(), 'a confirmé le Mode Contrat. Les identités réelles sont maintenant visibles.', true);
end;
$$ language plpgsql security definer;

-- Marquer un contrat terminé incrémente le compteur public "contrats
-- réalisés" des DEUX participants (Module 1, statistique de profil).
create or replace function public.complete_contract(p_conversation_id uuid)
returns void as $$
declare
  v_conversation record;
begin
  select * into v_conversation from public.conversations where id = p_conversation_id;

  if auth.uid() not in (v_conversation.participant_a, v_conversation.participant_b) then
    raise exception 'Accès refusé';
  end if;
  if v_conversation.type != 'contract' or v_conversation.contract_status != 'active' then
    raise exception 'Seul un contrat actif peut être marqué terminé.';
  end if;

  update public.conversations set contract_status = 'completed' where id = p_conversation_id;

  update public.profiles
    set contracts_completed = contracts_completed + 1
    where id in (v_conversation.participant_a, v_conversation.participant_b);

  insert into public.messages (conversation_id, sender_id, content, is_system)
    values (p_conversation_id, auth.uid(), 'a marqué ce contrat comme terminé.', true);
end;
$$ language plpgsql security definer;

-- ============================================================================
-- Litiges (Module 7 §3) : "bouton de secours". Le signalement gèle
-- IMMÉDIATEMENT le compte du prestataire visé (il ne peut plus recevoir de
-- nouveaux clients) jusqu'à arbitrage de l'admin.
-- ============================================================================
create table public.disputes (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  reported_by uuid not null references public.profiles(id) on delete cascade,
  reported_user_id uuid not null references public.profiles(id) on delete cascade,
  reason text not null,
  proof_url text,
  status text not null default 'open'
    check (status in ('open', 'resolved_favor_reporter', 'resolved_favor_reported', 'dismissed')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index disputes_reported_user_idx on public.disputes (reported_user_id);

create or replace function public.handle_new_dispute()
returns trigger as $$
begin
  update public.conversations set contract_status = 'disputed' where id = new.conversation_id;

  -- Gel immédiat (Module 7 §3) — la levée est manuelle par l'admin, une fois
  -- la preuve de travail examinée (voir docs/ARCHITECTURE.md : le panneau
  -- admin lui-même est Supabase Studio en MVP, cf ADR-004).
  update public.profiles_private
    set is_suspended = true,
        suspension_reason = 'Litige en cours — voir table disputes'
    where id = new.reported_user_id;

  return new;
end;
$$ language plpgsql security definer;

create trigger on_dispute_created
  after insert on public.disputes
  for each row execute function public.handle_new_dispute();

-- Empêche le prestataire visé de modifier lui-même le statut du litige —
-- il ne peut fournir qu'une preuve (proof_url), l'arbitrage reste admin.
create or replace function public.protect_dispute_status()
returns trigger as $$
begin
  if current_user = 'authenticated' then
    new.status := old.status;
    new.resolved_at := old.resolved_at;
    new.reason := old.reason;
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger before_dispute_update
  before update on public.disputes
  for each row execute function public.protect_dispute_status();

alter table public.disputes enable row level security;

create policy "disputes_select_involved"
  on public.disputes for select
  to authenticated
  using (auth.uid() in (reported_by, reported_user_id));

create policy "disputes_insert_reporter"
  on public.disputes for insert
  to authenticated
  with check (reported_by = auth.uid());

create policy "disputes_update_reported_user_proof_only"
  on public.disputes for update
  to authenticated
  using (reported_user_id = auth.uid());
