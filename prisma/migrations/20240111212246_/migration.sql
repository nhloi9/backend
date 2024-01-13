-- CreateTable
CREATE TABLE "_save" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_save_AB_unique" ON "_save"("A", "B");

-- CreateIndex
CREATE INDEX "_save_B_index" ON "_save"("B");

-- AddForeignKey
ALTER TABLE "_save" ADD CONSTRAINT "_save_A_fkey" FOREIGN KEY ("A") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_save" ADD CONSTRAINT "_save_B_fkey" FOREIGN KEY ("B") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
