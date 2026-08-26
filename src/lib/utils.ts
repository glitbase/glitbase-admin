import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Shorten long strings by keeping the start and end, e.g. "abc...xyz". */
export function middleTruncate(value: string, startChars = 8, endChars = 6): string {
  if (value.length <= startChars + endChars + 3) {
    return value;
  }
  return `${value.slice(0, startChars)}...${value.slice(-endChars)}`;
}
