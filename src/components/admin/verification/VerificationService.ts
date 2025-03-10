
import { supabase } from "@/integrations/supabase/client";
import { DomainVerification } from '@/types/domain';

export async function fetchPendingVerifications(): Promise<DomainVerification[]> {
  const { data, error } = await supabase
    .from('domain_verifications')
    .select(`
      *,
      domain_listings:domain_id (
        id,
        name,
        owner_id
      )
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

export async function approveVerification(id: string, domainId: string): Promise<void> {
  // Update verification status
  const { error: verificationError } = await supabase
    .from('domain_verifications')
    .update({ status: 'verified' })
    .eq('id', id);
  
  if (verificationError) throw verificationError;
  
  // Update domain verification status
  const { error: domainError } = await supabase
    .from('domain_listings')
    .update({ 
      verification_status: 'verified',
      is_verified: true
    })
    .eq('id', domainId);
  
  if (domainError) throw domainError;
}

export async function rejectVerification(id: string, domainId: string): Promise<void> {
  // Update verification status
  const { error: verificationError } = await supabase
    .from('domain_verifications')
    .update({ status: 'rejected' })
    .eq('id', id);
  
  if (verificationError) throw verificationError;
  
  // Update domain verification status
  const { error: domainError } = await supabase
    .from('domain_listings')
    .update({ 
      verification_status: 'rejected',
      is_verified: false
    })
    .eq('id', domainId);
  
  if (domainError) throw domainError;
}
