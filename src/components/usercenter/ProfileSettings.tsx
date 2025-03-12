
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export const ProfileSettings = () => {
  const [profile, setProfile] = useState({
    full_name: '',
    company_name: '',
    contact_email: '',
    contact_phone: '',
    bio: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setProfile({
          full_name: data.full_name || '',
          company_name: data.company_name || '',
          contact_email: data.contact_email || '',
          contact_phone: data.contact_phone || '',
          bio: data.bio || ''
        });
      }
    } catch (error: any) {
      console.error('Error loading profile:', error);
      toast.error(error.message || 'Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          ...profile,
          updated_at: new Date().toISOString()
        });
      
      if (error) throw error;
      
      toast.success('Profile updated successfully');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Settings</CardTitle>
        <CardDescription>Update your personal information</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Full Name</label>
            <Input
              name="full_name"
              value={profile.full_name}
              onChange={handleChange}
              className="bg-white border-gray-300"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Company Name</label>
            <Input
              name="company_name"
              value={profile.company_name}
              onChange={handleChange}
              className="bg-white border-gray-300"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Contact Email</label>
            <Input
              name="contact_email"
              type="email"
              value={profile.contact_email}
              onChange={handleChange}
              className="bg-white border-gray-300"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Contact Phone</label>
            <Input
              name="contact_phone"
              value={profile.contact_phone}
              onChange={handleChange}
              className="bg-white border-gray-300"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Bio</label>
            <textarea
              name="bio"
              value={profile.bio}
              onChange={handleChange}
              rows={3}
              className="w-full bg-white border border-gray-300 rounded-md p-2 text-black"
            />
          </div>
          
          <Button 
            type="submit" 
            disabled={isSaving}
            className="w-full bg-black text-white hover:bg-gray-800"
          >
            {isSaving ? (
              <span className="flex items-center gap-2">
                <Loader2 className="animate-spin w-4 h-4" />
                Saving...
              </span>
            ) : 'Save Changes'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
