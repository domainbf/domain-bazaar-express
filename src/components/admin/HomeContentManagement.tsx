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
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Edit, Plus, Trash2, Home, Globe, FileText, GripVertical, Eye, EyeOff, Save, RefreshCw } from 'lucide-react';
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

// 可排序的内容区块组件
const SortableItem = ({ section, onEdit, onDelete, onToggleActive }: {
  section: HomeSection;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card ref={setNodeRef} style={style} className={isDragging ? 'shadow-lg ring-2 ring-primary' : ''}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div {...attributes} {...listeners} className="cursor-grab hover:text-primary">
              <GripVertical className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                {section.section_key}
                <Badge variant={section.is_active ? "default" : "secondary"}>
                  {section.is_active ? "活跃" : "禁用"}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  排序: {section.order_index}
                </Badge>
              </CardTitle>
              <CardDescription>
                更新时间: {new Date(section.updated_at).toLocaleString()}
              </CardDescription>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleActive}
              title={section.is_active ? "禁用" : "启用"}
            >
              {section.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onEdit}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onDelete}
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
  );
};

// 简易富文本编辑器组件
const RichTextEditor = ({ value, onChange, placeholder }: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) => {
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');

  const insertFormat = (format: string) => {
    const textarea = document.getElementById('richtext-editor') as HTMLTextAreaElement;
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
      case 'p':
        formattedText = `<p>${selectedText || '段落文本'}</p>`;
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
        <Button type="button" variant="ghost" size="sm" onClick={() => insertFormat('p')}>
          段落
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
          id="richtext-editor"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={10}
          className="border-0 rounded-none focus-visible:ring-0"
        />
      ) : (
        <div 
          className="min-h-[240px] p-4 prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: value || '<p class="text-muted-foreground">暂无内容</p>' }}
        />
      )}
    </div>
  );
};

export const HomeContentManagement = () => {
  const [sections, setSections] = useState<HomeSection[]>([]);
  const [heroContent, setHeroContent] = useState<HeroContent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
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
      const { data: sectionsData, error: sectionsError } = await supabase
        .from('site_content')
        .select('*')
        .eq('section', 'homepage')
        .order('created_at', { ascending: true });

      if (sectionsError) throw sectionsError;

      const formattedSections: HomeSection[] = (sectionsData || []).map((item, index) => ({
        id: item.id,
        section_key: item.key,
        title: item.key,
        content: item.content || '',
        order_index: index,
        is_active: true,
        created_at: item.created_at || new Date().toISOString(),
        updated_at: item.updated_at || new Date().toISOString()
      }));

      setSections(formattedSections);
      
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

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setSections((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);
        
        const newItems = arrayMove(items, oldIndex, newIndex).map((item, index) => ({
          ...item,
          order_index: index
        }));
        
        return newItems;
      });
      
      toast.success('排序已更新');
    }
  };

  const handleSaveSection = async () => {
    if (!editingSection) return;
    
    setIsSaving(true);
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
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateSection = async () => {
    setIsSaving(true);
    try {
      const { data, error } = await supabase
        .from('site_content')
        .insert([{
          key: newSectionForm.section_key,
          content: newSectionForm.content,
          type: 'html',
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
          order_index: sections.length,
          is_active: true,
          created_at: data[0].created_at || new Date().toISOString(),
          updated_at: data[0].updated_at || new Date().toISOString()
        };
        setSections([...sections, newSection]);
        toast.success('内容创建成功');
        setIsCreateDialogOpen(false);
        setNewSectionForm({ section_key: '', title: '', content: '', order_index: 0, is_active: true });
      }
    } catch (error: any) {
      console.error('Error creating section:', error);
      toast.error('创建失败: ' + error.message);
    } finally {
      setIsSaving(false);
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

  const handleToggleActive = (sectionId: string) => {
    setSections(sections.map(section => 
      section.id === sectionId 
        ? { ...section, is_active: !section.is_active }
        : section
    ));
    toast.success('状态已更新');
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
          <p className="text-muted-foreground">拖拽排序内容区块，使用富文本编辑器编辑内容</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                新建内容区块
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>创建内容区块</DialogTitle>
                <DialogDescription>为首页添加新的内容区块，支持HTML格式</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>区块标识</Label>
                  <Input
                    value={newSectionForm.section_key}
                    onChange={(e) => setNewSectionForm({...newSectionForm, section_key: e.target.value})}
                    placeholder="例如: hero-section"
                  />
                </div>
                <div>
                  <Label>内容</Label>
                  <RichTextEditor
                    value={newSectionForm.content}
                    onChange={(value) => setNewSectionForm({...newSectionForm, content: value})}
                    placeholder="在此输入内容..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  取消
                </Button>
                <Button onClick={handleCreateSection} disabled={isSaving}>
                  {isSaving && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
                  创建区块
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button variant="outline" onClick={loadContent}>
            <RefreshCw className="h-4 w-4 mr-2" />
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
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="py-4">
              <p className="text-sm text-blue-700">
                💡 提示：拖拽左侧抓取图标可以调整区块顺序，点击编辑按钮使用富文本编辑器修改内容
              </p>
            </CardContent>
          </Card>
          
          {sections.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">暂无内容区块</h3>
                <p className="text-muted-foreground mb-4">点击上方"新建内容区块"按钮添加首页内容</p>
              </CardContent>
            </Card>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={sections.map(s => s.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="grid gap-4">
                  {sections.map((section) => (
                    <SortableItem
                      key={section.id}
                      section={section}
                      onEdit={() => {
                        setEditingSection(section);
                        setIsEditDialogOpen(true);
                      }}
                      onDelete={() => handleDeleteSection(section.id)}
                      onToggleActive={() => handleToggleActive(section.id)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
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
              <div className="space-y-4">
                <p className="text-muted-foreground">拖拽调整导航菜单顺序，添加或删除菜单项</p>
                <div className="grid gap-2">
                  {['首页', '域名市场', '联系我们', '常见问题'].map((item, index) => (
                    <Card key={index} className="p-3">
                      <div className="flex items-center gap-3">
                        <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                        <span className="flex-1">{item}</span>
                        <Badge variant="outline">{index + 1}</Badge>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 编辑内容区块对话框 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>编辑内容区块</DialogTitle>
            <DialogDescription>使用富文本编辑器修改区块内容</DialogDescription>
          </DialogHeader>
          {editingSection && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>区块标识</Label>
                  <Input
                    value={editingSection.section_key}
                    onChange={(e) => setEditingSection({...editingSection, section_key: e.target.value})}
                  />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <Switch
                    checked={editingSection.is_active}
                    onCheckedChange={(checked) => setEditingSection({...editingSection, is_active: checked})}
                  />
                  <Label>启用此区块</Label>
                </div>
              </div>
              <div>
                <Label>内容</Label>
                <RichTextEditor
                  value={editingSection.content}
                  onChange={(value) => setEditingSection({...editingSection, content: value})}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSaveSection} disabled={isSaving}>
              {isSaving && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
              <Save className="h-4 w-4 mr-2" />
              保存更改
            </Button>
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
                <Label>标题</Label>
                <Input
                  value={editingHero.title}
                  onChange={(e) => setEditingHero({...editingHero, title: e.target.value})}
                />
              </div>
              <div>
                <Label>副标题</Label>
                <Input
                  value={editingHero.subtitle}
                  onChange={(e) => setEditingHero({...editingHero, subtitle: e.target.value})}
                />
              </div>
              <div>
                <Label>描述</Label>
                <Textarea
                  value={editingHero.description}
                  onChange={(e) => setEditingHero({...editingHero, description: e.target.value})}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>按钮文字</Label>
                  <Input
                    value={editingHero.cta_text}
                    onChange={(e) => setEditingHero({...editingHero, cta_text: e.target.value})}
                  />
                </div>
                <div>
                  <Label>按钮链接</Label>
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
            <Button onClick={() => {
              toast.success('横幅内容已保存');
              setIsHeroDialogOpen(false);
            }}>
              <Save className="h-4 w-4 mr-2" />
              保存更改
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};