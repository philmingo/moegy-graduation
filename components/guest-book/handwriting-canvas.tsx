"use client"

import { useRef, useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Eraser, Pen, Undo, Redo, Trash2, Camera, X } from "lucide-react"
import { currentTheme } from "@/lib/theme-config"

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
  const cursorPosRef = useRef<{ x: number; y: number } | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const drawRafRef = useRef<number | null>(null)
  const pendingPointsRef = useRef<{ x: number; y: number }[]>([])
  const isProcessingDrawRef = useRef(false)
  
  const [tool, setTool] = useState<"pen" | "eraser">("pen")
  const [penColor, setPenColor] = useState("#000000")
  const [lineWidth, setLineWidth] = useState(3)
  const [history, setHistory] = useState<string[]>([])
  const [historyStep, setHistoryStep] = useState(-1)
  const [cursorPosition, setCursorPosition] = useState<{ x: number; y: number } | null>(null)

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // OPTIMIZATION: Remove willReadFrequently flag - it's for reading, not writing
    const ctx = canvas.getContext("2d", { 
      alpha: false, // No transparency needed, improves performance
      desynchronized: true // Allows canvas to render independently from DOM
    })
    if (!ctx) return

    // Set canvas size
    canvas.width = width
    canvas.height = height

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

  // OPTIMIZATION: Update cursor position - immediate during drawing, batched otherwise
  const updateCursorPosition = useCallback((e: MouseEvent | TouchEvent, immediate: boolean = false) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    let x: number, y: number

    if (e instanceof MouseEvent) {
      x = e.clientX - rect.left
      y = e.clientY - rect.top
    } else {
      const touch = e.touches[0] || e.changedTouches[0]
      if (!touch) return
      x = touch.clientX - rect.left
      y = touch.clientY - rect.top
    }

    // Store in ref for immediate access
    cursorPosRef.current = { x, y }

    // If drawing, update immediately to prevent cursor lag
    if (immediate || isDrawingRef.current) {
      setCursorPosition({ x, y })
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
    } else {
      // Batch cursor updates using RAF when not drawing
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      
      animationFrameRef.current = requestAnimationFrame(() => {
        setCursorPosition({ x, y })
      })
    }
  }, [])

  // Get coordinates relative to canvas
  const getCoordinates = useCallback((e: MouseEvent | TouchEvent): { x: number; y: number } => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    let canvasX, canvasY
    if (e instanceof MouseEvent) {
      canvasX = (e.clientX - rect.left) * scaleX
      canvasY = (e.clientY - rect.top) * scaleY
    } else {
      const touch = e.touches[0] || e.changedTouches[0]
      canvasX = (touch.clientX - rect.left) * scaleX
      canvasY = (touch.clientY - rect.top) * scaleY
    }

    return { x: canvasX, y: canvasY }
  }, [])

  // Start drawing
  const startDrawing = useCallback((e: MouseEvent | TouchEvent) => {
    const ctx = contextRef.current
    if (!ctx) return

    e.preventDefault()
    isDrawingRef.current = true
    updateCursorPosition(e, true) // Immediate update when starting

    const { x, y } = getCoordinates(e)

    ctx.beginPath()
    ctx.moveTo(x, y)

    // CRITICAL: Set tool properties fresh for each stroke to support multi-color drawing
    if (tool === "pen") {
      ctx.strokeStyle = penColor
      ctx.lineWidth = lineWidth
      ctx.globalCompositeOperation = "source-over"
    } else {
      ctx.strokeStyle = "#ffffff"
      ctx.lineWidth = lineWidth * 3
      ctx.globalCompositeOperation = "destination-out"
    }
  }, [tool, penColor, lineWidth, getCoordinates, updateCursorPosition])

  // Process pending draw points in batches using RAF
  const processPendingPoints = useCallback(() => {
    if (isProcessingDrawRef.current || pendingPointsRef.current.length === 0) return
    
    isProcessingDrawRef.current = true
    
    drawRafRef.current = requestAnimationFrame(() => {
      const ctx = contextRef.current
      if (!ctx || !isDrawingRef.current) {
        isProcessingDrawRef.current = false
        return
      }

      // Batch process all pending points at once
      const points = pendingPointsRef.current.splice(0)
      
      for (const point of points) {
        ctx.lineTo(point.x, point.y)
      }
      
      // Single stroke() call for all points - CRITICAL for performance
      if (points.length > 0) {
        ctx.stroke()
      }
      
      isProcessingDrawRef.current = false
      
      // If more points accumulated while processing, schedule another batch
      if (pendingPointsRef.current.length > 0) {
        processPendingPoints()
      }
    })
  }, [])

  // OPTIMIZATION: Draw function - batch points and process with RAF
  const draw = useCallback((e: MouseEvent | TouchEvent) => {
    e.preventDefault()
    
    // Update cursor immediately while drawing to prevent lag
    updateCursorPosition(e, true)

    if (!isDrawingRef.current || !contextRef.current) return

    const { x, y } = getCoordinates(e)

    // Add point to batch queue instead of drawing immediately
    pendingPointsRef.current.push({ x, y })
    
    // Schedule batch processing if not already scheduled
    if (!isProcessingDrawRef.current) {
      processPendingPoints()
    }
  }, [getCoordinates, updateCursorPosition, processPendingPoints])

  // OPTIMIZATION: Debounced save - only save to history and emit after drawing stops
  const stopDrawing = useCallback(() => {
    if (!isDrawingRef.current || !contextRef.current) return

    isDrawingRef.current = false
    
    // Process any remaining pending points before closing
    if (pendingPointsRef.current.length > 0 && contextRef.current) {
      const ctx = contextRef.current
      for (const point of pendingPointsRef.current) {
        ctx.lineTo(point.x, point.y)
      }
      ctx.stroke()
      pendingPointsRef.current = []
    }
    
    contextRef.current.closePath()

    // Clear any pending save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    // Increased debounce to reduce GC pressure from toDataURL calls
    saveTimeoutRef.current = setTimeout(() => {
      const canvas = canvasRef.current
      if (canvas) {
        saveToHistory(canvas)
        
        // Emit image data
        if (onImageChange) {
          const imageData = canvas.toDataURL("image/png")
          onImageChange(imageData)
        }
      }
    }, 300) // Increased to 300ms to batch multiple strokes
  }, [saveToHistory, onImageChange])

  // Handle mouse enter - prepare for cursor display and resume drawing if button is held
  const handleMouseEnter = useCallback((e: MouseEvent) => {
    updateCursorPosition(e)
    
    // If mouse re-enters with button pressed, resume drawing
    if (e.buttons === 1 && !isDrawingRef.current) {
      // Start a new path from current position
      const ctx = contextRef.current
      if (!ctx) return
      
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
        ctx.strokeStyle = "#ffffff"
        ctx.lineWidth = lineWidth * 3
        ctx.globalCompositeOperation = "destination-out"
      }
    }
  }, [updateCursorPosition, getCoordinates, tool, penColor, lineWidth])

  // Handle mouse leave - hide cursor and only stop drawing if actually drawing
  const handleMouseLeave = useCallback(() => {
    setCursorPosition(null)
    // Only stop drawing if we were actually drawing
    if (isDrawingRef.current) {
      stopDrawing()
    }
  }, [stopDrawing])

  // OPTIMIZATION: Set up event listeners with passive flags for better performance
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Mouse events
    canvas.addEventListener("mouseenter", handleMouseEnter as any)
    canvas.addEventListener("mousedown", startDrawing as any)
    canvas.addEventListener("mousemove", draw as any)
    canvas.addEventListener("mouseup", stopDrawing)
    canvas.addEventListener("mouseleave", handleMouseLeave)

    // Touch events with passive: false to allow preventDefault
    canvas.addEventListener("touchstart", startDrawing as any, { passive: false })
    canvas.addEventListener("touchmove", draw as any, { passive: false })
    canvas.addEventListener("touchend", stopDrawing)

    return () => {
      canvas.removeEventListener("mouseenter", handleMouseEnter as any)
      canvas.removeEventListener("mousedown", startDrawing as any)
      canvas.removeEventListener("mousemove", draw as any)
      canvas.removeEventListener("mouseup", stopDrawing)
      canvas.removeEventListener("mouseleave", handleMouseLeave)
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
      if (drawRafRef.current) {
        cancelAnimationFrame(drawRafRef.current)
      }
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
      // Clear pending points
      pendingPointsRef.current = []
    }
  }, [])

  // Clear canvas
  const clearCanvas = useCallback(() => {
    const ctx = contextRef.current
    const canvas = canvasRef.current
    if (!ctx || !canvas) return

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
            <input
              type="color"
              value={penColor}
              onChange={(e) => setPenColor(e.target.value)}
              className="w-10 h-10 rounded cursor-pointer"
              title="Pen Color"
            />
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

      {/* Canvas */}
      <div className="rounded-lg overflow-hidden border-2 border-purple-500/30 shadow-xl relative">
        <canvas
          ref={canvasRef}
          className="max-w-full h-auto touch-none cursor-none bg-white"
          style={{ display: "block", width: "100%", height: "auto" }}
        />
        
        {/* Custom Cursor Indicator */}
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
