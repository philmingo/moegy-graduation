"use client"

import { useRef, useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Eraser, Pen, Undo, Redo, Trash2 } from "lucide-react"
import { currentTheme } from "@/lib/theme-config"

interface HandwritingCanvasProps {
  onImageChange?: (imageData: string) => void
  className?: string
  width?: number
  height?: number
}

export function HandwritingCanvas({ 
  onImageChange, 
  className = "", 
  width = 1200, 
  height = 600 
}: HandwritingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null)
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

    const ctx = canvas.getContext("2d", { willReadFrequently: true })
    if (!ctx) return

    // Set canvas size
    canvas.width = width
    canvas.height = height

    // Fill with white background
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, width, height)

    // Set drawing properties
    ctx.lineCap = "round"
    ctx.lineJoin = "round"

    setContext(ctx)

    // Save initial state
    saveToHistory(canvas)
  }, [width, height])

  // Save canvas state to history
  const saveToHistory = useCallback((canvas: HTMLCanvasElement) => {
    const imageData = canvas.toDataURL("image/png")
    setHistory((prev) => {
      const newHistory = prev.slice(0, historyStep + 1)
      newHistory.push(imageData)
      return newHistory
    })
    setHistoryStep((prev) => prev + 1)
  }, [historyStep])

  // Update cursor position for display
  const updateCursorPosition = useCallback((e: MouseEvent | TouchEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()

    if (e instanceof MouseEvent) {
      setCursorPosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      })
    } else {
      const touch = e.touches[0] || e.changedTouches[0]
      if (touch) {
        setCursorPosition({
          x: touch.clientX - rect.left,
          y: touch.clientY - rect.top,
        })
      }
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
    if (!context) return

    e.preventDefault()
    updateCursorPosition(e) // Update cursor position when starting to draw
    setIsDrawing(true)

    const { x, y } = getCoordinates(e)

    context.beginPath()
    context.moveTo(x, y)

    // Set tool properties
    if (tool === "pen") {
      context.strokeStyle = penColor
      context.lineWidth = lineWidth
      context.globalCompositeOperation = "source-over"
    } else {
      context.strokeStyle = "#ffffff"
      context.lineWidth = lineWidth * 3
      context.globalCompositeOperation = "destination-out"
    }
  }, [context, tool, penColor, lineWidth, getCoordinates, updateCursorPosition])

  // Draw
  const draw = useCallback((e: MouseEvent | TouchEvent) => {
    e.preventDefault()
    updateCursorPosition(e) // Always update cursor position on move

    if (!isDrawing || !context) return

    const { x, y } = getCoordinates(e)

    context.lineTo(x, y)
    context.stroke()
  }, [isDrawing, context, getCoordinates, updateCursorPosition])

  // Stop drawing
  const stopDrawing = useCallback(() => {
    if (!isDrawing || !context) return

    setIsDrawing(false)
    context.closePath()

    // Save to history
    const canvas = canvasRef.current
    if (canvas) {
      saveToHistory(canvas)
      
      // Emit image data
      if (onImageChange) {
        const imageData = canvas.toDataURL("image/png")
        onImageChange(imageData)
      }
    }
  }, [isDrawing, context, saveToHistory, onImageChange])

  // Handle mouse enter - prepare for cursor display
  const handleMouseEnter = useCallback((e: MouseEvent) => {
    updateCursorPosition(e)
  }, [updateCursorPosition])

  // Handle mouse leave - hide cursor and stop drawing
  const handleMouseLeave = useCallback(() => {
    setCursorPosition(null)
    stopDrawing()
  }, [stopDrawing])

  // Set up event listeners
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Mouse events
    canvas.addEventListener("mouseenter", handleMouseEnter as any)
    canvas.addEventListener("mousedown", startDrawing as any)
    canvas.addEventListener("mousemove", draw as any)
    canvas.addEventListener("mouseup", stopDrawing)
    canvas.addEventListener("mouseleave", handleMouseLeave)

    // Touch events
    canvas.addEventListener("touchstart", startDrawing as any)
    canvas.addEventListener("touchmove", draw as any)
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

  // Clear canvas
  const clearCanvas = useCallback(() => {
    if (!context || !canvasRef.current) return

    context.fillStyle = "#ffffff"
    context.fillRect(0, 0, width, height)

    saveToHistory(canvasRef.current)

    if (onImageChange) {
      const imageData = canvasRef.current.toDataURL("image/png")
      onImageChange(imageData)
    }
  }, [context, width, height, saveToHistory, onImageChange])

  // Undo
  const undo = useCallback(() => {
    if (historyStep <= 0 || !context || !canvasRef.current) return

    const newStep = historyStep - 1
    const img = new Image()
    img.src = history[newStep]
    img.onload = () => {
      context.clearRect(0, 0, width, height)
      context.drawImage(img, 0, 0)
      setHistoryStep(newStep)

      if (onImageChange) {
        onImageChange(history[newStep])
      }
    }
  }, [historyStep, history, context, width, height, onImageChange])

  // Redo
  const redo = useCallback(() => {
    if (historyStep >= history.length - 1 || !context || !canvasRef.current) return

    const newStep = historyStep + 1
    const img = new Image()
    img.src = history[newStep]
    img.onload = () => {
      context.clearRect(0, 0, width, height)
      context.drawImage(img, 0, 0)
      setHistoryStep(newStep)

      if (onImageChange) {
        onImageChange(history[newStep])
      }
    }
  }, [historyStep, history, context, width, height, onImageChange])

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
                className="rounded-full bg-gray-300"
                style={{
                  width: `${lineWidth * 6}px`,
                  height: `${lineWidth * 6}px`,
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
