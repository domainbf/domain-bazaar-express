import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Edit, Plus, Trash2, Home, Globe, FileText } from 'lucide-react';

interface HomeSection {
  id: string;
  section_key: string;
  title: string;
  content: string;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface HeroContent {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  cta_text: string;
  cta_url: string;
  background_image?: string;
  is_active: boolean;
}

export const HomeContentManagement = () => {
  const [sections, setSections] = useState<HomeSection[]>([]);
  const [heroContent, setHeroContent] = useState<HeroContent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingSection, setEditingSection] = useState<HomeSection | null>(null);
  const [editingHero, setEditingHero] = useState<HeroContent | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isHeroDialogOpen, setIsHeroDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newSectionForm, setNewSectionForm] = useState({
    section_key: '',
    title: '',
    content: '',
    order_index: 0,
    is_active: true
  });

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    setIsLoading(true);
    try {
      // 加载首页内容区块
      const { data: sectionsData, error: sectionsError } = await supabase
        .from('site_content')
        .select('*')
        .eq('section', 'homepage')
        .order('created_at', { ascending: false });

      if (sectionsError) throw sectionsError;

      // 转换数据格式
      const formattedSections: HomeSection[] = (sectionsData || []).map(item => ({
        id: item.id,
        section_key: item.key,
        title: item.key,
        content: item.content || '',
        order_index: 0,
        is_active: true,
        created_at: item.created_at,
        updated_at: item.updated_at
      }));

      setSections(formattedSections);
      
      // 模拟Hero内容（可以后续从数据库加载）
      setHeroContent([
        {
          id: '1',
          title: 'NIC.BN 域名交易平台',
          subtitle: '专业的域名买卖与评估服务',
          description: '发现优质域名，实现价值最大化',
          cta_text: '开始探索',
          cta_url: '/marketplace',
          is_active: true
        }
      ]);

    } catch (error: any) {
      console.error('Error loading content:', error);
      toast.error('加载内容失败: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSection = async () => {
    if (!editingSection) return;
    
    try {
      const { error } = await supabase
        .from('site_content')
        .update({
          key: editingSection.section_key,
          content: editingSection.content,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingSection.id);
      
      if (error) throw error;
      
      setSections(sections.map(section => 
        section.id === editingSection.id ? editingSection : section
      ));
      toast.success('内容更新成功');
      setIsEditDialogOpen(false);
      setEditingSection(null);
    } catch (error: any) {
      console.error('Error updating section:', error);
      toast.error('更新失败: ' + error.message);
    }
  };

  const handleCreateSection = async () => {
    try {
      const { data, error } = await supabase
        .from('site_content')
        .insert([{
          key: newSectionForm.section_key,
          content: newSectionForm.content,
          type: 'text',
          section: 'homepage'
        }])
        .select();
      
      if (error) throw error;
      
      if (data && data[0]) {
        const newSection: HomeSection = {
          id: data[0].id,
          section_key: data[0].key,
          title: data[0].key,
          content: data[0].content || '',
          order_index: 0,
          is_active: true,
          created_at: data[0].created_at,
          updated_at: data[0].updated_at
        };
        setSections([newSection, ...sections]);
        toast.success('内容创建成功');
        setIsCreateDialogOpen(false);
        setNewSectionForm({ section_key: '', title: '', content: '', order_index: 0, is_active: true });
      }
    } catch (error: any) {
      console.error('Error creating section:', error);
      toast.error('创建失败: ' + error.message);
    }
  };

  const handleDeleteSection = async (sectionId: string) => {
    if (!confirm('确定要删除此内容区块吗？')) return;
    
    try {
      const { error } = await supabase
        .from('site_content')
        .delete()
        .eq('id', sectionId);
      
      if (error) throw error;
      
      setSections(sections.filter(section => section.id !== sectionId));
      toast.success('内容删除成功');
    } catch (error: any) {
      console.error('Error deleting section:', error);
      toast.error('删除失败: ' + error.message);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">首页内容管理</h2>
          <p className="text-muted-foreground">管理首页展示内容、区块和横幅</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                新建内容区块
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>创建内容区块</DialogTitle>
                <DialogDescription>为首页添加新的内容区块</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">区块标识</label>
                  <Input
                    value={newSectionForm.section_key}
                    onChange={(e) => setNewSectionForm({...newSectionForm, section_key: e.target.value})}
                    placeholder="section-key"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">内容</label>
                  <Textarea
                    value={newSectionForm.content}
                    onChange={(e) => setNewSectionForm({...newSectionForm, content: e.target.value})}
                    placeholder="区块内容"
                    rows={4}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  取消
                </Button>
                <Button onClick={handleCreateSection}>创建区块</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button variant="outline" onClick={loadContent}>
            刷新数据
          </Button>
        </div>
      </div>

      <Tabs defaultValue="sections" className="w-full">
        <TabsList>
          <TabsTrigger value="sections">
            <FileText className="h-4 w-4 mr-2" />
            内容区块
          </TabsTrigger>
          <TabsTrigger value="hero">
            <Home className="h-4 w-4 mr-2" />
            首页横幅
          </TabsTrigger>
          <TabsTrigger value="navigation">
            <Globe className="h-4 w-4 mr-2" />
            导航管理
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="sections" className="space-y-4">
          <div className="grid gap-4">
            {sections.map((section) => (
              <Card key={section.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {section.section_key}
                        <Badge variant={section.is_active ? "default" : "secondary"}>
                          {section.is_active ? "活跃" : "禁用"}
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        更新时间: {new Date(section.updated_at).toLocaleString()}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingSection(section);
                          setIsEditDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteSection(section.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {section.content}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="hero" className="space-y-4">
          <div className="grid gap-4">
            {heroContent.map((hero) => (
              <Card key={hero.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{hero.title}</CardTitle>
                      <CardDescription>{hero.subtitle}</CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingHero(hero);
                        setIsHeroDialogOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2">{hero.description}</p>
                  <div className="flex gap-4 text-sm">
                    <span>按钮文字: {hero.cta_text}</span>
                    <span>链接: {hero.cta_url}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="navigation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>导航菜单管理</CardTitle>
              <CardDescription>管理网站主导航菜单项</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">导航管理功能开发中...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 编辑内容区块对话框 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>编辑内容区块</DialogTitle>
            <DialogDescription>修改区块内容和设置</DialogDescription>
          </DialogHeader>
          {editingSection && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">区块标识</label>
                <Input
                  value={editingSection.section_key}
                  onChange={(e) => setEditingSection({...editingSection, section_key: e.target.value})}
                />
              </div>
              <div>
                <label className="text-sm font-medium">内容</label>
                <Textarea
                  value={editingSection.content}
                  onChange={(e) => setEditingSection({...editingSection, content: e.target.value})}
                  rows={6}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSaveSection}>保存更改</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 编辑Hero内容对话框 */}
      <Dialog open={isHeroDialogOpen} onOpenChange={setIsHeroDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>编辑首页横幅</DialogTitle>
            <DialogDescription>修改首页主要展示内容</DialogDescription>
          </DialogHeader>
          {editingHero && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">标题</label>
                <Input
                  value={editingHero.title}
                  onChange={(e) => setEditingHero({...editingHero, title: e.target.value})}
                />
              </div>
              <div>
                <label className="text-sm font-medium">副标题</label>
                <Input
                  value={editingHero.subtitle}
                  onChange={(e) => setEditingHero({...editingHero, subtitle: e.target.value})}
                />
              </div>
              <div>
                <label className="text-sm font-medium">描述</label>
                <Textarea
                  value={editingHero.description}
                  onChange={(e) => setEditingHero({...editingHero, description: e.target.value})}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">按钮文字</label>
                  <Input
                    value={editingHero.cta_text}
                    onChange={(e) => setEditingHero({...editingHero, cta_text: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">按钮链接</label>
                  <Input
                    value={editingHero.cta_url}
                    onChange={(e) => setEditingHero({...editingHero, cta_url: e.target.value})}
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsHeroDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={() => setIsHeroDialogOpen(false)}>保存更改</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};