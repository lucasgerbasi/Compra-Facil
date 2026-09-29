export type Food = {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  expires_at: string;
  notes: string | null;
  updated_at: string;
};

export type FoodInput = Omit<Food, 'updated_at'>;
