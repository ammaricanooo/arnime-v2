"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy, deleteDoc, doc } from "firebase/firestore";
import useAuth from "@/lib/useAuth";
import ContentGrid from "@/components/ContentGrid";
import { Loader2, Clock } from "lucide-react";

export default function HistoryPage() {
  const { user, loading: authLoading } = useAuth();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Query history berdasarkan userId dan urutkan dari yang terbaru
      const q = query(
        collection(db, "history"), 
        where("userId", "==", user.uid),
        orderBy("lastWatched", "desc")
      );
      
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      }));
      setHistory(data);
    } catch (error) {
      console.error("Error fetching history:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      fetchHistory();
    }
  }, [user, authLoading]);

  // Fungsi hapus satu item history
  const handleDeleteHistory = async (slug: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, "history", `${user.uid}_${slug}`));
      setHistory(prev => prev.filter(item => item.slug !== slug));
    } catch (error) {
      console.error("Gagal menghapus history:", error);
    }
  };

  if (authLoading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-indigo-600" /></div>;

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">Watch History</h1>
          <img src="Forbidden.png" alt="Forbidden" className="w-84" />
          <p className="text-slate-600 dark:text-slate-400">Please login first to see your watch history collection.</p>
        </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">Watch History</h1>
        <p className="text-slate-600 dark:text-slate-400">The anime you just watched</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="animate-spin text-indigo-600" /></div>
      ) : history.length > 0 ? (
        <ContentGrid
          animes={history}
          onLike={handleDeleteHistory} // Kita gunakan tombol heart untuk hapus history sementara
          likedAnimes={history.map(h => h.slug)}
          type="ongoing"
          hasMore={false}
          variant="history"
        />
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700">
          <img src="NotFound.png" alt="Not Found" className="w-84" />
          <p className="text-slate-600 dark:text-slate-400">Watch history is still empty.</p>
        </div>
      )}
    </div>
  );
}