import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { Search, Plus, Edit, Trash2, Loader2, BookOpen, MapPin, ChevronLeft, ChevronRight, Package, Tag, Copy, CheckCircle, Upload, Download, AlertTriangle, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

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
  const [viewBook, setViewBook] = useState<any>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importData, setImportData] = useState<any[]>([]);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const { data: lib } = await supabase.from('libraries').select('*').eq('user_id', user.id).maybeSingle();
      setLibrary(lib);
      if (lib) {
        const [booksRes, catsRes] = await Promise.all([
          supabase.from('books').select('*').eq('library_id', lib.id).order('title', { ascending: true }),
          supabase.from('book_categories').select('*').eq('library_id', lib.id).order('name'),
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
    const matchesSearch = !q || b.title.toLowerCase().includes(q) || (b.author || '').toLowerCase().includes(q) || (b.isbn || '').toLowerCase().includes(q);
    const matchesCat = catFilter === 'all' || b.category_name === catFilter;
    return matchesSearch && matchesCat;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageBooks = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const uniqueCats = [...new Set(books.map(b => b.category_name).filter(Boolean))].sort();

  const openAdd = () => { setEditBook(null); setForm({ ...emptyBook }); setDialogOpen(true); };

  const openEdit = (book: any) => {
    setEditBook(book);
    setForm({
      title: book.title || '', author: book.author || '', publisher: book.publisher || '',
      edition: book.edition || '', isbn: book.isbn || '', category_name: book.category_name || '',
      total_copies: book.total_copies || 1, available_copies: book.available_copies ?? 1,
      rack_number: book.rack_number || '', row_number: book.row_number || '', shelf_number: book.shelf_number || '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error('किताब का शीर्षक ज़रूरी है / Book title required'); return; }
    if (!library) return;
    setSaving(true);
    try {
      if (editBook) {
        const { error } = await supabase.from('books').update({
          title: form.title.trim(), author: form.author.trim(), publisher: form.publisher.trim(),
          edition: form.edition.trim(), isbn: form.isbn.trim(), category_name: form.category_name || '',
          total_copies: form.total_copies, available_copies: form.available_copies,
          rack_number: form.rack_number.trim(), row_number: form.row_number.trim(), shelf_number: form.shelf_number.trim(),
          updated_at: new Date().toISOString(),
        }).eq('id', editBook.id);
        if (error) { toast.error(`Update failed: ${error.message}`); }
        else {
          setBooks(prev => prev.map(b => b.id === editBook.id ? { ...b, ...form, title: form.title.trim(), author: form.author.trim() } : b));
          toast.success('✅ किताब अपडेट हुई / Book updated');
          setDialogOpen(false);
        }
      } else {
        const { data, error } = await supabase.from('books').insert({
          library_id: library.id, title: form.title.trim(), author: form.author.trim(),
          publisher: form.publisher.trim(), edition: form.edition.trim(), isbn: form.isbn.trim(),
          category_name: form.category_name || '', total_copies: form.total_copies, available_copies: form.available_copies,
          rack_number: form.rack_number.trim(), row_number: form.row_number.trim(), shelf_number: form.shelf_number.trim(),
        }).select().single();
        if (error) { toast.error(`Add failed: ${error.message}`); }
        else {
          setBooks(prev => [data, ...prev]);
          toast.success('✅ किताब जोड़ी गई / Book added!');
          setDialogOpen(false);
          setForm({ ...emptyBook });
        }
      }
    } catch { toast.error('Something went wrong'); }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this book? / यह किताब हटाएं?')) return;
    const { error } = await supabase.from('books').delete().eq('id', id);
    if (error) toast.error(`Delete failed: ${error.message}`);
    else { setBooks(prev => prev.filter(b => b.id !== id)); toast.success('किताब हटाई गई / Book deleted'); }
  };

  const handleAddCategory = async () => {
    if (!newCatName.trim() || !library) return;
    const { data, error } = await supabase.from('book_categories').insert({
      library_id: library.id, name: newCatName.trim(),
    }).select().single();
    if (error) toast.error(error.message.includes('duplicate') ? 'Category already exists' : `Failed: ${error.message}`);
    else {
      setCategories(prev => [...prev, data].sort((a: any, b: any) => a.name.localeCompare(b.name)));
      toast.success('✅ श्रेणी जोड़ी गई / Category added');
      setNewCatName('');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    const { error } = await supabase.from('book_categories').delete().eq('id', id);
    if (error) toast.error('Failed to delete');
    else { setCategories(prev => prev.filter(c => c.id !== id)); toast.success('Category deleted'); }
  };

  // Bulk Import
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const wb = XLSX.read(evt.target?.result, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws) as any[];
        if (data.length === 0) { toast.error('Excel file is empty'); return; }
        // Validate columns
        const required = ['title'];
        const hasTitle = data.every(row => row.title || row.Title || row['Book Title']);
        if (!hasTitle) { toast.error('Excel must have a "Title" or "Book Title" column'); return; }
        // Normalize
        const normalized = data.map(row => ({
          title: (row.title || row.Title || row['Book Title'] || '').toString().trim(),
          author: (row.author || row.Author || '').toString().trim(),
          isbn: (row.isbn || row.ISBN || '').toString().trim(),
          category_name: (row.category || row.Category || row.category_name || '').toString().trim(),
          publisher: (row.publisher || row.Publisher || '').toString().trim(),
          edition: (row.edition || row.Edition || '').toString().trim(),
          rack_number: (row.rack || row.Rack || row.rack_number || row['Rack Number'] || '').toString().trim(),
          row_number: (row.row || row.Row || row.row_number || row['Row Number'] || '').toString().trim(),
          shelf_number: (row.shelf || row.Shelf || row.shelf_number || row['Shelf Number'] || '').toString().trim(),
          total_copies: parseInt(row.copies || row.Copies || row.total_copies || row['Total Copies'] || '1') || 1,
        })).filter(r => r.title);
        setImportData(normalized);
        setImportDialogOpen(true);
      } catch { toast.error('Invalid Excel file'); }
    };
    reader.readAsBinaryString(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleBulkImport = async () => {
    if (!library || importData.length === 0) return;
    setImporting(true);
    const rows = importData.map(r => ({
      library_id: library.id, title: r.title, author: r.author, isbn: r.isbn,
      category_name: r.category_name, publisher: r.publisher, edition: r.edition,
      rack_number: r.rack_number, row_number: r.row_number, shelf_number: r.shelf_number,
      total_copies: r.total_copies, available_copies: r.total_copies,
    }));
    const { data, error } = await supabase.from('books').insert(rows).select();
    if (error) { toast.error(`Import failed: ${error.message}`); }
    else {
      setBooks(prev => [...(data || []), ...prev]);
      toast.success(`✅ ${data?.length || 0} books imported! / किताबें इम्पोर्ट हो गईं!`);
      setImportDialogOpen(false);
      setImportData([]);
    }
    setImporting(false);
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      { Title: 'Data Structures', Author: 'R.S. Salaria', ISBN: '978-0-13-468599-1', Category: 'CSE', Publisher: 'S. Chand', Edition: '5th', Rack: 'A', Row: '1', Shelf: '3', Copies: 5 },
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Books');
    XLSX.writeFile(wb, 'book-import-template.xlsx');
    toast.success('Template downloaded!');
  };

  const totalCopies = books.reduce((s, b) => s + (b.total_copies || 0), 0);
  const availableCopies = books.reduce((s, b) => s + (b.available_copies || 0), 0);

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-primary" />
          Books / किताबें
        </h1>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => setCatDialogOpen(true)} className="gap-1">
            <Tag className="h-3.5 w-3.5" /> Categories
          </Button>
          <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="gap-1">
            <Upload className="h-3.5 w-3.5" /> Bulk Import
          </Button>
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFileUpload} />
          <Button size="sm" onClick={openAdd} className="gradient-primary text-primary-foreground gap-1 shadow-primary">
            <Plus className="h-4 w-4" /> Add Book / किताब जोड़ें
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Total Books / कुल किताबें', value: books.length, icon: BookOpen, gradient: 'gradient-primary' },
          { label: 'Total Copies / कुल प्रतियां', value: totalCopies, icon: Copy, gradient: 'gradient-accent' },
          { label: 'Available / उपलब्ध', value: availableCopies, icon: CheckCircle, gradient: 'gradient-success' },
          { label: 'Categories / श्रेणियां', value: categories.length, icon: Tag, gradient: 'gradient-warm' },
        ].map((s, i) => (
          <Card key={i} className="shadow-card border-border/50 overflow-hidden">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`h-10 w-10 rounded-lg ${s.gradient} flex items-center justify-center shrink-0`}>
                <s.icon className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <p className="text-xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="shadow-card mb-4">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} placeholder="Search title, author, ISBN / शीर्षक, लेखक, ISBN खोजें" className="pl-10" />
            </div>
            <Select value={catFilter} onValueChange={v => { setCatFilter(v); setPage(0); }}>
              <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories / सभी</SelectItem>
                {uniqueCats.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground self-center whitespace-nowrap">{filtered.length} books</p>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="shadow-card">
        {loading ? (
          <CardContent className="p-10 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></CardContent>
        ) : filtered.length === 0 ? (
          <CardContent className="p-12 text-center">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <BookOpen className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold mb-1">{books.length === 0 ? 'No books yet / अभी कोई किताब नहीं' : 'No matching books / कोई मिलान नहीं'}</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {books.length === 0 ? '"Add Book" पर क्लिक करें या Excel से import करें' : 'Try a different search / अलग खोज करें'}
            </p>
            {books.length === 0 && (
              <div className="flex gap-2 justify-center">
                <Button onClick={openAdd} className="gradient-primary text-primary-foreground gap-1">
                  <Plus className="h-4 w-4" /> Add Book
                </Button>
                <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="gap-1">
                  <Upload className="h-4 w-4" /> Import Excel
                </Button>
              </div>
            )}
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
                    <TableHead className="text-center">Copies</TableHead>
                    <TableHead className="text-center">Available</TableHead>
                    <TableHead>Location / स्थान</TableHead>
                    <TableHead className="w-24 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageBooks.map(book => (
                    <TableRow key={book.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setViewBook(book)}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{book.title}</p>
                          {book.isbn && <p className="text-xs text-muted-foreground">ISBN: {book.isbn}</p>}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{book.author || '-'}</TableCell>
                      <TableCell>
                        {book.category_name ? (
                          <span className="px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary font-medium">{book.category_name}</span>
                        ) : <span className="text-muted-foreground text-xs">—</span>}
                      </TableCell>
                      <TableCell className="text-center font-medium">{book.total_copies}</TableCell>
                      <TableCell className="text-center">
                        <span className={`inline-flex items-center justify-center h-7 w-7 rounded-full text-sm font-bold ${book.available_copies > 0 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-destructive/10 text-destructive'}`}>
                          {book.available_copies}
                        </span>
                      </TableCell>
                      <TableCell>
                        {(book.rack_number || book.row_number || book.shelf_number) ? (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3 shrink-0" />
                            {[book.rack_number && `R${book.rack_number}`, book.row_number && `Row ${book.row_number}`, book.shelf_number && `S${book.shelf_number}`].filter(Boolean).join(' · ')}
                          </span>
                        ) : <span className="text-muted-foreground text-xs">—</span>}
                      </TableCell>
                      <TableCell className="text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex gap-1 justify-end">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(book)} title="Edit"><Edit className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(book.id)} className="text-destructive hover:text-destructive" title="Delete"><Trash2 className="h-4 w-4" /></Button>
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

      {/* View Book Detail */}
      <Dialog open={!!viewBook} onOpenChange={() => setViewBook(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg">{viewBook?.title}</DialogTitle>
            <DialogDescription>{viewBook?.author && `by ${viewBook.author}`}</DialogDescription>
          </DialogHeader>
          {viewBook && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  ['Publisher / प्रकाशक', viewBook.publisher],
                  ['Edition / संस्करण', viewBook.edition],
                  ['ISBN', viewBook.isbn],
                  ['Category / श्रेणी', viewBook.category_name],
                  ['Total Copies / कुल', viewBook.total_copies],
                  ['Available / उपलब्ध', viewBook.available_copies],
                ].filter(([, v]) => v).map(([label, value], i) => (
                  <div key={i} className="p-2 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="font-medium">{value}</p>
                  </div>
                ))}
              </div>
              {(viewBook.rack_number || viewBook.row_number || viewBook.shelf_number) && (
                <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><MapPin className="h-3 w-3" /> Book Location / किताब का स्थान</p>
                  <div className="grid grid-cols-3 gap-2">
                    {viewBook.rack_number && <div className="text-center p-2 rounded bg-background"><p className="text-xs text-muted-foreground">Rack</p><p className="font-bold text-primary">{viewBook.rack_number}</p></div>}
                    {viewBook.row_number && <div className="text-center p-2 rounded bg-background"><p className="text-xs text-muted-foreground">Row</p><p className="font-bold text-primary">{viewBook.row_number}</p></div>}
                    {viewBook.shelf_number && <div className="text-center p-2 rounded bg-background"><p className="text-xs text-muted-foreground">Shelf</p><p className="font-bold text-primary">{viewBook.shelf_number}</p></div>}
                  </div>
                </div>
              )}
              <div className="flex gap-2">
                <Button className="flex-1" variant="outline" onClick={() => { setViewBook(null); openEdit(viewBook); }}>
                  <Edit className="h-4 w-4 mr-1" /> Edit / संपादित
                </Button>
                <Button className="flex-1 gradient-primary text-primary-foreground" onClick={() => setViewBook(null)}>Close / बंद</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add/Edit Book Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editBook ? '✏️ Edit Book / किताब संपादित करें' : '📚 Add New Book / नई किताब जोड़ें'}</DialogTitle>
            <DialogDescription>
              {editBook ? 'Update the book details' : 'Fill in details to add a new book'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="font-semibold">Book Title / शीर्षक <span className="text-destructive">*</span></Label>
              <Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Data Structures & Algorithms" className="h-11" autoFocus />
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
              <div className="flex items-center justify-between">
                <Label>Category / श्रेणी</Label>
                <Button type="button" variant="ghost" size="sm" className="text-xs h-6" onClick={() => setCatDialogOpen(true)}>+ New Category</Button>
              </div>
              <Select value={form.category_name || '__none'} onValueChange={v => setForm(p => ({ ...p, category_name: v === '__none' ? '' : v }))}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">No Category / कोई श्रेणी नहीं</SelectItem>
                  {categories.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="border rounded-lg p-4 bg-muted/30 space-y-3">
              <p className="text-sm font-semibold flex items-center gap-2"><Package className="h-4 w-4" /> Inventory / इन्वेंटरी</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Total Copies / कुल प्रतियां</Label>
                  <Input type="number" min={1} value={form.total_copies} onChange={e => {
                    const val = parseInt(e.target.value) || 1;
                    setForm(p => ({ ...p, total_copies: val, available_copies: editBook ? p.available_copies : val }));
                  }} />
                </div>
                <div className="space-y-2">
                  <Label>Available / उपलब्ध</Label>
                  <Input type="number" min={0} max={form.total_copies} value={form.available_copies} onChange={e => setForm(p => ({ ...p, available_copies: Math.min(parseInt(e.target.value) || 0, p.total_copies) }))} />
                </div>
              </div>
            </div>

            <div className="border rounded-lg p-4 bg-muted/30 space-y-3">
              <p className="text-sm font-semibold flex items-center gap-2"><MapPin className="h-4 w-4" /> Location / स्थान</p>
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
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel / रद्द</Button>
            <Button onClick={handleSave} disabled={saving} className="gradient-primary text-primary-foreground shadow-primary min-w-[120px]">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editBook ? '✅ Update Book' : '✅ Add Book'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Category Management */}
      <Dialog open={catDialogOpen} onOpenChange={setCatDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>📂 Categories / श्रेणियां</DialogTitle>
            <DialogDescription>Manage book categories</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="New category / नई श्रेणी" className="h-10" onKeyDown={e => e.key === 'Enter' && handleAddCategory()} />
              <Button onClick={handleAddCategory} disabled={!newCatName.trim()} className="gradient-primary text-primary-foreground h-10 px-4">Add</Button>
            </div>
            {categories.length > 0 ? (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {categories.map(c => (
                  <div key={c.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50 group">
                    <span className="text-sm font-medium">{c.name}</span>
                    <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 text-destructive" onClick={() => handleDeleteCategory(c.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-sm text-muted-foreground py-4">No categories yet</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Import Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-green-600" />
              Bulk Import / बल्क इम्पोर्ट
            </DialogTitle>
            <DialogDescription>{importData.length} books found in file / फ़ाइल में {importData.length} किताबें मिलीं</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Preview / पूर्वावलोकन</p>
              <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={downloadTemplate}>
                <Download className="h-3 w-3" /> Download Template
              </Button>
            </div>
            <div className="max-h-60 overflow-auto border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">#</TableHead>
                    <TableHead className="text-xs">Title</TableHead>
                    <TableHead className="text-xs">Author</TableHead>
                    <TableHead className="text-xs">Copies</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {importData.slice(0, 20).map((row, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-xs">{i + 1}</TableCell>
                      <TableCell className="text-xs font-medium">{row.title}</TableCell>
                      <TableCell className="text-xs">{row.author || '-'}</TableCell>
                      <TableCell className="text-xs">{row.total_copies}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {importData.length > 20 && (
                <p className="text-xs text-muted-foreground text-center py-2">...and {importData.length - 20} more</p>
              )}
            </div>
            {importData.some(r => !r.title) && (
              <div className="flex items-center gap-2 p-2 rounded bg-destructive/10 text-xs text-destructive">
                <AlertTriangle className="h-4 w-4" /> Some rows have missing titles and will be skipped
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setImportDialogOpen(false); setImportData([]); }}>Cancel / रद्द</Button>
            <Button onClick={handleBulkImport} disabled={importing} className="gradient-primary text-primary-foreground gap-1">
              {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              Import {importData.length} Books
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
