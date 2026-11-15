import Link from "next/link";
import { routes } from "@/shared/config/routes";
import { Button } from "@/shared/ui/button";

export default function NotFound() {
  return (
    <section className="mx-auto max-w-md space-y-4 py-24 text-center">
      <p className="text-sm font-medium text-muted-foreground">404</p>
      <h1 className="text-3xl font-bold">Page not found</h1>
      <p className="text-muted-foreground">
        The movie or page you&apos;re looking for doesn&apos;t exist.
      </p>
      <Button asChild>
        <Link href={routes.home()}>Back to home</Link>
      </Button>
    </section>
  );
}
