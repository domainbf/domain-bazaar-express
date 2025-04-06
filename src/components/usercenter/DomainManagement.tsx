
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/contexts/AuthContext';
import { DomainTable } from "../profile/DomainTable";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DomainForm } from "../dashboard/DomainForm";
import { toast } from "sonner";
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';

export const DomainManagement = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [domains, setDomains] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentDomain, setCurrentDomain] = useState<any>(null);
  
  useEffect(() => {
    if (user) {
      loadDomains();
    }
  }, [user]);
  
  const loadDomains = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('domain_listings')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setDomains(data || []);
    } catch (error: any) {
      console.error('Error loading domains:', error);
      toast.error('加载域名失败');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAddDomain = async (formData: any) => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('domain_listings')
        .insert({
          ...formData,
          owner_id: user.id,
          status: 'available',
        })
        .select();
      
      if (error) throw error;
      
      toast.success('域名添加成功');
      setIsAddModalOpen(false);
      loadDomains();
    } catch (error: any) {
      console.error('Error adding domain:', error);
      toast.error('添加域名失败');
    }
  };
  
  const handleUpdateDomain = async (formData: any) => {
    if (!currentDomain) return;
    
    try {
      const { error } = await supabase
        .from('domain_listings')
        .update(formData)
        .eq('id', currentDomain.id);
      
      if (error) throw error;
      
      toast.success('域名更新成功');
      setIsEditModalOpen(false);
      setCurrentDomain(null);
      loadDomains();
    } catch (error: any) {
      console.error('Error updating domain:', error);
      toast.error('更新域名失败');
    }
  };
  
  const handleDeleteDomain = async (domain: any) => {
    if (!confirm('确定要删除此域名吗?')) return;
    
    try {
      const { error } = await supabase
        .from('domain_listings')
        .delete()
        .eq('id', domain.id);
      
      if (error) throw error;
      
      toast.success('域名删除成功');
      loadDomains();
    } catch (error: any) {
      console.error('Error deleting domain:', error);
      toast.error('删除域名失败');
    }
  };
  
  const handleViewDomain = (domain: any) => {
    navigate(`/domain-verification/${domain.id}`);
  };
  
  const handleEditDomain = (domain: any) => {
    setCurrentDomain(domain);
    setIsEditModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">域名管理</h2>
        <Button onClick={() => setIsAddModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          添加域名
        </Button>
      </div>
      
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">全部域名</TabsTrigger>
          <TabsTrigger value="available">可售域名</TabsTrigger>
          <TabsTrigger value="sold">已售域名</TabsTrigger>
          <TabsTrigger value="reserved">预留域名</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-4">
          <DomainTable 
            domains={domains} 
            onView={handleViewDomain} 
            onEdit={handleEditDomain} 
            onDelete={handleDeleteDomain}
          />
        </TabsContent>
        
        <TabsContent value="available" className="mt-4">
          <DomainTable 
            domains={domains.filter(d => d.status === 'available')} 
            onView={handleViewDomain} 
            onEdit={handleEditDomain} 
            onDelete={handleDeleteDomain}
          />
        </TabsContent>
        
        <TabsContent value="sold" className="mt-4">
          <DomainTable 
            domains={domains.filter(d => d.status === 'sold')} 
            onView={handleViewDomain} 
            onEdit={handleEditDomain} 
            onDelete={handleDeleteDomain}
          />
        </TabsContent>
        
        <TabsContent value="reserved" className="mt-4">
          <DomainTable 
            domains={domains.filter(d => d.status === 'reserved')} 
            onView={handleViewDomain} 
            onEdit={handleEditDomain} 
            onDelete={handleDeleteDomain}
          />
        </TabsContent>
      </Tabs>
      
      {/* Add Domain Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>添加新域名</DialogTitle>
          </DialogHeader>
          <DomainForm onSubmit={handleAddDomain} />
        </DialogContent>
      </Dialog>
      
      {/* Edit Domain Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>编辑域名</DialogTitle>
          </DialogHeader>
          {currentDomain && (
            <DomainForm 
              initialData={currentDomain} 
              onSubmit={handleUpdateDomain} 
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
