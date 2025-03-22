import mongoose, { Schema, models } from 'mongoose';

export interface ICat {
  name: string;
  image: string;
  description?: string;
  location: {
    coordinates: [number, number]; // [longitude, latitude]
    address?: string;
  };
  tags?: string[];
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

const CatSchema = new Schema<ICat>(
  {
    name: { type: String, required: true },
    image: { type: String, required: true },
    description: { type: String },
    location: {
      coordinates: {
        type: [Number, Number],
        required: true,
        index: '2dsphere'
      },
      address: { type: String }
    },
    tags: [{ type: String }],
    userId: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export const Cat = models.Cat || mongoose.model<ICat>('Cat', CatSchema); 