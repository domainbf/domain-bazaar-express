import { supabase } from "@/integrations/supabase/client";
import { DomainVerification, Domain } from '@/types/domain';

export async function fetchPendingVerifications(): Promise<DomainVerification[]> {
  const { data, error } = await supabase
    .from('domain_verifications')
    .select(`
      *,
      domain_listings:domain_id (
        id,
        name,
        owner_id,
        verification_status,
        is_verified
      )
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  
  // Transform the data to match the DomainVerification type
  const transformedData = data?.map(item => ({
    ...item,
    domain_listings: item.domain_listings as unknown as Domain
  })) || [];
  
  return transformedData;
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
      is_verified: true,
      status: 'available'
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
      is_verified: false,
      status: 'available'
    })
    .eq('id', domainId);
  
  if (domainError) throw domainError;
}
