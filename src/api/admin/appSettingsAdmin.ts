import { supabase } from '../supabaseClient';
import type { AppSettings } from './types';

export async function getAppSettings(): Promise<AppSettings> {
  const { data, error } = await supabase
    .from('app_settings')
    .select('id, stripe_mode, updated_at')
    .eq('id', 'global')
    .single();

  if (error) {
    const isRLSError =
      error.message?.toLowerCase().includes('row-level security') ||
      error.code === 'PGRST301' ||
      error.message?.toLowerCase().includes('permission denied') ||
      error.code === '42501';

    if (isRLSError) {
      throw new Error('Access denied: You may not have admin permissions to view app settings.');
    }

    throw new Error(`Failed to load app settings: ${error.message}`);
  }

  if (!data) {
    throw new Error('App settings row not found');
  }

  return data;
}

export async function updateStripeMode(
  stripeMode: AppSettings['stripe_mode']
): Promise<AppSettings> {
  const { data, error } = await supabase
    .from('app_settings')
    .update({
      stripe_mode: stripeMode,
      updated_at: new Date().toISOString(),
    })
    .eq('id', 'global')
    .select('id, stripe_mode, updated_at')
    .single();

  if (error) {
    const isRLSError =
      error.message?.toLowerCase().includes('row-level security') ||
      error.code === 'PGRST301' ||
      error.message?.toLowerCase().includes('permission denied') ||
      error.code === '42501';

    if (isRLSError) {
      throw new Error('Access denied: You may not have admin permissions to update app settings.');
    }

    throw new Error(`Failed to update Stripe mode: ${error.message}`);
  }

  if (!data) {
    throw new Error('Stripe mode update returned no data');
  }

  return data;
}

export default {
  getAppSettings,
  updateStripeMode,
};
