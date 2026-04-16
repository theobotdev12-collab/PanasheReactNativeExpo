import { FoodAnalysis } from '@/types';

export const sampleAnalyses: FoodAnalysis[] = [
  {
    id: 'fa1',
    name: 'Grilled Salmon',
    image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&h=400&fit=crop',
    rating: 'caution',
    nutrients: { sodium: 59, potassium: 490, phosphorus: 252, protein: 25, calories: 208 },
    recommendation: 'Salmon is nutritious but high in potassium and phosphorus. Limit portions to 3oz and pair with low-potassium vegetables.',
    analyzedAt: '2025-12-20T10:30:00Z',
  },
  {
    id: 'fa2',
    name: 'Apple Slices',
    image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400&h=400&fit=crop',
    rating: 'good',
    nutrients: { sodium: 1, potassium: 107, phosphorus: 11, protein: 0.3, calories: 52 },
    recommendation: 'Apples are one of the best kidney-friendly fruits! Low in potassium and sodium. Enjoy as a daily snack.',
    analyzedAt: '2025-12-19T14:15:00Z',
  },
  {
    id: 'fa3',
    name: 'French Fries',
    image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&h=400&fit=crop',
    rating: 'avoid',
    nutrients: { sodium: 282, potassium: 579, phosphorus: 125, protein: 3.4, calories: 312 },
    recommendation: 'French fries are very high in sodium and potassium. Consider baked cauliflower bites as a kidney-friendly alternative.',
    analyzedAt: '2025-12-18T18:45:00Z',
  },
];