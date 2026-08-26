import { Gender, ProductType } from '@/types/shared/product';
import { generateUniqueSlug } from '@/utils/slug';
import mongoose, { Document, Model, Schema } from 'mongoose';

export const MediaType = {
  IMAGE: 'image', // photos, illustrations, etc.
  VIDEO: 'video', // mp4, webm, etc.
} as const;
export type MediaType = (typeof MediaType)[keyof typeof MediaType];

export const EnumProductType = {
  SNEAKER: 'sneaker', // footwear
  APPAREL: 'apparel', // clothing
  ACCESSORY: 'accessory', // bags, hats, jewelry, etc.
  EQUIPMENT: 'equipment', // sports gear, electronics, etc.
} as const;
export type EnumProductType = (typeof EnumProductType)[keyof typeof EnumProductType];

interface IMedia {
  url: string;
  alt: string;
  type: MediaType;
  order: number;
  colorId: string | null;
  _id?: mongoose.Types.ObjectId;
}

interface IDescription {
  narrative: string; // The editorial story, drop theme, or design inspiration
  styleCode: string | null; // e.g., "DRP26-HD-04"
  fitType: string | null; // e.g., "Oversized Fit", "Boxy Cut", "Slim Fit"
  fabricComposition: string | null; // e.g., "450gsm Heavyweight 100% Organic Cotton"
  careInstructions: string[]; // e.g., ["Machine wash cold", "Hang dry recommended", "Do not iron print"]
  releaseDate: Date | string | null;
  editorialHighlights: string[]; // e.g., "Custom molded hardware", "Distressed ribbing"
  additionalSections: IAdditionalSection[];
}

interface IAdditionalSection {
  title: string; // e.g. "Authenticity", "Packaging", "Sizing Guide"
  content: string;
}

interface IColor {
  _id?: mongoose.Types.ObjectId;
  name: string; // e.g., "Vintage Washed Black", "Sage Green"
  hexCode?: string | null; // e.g., "#1c1c1c" for UI color swatches
  swatchImage?: string | null; // Optional for patterned/tie-dye fabrics
}

export interface IPricing {
  currency: string; // ISO 4217 e.g. "NGN"
  basePrice: number; // in the smallest unit (kobo for NGN)
  compareAtPrice: number | null; // crossed-out "was" price
  costPrice: number | null; // internal margin tracking, never exposed to client
}

export interface IProductVariant {
  colorId: string; // Links this specific stock item to a color
  sizeId: mongoose.Types.ObjectId;
  size: string; // e.g., "S", "M", "L", "XL" or "32x32" for denim
  sku: string | null;
  barcode: string | null;
  stockQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  reorderLevel: number;
  active: boolean;
  priceOverride?: number | null; // Useful if XL/XXL costs slightly more
  _id?: mongoose.Types.ObjectId;
}

export interface ISeo {
  title: string | null;
  description: string | null;
  keywords: string[];
}

export interface IProduct extends Document {
  name: string;
  slug: string;
  brand: mongoose.Types.ObjectId;
  category: mongoose.Types.ObjectId;
  collections: mongoose.Types.ObjectId[]; // many-to-many via reference

  productType: ProductType;
  gender: Gender;
  colors: IColor[];

  description: IDescription;
  features: string[]; // bullet-point feature list

  media: IMedia[];
  variants: IProductVariant[];
  pricing: IPricing;
  seo: ISeo;
  tags: string[];

  active: boolean;
  publishedAt: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

// ─── Sub-schemas ─────────────────────────────────────────────────────────────

const AdditionalSectionSchema = new Schema<IAdditionalSection>({
  title: { type: String, required: true, trim: true },
  content: { type: String, required: true, trim: true },
});

const DescriptionSchema = new Schema<IDescription>({
  narrative: { type: String, required: true, trim: true },
  styleCode: { type: String, default: null, trim: true },
  fitType: { type: String, default: null, trim: true },
  fabricComposition: { type: String, default: null, trim: true },
  careInstructions: { type: [String], default: [] },
  releaseDate: { type: Date, default: null },
  editorialHighlights: { type: [String], default: [] },
  additionalSections: { type: [AdditionalSectionSchema], default: [] },
});

const ColorSchema = new Schema<IColor>({
  name: { type: String, required: true, trim: true },
  hexCode: { type: String, default: null, trim: true },
  swatchImage: { type: String, default: null, trim: true },
});

const MediaSchema = new Schema<IMedia>({
  url: { type: String, required: true, trim: true },
  alt: { type: String, required: true, trim: true },
  type: { type: String, enum: Object.values(MediaType), required: true },
  order: { type: Number, required: true, default: 0 },
  colorId: { type: String, default: null },
});

const ProductVariantSchema = new Schema<IProductVariant>({
  colorId: { type: String, required: true },
  sizeId: { type: Schema.Types.ObjectId, required: true, ref: 'ProductSize' },
  size: { type: String, required: true, trim: true },
  sku: { type: String, default: null, trim: true },
  barcode: { type: String, default: null, trim: true },
  stockQuantity: { type: Number, required: true, default: 0 },
  reservedQuantity: { type: Number, required: true, default: 0 },
  availableQuantity: { type: Number, required: true, default: 0 },
  reorderLevel: { type: Number, required: true, default: 0 },
  active: { type: Boolean, required: true, default: true },
  priceOverride: { type: Number, default: null },
});

const PricingSchema = new Schema<IPricing>(
  {
    currency: {
      type: String,
      required: true,
      default: 'NGN',
      uppercase: true,
      trim: true,
      minlength: 3,
      maxlength: 3,
    },
    basePrice: { type: Number, required: true, min: 0 },
    compareAtPrice: { type: Number, default: null, min: 0 },
    costPrice: { type: Number, default: null, min: 0, select: false },
  },
  { _id: false }
);

const SeoSchema = new Schema<ISeo>({
  title: { type: String, default: null, trim: true },
  description: { type: String, default: null, trim: true },
  keywords: { type: [String], default: [] },
});

// ─── Main Product Schema ─────────────────────────────────────────────────────

const ProductSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [200, 'Product name cannot exceed 200 characters'],
    },
    slug: {
      type: String,
      unique: true,
      index: true,
      required: [true, 'Product slug is required'],
      trim: true,
      lowercase: true,
    },
    brand: {
      type: Schema.Types.ObjectId,
      ref: 'Brand',
      required: [true, 'Brand is required'],
      index: true,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
      index: true,
    },
    collections: {
      type: [Schema.Types.ObjectId],
      ref: 'Collection',
      default: [],
      index: true,
    },
    productType: {
      type: String,
      enum: Object.values(EnumProductType),
      required: [true, 'Product type is required'],
      index: true,
    },
    gender: {
      type: String,
      enum: Object.values(Gender),
      required: [true, 'Gender classification is required'],
      index: true,
    },
    colors: {
      type: [ColorSchema],
      default: [],
    },
    description: {
      type: DescriptionSchema,
      required: true,
    },
    features: {
      type: [String],
      default: [],
    },
    media: {
      type: [MediaSchema],
      default: [],
    },
    variants: {
      type: [ProductVariantSchema],
      default: [],
    },
    pricing: {
      type: PricingSchema,
      required: true,
    },
    seo: {
      type: SeoSchema,
      required: true,
    },
    tags: {
      type: [String],
      default: [],
      index: true,
    },
    active: {
      type: Boolean,
      required: true,
      default: false,
      index: true,
    },
    publishedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

ProductSchema.index({ category: 1, active: 1 });
ProductSchema.index({ brand: 1, active: 1 });
ProductSchema.index({ collections: 1, active: 1 });
ProductSchema.index({ gender: 1, active: 1 });
ProductSchema.index({ productType: 1, active: 1 });
ProductSchema.index({ tags: 1, active: 1 });
ProductSchema.index({ active: 1, publishedAt: -1 });
ProductSchema.index({ name: 'text', description: 'text', tags: 'text' });

// ─── Middleware ───────────────────────────────────────────────────────────────

ProductSchema.pre('validate', async function () {
  const shouldGenerateSlug = (this.isNew || this.isModified('name')) && !this.slug;
  if (!shouldGenerateSlug) return;

  const ProductModel = this.constructor as Model<IProduct>;
  this.slug = await generateUniqueSlug(ProductModel, this.name, this._id?.toString());
});

ProductSchema.pre('save', function () {
  if (this.isModified('active') && this.active && !this.publishedAt) {
    this.publishedAt = new Date();
  }
});

// ─── Model ────────────────────────────────────────────────────────────────────

const Product: Model<IProduct> =
  mongoose.models.Product ?? mongoose.model<IProduct>('Product', ProductSchema);

export default Product;
