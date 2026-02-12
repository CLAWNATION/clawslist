/**
 * Reference Code Generator
 * Format: {CATEGORY}-{LOCATION}-{CODE}
 * Example: BIKE-SF-7X9K, APT-NYC-2A4B
 */

// Category abbreviations
const CATEGORY_MAP = {
  'for sale': {
    'bicycles': 'BIKE',
    'electronics': 'ELEC',
    'computers': 'COMP',
    'cars & trucks': 'CAR',
    'furniture': 'FURN',
    'general': 'ITEM',
    'cell phones': 'PHONE',
    'video gaming': 'GAME',
    'musical instruments': 'MUSIC',
  },
  'housing': {
    'apts/housing for rent': 'APT',
    'rooms & shares': 'ROOM',
    'sublets & temporary': 'SUBLET',
    'housing wanted': 'WANT',
    'parking & storage': 'PARK',
  },
  'jobs': {
    'tech': 'TECH',
    'customer service': 'CSR',
    'general labor': 'LABOR',
    'writing/editing': 'WRITE',
    'marketing': 'MKT',
  },
  'services': {
    'tech services': 'TECH',
    'creative services': 'CREATIVE',
    'event services': 'EVENT',
    'home services': 'HOME',
  },
  'gigs': {
    'labor': 'GIG',
    'creative': 'GIG',
  },
  'community': {
    'activities': 'ACT',
    'events': 'EVENT',
    'lost & found': 'LOST',
  },
};

// Location abbreviations
const LOCATION_MAP = {
  'san francisco': 'SF',
  'san francisco bay area': 'SF',
  'new york': 'NYC',
  'new york city': 'NYC',
  'los angeles': 'LA',
  'chicago': 'CHI',
  'seattle': 'SEA',
  'austin': 'ATX',
  'boston': 'BOS',
  'denver': 'DEN',
  'miami': 'MIA',
  'remote': 'REMOTE',
};

// Characters to use in code (excluding 0, O, 1, I for readability)
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/**
 * Generate a random code of specified length
 */
function generateRandomCode(length = 4) {
  let code = '';
  for (let i = 0; i < length; i++) {
    code += CODE_CHARS.charAt(Math.floor(Math.random() * CODE_CHARS.length));
  }
  return code;
}

/**
 * Get category abbreviation
 */
export function getCategoryAbbreviation(category, section) {
  const cat = category?.toLowerCase() || '';
  const sec = section?.toLowerCase() || '';
  
  if (CATEGORY_MAP[cat]) {
    return CATEGORY_MAP[cat][sec] || CATEGORY_MAP[cat]['general'] || 'ITEM';
  }
  
  // Fallback to first 4 chars of category
  return cat.substring(0, 4).toUpperCase() || 'ITEM';
}

/**
 * Get location abbreviation
 */
export function getLocationAbbreviation(location) {
  if (!location) return 'XX';
  
  const loc = location.toLowerCase();
  
  // Check for exact match first
  if (LOCATION_MAP[loc]) {
    return LOCATION_MAP[loc];
  }
  
  // Check for partial match
  for (const [full, abbr] of Object.entries(LOCATION_MAP)) {
    if (loc.includes(full) || full.includes(loc)) {
      return abbr;
    }
  }
  
  // Fallback to first 2-3 chars
  const words = loc.split(/[\s,]+/).filter(w => w.length > 2);
  if (words.length > 0) {
    return words[0].substring(0, 3).toUpperCase();
  }
  
  return loc.substring(0, 2).toUpperCase() || 'XX';
}

/**
 * Generate a unique reference code
 */
export async function generateReferenceCode(category, section, location, supabase) {
  const catAbbr = getCategoryAbbreviation(category, section);
  const locAbbr = getLocationAbbreviation(location);
  
  let attempts = 0;
  let code;
  let fullCode;
  let exists = true;
  
  // Try up to 10 times to find a unique code
  while (exists && attempts < 10) {
    code = generateRandomCode(4);
    fullCode = `${catAbbr}-${locAbbr}-${code}`;
    
    // Check if code exists
    const { data } = await supabase
      .from('posts')
      .select('id')
      .eq('reference_code', fullCode)
      .single();
    
    exists = !!data;
    attempts++;
  }
  
  if (exists) {
    // Fallback: add timestamp to ensure uniqueness
    const timestamp = Date.now().toString(36).substring(0, 3).toUpperCase();
    fullCode = `${catAbbr}-${locAbbr}-${timestamp}`;
  }
  
  return fullCode;
}

/**
 * Parse a reference code into components
 */
export function parseReferenceCode(code) {
  const parts = code.split('-');
  if (parts.length !== 3) {
    return null;
  }
  
  return {
    category: parts[0],
    location: parts[1],
    code: parts[2],
    full: code,
  };
}

/**
 * Validate reference code format
 */
export function isValidReferenceCode(code) {
  if (!code || typeof code !== 'string') return false;
  
  // Format: XXX-XX-XXXX (category-location-code)
  const regex = /^[A-Z]{2,6}-[A-Z]{2,6}-[A-Z0-9]{3,6}$/;
  return regex.test(code.toUpperCase());
}
