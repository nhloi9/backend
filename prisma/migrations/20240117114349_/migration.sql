-- CreateTable
CREATE TABLE "onlineUser" (
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "numberOfOnlineUsers" INTEGER
);

-- CreateIndex
CREATE UNIQUE INDEX "onlineUser_month_year_key" ON "onlineUser"("month", "year");
