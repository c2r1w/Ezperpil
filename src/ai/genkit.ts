import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

/**
 * The global Genkit instance. This is used to define flows, prompts, and other
 * Genkit resources.
 *
 * Genkit plugins can be configured in this file.
 */
export const ai = genkit({
  // This is where defaultModel should be.
  // It applies to the entire Genkit instance.
  // defaultModel: 'gemini-1.5-flash-latest',
  plugins: [
    googleAI({
      // The googleAI plugin does NOT take a defaultModel option here.
      // Its options are for configuring the Google AI service itself.
    }),
  ],
});