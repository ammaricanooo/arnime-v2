'use client'

import { useState } from 'react'
import {
  Smartphone, Download, Star, Shield, Zap,
  Wifi, Bell, ChevronDown, ExternalLink,
  CheckCircle, Play, BookOpen, Tv2, Users,
} from 'lucide-react'

// ─── Config — update APK_URL when you have a real APK ────────────────────────
const APK_URL = '/arnime.apk'          // put your APK in /public/arnime.apk
const APP_VERSION = '1.0.0'
const APP_SIZE = '~5 MB'
const MIN_ANDROID = 'Android 7.0+'

// ─── Feature list ─────────────────────────────────────────────────────────────
const FEATURES = [
  { icon: Play, label: 'Nonton Anime Sub Indo', desc: 'Ribuan judul anime dengan subtitle Indonesia' },
  { icon: BookOpen, label: 'Baca Komik', desc: 'Koleksi komik lengkap dengan reader nyaman' },
  { icon: Tv2, label: 'Live TV Indonesia', desc: 'Streaming TV nasional secara langsung' },
  { icon: Users, label: 'Watch Party', desc: 'Nonton bareng teman dengan chat realtime' },
  { icon: Star, label: 'Favorit & History', desc: 'Simpan anime favorit dan riwayat tontonan' },
  { icon: Bell, label: 'Jadwal Rilis', desc: 'Pantau jadwal episode terbaru setiap hari' },
]

// ─── FAQ ──────────────────────────────────────────────────────────────────────
const FAQS = [
  {
    q: 'Apakah aplikasi ini aman?',
    a: 'Ya. Arnime adalah aplikasi WebView yang membuka website resmi arnime.ammaricano.my.id. Tidak ada data berbahaya yang dikumpulkan.',
  },
  {
    q: 'Kenapa perlu izin "Install dari sumber tidak dikenal"?',
    a: 'Karena APK ini tidak didistribusikan melalui Google Play Store. Ini normal untuk aplikasi indie. Kamu bisa menonaktifkan izin tersebut setelah instalasi.',
  },
  {
    q: 'Apakah bisa digunakan tanpa internet?',
    a: 'Tidak. Arnime membutuhkan koneksi internet untuk streaming anime dan memuat konten.',
  },
  {
    q: 'Apakah tersedia untuk iOS?',
    a: 'Belum tersedia untuk iOS. Kamu bisa menggunakan browser Safari di iPhone untuk mengakses arnime.ammaricano.my.id.',
  },
  {
    q: 'Bagaimana cara update aplikasi?',
    a: 'Download ulang APK terbaru dari halaman ini dan install di atas versi lama.',
  },
]

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
      >
        <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 pr-4">{q}</span>
        <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-5 pb-4 text-sm text-slate-500 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-3">
          {a}
        </div>
      )}
    </div>
  )
}

export default function DownloadPageClient() {
  const [copied, setCopied] = useState(false)

  const copyLink = () => {
    navigator.clipboard.writeText('https://arnime.ammaricano.my.id/download')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="max-w-4xl mx-auto pb-16">

      {/* ── Hero ── */}
      <div className="text-center py-12 px-4">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full text-xs font-bold uppercase tracking-wider mb-6">
          <Smartphone className="w-3.5 h-3.5" />
          Android App
        </div>

        <div className="flex items-center justify-center mb-6">
          <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-xl border-2 border-slate-100 dark:border-slate-800">
            <img src="/arnime.svg" alt="Arnime" className="w-full h-full object-contain p-2 bg-white dark:bg-slate-900" />
          </div>
        </div>

        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-3">
          Arnime untuk Android
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-base max-w-md mx-auto mb-8">
          Nonton anime sub indo, baca komik, dan live TV Indonesia langsung dari smartphone kamu.
        </p>

        {/* Download button */}
        <a
          href={APK_URL}
          download="arnime.apk"
          className="inline-flex items-center gap-3 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-base transition-all shadow-lg shadow-indigo-200 dark:shadow-none hover:scale-105 active:scale-95"
        >
          <Download className="w-5 h-5" />
          Download APK
        </a>

        {/* Meta info */}
        <div className="flex items-center justify-center gap-6 mt-5 text-xs text-slate-400">
          <span>v{APP_VERSION}</span>
          <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
          <span>{APP_SIZE}</span>
          <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
          <span>{MIN_ANDROID}</span>
        </div>
      </div>

      {/* ── Install guide ── */}
      <div className="mx-4 mb-10 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-5">
        <h2 className="text-sm font-bold text-amber-800 dark:text-amber-300 mb-3 flex items-center gap-2">
          <Shield className="w-4 h-4" />
          Cara Install APK
        </h2>
        <ol className="space-y-2 text-sm text-amber-700 dark:text-amber-400">
          <li className="flex gap-2">
            <span className="font-bold shrink-0">1.</span>
            <span>Download file APK di atas</span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold shrink-0">2.</span>
            <span>Buka <strong>Pengaturan → Keamanan</strong> (atau <strong>Privasi</strong>) di HP kamu</span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold shrink-0">3.</span>
            <span>Aktifkan <strong>"Instal aplikasi dari sumber tidak dikenal"</strong> atau <strong>"Izinkan dari sumber ini"</strong></span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold shrink-0">4.</span>
            <span>Buka file APK yang sudah didownload dan tap <strong>Install</strong></span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold shrink-0">5.</span>
            <span>Setelah install, kamu bisa menonaktifkan kembali izin tersebut</span>
          </li>
        </ol>
      </div>

      {/* ── Features ── */}
      <div className="mx-4 mb-10">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-5">Fitur Lengkap</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {FEATURES.map(({ icon: Icon, label, desc }) => (
            <div
              key={label}
              className="flex items-start gap-3 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl"
            >
              <div className="w-9 h-9 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{label}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Why APK ── */}
      <div className="mx-4 mb-10 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: Zap, title: 'Ringan & Cepat', desc: 'Ukuran kecil, performa optimal' },
          { icon: Shield, title: 'Aman', desc: 'Tidak ada iklan berbahaya atau malware' },
          { icon: Wifi, title: 'Selalu Update', desc: 'Konten selalu terbaru tanpa update app' },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="text-center p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
            <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Icon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{title}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{desc}</p>
          </div>
        ))}
      </div>

      {/* ── Alternatively: open in browser ── */}
      <div className="mx-4 mb-10 p-5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl flex flex-col sm:flex-row items-center gap-4">
        <div className="flex-1 text-center sm:text-left">
          <p className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">Tidak mau install APK?</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Akses Arnime langsung dari browser smartphone kamu — pengalaman yang sama tanpa install.
          </p>
        </div>
        <a
          href="https://arnime.ammaricano.my.id"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:border-indigo-400 hover:text-indigo-600 transition-all shrink-0"
        >
          <ExternalLink className="w-4 h-4" />
          Buka di Browser
        </a>
      </div>

      {/* ── FAQ ── */}
      <div className="mx-4 mb-10">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-5">FAQ</h2>
        <div className="space-y-2">
          {FAQS.map((faq) => (
            <FaqItem key={faq.q} {...faq} />
          ))}
        </div>
      </div>

      {/* ── Bottom CTA ── */}
      <div className="mx-4 text-center p-8 bg-indigo-600 rounded-2xl">
        <CheckCircle className="w-10 h-10 text-indigo-200 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-white mb-2">Siap Nonton?</h2>
        <p className="text-indigo-200 text-sm mb-5">Download sekarang dan nikmati ribuan anime gratis</p>
        <a
          href={APK_URL}
          download="arnime.apk"
          className="inline-flex items-center gap-2 px-7 py-3 bg-white hover:bg-slate-100 text-indigo-600 rounded-xl font-bold text-sm transition-all"
        >
          <Download className="w-4 h-4" />
          Download APK v{APP_VERSION}
        </a>
      </div>
    </div>
  )
}
