import { Compass } from "lucide-react";
import { ComingSoon } from "@/features/placeholder/ComingSoon";

export default function NotFound() {
  return (
    <ComingSoon
      icon={Compass}
      title="No encontramos esta página"
      description="Puede que el enlace haya cambiado. Tu información sigue igual."
    />
  );
}
