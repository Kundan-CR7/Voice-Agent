import { createClient } from "@deepgram/sdk";

if (!process.env.DEEPGRAM_API_KEY) {
  throw new Error(
    "DEEPGRAM_API_KEY is missing. Did you forget to add it to backend/.env?"
  );
}

export const deepgram = createClient(process.env.DEEPGRAM_API_KEY);
