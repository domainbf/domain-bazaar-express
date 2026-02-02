import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { 
  Globe, 
  Calendar, 
  Server, 
  Shield, 
  RefreshCw, 
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  Clock,
  Building2,
  User
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow, format, parseISO, isValid } from "date-fns";
import { zhCN } from "date-fns/locale";

interface WhoisData {
  domain: string;
  status: number;
  statusText: string;
  registrar: string | null;
  registrarUrl: string | null;
  createdDate: string | null;
  updatedDate: string | null;
  expiryDate: string | null;
  nameServers: string[];
  dnsSec: string | null;
  registrant: {
    name?: string;
    organization?: string;
    country?: string;
  } | null;
  tld: string | null;
  tags: string[];
  statusTags: string[];
  timezone: string | null;
  rdap: boolean;
}

interface Props {
  domainName: string;
}

export const DomainWhoisInfo: React.FC<Props> = ({ domainName }) => {
  const [whoisData, setWhoisData] = useState<WhoisData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasQueried, setHasQueried] = useState(false);

  const queryWhois = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: fnError } = await supabase.functions.invoke('whois-query', {
        body: { domain: domainName },
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (!data.success) {
        throw new Error(data.error || '查询失败');
      }

      setWhoisData(data.data);
      setHasQueried(true);
    } catch (err) {
      console.error('WHOIS query error:', err);
      setError(err instanceof Error ? err.message : '查询失败');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return '未知';
    try {
      const date = parseISO(dateStr);
      if (!isValid(date)) return dateStr;
      return format(date, 'yyyy年MM月dd日', { locale: zhCN });
    } catch {
      return dateStr;
    }
  };

  const getExpiryStatus = (expiryDate: string | null): { color: string; text: string } => {
    if (!expiryDate) return { color: 'gray', text: '未知' };
    try {
      const date = parseISO(expiryDate);
      if (!isValid(date)) return { color: 'gray', text: '未知' };
      
      const now = new Date();
      const daysUntilExpiry = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysUntilExpiry < 0) {
        return { color: 'red', text: '已过期' };
      } else if (daysUntilExpiry <= 30) {
        return { color: 'orange', text: `${daysUntilExpiry}天后到期` };
      } else if (daysUntilExpiry <= 90) {
        return { color: 'yellow', text: `${daysUntilExpiry}天后到期` };
      } else {
        return { color: 'green', text: formatDistanceToNow(date, { locale: zhCN, addSuffix: true }) + '到期' };
      }
    } catch {
      return { color: 'gray', text: '未知' };
    }
  };

  const getStatusBadgeColor = (status: number): string => {
    switch (status) {
      case 0: return 'bg-green-500';
      case 1: return 'bg-blue-500';
      case 2: return 'bg-purple-500';
      case 3: return 'bg-orange-500';
      case 4: return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  if (!hasQueried && !isLoading) {
    return (
      <div className="text-center py-8">
        <Globe className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
        <p className="text-muted-foreground mb-4">
          查询域名的注册信息、到期时间和DNS服务器等详细信息
        </p>
        <Button onClick={queryWhois} disabled={isLoading} variant="outline">
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          查询 WHOIS
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-5 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 mx-auto text-destructive/50 mb-4" />
        <p className="text-destructive mb-4">{error}</p>
        <Button onClick={queryWhois} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          重新查询
        </Button>
      </div>
    );
  }

  if (!whoisData) return null;

  const expiryStatus = getExpiryStatus(whoisData.expiryDate);

  return (
    <div className="space-y-6">
      {/* 刷新按钮 */}
      <div className="flex justify-end">
        <Button variant="ghost" size="sm" onClick={queryWhois} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          刷新
        </Button>
      </div>

      {/* Status and Tags */}
      <div className="flex flex-wrap gap-2">
        <Badge className={getStatusBadgeColor(whoisData.status)}>
          {whoisData.statusText}
        </Badge>
        {whoisData.rdap && (
          <Badge variant="outline" className="text-green-600 border-green-600">
            RDAP
          </Badge>
        )}
        {whoisData.tags?.slice(0, 5).map((tag, i) => (
          <Badge key={i} variant="secondary">{tag}</Badge>
        ))}
      </div>

      {/* Main Info Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Registrar */}
        <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
          <Building2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground mb-1">注册商</p>
            <p className="font-medium text-sm truncate">
              {whoisData.registrar || '未知'}
              {whoisData.registrarUrl && (
                <a 
                  href={whoisData.registrarUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="ml-1 inline-flex items-center text-primary hover:underline"
                >
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </p>
          </div>
        </div>

        {/* Registration Date */}
        <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
          <Calendar className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground mb-1">注册日期</p>
            <p className="font-medium text-sm">{formatDate(whoisData.createdDate)}</p>
          </div>
        </div>

        {/* Expiry Date */}
        <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
          <Clock className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground mb-1">到期日期</p>
            <p className="font-medium text-sm flex items-center gap-2 flex-wrap">
              <span>{formatDate(whoisData.expiryDate)}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                expiryStatus.color === 'green' ? 'bg-green-100 text-green-700' :
                expiryStatus.color === 'yellow' ? 'bg-yellow-100 text-yellow-700' :
                expiryStatus.color === 'orange' ? 'bg-orange-100 text-orange-700' :
                expiryStatus.color === 'red' ? 'bg-red-100 text-red-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {expiryStatus.text}
              </span>
            </p>
          </div>
        </div>

        {/* Updated Date */}
        <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
          <RefreshCw className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground mb-1">更新日期</p>
            <p className="font-medium text-sm">{formatDate(whoisData.updatedDate)}</p>
          </div>
        </div>
      </div>

      {/* Name Servers */}
      {whoisData.nameServers && whoisData.nameServers.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Server className="h-4 w-4" />
            DNS 服务器
          </div>
          <div className="flex flex-wrap gap-2">
            {whoisData.nameServers.map((ns, i) => (
              <Badge key={i} variant="outline" className="font-mono text-xs">
                {ns}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* DNSSEC */}
      {whoisData.dnsSec && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
          <Shield className="h-5 w-5 text-primary shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground mb-1">DNSSEC</p>
            <p className="font-medium text-sm flex items-center gap-2">
              {whoisData.dnsSec}
              {whoisData.dnsSec.toLowerCase().includes('signed') && (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              )}
            </p>
          </div>
        </div>
      )}

      {/* Registrant Info */}
      {whoisData.registrant && (whoisData.registrant.name || whoisData.registrant.organization) && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="h-4 w-4" />
            注册人信息
          </div>
          <div className="p-4 rounded-lg bg-muted/50 space-y-1">
            {whoisData.registrant.organization && (
              <p className="text-sm">
                <span className="text-muted-foreground">组织：</span>
                {whoisData.registrant.organization}
              </p>
            )}
            {whoisData.registrant.name && (
              <p className="text-sm">
                <span className="text-muted-foreground">姓名：</span>
                {whoisData.registrant.name}
              </p>
            )}
            {whoisData.registrant.country && (
              <p className="text-sm">
                <span className="text-muted-foreground">国家：</span>
                {whoisData.registrant.country}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Status Tags */}
      {whoisData.statusTags && whoisData.statusTags.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">域名状态</p>
          <div className="flex flex-wrap gap-2">
            {whoisData.statusTags.map((status, i) => (
              <Badge key={i} variant="secondary" className="text-xs">
                {status}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
