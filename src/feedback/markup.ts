/** Freehand markup on the feedback screenshot: stroke model and canvas rendering. */

export interface Stroke {
  color: string;
  width: number;
  points: [number, number][];
}

export function drawStroke(ctx: CanvasRenderingContext2D, stroke: Stroke) {
  const [first, ...rest] = stroke.points;
  if (!first) return;
  ctx.strokeStyle = stroke.color;
  ctx.fillStyle = stroke.color;
  ctx.lineWidth = stroke.width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (rest.length === 0) {
    ctx.beginPath();
    ctx.arc(first[0], first[1], stroke.width / 2, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  ctx.beginPath();
  ctx.moveTo(first[0], first[1]);
  for (const [x, y] of rest) ctx.lineTo(x, y);
  ctx.stroke();
}

export function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

/** Flatten the screenshot and strokes into a single PNG data URL. */
export async function renderMarkup(base: string, strokes: Stroke[]): Promise<string> {
  if (strokes.length === 0) return base;
  const image = await loadImage(base);
  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) return base;
  ctx.drawImage(image, 0, 0);
  strokes.forEach((stroke) => drawStroke(ctx, stroke));
  return canvas.toDataURL('image/png');
}
