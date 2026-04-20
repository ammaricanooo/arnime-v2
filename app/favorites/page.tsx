"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, deleteDoc } from "firebase/firestore";
import useAuth from "@/lib/useAuth";
import ContentGrid from "@/components/ContentGrid";
import ComicContentGrid, { Comic } from "@/components/ComicContentGrid";
import { Loader2, HeartOff } from "lucide-react";

interface BookmarkData {
  userId: string;
  slug: string;
  title: string;
  poster: string;
  type?: string;
  createdAt: string;
  id: string;
}

export default function FavoritesPage() {
  const { user, loading: authLoading } = useAuth();
  const [favorites, setFavorites] = useState<any[]>([])
  const [comicFavorites, setComicFavorites] = useState<Comic[]>([])
  const [loading, setLoading] = useState(true)
  const fetchFavorites = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const q = query(collection(db, "bookmarks"), where("userId", "==", user.uid));
      const querySnapshot = await getDocs(q);
      const data: BookmarkData[] = querySnapshot.docs.map(doc => ({
        ...(doc.data() as Omit<BookmarkData, 'id'>),
        id: doc.id
      }));
      const animeFavs = data.filter(item => !item.type || item.type !== "comic");
      const comicFavs = data.filter(item => item.type === "comic").map(item => ({
        title: item.title,
        link: `https://komiku.org/manga/${item.slug}/`, // Reconstruct link
        thumb: item.poster,
        image: item.poster,
        genre: "",
        latest_chapter: "",
        info: "",
        chapter: "",
        type: "Comic",
        update: "",
      }));
      setFavorites(animeFavs);
      setComicFavorites(comicFavs);
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

  const handleUnlike = async (slug: string, type?: string) => {
    if (!user) return;

    try {
      const docId = `${user.uid}_${slug}`;
      await deleteDoc(doc(db, "bookmarks", docId));
      if (type === "comic") {
        setComicFavorites(prev => prev.filter(comic => comic.link.split('/').pop() !== slug));
      } else {
        setFavorites(prev => prev.filter(anime => anime.slug !== slug));
      }
    } catch (error) {
      console.error("Gagal menghapus favorit:", error);
    }
  };

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
      <div className="flex flex-col items-center justify-center py-20 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-center">
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
          You have {favorites.length} favorite anime{favorites.length > 0 && comicFavorites.length > 0 ? ' and ' : ''}{comicFavorites.length > 0 ? `${comicFavorites.length} favorite comic` : ''}
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
        </div>
      ) : (favorites.length > 0 || comicFavorites.length > 0) ? (
        <>
          {favorites.length > 0 && (
            <div className="mb-12">
              <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">Anime Favorites</h2>
              <ContentGrid
                animes={favorites}
                onLike={(slug) => handleUnlike(slug)}
                likedAnimes={favorites.map(f => f.slug)}
                type="ongoing"
                hasMore={false}
              />
            </div>
          )}
          {comicFavorites.length > 0 && (
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">Comic Favorites</h2>
              <ComicContentGrid
                comics={comicFavorites}
                loading={false}
                hasMore={false}
              />
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-center">
          <img src="NotFound.png" alt="Not Found" className="w-84" />
          <p className="text-slate-600 dark:text-slate-400">There is no anime or comic that you like yet.</p>
        </div>
      )}
    </div>
  );
}