-- CreateTable
CREATE TABLE "public"."analysis_history" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "videoName" TEXT NOT NULL,
    "videoFileName" TEXT NOT NULL,
    "handsOnTable" DOUBLE PRECISION,
    "hiddenHands" DOUBLE PRECISION,
    "gestureOnTable" DOUBLE PRECISION,
    "selfTouch" DOUBLE PRECISION,
    "otherGestures" DOUBLE PRECISION,
    "smileScore" DOUBLE PRECISION,
    "gestureFrames" INTEGER,
    "facialFrames" INTEGER,
    "processingTime" DOUBLE PRECISION,
    "gestureSuccess" BOOLEAN NOT NULL DEFAULT false,
    "facialSuccess" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analysis_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "analysis_history_userId_idx" ON "public"."analysis_history"("userId");

-- CreateIndex
CREATE INDEX "analysis_history_createdAt_idx" ON "public"."analysis_history"("createdAt");

-- AddForeignKey
ALTER TABLE "public"."analysis_history" ADD CONSTRAINT "analysis_history_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
