import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import JsBarcode from 'jsbarcode';

interface BarcodeDisplayProps {
  /** The data to encode — typically the compact booking barcode e.g. "PKP00000001" */
  value: string;
  height?: number;
  lineColor?: string;
  background?: string;
  showLabel?: boolean;
  className?: string;
}

/**
 * BarcodeDisplay
 * Renders a Code 128 barcode onto a <canvas> element using JsBarcode.
 *
 * Why canvas (not SVG)?
 *   html2canvas can rasterise <canvas> elements natively. SVG children require
 *   a serialisation pass that often clips or misaligns the bars. Canvas is
 *   therefore the reliable choice for ticket download/print flows.
 */
export const BarcodeDisplay = forwardRef<HTMLCanvasElement, BarcodeDisplayProps>(
  (
    {
      value,
      height     = 52,
      lineColor  = '#1e3d5a',
      background = '#ffffff',
      showLabel  = false,
      className  = '',
    },
    ref
  ) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Expose the raw canvas element to parent via ref (used for download)
    useImperativeHandle(ref, () => canvasRef.current as HTMLCanvasElement);

    useEffect(() => {
      if (!canvasRef.current || !value) return;
      try {
        JsBarcode(canvasRef.current, value, {
          format:       'CODE128',
          width:        2,
          height,
          displayValue: showLabel,
          fontSize:     11,
          margin:       6,
          background,
          lineColor,
        });
      } catch {
        // Unsupported characters → silently skip
      }
    }, [value, height, lineColor, background, showLabel]);

    return (
      <canvas
        ref={canvasRef}
        className={`w-full ${className}`}
        aria-label={`Barcode for ${value}`}
        style={{ imageRendering: 'pixelated' }}
      />
    );
  }
);

BarcodeDisplay.displayName = 'BarcodeDisplay';
