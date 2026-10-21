/**
 * Pure geometry for the fluffy-fur look: turns an ellipse into a closed path
 * whose edge is a ring of soft, swept tufts. Deterministic (no Math.random) so
 * the mascot looks identical on every render and in every export.
 */

const fixed = (n: number): string => n.toFixed(1);

/** Stable pseudo-random value in [0, 1) for a given index. */
export function jitter(index: number, seed = 0): number {
  const x = Math.sin((index + seed) * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

export interface FluffOptions {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  /** Number of tufts around the edge. */
  tufts: number;
  /** Tuft length as a fraction of the radius (0.08 = subtle, 0.18 = shaggy). */
  depth: number;
  /** Changes which tufts are long/short without changing the overall look. */
  seed?: number;
  /** Rotation of the whole shape in degrees. */
  rotate?: number;
  /** How far each tuft leans in the sweep direction (0 = symmetrical). */
  sweep?: number;
  /**
   * 'cloud' = soft rounded bumps (fluffy, default); 'tuft' = swept pointed
   * flicks (shaggy). Cloud reads cuter at small sizes.
   */
  style?: 'cloud' | 'tuft';
}

/** A closed fluffy-ellipse path: `M ... Z`. */
export function fluffPath(o: FluffOptions): string {
  const { cx, cy, rx, ry, tufts, depth, seed = 0, rotate = 0, sweep = 0.22, style = 'cloud' } = o;
  const rot = (rotate * Math.PI) / 180;
  const point = (angle: number, k: number): [number, number] => {
    const x = Math.cos(angle) * rx * k;
    const y = Math.sin(angle) * ry * k;
    return [cx + x * Math.cos(rot) - y * Math.sin(rot), cy + x * Math.sin(rot) + y * Math.cos(rot)];
  };
  const step = (Math.PI * 2) / tufts;
  const [sx, sy] = point(0, 1);
  let d = `M${fixed(sx)},${fixed(sy)}`;
  if (style === 'cloud') {
    for (let i = 0; i < tufts; i += 1) {
      const a0 = i * step;
      const bulge = 1 + depth * (1.3 + 0.9 * jitter(i, seed));
      const ctrl = point(a0 + step * (0.5 + sweep * 0.3), bulge);
      const end = point(a0 + step, 1);
      d += ` Q${fixed(ctrl[0])},${fixed(ctrl[1])} ${fixed(end[0])},${fixed(end[1])}`;
    }
    return `${d} Z`;
  }
  for (let i = 0; i < tufts; i += 1) {
    const a0 = i * step;
    const tipK = 1 + depth * (0.55 + 0.9 * jitter(i, seed));
    const tip = point(a0 + step * (0.5 + sweep), tipK);
    const ctrlA = point(a0 + step * 0.18, 1 + depth * 0.25);
    const ctrlB = point(a0 + step * 0.78, 1 + depth * 0.55);
    const end = point(a0 + step, 1);
    d += ` Q${fixed(ctrlA[0])},${fixed(ctrlA[1])} ${fixed(tip[0])},${fixed(tip[1])}`;
    d += ` Q${fixed(ctrlB[0])},${fixed(ctrlB[1])} ${fixed(end[0])},${fixed(end[1])}`;
  }
  return `${d} Z`;
}

/** Short curved fur-strand strokes scattered along an arc, as `M..Q..` segments. */
export function strandPath(cx: number, cy: number, r: number, fromDeg: number, toDeg: number, count: number, len: number, seed = 0): string {
  let d = '';
  for (let i = 0; i < count; i += 1) {
    const t = count === 1 ? 0.5 : i / (count - 1);
    const a = ((fromDeg + (toDeg - fromDeg) * t) * Math.PI) / 180;
    const rr = r * (0.92 + 0.12 * jitter(i, seed));
    const x = cx + Math.cos(a) * rr;
    const y = cy + Math.sin(a) * rr;
    const dx = Math.cos(a + 0.5) * len;
    const dy = Math.sin(a + 0.5) * len;
    d += `M${fixed(x)},${fixed(y)} q${fixed(dx * 0.6)},${fixed(dy * 0.4)} ${fixed(dx)},${fixed(dy)} `;
  }
  return d.trim();
}

/**
 * A row of soft pointed locks along a baseline: returns `L` segments (no leading
 * `M`) that zig-zag from (x0, y0) to (x1, y1), with each tip pushed out by `len`
 * in the direction (dx, dy). Used for feathered ear / chest / tail edges.
 */
export function featherEdge(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  count: number,
  len: number,
  dx: number,
  dy: number,
  seed = 0,
): string {
  let d = '';
  for (let i = 0; i < count; i += 1) {
    const t0 = i / count;
    const t1 = (i + 1) / count;
    const tm = (t0 + t1) / 2 + 0.12 / count;
    const l = len * (0.7 + 0.6 * jitter(i, seed));
    const bx = x0 + (x1 - x0) * tm;
    const by = y0 + (y1 - y0) * tm;
    const ex = x0 + (x1 - x0) * t1;
    const ey = y0 + (y1 - y0) * t1;
    d += ` L${fixed(bx + dx * l)},${fixed(by + dy * l)} L${fixed(ex)},${fixed(ey)}`;
  }
  return d;
}
