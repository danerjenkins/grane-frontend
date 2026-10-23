import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, Eraser, Undo2, X } from 'lucide-react';
import { drawStroke, loadImage, type Stroke } from '../../feedback/markup';

const COLORS = [
  { value: '#e11d48', label: 'Red' },
  { value: '#facc15', label: 'Yellow' },
  { value: '#2563eb', label: 'Blue' },
];

/** Line width in image pixels, so strokes look the same whatever size the editor is shown at. */
function lineWidthFor(imageWidth: number) {
  return Math.max(4, Math.round(imageWidth / 220));
}

interface Props {
  base: string;
  initialStrokes: Stroke[];
  onDone: (strokes: Stroke[]) => void;
  onCancel: () => void;
}

export default function ScreenshotMarkup({ base, initialStrokes, onDone, onCancel }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const activeRef = useRef<Stroke | null>(null);
  const [strokes, setStrokes] = useState<Stroke[]>(initialStrokes);
  const [color, setColor] = useState(COLORS[0].value);
  const [ready, setReady] = useState(false);

  const redraw = useCallback((list: Stroke[]) => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !image || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0);
    list.forEach((stroke) => drawStroke(ctx, stroke));
    if (activeRef.current) drawStroke(ctx, activeRef.current);
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadImage(base)
      .then((image) => {
        if (cancelled || !canvasRef.current) return;
        imageRef.current = image;
        canvasRef.current.width = image.naturalWidth;
        canvasRef.current.height = image.naturalHeight;
        setReady(true);
      })
      .catch(() => onCancel());
    return () => {
      cancelled = true;
    };
  }, [base, onCancel]);

  useEffect(() => {
    if (ready) redraw(strokes);
  }, [ready, strokes, redraw]);

  const toImagePoint = (event: React.PointerEvent<HTMLCanvasElement>): [number, number] => {
    const canvas = event.currentTarget;
    const rect = canvas.getBoundingClientRect();
    return [
      ((event.clientX - rect.left) / rect.width) * canvas.width,
      ((event.clientY - rect.top) / rect.height) * canvas.height,
    ];
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!ready || event.button !== 0) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    activeRef.current = {
      color,
      width: lineWidthFor(event.currentTarget.width),
      points: [toImagePoint(event)],
    };
    redraw(strokes);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!activeRef.current) return;
    activeRef.current.points.push(toImagePoint(event));
    redraw(strokes);
  };

  const finishStroke = () => {
    const stroke = activeRef.current;
    if (!stroke) return;
    activeRef.current = null;
    setStrokes((prev) => [...prev, stroke]);
  };

  return (
    <div
      className="modal-backdrop flex-col gap-3"
      role="dialog"
      aria-modal="true"
      aria-label="Draw on screenshot"
    >
      <div className="flex w-full max-w-4xl flex-wrap items-center justify-between gap-2 rounded-lg bg-surface px-3 py-2 shadow-xl">
        <div className="flex items-center gap-2" role="radiogroup" aria-label="Pen color">
          <span className="text-sm text-secondary">Draw to point things out</span>
          {COLORS.map((option) => (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={color === option.value}
              aria-label={option.label}
              title={option.label}
              onClick={() => setColor(option.value)}
              className={`h-6 w-6 rounded-full border-2 ${
                color === option.value ? 'border-text' : 'border-transparent'
              }`}
              style={{ backgroundColor: option.value }}
            />
          ))}
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setStrokes((prev) => prev.slice(0, -1))}
            disabled={strokes.length === 0}
            className="inline-flex items-center gap-1 rounded px-2 py-1 text-sm text-secondary hover:bg-muted hover:text-text disabled:opacity-40"
          >
            <Undo2 className="h-4 w-4" /> Undo
          </button>
          <button
            type="button"
            onClick={() => setStrokes([])}
            disabled={strokes.length === 0}
            className="inline-flex items-center gap-1 rounded px-2 py-1 text-sm text-secondary hover:bg-muted hover:text-text disabled:opacity-40"
          >
            <Eraser className="h-4 w-4" /> Clear
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center gap-1 rounded px-2 py-1 text-sm text-secondary hover:bg-muted hover:text-text"
          >
            <X className="h-4 w-4" /> Cancel
          </button>
          <button
            type="button"
            onClick={() => onDone(strokes)}
            className="btn-neutral inline-flex items-center gap-1 py-1 text-sm"
          >
            <Check className="h-4 w-4" /> Done
          </button>
        </div>
      </div>
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishStroke}
        onPointerCancel={finishStroke}
        className="max-h-[calc(100%-4rem)] max-w-full cursor-crosshair touch-none rounded-lg bg-surface shadow-xl"
      />
    </div>
  );
}
