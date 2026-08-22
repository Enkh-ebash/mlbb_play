import mongoose from "mongoose";

const MONGO_URI = process.env.MONGO_URI ?? "mongodb://localhost:27017/mlbb_play";
const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 3000;

export async function connectMongo(retries = MAX_RETRIES): Promise<void> {
  try {
    await mongoose.connect(MONGO_URI);
    console.log(`[mongo] connected -> ${MONGO_URI}`);
  } catch (err) {
    if (retries === 0) {
      console.error("[mongo] failed to connect after all retries", err);
      throw err;
    }
    console.warn(
      `[mongo] connection failed, retrying in ${RETRY_DELAY_MS}ms (${retries} left)`
    );
    await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
    return connectMongo(retries - 1);
  }
}

export function isMongoConnected(): boolean {
  return mongoose.connection.readyState === 1;
}
