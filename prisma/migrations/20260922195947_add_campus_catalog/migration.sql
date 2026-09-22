-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "campusId" TEXT;

-- CreateTable
CREATE TABLE "Campus" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Campus_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Campus_name_key" ON "Campus"("name");

-- CreateIndex
CREATE INDEX "Campus_order_idx" ON "Campus"("order");

-- CreateIndex
CREATE INDEX "Profile_campusId_idx" ON "Profile"("campusId");

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "Campus"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Campus institucionales iniciales. Los cambios posteriores se hacen desde
-- Settings › Catalog, NO re-seedeando.
INSERT INTO "Campus" ("id", "name", "order", "active", "updatedAt") VALUES
  ('campus_mixcoac', 'Mixcoac', 0, true, CURRENT_TIMESTAMP),
  ('campus_ciudad_up', 'Ciudad UP', 1, true, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
