import { OrbitLoader } from "@/components/ui/Loader";

export default function Loading() {
  return (
    <div className="grid min-h-[100svh] place-items-center">
      <OrbitLoader label="Preparing your journey…" />
    </div>
  );
}
