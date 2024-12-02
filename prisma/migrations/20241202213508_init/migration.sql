-- CreateTable
CREATE TABLE "Collection" (
    "id" SERIAL NOT NULL,
    "collectionName" VARCHAR(255) NOT NULL,
    "description" VARCHAR(500) NOT NULL,
    "host" VARCHAR(255) NOT NULL,
    "port" INTEGER NOT NULL,
    "searchK" INTEGER NOT NULL,
    "hashCollection" VARCHAR(255) NOT NULL,
    "lastUpdate" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Collection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "uuid" VARCHAR(255) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "Session" (
    "userUuid" VARCHAR(255) NOT NULL,
    "sessionId" VARCHAR(255) NOT NULL,
    "creationDate" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("userUuid","sessionId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Collection_collectionName_key" ON "Collection"("collectionName");

-- CreateIndex
CREATE INDEX "Collection_collectionName_idx" ON "Collection"("collectionName");

-- CreateIndex
CREATE INDEX "Session_userUuid_idx" ON "Session"("userUuid");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userUuid_fkey" FOREIGN KEY ("userUuid") REFERENCES "User"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;
