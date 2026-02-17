"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase"; // sesuaikan path
import { collection, query, where, getDocs, doc, deleteDoc } from "firebase/firestore";
import useAuth from "@/lib/useAuth"; // sesuaikan path
import ContentGrid from "@/components/ContentGrid";
import { Loader2, HeartOff } from "lucide-react";

export default function FavoritesPage() {
  const { user, loading: authLoading } = useAuth();
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Fungsi untuk mengambil data dari Firestore
  const fetchFavorites = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const q = query(collection(db, "bookmarks"), where("userId", "==", user.uid));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      }));
      setFavorites(data);
    } catch (error) {
      console.error("Error fetching favorites:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      fetchFavorites();
    }
  }, [user, authLoading]);

  // 2. Fungsi untuk handle "Unlike" di halaman favorit
  const handleUnlike = async (slug: string) => {
    if (!user) return;

    try {
      const docId = `${user.uid}_${slug}`;
      await deleteDoc(doc(db, "bookmarks", docId));
      
      // Update UI secara lokal
      setFavorites(prev => prev.filter(anime => anime.slug !== slug));
    } catch (error) {
      console.error("Gagal menghapus favorit:", error);
    }
  };

  // State: Loading Auth
  if (authLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  // State: Belum Login
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">My Favorites</h1>
          <img src="Forbidden.png" alt="Forbidden" className="w-84" />
          <p className="text-slate-600 dark:text-slate-400">Please login first to see your favorite collection.</p>
        </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">My Favorites</h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm md:text-base">
          You have {favorites.length} favorite anime
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
        </div>
      ) : favorites.length > 0 ? (
        <ContentGrid
          animes={favorites}
          onLike={handleUnlike}
          likedAnimes={favorites.map(f => f.slug)}
          type="ongoing" // Bisa disesuaikan
          hasMore={false}
        />
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700">
          <img src="NotFound.png" alt="Not Found" className="w-84" />
          <p className="text-slate-600 dark:text-slate-400">There is no anime that you like yet.</p>
        </div>
      )}
    </div>
  );
}