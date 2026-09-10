import { supabase } from '../supabaseClient';

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function normalizePhone(value: string) {
  return value.trim().replace(/[\s()-]/g, '');
}

function throwIf(error: { code?: string; message: string } | null, duplicateMessage?: string) {
  if (!error) return;
  if (error.code === '23505') throw new Error(duplicateMessage ?? 'Ese dato ya está registrado.');
  throw error;
}

export async function syncIdentifier(personId: string, type: 'email' | 'telefono', value: string) {
  const trimmed = value.trim();
  const normalized = type === 'email' ? normalizeEmail(trimmed) : normalizePhone(trimmed);
  const { data: existing, error: findError } = await supabase
    .from('person_identifiers')
    .select('id')
    .eq('person_id', personId)
    .eq('identifier_type', type)
    .maybeSingle();
  throwIf(findError);
  if (!trimmed) {
    if (existing) {
      const { error } = await supabase.from('person_identifiers').delete().eq('id', existing.id);
      throwIf(error);
    }
    return;
  }
  if (existing) {
    const { error } = await supabase.from('person_identifiers').update({
      raw_value: trimmed,
      normalized_value: normalized,
    }).eq('id', existing.id);
    throwIf(error, 'Ese correo o teléfono ya está en otra ficha.');
    return;
  }
  const { error } = await supabase.from('person_identifiers').insert({
    person_id: personId,
    identifier_type: type,
    raw_value: trimmed,
    normalized_value: normalized,
    is_primary: true,
  });
  throwIf(error, 'Ese correo o teléfono ya está en otra ficha.');
}

export async function upsertProfessionalProfile(personId: string, specialty: string, institution: string) {
  const payload = {
    person_id: personId,
    specialty: specialty.trim() || null,
    institution: institution.trim() || null,
  };
  const { data: existing } = await supabase
    .from('professional_profiles')
    .select('id')
    .eq('person_id', personId)
    .maybeSingle();
  if (existing) {
    const { error } = await supabase.from('professional_profiles').update(payload).eq('id', existing.id);
    throwIf(error);
    return;
  }
  if (!payload.specialty && !payload.institution) return;
  const { error } = await supabase.from('professional_profiles').insert(payload);
  throwIf(error);
}

export async function findPersonIdByEmail(email: string): Promise<string | null> {
  const normalized = normalizeEmail(email);
  if (!normalized) return null;
  const { data, error } = await supabase
    .from('person_identifiers')
    .select('person_id')
    .eq('identifier_type', 'email')
    .eq('normalized_value', normalized)
    .maybeSingle();
  throwIf(error);
  return data?.person_id ?? null;
}

export async function findOrCreatePerson(input: {
  name: string;
  email: string;
  phone?: string;
  specialty?: string;
  institution?: string;
}): Promise<string> {
  const existingId = await findPersonIdByEmail(input.email);
  if (existingId) {
    const { error } = await supabase.from('people').update({
      full_name: input.name.trim(),
    }).eq('id', existingId);
    throwIf(error);
    await syncIdentifier(existingId, 'email', input.email);
    await syncIdentifier(existingId, 'telefono', input.phone ?? '');
    await upsertProfessionalProfile(existingId, input.specialty ?? '', input.institution ?? '');
    return existingId;
  }

  const { data: person, error: personError } = await supabase
    .from('people')
    .insert({ full_name: input.name.trim() })
    .select('id')
    .single();
  throwIf(personError);

  try {
    await supabase.from('person_classifications').insert({
      person_id: person.id,
      classification: 'profesional',
      source: 'manual',
    });
    await syncIdentifier(person.id, 'email', input.email);
    await syncIdentifier(person.id, 'telefono', input.phone ?? '');
    await upsertProfessionalProfile(person.id, input.specialty ?? '', input.institution ?? '');
    return person.id as string;
  } catch (err) {
    await supabase.from('people').delete().eq('id', person.id);
    throw err;
  }
}

export async function ensurePersonQr(personId: string): Promise<string> {
  const { data: existing } = await supabase
    .from('person_qr')
    .select('qr_token')
    .eq('person_id', personId)
    .maybeSingle();
  if (existing?.qr_token) return existing.qr_token;
  const { data: created, error } = await supabase
    .from('person_qr')
    .insert({ person_id: personId })
    .select('qr_token')
    .single();
  throwIf(error);
  return created.qr_token as string;
}
