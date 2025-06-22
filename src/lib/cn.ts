import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines and deduplicates Tailwind-class strings.
 * Same helper used by shadcn-ui / fumadocs.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
