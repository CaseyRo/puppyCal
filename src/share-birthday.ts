/**
 * Birthday detection and celebratory canvas rendering for share cards.
 */

export interface BirthdayContext {
  type: 'today' | 'week';
  age: number; // years turning
  daysSince: number; // 0 for today, 1-7 for week
}

/**
 * Detect birthday proximity. Returns context if today is the birthday or within 7 days after.
 * Returns null otherwise, including when DOB is missing/invalid.
 */
export function getBirthdayContext(dob: string, now?: Date): BirthdayContext | null {
  if (!dob) return null;
  const birth = new Date(dob);
  if (isNaN(birth.getTime())) return null;

  const today = now ?? new Date();
  const todayMonth = today.getMonth();
  const todayDay = today.getDate();
  const birthMonth = birth.getMonth();
  const birthDay = birth.getDate();
  const birthYear = birth.getFullYear();
  const currentYear = today.getFullYear();

  // Calculate the age they're turning this year
  let age = currentYear - birthYear;

  // Find this year's birthday
  const birthdayThisYear = new Date(currentYear, birthMonth, birthDay);

  // Days since this year's birthday
  const diffMs = today.getTime() - birthdayThisYear.getTime();
  const daysSince = Math.floor(diffMs / (24 * 60 * 60 * 1000));

  // Exact birthday
  if (todayMonth === birthMonth && todayDay === birthDay) {
    return { type: 'today', age, daysSince: 0 };
  }

  // Within 7 days after birthday
  if (daysSince >= 1 && daysSince <= 7) {
    return { type: 'week', age, daysSince };
  }

  // Check if we're within 7 days of last year's birthday (for early January when birthday is late December)
  if (daysSince < 0) {
    const birthdayLastYear = new Date(currentYear - 1, birthMonth, birthDay);
    const diffLastMs = today.getTime() - birthdayLastYear.getTime();
    const daysSinceLast = Math.floor(diffLastMs / (24 * 60 * 60 * 1000));
    if (daysSinceLast >= 1 && daysSinceLast <= 7) {
      age = currentYear - 1 - birthYear;
      return { type: 'week', age, daysSince: daysSinceLast };
    }
  }

  return null;
}

/**
 * Simple seeded PRNG for deterministic confetti.
 */
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function hashSeed(name: string, year: number): number {
  let hash = year;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) & 0xffffffff;
  }
  return hash;
}

/**
 * Draw deterministic confetti particles on a canvas.
 * Uses gold, pink, and white colors. ~60 particles.
 */
export function drawConfetti(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  name: string,
  birthYear: number
): void {
  const seed = hashSeed(name, birthYear);
  const rand = seededRandom(seed);
  const colors = ['#D4A843', '#E8B4B8', '#F5E6CC', '#FFFFFF', '#D4A843', '#C9A96E'];
  const count = 60;

  ctx.save();
  for (let i = 0; i < count; i++) {
    const x = rand() * width;
    const y = rand() * height;
    const size = 4 + rand() * 12;
    const color = colors[Math.floor(rand() * colors.length)];
    const rotation = rand() * Math.PI * 2;
    const opacity = 0.3 + rand() * 0.5;
    const isRect = rand() > 0.5;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.globalAlpha = opacity;
    ctx.fillStyle = color;

    if (isRect) {
      ctx.fillRect(-size / 2, -size / 4, size, size / 2);
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
  ctx.restore();
}
