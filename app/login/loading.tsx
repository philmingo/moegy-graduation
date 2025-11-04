import { currentTheme, ui } from "@/lib/theme-config"
import { AnimatedBackground } from "@/components/animated-background"

export default function LoginLoading() {
  return (
    <div
      className={`min-h-screen ${currentTheme.background} relative overflow-hidden flex items-center justify-center p-4`}
    >
      {/* Animated Background Elements */}
      <AnimatedBackground />

      <div className={`w-full max-w-md relative z-10`}>
        <div className={`${currentTheme.glass.standard} ${ui.borderRadius.medium} p-8`}>
          {/* Logo Skeleton */}
          <div className="text-center mb-8">
            <div
              className={`inline-flex w-20 h-20 ${currentTheme.glass.light} ${ui.borderRadius.large} mb-6 animate-pulse`}
            />

            {/* Title Skeleton */}
            <div className={`h-6 ${currentTheme.glass.light} ${ui.borderRadius.small} mb-2 animate-pulse`} />

            {/* Subtitle Skeleton */}
            <div className={`h-4 ${currentTheme.glass.light} ${ui.borderRadius.small} mb-3 mx-8 animate-pulse`} />

            {/* Tagline Skeleton */}
            <div className={`h-4 ${currentTheme.glass.light} ${ui.borderRadius.small} mx-12 animate-pulse`} />
          </div>

          {/* Form Skeleton */}
          <div className="space-y-6">
            {/* Email Field */}
            <div className="space-y-2">
              <div className={`h-4 w-12 ${currentTheme.glass.light} ${ui.borderRadius.small} animate-pulse`} />
              <div className={`h-12 ${currentTheme.glass.light} ${ui.borderRadius.small} animate-pulse`} />
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <div className={`h-4 w-16 ${currentTheme.glass.light} ${ui.borderRadius.small} animate-pulse`} />
                <div className={`h-4 w-24 ${currentTheme.glass.light} ${ui.borderRadius.small} animate-pulse`} />
              </div>
              <div className={`h-12 ${currentTheme.glass.light} ${ui.borderRadius.small} animate-pulse`} />
            </div>

            {/* Button Skeleton */}
            <div className={`h-12 ${currentTheme.glass.light} ${ui.borderRadius.small} animate-pulse`} />
          </div>

          {/* Footer Skeleton */}
          <div className="mt-8 text-center">
            <div className={`h-3 ${currentTheme.glass.light} ${ui.borderRadius.small} mx-8 animate-pulse`} />
          </div>
        </div>

        {/* Back Link Skeleton */}
        <div className="text-center mt-6">
          <div className={`h-8 w-48 ${currentTheme.glass.light} ${ui.borderRadius.small} mx-auto animate-pulse`} />
        </div>
      </div>
    </div>
  )
}
