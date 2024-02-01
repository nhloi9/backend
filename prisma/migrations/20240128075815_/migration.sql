-- CreateTable
CREATE TABLE "_block" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "_mesBlock" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_block_AB_unique" ON "_block"("A", "B");

-- CreateIndex
CREATE INDEX "_block_B_index" ON "_block"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_mesBlock_AB_unique" ON "_mesBlock"("A", "B");

-- CreateIndex
CREATE INDEX "_mesBlock_B_index" ON "_mesBlock"("B");

-- AddForeignKey
ALTER TABLE "_block" ADD CONSTRAINT "_block_A_fkey" FOREIGN KEY ("A") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_block" ADD CONSTRAINT "_block_B_fkey" FOREIGN KEY ("B") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_mesBlock" ADD CONSTRAINT "_mesBlock_A_fkey" FOREIGN KEY ("A") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_mesBlock" ADD CONSTRAINT "_mesBlock_B_fkey" FOREIGN KEY ("B") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
