import { supabase } from '../supabaseClient';
import type { SpeakerPublic } from '../../components/speakers/speakerData';

export type SpeakerStatus = 'invitado' | 'confirmado' | 'publicado' | 'declinado' | 'pendiente';

export function slugifySpeakerName(name: string) {
  const base = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return base || 'speaker';
}

export type CatalogSpeaker = {
  id: string;
  person_id: string;
  slug: string;
  name: string;
  specialty: string;
  role: string;
  institution: string;
  country: string;
  city: string;
  talks: string[];
  featured: boolean;
  status: SpeakerStatus;
  events: { id: string; name: string; status: SpeakerStatus }[];
  photo_url: string;
  bio: string;
  email: string;
  telefono: string;
  linkedin: string;
  website: string;
  instagram: string;
  is_public: boolean;
};

export type SpeakerWrite = {
  name: string;
  specialty: string;
  role: string;
  institution: string;
  city: string;
  country: string;
  talk: string;
  status: SpeakerStatus;
  bio: string;
  foto: string;
  email: string;
  linkedin: string;
  telefono: string;
  event_ids: string[];
  featured: boolean;
};

type IdentifierRow = { identifier_type: string; raw_value: string | null };
type EventSpeakerRow = {
  id: string;
  event_id: string;
  status: string;
  is_featured: boolean | null;
  events: { id: string; name: string } | { id: string; name: string }[] | null;
};
type PersonRow = {
  id: string;
  full_name: string;
  city: string | null;
  country: string | null;
  avatar_url: string | null;
  person_identifiers?: IdentifierRow[] | null;
};
type ProfileRow = {
  id: string;
  person_id: string;
  public_slug: string | null;
  public_title: string | null;
  public_institution: string | null;
  specialty: string | null;
  topics: string[] | null;
  bio: string | null;
  photo_url: string | null;
  linkedin_url: string | null;
  website_url: string | null;
  instagram_url: string | null;
  is_public: boolean;
  people: PersonRow | PersonRow[] | null;
  event_speakers?: EventSpeakerRow[] | null;
};

const PROFILE_SELECT = `
  id, person_id, public_slug, public_title, public_institution, specialty, topics, bio, photo_url,
  linkedin_url, website_url, instagram_url, is_public,
  people:person_id(id, full_name, city, country, avatar_url, person_identifiers(identifier_type, raw_value)),
  event_speakers(id, event_id, status, is_featured, events:event_id(id, name))
`.replace(/\s+/g, ' ').trim();

function one<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

function asStatus(value: string | null | undefined): SpeakerStatus {
  if (value === 'confirmado' || value === 'publicado' || value === 'invitado' || value === 'declinado' || value === 'pendiente') {
    return value;
  }
  if (value === 'en-negociacion') return 'pendiente';
  if (value === 'cancelado') return 'declinado';
  return 'pendiente';
}

function deriveStatus(events: CatalogSpeaker['events'], isPublic: boolean): SpeakerStatus {
  if (isPublic || events.some((item) => item.status === 'publicado')) return 'publicado';
  if (events.some((item) => item.status === 'confirmado')) return 'confirmado';
  if (events.some((item) => item.status === 'invitado')) return 'invitado';
  if (events.some((item) => item.status === 'pendiente')) return 'pendiente';
  if (events.some((item) => item.status === 'declinado')) return 'declinado';
  return 'pendiente';
}

function identifierOf(person: PersonRow | null, type: string): string {
  return person?.person_identifiers?.find((row) => row.identifier_type === type)?.raw_value ?? '';
}

function mapProfile(row: ProfileRow): CatalogSpeaker {
  const person = one(row.people);
  const assignments = (row.event_speakers ?? []).map((item) => {
    const event = one(item.events);
    return {
      id: item.event_id,
      name: event?.name ?? 'Evento',
      status: asStatus(item.status),
    };
  });
  const name = person?.full_name ?? 'Speaker';
  return {
    id: row.id,
    person_id: row.person_id,
    slug: row.public_slug || slugifySpeakerName(name),
    name,
    specialty: row.specialty ?? '',
    role: row.public_title || 'Conferencista',
    institution: row.public_institution ?? '',
    country: person?.country ?? 'Colombia',
    city: person?.city ?? '',
    talks: row.topics?.filter(Boolean) ?? [],
    featured: (row.event_speakers ?? []).some((item) => Boolean(item.is_featured)),
    status: deriveStatus(assignments, row.is_public),
    events: assignments,
    photo_url: row.photo_url || person?.avatar_url || '',
    bio: row.bio ?? '',
    email: identifierOf(person, 'email'),
    telefono: identifierOf(person, 'telefono'),
    linkedin: row.linkedin_url ?? '',
    website: row.website_url ?? '',
    instagram: row.instagram_url ?? '',
    is_public: row.is_public,
  };
}

async function uniqueSpeakerSlug(name: string, exceptId?: string): Promise<string> {
  const base = slugifySpeakerName(name);
  let candidate = base;
  let n = 2;
  while (n < 50) {
    const { data, error } = await supabase
      .from('speaker_profiles')
      .select('id')
      .eq('public_slug', candidate)
      .maybeSingle();
    throwIf(error);
    if (!data || data.id === exceptId) return candidate;
    candidate = `${base}-${n}`;
    n += 1;
  }
  return `${base}-${Date.now().toString(36)}`;
}

function throwIf(error: { code?: string; message: string } | null) {
  if (!error) return;
  if (error.code === '23505') throw new Error('Ese correo o teléfono ya está en otra ficha.');
  throw error;
}

async function syncIdentifier(personId: string, type: 'email' | 'telefono', value: string) {
  const trimmed = value.trim();
  const normalized = type === 'email'
    ? trimmed.toLowerCase()
    : trimmed.replace(/[\s()-]/g, '');
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
    throwIf(error);
    return;
  }
  const { error } = await supabase.from('person_identifiers').insert({
    person_id: personId,
    identifier_type: type,
    raw_value: trimmed,
    normalized_value: normalized,
    is_primary: true,
  });
  throwIf(error);
}

async function syncEventAssignments(
  speakerId: string,
  eventIds: string[],
  status: SpeakerStatus,
  featured: boolean,
) {
  const nextIds = [...new Set(eventIds.filter(Boolean))];
  const { data: current, error: listError } = await supabase
    .from('event_speakers')
    .select('id, event_id')
    .eq('speaker_id', speakerId);
  throwIf(listError);
  const rows = current ?? [];
  const currentIds = new Set(rows.map((row) => row.event_id as string));
  const nextSet = new Set(nextIds);
  const toDelete = rows.filter((row) => !nextSet.has(row.event_id)).map((row) => row.id);
  const toAdd = nextIds.filter((id) => !currentIds.has(id));
  const toUpdate = rows.filter((row) => nextSet.has(row.event_id)).map((row) => row.id);

  if (toDelete.length > 0) {
    const { error } = await supabase.from('event_speakers').delete().in('id', toDelete);
    throwIf(error);
  }
  if (toAdd.length > 0) {
    const { error } = await supabase.from('event_speakers').insert(
      toAdd.map((event_id) => ({
        event_id,
        speaker_id: speakerId,
        status,
        is_featured: featured,
      })),
    );
    throwIf(error);
  }
  if (toUpdate.length > 0) {
    const { error } = await supabase.from('event_speakers').update({
      status,
      is_featured: featured,
    }).in('id', toUpdate);
    throwIf(error);
  }
}

async function classifySpeaker(personId: string) {
  const { error } = await supabase.from('person_classifications').insert({
    person_id: personId,
    classification: 'speaker',
    source: 'manual',
  });
  if (error && error.code !== '23505') throw error;
}

export async function listSpeakers(): Promise<CatalogSpeaker[]> {
  const { data, error } = await supabase
    .from('speaker_profiles')
    .select(PROFILE_SELECT)
    .order('created_at', { ascending: false });
  throwIf(error);
  return ((data as ProfileRow[] | null) ?? []).map(mapProfile);
}

export async function createSpeaker(input: SpeakerWrite): Promise<CatalogSpeaker> {
  const { data: person, error: personError } = await supabase
    .from('people')
    .insert({
      full_name: input.name.trim(),
      city: input.city.trim() || null,
      country: input.country.trim() || 'Colombia',
      avatar_url: input.foto.trim() || null,
    })
    .select('id')
    .single();
  throwIf(personError);

  try {
    await classifySpeaker(person.id);
    await syncIdentifier(person.id, 'email', input.email);
    await syncIdentifier(person.id, 'telefono', input.telefono);

    const { data: profile, error: profileError } = await supabase
      .from('speaker_profiles')
      .insert({
        person_id: person.id,
        public_slug: await uniqueSpeakerSlug(input.name),
        public_title: input.role || 'Conferencista',
        public_institution: input.institution.trim() || null,
        specialty: input.specialty.trim() || null,
        topics: input.talk.trim() ? [input.talk.trim()] : [],
        bio: input.bio.trim() || null,
        photo_url: input.foto.trim() || null,
        linkedin_url: input.linkedin.trim() || null,
        is_public: input.status === 'publicado',
      })
      .select(PROFILE_SELECT)
      .single();
    throwIf(profileError);

    await syncEventAssignments(profile.id, input.event_ids, input.status, input.featured);
    const { data: fresh, error: reloadError } = await supabase
      .from('speaker_profiles')
      .select(PROFILE_SELECT)
      .eq('id', profile.id)
      .single();
    throwIf(reloadError);
    return mapProfile(fresh as ProfileRow);
  } catch (err) {
    const { data: createdProfile } = await supabase
      .from('speaker_profiles')
      .select('id')
      .eq('person_id', person.id)
      .maybeSingle();
    if (createdProfile?.id) {
      await supabase.from('event_speakers').delete().eq('speaker_id', createdProfile.id);
      await supabase.from('speaker_profiles').delete().eq('id', createdProfile.id);
    }
    await supabase.from('people').delete().eq('id', person.id);
    throw err;
  }
}

export async function updateSpeaker(id: string, personId: string, input: SpeakerWrite): Promise<CatalogSpeaker> {
  const { error: personError } = await supabase.from('people').update({
    full_name: input.name.trim(),
    city: input.city.trim() || null,
    country: input.country.trim() || 'Colombia',
    avatar_url: input.foto.trim() || null,
  }).eq('id', personId);
  throwIf(personError);

  await syncIdentifier(personId, 'email', input.email);
  await syncIdentifier(personId, 'telefono', input.telefono);

  const { error: profileError } = await supabase.from('speaker_profiles').update({
    public_slug: await uniqueSpeakerSlug(input.name, id),
    public_title: input.role || 'Conferencista',
    public_institution: input.institution.trim() || null,
    specialty: input.specialty.trim() || null,
    topics: input.talk.trim() ? [input.talk.trim()] : [],
    bio: input.bio.trim() || null,
    photo_url: input.foto.trim() || null,
    linkedin_url: input.linkedin.trim() || null,
    is_public: input.status === 'publicado',
  }).eq('id', id);
  throwIf(profileError);

  await syncEventAssignments(id, input.event_ids, input.status, input.featured);

  const { data, error } = await supabase
    .from('speaker_profiles')
    .select(PROFILE_SELECT)
    .eq('id', id)
    .single();
  throwIf(error);
  return mapProfile(data as ProfileRow);
}

export async function deleteSpeaker(id: string, personId: string): Promise<void> {
  const { error: assignError } = await supabase.from('event_speakers').delete().eq('speaker_id', id);
  throwIf(assignError);
  const { error: profileError } = await supabase.from('speaker_profiles').delete().eq('id', id);
  throwIf(profileError);
  const { error: personError } = await supabase.from('people').delete().eq('id', personId);
  throwIf(personError);
}

export async function duplicateSpeaker(speaker: CatalogSpeaker): Promise<CatalogSpeaker> {
  return createSpeaker({
    name: `${speaker.name} (copia)`,
    specialty: speaker.specialty,
    role: speaker.role,
    institution: speaker.institution,
    city: speaker.city,
    country: speaker.country,
    talk: speaker.talks[0] ?? '',
    status: 'invitado',
    bio: speaker.bio,
    foto: speaker.photo_url,
    email: '',
    linkedin: speaker.linkedin,
    telefono: '',
    event_ids: [],
    featured: false,
  });
}

export type PublicEventSpeaker = {
  id: string;
  name: string;
  title: string;
  specialty: string;
  institution: string;
  photo_url: string;
  bio: string;
};

export async function listPublicSpeakers(): Promise<CatalogSpeaker[]> {
  const { data, error } = await supabase
    .from('speaker_profiles')
    .select(PROFILE_SELECT)
    .eq('is_public', true)
    .order('created_at', { ascending: false });
  throwIf(error);
  return ((data as ProfileRow[] | null) ?? []).map(mapProfile);
}

export async function getPublicSpeakerBySlug(slug: string): Promise<CatalogSpeaker | null> {
  const { data, error } = await supabase
    .from('speaker_profiles')
    .select(PROFILE_SELECT)
    .eq('public_slug', slug)
    .eq('is_public', true)
    .maybeSingle();
  throwIf(error);
  if (data) return mapProfile(data as ProfileRow);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(slug)) {
    return null;
  }
  const { data: byId, error: idError } = await supabase
    .from('speaker_profiles')
    .select(PROFILE_SELECT)
    .eq('id', slug)
    .eq('is_public', true)
    .maybeSingle();
  throwIf(idError);
  return byId ? mapProfile(byId as ProfileRow) : null;
}

export function toPublicSpeaker(speaker: CatalogSpeaker): SpeakerPublic {
  return {
    id: speaker.id,
    slug: speaker.slug,
    nombre: speaker.name,
    foto: speaker.photo_url,
    especialidad: speaker.specialty || 'Conferencista',
    institucion: speaker.institution,
    pais: speaker.country || 'Colombia',
    bio: speaker.bio,
    habilidades: speaker.talks,
    experiencias: [],
    eventos_participados: speaker.events.map((event) => ({
      nombre: event.name,
      año: '',
      rol: event.status,
    })),
    links: {
      linkedin: speaker.linkedin || undefined,
      web: speaker.website || undefined,
      instagram: speaker.instagram || undefined,
    },
  };
}

export async function listPublicEventSpeakers(eventId: string): Promise<PublicEventSpeaker[]> {
  const { data, error } = await supabase
    .from('event_speakers')
    .select(`
      id, status, is_featured,
      speaker_profiles:speaker_id(
        id, public_title, public_institution, specialty, bio, photo_url, is_public,
        people:person_id(full_name)
      )
    `.replace(/\s+/g, ' ').trim())
    .eq('event_id', eventId)
    .in('status', ['confirmado', 'publicado']);
  throwIf(error);

  type PublicRow = {
    id: string;
    speaker_profiles: (ProfileRow & { is_public?: boolean }) | (ProfileRow & { is_public?: boolean })[] | null;
  };

  return ((data as PublicRow[] | null) ?? []).flatMap((row) => {
    const profile = one(row.speaker_profiles);
    if (!profile || profile.is_public === false) return [];
    const person = one(profile.people);
    return [{
      id: profile.id,
      name: person?.full_name || profile.public_title || 'Speaker',
      title: profile.public_title ?? '',
      specialty: profile.specialty ?? '',
      institution: profile.public_institution ?? '',
      photo_url: profile.photo_url ?? '',
      bio: profile.bio ?? '',
    }];
  });
}

export async function listEventSpeakerIds(eventId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('event_speakers')
    .select('speaker_id')
    .eq('event_id', eventId);
  throwIf(error);
  return (data ?? []).map((row) => row.speaker_id as string);
}

export async function setEventSpeakerIds(eventId: string, speakerIds: string[]): Promise<void> {
  const nextIds = [...new Set(speakerIds.filter(Boolean))];
  const { data: current, error: listError } = await supabase
    .from('event_speakers')
    .select('id, speaker_id')
    .eq('event_id', eventId);
  throwIf(listError);
  const rows = current ?? [];
  const currentSet = new Set(rows.map((row) => row.speaker_id as string));
  const nextSet = new Set(nextIds);
  const toDelete = rows.filter((row) => !nextSet.has(row.speaker_id)).map((row) => row.id);
  const toAdd = nextIds.filter((id) => !currentSet.has(id));
  if (toDelete.length > 0) {
    const { error } = await supabase.from('event_speakers').delete().in('id', toDelete);
    throwIf(error);
  }
  if (toAdd.length > 0) {
    const { error } = await supabase.from('event_speakers').insert(
      toAdd.map((speaker_id) => ({
        event_id: eventId,
        speaker_id,
        status: 'confirmado',
        is_featured: false,
      })),
    );
    throwIf(error);
  }
}
