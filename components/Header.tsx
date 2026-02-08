'use client'

import { Search, Bell, User, Menu, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface HeaderProps {
    searchQuery: string
    onSearchChange: (query: string) => void
    onMenuToggle?: () => void
    onSidebarToggle?: () => void
    sidebarCollapsed?: boolean
}

export default function Header({ searchQuery, onSearchChange, onMenuToggle, onSidebarToggle, sidebarCollapsed = false }: HeaderProps) {
    const router = useRouter()
    const [inputValue, setInputValue] = useState(searchQuery)

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        if (inputValue.trim()) {
            router.push(`/search?q=${encodeURIComponent(inputValue)}`)
        }
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        setInputValue(value)
        onSearchChange(value)
    }
    return (
        <header className="sticky top-0 z-40 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between px-4 md:px-8 py-3 gap-4">                {/* Sidebar Collapse Button (Desktop) */}
                <button
                    onClick={onSidebarToggle}
                    className="hidden md:flex p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 shrink-0"
                    title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                    <ChevronRight className={`w-5 h-5 transition-transform ${ !sidebarCollapsed ? 'rotate-180' : '' }`} />
                </button>
                {/* Mobile Menu Button */}
                <button
                    onClick={onMenuToggle}
                    className="md:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 shrink-0"
                >
                    <Menu className="w-5 h-5" />
                </button>

                {/* Search Bar */}
                <form onSubmit={handleSearch} className="flex-1 max-w-sm md:max-w-md">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                        <input
                            type="text"
                            placeholder="Search anime..."
                            value={inputValue}
                            onChange={handleInputChange}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                    handleSearch(e as any)
                                }
                            }}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm"
                        />
                    </div>
                </form>

                {/* Right Actions */}
                <div className="flex items-center gap-2 md:gap-3 shrink-0">
                    <button className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hidden md:block">
                        <Bell className="w-5 h-5" />
                    </button>
                    <button className="flex items-center gap-2 px-3 md:px-4 py-2 bg-linear-to-r from-indigo-600 to-indigo-700 dark:from-indigo-500 dark:to-indigo-600 text-white rounded-lg hover:shadow-md hover:to-indigo-800 dark:hover:to-indigo-700 transition-all text-xs md:text-sm font-medium">
                        <User className="w-4 h-4" />
                        <span className="hidden sm:inline">Profile</span>
                    </button>
                </div>
            </div>
        </header>
    )
}
