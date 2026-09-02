-- AlterTable
ALTER TABLE "DiveSite" ADD COLUMN     "tripId" TEXT;

-- CreateTable
CREATE TABLE "Trip" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Trip_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Trip_userId_idx" ON "Trip"("userId");

-- CreateIndex
CREATE INDEX "Dive_userId_idx" ON "Dive"("userId");

-- CreateIndex
CREATE INDEX "Dive_siteId_idx" ON "Dive"("siteId");

-- CreateIndex
CREATE INDEX "DiveSite_userId_idx" ON "DiveSite"("userId");

-- CreateIndex
CREATE INDEX "DiveSite_tripId_idx" ON "DiveSite"("tripId");

-- CreateIndex
CREATE INDEX "Photo_diveId_idx" ON "Photo"("diveId");

-- AddForeignKey
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiveSite" ADD CONSTRAINT "DiveSite_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE SET NULL ON UPDATE CASCADE;
