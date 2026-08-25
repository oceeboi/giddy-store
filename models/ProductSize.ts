import mongoose, { Document, Model, Schema } from 'mongoose';

// ─── Interface ────────────────────────────────────────────────────────────────

export interface IProductSize extends Document {
  name: string;
  slug: string;
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const ProductSizeSchema = new Schema<IProductSize>(
  {
    name: {
      type: String,
      required: [true, 'Product size name is required'],
      trim: true,
      maxlength: [100, 'Product size name cannot exceed 100 characters'],
    },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: 'productsizes',
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

ProductSizeSchema.index({ name: 1 });

// ─── Model ────────────────────────────────────────────────────────────────────

const ProductSize: Model<IProductSize> =
  mongoose.models.ProductSize ?? mongoose.model<IProductSize>('ProductSize', ProductSizeSchema);

export default ProductSize;
