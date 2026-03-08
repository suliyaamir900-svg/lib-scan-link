import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { Search, Plus, Edit, Trash2, Loader2, BookOpen, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

const PAGE_SIZE = 15;

const emptyBook = {
  title: '', author: '', publisher: '', edition: '', isbn: '',
  category_name: '', total_copies: 1, available_copies: 1,
  rack_number: '', row_number: '', shelf_number: '',
};

export default function Books() {
  const { user, loading: authLoading } = useAuth();
  const [library, setLibrary] = useState<any>(null);
  const [books, setBooks] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editBook, setEditBook] = useState<any>(null);
  const [form, setForm] = useState({ ...emptyBook });
  const [saving, setSaving] = useState(false);
  const [catDialogOpen, setCatDialogOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const { data: lib } = await supabase.from('libraries').select('*').eq('user_id', user.id).maybeSingle();
      setLibrary(lib);
      if (lib) {
        const [booksRes, catsRes] = await Promise.all([
          (supabase as any).from('books').select('*').eq('library_id', lib.id).order('created_at', { ascending: false }),
          (supabase as any).from('book_categories').select('*').eq('library_id', lib.id).order('name'),
        ]);
        setBooks(booksRes.data || []);
        setCategories(catsRes.data || []);
      }
      setLoading(false);
    };
    fetchData();
  }, [user]);

  if (authLoading) return null;
  if (!user) return <Navigate to="/login" />;

  const filtered = books.filter(b => {
    const q = search.toLowerCase();
    const matchesSearch = !q || b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q) || (b.isbn || '').toLowerCase().includes(q);
    const matchesCat = catFilter === 'all' || b.category_name === catFilter;
    return matchesSearch && matchesCat;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageBooks = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const uniqueCats = [...new Set(books.map(b => b.category_name).filter(Boolean))].sort();

  const openAdd = () => {
    setEditBook(null);
    setForm({ ...emptyBook });
    setDialogOpen(true);
  };

  const openEdit = (book: any) => {
    setEditBook(book);
    setForm({
      title: book.title, author: book.author, publisher: book.publisher || '',
      edition: book.edition || '', isbn: book.isbn || '', category_name: book.category_name || '',
      total_copies: book.total_copies, available_copies: book.available_copies,
      rack_number: book.rack_number || '', row_number: book.row_number || '', shelf_number: book.shelf_number || '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error('Book title is required'); return; }
    if (!library) return;
    setSaving(true);

    if (editBook) {
      const { error } = await (supabase as any).from('books').update({
        ...form, updated_at: new Date().toISOString(),
      }).eq('id', editBook.id);
      if (error) { toast.error('Failed to update'); console.error(error); }
      else {
        setBooks(prev => prev.map(b => b.id === editBook.id ? { ...b, ...form } : b));
        toast.success('Book updated / किताब अपडेट हुई');
      }
    } else {
      const { data, error } = await (supabase as any).from('books').insert({
        library_id: library.id, ...form,
      }).select().single();
      if (error) { toast.error('Failed to add'); console.error(error); }
      else {
        setBooks(prev => [data, ...prev]);
        toast.success('Book added / किताब जोड़ी गई');
      }
    }
    setSaving(false);
    setDialogOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this book?')) return;
    const { error } = await (supabase as any).from('books').delete().eq('id', id);
    if (error) toast.error('Failed');
    else {
      setBooks(prev => prev.filter(b => b.id !== id));
      toast.success('Deleted');
    }
  };

  const handleAddCategory = async () => {
    if (!newCatName.trim() || !library) return;
    const { data, error } = await (supabase as any).from('book_categories').insert({
      library_id: library.id, name: newCatName.trim(),
    }).select().single();
    if (error) toast.error('Failed to add category');
    else {
      setCategories(prev => [...prev, data]);
      toast.success('Category added');
      setNewCatName('');
      setCatDialogOpen(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-primary" />
          Books / किताबें
        </h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setCatDialogOpen(true)}>+ Category</Button>
          <Button size="sm" onClick={openAdd} className="gradient-primary text-primary-foreground gap-1">
            <Plus className="h-4 w-4" /> Add Book
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="shadow-card mb-4">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search title, author, ISBN" className="pl-10" />
            </div>
            <Select value={catFilter} onValueChange={setCatFilter}>
              <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {uniqueCats.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground self-center">{filtered.length} books</p>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {[
          { label: 'Total Books', value: books.length },
          { label: 'Total Copies', value: books.reduce((s, b) => s + b.total_copies, 0) },
          { label: 'Available', value: books.reduce((s, b) => s + b.available_copies, 0) },
          { label: 'Categories', value: uniqueCats.length },
        ].map((s, i) => (
          <Card key={i} className="shadow-card">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-primary">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table */}
      <Card className="shadow-card">
        {loading ? (
          <CardContent className="p-10 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></CardContent>
        ) : filtered.length === 0 ? (
          <CardContent className="p-10 text-center text-muted-foreground">
            No books found. Click "Add Book" to start. / कोई किताब नहीं मिली।
          </CardContent>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title / शीर्षक</TableHead>
                    <TableHead>Author / लेखक</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>ISBN</TableHead>
                    <TableHead className="text-center">Copies</TableHead>
                    <TableHead className="text-center">Available</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead className="w-20"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageBooks.map(book => (
                    <TableRow key={book.id}>
                      <TableCell className="font-medium">{book.title}</TableCell>
                      <TableCell>{book.author}</TableCell>
                      <TableCell>
                        {book.category_name && (
                          <span className="px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary font-medium">{book.category_name}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">{book.isbn || '-'}</TableCell>
                      <TableCell className="text-center">{book.total_copies}</TableCell>
                      <TableCell className="text-center">
                        <span className={`font-bold ${book.available_copies > 0 ? 'text-green-600' : 'text-destructive'}`}>
                          {book.available_copies}
                        </span>
                      </TableCell>
                      <TableCell>
                        {(book.rack_number || book.row_number || book.shelf_number) ? (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {[book.rack_number && `Rack ${book.rack_number}`, book.row_number && `Row ${book.row_number}`, book.shelf_number && `Shelf ${book.shelf_number}`].filter(Boolean).join(', ')}
                          </span>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(book)}><Edit className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(book.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t">
                <p className="text-sm text-muted-foreground">Page {page + 1} of {totalPages}</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}><ChevronLeft className="h-4 w-4" /></Button>
                  <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}><ChevronRight className="h-4 w-4" /></Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Add/Edit Book Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editBook ? 'Edit Book / किताब संपादित करें' : 'Add Book / किताब जोड़ें'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Book Title / शीर्षक *</Label>
              <Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Data Structures" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Author / लेखक</Label>
                <Input value={form.author} onChange={e => setForm(p => ({ ...p, author: e.target.value }))} placeholder="Author name" />
              </div>
              <div className="space-y-2">
                <Label>Publisher / प्रकाशक</Label>
                <Input value={form.publisher} onChange={e => setForm(p => ({ ...p, publisher: e.target.value }))} placeholder="Publisher" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Edition / संस्करण</Label>
                <Input value={form.edition} onChange={e => setForm(p => ({ ...p, edition: e.target.value }))} placeholder="e.g. 5th" />
              </div>
              <div className="space-y-2">
                <Label>ISBN</Label>
                <Input value={form.isbn} onChange={e => setForm(p => ({ ...p, isbn: e.target.value }))} placeholder="ISBN number" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Category / श्रेणी</Label>
              <Select value={form.category_name} onValueChange={v => setForm(p => ({ ...p, category_name: v }))}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {categories.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                  <SelectItem value="">None</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Total Copies / कुल प्रतियां</Label>
                <Input type="number" min={1} value={form.total_copies} onChange={e => setForm(p => ({ ...p, total_copies: parseInt(e.target.value) || 1 }))} />
              </div>
              <div className="space-y-2">
                <Label>Available / उपलब्ध</Label>
                <Input type="number" min={0} value={form.available_copies} onChange={e => setForm(p => ({ ...p, available_copies: parseInt(e.target.value) || 0 }))} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Rack No.</Label>
                <Input value={form.rack_number} onChange={e => setForm(p => ({ ...p, rack_number: e.target.value }))} placeholder="A" />
              </div>
              <div className="space-y-2">
                <Label>Row No.</Label>
                <Input value={form.row_number} onChange={e => setForm(p => ({ ...p, row_number: e.target.value }))} placeholder="3" />
              </div>
              <div className="space-y-2">
                <Label>Shelf No.</Label>
                <Input value={form.shelf_number} onChange={e => setForm(p => ({ ...p, shelf_number: e.target.value }))} placeholder="2" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="gradient-primary text-primary-foreground">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editBook ? 'Update' : 'Add Book'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Category Dialog */}
      <Dialog open={catDialogOpen} onOpenChange={setCatDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Category / श्रेणी जोड़ें</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="e.g. Anatomy, Physiology, Computer Science" onKeyDown={e => e.key === 'Enter' && handleAddCategory()} />
            {categories.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {categories.map(c => (
                  <span key={c.id} className="px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary">{c.name}</span>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCatDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddCategory} className="gradient-primary text-primary-foreground">Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
