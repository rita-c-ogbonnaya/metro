import { format } from "date-fns";

export const formatNGN = (amount: number) =>
  `₦${amount.toLocaleString("en-NG", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

export const formatNGNFull = (amount: number) =>
  `₦${amount.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const formatDate = (d: Date | string) => format(new Date(d), "dd MMM yyyy");
export const formatDateShort = (d: Date | string) => format(new Date(d), "dd-MMM-yyyy");
