import { supabase } from '../supabaseClient';
import type { NovoProductCategory } from '../../types/novo';

export type CatalogProduct = {
  id: string;
  name: string;
  category: NovoProductCategory | string;
  description: string;
  price_list: number;
  price_min: number | null;
  is_active: boolean;
  emoji: string;
};

export type AssignedProduct = {
  id: string;
  product_id: string;
  price: number;
  inventory: number | null;
  is_available: boolean;
  benefits: string;
  conditions: string;
};

type ProductRow = {
  id: string;
  name: string;
  category: string;
  description: string | null;
  list_price: number;
  min_price: number | null;
  is_active: boolean;
  custom_fields: { emoji?: string } | null;
};

function mapProduct(row: ProductRow): CatalogProduct {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    description: row.description ?? '',
    price_list: Number(row.list_price) || 0,
    price_min: row.min_price == null ? null : Number(row.min_price),
    is_active: row.is_active,
    emoji: row.custom_fields?.emoji || '🎟️',
  };
}

export async function listProducts(): Promise<CatalogProduct[]> {
  const { data, error } = await supabase
    .from('products')
    .select('id, name, category, description, list_price, min_price, is_active, custom_fields')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as ProductRow[] | null)?.map(mapProduct) ?? [];
}

export async function createProduct(input: {
  name: string;
  category: string;
  description: string;
  price_list: number;
  price_min: number | null;
  emoji: string;
}): Promise<CatalogProduct> {
  const { data, error } = await supabase
    .from('products')
    .insert({
      name: input.name,
      category: input.category,
      description: input.description || null,
      list_price: input.price_list,
      min_price: input.price_min,
      is_active: true,
      custom_fields: { emoji: input.emoji },
    })
    .select('id, name, category, description, list_price, min_price, is_active, custom_fields')
    .single();
  if (error) throw error;
  return mapProduct(data as ProductRow);
}

export async function updateProduct(id: string, input: {
  name: string;
  category: string;
  description: string;
  price_list: number;
  price_min: number | null;
  emoji: string;
  is_active?: boolean;
}): Promise<CatalogProduct> {
  const { data, error } = await supabase
    .from('products')
    .update({
      name: input.name,
      category: input.category,
      description: input.description || null,
      list_price: input.price_list,
      min_price: input.price_min,
      custom_fields: { emoji: input.emoji },
      ...(input.is_active === undefined ? {} : { is_active: input.is_active }),
    })
    .eq('id', id)
    .select('id, name, category, description, list_price, min_price, is_active, custom_fields')
    .single();
  if (error) throw error;
  return mapProduct(data as ProductRow);
}

export async function setProductActive(id: string, is_active: boolean): Promise<void> {
  const { error } = await supabase.from('products').update({ is_active }).eq('id', id);
  if (error) throw error;
}

export async function deleteProduct(id: string): Promise<void> {
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw error;
}

export async function duplicateProduct(product: CatalogProduct): Promise<CatalogProduct> {
  return createProduct({
    name: `${product.name} (copia)`,
    category: String(product.category),
    description: product.description,
    price_list: product.price_list,
    price_min: product.price_min,
    emoji: product.emoji,
  }).then(async (created) => {
    await setProductActive(created.id, false);
    return { ...created, is_active: false };
  });
}

type EventProductRow = {
  id: string;
  product_id: string;
  price: number | null;
  inventory: number | null;
  is_available: boolean;
  benefits: string[] | null;
  conditions: string | null;
  products: ProductRow | ProductRow[] | null;
};

export type AssignedProductRow = AssignedProduct & { product: CatalogProduct };

export async function listEventProducts(eventId: string): Promise<AssignedProductRow[]> {
  const { data, error } = await supabase
    .from('event_products')
    .select('id, product_id, price, inventory, is_available, benefits, conditions, products(id, name, category, description, list_price, min_price, is_active, custom_fields)')
    .eq('event_id', eventId)
    .order('created_at');
  if (error) throw error;
  return (data as EventProductRow[] | null)?.flatMap((row) => {
    const raw = Array.isArray(row.products) ? row.products[0] : row.products;
    if (!raw) return [];
    const product = mapProduct(raw);
    return [{
      id: row.id,
      product_id: row.product_id,
      price: row.price == null ? product.price_list : Number(row.price),
      inventory: row.inventory,
      is_available: row.is_available,
      benefits: (row.benefits ?? []).join('\n'),
      conditions: row.conditions ?? '',
      product,
    }];
  }) ?? [];
}

export async function assignProductToEvent(eventId: string, product: CatalogProduct): Promise<AssignedProductRow> {
  const benefits = product.description
    ? product.description.split(/\n|·/).map(s => s.trim()).filter(Boolean)
    : [];
  const inventory = product.category === 'ticket' ? 100 : product.category === 'participacion' ? 5 : null;
  const { data, error } = await supabase
    .from('event_products')
    .insert({
      event_id: eventId,
      product_id: product.id,
      price: product.price_list,
      inventory,
      is_available: true,
      benefits,
      conditions: null,
    })
    .select('id, product_id, price, inventory, is_available, benefits, conditions')
    .single();
  if (error) throw error;
  return {
    id: data.id,
    product_id: data.product_id,
    price: Number(data.price) || 0,
    inventory: data.inventory,
    is_available: data.is_available,
    benefits: (data.benefits ?? []).join('\n'),
    conditions: data.conditions ?? '',
    product,
  };
}

export async function updateEventProduct(id: string, input: {
  price: number;
  inventory: number | null;
  is_available: boolean;
  benefits: string;
  conditions: string;
}): Promise<void> {
  const benefits = input.benefits.split('\n').map(s => s.trim()).filter(Boolean);
  const { error } = await supabase.from('event_products').update({
    price: input.price,
    inventory: input.inventory,
    is_available: input.is_available,
    benefits,
    conditions: input.conditions || null,
  }).eq('id', id);
  if (error) throw error;
}

export async function setEventProductAvailable(id: string, is_available: boolean): Promise<void> {
  const { error } = await supabase.from('event_products').update({ is_available }).eq('id', id);
  if (error) throw error;
}

export async function removeEventProduct(id: string): Promise<void> {
  const { error } = await supabase.from('event_products').delete().eq('id', id);
  if (error) throw error;
}
