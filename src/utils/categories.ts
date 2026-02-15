const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'Groceries': ['walmart', 'target', 'costco', 'kroger', 'safeway', 'whole foods', 'trader joe', 'aldi', 'publix', 'heb', 'grocery', 'food lion', 'wegmans', 'sprouts', 'market', 'fresh'],
  'Dining': ['mcdonald', 'starbucks', 'chipotle', 'chick-fil-a', 'subway', 'taco bell', 'wendy', 'burger king', 'pizza', 'restaurant', 'cafe', 'coffee', 'doordash', 'uber eats', 'grubhub', 'panera', 'dunkin', 'diner', 'grill', 'sushi', 'thai', 'chinese', 'mexican'],
  'Transportation': ['shell', 'exxon', 'chevron', 'bp', 'gas', 'fuel', 'uber', 'lyft', 'parking', 'toll', 'transit', 'metro', 'bus', 'train', 'airline', 'flight', 'delta', 'united', 'american air', 'southwest'],
  'Shopping': ['amazon', 'ebay', 'etsy', 'best buy', 'apple store', 'nike', 'adidas', 'nordstrom', 'macy', 'gap', 'old navy', 'zara', 'h&m', 'ikea', 'home depot', 'lowes', 'wayfair'],
  'Entertainment': ['netflix', 'spotify', 'hulu', 'disney+', 'hbo', 'youtube', 'twitch', 'steam', 'playstation', 'xbox', 'movie', 'cinema', 'theater', 'concert', 'ticket', 'amc'],
  'Utilities': ['electric', 'water', 'gas bill', 'internet', 'comcast', 'att', 'verizon', 't-mobile', 'sprint', 'utility', 'power', 'energy', 'sewage'],
  'Healthcare': ['pharmacy', 'cvs', 'walgreens', 'hospital', 'doctor', 'dental', 'medical', 'health', 'clinic', 'optom', 'vision', 'prescription', 'lab', 'urgent care'],
  'Insurance': ['insurance', 'geico', 'state farm', 'allstate', 'progressive', 'liberty mutual', 'premium'],
  'Rent/Mortgage': ['rent', 'mortgage', 'lease', 'housing', 'apartment'],
  'Subscriptions': ['subscription', 'membership', 'annual fee', 'monthly fee', 'patreon', 'substack'],
  'Education': ['tuition', 'university', 'college', 'school', 'course', 'udemy', 'coursera', 'textbook', 'student'],
  'Personal Care': ['salon', 'barber', 'spa', 'gym', 'fitness', 'planet fitness', 'yoga', 'haircut'],
  'Income': ['payroll', 'direct deposit', 'salary', 'wage', 'deposit', 'payment received', 'refund', 'cashback', 'dividend', 'interest earned'],
  'Transfer': ['transfer', 'zelle', 'venmo', 'paypal', 'cash app', 'wire'],
};

export const CATEGORY_COLORS: Record<string, string> = {
  'Groceries': '#4CAF50',
  'Dining': '#FF9800',
  'Transportation': '#2196F3',
  'Shopping': '#E91E63',
  'Entertainment': '#9C27B0',
  'Utilities': '#607D8B',
  'Healthcare': '#F44336',
  'Insurance': '#795548',
  'Rent/Mortgage': '#3F51B5',
  'Subscriptions': '#00BCD4',
  'Education': '#CDDC39',
  'Personal Care': '#FF5722',
  'Income': '#8BC34A',
  'Transfer': '#9E9E9E',
  'Other': '#757575',
};

export function categorizeTransaction(description: string): string {
  const lower = description.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(kw => lower.includes(kw))) {
      return category;
    }
  }
  return 'Other';
}

export function getAllCategories(): string[] {
  return [...Object.keys(CATEGORY_KEYWORDS), 'Other'];
}

export function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category] || '#757575';
}
