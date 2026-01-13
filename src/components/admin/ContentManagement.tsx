import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { FileText, Plus, Edit, Trash2, Eye, RefreshCw, Search, GripVertical } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Page {
  id: string;
  title: string;
  content: string;
  slug: string;
  created_at: string;
  updated_at: string;
  order_index?: number;
}

interface SiteContent {
  id: string;
  key: string;
  content: string;
  type: string;
  section: string;
  created_at: string;
  updated_at: string;
}

// 可排序页面项
const SortablePageItem = ({ page, onEdit, onDelete, onView }: {
  page: Page;
  onEdit: () => void;
  onDelete: () => void;
  onView: () => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: page.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card ref={setNodeRef} style={style} className={isDragging ? 'shadow-lg ring-2 ring-primary' : ''}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div {...attributes} {...listeners} className="cursor-grab hover:text-primary">
              <GripVertical className="h-5 w-5 text-muted-foreground" />
            </div>
            <span>{page.title}</span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onView}>
              <Eye className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="destructive" size="sm" onClick={onDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
        <CardDescription>
          路径: /{page.slug} | 更新时间: {new Date(page.updated_at).toLocaleString()}
        </CardDescription>
      </CardHeader>
    </Card>
  );
};

// 简易富文本编辑器
const RichTextEditor = ({ value, onChange, placeholder }: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) => {
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');

  const insertFormat = (format: string) => {
    const textarea = document.getElementById('content-editor') as HTMLTextAreaElement;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    
    let formattedText = '';
    switch (format) {
      case 'bold':
        formattedText = `<strong>${selectedText || '粗体文本'}</strong>`;
        break;
      case 'italic':
        formattedText = `<em>${selectedText || '斜体文本'}</em>`;
        break;
      case 'h1':
        formattedText = `<h1>${selectedText || '标题'}</h1>`;
        break;
      case 'h2':
        formattedText = `<h2>${selectedText || '副标题'}</h2>`;
        break;
      case 'link':
        formattedText = `<a href="https://">${selectedText || '链接文本'}</a>`;
        break;
      case 'ul':
        formattedText = `<ul>\n  <li>${selectedText || '列表项'}</li>\n</ul>`;
        break;
      case 'img':
        formattedText = `<img src="https://" alt="${selectedText || '图片描述'}" />`;
        break;
      default:
        formattedText = selectedText;
    }
    
    const newValue = value.substring(0, start) + formattedText + value.substring(end);
    onChange(newValue);
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="bg-muted p-2 flex gap-1 flex-wrap border-b">
        <Button type="button" variant="ghost" size="sm" onClick={() => insertFormat('bold')}>
          <strong>B</strong>
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => insertFormat('italic')}>
          <em>I</em>
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => insertFormat('h1')}>
          H1
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => insertFormat('h2')}>
          H2
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => insertFormat('link')}>
          链接
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => insertFormat('ul')}>
          列表
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => insertFormat('img')}>
          图片
        </Button>
        <div className="flex-1" />
        <div className="flex gap-1">
          <Button 
            type="button" 
            variant={activeTab === 'edit' ? 'secondary' : 'ghost'} 
            size="sm"
            onClick={() => setActiveTab('edit')}
          >
            编辑
          </Button>
          <Button 
            type="button" 
            variant={activeTab === 'preview' ? 'secondary' : 'ghost'} 
            size="sm"
            onClick={() => setActiveTab('preview')}
          >
            预览
          </Button>
        </div>
      </div>
      
      {activeTab === 'edit' ? (
        <Textarea
          id="content-editor"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={12}
          className="border-0 rounded-none focus-visible:ring-0"
        />
      ) : (
        <div 
          className="min-h-[280px] p-4 prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: value || '<p class="text-muted-foreground">暂无内容</p>' }}
        />
      )}
    </div>
  );
};

export const ContentManagement = () => {
  const [pages, setPages] = useState<Page[]>([]);
  const [siteContent, setSiteContent] = useState<SiteContent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingPage, setEditingPage] = useState<Page | null>(null);
  const [editingContent, setEditingContent] = useState<SiteContent | null>(null);
  const [isPageDialogOpen, setIsPageDialogOpen] = useState(false);
  const [isContentDialogOpen, setIsContentDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newPage, setNewPage] = useState({ title: '', content: '', slug: '' });
  const [newContent, setNewContent] = useState({ key: '', content: '', type: 'html', section: 'home' });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    setIsLoading(true);
    try {
      const [pagesResult, contentResult] = await Promise.all([
        supabase.from('pages').select('*').order('created_at', { ascending: false }),
        supabase.from('site_content').select('*').order('section', { ascending: true })
      ]);

      if (pagesResult.error) throw pagesResult.error;
      if (contentResult.error) throw contentResult.error;

      setPages(pagesResult.data || []);
      setSiteContent(contentResult.data || []);
    } catch (error: any) {
      console.error('加载内容时出错:', error);
      toast.error(error.message || '加载内容失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setPages((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
      toast.success('页面顺序已更新');
    }
  };

  const savePage = async () => {
    setIsSaving(true);
    try {
      if (editingPage) {
        const { error } = await supabase
          .from('pages')
          .update({
            title: editingPage.title,
            content: editingPage.content,
            slug: editingPage.slug,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingPage.id);

        if (error) throw error;
        setPages(pages.map(p => p.id === editingPage.id ? editingPage : p));
        toast.success('页面更新成功');
      } else if (newPage.title && newPage.slug) {
        const { data, error } = await supabase
          .from('pages')
          .insert([newPage])
          .select()
          .single();

        if (error) throw error;
        setPages([data, ...pages]);
        setNewPage({ title: '', content: '', slug: '' });
        toast.success('页面创建成功');
      }

      setIsPageDialogOpen(false);
      setEditingPage(null);
    } catch (error: any) {
      console.error('保存页面时出错:', error);
      toast.error(error.message || '保存页面失败');
    } finally {
      setIsSaving(false);
    }
  };

  const deletePage = async (id: string) => {
    if (!confirm('确定要删除这个页面吗？')) return;

    try {
      const { error } = await supabase
        .from('pages')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setPages(pages.filter(p => p.id !== id));
      toast.success('页面删除成功');
    } catch (error: any) {
      console.error('删除页面时出错:', error);
      toast.error(error.message || '删除页面失败');
    }
  };

  const saveSiteContent = async () => {
    setIsSaving(true);
    try {
      if (editingContent) {
        const { error } = await supabase
          .from('site_content')
          .update({
            key: editingContent.key,
            content: editingContent.content,
            type: editingContent.type,
            section: editingContent.section,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingContent.id);

        if (error) throw error;
        setSiteContent(siteContent.map(c => c.id === editingContent.id ? editingContent : c));
        toast.success('内容更新成功');
      } else if (newContent.key) {
        const { data, error } = await supabase
          .from('site_content')
          .insert([newContent])
          .select()
          .single();

        if (error) throw error;
        setSiteContent([...siteContent, data]);
        setNewContent({ key: '', content: '', type: 'html', section: 'home' });
        toast.success('内容创建成功');
      }

      setIsContentDialogOpen(false);
      setEditingContent(null);
    } catch (error: any) {
      console.error('保存内容时出错:', error);
      toast.error(error.message || '保存内容失败');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteSiteContent = async (id: string) => {
    if (!confirm('确定要删除这个内容块吗？')) return;

    try {
      const { error } = await supabase
        .from('site_content')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setSiteContent(siteContent.filter(c => c.id !== id));
      toast.success('内容删除成功');
    } catch (error: any) {
      console.error('删除内容时出错:', error);
      toast.error(error.message || '删除内容失败');
    }
  };

  const filteredPages = pages.filter(page =>
    page.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    page.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredContent = siteContent.filter(content =>
    content.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
    content.section.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-gray-700" />
          <h2 className="text-xl font-semibold">内容管理</h2>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索内容..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
          <Button variant="outline" onClick={loadContent}>
            <RefreshCw className="h-4 w-4 mr-2" />
            刷新
          </Button>
        </div>
      </div>

      <Tabs defaultValue="pages" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="pages">
            <FileText className="h-4 w-4 mr-2" />
            页面管理 ({filteredPages.length})
          </TabsTrigger>
          <TabsTrigger value="content">
            <Edit className="h-4 w-4 mr-2" />
            站点内容 ({filteredContent.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pages">
          <div className="space-y-6">
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="py-4 flex items-center justify-between">
                <p className="text-sm text-blue-700">
                  💡 拖拽页面卡片可以调整显示顺序
                </p>
                <Button onClick={() => {
                  setEditingPage(null);
                  setNewPage({ title: '', content: '', slug: '' });
                  setIsPageDialogOpen(true);
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  新建页面
                </Button>
              </CardContent>
            </Card>

            {filteredPages.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">暂无页面</h3>
                  <p className="text-muted-foreground mb-4">点击"新建页面"按钮创建第一个页面</p>
                </CardContent>
              </Card>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={filteredPages.map(p => p.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="grid gap-4">
                    {filteredPages.map(page => (
                      <SortablePageItem
                        key={page.id}
                        page={page}
                        onEdit={() => {
                          setEditingPage(page);
                          setIsPageDialogOpen(true);
                        }}
                        onDelete={() => deletePage(page.id)}
                        onView={() => window.open(`/${page.slug}`, '_blank')}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>
        </TabsContent>

        <TabsContent value="content">
          <div className="space-y-6">
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="py-4 flex items-center justify-between">
                <p className="text-sm text-blue-700">
                  💡 站点内容用于存储可复用的文本块，如页脚信息、公告等
                </p>
                <Button onClick={() => {
                  setEditingContent(null);
                  setNewContent({ key: '', content: '', type: 'html', section: 'home' });
                  setIsContentDialogOpen(true);
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  新建内容
                </Button>
              </CardContent>
            </Card>

            <div className="grid gap-4">
              {filteredContent.map(content => (
                <Card key={content.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span>{content.key}</span>
                        <Badge variant="outline">{content.type}</Badge>
                        <Badge variant="secondary">{content.section}</Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingContent(content);
                            setIsContentDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteSiteContent(content.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardTitle>
                    <CardDescription>
                      更新时间: {new Date(content.updated_at).toLocaleString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2">{content.content}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* 页面编辑对话框 */}
      <Dialog open={isPageDialogOpen} onOpenChange={setIsPageDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPage ? '编辑页面' : '新建页面'}</DialogTitle>
            <DialogDescription>
              {editingPage ? '修改页面内容，支持HTML格式' : '创建新页面，支持HTML格式'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>页面标题</Label>
                <Input
                  value={editingPage ? editingPage.title : newPage.title}
                  onChange={(e) => editingPage
                    ? setEditingPage({...editingPage, title: e.target.value})
                    : setNewPage({...newPage, title: e.target.value})
                  }
                  placeholder="页面标题"
                />
              </div>
              <div>
                <Label>URL路径</Label>
                <Input
                  value={editingPage ? editingPage.slug : newPage.slug}
                  onChange={(e) => editingPage
                    ? setEditingPage({...editingPage, slug: e.target.value})
                    : setNewPage({...newPage, slug: e.target.value})
                  }
                  placeholder="例如: about-us"
                />
              </div>
            </div>
            <div>
              <Label>页面内容</Label>
              <RichTextEditor
                value={editingPage ? editingPage.content : newPage.content}
                onChange={(value) => editingPage
                  ? setEditingPage({...editingPage, content: value})
                  : setNewPage({...newPage, content: value})
                }
                placeholder="在此输入页面内容..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPageDialogOpen(false)}>
              取消
            </Button>
            <Button 
              onClick={savePage} 
              disabled={isSaving || !(editingPage ? editingPage.title && editingPage.slug : newPage.title && newPage.slug)}
            >
              {isSaving && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
              {editingPage ? '保存更改' : '创建页面'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 站点内容编辑对话框 */}
      <Dialog open={isContentDialogOpen} onOpenChange={setIsContentDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingContent ? '编辑内容' : '新建内容'}</DialogTitle>
            <DialogDescription>
              {editingContent ? '修改站点内容' : '创建新的站点内容块'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>内容键名</Label>
                <Input
                  value={editingContent ? editingContent.key : newContent.key}
                  onChange={(e) => editingContent
                    ? setEditingContent({...editingContent, key: e.target.value})
                    : setNewContent({...newContent, key: e.target.value})
                  }
                  placeholder="例如: hero_title"
                />
              </div>
              <div>
                <Label>内容类型</Label>
                <Select
                  value={editingContent ? editingContent.type : newContent.type}
                  onValueChange={(value) => editingContent
                    ? setEditingContent({...editingContent, type: value})
                    : setNewContent({...newContent, type: value})
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择类型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">文本</SelectItem>
                    <SelectItem value="html">HTML</SelectItem>
                    <SelectItem value="markdown">Markdown</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>所属部分</Label>
                <Input
                  value={editingContent ? editingContent.section : newContent.section}
                  onChange={(e) => editingContent
                    ? setEditingContent({...editingContent, section: e.target.value})
                    : setNewContent({...newContent, section: e.target.value})
                  }
                  placeholder="例如: home, about"
                />
              </div>
            </div>
            <div>
              <Label>内容</Label>
              <RichTextEditor
                value={editingContent ? editingContent.content : newContent.content}
                onChange={(value) => editingContent
                  ? setEditingContent({...editingContent, content: value})
                  : setNewContent({...newContent, content: value})
                }
                placeholder="在此输入内容..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsContentDialogOpen(false)}>
              取消
            </Button>
            <Button 
              onClick={saveSiteContent} 
              disabled={isSaving || !(editingContent ? editingContent.key : newContent.key)}
            >
              {isSaving && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
              {editingContent ? '保存更改' : '创建内容'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};