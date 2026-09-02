import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines class names dynamically using `clsx` and resolves Tailwind CSS class conflicts using `tailwind-merge`.
 * 
 * Example usage:
 * cn("bg-indigo-600 p-4", condition && "bg-purple-600", "p-6") 
 * => Returns "bg-purple-600 p-6" (safely overrides background color and padding without CSS rule conflicts)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
