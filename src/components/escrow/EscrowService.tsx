
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  User,
  FileText,
  CreditCard,
  ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';

interface EscrowTransaction {
  id: string;
  domainName: string;
  buyerName: string;
  sellerName: string;
  amount: number;
  status: 'initiated' | 'funded' | 'domain_transferred' | 'completed' | 'disputed';
  createdAt: string;
  steps: {
    buyerFunded: boolean;
    domainTransferred: boolean;
    buyerApproved: boolean;
    fundsReleased: boolean;
  };
}

interface EscrowServiceProps {
  transactionId?: string;
  isAdmin?: boolean;
}

export const EscrowService: React.FC<EscrowServiceProps> = ({
  transactionId,
  isAdmin = false
}) => {
  const [transactions, setTransactions] = useState<EscrowTransaction[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<EscrowTransaction | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTransactions();
  }, [transactionId]);

  const loadTransactions = async () => {
    setIsLoading(true);
    try {
      // 模拟加载托管交易数据
      const mockTransactions: EscrowTransaction[] = [
        {
          id: '1',
          domainName: 'example.com',
          buyerName: '张先生',
          sellerName: '李女士',
          amount: 50000,
          status: 'domain_transferred',
          createdAt: '2024-01-15T10:30:00Z',
          steps: {
            buyerFunded: true,
            domainTransferred: true,
            buyerApproved: false,
            fundsReleased: false
          }
        },
        {
          id: '2',
          domainName: 'test.com',
          buyerName: '王总',
          sellerName: '赵总',
          amount: 80000,
          status: 'funded',
          createdAt: '2024-01-10T14:20:00Z',
          steps: {
            buyerFunded: true,
            domainTransferred: false,
            buyerApproved: false,
            fundsReleased: false
          }
        }
      ];

      setTransactions(mockTransactions);
      
      if (transactionId) {
        const transaction = mockTransactions.find(t => t.id === transactionId);
        setSelectedTransaction(transaction || null);
      }
    } catch (error) {
      console.error('Failed to load escrow transactions:', error);
      toast.error('加载托管交易失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStepAction = async (action: string, transactionId: string) => {
    try {
      // 模拟执行托管步骤
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setTransactions(prev => prev.map(transaction => {
        if (transaction.id === transactionId) {
          const updatedSteps = { ...transaction.steps };
          
          switch (action) {
            case 'approve_domain':
              updatedSteps.buyerApproved = true;
              break;
            case 'release_funds':
              updatedSteps.fundsReleased = true;
              break;
          }
          
          return {
            ...transaction,
            steps: updatedSteps,
            status: updatedSteps.fundsReleased ? 'completed' : transaction.status
          };
        }
        return transaction;
      }));
      
      toast.success('操作成功');
    } catch (error) {
      console.error('Escrow action failed:', error);
      toast.error('操作失败');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      initiated: { label: '已创建', variant: 'secondary' as const },
      funded: { label: '已付款', variant: 'default' as const },
      domain_transferred: { label: '域名已转移', variant: 'default' as const },
      completed: { label: '已完成', variant: 'default' as const },
      disputed: { label: '争议中', variant: 'destructive' as const }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getProgressPercentage = (steps: EscrowTransaction['steps']) => {
    const completedSteps = Object.values(steps).filter(Boolean).length;
    return (completedSteps / 4) * 100;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse space-y-4">
          <div className="h-48 bg-muted rounded"></div>
          <div className="h-32 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  // 单个交易详情视图
  if (selectedTransaction) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            托管交易详情 - {selectedTransaction.domainName}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 交易信息 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
              <User className="h-5 w-5" />
              <div>
                <div className="text-sm text-muted-foreground">买方</div>
                <div className="font-medium">{selectedTransaction.buyerName}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
              <User className="h-5 w-5" />
              <div>
                <div className="text-sm text-muted-foreground">卖方</div>
                <div className="font-medium">{selectedTransaction.sellerName}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
              <CreditCard className="h-5 w-5" />
              <div>
                <div className="text-sm text-muted-foreground">交易金额</div>
                <div className="font-medium">¥{selectedTransaction.amount.toLocaleString()}</div>
              </div>
            </div>
          </div>

          {/* 进度条 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">交易进度</span>
              <span className="text-sm text-muted-foreground">
                {getProgressPercentage(selectedTransaction.steps).toFixed(0)}%
              </span>
            </div>
            <Progress value={getProgressPercentage(selectedTransaction.steps)} />
          </div>

          {/* 交易步骤 */}
          <div className="space-y-4">
            <h3 className="font-semibold">交易步骤</h3>
            
            <div className="space-y-3">
              {/* 步骤1：买方付款 */}
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <div className={`p-2 rounded-full ${
                  selectedTransaction.steps.buyerFunded 
                    ? 'bg-green-100 text-green-600' 
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {selectedTransaction.steps.buyerFunded ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <Clock className="h-4 w-4" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-medium">买方付款到托管账户</div>
                  <div className="text-sm text-muted-foreground">
                    资金安全托管，等待域名转移
                  </div>
                </div>
                {selectedTransaction.steps.buyerFunded && (
                  <Badge variant="default">已完成</Badge>
                )}
              </div>

              {/* 步骤2：域名转移 */}
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <div className={`p-2 rounded-full ${
                  selectedTransaction.steps.domainTransferred 
                    ? 'bg-green-100 text-green-600' 
                    : selectedTransaction.steps.buyerFunded
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {selectedTransaction.steps.domainTransferred ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : selectedTransaction.steps.buyerFunded ? (
                    <Clock className="h-4 w-4" />
                  ) : (
                    <Clock className="h-4 w-4" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-medium">卖方转移域名</div>
                  <div className="text-sm text-muted-foreground">
                    域名管理权转移给买方
                  </div>
                </div>
                {selectedTransaction.steps.domainTransferred && (
                  <Badge variant="default">已完成</Badge>
                )}
              </div>

              {/* 步骤3：买方确认 */}
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <div className={`p-2 rounded-full ${
                  selectedTransaction.steps.buyerApproved 
                    ? 'bg-green-100 text-green-600' 
                    : selectedTransaction.steps.domainTransferred
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {selectedTransaction.steps.buyerApproved ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : selectedTransaction.steps.domainTransferred ? (
                    <Clock className="h-4 w-4" />
                  ) : (
                    <Clock className="h-4 w-4" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-medium">买方确认收到域名</div>
                  <div className="text-sm text-muted-foreground">
                    确认域名转移成功
                  </div>
                </div>
                {selectedTransaction.steps.buyerApproved ? (
                  <Badge variant="default">已完成</Badge>
                ) : selectedTransaction.steps.domainTransferred ? (
                  <Button
                    size="sm"
                    onClick={() => handleStepAction('approve_domain', selectedTransaction.id)}
                  >
                    确认收到
                  </Button>
                ) : null}
              </div>

              {/* 步骤4：资金释放 */}
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <div className={`p-2 rounded-full ${
                  selectedTransaction.steps.fundsReleased 
                    ? 'bg-green-100 text-green-600' 
                    : selectedTransaction.steps.buyerApproved
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {selectedTransaction.steps.fundsReleased ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : selectedTransaction.steps.buyerApproved ? (
                    <Clock className="h-4 w-4" />
                  ) : (
                    <Clock className="h-4 w-4" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-medium">资金释放给卖方</div>
                  <div className="text-sm text-muted-foreground">
                    交易完成，资金转账给卖方
                  </div>
                </div>
                {selectedTransaction.steps.fundsReleased ? (
                  <Badge variant="default">已完成</Badge>
                ) : selectedTransaction.steps.buyerApproved && isAdmin ? (
                  <Button
                    size="sm"
                    onClick={() => handleStepAction('release_funds', selectedTransaction.id)}
                  >
                    释放资金
                  </Button>
                ) : null}
              </div>
            </div>
          </div>

          {/* 争议处理 */}
          {selectedTransaction.status !== 'completed' && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <span className="font-medium text-yellow-800">需要帮助？</span>
              </div>
              <p className="text-sm text-yellow-700 mb-3">
                如果您在交易过程中遇到问题，可以联系我们的客服团队
              </p>
              <Button variant="outline" size="sm">
                联系客服
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // 交易列表视图
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            托管服务交易
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="p-4 border rounded-lg hover:bg-muted/30 cursor-pointer transition-colors"
                onClick={() => setSelectedTransaction(transaction)}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="font-semibold">{transaction.domainName}</div>
                    {getStatusBadge(transaction.status)}
                  </div>
                  <div className="text-right">
                    <div className="font-bold">¥{transaction.amount.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(transaction.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    {transaction.buyerName} → {transaction.sellerName}
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress 
                      value={getProgressPercentage(transaction.steps)} 
                      className="w-20 h-2"
                    />
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </div>
            ))}

            {transactions.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>暂无托管交易记录</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
