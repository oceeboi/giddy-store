export type ProductReference = {
  id: string;
  name: string | null;
  slug: string | null;
};

export type ProductMedia = {
  url: string;
  alt: string;
  type: string; // e.g., "image", "video"
  order: number;
  colorId?: string | null; // Crucial: Links specific photos to a selected colorway
};

export type ProductPricing = {
  currency: string;
  basePrice: number;
  compareAtPrice: number | null;
  costPrice?: number | null;
};

export type ProductColor = {
  id: string;
  name: string; // e.g., "Vintage Washed Black", "Sage Green"
  hexCode?: string | null; // e.g., "#1c1c1c" for UI color swatches
  swatchImage?: string | null; // Optional for patterned/tie-dye fabrics
};

export type ProductVariant = {
  id: string;
  colorId: string; // Links this specific stock item to a color
  sizeId: string;
  size: string; // e.g., "S", "M", "L", "XL" or "32x32" for denim
  sku: string | null;
  barcode: string | null;
  stockQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  reorderLevel: number;
  active: boolean;
  priceOverride?: number | null; // Useful if XL/XXL costs slightly more
};

export type ProductSeo = {
  title: string | null;
  description: string | null;
  keywords: string[];
};

export type IAdditionalSection = {
  title: string; // e.g., "Size & Fit Guide", "Care Instructions", "Shipping & Returns"
  content: string;
};

export type ProductDescription = {
  narrative: string; // The editorial story, drop theme, or design inspiration
  styleCode: string | null; // e.g., "DRP26-HD-04"
  fitType: string | null; // e.g., "Oversized Fit", "Boxy Cut", "Slim Fit"
  fabricComposition: string | null; // e.g., "450gsm Heavyweight 100% Organic Cotton"
  careInstructions: string[]; // e.g., ["Machine wash cold", "Hang dry recommended", "Do not iron print"]
  releaseDate: Date | null;
  editorialHighlights: string[]; // e.g., "Custom molded hardware", "Distressed ribbing"
  additionalSections: IAdditionalSection[];
};

export type ClothingProductData = {
  id: string;
  name: string;
  slug: string;
  brand: ProductReference | null;
  category: ProductReference | null; // e.g., "Outerwear", "T-Shirts", "Denim"
  collections: ProductReference[]; // e.g., "SS26 Drop 1", "Core Essentials"
  productType: string; // e.g., "Hoodie", "Cargo Pants"
  gender: string; // e.g., "Unisex", "Men", "Women"
  colors: ProductColor[]; // Available color options for this garment
  description: ProductDescription | null;
  features: string[];
  media: ProductMedia[];
  variants: ProductVariant[]; // Replaces flat sizes to handle Color x Size matrix cleanly
  pricing: ProductPricing;
  seo: ProductSeo;
  tags: string[];
  active?: boolean;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};
