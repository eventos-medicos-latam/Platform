import { supabase } from '../supabaseClient';

export type CompanyAgreementStatus = 'cerrado' | 'aprobado' | 'pendiente';

export interface NovoCompany {
  id: string;
  name: string;
  razon_social: string;
  nit: string;
  sector: string;
  logo: string;
  emoji: string;
  ciudad: string;
  departamento: string;
  pais: string;
  direccion: string;
  website: string;
  email_principal: string;
  contacto_nombre: string;
  contacto_cargo: string;
  contacto_email: string;
  contacto_tel: string;
  contacts: number;
  events: number;
  total_deal: number | null;
  status: CompanyAgreementStatus;
  notas: string;
}

type CompanyRow = {
  id: string;
  trade_name: string;
  legal_name: string | null;
  nit: string | null;
  sector: string | null;
  logo_url: string | null;
  city: string | null;
  department: string | null;
  country: string | null;
  address: string | null;
  web: string | null;
  email_principal: string | null;
  contact_name: string | null;
  contact_job_title: string | null;
  contact_email: string | null;
  contact_whatsapp: string | null;
  description: string | null;
};

export type CompanyWrite = {
  name: string;
  razon_social: string;
  nit: string;
  sector: string;
  logo: string;
  ciudad: string;
  departamento: string;
  pais: string;
  direccion: string;
  website: string;
  email_principal: string;
  contacto_nombre: string;
  contacto_cargo: string;
  contacto_email: string;
  contacto_tel: string;
  notas: string;
};

function mapCompany(row: CompanyRow): NovoCompany {
  return {
    id: row.id,
    name: row.trade_name,
    razon_social: row.legal_name ?? '',
    nit: row.nit ?? '',
    sector: row.sector ?? '',
    logo: row.logo_url ?? '',
    emoji: '🏢',
    ciudad: row.city ?? '',
    departamento: row.department ?? '',
    pais: row.country ?? 'Colombia',
    direccion: row.address ?? '',
    website: row.web ?? '',
    email_principal: row.email_principal ?? '',
    contacto_nombre: row.contact_name ?? '',
    contacto_cargo: row.contact_job_title ?? '',
    contacto_email: row.contact_email ?? '',
    contacto_tel: row.contact_whatsapp ?? '',
    contacts: 0,
    events: 0,
    total_deal: null,
    status: 'pendiente',
    notas: row.description ?? '',
  };
}

function toRow(input: CompanyWrite) {
  return {
    trade_name: input.name,
    legal_name: input.razon_social || null,
    nit: input.nit || null,
    sector: input.sector || null,
    logo_url: input.logo || null,
    logo_ready: Boolean(input.logo),
    city: input.ciudad || null,
    department: input.departamento || null,
    country: input.pais || 'Colombia',
    address: input.direccion || null,
    web: input.website || null,
    email_principal: input.email_principal || null,
    contact_name: input.contacto_nombre || null,
    contact_job_title: input.contacto_cargo || null,
    contact_email: input.contacto_email || null,
    contact_whatsapp: input.contacto_tel || null,
    description: input.notas || null,
  };
}

const COMPANY_SELECT = 'id, trade_name, legal_name, nit, sector, logo_url, city, department, country, address, web, email_principal, contact_name, contact_job_title, contact_email, contact_whatsapp, description';

export async function listPublicAllies(): Promise<NovoCompany[]> {
  const { data, error } = await supabase
    .from('companies')
    .select(COMPANY_SELECT)
    .eq('is_sample_data', false)
    .eq('logo_ready', true)
    .order('trade_name');
  if (error) throw error;
  return (data as CompanyRow[] | null)?.map(mapCompany) ?? [];
}

export async function listCompanies(): Promise<NovoCompany[]> {
  const { data, error } = await supabase
    .from('companies')
    .select(COMPANY_SELECT)
    .order('trade_name');
  if (error) throw error;
  return (data as CompanyRow[] | null)?.map(mapCompany) ?? [];
}

export async function companyById(id: string): Promise<NovoCompany | undefined> {
  const { data, error } = await supabase
    .from('companies')
    .select(COMPANY_SELECT)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapCompany(data as CompanyRow) : undefined;
}

export async function createCompany(input: CompanyWrite): Promise<NovoCompany> {
  const { data, error } = await supabase
    .from('companies')
    .insert(toRow(input))
    .select(COMPANY_SELECT)
    .single();
  if (error) throw error;
  return mapCompany(data as CompanyRow);
}

export async function updateCompany(id: string, input: CompanyWrite): Promise<NovoCompany> {
  const { data, error } = await supabase
    .from('companies')
    .update(toRow(input))
    .eq('id', id)
    .select(COMPANY_SELECT)
    .single();
  if (error) throw error;
  return mapCompany(data as CompanyRow);
}

export async function deleteCompany(id: string): Promise<void> {
  const { error } = await supabase.from('companies').delete().eq('id', id);
  if (error) throw error;
}

export async function duplicateCompany(company: NovoCompany): Promise<NovoCompany> {
  return createCompany({
    name: `${company.name} (copia)`,
    razon_social: company.razon_social,
    nit: '',
    sector: company.sector,
    logo: company.logo,
    ciudad: company.ciudad,
    departamento: company.departamento,
    pais: company.pais,
    direccion: company.direccion,
    website: company.website,
    email_principal: company.email_principal,
    contacto_nombre: company.contacto_nombre,
    contacto_cargo: company.contacto_cargo,
    contacto_email: company.contacto_email,
    contacto_tel: company.contacto_tel,
    notas: company.notas,
  });
}
