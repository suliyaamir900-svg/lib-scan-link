import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Shield, Library, Users, CalendarDays, Loader2, AlertCircle } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function SuperAdmin() {
  const { t } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);
  const [libraries, setLibraries] = useState<any[]>([]);
  const [entryCounts, setEntryCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const checkRole = async () => {
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'super_admin')
        .maybeSingle();
      setIsAdmin(!!data);
      setChecking(false);
    };
    checkRole();
  }, [user]);

  useEffect(() => {
    if (!isAdmin || checking) return;
    const fetchData = async () => {
      // Super admin can see all libraries - but needs special RLS
      // For now showing user's own library data
      const { data: libs } = await supabase.from('libraries').select('*').order('created_at', { ascending: false });
      setLibraries(libs || []);

      // Get entry counts per library
      if (libs && libs.length > 0) {
        const counts: Record<string, number> = {};
        for (const lib of libs) {
          const { count } = await supabase
            .from('student_entries')
            .select('*', { count: 'exact', head: true })
            .eq('library_id', lib.id);
          counts[lib.id] = count || 0;
        }
        setEntryCounts(counts);
      }
      setLoading(false);
    };
    fetchData();
  }, [isAdmin, checking]);

  if (authLoading || checking) return null;
  if (!user) return <Navigate to="/login" />;

  if (!isAdmin) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-20">
          <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <h2 className="text-xl font-bold mb-2">Access Denied / एक्सेस अस्वीकृत</h2>
          <p className="text-muted-foreground text-sm">You don't have super admin access. / आपको सुपर एडमिन एक्सेस नहीं है।</p>
        </div>
      </DashboardLayout>
    );
  }

  const totalEntries = Object.values(entryCounts).reduce((a, b) => a + b, 0);

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Shield className="h-6 w-6 text-primary" />
        {t('nav.super_admin')}
      </h1>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <Card className="shadow-card">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl gradient-primary flex items-center justify-center">
                  <Library className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{libraries.length}</p>
                  <p className="text-sm text-muted-foreground">Total Libraries / कुल लाइब्रेरी</p>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-card">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl gradient-accent flex items-center justify-center">
                  <Users className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalEntries}</p>
                  <p className="text-sm text-muted-foreground">Total Entries / कुल एंट्री</p>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-card">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl gradient-success flex items-center justify-center">
                  <CalendarDays className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{new Date().toLocaleDateString()}</p>
                  <p className="text-sm text-muted-foreground">Today / आज</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Libraries Table */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-lg">All Libraries / सभी लाइब्रेरी</CardTitle>
              <CardDescription>Overview of all registered libraries / सभी पंजीकृत लाइब्रेरी का अवलोकन</CardDescription>
            </CardHeader>
            <CardContent>
              {libraries.length === 0 ? (
                <p className="text-center text-muted-foreground py-10">No libraries registered yet / अभी कोई लाइब्रेरी नहीं</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>#</TableHead>
                        <TableHead>Library / लाइब्रेरी</TableHead>
                        <TableHead>College / कॉलेज</TableHead>
                        <TableHead>Admin / एडमिन</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Entries / एंट्री</TableHead>
                        <TableHead>Registered / पंजीकृत</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {libraries.map((lib, i) => (
                        <TableRow key={lib.id}>
                          <TableCell>{i + 1}</TableCell>
                          <TableCell className="font-medium">{lib.name}</TableCell>
                          <TableCell>{lib.college_name}</TableCell>
                          <TableCell>{lib.admin_name}</TableCell>
                          <TableCell>{lib.email}</TableCell>
                          <TableCell>
                            <span className="px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary font-medium">
                              {entryCounts[lib.id] || 0}
                            </span>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">{new Date(lib.created_at).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </DashboardLayout>
  );
}
