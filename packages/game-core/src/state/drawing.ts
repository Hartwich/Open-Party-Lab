/** Normalized drawing coordinates shared by social games and phone canvases. */
export interface DrawingPoint { x: number; y: number }
export interface DrawingStroke { id: string; clientStrokeId?: string; color: string; points: DrawingPoint[] }
export interface DrawingBoard {
  strokes: DrawingStroke[];
  color: string;
  aspectRatio: number;
  activeStrokeId?: string;
  sequence: number;
}
export const drawingColors = ["#352436", "#ed715e", "#399b91", "#657db5", "#e6b33e"] as const;
export function emptyDrawing(aspectRatio = 1): DrawingBoard {
  return { strokes: [], color: drawingColors[0], aspectRatio, sequence: 0 };
}
/** Caller must authenticate the drawer, card generation and deadline first. */
export function applyDrawingInput(board: DrawingBoard, input: Record<string, unknown>): DrawingBoard {
  if (input.type === "draw:clear") return { ...board, strokes: [], activeStrokeId: undefined };
  if (input.type === "draw:set-color" && drawingColors.some((color) => color === input.color))
    return { ...board, color: input.color as string };
  if (input.type === "draw:set-canvas-aspect" && typeof input.aspectRatio === "number" && Number.isFinite(input.aspectRatio)) {
    const ratio = Math.max(0.4, Math.min(2.5, input.aspectRatio));
    return Math.abs(board.aspectRatio - ratio) < 0.025 ? board : { ...board, aspectRatio: ratio };
  }
  if (input.type === "draw:end") return board.activeStrokeId ? { ...board, activeStrokeId: undefined } : board;
  if ((input.type !== "draw:start" && input.type !== "draw:move") || typeof input.x !== "number" ||
    typeof input.y !== "number" || !Number.isFinite(input.x) || !Number.isFinite(input.y)) return board;
  const point = { x: Math.max(0, Math.min(1, input.x)), y: Math.max(0, Math.min(1, input.y)) };
  if (input.type === "draw:start") {
    if (board.strokes.length >= 250) return board;
    const id = String(board.sequence + 1);
    const clientStrokeId = typeof input.clientStrokeId === "string" ? input.clientStrokeId.slice(0, 100) : undefined;
    return { ...board, sequence: board.sequence + 1, activeStrokeId: id,
      strokes: [...board.strokes, { id, clientStrokeId, color: board.color, points: [point] }] };
  }
  const last = board.strokes.at(-1);
  if (!last || last.id !== board.activeStrokeId || last.points.length >= 1500) return board;
  return { ...board, strokes: [...board.strokes.slice(0, -1), { ...last, points: [...last.points, point] }] };
}
