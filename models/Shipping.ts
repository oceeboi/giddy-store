import mongoose, { Document, Model, Schema } from 'mongoose';

/**
 * @author Oghenekevwe Osieta <osieta33@agmail.com>
 */
// Singleton document — there is only ever one Shipping row.
// This is the master switchboard for features that aren't ready to be
// permanent yet. Nothing in checkout/webhook logic should hardcode these
// numbers directly — always read from here, so a client decision to pause
// or change the program never requires a code deploy.

export interface IShipping extends Document {
  shippingFee: number;
  isShippingFree: boolean;
}

export interface IShippingModel extends Model<IShipping> {
  getSingleton(): Promise<IShipping>;
}

const shippingSchema = new Schema<IShipping, IShippingModel>(
  {
    shippingFee: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    isShippingFree: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Helper method to enforce singleton pattern and avoid race conditions
shippingSchema.statics.getSingleton = async function (): Promise<IShipping> {
  return this.findOneAndUpdate(
    {},
    {
      $setOnInsert: {
        shippingFee: 0,
        isShippingFree: false,
      },
    },
    {
      returnDocument: 'after',
      upsert: true,
      setDefaultsOnInsert: true,
    }
  ).exec();
};

export const Shipping: IShippingModel =
  (mongoose.models.Shipping as IShippingModel) ||
  mongoose.model<IShipping, IShippingModel>('Shipping', shippingSchema);

export default Shipping;
