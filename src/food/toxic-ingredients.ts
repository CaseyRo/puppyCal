export type Severity = 'danger' | 'warning' | 'caution';

export interface ToxicIngredient {
  name: string;
  variants: string[];
  severity: Severity;
  context: string;
}

export const TOXIC_INGREDIENTS: ToxicIngredient[] = [
  // Danger — toxic even in small amounts
  {
    name: 'Xylitol',
    variants: ['xylitol', 'birch sugar'],
    severity: 'danger',
    context: 'Causes rapid insulin release, leading to hypoglycemia and liver failure.',
  },
  {
    name: 'Chocolate / Cocoa',
    variants: ['chocolate', 'cocoa', 'cacao', 'theobromine'],
    severity: 'danger',
    context: 'Contains theobromine, toxic to dogs. Dark chocolate is most dangerous.',
  },
  {
    name: 'Grapes',
    variants: ['grape', 'grapes', 'raisin', 'raisins', 'currant', 'currants', 'sultana'],
    severity: 'danger',
    context: 'Can cause acute kidney failure even in small amounts.',
  },
  {
    name: 'Macadamia nuts',
    variants: ['macadamia'],
    severity: 'danger',
    context: 'Causes weakness, vomiting, tremors, and hyperthermia.',
  },
  {
    name: 'Alcohol',
    variants: ['alcohol', 'ethanol', 'beer', 'wine', 'liquor'],
    severity: 'danger',
    context:
      'Even small amounts can cause vomiting, diarrhea, and central nervous system depression.',
  },
  {
    name: 'Caffeine',
    variants: ['caffeine', 'coffee', 'tea extract', 'guarana'],
    severity: 'danger',
    context:
      'Stimulant toxic to dogs, can cause restlessness, rapid breathing, and heart palpitations.',
  },
  {
    name: 'Persin (Avocado)',
    variants: ['avocado', 'persin'],
    severity: 'danger',
    context: 'Persin in avocado can cause vomiting and diarrhea in dogs.',
  },

  // Warning — risky in significant quantities
  {
    name: 'Onion',
    variants: ['onion', 'onions'],
    severity: 'warning',
    context: 'Contains N-propyl disulfide which damages red blood cells. Toxic in larger amounts.',
  },
  {
    name: 'Garlic',
    variants: ['garlic'],
    severity: 'warning',
    context:
      'Related to onions, toxic in larger quantities. Small trace amounts in some dog foods are debated.',
  },
  {
    name: 'Leek / Chives',
    variants: ['leek', 'leeks', 'chive', 'chives', 'shallot', 'shallots'],
    severity: 'warning',
    context: 'Allium family — same toxicity mechanism as onion and garlic.',
  },
  {
    name: 'Nutmeg',
    variants: ['nutmeg', 'myristicin'],
    severity: 'warning',
    context:
      'Contains myristicin which can cause hallucinations, increased heart rate, and seizures.',
  },

  // Caution — monitor intake
  {
    name: 'Salt (excessive)',
    variants: ['sodium chloride'],
    severity: 'caution',
    context: 'Excessive salt can cause sodium ion poisoning. Normal food-level salt is fine.',
  },
  {
    name: 'Artificial sweeteners',
    variants: ['aspartame', 'saccharin', 'sucralose', 'acesulfame'],
    severity: 'caution',
    context:
      'Not well-studied in dogs. Xylitol is the most dangerous sweetener (listed separately).',
  },
  {
    name: 'BHA / BHT',
    variants: ['bha', 'bht', 'butylated hydroxyanisole', 'butylated hydroxytoluene'],
    severity: 'caution',
    context: 'Controversial preservatives — some studies link to health concerns in animals.',
  },
  {
    name: 'Propylene glycol',
    variants: ['propylene glycol'],
    severity: 'caution',
    context:
      'Used as a preservative in some pet foods. Generally recognized as safe in small amounts but banned in cat food.',
  },
  {
    name: 'Ethoxyquin',
    variants: ['ethoxyquin'],
    severity: 'caution',
    context: 'Synthetic antioxidant preservative with debated safety in pet food.',
  },
];

export type SafetyVerdict = 'safe' | 'warning' | 'danger' | 'data-unavailable' | 'incomplete';

export interface SafetyMatch {
  ingredient: string;
  matched: ToxicIngredient;
}

export interface SafetyResult {
  verdict: SafetyVerdict;
  matches: SafetyMatch[];
}

function normalizeForMatch(s: string): string {
  return s.toLowerCase().trim();
}

export function checkIngredientSafety(ingredients: string[]): SafetyResult {
  if (!ingredients || ingredients.length === 0) {
    return { verdict: 'data-unavailable', matches: [] };
  }

  if (ingredients.length < 3) {
    // Still check what we have, but flag as incomplete
    const result = matchIngredients(ingredients);
    return {
      verdict: result.matches.length > 0 ? result.verdict : 'incomplete',
      matches: result.matches,
    };
  }

  return matchIngredients(ingredients);
}

function matchIngredients(ingredients: string[]): SafetyResult {
  const matches: SafetyMatch[] = [];

  for (const ingredient of ingredients) {
    const normalized = normalizeForMatch(ingredient);
    if (!normalized) continue;

    for (const toxic of TOXIC_INGREDIENTS) {
      for (const variant of toxic.variants) {
        if (normalized.includes(variant)) {
          matches.push({ ingredient, matched: toxic });
          break; // Don't match the same toxic entry twice for one ingredient
        }
      }
    }
  }

  let verdict: SafetyVerdict = 'safe';
  for (const match of matches) {
    if (match.matched.severity === 'danger') {
      verdict = 'danger';
      break;
    }
    if (match.matched.severity === 'warning') {
      verdict = 'warning';
    }
    if (match.matched.severity === 'caution' && verdict === 'safe') {
      verdict = 'warning'; // caution items escalate to warning verdict
    }
  }

  return { verdict, matches };
}
