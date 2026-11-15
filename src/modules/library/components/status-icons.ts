import { Bookmark, Eye, type LucideIcon } from "lucide-react";
import { WatchStatus } from "../model/library";

/** One icon per watch status, shared by the status menu and the My list tabs. */
export const WATCH_STATUS_ICONS: Readonly<Record<WatchStatus, LucideIcon>> = {
  [WatchStatus.ToWatch]: Bookmark,
  [WatchStatus.Watched]: Eye,
};
