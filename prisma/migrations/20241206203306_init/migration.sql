/*
  Warnings:

  - You are about to drop the `Collection` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "Collection";

-- CreateTable
CREATE TABLE "collections" (
    "id" SERIAL NOT NULL,
    "collectionName" VARCHAR(255) NOT NULL,
    "description" VARCHAR(500) NOT NULL,
    "host" VARCHAR(255) NOT NULL,
    "port" INTEGER NOT NULL,
    "searchK" INTEGER NOT NULL,
    "hashCollection" VARCHAR(255) NOT NULL,
    "lastUpdate" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "collections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "langchain_chat_histories" (
    "id" SERIAL NOT NULL,
    "session_id" VARCHAR(255) NOT NULL,
    "message" JSONB NOT NULL,

    CONSTRAINT "langchain_chat_histories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "collections_collectionName_key" ON "collections"("collectionName");

-- CreateIndex
CREATE INDEX "collections_collectionName_idx" ON "collections"("collectionName");
