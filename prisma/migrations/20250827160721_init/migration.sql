-- CreateTable
CREATE TABLE "public"."Blog" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "excerpt" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "tags" TEXT[],
    "status" TEXT NOT NULL,
    "featuredImage" TEXT,
    "readingTime" INTEGER NOT NULL,
    "engagement" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3),

    CONSTRAINT "Blog_pkey" PRIMARY KEY ("id")
);
