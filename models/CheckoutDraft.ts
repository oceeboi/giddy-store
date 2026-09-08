import mongoose, { Schema, Document, Model } from 'mongoose';
import { nanoid } from 'nanoid';

export interface ICheckoutItem {
  productId: string;
  variantId: string;
  sku: string;
  title: string;
  size?: string;
  color?: string;
  price: number;
  quantity: number;
  image: string;
  isReserved?: boolean;
}

export interface IAddress {
  firstName: string;
  lastName: string;
  company?: string;
  email: string;
  phone: string;
  streetAddress: string;
  apartment?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface IGiftOptions {
  isGift: boolean;
  giftMessage?: string;
  complimentaryGiftWrapping?: boolean;
}

export interface ICheckoutDraft extends Document {
  // Public-facing token used in shareable URLs (e.g. brand.com/checkout/chk_x8N2kL9q)
  checkoutToken: string;
  userId?: string;
  guestEmail?: string;

  cartItems: ICheckoutItem[];
  shippingAddress?: IAddress;
  billingAddress?: IAddress;

  giftOptions?: IGiftOptions;
  clientNotes?: string; // Optional concierge / special delivery instructions

  shippingMethod?: {
    id: string;
    name: string;
    cost: number;
  };

  pricingSummary: {
    subtotal: number;
    shippingCost: number;
    taxAmount: number;
    totalAmount: number;
    currency: string;
  };

  status: 'DRAFT' | 'PROCESSING' | 'COMPLETED' | 'EXPIRED' | 'ABANDONED';
  paymentIntentId?: string;

  // Luxury feature: Reserve inventory for 2 hours during draft state
  reservedUntil: Date;
  expiresAt: Date; // TTL MongoDB hard-delete index
  createdAt: Date;
  updatedAt: Date;
}

const AddressSchema = new Schema<IAddress>(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    company: { type: String, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    streetAddress: { type: String, required: true, trim: true },
    apartment: { type: String, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    postalCode: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true, default: 'SA' },
  },
  { _id: false }
);

const CheckoutItemSchema = new Schema<ICheckoutItem>(
  {
    productId: { type: String, required: true },
    variantId: { type: String, required: true },
    sku: { type: String, required: true },
    title: { type: String, required: true },
    size: { type: String },
    color: { type: String },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    image: { type: String, required: true },
    isReserved: { type: Boolean, default: true },
  },
  { _id: false }
);

const CheckoutDraftSchema = new Schema<ICheckoutDraft>(
  {
    // Clean, elegant token generated on creation (e.g., chk_Ab12Cd34)
    checkoutToken: {
      type: String,
      required: true,
      unique: true,
      index: true,
      default: () => `chk_${nanoid(12)}`,
    },
    userId: { type: String, index: true },
    guestEmail: { type: String, lowercase: true, trim: true },

    cartItems: { type: [CheckoutItemSchema], required: true },
    shippingAddress: { type: AddressSchema },
    billingAddress: { type: AddressSchema },

    giftOptions: {
      isGift: { type: Boolean, default: false },
      giftMessage: { type: String, maxlength: 500 },
      complimentaryGiftWrapping: { type: Boolean, default: false },
    },
    clientNotes: { type: String, maxlength: 1000 },

    shippingMethod: {
      id: { type: String },
      name: { type: String },
      cost: { type: Number, default: 0 },
    },

    pricingSummary: {
      subtotal: { type: Number, required: true, default: 0 },
      shippingCost: { type: Number, required: true, default: 0 },
      taxAmount: { type: Number, required: true, default: 0 },
      totalAmount: { type: Number, required: true, default: 0 },
      currency: { type: String, required: true, default: 'USD', uppercase: true },
    },

    status: {
      type: String,
      enum: ['DRAFT', 'PROCESSING', 'COMPLETED', 'EXPIRED', 'ABANDONED'],
      default: 'DRAFT',
      index: true,
    },

    paymentIntentId: { type: String, unique: true, sparse: true },

    // Hold stock for 2 hours so low-quantity luxury items don't sell out during checkout
    // This is a soft reservation; if the draft expires, the stock is released back to inventory after  15 minutes of inactivity. The reservedUntil field is updated on each draft save.
    reservedUntil: {
      type: Date,
      default: () => new Date(Date.now() + 15 * 60 * 1000),
    },

    // Auto-cleanup stale drafts after 14 days
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      index: { expires: 0 },
    },
  },
  {
    timestamps: true,
  }
);

export const CheckoutDraft: Model<ICheckoutDraft> =
  mongoose.models.CheckoutDraft ||
  mongoose.model<ICheckoutDraft>('CheckoutDraft', CheckoutDraftSchema);
