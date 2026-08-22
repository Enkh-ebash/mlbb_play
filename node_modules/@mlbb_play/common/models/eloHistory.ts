import { Schema, model, Document, Types } from "mongoose";

export interface IEloHistory extends Document {
  userId: Types.ObjectId;
  matchId: string;
  eloBefore: number;
  eloAfter: number;
  eloChange: number;
  kFactor: number;
  performanceBonus: number;
  won: boolean;
  createdAt: Date;
}

const EloHistorySchema = new Schema<IEloHistory>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    matchId: { type: String, required: true, index: true },
    eloBefore: { type: Number, required: true },
    eloAfter: { type: Number, required: true },
    eloChange: { type: Number, required: true },
    kFactor: { type: Number, required: true },
    performanceBonus: { type: Number, required: true },
    won: { type: Boolean, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

EloHistorySchema.index({ userId: 1, createdAt: -1 });

export const EloHistory = model<IEloHistory>("EloHistory", EloHistorySchema);
