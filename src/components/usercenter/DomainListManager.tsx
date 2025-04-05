
import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash, CheckCircle2, Eye, Globe, ShieldCheck, AlertTriangle, ArrowUpRight, Clock } from 'lucide-react';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { DomainListing } from '@/types/domain';
import { useNavigate } from 'react-router-dom';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface DomainListManagerProps {
  domains: DomainListing[];
  onEdit: (domain: DomainListing) => void;
  onDelete: (domainId: string) => void;
  onRefresh: () => void;
}

export const DomainListManager = ({ domains, onEdit, onDelete, onRefresh }: DomainListManagerProps) => {
  const [processingDomain, setProcessingDomain] = useState<string | null>(null);
  const navigate = useNavigate();
  
  const handleVerifyDomain = (domainId: string) => {
    navigate(`/domain-verification/${domainId}`);
  };
  
  const handleViewInMarketplace = (domain: DomainListing) => {
    navigate(`/marketplace?search=${domain.name}`);
  };
  
  const handleToggleStatus = async (domain: DomainListing) => {
    try {
      setProcessingDomain(domain.id || '');
      const newStatus = domain.status === 'available' ? 'reserved' : 'available';
      
      // Check if domain is verified before allowing it to be published
      if (newStatus === 'available' && domain.verification_status !== 'verified') {
        toast.error('域名必须先进行验证才能上架');
        setProcessingDomain(null);
        return;
      }
      
      const { error } = await supabase
        .from('domain_listings')
        .update({ status: newStatus })
        .eq('id', domain.id);
      
      if (error) throw error;
      
      toast.success(newStatus === 'available' ? '域名已成功上架' : '域名已成功下架');
      onRefresh();
    } catch (error: any) {
      console.error('更新域名状态时出错:', error);
      toast.error(error.message || '更新域名状态失败');
    } finally {
      setProcessingDomain(null);
    }
  };

  const getDomainAgeLabel = (createdDate: string | undefined) => {
    if (!createdDate) return '';
    
    const created = new Date(createdDate);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays < 1) return '今天上传';
    if (diffInDays < 7) return `${diffInDays}天前上传`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)}周前上传`;
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)}个月前上传`;
    return `${Math.floor(diffInDays / 365)}年前上传`;
  };

  if (domains.length === 0) {
    return (
      <Card className="border border-dashed border-gray-300 bg-gray-50">
        <CardHeader className="text-center">
          <CardTitle>您还没有添加任何域名</CardTitle>
          <CardDescription>
            添加您拥有的域名到平台，设置价格和详细信息，验证所有权后即可上架出售
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {domains.map((domain) => (
        <Card key={domain.id} className="overflow-hidden hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row justify-between">
              <div className="mb-4 md:mb-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold">{domain.name}</h3>
                  {domain.verification_status === 'verified' && (
                    <Badge variant="verified" className="flex items-center gap-1">
                      <ShieldCheck className="h-3 w-3" /> 已验证
                    </Badge>
                  )}
                  {domain.verification_status === 'pending' && (
                    <Badge variant="outline" className="flex items-center gap-1 text-yellow-600 border-yellow-300">
                      <AlertTriangle className="h-3 w-3" /> 待验证
                    </Badge>
                  )}
                  {domain.highlight && (
                    <Badge variant="featured">精选</Badge>
                  )}
                  <Badge variant={domain.status === 'available' ? 'default' : domain.status === 'sold' ? 'destructive' : 'secondary'}>
                    {domain.status === 'available' ? '在售中' : domain.status === 'sold' ? '已售' : '未上架'}
                  </Badge>
                </div>
                
                <div className="mt-2 text-lg font-semibold text-emerald-600">
                  ¥{domain.price?.toLocaleString()}
                </div>
                
                <div className="mt-1 text-sm text-gray-500 flex items-center flex-wrap gap-2">
                  <Badge variant="secondary" className="font-normal">
                    {domain.category === 'standard' && '标准'}
                    {domain.category === 'premium' && '高级'}
                    {domain.category === 'short' && '短域名'} 
                    {domain.category === 'dev' && '开发'}
                    {domain.category === 'brandable' && '品牌'}
                  </Badge>
                  
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="h-3 w-3" />
                    {getDomainAgeLabel(domain.created_at)}
                  </div>
                  
                  {domain.description && (
                    <span className="ml-2 line-clamp-1">{domain.description}</span>
                  )}
                </div>
              </div>
              
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between md:justify-end gap-3">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-2">
                          <Switch
                            id={`status-switch-${domain.id}`}
                            checked={domain.status === 'available'}
                            onCheckedChange={() => handleToggleStatus(domain)}
                            disabled={processingDomain === domain.id || domain.verification_status !== 'verified'}
                          />
                          <Label htmlFor={`status-switch-${domain.id}`} className="text-sm whitespace-nowrap">
                            {domain.status === 'available' ? '已上架' : '未上架'}
                          </Label>
                        </div>
                      </TooltipTrigger>
                      {domain.verification_status !== 'verified' && (
                        <TooltipContent>
                          <p>域名需要验证所有权后才能上架</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                </div>
                
                <div className="flex gap-2 mt-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => onEdit(domain)}
                    className="border-gray-300 text-black hover:bg-gray-100"
                  >
                    <Edit className="w-4 h-4 mr-1" /> 编辑
                  </Button>
                  
                  {domain.verification_status !== 'verified' && (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleVerifyDomain(domain.id as string)}
                      className="border-gray-300 text-green-600 hover:bg-green-50 hover:border-green-300"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-1" /> 验证
                    </Button>
                  )}
                  
                  {domain.status === 'available' && (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleViewInMarketplace(domain)}
                      className="border-gray-300 text-blue-600 hover:bg-blue-50 hover:border-blue-300"
                    >
                      <ArrowUpRight className="w-4 h-4 mr-1" /> 查看
                    </Button>
                  )}
                  
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => onDelete(domain.id as string)}
                    className="border-gray-300 text-red-600 hover:bg-red-50 hover:border-red-300"
                  >
                    <Trash className="w-4 h-4 mr-1" /> 删除
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
