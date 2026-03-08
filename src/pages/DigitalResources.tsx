import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { FileText, Plus, Loader2, Download, Trash2, BookOpen, Search } from 'lucide-react';
import { toast } from 'sonner';

export default function DigitalResources() {
  const { user, loading: authLoading } = useAuth();
  const [library, setLibrary] = useState<any>(null);
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ title: '', author: '', category: 'ebook', file_url: '', description: '' });

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const { data: lib } = await supabase.from('libraries').select('*').eq('user_id', user.id).maybeSingle();
      setLibrary(lib);
      if (lib) {
        const { data } = await (supabase as any).from('digital_resources').select('*').eq('library_id', lib.id).order('created_at', { ascending: false });
        setResources(data || []);
      }
      setLoading(false);
    };
    fetchData();
  }, [user]);

  if (authLoading) return null;
  if (!user) return <Navigate to="/login" />;

  const handleAdd = async () => {
    if (!form.title.trim() || !library) return;
    setSaving(true);
    const { data, error } = await (supabase as any).from('digital_resources').insert({
      library_id: library.id, ...form, title: form.title.trim(),
    }).select().single();
    if (!error) {
      setResources(prev => [data, ...prev]);
      toast.success('Resource added! / संसाधन जोड़ा गया!');
      setDialogOpen(false);
      setForm({ title: '', author: '', category: 'ebook', file_url: '', description: '' });
    } else toast.error('Failed');
    setSaving(false);
  };

  const deleteResource = async (id: string) => {
    await (supabase as any).from('digital_resources').delete().eq('id', id);
    setResources(prev => prev.filter(r => r.id !== id));
    toast.success('Deleted');
  };

  const filtered = resources.filter(r => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return r.title.toLowerCase().includes(q) || (r.author || '').toLowerCase().includes(q);
  });

  const catColors: Record<string, string> = {
    ebook: 'bg-primary/10 text-primary',
    journal: 'bg-accent/10 text-accent',
    research: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    magazine: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  };

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="h-6 w-6 text-primary" /> Digital Library / डिजिटल पुस्तकालय
        </h1>
        <Button size="sm" onClick={() => setDialogOpen(true)} className="gradient-primary text-primary-foreground gap-1">
          <Plus className="h-4 w-4" /> Add Resource
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {['ebook', 'journal', 'research', 'magazine'].map(cat => (
          <Card key={cat} className="shadow-card"><CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">{resources.filter(r => r.category === cat).length}</p>
            <p className="text-xs text-muted-foreground capitalize">{cat}s</p>
          </CardContent></Card>
        ))}
      </div>

      <Card className="shadow-card mb-4">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search resources..." className="pl-10" />
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        {loading ? (
          <CardContent className="p-10 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></CardContent>
        ) : filtered.length === 0 ? (
          <CardContent className="p-12 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold">No resources / कोई संसाधन नहीं</h3>
          </CardContent>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Downloads</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(r => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <p className="font-medium text-sm">{r.title}</p>
                      {r.description && <p className="text-xs text-muted-foreground">{r.description}</p>}
                    </TableCell>
                    <TableCell className="text-sm">{r.author || '-'}</TableCell>
                    <TableCell><Badge className={catColors[r.category] || catColors.ebook}>{r.category}</Badge></TableCell>
                    <TableCell className="text-sm">{r.download_count || 0}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {r.file_url && (
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => window.open(r.file_url, '_blank')}>
                            <Download className="h-3 w-3" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteResource(r.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Digital Resource / डिजिटल संसाधन जोड़ें</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Title *</Label><Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Author</Label><Input value={form.author} onChange={e => setForm(p => ({ ...p, author: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Category</Label>
                <select className="w-full h-10 px-3 rounded-md border bg-background text-sm" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                  <option value="ebook">E-Book</option><option value="journal">Journal</option>
                  <option value="research">Research Paper</option><option value="magazine">Magazine</option>
                </select>
              </div>
            </div>
            <div className="space-y-2"><Label>File URL / Link</Label><Input value={form.file_url} onChange={e => setForm(p => ({ ...p, file_url: e.target.value }))} placeholder="https://..." /></div>
            <div className="space-y-2"><Label>Description</Label><Input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={saving || !form.title.trim()} className="gradient-primary text-primary-foreground">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add / जोड़ें'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
