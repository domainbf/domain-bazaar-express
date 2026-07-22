import { useMemo, useState } from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { ArrowUpDown, ChevronLeft, ChevronRight, Eye, Shield, Star, Settings2, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { DomainDetailDrawer } from './DomainDetailDrawer';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Props {
  domains: any[];
  onDomainUpdate: () => void;
  currentUserId?: string;
}

const statusBadge = (status?: string) => {
  const map: Record<string, { label: string; cls: string }> = {
    available: { label: '可售', cls: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30' },
    pending: { label: '暂不出售', cls: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/30' },
    sold: { label: '已售', cls: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30' },
    reserved: { label: '保留', cls: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/30' },
  };
  const s = map[status || ''] || { label: '未知', cls: '' };
  return <Badge className={s.cls} variant="outline">{s.label}</Badge>;
};

export const DomainAdvancedTable = ({ domains, onDomainUpdate }: Props) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [rowSelection, setRowSelection] = useState({});
  const [drawerDomain, setDrawerDomain] = useState<any | null>(null);
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);

  const columns = useMemo<ColumnDef<any>[]>(() => [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected() ? true : table.getIsSomePageRowsSelected() ? 'indeterminate' : false}
          onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
          aria-label="全选"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(v) => row.toggleSelected(!!v)}
          onClick={(e) => e.stopPropagation()}
          aria-label="选择行"
        />
      ),
      enableSorting: false,
    },
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <Button variant="ghost" size="sm" className="-ml-3 h-8" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          域名 <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {row.original.highlight && <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500 shrink-0" />}
          <span className="font-medium">{row.original.name}</span>
          {row.original.is_verified && <Shield className="w-3.5 h-3.5 text-green-500" />}
        </div>
      ),
    },
    {
      accessorKey: 'price',
      header: ({ column }) => (
        <Button variant="ghost" size="sm" className="-ml-3 h-8" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          价格 <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => {
        const { formatPrice } = require('@/lib/currency');
        return <span className="font-semibold">{formatPrice(Number(row.original.price || 0), row.original.currency)}</span>;
      },
    },
    {
      accessorKey: 'status',
      header: '状态',
      cell: ({ row }) => statusBadge(row.original.status),
      filterFn: 'equals',
    },
    {
      accessorKey: 'category',
      header: '分类',
      cell: ({ row }) => <Badge variant="secondary" className="text-xs">{row.original.category || '普通'}</Badge>,
    },
    {
      accessorKey: 'views',
      header: ({ column }) => (
        <Button variant="ghost" size="sm" className="-ml-3 h-8" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          浏览 <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Eye className="w-3.5 h-3.5" /> {row.original.views || 0}
        </div>
      ),
    },
    {
      accessorKey: 'created_at',
      header: ({ column }) => (
        <Button variant="ghost" size="sm" className="-ml-3 h-8" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          添加时间 <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.created_at ? formatDistanceToNow(new Date(row.original.created_at), { addSuffix: true, locale: zhCN }) : '-'}
        </span>
      ),
    },
  ], []);

  const table = useReactTable({
    data: domains,
    columns,
    state: { sorting, globalFilter, rowSelection, columnVisibility },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: (updater) =>
      setColumnVisibility((prev) => (typeof updater === 'function' ? (updater as any)(prev) : updater)),
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  const selectedIds = Object.keys(rowSelection)
    .filter((k) => (rowSelection as any)[k])
    .map((idx) => domains[Number(idx)]?.id)
    .filter(Boolean);

  const bulkUpdateStatus = async (status: string) => {
    if (!selectedIds.length) return;
    setBusy(true);
    const { error } = await supabase.from('domain_listings').update({ status }).in('id', selectedIds);
    setBusy(false);
    if (error) {
      toast.error('批量更新失败: ' + error.message);
    } else {
      toast.success(`已更新 ${selectedIds.length} 个域名`);
      setRowSelection({});
      onDomainUpdate();
    }
  };

  const bulkDelete = async () => {
    if (!selectedIds.length) return;
    if (!confirm(`确定删除选中的 ${selectedIds.length} 个域名？`)) return;
    setBusy(true);
    const { error } = await supabase.from('domain_listings').delete().in('id', selectedIds);
    setBusy(false);
    if (error) {
      toast.error('删除失败: ' + error.message);
    } else {
      toast.success('已删除');
      setRowSelection({});
      onDomainUpdate();
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="快速筛选 (按域名/描述)"
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-xs"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Settings2 className="w-4 h-4 mr-1" /> 列
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>显示列</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {table.getAllLeafColumns().filter((c) => c.getCanHide()).map((column) => (
              <DropdownMenuCheckboxItem
                key={column.id}
                checked={column.getIsVisible()}
                onCheckedChange={(v) => column.toggleVisibility(!!v)}
              >
                {column.id}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {selectedIds.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 ml-auto">
            <span className="text-sm text-muted-foreground">已选 {selectedIds.length}</span>
            <Button size="sm" variant="outline" disabled={busy} onClick={() => bulkUpdateStatus('available')}>标为可售</Button>
            <Button size="sm" variant="outline" disabled={busy} onClick={() => bulkUpdateStatus('pending')}>暂不出售</Button>
            <Button size="sm" variant="destructive" disabled={busy} onClick={bulkDelete}>
              <Trash2 className="w-3.5 h-3.5 mr-1" /> 删除
            </Button>
          </div>
        )}
      </div>

      <div className="rounded-lg border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/30">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="border-b">
                {hg.headers.map((h) => (
                  <th key={h.id} className="text-left px-3 py-2 text-xs font-medium text-muted-foreground whitespace-nowrap">
                    {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-10 text-muted-foreground">无匹配数据</td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b hover:bg-muted/40 cursor-pointer transition-colors"
                  onClick={() => setDrawerDomain(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-3 py-2.5 whitespace-nowrap">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div>共 {table.getFilteredRowModel().rows.length} 条</div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span>
            第 {table.getState().pagination.pageIndex + 1} / {table.getPageCount() || 1} 页
          </span>
          <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <DomainDetailDrawer
        domain={drawerDomain}
        open={!!drawerDomain}
        onOpenChange={(o) => !o && setDrawerDomain(null)}
        onUpdate={onDomainUpdate}
      />
    </div>
  );
};
