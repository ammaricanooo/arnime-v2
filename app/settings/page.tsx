'use client'

import { Settings, Moon, Sun, Monitor, Palette, Image as ImageIcon, Sparkles } from 'lucide-react'
import { useTheme } from '@/lib/ThemeProvider'
import { useComicGap } from '@/lib/useComicGap'

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const { comicGap, updateComicGap } = useComicGap()

  const themeOptions = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ] as const

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-10">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-4xl font-black uppercase tracking-tighter text-slate-900 dark:text-white">
          Settings
        </h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium">
          Customize your reading experience
        </p>
      </div>

      {/* Theme Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-black uppercase text-[10px] tracking-[0.2em]">
          <Palette className="w-3 h-3" /> Appearance
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {themeOptions.map((option) => {
            const IconComponent = option.icon
            const isSelected = theme === option.value

            return (
              <button
                key={option.value}
                onClick={() => setTheme(option.value)}
                className={`group p-5 rounded-3xl border transition-all duration-300 text-left ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 shadow-lg shadow-indigo-100 dark:shadow-none'
                    : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-200 dark:hover:border-slate-700'
                }`}
              >
                <IconComponent className={`w-6 h-6 mb-3 transition-colors ${isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
                <span className="block font-black text-sm uppercase text-slate-900 dark:text-white">
                  {option.label}
                </span>
              </button>
            )
          })}
        </div>
      </section>

      {/* Comic Settings Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-black uppercase text-[10px] tracking-[0.2em]">
          <Sparkles className="w-3 h-3" /> Reader Preferences
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-4 pr-2">
            <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl">
              <ImageIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h3 className="font-black text-lg text-slate-900 dark:text-white uppercase">Image Spacing</h3>
              <p className="text-sm text-slate-500 font-medium">Add gap between pages for better reading flow</p>
            </div>
          </div>
          
          <button
            onClick={() => updateComicGap(!comicGap)}
            className={`relative shrink-0 inline-flex h-8 w-14 items-center rounded-full transition-all duration-300 ${
              comicGap ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'
            }`}
          >
            <span
              className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                comicGap ? 'translate-x-7' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </section>
    </div>
  )
}