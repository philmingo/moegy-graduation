import { currentTheme } from "@/lib/theme-config"
import { BookHeart, Loader2 } from "lucide-react"

export default function GuestBookLoading() {
  const theme = currentTheme

  return (
    <div className={`min-h-screen ${theme.background} p-8`}>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${theme.glass.standard}`}>
              <BookHeart className={`h-8 w-8 ${theme.text.primary} animate-pulse`} />
            </div>
            <div>
              <div className={`h-10 w-48 ${theme.skeleton.text.primary} mb-2`}></div>
              <div className={`h-5 w-32 ${theme.skeleton.text.secondary}`}></div>
            </div>
          </div>
          <div className={`h-12 w-48 ${theme.skeleton.button} rounded-lg`}></div>
        </div>

        {/* Stats Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className={`${theme.glass.standard} rounded-xl p-6`}>
              <div className={`h-4 w-24 ${theme.skeleton.text.secondary} mb-3`}></div>
              <div className={`h-8 w-16 ${theme.skeleton.text.primary}`}></div>
            </div>
          ))}
        </div>

        {/* Carousel Skeleton */}
        <div className={`${theme.glass.standard} rounded-2xl p-12`}>
          <div className="flex flex-col items-center justify-center gap-4">
            <Loader2 className={`h-12 w-12 ${theme.text.primary} animate-spin`} />
            <p className={theme.text.secondary}>Loading messages...</p>
          </div>
        </div>
      </div>
    </div>
  )
}
