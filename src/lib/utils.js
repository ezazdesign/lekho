import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const DRIVE_REGEX = /(?:https?:\/\/)?(?:drive\.google\.com\/(?:file\/d\/|open\?id=|folders\/)|docs\.google\.com\/(?:document|spreadsheets|presentation)\/d\/)[a-zA-Z0-9_-]+/;

export const parseDriveLink = (text) => {
  if (!text) return null;
  const match = text.match(DRIVE_REGEX);
  return match ? match[0] : null;
};
