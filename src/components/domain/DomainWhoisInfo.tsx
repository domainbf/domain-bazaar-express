import { supabase } from '@/integrations/supabase/client';
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Globe, Calendar, Server, Shield, RefreshCw, ExternalLink,
  AlertCircle, CheckCircle2, Clock, Building2, Lock, Unlock
} from "lucide-react";
import { apiGet, apiPost, apiPatch } from '@/lib/apiClient';
import { format, parseISO, isValid, differenceInDays } from "date-fns";
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
  registrant: { name?: string; organization?: string; country?: string } | null;
  tld: string | null;
  tags: string[];
  statusTags: string[];
  timezone: string | null;
  rdap: boolean;
  domainAge?: number | null;
  remainingDays?: number | null;
}

interface Props {
  domainName: string;
}

const EPP_STATUS_LABELS: Record<string, string> = {
  'clientTransferProhibited': '禁止转移（客户端）',
  'clientDeleteProhibited': '禁止删除（客户端）',
  'clientUpdateProhibited': '禁止更新（客户端）',
  'serverTransferProhibited': '禁止转移（注册商）',
  'serverDeleteProhibited': '禁止删除（注册商）',
  'serverUpdateProhibited': '禁止更新（注册商）',
  'ok': '正常',
  'active': '活跃',
  'pendingDelete': '等待删除',
  'pendingTransfer': '等待转移',
  'redemptionPeriod': '赎回期',
  'renewPeriod': '续费期',
  'addPeriod': '新注册保护期',
};

const translateEppStatus = (status: string): string => {
  const lower = status.toLowerCase();
  for (const [key, label] of Object.entries(EPP_STATUS_LABELS)) {
    if (lower.includes(key.toLowerCase())) return label;
  }
  return status;
};

const parseDate = (dateStr: string | null) => {
  if (!dateStr) return null;
  try {
    const d = parseISO(dateStr);
    return isValid(d) ? d : null;
  } catch {
    return null;
  }
};

const formatDate = (dateStr: string | null): string => {
  const d = parseDate(dateStr);
  if (!d) return '未知';
  return format(d, 'yyyy年MM月dd日', { locale: zhCN });
};

const getExpiryInfo = (expiryDate: string | null, createdDate: string | null) => {
  const expiry = parseDate(expiryDate);
  if (!expiry) return null;

  const now = new Date();
  const daysLeft = differenceInDays(expiry, now);
  const created = parseDate(createdDate);
  const totalDays = created ? differenceInDays(expiry, created) : null;
  const usedDays = created ? differenceInDays(now, created) : null;
  const progressPct = (totalDays && usedDays !== null)
    ? Math.min(100, Math.max(0, Math.round((usedDays / totalDays) * 100)))
    : null;

  let color = 'bg-green-500';
  let textColor = 'text-green-600';
  let label = '';

  if (daysLeft < 0) {
    color = 'bg-red-500'; textColor = 'text-red-600'; label = '已过期';
  } else if (daysLeft <= 30) {
    color = 'bg-red-500'; textColor = 'text-red-600'; label = `${daysLeft}天后到期`;
  } else if (daysLeft <= 90) {
    color = 'bg-orange-500'; textColor = 'text-orange-600'; label = `${daysLeft}天后到期`;
  } else {
    label = `${daysLeft}天后到期`;
  }

  return { daysLeft, progressPct, color, textColor, label };
};

const getDomainAge = (createdDate: string | null): string => {
  const d = parseDate(createdDate);
  if (!d) return '未知';
  const days = differenceInDays(new Date(), d);
  const years = Math.floor(days / 365);
  const months = Math.floor((days % 365) / 30);
  if (years > 0) return `${years}年${months > 0 ? months + '个月' : ''}`;
  if (days > 30) return `${months}个月`;
  return `${days}天`;
};

export const DomainWhoisInfo: React.FC<Props> = ({ domainName }) => {
  const [whoisData, setWhoisData] = useState<WhoisData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const queryWhois = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('whois-query', {
        body: { domain: domainName },
      });

      if (fnError && !data) throw new Error(fnError.message || 'WHOIS查询服务不可用');
      if (!data?.success) throw new Error(data?.error || '查询失败');

      setWhoisData(data.data);
    } catch (err) {
      console.error('WHOIS query error:', err);
      setError(err instanceof Error ? err.message : '查询失败');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    queryWhois();
  }, [domainName]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="p-4 rounded-lg bg-muted/50 space-y-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-5 w-full" />
            </div>
          ))}
        </div>
        <Skeleton className="h-8 w-full rounded-full" />
        <div className="flex gap-2">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-6 w-24 rounded-full" />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <AlertCircle className="h-10 w-10 mx-auto text-destructive/50 mb-3" />
        <p className="text-destructive mb-4 text-sm">{error}</p>
        <Button onClick={queryWhois} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          重新查询
        </Button>
      </div>
    );
  }

  if (!whoisData) return null;

  const expiryInfo = getExpiryInfo(whoisData.expiryDate, whoisData.createdDate);
  const domainAge = getDomainAge(whoisData.createdDate);
  const isDnssecSigned = whoisData.dnsSec?.toLowerCase().includes('signed');

  return (
    <div className="space-y-5">
      {/* Header: status + rdap badge + refresh */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex flex-wrap gap-2">
          <Badge className={
            whoisData.status === 0 ? 'bg-green-500' :
            whoisData.status === 4 ? 'bg-red-500' : 'bg-blue-500'
          }>
            {whoisData.statusText}
          </Badge>
          {whoisData.rdap && (
            <Badge variant="outline" className="text-emerald-600 border-emerald-300">
              RDAP ✓
            </Badge>
          )}
          {whoisData.tld && (
            <Badge variant="secondary">.{whoisData.tld.toUpperCase()}</Badge>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={queryWhois} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
          刷新
        </Button>
      </div>

      {/* 4-item grid: registrar / created / expiry / updated */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/40 border">
          <Building2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground mb-1">注册商</p>
            <p className="font-semibold text-sm truncate">
              {whoisData.registrar || '未知'}
            </p>
            {whoisData.registrarUrl && (
              <a href={whoisData.registrarUrl} target="_blank" rel="noopener noreferrer"
                className="text-xs text-primary hover:underline flex items-center gap-0.5 mt-0.5">
                访问官网 <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>

        <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/40 border">
          <Calendar className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground mb-1">注册日期</p>
            <p className="font-semibold text-sm">{formatDate(whoisData.createdDate)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">域名年龄：{domainAge}</p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/40 border">
          <Clock className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground mb-1">到期日期</p>
            <p className="font-semibold text-sm">{formatDate(whoisData.expiryDate)}</p>
            {expiryInfo && (
              <p className={`text-xs mt-0.5 font-medium ${expiryInfo.textColor}`}>{expiryInfo.label}</p>
            )}
          </div>
        </div>

        <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/40 border">
          <RefreshCw className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground mb-1">最后更新</p>
            <p className="font-semibold text-sm">{formatDate(whoisData.updatedDate)}</p>
          </div>
        </div>
      </div>

      {/* Registration period progress bar */}
      {expiryInfo?.progressPct !== null && expiryInfo?.progressPct !== undefined && (
        <div className="p-4 rounded-xl bg-muted/40 border space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">注册期使用进度</span>
            <span className={`font-medium ${expiryInfo.textColor}`}>{expiryInfo.label}</span>
          </div>
          <div className="relative h-2 rounded-full bg-muted overflow-hidden">
            <div
              className={`absolute inset-y-0 left-0 rounded-full transition-all ${expiryInfo.color}`}
              style={{ width: `${expiryInfo.progressPct}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{formatDate(whoisData.createdDate)}</span>
            <span>{formatDate(whoisData.expiryDate)}</span>
          </div>
        </div>
      )}

      {/* Name Servers */}
      {whoisData.nameServers?.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Server className="h-4 w-4 text-primary" />
            DNS 服务器
          </div>
          <div className="flex flex-wrap gap-2">
            {whoisData.nameServers.map((ns, i) => (
              <Badge key={i} variant="outline" className="font-mono text-xs">
                {ns.toLowerCase()}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* DNSSEC */}
      <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/40 border">
        {isDnssecSigned
          ? <Lock className="h-5 w-5 text-green-500 shrink-0" />
          : <Unlock className="h-5 w-5 text-muted-foreground shrink-0" />
        }
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">DNSSEC</p>
          <p className="font-semibold text-sm flex items-center gap-2">
            {whoisData.dnsSec || '未签名'}
            {isDnssecSigned && <CheckCircle2 className="h-4 w-4 text-green-500" />}
          </p>
        </div>
      </div>

      {/* Registrant Info */}
      {whoisData.registrant && (whoisData.registrant.name || whoisData.registrant.organization) && (
        <div className="p-4 rounded-xl bg-muted/40 border space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mb-2">
            <Globe className="h-3.5 w-3.5" /> 注册人信息
          </p>
          {whoisData.registrant.organization && (
            <p className="text-sm"><span className="text-muted-foreground">组织：</span>{whoisData.registrant.organization}</p>
          )}
          {whoisData.registrant.name && (
            <p className="text-sm"><span className="text-muted-foreground">姓名：</span>{whoisData.registrant.name}</p>
          )}
          {whoisData.registrant.country && (
            <p className="text-sm"><span className="text-muted-foreground">国家/地区：</span>{whoisData.registrant.country}</p>
          )}
        </div>
      )}

      {/* EPP Status Tags */}
      {whoisData.statusTags?.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
            <Shield className="h-4 w-4 text-primary" />
            域名 EPP 状态
          </p>
          <div className="flex flex-wrap gap-2">
            {whoisData.statusTags.map((s, i) => (
              <span key={i} title={s}
                className="text-xs px-2.5 py-1 rounded-full bg-muted border border-border text-muted-foreground cursor-default hover:text-foreground transition-colors">
                {translateEppStatus(s)}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
