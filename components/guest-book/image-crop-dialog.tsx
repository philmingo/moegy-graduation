'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { currentTheme } from '@/lib/theme-config'

interface ImageCropDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  imageFile: File | string // Can accept File or data URL
  onCropComplete: (croppedBlob: Blob) => void
}

export function ImageCropDialog({
  open,
  onOpenChange,
  imageFile,
  onCropComplete,
}: ImageCropDialogProps) {
  const [imageSrc, setImageSrc] = useState<string>('')
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const theme = currentTheme

  // Load image when file changes
  useEffect(() => {
    if (imageFile) {
      if (typeof imageFile === 'string') {
        // It's already a data URL
        setImageSrc(imageFile)
        setScale(1)
        setPosition({ x: 0, y: 0 })
      } else {
        // It's a File object
        const reader = new FileReader()
        reader.addEventListener('load', () => {
          setImageSrc(reader.result?.toString() || '')
          setScale(1)
          setPosition({ x: 0, y: 0 })
        })
        reader.readAsDataURL(imageFile)
      }
    }
  }, [imageFile])

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Touch event handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0]
      setIsDragging(true)
      setDragStart({ x: touch.clientX - position.x, y: touch.clientY - position.y })
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return
    const touch = e.touches[0]
    setPosition({
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y,
    })
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
  }

  const getCroppedImg = useCallback(async (): Promise<Blob> => {
    const image = imgRef.current
    const container = containerRef.current
    
    if (!image || !container) {
      throw new Error('Image or container not found')
    }

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      throw new Error('No 2d context')
    }

    // Output size for portrait photo (600x800 - 3:4 ratio)
    const outputWidth = 600
    const outputHeight = 800
    canvas.width = outputWidth
    canvas.height = outputHeight

    // Get the crop area dimensions (portrait rectangle in container)
    const containerRect = container.getBoundingClientRect()
    const cropWidth = containerRect.width
    const cropHeight = containerRect.height

    // Get image dimensions and position
    const imgRect = image.getBoundingClientRect()

    // Calculate offset from container center to image center
    const containerCenterX = containerRect.width / 2
    const containerCenterY = containerRect.height / 2
    const imgCenterX = (imgRect.left - containerRect.left) + imgRect.width / 2
    const imgCenterY = (imgRect.top - containerRect.top) + imgRect.height / 2
    const offsetX = imgCenterX - containerCenterX
    const offsetY = imgCenterY - containerCenterY

    // Calculate crop area on the original image
    const scaleX = image.naturalWidth / imgRect.width
    const scaleY = image.naturalHeight / imgRect.height

    // The crop should be centered on the container
    const cropX = (image.naturalWidth / 2) - (cropWidth / 2 * scaleX) - (offsetX * scaleX)
    const cropY = (image.naturalHeight / 2) - (cropHeight / 2 * scaleY) - (offsetY * scaleY)
    const cropWidthScaled = cropWidth * scaleX
    const cropHeightScaled = cropHeight * scaleY

    // Draw the cropped area
    ctx.drawImage(
      image,
      cropX,
      cropY,
      cropWidthScaled,
      cropHeightScaled,
      0,
      0,
      outputWidth,
      outputHeight
    )

    // Convert to blob
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Canvas is empty'))
            return
          }
          resolve(blob)
        },
        'image/webp',
        0.95
      )
    })
  }, [position, scale])

  const handleCropConfirm = useCallback(async () => {
    try {
      const croppedBlob = await getCroppedImg()
      onCropComplete(croppedBlob)
      onOpenChange(false)
      // Reset state
      setScale(1)
      setPosition({ x: 0, y: 0 })
    } catch (error) {
      console.error('Error cropping image:', error)
    }
  }, [getCroppedImg, onCropComplete, onOpenChange])

  const handleScaleChange = (value: number[]) => {
    setScale(value[0])
  }

  const handleReset = () => {
    setScale(1)
    setPosition({ x: 0, y: 0 })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`${theme.modal.background} ${theme.modal.border} max-w-md`}>
        <DialogHeader>
          <DialogTitle className={`text-xl font-bold ${theme.text.primary}`}>
            Crop Your Photo
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Crop Area - Portrait rectangle overlay (3:4 aspect ratio) */}
          <div 
            ref={containerRef}
            className="relative w-full mx-auto bg-muted rounded-lg overflow-hidden"
            style={{ aspectRatio: '3/4', maxHeight: '60vh' }}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {imageSrc && (
              <div
                className={cn(
                  "absolute inset-0 flex items-center justify-center",
                  isDragging ? "cursor-grabbing" : "cursor-grab"
                )}
                onMouseDown={handleMouseDown}
                onTouchStart={handleTouchStart}
              >
                <img
                  ref={imgRef}
                  src={imageSrc}
                  alt="Crop preview"
                  draggable={false}
                  className={cn(
                    "max-w-full max-h-full select-none",
                    !isDragging && "transition-transform duration-200 ease-out"
                  )}
                  style={{
                    transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                  }}
                />
              </div>
            )}
            
            {/* Portrait rectangle overlay with border */}
            <div className="absolute inset-0 pointer-events-none border-4 border-white/50 rounded-lg" />
          </div>

          {/* Instructions */}
          <p className={`text-center text-xs sm:text-sm ${theme.text.secondary}`}>
            Drag to reposition • Use slider to zoom
          </p>

          {/* Zoom Controls */}
          <div className="flex items-center gap-3 px-2">
            <ZoomOut className={`w-4 h-4 ${theme.text.muted} flex-shrink-0`} />
            <Slider
              value={[scale]}
              onValueChange={handleScaleChange}
              min={0.5}
              max={3}
              step={0.1}
              className="flex-1"
            />
            <ZoomIn className={`w-4 h-4 ${theme.text.muted} flex-shrink-0`} />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 flex-col sm:flex-row">
          <Button 
            variant="ghost" 
            onClick={handleReset}
            size="sm"
            className={`${theme.text.primary} order-1 sm:order-1`}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <div className="flex gap-2 w-full sm:w-auto order-2 sm:order-2">
            <Button 
              variant="outline" 
              onClick={() => {
                onOpenChange(false)
                handleReset()
              }}
              className={`flex-1 sm:flex-none ${theme.glass.standard} ${theme.text.primary} border-0`}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCropConfirm}
              className={`flex-1 sm:flex-none ${theme.primary.gradient}`}
            >
              Apply Crop
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
