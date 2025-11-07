"use client"

import { useRef, useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Eraser, Pen, Undo, Redo, Trash2, Camera, X } from "lucide-react"
import { currentTheme } from "@/lib/theme-config"
import { HexColorPicker } from "react-colorful"

interface HandwritingCanvasProps {
  onImageChange?: (imageData: string) => void
  className?: string
  width?: number
  height?: number
  onAttachPhoto?: () => void
  studentPhotoData?: string
  onRemovePhoto?: () => void
  isSaving?: boolean
}

export function HandwritingCanvas({ 
  onImageChange, 
  className = "", 
  width = 1200, 
  height = 600,
  onAttachPhoto,
  studentPhotoData,
  onRemovePhoto,
  isSaving = false
}: HandwritingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const contextRef = useRef<CanvasRenderingContext2D | null>(null)
  const isDrawingRef = useRef(false)
  const rectRef = useRef<DOMRect | null>(null) // Cache for getBoundingClientRect
  const animationFrameRef = useRef<number | null>(null)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const strokeRafRef = useRef<number | null>(null) // For batched stroke() calls
  const needsStrokeRef = useRef(false) // Flag to track if we need to stroke
  const cursorUpdateRafRef = useRef<number | null>(null) // For batched cursor updates
  const pendingCursorPositionRef = useRef<{ x: number; y: number } | null>(null) // Pending cursor position
  
  const [tool, setTool] = useState<"pen" | "eraser">("pen")
  const [penColor, setPenColor] = useState("#a855f7") // Purple-500 from theme
  const [lineWidth, setLineWidth] = useState(3)
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false)
  const [history, setHistory] = useState<string[]>([])
  const [historyStep, setHistoryStep] = useState(-1)
  const [cursorPosition, setCursorPosition] = useState<{ x: number; y: number } | null>(null)

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Get context with alpha enabled for proper erasing
    const ctx = canvas.getContext("2d", { 
      alpha: true, // Need alpha for destination-out to work properly
      desynchronized: true // Allows canvas to render independently from DOM
    })
    if (!ctx) return

    // Handle high-DPI displays (e.g., 4K at 300% scaling)
    const dpr = window.devicePixelRatio || 1

    console.log("🎨 [CANVAS-INIT] Device Pixel Ratio:", dpr)
    console.log("🎨 [CANVAS-INIT] Requested dimensions:", { width, height })

    // Set actual canvas size (accounting for device pixel ratio)
    canvas.width = width * dpr
    canvas.height = height * dpr

    // REMOVED: Don't set explicit CSS size - let the 100% width/auto height handle it
    // This allows the canvas to be responsive within its container
    // canvas.style.width = `${width}px`
    // canvas.style.height = `${height}px`

    console.log("🎨 [CANVAS-INIT] Canvas internal size:", { width: canvas.width, height: canvas.height })
    console.log("🎨 [CANVAS-INIT] Canvas requested dimensions:", { width, height })
    
    const rect = canvas.getBoundingClientRect()
    console.log("🎨 [CANVAS-INIT] Canvas rect:", { 
      left: rect.left, 
      top: rect.top, 
      width: rect.width, 
      height: rect.height 
    })
    
    // Check if canvas has been resized by CSS
    const computedStyle = window.getComputedStyle(canvas)
    console.log("🎨 [CANVAS-INIT] Computed CSS size:", {
      width: computedStyle.width,
      height: computedStyle.height,
      display: computedStyle.display,
      position: computedStyle.position
    })
    
    // Check parent container
    const parent = canvas.parentElement
    if (parent) {
      const parentRect = parent.getBoundingClientRect()
      console.log("🎨 [CANVAS-INIT] Parent container rect:", {
        left: parentRect.left,
        top: parentRect.top,
        width: parentRect.width,
        height: parentRect.height
      })
      console.log("🎨 [CANVAS-INIT] Offset from parent:", {
        left: rect.left - parentRect.left,
        top: rect.top - parentRect.top
      })
    }

    // Scale the context to match device pixel ratio for crisp rendering
    ctx.scale(dpr, dpr)
    console.log("🎨 [CANVAS-INIT] Context scaled by:", dpr)

    // Fill with white background
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, width, height)

    // Set drawing properties for smooth lines
    ctx.lineCap = "round"
    ctx.lineJoin = "round"

    contextRef.current = ctx

    // Save initial state (reset history when canvas is resized)
    const imageData = canvas.toDataURL("image/png")
    setHistory([imageData])
    setHistoryStep(0)
  }, [width, height])

  // Clear cached rect on window resize
  useEffect(() => {
    const handleResize = () => {
      rectRef.current = null
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Save canvas state to history - using functional updates to avoid stale closures
  const saveToHistory = useCallback((canvas: HTMLCanvasElement) => {
    // OPTIMIZATION: Use lower quality JPEG for history to reduce memory pressure
    const imageData = canvas.toDataURL("image/png")
    
    setHistoryStep((currentStep) => {
      setHistory((prev) => {
        // Clear any future history when saving a new state
        const newHistory = prev.slice(0, currentStep + 1)
        newHistory.push(imageData)
        // Limit history to 20 entries to prevent memory issues (reduced from 50)
        if (newHistory.length > 20) {
          return newHistory.slice(-20)
        }
        return newHistory
      })
      return currentStep + 1
    })
  }, [])

  // OPTIMIZATION: Update cursor position - batched to avoid excessive re-renders
  const updateCursorPosition = useCallback((e: MouseEvent | TouchEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Get fresh rect if we don't have one cached (not drawing)
    // Use cached rect if drawing to ensure consistency
    const rect = rectRef.current || canvas.getBoundingClientRect()
    let mouseX: number, mouseY: number

    if (e instanceof MouseEvent) {
      mouseX = e.clientX - rect.left
      mouseY = e.clientY - rect.top
    } else {
      const touch = e.touches[0] || e.changedTouches[0]
      if (!touch) return
      mouseX = touch.clientX - rect.left
      mouseY = touch.clientY - rect.top
    }

    // Store pending position
    pendingCursorPositionRef.current = { x: mouseX, y: mouseY }
    
    // Batch cursor position updates with RAF
    if (!cursorUpdateRafRef.current) {
      cursorUpdateRafRef.current = requestAnimationFrame(() => {
        if (pendingCursorPositionRef.current) {
          setCursorPosition(pendingCursorPositionRef.current)
        }
        cursorUpdateRafRef.current = null
      })
    }
  }, [])

  // Get coordinates relative to canvas - INDUSTRY STANDARD APPROACH
  // Work in CSS pixel space since we use ctx.scale(dpr, dpr)
  const getCoordinates = useCallback((e: MouseEvent | TouchEvent): { x: number; y: number } => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }

    // CRITICAL: Always use cached rect to ensure cursor and drawing are in sync
    const rect = rectRef.current
    if (!rect) {
      console.error("❌ [DRAWING] No cached rect available!")
      return { x: 0, y: 0 }
    }

    // Get mouse position relative to canvas
    let mouseX: number, mouseY: number
    
    if (e instanceof MouseEvent) {
      mouseX = e.clientX - rect.left
      mouseY = e.clientY - rect.top
    } else {
      const touch = e.touches[0] || e.changedTouches[0]
      mouseX = touch.clientX - rect.left
      mouseY = touch.clientY - rect.top
    }
    
    // CRITICAL: If canvas is scaled by CSS, we need to map coordinates
    // from display space to canvas space
    const scaleX = width / rect.width
    const scaleY = height / rect.height
    
    const canvasX = mouseX * scaleX
    const canvasY = mouseY * scaleY
    
    console.log("✏️ [DRAWING] Draw coordinates:", {
      mouseX,
      mouseY,
      rectWidth: rect.width,
      rectHeight: rect.height,
      canvasWidth: width,
      canvasHeight: height,
      scaleX,
      scaleY,
      canvasX,
      canvasY
    })
    
    return { x: canvasX, y: canvasY }
  }, [width, height])

  // Start drawing
  const startDrawing = useCallback((e: MouseEvent | TouchEvent) => {
    const ctx = contextRef.current
    const canvas = canvasRef.current
    if (!ctx || !canvas) return

    e.preventDefault()
    
    // Close color picker when starting to draw
    setIsColorPickerOpen(false)
    
    isDrawingRef.current = true
    
    // Cache getBoundingClientRect for the duration of this drawing stroke
    rectRef.current = canvas.getBoundingClientRect()
    
    console.log("🎬 [START-DRAW] Cached rect:", {
      left: rectRef.current.left,
      top: rectRef.current.top,
      width: rectRef.current.width,
      height: rectRef.current.height
    })
    
    updateCursorPosition(e)

    const { x, y } = getCoordinates(e)
    
    console.log("🎬 [START-DRAW] Starting at:", { x, y })

    ctx.beginPath()
    ctx.moveTo(x, y)

    // CRITICAL: Set tool properties fresh for each stroke to support multi-color drawing
    if (tool === "pen") {
      ctx.strokeStyle = penColor
      ctx.lineWidth = lineWidth
      ctx.globalCompositeOperation = "source-over"
    } else {
      // Eraser mode - use destination-out to actually erase
      ctx.globalCompositeOperation = "destination-out"
      ctx.lineWidth = lineWidth * 3
      ctx.strokeStyle = "rgba(0,0,0,1)" // Color doesn't matter with destination-out
    }
  }, [tool, penColor, lineWidth, getCoordinates, updateCursorPosition])

  // INDUSTRY STANDARD: Hybrid approach - immediate lineTo, batched stroke
  const draw = useCallback((e: MouseEvent | TouchEvent) => {
    e.preventDefault()
    
    // Always update cursor position for smooth tracking
    updateCursorPosition(e)

    // Only draw if actively drawing
    if (!isDrawingRef.current || !contextRef.current) return

    const { x, y } = getCoordinates(e)
    const ctx = contextRef.current

    // Immediately add point to path (cheap operation)
    ctx.lineTo(x, y)
    
    // Mark that we need to stroke
    needsStrokeRef.current = true
    
    // Schedule a stroke if not already scheduled
    if (!strokeRafRef.current) {
      strokeRafRef.current = requestAnimationFrame(() => {
        if (needsStrokeRef.current && contextRef.current) {
          contextRef.current.stroke()
          needsStrokeRef.current = false
        }
        strokeRafRef.current = null
      })
    }
  }, [getCoordinates, updateCursorPosition])

  // OPTIMIZATION: Debounced save - only save to history and emit after drawing stops
  const stopDrawing = useCallback(() => {
    if (!isDrawingRef.current || !contextRef.current) return

    // Final stroke if needed
    if (needsStrokeRef.current && contextRef.current) {
      contextRef.current.stroke()
      needsStrokeRef.current = false
    }
    
    // Cancel any pending stroke RAF
    if (strokeRafRef.current) {
      cancelAnimationFrame(strokeRafRef.current)
      strokeRafRef.current = null
    }

    isDrawingRef.current = false
    rectRef.current = null // Clear cached rect
    
    contextRef.current.closePath()

    // Clear any pending save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    // CRITICAL: Delay toDataURL to avoid blocking during active drawing
    // At 300% DPI, toDataURL can take 50-200ms
    saveTimeoutRef.current = setTimeout(() => {
      const canvas = canvasRef.current
      if (canvas && !isDrawingRef.current) {  // Only save if not drawing again
        saveToHistory(canvas)
        
        // Emit image data
        if (onImageChange) {
          const imageData = canvas.toDataURL("image/png")
          onImageChange(imageData)
        }
      }
    }, 500) // Longer delay to ensure we're done drawing
  }, [saveToHistory, onImageChange])

  // Handle mouse enter - prepare for cursor display and resume drawing if button is held
  const handleMouseEnter = useCallback((e: MouseEvent) => {
    // Refresh cached rect when re-entering
    const canvas = canvasRef.current
    if (canvas && isDrawingRef.current) {
      rectRef.current = canvas.getBoundingClientRect()
    }
    
    updateCursorPosition(e)
    
    // If mouse re-enters with button pressed, resume drawing
    if (e.buttons === 1 && !isDrawingRef.current) {
      // Start a new path from current position
      const ctx = contextRef.current
      if (!ctx || !canvas) return
      
      // Cache rect for this drawing session
      rectRef.current = canvas.getBoundingClientRect()
      
      const { x, y } = getCoordinates(e)
      isDrawingRef.current = true
      
      ctx.beginPath()
      ctx.moveTo(x, y)
      
      // Set tool properties
      if (tool === "pen") {
        ctx.strokeStyle = penColor
        ctx.lineWidth = lineWidth
        ctx.globalCompositeOperation = "source-over"
      } else {
        // Eraser mode - use destination-out to actually erase
        ctx.globalCompositeOperation = "destination-out"
        ctx.lineWidth = lineWidth * 3
        ctx.strokeStyle = "rgba(0,0,0,1)" // Color doesn't matter with destination-out
      }
    } else if (e.buttons === 1 && isDrawingRef.current) {
      // Continue existing drawing path
      const { x, y } = getCoordinates(e)
      const ctx = contextRef.current
      if (ctx) {
        ctx.lineTo(x, y)
        needsStrokeRef.current = true
      }
    }
  }, [updateCursorPosition, getCoordinates, tool, penColor, lineWidth])

  // Handle mouse leave - hide cursor but DON'T stop drawing
  const handleMouseLeave = useCallback(() => {
    setCursorPosition(null)
    // Don't stop drawing - user might drag back in
  }, [])

  // OPTIMIZATION: Set up event listeners with passive flags for better performance
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Mouse events on canvas
    canvas.addEventListener("mouseenter", handleMouseEnter as any)
    canvas.addEventListener("mousedown", startDrawing as any)
    canvas.addEventListener("mousemove", draw as any)
    canvas.addEventListener("mouseleave", handleMouseLeave)

    // Global mouseup to catch mouse release anywhere (even outside canvas)
    const handleGlobalMouseUp = () => {
      if (isDrawingRef.current) {
        stopDrawing()
      }
    }
    window.addEventListener("mouseup", handleGlobalMouseUp)

    // Touch events with passive: false to allow preventDefault
    canvas.addEventListener("touchstart", startDrawing as any, { passive: false })
    canvas.addEventListener("touchmove", draw as any, { passive: false })
    canvas.addEventListener("touchend", stopDrawing)

    return () => {
      canvas.removeEventListener("mouseenter", handleMouseEnter as any)
      canvas.removeEventListener("mousedown", startDrawing as any)
      canvas.removeEventListener("mousemove", draw as any)
      canvas.removeEventListener("mouseleave", handleMouseLeave)
      window.removeEventListener("mouseup", handleGlobalMouseUp)
      canvas.removeEventListener("touchstart", startDrawing as any)
      canvas.removeEventListener("touchmove", draw as any)
      canvas.removeEventListener("touchend", stopDrawing)
    }
  }, [startDrawing, draw, stopDrawing, handleMouseEnter, handleMouseLeave])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      if (strokeRafRef.current) {
        cancelAnimationFrame(strokeRafRef.current)
      }
      if (cursorUpdateRafRef.current) {
        cancelAnimationFrame(cursorUpdateRafRef.current)
      }
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  // Clear canvas
  const clearCanvas = useCallback(() => {
    const ctx = contextRef.current
    const canvas = canvasRef.current
    if (!ctx || !canvas) return

    // Reset to normal drawing mode
    ctx.globalCompositeOperation = "source-over"
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, width, height)

    saveToHistory(canvas)

    if (onImageChange) {
      const imageData = canvas.toDataURL("image/png")
      onImageChange(imageData)
    }
  }, [width, height, saveToHistory, onImageChange])

  // Undo
  const undo = useCallback(() => {
    const ctx = contextRef.current
    const canvas = canvasRef.current
    if (historyStep <= 0 || !ctx || !canvas) return

    const newStep = historyStep - 1
    const img = new Image()
    img.src = history[newStep]
    img.onload = () => {
      // Reset composite operation before clearing
      ctx.globalCompositeOperation = "source-over"
      ctx.clearRect(0, 0, width, height)
      ctx.drawImage(img, 0, 0)
      setHistoryStep(newStep)

      if (onImageChange) {
        onImageChange(history[newStep])
      }
    }
  }, [historyStep, history, width, height, onImageChange])

  // Redo
  const redo = useCallback(() => {
    const ctx = contextRef.current
    const canvas = canvasRef.current
    if (historyStep >= history.length - 1 || !ctx || !canvas) return

    const newStep = historyStep + 1
    const img = new Image()
    img.src = history[newStep]
    img.onload = () => {
      // Reset composite operation before clearing
      ctx.globalCompositeOperation = "source-over"
      ctx.clearRect(0, 0, width, height)
      ctx.drawImage(img, 0, 0)
      setHistoryStep(newStep)

      if (onImageChange) {
        onImageChange(history[newStep])
      }
    }
  }, [historyStep, history, width, height, onImageChange])

  const theme = currentTheme

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      {/* Tools */}
      <div className={`flex items-center gap-2 p-3 rounded-lg ${theme.glass.standard}`}>
        {/* Pen/Eraser Toggle */}
        <div className="flex gap-1">
          <Button
            type="button"
            size="sm"
            variant={tool === "pen" ? "default" : "outline"}
            onClick={() => setTool("pen")}
            className={tool === "pen" ? `${theme.primary.gradient} text-white` : "text-white"}
          >
            <Pen className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="sm"
            variant={tool === "eraser" ? "default" : "outline"}
            onClick={() => setTool("eraser")}
            className={tool === "eraser" ? `${theme.primary.gradient} text-white` : "text-white"}
          >
            <Eraser className="h-4 w-4" />
          </Button>
        </div>

        <div className="w-px h-8 bg-white/20" />

        {/* Color Picker */}
        {tool === "pen" && (
          <>
            <div className="flex items-center gap-2">
              {/* Quick Color Buttons */}
              <div className="flex gap-1.5">
                {[
                  { color: "#000000", label: "Black" },
                  { color: "#ef4444", label: "Red" },
                  { color: "#22c55e", label: "Green" },
                  { color: "#3b82f6", label: "Blue" },
                  { color: "#a855f7", label: "Purple" },
                  { color: "#ec4899", label: "Pink" },
                ].map(({ color, label }) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => {
                      setPenColor(color)
                      setIsColorPickerOpen(false)
                    }}
                    className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${
                      penColor === color
                        ? "border-white shadow-lg scale-110"
                        : "border-white/40 hover:border-white/60"
                    }`}
                    style={{ backgroundColor: color }}
                    title={label}
                  />
                ))}
              </div>

              {/* Custom Color Picker with Popover */}
              <Popover open={isColorPickerOpen} onOpenChange={setIsColorPickerOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="w-10 h-10 rounded border-2 border-white/40 hover:border-white/60 transition-all hover:scale-105 relative"
                    style={{ backgroundColor: penColor }}
                    title="Custom Color Picker"
                  >
                    <div className="absolute inset-0 rounded" style={{ 
                      background: `conic-gradient(
                        red, yellow, lime, cyan, blue, magenta, red
                      )`,
                      opacity: 0.3
                    }} />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-3 bg-slate-900/95 backdrop-blur-xl border-white/20">
                  <HexColorPicker color={penColor} onChange={setPenColor} />
                  <div className="mt-3 flex items-center gap-2">
                    <input
                      type="text"
                      value={penColor}
                      onChange={(e) => setPenColor(e.target.value)}
                      className="flex-1 px-2 py-1 rounded bg-white/10 text-white text-sm border border-white/20 focus:outline-none focus:border-purple-500"
                      placeholder="#000000"
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setIsColorPickerOpen(false)}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                    >
                      Done
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <div className="w-px h-8 bg-white/20" />
          </>
        )}

        {/* Line Width */}
        <div className="flex items-center gap-2">
          <span className={`text-sm ${theme.text.secondary}`}>Size:</span>
          <input
            type="range"
            min="1"
            max="20"
            value={lineWidth}
            onChange={(e) => setLineWidth(Number(e.target.value))}
            className="w-24"
          />
          <span className={`text-sm ${theme.text.secondary} w-8`}>{lineWidth}px</span>
        </div>

        <div className="w-px h-8 bg-white/20" />

        {/* History Controls */}
        <div className="flex gap-1">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={undo}
            disabled={historyStep <= 0}
            className="text-white disabled:text-gray-500"
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={redo}
            disabled={historyStep >= history.length - 1}
            className="text-white disabled:text-gray-500"
          >
            <Redo className="h-4 w-4" />
          </Button>
        </div>

        <div className="w-px h-8 bg-white/20" />

        {/* Clear */}
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={clearCanvas}
          className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
        >
          <Trash2 className="h-4 w-4" />
        </Button>

        {/* Attach Photo Button - Far Right */}
        {onAttachPhoto && (
          <>
            <div className="flex-1" />
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={onAttachPhoto}
                disabled={isSaving}
                className="text-white hover:bg-white/20"
              >
                <Camera className="h-4 w-4 mr-2" />
                {studentPhotoData ? "Change Photo" : "Attach Photo"}
              </Button>
              {studentPhotoData && (
                <div className="relative w-10 h-10 rounded-lg overflow-hidden border-2 border-purple-400">
                  <img
                    src={studentPhotoData}
                    alt="Student preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={onRemovePhoto}
                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 transition-colors"
                    disabled={isSaving}
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Canvas Container */}
      <div className="rounded-lg overflow-hidden border-2 border-purple-500/30 shadow-xl relative">
        {/* Canvas Wrapper - for positioning cursor relative to canvas */}
        <div className="relative">
          <canvas
            ref={canvasRef}
            className="touch-none cursor-none bg-white"
            style={{ display: "block", width: "100%", height: "auto" }}
          />
          
          {/* Custom Cursor Indicator - positioned relative to canvas */}
          {cursorPosition && (
            <div
              className="absolute pointer-events-none"
              style={{
                left: cursorPosition.x,
                top: cursorPosition.y,
                transform: "translate(-50%, -50%)",
              }}
            >
            {tool === "pen" ? (
              <div
                className="rounded-full shadow-xl"
                style={{
                  width: `${lineWidth * 3}px`,
                  height: `${lineWidth * 3}px`,
                  backgroundColor: penColor,
                  border: `3px solid ${penColor === '#FFFFFF' || penColor === '#ffffff' ? '#000000' : '#FFFFFF'}`,
                  boxShadow: '0 0 0 1px rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.4)',
                }}
              />
            ) : (
              <div
                className="rounded-full bg-gray-300 opacity-70"
                style={{
                  width: `${lineWidth * 3}px`,
                  height: `${lineWidth * 3}px`,
                  border: '3px solid #666666',
                  boxShadow: '0 0 0 1px rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.4)',
                }}
              />
            )}
          </div>
        )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className={`text-sm ${theme.text.muted}`}>
          Draw your message using a stylus, mouse, or touch
        </p>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: penColor }}></div>
            <span className={`text-xs ${theme.text.secondary}`}>Pen Color</span>
          </div>
        </div>
      </div>
    </div>
  )
}
