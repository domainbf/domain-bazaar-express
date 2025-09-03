import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Plus, Edit, Trash2, Eye } from 'lucide-react';

interface Page {
  id: string;
  title: string;
  content: string;
  slug: string;
  created_at: string;
  updated_at: string;
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

export const ContentManagement = () => {
  const [pages, setPages] = useState<Page[]>([]);
  const [siteContent, setSiteContent] = useState<SiteContent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingPage, setEditingPage] = useState<Page | null>(null);
  const [editingContent, setEditingContent] = useState<SiteContent | null>(null);
  const [newPage, setNewPage] = useState({ title: '', content: '', slug: '' });
  const [newContent, setNewContent] = useState({ key: '', content: '', type: 'text', section: 'home' });

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

  const savePage = async () => {
    try {
      if (editingPage) {
        // 更新现有页面
        const { error } = await supabase
          .from('pages')
          .update({
            title: editingPage.title,
            content: editingPage.content,
            slug: editingPage.slug
          })
          .eq('id', editingPage.id);

        if (error) throw error;
        toast.success('页面更新成功');
      } else if (newPage.title && newPage.slug) {
        // 创建新页面
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

      setEditingPage(null);
      await loadContent();
    } catch (error: any) {
      console.error('保存页面时出错:', error);
      toast.error(error.message || '保存页面失败');
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
    try {
      if (editingContent) {
        // 更新现有内容
        const { error } = await supabase
          .from('site_content')
          .update({
            content: editingContent.content
          })
          .eq('id', editingContent.id);

        if (error) throw error;
        toast.success('内容更新成功');
      } else if (newContent.key) {
        // 创建新内容
        const { data, error } = await supabase
          .from('site_content')
          .insert([newContent])
          .select()
          .single();

        if (error) throw error;
        setSiteContent([...siteContent, data]);
        setNewContent({ key: '', content: '', type: 'text', section: 'home' });
        toast.success('内容创建成功');
      }

      setEditingContent(null);
      await loadContent();
    } catch (error: any) {
      console.error('保存内容时出错:', error);
      toast.error(error.message || '保存内容失败');
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

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <FileText className="h-5 w-5 text-gray-700" />
        <h2 className="text-xl font-semibold">内容管理</h2>
      </div>

      <Tabs defaultValue="pages" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="pages">
            <FileText className="h-4 w-4 mr-2" />
            页面管理
          </TabsTrigger>
          <TabsTrigger value="content">
            <Edit className="h-4 w-4 mr-2" />
            站点内容
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pages">
          <div className="space-y-6">
            {/* 新建页面 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  新建页面
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">页面标题</label>
                    <Input
                      value={newPage.title}
                      onChange={(e) => setNewPage({...newPage, title: e.target.value})}
                      placeholder="页面标题"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">URL路径</label>
                    <Input
                      value={newPage.slug}
                      onChange={(e) => setNewPage({...newPage, slug: e.target.value})}
                      placeholder="例如: about-us"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">页面内容</label>
                  <Textarea
                    value={newPage.content}
                    onChange={(e) => setNewPage({...newPage, content: e.target.value})}
                    placeholder="页面内容（支持HTML）"
                    rows={10}
                  />
                </div>
                <Button onClick={savePage} disabled={!newPage.title || !newPage.slug}>
                  创建页面
                </Button>
              </CardContent>
            </Card>

            {/* 页面列表 */}
            <div className="grid grid-cols-1 gap-4">
              {pages.map(page => (
                <Card key={page.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{page.title}</span>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(`/${page.slug}`, '_blank')}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingPage(page)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deletePage(page.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardTitle>
                    <CardDescription>
                      路径: /{page.slug} | 更新时间: {new Date(page.updated_at).toLocaleString()}
                    </CardDescription>
                  </CardHeader>
                  {editingPage?.id === page.id && (
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">页面标题</label>
                          <Input
                            value={editingPage.title}
                            onChange={(e) => setEditingPage({...editingPage, title: e.target.value})}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">URL路径</label>
                          <Input
                            value={editingPage.slug}
                            onChange={(e) => setEditingPage({...editingPage, slug: e.target.value})}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">页面内容</label>
                        <Textarea
                          value={editingPage.content}
                          onChange={(e) => setEditingPage({...editingPage, content: e.target.value})}
                          rows={10}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={savePage}>
                          保存修改
                        </Button>
                        <Button variant="outline" onClick={() => setEditingPage(null)}>
                          取消
                        </Button>
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="content">
          <div className="space-y-6">
            {/* 新建内容 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  新建站点内容
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">内容键名</label>
                    <Input
                      value={newContent.key}
                      onChange={(e) => setNewContent({...newContent, key: e.target.value})}
                      placeholder="例如: hero_title"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">内容类型</label>
                    <select
                      value={newContent.type}
                      onChange={(e) => setNewContent({...newContent, type: e.target.value})}
                      className="w-full p-2 border rounded"
                    >
                      <option value="text">文本</option>
                      <option value="html">HTML</option>
                      <option value="markdown">Markdown</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">所属部分</label>
                    <Input
                      value={newContent.section}
                      onChange={(e) => setNewContent({...newContent, section: e.target.value})}
                      placeholder="例如: home, about"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">内容</label>
                  <Textarea
                    value={newContent.content}
                    onChange={(e) => setNewContent({...newContent, content: e.target.value})}
                    placeholder="内容文本"
                    rows={6}
                  />
                </div>
                <Button onClick={saveSiteContent} disabled={!newContent.key}>
                  创建内容
                </Button>
              </CardContent>
            </Card>

            {/* 内容列表 */}
            <div className="grid grid-cols-1 gap-4">
              {siteContent.map(content => (
                <Card key={content.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{content.key}</span>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingContent(content)}
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
                      类型: {content.type} | 部分: {content.section} | 更新时间: {new Date(content.updated_at).toLocaleString()}
                    </CardDescription>
                  </CardHeader>
                  {editingContent?.id === content.id && (
                    <CardContent className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">内容</label>
                        <Textarea
                          value={editingContent.content}
                          onChange={(e) => setEditingContent({...editingContent, content: e.target.value})}
                          rows={8}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={saveSiteContent}>
                          保存修改
                        </Button>
                        <Button variant="outline" onClick={() => setEditingContent(null)}>
                          取消
                        </Button>
                      </div>
                    </CardContent>
                  )}
                  {editingContent?.id !== content.id && (
                    <CardContent>
                      <p className="text-sm text-gray-600 truncate">{content.content}</p>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};