/**
 * STUDENT QR PORTAL - THEME CONFIGURATION
 *
 * This file centralizes all UI-related configurations.
 * Uses complete Tailwind class names to ensure proper CSS generation.
 */

// ==============================
// INSTITUTION CONFIGURATION
// ==============================

export const institution = {
  name: "GOAL",
  slogan: "Voice your graduates",
  shortName: "GOAL", // For avatars, short references
  fullDisplayName: "GOAL", // For formal displays
  graduationTitle: "", // MODIFIED: Remove "Graduation Ceremony"
  systemName: "Graduation System", // For admin headers
  subHeader: "Guyana Online Academy of Learning", // NEW: Sub header for QR cards
}

// ==============================
// THEME VARIANTS
// ==============================

export const themes = {
  default: {
    // Background gradients
    background: "bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900",

    // Primary colors
    primary: {
      gradient: "bg-gradient-to-r from-purple-500 to-pink-500",
      gradientHover: "hover:from-purple-600 hover:to-pink-600",
      text: "text-purple-400",
      border: "border-purple-500/20",
      ring: "focus-visible:ring-purple-400",
    },

    // Glass morphism
    glass: {
      standard: "bg-white/10 backdrop-blur-xl border border-white/20",
      light: "bg-white/5 backdrop-blur-xl border border-white/10",
      input: "bg-white/20 backdrop-blur-sm",
      hover: "hover:bg-white/15", // This is for general hover on glass elements, not specific to card animation
    },

    // Text colors
    text: {
      primary: "text-white",
      secondary: "text-gray-300",
      muted: "text-gray-400",
      placeholder: "placeholder:text-white/70", // Fixed placeholder color
      gradient: {
        primary: "bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent",
        secondary: "bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent",
      },
    },

    // Status colors
    status: {
      success: {
        gradient: "bg-gradient-to-r from-green-500 to-emerald-500",
        gradientHover: "hover:from-green-600 hover:to-emerald-600",
        bg: "bg-green-500/20",
        text: "text-green-300",
        border: "border-green-500/30",
        dot: "bg-gradient-to-r from-green-400 to-emerald-400",
      },
      warning: {
        gradient: "bg-gradient-to-r from-red-500 to-orange-500",
        bg: "bg-red-500/20",
      },
    },

    // Accent colors
    accent: {
      badge: "bg-gradient-to-r from-yellow-400 to-orange-400",
    },

    // Modal specific
    modal: {
      background: "bg-gradient-to-br from-slate-900 to-purple-900",
      border: "border-purple-500/20",
      qr: {
        container: "bg-gray-100",
        header: "bg-gray-200",
        headerText: "text-gray-800",
        nameSection: "bg-gray-100",
        nameText: "text-gray-900",
        border: "border-gray-400",
      },
    },

    // Layout specific
    layout: {
      addStudentWidth: "lg:col-span-3",
      studentListWidth: "lg:col-span-5",
      gridCols: "lg:grid-cols-8",
      contentHeight: "h-[calc(100vh-260px)]",
      bottomPadding: "pb-16",
      containerPadding: "py-6",
      maxWidth: "max-w-7xl",
      gridGap: "gap-24",
      addStudentConstraints: {
        maxHeight: "max-h-[680px]",
        overflow: "overflow-y-auto",
        bottomPadding: "pb-4",
        bottomMargin: "mb-0",
      },
      studentListConstraints: {
        maxHeight: "h-[calc(100vh-260px)]",
        overflow: "overflow-hidden",
        bottomPadding: "pb-4",
        bottomMargin: "mb-0",
      },
      pageConstraints: {
        overflow: "overflow-hidden",
        height: "h-screen",
        mainContentSpacing: "py-8",
        headerSpacing: "mb-8",
      },
      // Graduation list specific styling
      graduationList: {
        container: {
          spacing: "space-y-4", // Changed from "space-y-2" to "space-y-4" for more gap
          padding: "p-4",
          maxHeight: "max-h-[calc(100vh-200px)]",
          overflow: "overflow-y-auto",
        },
        card: {
          spacing: "mb-4",
          padding: "p-4",
          minHeight: "min-h-[160px] sm:min-h-[140px] md:min-h-[120px] lg:min-h-[140px]", // More compact and responsive
          background: "bg-white/10 backdrop-blur-xl",
          border: "border border-white/20",
          borderRadius: "rounded-2xl",
          hover: {
            background: "hover:bg-white/15",
            scale: "hover:scale-[1.02]",
            transition: "transition-all duration-200 ease-in-out",
          },
        },
        studentInfo: {
          nameText: "text-white font-semibold text-lg",
          programText: "text-purple-300 text-sm break-words", // Add break-words
          universityText: "text-gray-400 text-sm break-words", // Add break-words
          spacing: "space-y-2", // Increase spacing between elements
          cardSpacing: "mb-3", // Add spacing between info cards and buttons
        },
        virtualization: {
          itemHeight: {
            desktop: 200, // Increase from 80 to 200
            tablet: 190, // Increase from 90 to 190
            mobile: 220, // Increase from 100 to 220
          },
          overscan: 5,
          padding: "p-2",
        },
      },
      academicInfo: {
        container: "flex flex-wrap gap-2 mb-3", // Add margin bottom
        universityCard: "bg-purple-500/30 backdrop-blur-sm border border-purple-400/40 rounded-lg px-2 py-1 text-xs",
        programmeCard: "bg-blue-500/30 backdrop-blur-sm border border-blue-400/40 rounded-lg px-2 py-1 text-xs",
        gradeCard: "bg-emerald-500/30 backdrop-blur-sm border border-emerald-400/40 rounded-lg px-2 py-1 text-xs",
        seatCard: "bg-orange-500/30 backdrop-blur-sm border border-orange-400/40 rounded-lg px-2 py-1 text-xs",
        labelText: "font-medium",
        valueText: "text-white break-words", // Prevent ellipsis, allow wrapping
      },
    },

    // Action buttons spacing
    actions: {
      buttonSpacing: "space-x-4",
      buttonSize: "h-8 w-8",
    },

    // Skeleton loading system
    skeleton: {
      base: "animate-pulse",
      avatar: "w-12 h-12 bg-white/20 rounded-full animate-pulse",
      text: {
        primary: "h-4 bg-white/20 rounded-md animate-pulse",
        secondary: "h-3 bg-white/15 rounded-md animate-pulse",
        wide: "w-3/4",
        medium: "w-1/2",
        narrow: "w-1/3",
      },
      button: "h-8 w-8 bg-white/15 rounded-md animate-pulse",
      card: "bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4",
      spacing: "space-y-3",
      container: "space-y-4 p-4",
    },

    // Card hover effects
    hover: {
      card: {
        scale: "hover:scale-105 hover:-translate-y-2", // Updated with new hover animation
        shadow: "hover:shadow-xl hover:shadow-purple-500/20", // Added shadow on hover
        glow: "", // No glow on hover
        background: "", // No background change on hover
        border: "", // No border change on hover
        transition: "transition-all duration-500", // Smooth transition
      },
      button: {
        // Button hovers can remain as they are less frequent
        scale: "hover:scale-110",
        glow: "hover:shadow-lg hover:shadow-purple-500/50",
        transition: "transition-all duration-200 ease-in-out",
      },
    },

    // Scrollbar styling
    scrollbar: {
      track: "scrollbar-track-purple-900/20",
      thumb: "scrollbar-thumb-purple-500/50 hover:scrollbar-thumb-purple-400/70",
      width: "scrollbar-thin",
      style:
        "scrollbar-thin scrollbar-track-purple-900/20 scrollbar-thumb-purple-500/50 hover:scrollbar-thumb-purple-400/70",
      container: "overflow-y-auto max-h-full",
    },

    // Scanner specific theming
    scanner: {
      region: {
        border: "border-purple-400",
        borderWidth: "border-2",
        borderRadius: "rounded-3xl",
        shadow: "shadow-[0_0_15px_rgba(168,85,247,0.3)]",
        background: "bg-transparent",
      },
      corners: {
        border: "border-purple-400",
        borderWidth: "border-4",
        size: "w-10 h-10",
        radius: "rounded-2xl",
      },
      lines: {
        horizontal: "bg-gradient-to-r from-transparent via-purple-400 to-transparent",
        vertical: "bg-gradient-to-b from-transparent via-purple-400 to-transparent",
        animation: "animate-pulse",
      },
      centerDot: {
        background: "bg-purple-400",
        size: "w-3 h-3",
        animation: "animate-ping",
        shadow: "shadow-[0_0_8px_rgba(168,85,247,0.6)]",
      },
      overlay: {
        dark: "bg-black/40",
        glass: "bg-gradient-radial from-transparent via-purple-50/20 to-purple-100/40",
      },
    },
    qrCard: {
      background: "bg-gradient-to-br from-slate-800 via-purple-800/80 to-slate-800", // Slightly different from page for distinction
      border: "border-purple-500/30",
      universityNameColor: "text-white",
      studentNameColor: "text-white",
      infoTextColor: "text-gray-400",
      qrBgColor: "#FFFFFF", // Standard white background for QR code itself
      qrFgColor: "#3A2E5D", // Your primary dark purple for QR code dots
      borderRadius: "rounded-2xl", // Consistent with other UI elements
      padding: "p-6",
      shadow: "shadow-xl shadow-purple-500/20",
      modal: {
        // Main Container Layout - Consistent sizing and centering
        container: {
          maxWidth: "36rem", // Increased from 32rem to 36rem for more space
          width: "100%",
          height: "auto", // Let content determine height
          margin: "0 auto", // Proper centering
          display: "flex",
          flexDirection: "column",
          classes: "text-center overflow-hidden",
          padding: "p-8", // Add padding at container level for even distribution
        },

        // Institution Header - Consistent spacing
        header: {
          classes:
            "flex-shrink-0 bg-gradient-to-r from-transparent via-white/30 to-transparent backdrop-blur-md rounded-2xl py-2 px-8 shadow-lg", // Removed border, increased opacity, adjusted padding for fade alignment
          marginBottom: "", // Remove individual margin, let space-y handle it
          title: {
            textSize: "text-3xl",
            marginBottom: "mb-2", // Small gap between title and subtitle
            fontWeight: "font-bold",
            lineHeight: "leading-tight",
            textShadow: "text-shadow-md", // Add text shadow
          },
          subtitle: {
            textSize: "text-lg",
            opacity: "opacity-90",
            textShadow: "text-shadow-sm", // Add text shadow
          },
        },

        // Student Info Section - Consistent spacing
        studentInfo: {
          wrapper: {
            classes: "flex-shrink-0", // Remove individual margin, let space-y handle it
          },
          container: {
            background: "bg-gradient-to-r from-transparent via-white/30 to-transparent", // Removed fade effect, increased opacity
            backdropBlur: "backdrop-blur-md", // Increased blur for better readability
            borderRadius: "rounded-2xl",
            shadow: "shadow-lg", // Increased shadow
            border: "border-none", // Removed border completely
            padding: "px-8 py-2", // Adjusted padding for fade alignment
            marginBottom: "mb-4", // Gap between name and pronunciation
            maxWidth: "fit-content",
            minWidth: "auto",
            classes: "mx-auto",
            inlineStyles: {
              width: "fit-content",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            },
          },
          name: {
            textSize: "text-xl",
            fontWeight: "font-semibold",
            textAlign: "text-center",
            classes: "m-0 drop-shadow-lg", // Added text shadow
            inlineStyles: {
              width: "100%",
            },
            textShadow: "text-shadow-md",
          },
          pronunciation: {
            wrapper: {
              classes: "mx-auto", // Center the pronunciation
              inlineStyles: {
                width: "100%",
                margin: "0 auto",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              },
            },
            maxWidth: "320px",
            textSize: "text-sm",
            opacity: "opacity-80",
            fontStyle: "italic",
            classes: "m-0",
          },
          // UPDATED: Academic info cards section with better constraints
          academicCards: {
            wrapper: {
              classes: "flex flex-wrap gap-2 justify-center mx-auto",
              maxWidth: "400px", // Enforce max width to prevent horizontal stretching
              marginTop: "mt-4",
            },
            card: {
              base: "px-3 py-1 rounded-lg text-xs font-semibold backdrop-blur-sm border",
              university: "bg-indigo-500/70 border-indigo-500/40 text-white shadow-md", // Changed to slate for contrast
              programme: "bg-teal-500/70 border-teal-500/40 text-white shadow-md", // Changed to teal for contrast
              classification: "bg-emerald-500/70 border-emerald-500/40 text-white shadow-md", // Made more opaque
              seat: "bg-amber-500/70 border-amber-500/40 text-white shadow-md", // Changed to amber for contrast
            },
          },
        },

        // QR Code Section - Centralized styling
        qrCode: {
          wrapper: {
            classes: "flex items-center justify-center",
          },
          container: {
            background: "bg-white", // Default white background for QR codes
            backgroundFallback: "bg-gray-100", // Fallback if no specific color set
            padding: "p-3",
            borderRadius: "rounded-xl",
            shadow: "shadow-xl",
            classes: "",
          },
          image: {
            size: "w-52 h-52",
            borderRadius: "rounded-lg",
            classes: "",
          },
          loading: {
            container: {
              size: "w-52 h-52",
              background: "bg-gray-200",
              borderRadius: "rounded-lg",
              classes: "flex items-center justify-center",
            },
            spinner: {
              size: "w-8 h-8",
              border: "border-2 border-purple-600 border-t-transparent",
              borderRadius: "rounded-full",
              animation: "animate-spin",
              classes: "",
            },
          },
        },

        // Action Buttons Section - Consistent spacing
        buttons: {
          wrapper: {
            classes: "flex-shrink-0", // Remove individual margin, let space-y handle it
            padding: "px-6", // Match container padding
          },
          container: {
            classes: "flex gap-4 mx-auto",
            maxWidth: "max-w-sm", // Increased from max-w-xs to accommodate longer text
          },
          individual: {
            classes: "flex-1 rounded-2xl py-3 backdrop-blur-sm transition-all duration-300 border-0",
          },
        },

        // Layout spacing - Centralized and consistent
        layout: {
          contentPadding: "p-0", // Remove all padding from content wrapper
          contentWrapper: "relative z-10 flex flex-col", // Remove h-full to prevent flex-1 expansion
          outerSpacing: "space-y-6", // Reduced from space-y-8 to space-y-6 for tighter spacing
          minHeight: "min-h-[650px]", // Increased from 600px to 650px for academic cards
          // Add container padding to the main modal container instead
          containerPadding: "p-8", // Move padding to container level
        },

        // Decorative elements (keep existing but ensure they don't interfere)
        decorative: {
          wrapper: "absolute inset-0 pointer-events-none overflow-hidden",
          elements: [
            // Keep existing decorative elements unchanged
            {
              type: "large",
              color: "yellow",
              shape: "square",
              position: { top: "15%", left: "8%" },
              size: { width: "32px", height: "32px" },
              animation: "spin",
              duration: "120s",
            },
            {
              type: "large",
              color: "emerald",
              shape: "circle",
              position: { bottom: "20%", right: "15%" },
              size: { width: "32px", height: "32px" },
              animation: "circlepulse",
              duration: "4s",
            },
            {
              type: "medium",
              color: "purple",
              shape: "square",
              position: { top: "40%", left: "20%" },
              size: { width: "20px", height: "20px" },
              animation: "spin",
              duration: "90s",
            },
            {
              type: "medium",
              color: "teal",
              shape: "circle",
              position: { bottom: "50%", right: "25%" },
              size: { width: "20px", height: "20px" },
              animation: "circlepulse",
              duration: "4s",
            },
            {
              type: "small",
              color: "pink",
              shape: "circle",
              position: { top: "25%", right: "12%" },
              size: { width: "12px", height: "12px" },
              animation: "circlepulse",
              duration: "4s",
            },
            {
              type: "small",
              color: "cyan",
              shape: "circle",
              position: { top: "60%", right: "10%" },
              size: { width: "12px", height: "12px" },
              animation: "circlepulse",
              duration: "4s",
            },
            {
              type: "small",
              color: "orange",
              shape: "square",
              position: { top: "75%", left: "25%" },
              size: { width: "12px", height: "12px" },
              animation: "spin",
              duration: "100s",
            },
            {
              type: "extraSmall",
              color: "rose",
              shape: "square",
              position: { top: "10%", right: "30%" },
              size: { width: "8px", height: "8px" },
              animation: "spin",
              duration: "110s",
            },
            {
              type: "extraSmall",
              color: "green",
              shape: "square",
              position: { bottom: "60%", left: "5%" },
              size: { width: "8px", height: "8px" },
              animation: "spin",
              duration: "95s",
            },
          ],
          colors: {
            yellow: "bg-yellow-400",
            emerald: "bg-emerald-400",
            purple: "bg-purple-400",
            teal: "bg-teal-400",
            pink: "bg-pink-400",
            cyan: "bg-cyan-400",
            orange: "bg-orange-400",
            rose: "bg-rose-400",
            green: "bg-green-400",
          },
          animations: {
            spin: "animate-spin",
            pulse: "animate-pulse",
            bounce: "animate-bounce",
            circlepulse: "animate-[circlepulse_4s_ease-in-out_infinite]", // Standardized to 8s
          },
          shapes: {
            square: "rotate-45",
            circle: "rounded-full",
          },
        },
      },
      // NEW: Download version styling (for html2canvas)
      download: {
        container: {
          width: "500px",
          height: "700px",
          background: "linear-gradient(135deg, #6b46c1 0%, #312e81 100%)",
          borderRadius: "24px",
          padding: "40px",
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-between",
        },
        header: {
          textAlign: "center",
          marginBottom: "30px",
        },
        title: {
          color: "#ffffff",
          fontSize: "32px",
          fontWeight: "bold",
          margin: "0 0 8px 0",
          lineHeight: "1.2",
        },
        subtitle: {
          color: "#ffffff",
          fontSize: "18px",
          margin: "0",
          opacity: "0.9",
        },
        qrContainer: {
          backgroundColor: "#ffffff",
          padding: "16px",
          borderRadius: "16px",
          boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
          marginBottom: "30px",
        },
        qrImage: {
          width: "240px",
          height: "240px",
          borderRadius: "8px",
          display: "block",
        },
        studentInfo: {
          textAlign: "center",
          marginBottom: "20px",
        },
        studentName: {
          backgroundColor: "rgba(147, 51, 234, 0.2)",
          backdropFilter: "blur(8px)",
          borderRadius: "16px",
          padding: "12px 24px",
          border: "1px solid rgba(196, 181, 253, 0.3)",
          color: "#ffffff",
          fontSize: "22px",
          fontWeight: "bold",
          margin: "0 0 16px 0",
          display: "inline-block",
        },
        pronunciation: {
          color: "#d1d5db",
          fontSize: "14px",
          fontStyle: "italic",
          margin: "0 0 16px 0",
          opacity: "0.8",
        },
        academicCards: {
          display: "flex",
          flexWrap: "wrap",
          gap: "8px",
          justifyContent: "center",
          maxWidth: "400px",
          margin: "0 auto",
        },
        academicCard: {
          base: {
            padding: "6px 12px",
            borderRadius: "8px",
            fontSize: "12px",
            fontWeight: "500",
            border: "1px solid",
            color: "#ffffff",
          },
          university: {
            backgroundColor: "rgba(139, 92, 246, 0.3)",
            borderColor: "rgba(139, 92, 246, 0.4)",
          },
          programme: {
            backgroundColor: "rgba(59, 130, 246, 0.3)",
            borderColor: "rgba(59, 130, 246, 0.4)",
          },
          classification: {
            backgroundColor: "rgba(16, 185, 129, 0.3)",
            borderColor: "rgba(16, 185, 129, 0.4)",
          },
          seat: {
            backgroundColor: "rgba(249, 115, 22, 0.3)",
            borderColor: "rgba(249, 115, 22, 0.4)",
          },
        },
      },
    },
  },

  // Alternative theme example (ocean) - Apply similar hover removal if used
  ocean: {
    // ... (other ocean theme properties) ...
    hover: {
      card: {
        scale: "hover:scale-105 hover:-translate-y-2", // Updated with new hover animation
        shadow: "hover:shadow-xl hover:shadow-blue-500/20", // Added shadow on hover
        glow: "", // No glow on hover
        background: "", // No background change on hover
        border: "", // No border change on hover
        transition: "transition-all duration-500", // Smooth transition
      },
      button: {
        scale: "hover:scale-110",
        glow: "hover:shadow-lg hover:shadow-blue-500/50",
        transition: "transition-all duration-200 ease-in-out",
      },
    },
    // ... (rest of ocean theme properties) ...
    background: "bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900",
    primary: {
      gradient: "bg-gradient-to-r from-blue-500 to-cyan-500",
      gradientHover: "hover:from-blue-600 hover:to-cyan-600",
      text: "text-blue-400",
      border: "border-blue-500/20",
      ring: "focus-visible:ring-blue-400",
    },
    glass: {
      standard: "bg-white/10 backdrop-blur-xl border border-white/20",
      light: "bg-white/5 backdrop-blur-xl border border-white/10",
      input: "bg-white/20 backdrop-blur-sm",
      hover: "hover:bg-white/15",
    },
    text: {
      primary: "text-white",
      secondary: "text-gray-300",
      muted: "text-gray-400",
      placeholder: "placeholder:text-white/70",
      gradient: {
        primary: "bg-gradient-to-r from-white via-blue-200 to-cyan-200 bg-clip-text text-transparent",
        secondary: "bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent",
      },
    },
    status: {
      success: {
        gradient: "bg-gradient-to-r from-green-500 to-emerald-500",
        gradientHover: "hover:from-green-600 hover:to-emerald-600",
        bg: "bg-green-500/20",
        text: "text-green-300",
        border: "border-green-500/30",
        dot: "bg-gradient-to-r from-green-400 to-emerald-400",
      },
      warning: {
        gradient: "bg-gradient-to-r from-red-500 to-orange-500",
        bg: "bg-red-500/20",
      },
    },
    accent: {
      badge: "bg-gradient-to-r from-amber-400 to-yellow-400",
    },
    modal: {
      background: "bg-gradient-to-br from-slate-900 to-blue-900",
      border: "border-blue-500/20",
      qr: {
        container: "bg-gray-100",
        header: "bg-gray-200",
        headerText: "text-gray-800",
        nameSection: "bg-gray-100",
        nameText: "text-gray-900",
      },
    },
    layout: {
      addStudentWidth: "lg:col-span-3",
      studentListWidth: "lg:col-span-5",
      gridCols: "lg:grid-cols-8",
      contentHeight: "h-[calc(100vh-260px)]",
      bottomPadding: "pb-16",
      containerPadding: "px-3 py-6",
      maxWidth: "max-w-7xl",
      gridGap: "gap-24",
      addStudentConstraints: {
        maxHeight: "max-h-[680px]",
        overflow: "overflow-y-auto",
        bottomPadding: "pb-4",
        bottomMargin: "mb-0",
      },
      studentListConstraints: {
        maxHeight: "h-[calc(100vh-260px)]",
        overflow: "overflow-hidden",
        bottomPadding: "pb-4",
        bottomMargin: "mb-0",
      },
      pageConstraints: {
        overflow: "overflow-hidden",
        height: "h-screen",
      },
    },
    graduationList: {
      container: {
        spacing: "space-y-4", // Changed from "space-y-2" to "space-y-4" for more gap
        padding: "p-4",
        maxHeight: "max-h-[calc(100vh-200px)]",
        overflow: "overflow-y-auto",
      },
      card: {
        spacing: "mb-4",
        padding: "p-4",
        minHeight: "min-h-[160px] sm:min-h-[140px] md:min-h-[120px] lg:min-h-[140px]", // More compact and responsive
        background: "bg-white/10 backdrop-blur-xl",
        border: "border border-white/20",
        borderRadius: "rounded-2xl",
        hover: {
          background: "hover:bg-white/15",
          scale: "hover:scale-[1.02]",
          transition: "transition-all duration-200 ease-in-out",
        },
      },
      studentInfo: {
        nameText: "text-white font-semibold text-lg",
        programText: "text-blue-300 text-sm break-words", // Add break-words
        universityText: "text-gray-400 text-sm break-words", // Add break-words
        spacing: "space-y-2", // Increase spacing between elements
        cardSpacing: "mb-3", // Add spacing between info cards and buttons
      },
      virtualization: {
        itemHeight: {
          desktop: 200, // Increase from 80 to 200
          tablet: 190, // Increase from 90 to 190
          mobile: 220, // Increase from 100 to 220
        },
        overscan: 5,
        padding: "p-2",
      },
    },
    academicInfo: {
      container: "flex flex-wrap gap-2 mb-3", // Add margin bottom
      universityCard: "bg-blue-500/30 backdrop-blur-sm border border-blue-400/40 rounded-lg px-2 py-1 text-xs",
      programmeCard: "bg-cyan-500/30 backdrop-blur-sm border border-cyan-400/40 rounded-lg px-2 py-1 text-xs",
      gradeCard: "bg-emerald-500/30 backdrop-blur-sm border border-emerald-400/40 rounded-lg px-2 py-1 text-xs",
      seatCard: "bg-orange-500/30 backdrop-blur-sm border border-orange-400/40 rounded-lg px-2 py-1 text-xs",
      labelText: "font-medium",
      valueText: "text-white break-words", // Prevent ellipsis, allow wrapping
    },
    actions: {
      buttonSpacing: "space-x-4",
      buttonSize: "h-8 w-8",
    },
    skeleton: {
      base: "animate-pulse",
      avatar: "w-12 h-12 bg-white/20 rounded-full animate-pulse",
      text: {
        primary: "h-4 bg-white/20 rounded-md animate-pulse",
        secondary: "h-3 bg-white/15 rounded-md animate-pulse",
        wide: "w-3/4",
        medium: "w-1/2",
        narrow: "w-1/3",
      },
      button: "h-8 w-8 bg-white/15 rounded-md animate-pulse",
      card: "bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4",
      spacing: "space-y-3",
      container: "space-y-4 p-4",
    },
    scrollbar: {
      track: "scrollbar-track-white/5",
      thumb: "scrollbar-thumb-white/30 hover:scrollbar-thumb-white/50",
      width: "scrollbar-thin",
      style: "scrollbar-thin scrollbar-track-white/5 scrollbar-thumb-white/30 hover:scrollbar-thumb-white/50",
      container: "overflow-y-auto max-h-full",
    },
    scanner: {
      region: {
        border: "border-blue-400",
        borderWidth: "border-2",
        borderRadius: "rounded-3xl",
        shadow: "shadow-[0_0_15px_rgba(59,130,246,0.3)]",
        background: "bg-transparent",
      },
      corners: {
        border: "border-blue-400",
        borderWidth: "border-4",
        size: "w-10 h-10",
        radius: "rounded-2xl",
      },
      lines: {
        horizontal: "bg-gradient-to-r from-transparent via-blue-400 to-transparent",
        vertical: "bg-gradient-to-b from-transparent via-blue-400 to-transparent",
        animation: "animate-pulse",
      },
      centerDot: {
        background: "bg-blue-400",
        size: "w-3 h-3",
        animation: "animate-ping",
        shadow: "shadow-[0_0_8px_rgba(59,130,246,0.6)]",
      },
      overlay: {
        dark: "bg-black/40",
        glass: "bg-gradient-radial from-transparent via-blue-50/20 to-blue-100/40",
      },
    },
    qrCard: {
      background: "bg-gradient-to-br from-slate-800 via-blue-800/80 to-slate-800", // Slightly different from page for distinction
      border: "border-blue-500/30",
      universityNameColor: "text-white",
      studentNameColor: "text-white",
      infoTextColor: "text-gray-400",
      qrBgColor: "#FFFFFF", // Standard white background for QR code itself
      qrFgColor: "#1E3A8A", // Your primary dark blue for QR code dots
      borderRadius: "rounded-2xl", // Consistent with other UI elements
      padding: "p-6",
      shadow: "shadow-xl shadow-blue-500/20",
      modal: {
        // Main Container Layout - Consistent sizing and centering
        container: {
          maxWidth: "36rem", // Increased from 32rem to 36rem for more space
          width: "100%",
          height: "auto", // Let content determine height
          margin: "0 auto", // Proper centering
          display: "flex",
          flexDirection: "column",
          classes: "text-center overflow-hidden",
          padding: "p-8", // Add padding at container level for even distribution
        },

        // Institution Header - Consistent spacing
        header: {
          classes:
            "flex-shrink-0 bg-gradient-to-r from-transparent via-white/20 to-transparent backdrop-blur-md rounded-2xl py-2 px-8", // Removed border, increased opacity, adjusted padding for fade alignment
          marginBottom: "", // Remove individual margin, let space-y handle it
          title: {
            textSize: "text-3xl",
            marginBottom: "mb-2", // Small gap between title and subtitle
            fontWeight: "font-bold",
            lineHeight: "leading-tight",
            textShadow: "drop-shadow-lg", // Add text shadow
          },

          subtitle: {
            textSize: "text-lg",
            opacity: "opacity-90",
            textShadow: "drop-shadow-md", // Add text shadow
          },
        },

        // Student Info Section - Consistent spacing
        studentInfo: {
          wrapper: {
            classes: "flex-shrink-0", // Remove individual margin, let space-y handle it
          },
          container: {
            background: "bg-gradient-to-r from-transparent via-white/30 to-transparent", // Removed fade effect, increased opacity
            backdropBlur: "backdrop-blur-md",
            borderRadius: "rounded-2xl",
            shadow: "shadow-md",
            border: "", // Removed border completely
            padding: "px-8 py-2", // Adjusted padding for fade alignment
            marginBottom: "mb-4", // Gap between name and pronunciation
            maxWidth: "fit-content",
            minWidth: "auto",
            classes: "mx-auto",
            inlineStyles: {
              width: "fit-content",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            },
          },
          name: {
            textSize: "text-xl",
            fontWeight: "font-bold",
            textAlign: "text-center",
            classes: "m-0 drop-shadow-lg", // Added text shadow
            inlineStyles: {
              width: "100%",
            },
          },
          pronunciation: {
            wrapper: {
              classes: "mx-auto", // Center the pronunciation
              inlineStyles: {
                width: "100%",
                margin: "0 auto",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              },
            },
            maxWidth: "320px",
            textSize: "text-sm",
            opacity: "opacity-80",
            fontStyle: "italic",
            classes: "m-0",
          },
          // NEW: Academic info cards section
          academicCards: {
            wrapper: {
              classes: "flex flex-wrap gap-2 justify-center mx-auto",
              maxWidth: "400px",
              marginTop: "mt-4",
            },
            card: {
              base: "px-3 py-1 rounded-lg text-xs font-medium backdrop-blur-sm border",
              university: "bg-blue-500/30 border-blue-400/40 text-white", // Changed to blue theme
              programme: "bg-cyan-500/30 border-cyan-400/40 text-white", // Changed to cyan theme
              classification: "bg-emerald-500/30 border-emerald-400/40 text-white",
              seat: "bg-orange-500/30 border-orange-400/40 text-white",
            },
          },
        },

        // QR Code Section - Centralized styling
        qrCode: {
          wrapper: {
            classes: "flex items-center justify-center",
          },
          container: {
            background: "bg-white", // Default white background for QR codes
            backgroundFallback: "bg-gray-100", // Fallback if no specific color set
            padding: "p-3",
            borderRadius: "rounded-xl",
            shadow: "shadow-lg",
            classes: "",
          },
          image: {
            size: "w-52 h-52",
            borderRadius: "rounded-lg",
            classes: "",
          },
          loading: {
            container: {
              size: "w-52 h-52",
              background: "bg-gray-200",
              borderRadius: "rounded-lg",
              classes: "flex items-center justify-center",
            },
            spinner: {
              size: "w-8 h-8",
              border: "border-2 border-blue-600 border-t-transparent", // Changed to blue for ocean theme
              borderRadius: "rounded-full",
              animation: "animate-spin",
              classes: "",
            },
          },
        },

        // Action Buttons Section - Consistent spacing
        buttons: {
          wrapper: {
            classes: "flex-shrink-0", // Remove individual margin, let space-y handle it
            padding: "px-6", // Match container padding
          },
          container: {
            classes: "flex gap-4 mx-auto",
            maxWidth: "max-w-sm", // Increased from max-w-xs to accommodate longer text
          },
          individual: {
            classes: "flex-1 rounded-2xl py-3 backdrop-blur-sm transition-all duration-300 border-0",
          },
        },

        // Layout spacing - Centralized and consistent
        layout: {
          contentPadding: "p-0", // Remove all padding from content wrapper
          contentWrapper: "relative z-10 flex flex-col", // Remove h-full to prevent flex-1 expansion
          outerSpacing: "space-y-6", // Reduced from space-y-8 to space-y-6 for tighter spacing
          minHeight: "min-h-[650px]", // Increased from 600px to 650px for academic cards
          // Add container padding to the main modal container instead
          containerPadding: "p-8", // Move padding to container level
        },

        // Decorative elements (keep existing but ensure they don't interfere)
        decorative: {
          wrapper: "absolute inset-0 pointer-events-none overflow-hidden",
          elements: [
            // Keep existing decorative elements unchanged
            {
              type: "large",
              color: "yellow", // Changed to amber for ocean theme
              shape: "square",
              position: { top: "15%", left: "8%" },
              size: { width: "32px", height: "32px" },
              animation: "spin",
              duration: "120s",
            },
            {
              type: "large",
              color: "emerald",
              shape: "circle",
              position: { bottom: "20%", right: "15%" },
              size: { width: "32px", height: "32px" },
              animation: "pulse",
              duration: "4s",
            },
            // Medium shapes
            {
              type: "medium",
              color: "blue", // Changed to blue for ocean theme
              shape: "square",
              position: { top: "40%", left: "20%" },
              size: { width: "20px", height: "20px" },
              animation: "spin",
              duration: "90s",
            },
            {
              type: "medium",
              color: "teal",
              shape: "circle",
              position: { bottom: "50%", right: "25%" },
              size: { width: "20px", height: "20px" },
              animation: "pulse",
              duration: "4s",
            },
            // Small shapes
            {
              type: "small",
              color: "cyan", // Changed to cyan for ocean theme
              shape: "circle",
              position: { top: "25%", right: "12%" },
              size: { width: "12px", height: "12px" },
              animation: "bounce",
              duration: "4s",
            },
            {
              type: "small",
              color: "cyan",
              shape: "circle",
              position: { top: "60%", right: "10%" },
              size: { width: "12px", height: "12px" },
              animation: "bounce",
              duration: "4s",
            },
            {
              type: "small",
              color: "orange",
              shape: "square",
              position: { top: "75%", left: "25%" },
              size: { width: "12px", height: "12px" },
              animation: "spin",
              duration: "100s",
            },
            // Extra small shapes
            {
              type: "extraSmall",
              color: "blue", // Changed to blue for ocean theme
              shape: "square",
              position: { top: "10%", right: "30%" },
              size: { width: "8px", height: "8px" },
              animation: "spin",
              duration: "110s",
            },
            {
              type: "extraSmall",
              color: "green",
              shape: "square",
              position: { bottom: "60%", left: "5%" },
              size: { width: "8px", height: "8px" },
              animation: "spin",
              duration: "95s",
            },
          ],
          colors: {
            yellow: "bg-amber-400", // Changed to amber for ocean theme
            emerald: "bg-emerald-400",
            purple: "bg-blue-400", // Changed to blue for ocean theme
            teal: "bg-teal-400",
            pink: "bg-cyan-400", // Changed to cyan for ocean theme
            cyan: "bg-cyan-400",
            orange: "bg-orange-400",
            rose: "bg-blue-400", // Changed to blue for ocean theme
            green: "bg-emerald-400",
          },
          animations: {
            spin: "animate-spin",
            pulse: "animate-pulse",
            bounce: "animate-bounce",
            circlepulse: "animate-pulse",
          },
          shapes: {
            square: "rotate-45",
            circle: "rounded-full",
          },
        },
      },
      // NEW: Download version styling (for html2canvas)
      download: {
        container: {
          width: "500px",
          height: "700px",
          background: "linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)", // Blue gradient for ocean theme
          borderRadius: "24px",
          padding: "40px",
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-between",
        },
        header: {
          textAlign: "center",
          marginBottom: "30px",
        },
        title: {
          color: "#ffffff",
          fontSize: "32px",
          fontWeight: "bold",
          margin: "0 0 8px 0",
          lineHeight: "1.2",
        },
        subtitle: {
          color: "#ffffff",
          fontSize: "18px",
          margin: "0",
          opacity: "0.9",
        },
        qrContainer: {
          backgroundColor: "#ffffff",
          padding: "16px",
          borderRadius: "16px",
          boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
          marginBottom: "30px",
        },
        qrImage: {
          width: "240px",
          height: "240px",
          borderRadius: "8px",
          display: "block",
        },
        studentInfo: {
          textAlign: "center",
          marginBottom: "20px",
        },
        studentName: {
          backgroundColor: "rgba(59, 130, 246, 0.2)", // Blue for ocean theme
          backdropFilter: "blur(8px)",
          borderRadius: "16px",
          padding: "12px 24px",
          border: "1px solid rgba(147, 197, 253, 0.3)", // Blue border
          color: "#ffffff",
          fontSize: "22px",
          fontWeight: "bold",
          margin: "0 0 16px 0",
          display: "inline-block",
        },
        pronunciation: {
          color: "#d1d5db",
          fontSize: "14px",
          fontStyle: "italic",
          margin: "0 0 16px 0",
          opacity: "0.8",
        },
        academicCards: {
          display: "flex",
          flexWrap: "wrap",
          gap: "8px",
          justifyContent: "center",
          maxWidth: "400px",
          margin: "0 auto",
        },
        academicCard: {
          base: {
            padding: "6px 12px",
            borderRadius: "8px",
            fontSize: "12px",
            fontWeight: "500",
            border: "1px solid",
            color: "#ffffff",
          },
          university: {
            backgroundColor: "rgba(59, 130, 246, 0.3)", // Blue for ocean theme
            borderColor: "rgba(59, 130, 246, 0.4)",
          },
          programme: {
            backgroundColor: "rgba(6, 182, 212, 0.3)", // Cyan for ocean theme
            borderColor: "rgba(6, 182, 212, 0.4)",
          },
          classification: {
            backgroundColor: "rgba(16, 185, 129, 0.3)",
            borderColor: "rgba(16, 185, 129, 0.4)",
          },
          seat: {
            backgroundColor: "rgba(249, 115, 22, 0.3)",
            borderColor: "rgba(249, 115, 22, 0.4)",
          },
        },
      },
    },
  },
}

// ==============================
// AVATAR GRADIENTS
// ==============================

export const avatarGradients = [
  "bg-gradient-to-r from-pink-500 to-rose-500",
  "bg-gradient-to-r from-blue-500 to-cyan-500",
  "bg-gradient-to-r from-purple-500 to-indigo-500",
  "bg-gradient-to-r from-green-500 to-emerald-500",
  "bg-gradient-to-r from-orange-500 to-red-500",
  "bg-gradient-to-r from-teal-500 to-blue-500",
  "bg-gradient-to-r from-violet-500 to-purple-500",
  "bg-gradient-to-r from-amber-500 to-orange-500",
  "bg-gradient-to-r from-emerald-500 to-teal-500",
]

// ==============================
// ANIMATION GRADIENTS
// ==============================

export const animationGradients = {
  orbs: [
    "bg-gradient-to-r from-purple-400/20 to-pink-400/20",
    "bg-gradient-to-r from-blue-400/20 to-cyan-400/20",
    "bg-gradient-to-r from-emerald-400/20 to-teal-400/20",
  ],
  squares: [
    "bg-gradient-to-r from-yellow-400 to-orange-400",
    "bg-gradient-to-r from-purple-400 to-pink-400",
    "bg-gradient-to-r from-blue-400 to-cyan-400",
    "bg-gradient-to-r from-emerald-400 to-teal-400",
    "bg-gradient-to-r from-red-400 to-pink-400",
    "bg-gradient-to-r from-violet-400 to-purple-400",
    "bg-gradient-to-r from-cyan-400 to-blue-400",
    "bg-gradient-to-r from-orange-400 to-red-400",
    "bg-gradient-to-r from-green-400 to-emerald-400",
    "bg-gradient-to-r from-pink-400 to-purple-400",
    "bg-gradient-to-r from-indigo-400 to-blue-400",
  ],
  circles: [
    "bg-gradient-to-r from-pink-400 to-purple-400",
    "bg-gradient-to-r from-blue-400 to-cyan-400",
    "bg-gradient-to-r from-emerald-400 to-teal-400",
    "bg-gradient-to-r from-orange-400 to-red-400",
    "bg-gradient-to-r from-violet-400 to-purple-400",
    "bg-gradient-to-r from-green-400 to-emerald-400",
    "bg-gradient-to-r from-cyan-400 to-blue-400",
  ],
}

// ==============================
// UI CONSTANTS
// ==============================

export const ui = {
  borderRadius: {
    small: "rounded-2xl",
    medium: "rounded-3xl",
    large: "rounded-full",
  },
  shadows: {
    small: "shadow-lg",
    medium: "shadow-xl",
    large: "shadow-2xl",
    colored: "shadow-purple-500/25",
  },
  blur: {
    small: "blur",
    medium: "blur-xl",
    large: "blur-3xl",
  },
  typography: {
    sizes: {
      xs: "text-sm",
      sm: "text-base",
      md: "text-lg",
      lg: "text-xl",
      xl: "text-2xl",
      "2xl": "text-3xl",
      "3xl": "text-4xl md:text-6xl",
      "4xl": "text-5xl md:text-7xl",
    },
    weights: {
      normal: "font-normal",
      medium: "font-medium",
      semibold: "font-semibold",
      bold: "font-bold",
      black: "font-black",
    },
  },
  spacing: {
    container: {
      max: "max-w-6xl", // This will match the grid width
      search: "max-w-6xl", // Updated to match the grid width instead of max-w-3xl
    },
    padding: {
      page: "px-4 py-16",
      section: "p-8",
      card: "p-8 pb-6",
    },
    gap: {
      small: "gap-3",
      medium: "gap-4",
      large: "gap-8",
    },
  },
  grid: {
    responsive: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
  },
}

// ==============================
// ANIMATION SETTINGS
// ==============================

export const animations = {
  durations: {
    squares: {
      large: ["15s", "12s", "18s"],
      medium: ["14s", "16s", "13s"],
      small: ["10s", "11s", "8s", "9s", "12s"],
      extraSmall: ["6s", "7s", "5s", "6s", "8s"],
      bouncing: ["10s", "11s"],
    },
    circles: ["5s", "5s", "5s", "5s", "5s", "5s", "5s"], // Changed from 4s to 5s for slower animation
    transitions: {
      fast: "duration-300",
      medium: "duration-500",
      slow: "duration-1000",
    },
    feedback: {
      copied: 2000, // milliseconds
    },
  },
  keyframes: `
@keyframes spin {
  from { transform: rotate(45deg); }
  to { transform: rotate(405deg); }
}

@keyframes circlebounce {
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-8px) scale(1.03); }
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-15px); }
}

@keyframes circlepulse {
  0%, 100% { 
    transform: scale(0.9); 
    opacity: 0.4; 
  }
  50% { 
    transform: scale(1.15); 
    opacity: 0.8; 
  }
}
.text-shadow-sm { text-shadow: 0 1px 2px rgba(0,0,0,0.3); }
.text-shadow-md { text-shadow: 0 2px 4px rgba(0,0,0,0.3); }
.text-shadow-lg { text-shadow: 0 4px 8px rgba(0,0,0,0.3); }
`,
}

// ==============================
// CONTENT & COPY
// ==============================

export const content = {
  title: "Student QR",
  subtitle: "Portal",
  description:
    "Search for your name below to find your personalized QR code. You can copy or download it for scanning at graduation.",
  searchPlaceholder: "Start typing your name...",
  noResults: {
    title: "No Students Found",
    message: "We couldn't find any students matching",
    suggestion: "Try a different name or check your spelling",
  },
  qrModal: {
    title: "Graduation QR Code",
    eventName: `🎓 ${institution.graduationTitle} 2024`,
    copyButton: "Copy QR Code",
    copiedButton: "Copied!",
    downloadButton: "Download QR Code",
  },
  statusLabels: {
    ready: "QR Code Ready",
    active: "Active",
  },
  buttons: {
    viewQR: "View QR Code",
  },
}

// ==============================
// CURRENT THEME SELECTOR
// ==============================

// Change this to switch themes instantly!
export const currentTheme = themes.default // or themes.ocean

// Export everything as default
export default {
  institution,
  theme: {
    // MODIFIED: Spread currentTheme and add qrCard explicitly
    ...currentTheme,
    qrCard: currentTheme.qrCard || themes.default.qrCard, // Ensure qrCard is always available
  },
  avatarGradients,
  animationGradients,
  ui,
  animations,
  content,
}

// DEBUG: Log the academicInfo config to verify it exists
console.log("🔍 [DEBUG] Theme Config - academicInfo:", {
  container: themes.default.layout.academicInfo?.container,
  valueText: themes.default.layout.academicInfo?.valueText,
  cardMinHeight: themes.default.layout.graduationList.card.minHeight,
})

// Add this at the very bottom of the file:
console.log("Theme config loaded with institution:", {
  name: institution.name,
  slogan: institution.slogan,
  shortName: institution.shortName,
  fullDisplayName: institution.fullDisplayName,
  graduationTitle: institution.graduationTitle,
  systemName: institution.systemName,
})
