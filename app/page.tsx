"use client";
import GenreFilter from "@/components/GenreFilter";
import ContentGrid from "@/components/ContentGrid";
import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from 'next/navigation'
import { Loader2 } from "lucide-react";
import { db } from "@/lib/firebase"; // sesuaikan path
import { doc, setDoc, deleteDoc, collection, query, where, getDocs } from "firebase/firestore";
import useAuth from "@/lib/useAuth"; // sesuaikan path
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
  const [searchQuery, setSearchQuery] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const searchParams = useSearchParams()
  const tabType = searchParams?.get('type') || ''
  const currentTab = tabType === 'complete' ? 'complete' : 'home'
  const [selectedGenre, setSelectedGenre] = useState('All')
  const [genres, setGenres] = useState<string[]>(['All'])
  const [genreMap, setGenreMap] = useState<{ [key: string]: string }>({})
  const [animes, setAnimes] = useState<AnimeData[]>([])
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [likedAnimes, setLikedAnimes] = useState<string[]>([])
  const [loadingGenres, setLoadingGenres] = useState(true)
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
        setLikedAnimes([]); // Reset jika user logout
      }
    };
    fetchUserLikes();
  }, [user]);

  // Fetch genres and create slug map
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

  // Fetch anime data
  const fetchAnimes = useCallback(async (page: number, isLoadMore: boolean = false, genre: string = 'All') => {
    if (page > MAX_PAGES) {
      setHasMore(false)
      return
    }

    setLoading(true)
    try {
      let url: string

      if (genre && genre !== 'All') {
        // Fetch by genre
        const genreSlug = genreMap[genre] || genre.toLowerCase()
        url = `https://api.ammaricano.my.id/api/otakudesu/animebygenre?genre=${genreSlug}&page=${page}`
      } else {
        // Fetch by type (ongoing/complete)
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

        if (page >= MAX_PAGES || data.result.length === 0) {
          setHasMore(false)
        } else {
          setHasMore(true)
        }
      }
    } catch (error) {
      console.error('Error fetching animes:', error)
    } finally {
      setLoading(false)
    }
  }, [tabType, genreMap])

  // Fetch animes when activeTab changes
  useEffect(() => {
    setCurrentPage(1)
    setAnimes([])
    setHasMore(true)
    setSelectedGenre('All')
  }, [tabType, fetchAnimes])

  // Handle genre change
  useEffect(() => {
    setCurrentPage(1)
    setAnimes([])
    setHasMore(true)
    fetchAnimes(1, false, selectedGenre)
  }, [selectedGenre, fetchAnimes])

  // Auto infinite scroll with Intersection Observer
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

    if (observerTarget.current) {
      observer.observe(observerTarget.current)
    }

    return () => observer.disconnect()
  }, [hasMore, loading, currentPage, animes.length, selectedGenre, fetchAnimes])

  // HANDLE LIKE (SAVE/DELETE TO FIREBASE)
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
    const docId = `${user.uid}_${slug}`; // ID Unik gabungan User dan Anime
    const docRef = doc(db, "bookmarks", docId);

    try {
      if (isAlreadyLiked) {
        // Hapus dari Firebase (Unlike)
        await deleteDoc(docRef);
        setLikedAnimes(prev => prev.filter(s => s !== slug));
      } else {
        // Simpan ke Firebase (Like)
        const animeToSave = animes.find(a => a.slug === slug);

        // Optimistic update (Ubah UI dulu biar kerasa cepet)
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
      // Rollback state jika gagal
      if (!isAlreadyLiked) setLikedAnimes(prev => prev.filter(s => s !== slug));
      alert("Gagal menyimpan ke favorit.");
    }
  };

  return (
    <>
      {/* Header Section */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            {selectedGenre !== 'All' ? selectedGenre : (
              <>
                {currentTab === 'home' && 'Ongoing Anime'}
                {currentTab === 'complete' && 'Completed Anime'}
                {/* currentTab === 'recent' && 'Recently Added' */}
                {/* currentTab === 'favorites' && 'My Favorites' */}
                {/* currentTab === 'watchlist' && 'My Watchlist' */}
              </>
            )}
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm md:text-base">Browse and discover your favorite anime content</p>
        </div>
        <GenreFilter
          genres={genres}
          selectedGenre={selectedGenre}
          onSelectGenre={setSelectedGenre}
        />
      </div>

      {/* Loading State */}
      {animes.length === 0 && loading && (
        <div className="flex items-center justify-center py-24">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            <p className="text-slate-600 dark:text-slate-400">Loading anime...</p>
          </div>
        </div>
      )}

      {/* Content Grid */}
      {animes.length > 0 && (
        <>
          <ContentGrid
            animes={animes}
            onLike={handleLike}
            likedAnimes={likedAnimes}
            type={currentTab === 'home' ? 'ongoing' : 'complete'}
            loading={loading}
            hasMore={false}
          />
          {/* Infinite scroll observer target */}
          <div ref={observerTarget} className="flex justify-center py-8 mt-4">
            {loading && (
              <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
            )}
          </div>
        </>
      )}

      {/* Empty State */}
      {animes.length === 0 && !loading && (
        <div className="flex items-center justify-center py-24">
          <div className="text-center">
            <p className="text-slate-600 dark:text-slate-400 mb-4">No anime found</p>
          </div>
        </div>
      )}
    </>
  )
}
