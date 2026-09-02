-- Photos are now referenced by private storage pathname rather than a public URL.
ALTER TABLE "Photo" RENAME COLUMN "url" TO "storageRef";
