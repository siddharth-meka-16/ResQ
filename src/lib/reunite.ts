export interface MissingPersonReport {
  id: string;
  fullName: string;
  age?: number;
  gender?: string;
  clothingLastSeen?: string;
  physicalDescription?: string;
  lastSeenLocation?: string;
}

export interface ShelterCheckinRecord {
  id: string;
  shelterId: string;
  shelterName?: string;
  personName: string;
  age?: number;
  gender?: string;
  clothing?: string;
  medicalCondition?: string;
}

export interface MatchCompatibilityFactors {
  nameSimilarity: number; // 0.0 - 1.0
  ageScore: number;       // 0.0 - 1.0
  genderMatch: boolean;
  clothingScore: number;  // 0.0 - 1.0
}

export interface ReunionMatchResult {
  missingPersonId: string;
  checkinId: string;
  shelterId: string;
  shelterName?: string;
  matchConfidence: number; // 0.00 - 1.00
  compatibilityFactors: MatchCompatibilityFactors;
  isStrongMatch: boolean;
  privacySafeNotice: string;
}

/**
 * Computes Levenshtein Distance between two strings.
 */
export function levenshteinDistance(a: string, b: string): number {
  const s1 = a.toLowerCase().trim();
  const s2 = b.toLowerCase().trim();

  const matrix: number[][] = [];

  for (let i = 0; i <= s2.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= s1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= s2.length; i++) {
    for (let j = 1; j <= s1.length; j++) {
      if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[s2.length][s1.length];
}

/**
 * Computes normalized string similarity (0.0 to 1.0).
 */
export function stringSimilarity(a: string, b: string): number {
  if (!a || !b) return 0;
  const s1 = a.toLowerCase().trim();
  const s2 = b.toLowerCase().trim();
  if (s1 === s2) return 1.0;

  const maxLen = Math.max(s1.length, s2.length);
  if (maxLen === 0) return 1.0;

  const dist = levenshteinDistance(s1, s2);
  return Math.max(0, 1 - dist / maxLen);
}

/**
 * Tokenizes text and extracts standardized color/clothing keywords.
 */
export function extractKeywords(text?: string): Set<string> {
  if (!text) return new Set();

  const stopWords = new Set(["a", "an", "the", "and", "in", "with", "on", "at", "wearing"]);
  const tokens = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopWords.has(w));

  return new Set(tokens);
}

/**
 * Calculates Jaccard token overlap between two descriptions.
 */
export function computeKeywordOverlap(text1?: string, text2?: string): number {
  const set1 = extractKeywords(text1);
  const set2 = extractKeywords(text2);

  if (set1.size === 0 || set2.size === 0) return 0;

  let intersectionCount = 0;
  for (const token of set1) {
    if (set2.has(token)) {
      intersectionCount++;
    }
  }

  const unionCount = new Set([...set1, ...set2]).size;
  return unionCount === 0 ? 0 : intersectionCount / unionCount;
}

/**
 * Scores age proximity with +/- 3 years tolerance.
 */
export function computeAgeScore(age1?: number, age2?: number): number {
  if (age1 === undefined || age2 === undefined || isNaN(age1) || isNaN(age2)) {
    return 0.5; // Neutral uncertainty if age missing
  }

  const diff = Math.abs(age1 - age2);
  if (diff === 0) return 1.0;
  if (diff <= 1) return 0.9;
  if (diff <= 2) return 0.8;
  if (diff <= 3) return 0.65;
  if (diff <= 5) return 0.4;
  return 0.0;
}

/**
 * Matches missing person report against a shelter check-in record.
 */
export function matchMissingPerson(
  report: MissingPersonReport,
  checkin: ShelterCheckinRecord
): ReunionMatchResult {
  // 1. Name Similarity (Weight: 0.40)
  const nameSim = stringSimilarity(report.fullName, checkin.personName);

  // 2. Age Proximity (Weight: 0.25)
  const ageScore = computeAgeScore(report.age, checkin.age);

  // 3. Gender Compatibility (Weight: 0.15)
  let genderMatch = true;
  let genderScore = 0.5;
  if (report.gender && checkin.gender) {
    genderMatch = report.gender.toUpperCase() === checkin.gender.toUpperCase();
    genderScore = genderMatch ? 1.0 : 0.0;
  }

  // 4. Clothing / Physical Overlap (Weight: 0.20)
  const desc1 = `${report.clothingLastSeen || ""} ${report.physicalDescription || ""}`;
  const desc2 = `${checkin.clothing || ""} ${checkin.medicalCondition || ""}`;
  const clothingScore = computeKeywordOverlap(desc1, desc2);

  // Composite Weighted Score
  let composite =
    nameSim * 0.40 +
    ageScore * 0.25 +
    genderScore * 0.15 +
    clothingScore * 0.20;

  // Severe penalty if gender strictly mismatches
  if (!genderMatch) {
    composite *= 0.3;
  }

  const matchConfidence = Math.round(composite * 100) / 100;
  const isStrongMatch = matchConfidence >= 0.70;

  return {
    missingPersonId: report.id,
    checkinId: checkin.id,
    shelterId: checkin.shelterId,
    shelterName: checkin.shelterName,
    matchConfidence,
    compatibilityFactors: {
      nameSimilarity: Math.round(nameSim * 100) / 100,
      ageScore: Math.round(ageScore * 100) / 100,
      genderMatch,
      clothingScore: Math.round(clothingScore * 100) / 100,
    },
    isStrongMatch,
    privacySafeNotice: isStrongMatch
      ? "Potential match identified. Contact info and shelter bay are protected. Release requires verified shelter officer physical authentication."
      : "Insufficient confidence for automated notification.",
  };
}

/**
 * Searches entire shelter register for candidates matching a missing person.
 */
export function searchShelterMatches(
  report: MissingPersonReport,
  checkins: ShelterCheckinRecord[],
  minConfidence = 0.50
): ReunionMatchResult[] {
  return checkins
    .map((checkin) => matchMissingPerson(report, checkin))
    .filter((res) => res.matchConfidence >= minConfidence)
    .sort((a, b) => b.matchConfidence - a.matchConfidence);
}
