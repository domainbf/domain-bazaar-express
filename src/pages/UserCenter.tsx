
import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DomainManagement } from '@/components/usercenter/DomainManagement';
import { ProfileSettings } from '@/components/usercenter/ProfileSettings';
import { TransactionHistory } from '@/components/usercenter/TransactionHistory';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

export const UserCenter = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated
    if (!user) {
      toast.error('Please sign in to access your account');
      navigate('/');
      return;
    }
    setIsLoading(false);
  }, [user, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="max-w-6xl mx-auto px-4 py-16 flex justify-center items-center">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-black">User Center</h1>
        </div>

        <Tabs defaultValue="domains" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="domains" className="data-[state=active]:bg-black data-[state=active]:text-white">
              My Domains
            </TabsTrigger>
            <TabsTrigger value="transactions" className="data-[state=active]:bg-black data-[state=active]:text-white">
              Transactions
            </TabsTrigger>
            <TabsTrigger value="profile" className="data-[state=active]:bg-black data-[state=active]:text-white">
              Profile Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="domains">
            <DomainManagement />
          </TabsContent>

          <TabsContent value="transactions">
            <TransactionHistory />
          </TabsContent>

          <TabsContent value="profile">
            <ProfileSettings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
