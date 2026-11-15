import "server-only";

/** Server-only public API of the collections module (movie franchises). */
export { collectionStaticParams, getCollection } from "./api/server";
export { CollectionPage } from "./components/CollectionPage";
export { CollectionSection } from "./components/CollectionSection";
