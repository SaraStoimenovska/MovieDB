import { type Metadata } from "next";
import { BrowseView } from "@/modules/catalog/server";

export const metadata: Metadata = {
  title: "Browse",
  description: "Browse movies and TV series by popularity, rating, genre and year.",
};

export default function BrowsePage({ searchParams }: PageProps<"/browse">) {
  return <BrowseView searchParams={searchParams} />;
}
