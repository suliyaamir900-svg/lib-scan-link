import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface LandingStats {
  libraries: number;
  students: number;
  entries: number;
  books: number;
  avgRating: number;
  reviewCount: number;
  loaded: boolean;
}

export interface PlatformReview {
  id: string;
  reviewer_name: string;
  reviewer_role: string | null;
  rating: number;
  message: string;
  created_at: string;
}

const fallback: LandingStats = {
  libraries: 0, students: 0, entries: 0, books: 0,
  avgRating: 0, reviewCount: 0, loaded: false,
};

export function useLandingStats() {
  const [stats, setStats] = useState<LandingStats>(fallback);
  const [reviews, setReviews] = useState<PlatformReview[]>([]);

  const load = async () => {
    const [libs, students, entries, books, reviewsRes] = await Promise.all([
      supabase.from('libraries').select('id', { count: 'exact', head: true }),
      (supabase as any).from('student_profiles').select('id', { count: 'exact', head: true }),
      supabase.from('student_entries').select('id', { count: 'exact', head: true }),
      supabase.from('books').select('id', { count: 'exact', head: true }),
      (supabase as any).from('platform_reviews')
        .select('id, reviewer_name, reviewer_role, rating, message, created_at')
        .eq('is_approved', true)
        .order('created_at', { ascending: false })
        .limit(12),
    ]);

    const list: PlatformReview[] = (reviewsRes.data as PlatformReview[]) || [];
    const avg = list.length > 0
      ? list.reduce((s, r) => s + r.rating, 0) / list.length
      : 0;

    setReviews(list);
    setStats({
      libraries: libs.count || 0,
      students: students.count || 0,
      entries: entries.count || 0,
      books: books.count || 0,
      avgRating: Math.round(avg * 10) / 10,
      reviewCount: list.length,
      loaded: true,
    });
  };

  useEffect(() => {
    load();
    // Realtime: refresh when a new review lands
    const channel = supabase
      .channel('platform-reviews-public')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'platform_reviews' }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  return { stats, reviews, refresh: load };
}
