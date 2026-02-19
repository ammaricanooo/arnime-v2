"use client";
import GenreFilter from "@/components/GenreFilter";
import ContentGrid from "@/components/ContentGrid";
import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from 'next/navigation'
import { Loader2 } from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, setDoc, deleteDoc, collection, query, where, getDocs } from "firebase/firestore";
import useAuth from "@/lib/useAuth";
import Swal from 'sweetalert2'

interface Genre {
  name: string
  slug: string
}

interface AnimeData {
  title: string
  slug: string
  poster: string
  current_episode?: string
  release_day?: string
  total_episode?: string
  rating?: string
  episode_count?: string
  season?: string
  studio?: string
  newest_release_date: string
}

const MAX_PAGES = 3

export default function Home() {
  const { user } = useAuth();
  const searchParams = useSearchParams()
  const tabType = searchParams?.get('type') || ''
  const currentTab = tabType === 'complete' ? 'complete' : 'home'
  const [selectedGenre, setSelectedGenre] = useState('All')
  const [genres, setGenres] = useState<string[]>(['All'])
  const [genreMap, setGenreMap] = useState<{ [key: string]: string }>({})
  const [animes, setAnimes] = useState<AnimeData[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingGenres, setLoadingGenres] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [likedAnimes, setLikedAnimes] = useState<string[]>([])
  const observerTarget = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchUserLikes = async () => {
      if (user) {
        try {
          const q = query(collection(db, "bookmarks"), where("userId", "==", user.uid));
          const querySnapshot = await getDocs(q);
          const slugs = querySnapshot.docs.map(doc => doc.data().slug);
          setLikedAnimes(slugs);
        } catch (error) {
          console.error("Error fetching likes from Firestore:", error);
        }
      } else {
        setLikedAnimes([]);
      }
    };
    fetchUserLikes();
  }, [user]);

  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const { fetchJson } = await import('../lib/fetchJson')
        const data = await fetchJson('https://api.ammaricano.my.id/api/otakudesu/genre')
        if (data.result && Array.isArray(data.result)) {
          const genreNames = ['All', ...data.result.map((genre: Genre) => genre.name)]
          const slugMap: { [key: string]: string } = {}
          data.result.forEach((genre: Genre) => {
            slugMap[genre.name] = genre.slug
          })
          setGenres(genreNames)
          setGenreMap(slugMap)
        }
      } catch (error) {
        console.error('Error fetching genres:', error)
        setGenres(['All', 'Action', 'Adventure', 'Comedy', 'Drama'])
      } finally {
        setLoadingGenres(false)
      }
    }

    fetchGenres()
  }, [])

  const fetchAnimes = useCallback(async (page: number, isLoadMore: boolean = false, genre: string = 'All') => {
    if (page > MAX_PAGES) {
      setHasMore(false)
      return
    }

    setLoading(true)
    try {
      let url: string
      if (genre && genre !== 'All') {
        const genreSlug = genreMap[genre] || genre.toLowerCase()
        url = `https://api.ammaricano.my.id/api/otakudesu/animebygenre?genre=${genreSlug}&page=${page}`
      } else {
        const animeType = currentTab === 'home' ? 'ongoing' : 'complete'
        url = `https://api.ammaricano.my.id/api/otakudesu?type=${animeType}&page=${page}`
      }

      const { fetchJson } = await import('../lib/fetchJson')
      const data = await fetchJson(url)

      if (data && data.result && Array.isArray(data.result)) {
        if (isLoadMore) {
          setAnimes(prev => [...prev, ...data.result])
        } else {
          setAnimes(data.result)
        }
        setHasMore(page < MAX_PAGES && data.result.length > 0)
      }
    } catch (error) {
      console.error('Error fetching animes:', error)
    } finally {
      setLoading(false)
    }
  }, [tabType, genreMap, currentTab])

  useEffect(() => {
    setCurrentPage(1)
    setAnimes([])
    setHasMore(true)
    setSelectedGenre('All')
  }, [tabType, fetchAnimes])

  useEffect(() => {
    setCurrentPage(1)
    setAnimes([])
    setHasMore(true)
    fetchAnimes(1, false, selectedGenre)
  }, [selectedGenre, fetchAnimes])

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loading && animes.length > 0) {
          const nextPage = currentPage + 1
          if (nextPage <= MAX_PAGES) {
            setCurrentPage(nextPage)
            fetchAnimes(nextPage, true, selectedGenre)
          }
        }
      },
      { threshold: 0.1 }
    )
    if (observerTarget.current) observer.observe(observerTarget.current)
    return () => observer.disconnect()
  }, [hasMore, loading, currentPage, animes.length, selectedGenre, fetchAnimes])

  const handleLike = async (slug: string) => {
    if (!user) {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "You need to login first to save your favorite anime!"
      });
      return;
    }

    const isAlreadyLiked = likedAnimes.includes(slug);
    const docId = `${user.uid}_${slug}`;
    const docRef = doc(db, "bookmarks", docId);

    try {
      if (isAlreadyLiked) {
        await deleteDoc(docRef);
        setLikedAnimes(prev => prev.filter(s => s !== slug));
      } else {
        const animeToSave = animes.find(a => a.slug === slug);

        setLikedAnimes(prev => [...prev, slug]);

        await setDoc(docRef, {
          userId: user.uid,
          slug: slug,
          title: animeToSave?.title || "Unknown Title",
          poster: animeToSave?.poster || "",
          type: currentTab === 'complete' ? 'complete' : 'ongoing',
          createdAt: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error("Firestore Error:", error);
      if (!isAlreadyLiked) setLikedAnimes(prev => prev.filter(s => s !== slug));
      alert("Gagal menyimpan ke favorit.");
    }
  };

  return (
    <>
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <div className="w-full md:w-auto">
          {/* Skeleton untuk Judul */}
          {loading && animes.length === 0 ? (
            <div className="animate-pulse space-y-2">
              <div className="h-8 md:h-10 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg" />
              <div className="h-4 w-64 bg-slate-100 dark:bg-slate-800/50 rounded" />
            </div>
          ) : (
            <>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                {selectedGenre !== 'All' ? selectedGenre : (
                  currentTab === 'home' ? 'Ongoing Anime' : 'Completed Anime'
                )}
              </h1>
              <p className="text-slate-600 dark:text-slate-400 text-sm md:text-base">
                Browse and discover your favorite anime content
              </p>
            </>
          )}
        </div>

        {/* Skeleton untuk Genre Filter */}
        {loadingGenres ? (
          <div className="flex gap-2 animate-pulse overflow-hidden w-full md:w-auto">
              <div className="h-10 w-50 bg-slate-200 dark:bg-slate-800 rounded shrink-0" />
          </div>
        ) : (
          <GenreFilter
            genres={genres}
            selectedGenre={selectedGenre}
            onSelectGenre={setSelectedGenre}
          />
        )}
      </div>

      <ContentGrid
        animes={animes}
        onLike={handleLike}
        likedAnimes={likedAnimes}
        type={currentTab === 'home' ? 'ongoing' : 'complete'}
        loading={loading}
        hasMore={false} // Kita pakai observerTarget di bawah untuk infinite scroll
      />

      {/* Target untuk Infinite Scroll */}
      <div ref={observerTarget} className="flex justify-center py-12">
        {loading && animes.length > 0 && (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
            <p className="text-xs text-slate-500 animate-pulse font-medium">Memuat lebih banyak...</p>
          </div>
        )}
      </div>

      {!loading && animes.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="text-slate-600 dark:text-slate-400 mb-4">No anime found</p>
        </div>
      )}
    </>
  )
}