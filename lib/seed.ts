import type { Category, Subcategory, CategorySlug } from "./types";

interface CategorySeed {
  name: string;
  slug: CategorySlug;
  productCount: number;
  color: string;
  subcategories: string[];
}

// Category accent colors are deliberately distinct from the format pill colors
// (Post=blue, Reel=purple, Custom=orange, Story=green).
const CATEGORY_SEEDS: CategorySeed[] = [
  {
    name: "Mockup Studio",
    slug: "mockup-studio",
    productCount: 2231,
    color: "#FF90E8", // Gumroad pink
    subcategories: [
      "Alcohol & Beer Bottles",
      "Apparel & Clothing",
      "Bags & Packaging Boxes",
      "Beverage Cans",
      "Billboards & Outdoor Advertising",
      "Bottles - Other",
      "Business Cards",
      "Coffee Cups & Drinkware",
      "Containers & Tubs - Other",
      "Cosmetic & Perfume Bottles",
      "Digital & Device Screens",
      "Food Packaging Mockups",
      "Glass & Drink Bottles",
      "Greeting & Invitation Cards",
      "Health & Supplement Bottles",
      "Household & Industrial Bottles",
      "Leather Goods & Accessories",
      "Logo & Wall Mockups",
      "Other / General Branding",
      "Payment & ID Cards",
      "Print & Posters",
      "Promotional & POS Items",
      "Signage & Storefront",
      "Stationery & Letterhead",
      "Vehicle & Transit Branding",
      "Wall Art & Interior Decor",
    ],
  },
  {
    name: "Packaging",
    slug: "packaging",
    productCount: 948,
    color: "#FFC900", // Gumroad yellow
    subcategories: [
      "Alcoholic Beverages",
      "Baby & Infant",
      "Bakery & Pastries",
      "Biscuits Cookies & Wafers",
      "Breakfast Cereal",
      "Canned Vegetables & Legumes",
      "Chocolate & Confectionery",
      "Cigarettes Vape & Gum",
      "Cleaning & Household",
      "Coffee",
      "Cooking Oil",
      "Cosmetics & Personal Care",
      "Dairy & Milk",
      "Electronics & Appliances",
      "Energy & Soft Drinks",
      "Flour & Baking Goods",
      "Gift Wrap & Holiday",
      "Ice Cream & Frozen Desserts",
      "Juice & Water",
      "Meat & Poultry",
      "Non-Alcoholic Malt Drinks",
      "Other / Uncategorized",
      "Paint & DIY",
      "Pasta Rice & Grains",
      "Payment & Gift Cards",
      "Pet & Bird Food",
      "Pharmaceutical & Health",
      "Pizza & Takeout Boxes",
      "Retail Bags & Generic Packaging",
      "Sauces Condiments & Spreads",
      "Seafood & Canned Fish",
      "Snacks & Chips",
      "Soup",
      "Spices & Seasoning",
      "Sports & Protein Drinks",
      "Syrups & Cordials",
      "Tea",
    ],
  },
  {
    name: "PSD & EPS",
    slug: "psd-eps",
    productCount: 2343,
    color: "#90DDFF", // sky
    subcategories: [
      "Abstract Light Effects & Design Elements",
      "Animals & Wildlife",
      "Beverages & Drinks",
      "Character Illustrations & Mascots",
      "Fruit Cutouts & Collections",
      "Logos & Branding",
      "People & Fashion Portraits",
      "Prepared Food & Desserts",
      "Product & Packaging Mockups",
      "Vegetables Herbs & Nuts",
    ],
  },
];

export function seedCategories(): Category[] {
  return CATEGORY_SEEDS.map((c, order) => ({
    id: `cat-${c.slug}`,
    name: c.name,
    slug: c.slug,
    order,
    productCount: c.productCount,
    color: c.color,
  }));
}

export function seedSubcategories(): Subcategory[] {
  const subs: Subcategory[] = [];
  for (const c of CATEGORY_SEEDS) {
    c.subcategories.forEach((name, order) => {
      subs.push({
        id: `sub-${c.slug}-${order}`,
        categoryId: `cat-${c.slug}`,
        name,
        used: false,
        order,
      });
    });
  }
  return subs;
}
