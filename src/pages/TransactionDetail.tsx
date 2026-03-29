import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { toast } from 'sonner';
import {
  Shield, CheckCircle, Clock, AlertTriangle, ArrowLeft,
  CreditCard, Globe, User, MessageSquare, Star, Flag,
  ChevronRight, FileText, Banknote, CheckCheck
} from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger
} from '@/components/ui/dialog';
import { ReviewSystem } from '@/components/reviews/ReviewSystem';
import { MessageCenter } from '@/components/messages/MessageCenter';

interface TransactionData {
  id: string;
  amount: number;
  status: string;
  payment_method: string;
  created_at: string;
  updated_at: string;
  buyer_id: string | null;
  seller_id: string | null;
  domain_id: string;
  offer_id: string | null;
  commission_rate: number | null;
  commission_amount: number | null;
  seller_amount: number | null;
  transfer_confirmed_seller: boolean | null;
  transfer_confirmed_buyer: boolean | null;
  seller_confirmed_at: string | null;
  buyer_confirmed_at: string | null;
  completed_at: string | null;
  notes: string | null;
}

interface DomainInfo {
  name: string;
  price: number;
}

interface ProfileInfo {
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
}

interface EscrowInfo {
  id: string;
  status: string | null;
  funded_at: string | null;
  domain_transferred_at: string | null;
  buyer_approved_at: string | null;
  released_at: string | null;
  escrow_fee: number | null;
}

const STATUS_STEPS = [
  { key: 'payment_pending', label: '等待付款', icon: CreditCard, desc: '买家确认报价后等待付款' },
  { key: 'escrow_funded', label: '资金托管中', icon: Shield, desc: '付款已到账，资金安全托管' },
  { key: 'domain_transferred', label: '域名转移中', icon: Globe, desc: '卖家正在转移域名所有权' },
  { key: 'buyer_confirmed', label: '买家确认', icon: CheckCircle, desc: '买家确认收到域名' },
  { key: 'completed', label: '交易完成', icon: CheckCheck, desc: '资金已释放给卖家' },
];

const statusLabel: Record<string, string> = {
  payment_pending: '等待付款',
  escrow_funded: '资金托管中',
  domain_transferred: '域名已转移',
  buyer_confirmed: '买家已确认',
  completed: '交易完成',
  disputed: '纠纷处理中',
  cancelled: '已取消',
};

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  payment_pending: 'secondary',
  escrow_funded: 'default',
  domain_transferred: 'default',
  buyer_confirmed: 'default',
  completed: 'default',
  disputed: 'destructive',
  cancelled: 'outline',
};

export default function TransactionDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [transaction, setTransaction] = useState<TransactionData | null>(null);
  const [domain, setDomain] = useState<DomainInfo | null>(null);
  const [buyer, setBuyer] = useState<ProfileInfo | null>(null);
  const [seller, setSeller] = useState<ProfileInfo | null>(null);
  const [escrow, setEscrow] = useState<EscrowInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeDesc, setDisputeDesc] = useState('');
  const [showDispute, setShowDispute] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [showMessages, setShowMessages] = useState(false);

  const isBuyer = user?.id === transaction?.buyer_id;
  const isSeller = user?.id === transaction?.seller_id;

  useEffect(() => {
    if (id) loadTransaction();
  }, [id]);

  const loadTransaction = async () => {
    setIsLoading(true);
    try {
      const { data: tx, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      setTransaction(tx as TransactionData);

      const [domainRes, escrowRes] = await Promise.all([
        supabase.from('domain_listings').select('name, price').eq('id', tx.domain_id).single(),
        supabase.from('escrow_services').select('*').eq('transaction_id', tx.id).maybeSingle(),
      ]);

      if (domainRes.data) setDomain(domainRes.data as DomainInfo);
      if (escrowRes.data) setEscrow(escrowRes.data as EscrowInfo);

      const profileIds = [tx.buyer_id, tx.seller_id].filter(Boolean) as string[];
      if (profileIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, username, avatar_url')
          .in('id', profileIds);
        if (profiles) {
          const buyerProfile = profiles.find(p => p.id === tx.buyer_id);
          const sellerProfile = profiles.find(p => p.id === tx.seller_id);
          if (buyerProfile) setBuyer(buyerProfile as ProfileInfo);
          if (sellerProfile) setSeller(sellerProfile as ProfileInfo);
        }
      }
    } catch {
      toast.error('加载交易信息失败');
      navigate('/user-center?tab=transactions');
    } finally {
      setIsLoading(false);
    }
  };

  const getStepIndex = (status: string) => {
    const map: Record<string, number> = {
      payment_pending: 0,
      escrow_funded: 1,
      domain_transferred: 2,
      buyer_confirmed: 3,
      completed: 4,
    };
    return map[status] ?? -1;
  };

  const handleSellerConfirmTransfer = async () => {
    if (!transaction) return;
    setActionLoading(true);
    try {
      await supabase.from('transactions').update({
        transfer_confirmed_seller: true,
        seller_confirmed_at: new Date().toISOString(),
        status: 'domain_transferred',
        updated_at: new Date().toISOString(),
      }).eq('id', transaction.id);

      if (escrow) {
        await supabase.from('escrow_services').update({
          domain_transferred_at: new Date().toISOString(),
          status: 'domain_transferred',
        }).eq('id', escrow.id);
      }

      await supabase.from('notifications').insert({
        user_id: transaction.buyer_id,
        type: 'domain_transferred',
        title: '域名已转移',
        message: `卖家已确认转移域名 ${domain?.name}，请登录验证并确认收到。`,
        data: { transaction_id: transaction.id },
      });

      toast.success('已确认域名转移，等待买家验证确认');
      loadTransaction();
    } catch {
      toast.error('操作失败，请重试');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBuyerConfirmReceived = async () => {
    if (!transaction) return;
    setActionLoading(true);
    try {
      await supabase.from('transactions').update({
        transfer_confirmed_buyer: true,
        buyer_confirmed_at: new Date().toISOString(),
        status: 'completed',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq('id', transaction.id);

      if (escrow) {
        await supabase.from('escrow_services').update({
          buyer_approved_at: new Date().toISOString(),
          released_at: new Date().toISOString(),
          status: 'released',
        }).eq('id', escrow.id);
      }

      await supabase.from('domain_listings').update({
        status: 'sold',
        updated_at: new Date().toISOString(),
      }).eq('id', transaction.domain_id);

      if (transaction.seller_id) {
        await supabase.from('profiles').update({
          total_sales: supabase.rpc('increment', { inc: 1 }) as unknown as number,
        }).eq('id', transaction.seller_id);
      }

      await supabase.from('notifications').insert({
        user_id: transaction.seller_id,
        type: 'transaction_completed',
        title: '交易完成！',
        message: `买家已确认收到域名 ${domain?.name}，资金已释放到您的账户。`,
        data: { transaction_id: transaction.id },
      });

      toast.success('交易完成！感谢您的信任');
      loadTransaction();
    } catch {
      toast.error('操作失败，请重试');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenDispute = async () => {
    if (!transaction || !disputeReason.trim()) {
      toast.error('请填写纠纷原因');
      return;
    }
    setActionLoading(true);
    try {
      const respondentId = isBuyer ? transaction.seller_id : transaction.buyer_id;
      await supabase.from('disputes').insert({
        transaction_id: transaction.id,
        domain_id: transaction.domain_id,
        initiator_id: user?.id,
        respondent_id: respondentId,
        reason: disputeReason,
        description: disputeDesc,
        status: 'open',
      });

      await supabase.from('transactions').update({
        status: 'disputed',
        updated_at: new Date().toISOString(),
      }).eq('id', transaction.id);

      await supabase.from('notifications').insert({
        user_id: respondentId,
        type: 'dispute_opened',
        title: '收到纠纷申诉',
        message: `交易 ${domain?.name} 收到纠纷申诉，平台将介入处理。`,
        data: { transaction_id: transaction.id },
      });

      toast.success('纠纷已提交，平台将在24小时内介入处理');
      setShowDispute(false);
      loadTransaction();
    } catch {
      toast.error('提交失败，请重试');
    } finally {
      setActionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  if (!transaction) return null;

  const currentStep = getStepIndex(transaction.status);
  const canSellerConfirm = isSeller && transaction.status === 'escrow_funded' && !transaction.transfer_confirmed_seller;
  const canBuyerConfirm = isBuyer && transaction.status === 'domain_transferred' && !transaction.transfer_confirmed_buyer;
  const canDispute = (isBuyer || isSeller) && ['escrow_funded', 'domain_transferred'].includes(transaction.status);
  const isCompleted = transaction.status === 'completed';

  const commissionRate = (transaction.commission_rate ?? 0.05) * 100;
  const commissionAmount = transaction.commission_amount ?? transaction.amount * (transaction.commission_rate ?? 0.05);
  const sellerAmount = transaction.seller_amount ?? transaction.amount - commissionAmount;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/user-center?tab=transactions">
              <ArrowLeft className="w-4 h-4 mr-1" />
              返回交易记录
            </Link>
          </Button>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">交易详情</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">交易信息</CardTitle>
                  <Badge variant={statusVariant[transaction.status] ?? 'secondary'}>
                    {statusLabel[transaction.status] ?? transaction.status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground font-mono">ID: {transaction.id}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-lg">
                  <Globe className="w-8 h-8 text-primary" />
                  <div>
                    <p className="font-semibold text-lg">{domain?.name ?? '—'}</p>
                    <p className="text-sm text-muted-foreground">成交价格</p>
                  </div>
                  <div className="ml-auto text-right">
                    <p className="text-xl font-bold text-primary">¥{transaction.amount.toLocaleString()}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="p-3 border rounded-lg">
                    <p className="text-muted-foreground mb-1 flex items-center gap-1"><User className="w-3 h-3" /> 买家</p>
                    <p className="font-medium">{buyer?.full_name ?? buyer?.username ?? '—'}</p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <p className="text-muted-foreground mb-1 flex items-center gap-1"><User className="w-3 h-3" /> 卖家</p>
                    <p className="font-medium">{seller?.full_name ?? seller?.username ?? '—'}</p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <p className="text-muted-foreground mb-1 flex items-center gap-1"><CreditCard className="w-3 h-3" /> 付款方式</p>
                    <p className="font-medium capitalize">{transaction.payment_method}</p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <p className="text-muted-foreground mb-1 flex items-center gap-1"><Clock className="w-3 h-3" /> 创建时间</p>
                    <p className="font-medium">{new Date(transaction.created_at).toLocaleDateString('zh-CN')}</p>
                  </div>
                </div>

                {isSeller && (
                  <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg text-sm space-y-1">
                    <p className="font-medium text-green-800 dark:text-green-400 flex items-center gap-1">
                      <Banknote className="w-4 h-4" /> 收益明细
                    </p>
                    <div className="flex justify-between text-muted-foreground">
                      <span>成交金额</span>
                      <span>¥{transaction.amount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>平台手续费 ({commissionRate}%)</span>
                      <span>-¥{commissionAmount.toLocaleString()}</span>
                    </div>
                    <Separator className="my-1" />
                    <div className="flex justify-between font-semibold text-green-700 dark:text-green-400">
                      <span>实际到账</span>
                      <span>¥{sellerAmount.toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Transaction Progress */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="w-4 h-4" /> 交易进度
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  {STATUS_STEPS.map((step, index) => {
                    const isDone = index < currentStep || (index === currentStep && isCompleted);
                    const isCurrent = index === currentStep && !isCompleted;
                    const StepIcon = step.icon;
                    return (
                      <div key={step.key} className="flex gap-4 pb-6 last:pb-0 relative">
                        {index < STATUS_STEPS.length - 1 && (
                          <div className={`absolute left-4 top-8 w-0.5 h-full -translate-x-0.5 ${isDone ? 'bg-primary' : 'bg-border'}`} />
                        )}
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 ${
                          isDone ? 'bg-primary text-primary-foreground' :
                          isCurrent ? 'bg-primary/20 text-primary border-2 border-primary' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          <StepIcon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 pt-1">
                          <p className={`font-medium text-sm ${isCurrent ? 'text-primary' : isDone ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {step.label}
                            {isCurrent && <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">当前</span>}
                            {isDone && index < STATUS_STEPS.length - 1 && <CheckCircle className="w-3 h-3 inline ml-1 text-green-500" />}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">{step.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            {(canSellerConfirm || canBuyerConfirm || canDispute || isCompleted) && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">操作</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {canSellerConfirm && (
                    <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <p className="text-sm font-medium text-blue-800 dark:text-blue-400 mb-2">卖家操作：确认域名已转移</p>
                      <p className="text-xs text-muted-foreground mb-3">请确认您已将域名转移至买家指定账户，确认后买家将验证并释放资金。</p>
                      <Button onClick={handleSellerConfirmTransfer} disabled={actionLoading} data-testid="button-confirm-transfer">
                        {actionLoading ? <LoadingSpinner size="sm" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                        确认已转移域名
                      </Button>
                    </div>
                  )}

                  {canBuyerConfirm && (
                    <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                      <p className="text-sm font-medium text-green-800 dark:text-green-400 mb-2">买家操作：确认收到域名</p>
                      <p className="text-xs text-muted-foreground mb-3">请确认域名已成功转移至您的账户。确认后资金将自动释放给卖家，此操作不可撤销。</p>
                      <Button onClick={handleBuyerConfirmReceived} disabled={actionLoading} data-testid="button-confirm-received">
                        {actionLoading ? <LoadingSpinner size="sm" /> : <CheckCheck className="w-4 h-4 mr-2" />}
                        确认收到域名，释放资金
                      </Button>
                    </div>
                  )}

                  {canDispute && (
                    <Dialog open={showDispute} onOpenChange={setShowDispute}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full text-destructive border-destructive/40 hover:bg-destructive/10" data-testid="button-open-dispute">
                          <Flag className="w-4 h-4 mr-2" /> 提交纠纷申诉
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>提交纠纷申诉</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-2">
                          <div>
                            <label className="text-sm font-medium mb-1 block">纠纷原因 *</label>
                            <Textarea
                              placeholder="简述纠纷原因（如：卖家拒绝转移域名、域名信息不符等）"
                              value={disputeReason}
                              onChange={e => setDisputeReason(e.target.value)}
                              rows={2}
                              data-testid="input-dispute-reason"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium mb-1 block">详细说明</label>
                            <Textarea
                              placeholder="请提供详细情况，有助于平台更快解决纠纷"
                              value={disputeDesc}
                              onChange={e => setDisputeDesc(e.target.value)}
                              rows={4}
                              data-testid="input-dispute-description"
                            />
                          </div>
                          <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 rounded-lg text-xs text-muted-foreground">
                            <AlertTriangle className="w-3 h-3 inline mr-1 text-yellow-600" />
                            提交纠纷后，交易将暂停，平台将在24小时内介入调查。请确保您提供的信息真实准确。
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setShowDispute(false)}>取消</Button>
                          <Button variant="destructive" onClick={handleOpenDispute} disabled={actionLoading} data-testid="button-submit-dispute">
                            {actionLoading ? <LoadingSpinner size="sm" /> : '提交申诉'}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}

                  {isCompleted && (
                    <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg text-center">
                      <CheckCheck className="w-8 h-8 text-green-500 mx-auto mb-2" />
                      <p className="font-medium text-green-800 dark:text-green-400">交易已完成</p>
                      <p className="text-xs text-muted-foreground mt-1">完成于 {transaction.completed_at ? new Date(transaction.completed_at).toLocaleString('zh-CN') : '—'}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3"
                        onClick={() => setShowReview(true)}
                        data-testid="button-write-review"
                      >
                        <Star className="w-4 h-4 mr-1" /> 评价对方
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Shield className="w-4 h-4 text-green-500" /> 资金托管状态
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {escrow ? (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">状态</span>
                      <Badge variant={escrow.status === 'released' ? 'default' : 'secondary'}>
                        {escrow.status === 'funded' ? '托管中' :
                         escrow.status === 'domain_transferred' ? '域名已转' :
                         escrow.status === 'released' ? '已释放' : escrow.status ?? '—'}
                      </Badge>
                    </div>
                    {escrow.funded_at && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">托管时间</span>
                        <span className="text-xs">{new Date(escrow.funded_at).toLocaleDateString('zh-CN')}</span>
                      </div>
                    )}
                    {escrow.escrow_fee && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">托管费</span>
                        <span>¥{escrow.escrow_fee}</span>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-muted-foreground text-xs">暂无托管记录</p>
                )}
              </CardContent>
            </Card>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowMessages(true)}
              data-testid="button-open-messages"
            >
              <MessageSquare className="w-4 h-4 mr-2" /> 联系对方
            </Button>

            <Card className="border-muted">
              <CardContent className="pt-4 text-xs text-muted-foreground space-y-2">
                <div className="flex items-start gap-2">
                  <Shield className="w-3 h-3 mt-0.5 text-green-500 shrink-0" />
                  <span>平台资金托管，保障买卖双方权益</span>
                </div>
                <div className="flex items-start gap-2">
                  <FileText className="w-3 h-3 mt-0.5 text-blue-500 shrink-0" />
                  <span>如有纠纷，平台24小时内介入处理</span>
                </div>
                <div className="flex items-start gap-2">
                  <Star className="w-3 h-3 mt-0.5 text-yellow-500 shrink-0" />
                  <span>交易完成后请互相评价，建立信任体系</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Review Dialog */}
      {showReview && transaction && (
        <Dialog open={showReview} onOpenChange={setShowReview}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>评价交易</DialogTitle>
            </DialogHeader>
            <ReviewSystem
              transactionId={transaction.id}
              reviewedUserId={isBuyer ? transaction.seller_id! : transaction.buyer_id!}
              onDone={() => setShowReview(false)}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Messages Dialog */}
      {showMessages && transaction && (
        <Dialog open={showMessages} onOpenChange={setShowMessages}>
          <DialogContent className="max-w-lg h-[70vh] flex flex-col p-0">
            <DialogHeader className="px-6 pt-6 pb-3 border-b">
              <DialogTitle>与{isBuyer ? '卖家' : '买家'}沟通</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-hidden">
              <MessageCenter
                otherUserId={isBuyer ? transaction.seller_id! : transaction.buyer_id!}
                transactionId={transaction.id}
                domainId={transaction.domain_id}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
