
import React from 'react';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Edit, Trash2 } from "lucide-react";

interface Domain {
  id: string;
  name: string;
  price: number;
  status: string;
  created_at: string;
  expiry_date?: string;
  verification_status?: string;
  category?: string;
}

interface DomainTableProps {
  domains: Domain[];
  onView?: (domain: Domain) => void;
  onEdit?: (domain: Domain) => void;
  onDelete?: (domain: Domain) => void;
}

export const DomainTable = ({ domains, onView, onEdit, onDelete }: DomainTableProps) => {
  if (!domains || domains.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500">暂无域名</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>域名</TableHead>
            <TableHead>价格</TableHead>
            <TableHead>状态</TableHead>
            <TableHead>验证</TableHead>
            <TableHead>分类</TableHead>
            <TableHead>创建日期</TableHead>
            <TableHead className="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {domains.map((domain) => (
            <TableRow key={domain.id}>
              <TableCell className="font-medium">{domain.name}</TableCell>
              <TableCell>${domain.price?.toLocaleString()}</TableCell>
              <TableCell>
                <Badge className={domain.status === 'available' ? 'bg-green-500 text-white' : domain.status === 'sold' ? 'bg-red-500 text-white' : 'bg-yellow-400 text-white'}>
                  {React.createElement('span', {}, domain.status === 'available' ? '可售' : domain.status === 'sold' ? '已售' : '预留')}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge className={domain.verification_status === 'verified' ? 'bg-green-500 text-white' : domain.verification_status === 'pending' ? 'bg-yellow-400 text-white' : 'bg-gray-400 text-white'}>
                  {React.createElement('span', {}, domain.verification_status === 'verified' ? '已验证' : domain.verification_status === 'pending' ? '待验证' : '未验证')}
                </Badge>
              </TableCell>
              <TableCell>
                {domain.category ? (
                  React.createElement('span', {}, domain.category) 
                ) : (
                  <span className="text-gray-400">未分类</span>
                )}
              </TableCell>
              <TableCell>{new Date(domain.created_at).toLocaleDateString()}</TableCell>
              <TableCell className="text-right space-x-2">
                {onView && (
                  <Button variant="ghost" size="sm" onClick={() => onView(domain)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                )}
                {onEdit && (
                  <Button variant="ghost" size="sm" onClick={() => onEdit(domain)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                )}
                {onDelete && (
                  <Button variant="ghost" size="sm" onClick={() => onDelete(domain)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
