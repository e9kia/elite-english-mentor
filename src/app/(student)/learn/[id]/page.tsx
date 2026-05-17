// =====================================================================
//  src/app/(student)/learn/[id]/page.tsx
//  Unit Learn Page — Pure DB, Zero AI Latency
//  Designed by Ali Jitam ❤️
// =====================================================================

import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import FlashcardClient from "./FlashcardClient";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Word type → Arabic mapping (local, instant)
const TYPE_ARABIC: Record<string, string> = {
  noun: "اسم", verb: "فعل", adjective: "صفة", adverb: "ظرف",
  preposition: "حرف جر", pronoun: "ضمير", conjunction: "حرف عطف",
  phrase: "عبارة", other: "أخرى",
};

// Fallback Arabic translations (top words)
const KNOWN_AR: Record<string, string> = {
  abandon:"يتخلى عن",ability:"قدرة",absence:"غياب",absorb:"يمتص",abstract:"مجرد",
  abundant:"وفير",academic:"أكاديمي",accomplish:"ينجز",accurate:"دقيق",achieve:"يحقق",
  accept:"يقبل",access:"وصول",account:"حساب",act:"يتصرف",action:"فعل / عمل",
  active:"نشط",actually:"فعلياً",add:"يضيف",address:"عنوان",admit:"يعترف",
  adult:"بالغ",advance:"يتقدم",advantage:"ميزة",advice:"نصيحة",affect:"يؤثر",
  afraid:"خائف",age:"عمر",agree:"يوافق",allow:"يسمح",almost:"تقريباً",
  alone:"وحيد",already:"بالفعل",also:"أيضاً",always:"دائماً",amount:"كمية",
  ancient:"قديم",animal:"حيوان",announce:"يعلن",answer:"جواب",appear:"يظهر",
  apply:"يطبق",approach:"يقترب",area:"منطقة",argue:"يجادل",arrange:"يرتب",
  arrive:"يصل",article:"مقال",attempt:"محاولة",attention:"انتباه",authority:"سلطة",
  available:"متاح",avoid:"يتجنب",aware:"واعٍ",balance:"توازن",base:"قاعدة",
  basic:"أساسي",beautiful:"جميل",because:"لأن",become:"يصبح",before:"قبل",
  begin:"يبدأ",behind:"خلف",believe:"يعتقد",benefit:"فائدة",best:"أفضل",
  family:"عائلة",friend:"صديق",happy:"سعيد",home:"منزل",idea:"فكرة",
  important:"مهم",know:"يعرف",learn:"يتعلم",life:"حياة",love:"حب",
};

export interface EnrichedWord {
  id: string;
  word: string;
  type: string;
  definition: string;
  example: string;
  meaningArabic: string;
  typeArabic: string;
  sentenceArabic: string;
  sentence2: string | null;
  sentence3: string | null;
  sentence4: string | null;
  ipa: string | null;
  collocations: string | null;
  antonyms: string | null;
}

export default async function LearnPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const unitId = parseInt(id);
  if (isNaN(unitId)) return notFound();

  // Optimized query — select only needed fields, no heavy relations
  const unit = await prisma.unit.findUnique({
    where: { id: unitId },
    select: {
      id: true, number: true, title: true,
      level: { select: { number: true } },
      story: true,
      words: {
        orderBy: { word: "asc" },
        select: {
          id: true, word: true, type: true, definition: true, example: true,
          meaningArabic: true, typeArabic: true, sentenceArabic: true,
          sentence2: true, sentence3: true, sentence4: true,
          ipa: true, collocations: true, antonyms: true,
        },
      },
    },
  });

  if (!unit) return notFound();

  // Get user's current word index
  const session = await getServerSession(authOptions);
  let resolvedUserId: string | undefined = session?.user?.id;
  if (!resolvedUserId) {
    const admin = await prisma.user.findFirst({ where: { role: "admin" }, select: { id: true } });
    resolvedUserId = admin?.id ?? undefined;
  }

  let currentWordIndex = 0;
  if (resolvedUserId) {
    const progress = await prisma.userUnitProgress.findUnique({
      where: { userId_unitId: { userId: resolvedUserId, unitId } },
      select: { currentWordIndex: true },
    });
    currentWordIndex = progress?.currentWordIndex ?? 0;
  }

  // Enrich words — PURE DB, no AI calls. Fallback from local dictionary if needed.
  const enrichedWords: EnrichedWord[] = unit.words.map((w) => ({
    id: w.id,
    word: w.word,
    type: w.type,
    definition: w.definition,
    example: w.example,
    meaningArabic: w.meaningArabic || KNOWN_AR[w.word.toLowerCase()] || w.definition,
    typeArabic: w.typeArabic || TYPE_ARABIC[w.type.toLowerCase()] || "أخرى",
    sentenceArabic: w.sentenceArabic || "",
    sentence2: w.sentence2,
    sentence3: w.sentence3,
    sentence4: w.sentence4,
    ipa: w.ipa,
    collocations: w.collocations,
    antonyms: w.antonyms,
  }));

  if (enrichedWords.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 animate-fade-in px-4">
        <div className="h-20 w-20 rounded-[2rem] bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shadow-xl">
          <svg className="h-10 w-10 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl font-black text-foreground mb-2 italic">Unit {unit.number} is empty</h1>
          <p className="text-muted-foreground font-medium">Upload words via the Admin panel to begin learning.</p>
        </div>
        <Link href="/dashboard" className="bg-primary text-primary-foreground px-8 py-3 rounded-2xl font-black shadow-2xl shadow-primary/20 hover:scale-105 transition-all">
          Return to Hub
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 sm:space-y-12 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6 border-b border-border/50 pb-6 sm:pb-8">
        <div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="text-[10px] font-black uppercase tracking-widest bg-primary/10 text-primary px-3 py-1 rounded-full border border-primary/20">
              Level {unit.level.number}
            </span>
            <span className="text-[10px] font-bold text-muted-foreground tracking-[0.2em] uppercase">Unit {unit.number}</span>
            <span className="text-[10px] font-bold text-gold bg-gold/10 px-2 py-0.5 rounded-full border border-gold/20">
              {enrichedWords.length} words · A→Z
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-foreground tracking-tighter italic">{unit.title}</h1>
        </div>
        <Link href="/dashboard" className="text-sm font-black text-muted-foreground hover:text-foreground transition-all flex items-center gap-2 group self-start sm:self-auto">
          <svg className="h-4 w-4 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          EXIT
        </Link>
      </div>

      <FlashcardClient
        words={enrichedWords}
        unitId={unitId}
        unitTitle={unit.title}
        levelNumber={unit.level.number}
        unitNumber={unit.number}
        initialWordIndex={currentWordIndex}
        story={unit.story}
      />
    </div>
  );
}
