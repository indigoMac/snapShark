-- Share links for trips and individual places. Token presence means the
-- link is live; clearing it revokes access.
ALTER TABLE "Trip" ADD COLUMN "shareToken" TEXT;
CREATE UNIQUE INDEX "Trip_shareToken_key" ON "Trip"("shareToken");

ALTER TABLE "DiveSite" ADD COLUMN "shareToken" TEXT;
CREATE UNIQUE INDEX "DiveSite_shareToken_key" ON "DiveSite"("shareToken");
