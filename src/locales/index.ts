import { Locale, TranslationDictionary } from "@/types/i18n";
import { en } from "./en";
import { hi } from "./hi";

export const dictionaries: Record<Locale, TranslationDictionary> = {
  en,
  hi,
};

export { en, hi };
