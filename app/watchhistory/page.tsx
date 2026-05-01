"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy, deleteDoc, doc } from "firebase/firestore";
import useAuth from "@/lib/useAuth";
import ContentGrid from "@/components/ContentGrid";
import ComicContentGrid, { Comic } from "@/components/ComicContentGrid";
import { Loader2, Clock } from "lucide-react";

interface HistoryData {
  userId: string;
  slug: string;
  title?: string;
  poster?: string;
  lastEpisodeName?: string;
  lastEpisodeSlug?: string;
  type?: string;
  lastWatched: string;
  id: string;
}

export default function HistoryPage() {
  const { user, loading: authLoading } = useAuth();
  const [history, setHistory] = useState<any[]>([]);
  const [comicHistory, setComicHistory] = useState<Comic[]>([]);
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
      const data: HistoryData[] = querySnapshot.docs.map(doc => ({
        ...(doc.data() as Omit<HistoryData, 'id'>),
        id: doc.id
      }));
      const animeHist = data.filter(item => !item.type || item.type !== "comic");
      const comicHist = data.filter(item => item.type === "comic").map(item => ({
        title: item.title || "Comic",
        link: `https://komiku.org/manga/${item.slug}/`, // Reconstruct link
        thumb: item.poster,
        image: item.poster,
        genre: "",
        latest_chapter: item.lastEpisodeName,
        info: "",
        chapter: item.lastEpisodeName,
        type: "Comic",
        update: "",
      }));
      setHistory(animeHist);
      setComicHistory(comicHist);
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
  const handleDeleteHistory = async (slug: string, type?: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, "history", `${user.uid}_${slug}`))
      if (type === "comic") {
        setComicHistory(prev => prev.filter(item => {
          const itemSlug = item.link.split('/').filter(Boolean).pop()
          return itemSlug !== slug
        }))
      } else {
        setHistory(prev => prev.filter(item => item.slug !== slug));
      }
    } catch (error) {
      console.error("Gagal menghapus history:", error);
    }
  };

  if (authLoading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-indigo-600" /></div>;

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-center">
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
        <p className="text-slate-600 dark:text-slate-400">The anime and comic you just watched</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="animate-spin text-indigo-600" /></div>
      ) : (history.length > 0 || comicHistory.length > 0) ? (
        <>
          {history.length > 0 && (
            <div className="mb-12">
              <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">Anime History</h2>
              <ContentGrid
                animes={history}
                onLike={(slug) => handleDeleteHistory(slug)} // Kita gunakan tombol heart untuk hapus history sementara
                likedAnimes={history.map(h => h.slug)}
                type="ongoing"
                hasMore={false}
                variant="history"
              />
            </div>
          )}
          {comicHistory.length > 0 && (
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">Comic History</h2>
              <ComicContentGrid
                comics={comicHistory}
                onLike={(slug) => handleDeleteHistory(slug, "comic")}
                likedComics={comicHistory.map((item) => item.link.split('/').filter(Boolean).pop() || '')}
                loading={false}
                hasMore={false}
                variant="history"
              />
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-center">
          <img src="NotFound.png" alt="Not Found" className="w-84" />
          <p className="text-slate-600 dark:text-slate-400">Watch history is still empty.</p>
        </div>
      )}
    </div>
  );
}