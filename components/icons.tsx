import {
  Upload,
  Download,
  Copy,
  CheckCircle2,
  AlertCircle,
  Clock,
  XCircle,
  Radar,
  type LucideIcon,
} from "lucide-react";

export type Icon = LucideIcon;

export const Icons = {
  upload: Upload,
  download: Download,
  copy: Copy,
  status: {
    optimal: CheckCircle2,
    approaching: Clock,
    late: AlertCircle,
    offCycle: XCircle,
  },
  logo: Radar,
};
