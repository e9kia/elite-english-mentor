-- CreateEnum
CREATE TYPE "Role" AS ENUM ('student', 'admin');

-- CreateEnum
CREATE TYPE "WordType" AS ENUM ('noun', 'verb', 'adjective', 'adverb', 'phrase', 'other');

-- CreateEnum
CREATE TYPE "UnitStatus" AS ENUM ('not_started', 'in_progress', 'completed');

-- CreateEnum
CREATE TYPE "DuelStatus" AS ENUM ('waiting', 'active', 'finished', 'cancelled');

-- CreateEnum
CREATE TYPE "DuelType" AS ENUM ('one_v_one', 'group');

-- CreateEnum
CREATE TYPE "QuizType" AS ENUM ('multiple_choice', 'fill_blank', 'matching', 'sentence_build');

-- CreateEnum
CREATE TYPE "TutorMode" AS ENUM ('grammar_check', 'story', 'quiz', 'free_chat');

-- CreateEnum
CREATE TYPE "XpEventType" AS ENUM ('quiz_complete', 'unit_complete', 'duel_win', 'streak_bonus', 'pronunciation_pass');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password_hash" TEXT,
    "avatar_url" TEXT,
    "role" "Role" NOT NULL DEFAULT 'student',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "oauth_accounts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,

    CONSTRAINT "oauth_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "levels" (
    "id" SERIAL NOT NULL,
    "number" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "color_theme" TEXT,

    CONSTRAINT "levels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "units" (
    "id" SERIAL NOT NULL,
    "level_id" INTEGER NOT NULL,
    "number" INTEGER NOT NULL,
    "title" TEXT NOT NULL,

    CONSTRAINT "units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "words" (
    "id" TEXT NOT NULL,
    "unit_id" INTEGER NOT NULL,
    "word" TEXT NOT NULL,
    "type" "WordType" NOT NULL,
    "definition" TEXT NOT NULL,
    "example" TEXT NOT NULL,
    "phonetic" TEXT,
    "audio_url" TEXT,
    "image_url" TEXT,
    "difficulty" INTEGER NOT NULL DEFAULT 1,
    "import_batch_id" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "words_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_batches" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "uploaded_by" TEXT NOT NULL,
    "total_rows" INTEGER NOT NULL,
    "imported_count" INTEGER NOT NULL DEFAULT 0,
    "skipped_count" INTEGER NOT NULL DEFAULT 0,
    "error_count" INTEGER NOT NULL DEFAULT 0,
    "error_log" JSONB,
    "status" TEXT NOT NULL DEFAULT 'processing',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "import_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_unit_progress" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "unit_id" INTEGER NOT NULL,
    "status" "UnitStatus" NOT NULL DEFAULT 'not_started',
    "score" INTEGER NOT NULL DEFAULT 0,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "user_unit_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_word_mastery" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "word_id" TEXT NOT NULL,
    "mastery_level" INTEGER NOT NULL DEFAULT 0,
    "times_seen" INTEGER NOT NULL DEFAULT 0,
    "times_correct" INTEGER NOT NULL DEFAULT 0,
    "times_wrong" INTEGER NOT NULL DEFAULT 0,
    "ease_factor" DOUBLE PRECISION NOT NULL DEFAULT 2.5,
    "interval" INTEGER NOT NULL DEFAULT 0,
    "last_seen_at" TIMESTAMP(3),
    "next_review_at" TIMESTAMP(3),

    CONSTRAINT "user_word_mastery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_pronunciation_attempts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "word_id" TEXT NOT NULL,
    "audio_url" TEXT,
    "transcript" TEXT,
    "score" DOUBLE PRECISION,
    "feedback" TEXT,
    "attempted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_pronunciation_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_tutor_sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "unit_id" INTEGER,
    "mode" "TutorMode" NOT NULL,
    "input_text" TEXT NOT NULL,
    "ai_response" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_tutor_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_quiz_attempts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "unit_id" INTEGER NOT NULL,
    "quiz_type" "QuizType" NOT NULL,
    "score" INTEGER NOT NULL,
    "max_score" INTEGER NOT NULL,
    "time_taken_sec" INTEGER,
    "attempted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_quiz_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "duels" (
    "id" TEXT NOT NULL,
    "room_code" TEXT NOT NULL,
    "host_user_id" TEXT NOT NULL,
    "unit_id" INTEGER NOT NULL,
    "duel_type" "DuelType" NOT NULL DEFAULT 'one_v_one',
    "max_participants" INTEGER NOT NULL DEFAULT 2,
    "question_count" INTEGER NOT NULL DEFAULT 10,
    "time_limit_sec" INTEGER NOT NULL DEFAULT 30,
    "status" "DuelStatus" NOT NULL DEFAULT 'waiting',
    "winner_id" TEXT,
    "started_at" TIMESTAMP(3),
    "finished_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "duels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "duel_participants" (
    "id" TEXT NOT NULL,
    "duel_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "is_ready" BOOLEAN NOT NULL DEFAULT false,
    "rank" INTEGER,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "duel_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "duel_answers" (
    "id" TEXT NOT NULL,
    "duel_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "word_id" TEXT NOT NULL,
    "answer_given" TEXT NOT NULL,
    "is_correct" BOOLEAN NOT NULL,
    "time_taken_ms" INTEGER,
    "answered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "duel_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leaderboard_snapshots" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "total_xp" INTEGER NOT NULL DEFAULT 0,
    "duels_won" INTEGER NOT NULL DEFAULT 0,
    "duels_played" INTEGER NOT NULL DEFAULT 0,
    "win_rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "streak_days" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leaderboard_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "xp_events" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "event_type" "XpEventType" NOT NULL,
    "xp_earned" INTEGER NOT NULL,
    "reference_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "xp_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "badges" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon_url" TEXT,
    "condition_type" TEXT NOT NULL,
    "condition_value" INTEGER NOT NULL,

    CONSTRAINT "badges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_badges" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "badge_id" INTEGER NOT NULL,
    "earned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_badges_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "oauth_accounts_provider_provider_id_key" ON "oauth_accounts"("provider", "provider_id");

-- CreateIndex
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "levels_number_key" ON "levels"("number");

-- CreateIndex
CREATE INDEX "units_level_id_idx" ON "units"("level_id");

-- CreateIndex
CREATE UNIQUE INDEX "units_level_id_number_key" ON "units"("level_id", "number");

-- CreateIndex
CREATE INDEX "words_word_idx" ON "words"("word");

-- CreateIndex
CREATE INDEX "words_unit_id_idx" ON "words"("unit_id");

-- CreateIndex
CREATE UNIQUE INDEX "words_unit_id_word_key" ON "words"("unit_id", "word");

-- CreateIndex
CREATE INDEX "user_unit_progress_user_id_idx" ON "user_unit_progress"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_unit_progress_user_id_unit_id_key" ON "user_unit_progress"("user_id", "unit_id");

-- CreateIndex
CREATE INDEX "user_word_mastery_user_id_next_review_at_idx" ON "user_word_mastery"("user_id", "next_review_at");

-- CreateIndex
CREATE UNIQUE INDEX "user_word_mastery_user_id_word_id_key" ON "user_word_mastery"("user_id", "word_id");

-- CreateIndex
CREATE INDEX "user_pronunciation_attempts_user_id_word_id_idx" ON "user_pronunciation_attempts"("user_id", "word_id");

-- CreateIndex
CREATE INDEX "user_tutor_sessions_user_id_idx" ON "user_tutor_sessions"("user_id");

-- CreateIndex
CREATE INDEX "user_quiz_attempts_user_id_idx" ON "user_quiz_attempts"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "duels_room_code_key" ON "duels"("room_code");

-- CreateIndex
CREATE INDEX "duels_room_code_idx" ON "duels"("room_code");

-- CreateIndex
CREATE INDEX "duels_status_idx" ON "duels"("status");

-- CreateIndex
CREATE INDEX "duel_participants_duel_id_idx" ON "duel_participants"("duel_id");

-- CreateIndex
CREATE UNIQUE INDEX "duel_participants_duel_id_user_id_key" ON "duel_participants"("duel_id", "user_id");

-- CreateIndex
CREATE INDEX "duel_answers_duel_id_user_id_idx" ON "duel_answers"("duel_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "leaderboard_snapshots_user_id_key" ON "leaderboard_snapshots"("user_id");

-- CreateIndex
CREATE INDEX "xp_events_user_id_created_at_idx" ON "xp_events"("user_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "badges_name_key" ON "badges"("name");

-- CreateIndex
CREATE UNIQUE INDEX "user_badges_user_id_badge_id_key" ON "user_badges"("user_id", "badge_id");

-- AddForeignKey
ALTER TABLE "oauth_accounts" ADD CONSTRAINT "oauth_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "units" ADD CONSTRAINT "units_level_id_fkey" FOREIGN KEY ("level_id") REFERENCES "levels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "words" ADD CONSTRAINT "words_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "words" ADD CONSTRAINT "words_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "words" ADD CONSTRAINT "words_import_batch_id_fkey" FOREIGN KEY ("import_batch_id") REFERENCES "import_batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_batches" ADD CONSTRAINT "import_batches_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_unit_progress" ADD CONSTRAINT "user_unit_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_unit_progress" ADD CONSTRAINT "user_unit_progress_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_word_mastery" ADD CONSTRAINT "user_word_mastery_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_word_mastery" ADD CONSTRAINT "user_word_mastery_word_id_fkey" FOREIGN KEY ("word_id") REFERENCES "words"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_pronunciation_attempts" ADD CONSTRAINT "user_pronunciation_attempts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_pronunciation_attempts" ADD CONSTRAINT "user_pronunciation_attempts_word_id_fkey" FOREIGN KEY ("word_id") REFERENCES "words"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_tutor_sessions" ADD CONSTRAINT "user_tutor_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_tutor_sessions" ADD CONSTRAINT "user_tutor_sessions_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_quiz_attempts" ADD CONSTRAINT "user_quiz_attempts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_quiz_attempts" ADD CONSTRAINT "user_quiz_attempts_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "duels" ADD CONSTRAINT "duels_host_user_id_fkey" FOREIGN KEY ("host_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "duels" ADD CONSTRAINT "duels_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "duels" ADD CONSTRAINT "duels_winner_id_fkey" FOREIGN KEY ("winner_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "duel_participants" ADD CONSTRAINT "duel_participants_duel_id_fkey" FOREIGN KEY ("duel_id") REFERENCES "duels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "duel_participants" ADD CONSTRAINT "duel_participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "duel_answers" ADD CONSTRAINT "duel_answers_duel_id_fkey" FOREIGN KEY ("duel_id") REFERENCES "duels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "duel_answers" ADD CONSTRAINT "duel_answers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "duel_answers" ADD CONSTRAINT "duel_answers_word_id_fkey" FOREIGN KEY ("word_id") REFERENCES "words"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leaderboard_snapshots" ADD CONSTRAINT "leaderboard_snapshots_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "xp_events" ADD CONSTRAINT "xp_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_badge_id_fkey" FOREIGN KEY ("badge_id") REFERENCES "badges"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
