import Link from "next/link";
import { Headphones } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--background)] text-[var(--foreground)] px-4">
      <div className="text-center space-y-4 max-w-md">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
          <Headphones className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold">Lecture Not Found</h2>
        <p className="text-sm text-[var(--muted)]">
          The discourse or page you are looking for is not in the catalogue.
        </p>
        <Link
          href="/"
          className="inline-block px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-medium text-xs transition-all shadow-md shadow-amber-500/20"
        >
          Return to Catalogue
        </Link>
      </div>
    </div>
  );
}
