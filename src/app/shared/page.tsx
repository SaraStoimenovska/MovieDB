import { type Metadata } from "next";
import { AddAllToListButton } from "@/modules/library";
import { SharedListPage } from "@/modules/sharing/server";

export const metadata: Metadata = {
  title: "Shared list",
  // Personal lists in links: keep them out of search engines.
  robots: { index: false },
};

export default function SharedPage({ searchParams }: PageProps<"/shared">) {
  return (
    <SharedListPage
      searchParams={searchParams}
      renderActions={(items) => <AddAllToListButton items={items} />}
    />
  );
}
