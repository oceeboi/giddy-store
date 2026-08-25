import { Schema } from 'mongoose';

const ProductSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [200, 'Product name cannot exceed 200 characters'],
  },
});

ProductSchema.index({ name: 1 });
