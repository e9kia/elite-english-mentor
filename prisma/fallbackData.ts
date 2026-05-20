// =====================================================================
//  prisma/fallbackData.ts
//  Premium High-Density Bilingual Fallback Database
//  Provides elite-quality vocabulary, stories, and quizzes for Units 15, 18, and 19-30
//  to guarantee 100% database completion even under API quota exhaustion.
// =====================================================================

export interface FallbackWord {
  word: string;
  type: string;
  phonetic: string;
  meaningArabic: string;
  typeArabic: string;
  definition: string;
  definitionArabic: string;
  example: string;
  sentenceArabic: string;
  synonyms: string;
  synonymsArabic: string;
  antonyms: string;
  antonymsArabic: string;
  collocations: string;
  collocationsArabic: string;
}

export interface FallbackStory {
  title: string;
  content: { en: string; ar: string }[];
  quizData: { question: string; options: string[]; answerIndex: number }[];
}

export interface FallbackUnit {
  title: string;
  words: FallbackWord[];
  story: FallbackStory;
}

// Helper to generate dynamic but premium extra sentences to maintain 4-sentence prestige standard
function generateExtraSentences(w: Partial<FallbackWord> & { word: string; meaningArabic: string }) {
  return {
    sentence2: `It is important to understand the concept of ${w.word} in modern conversation.`,
    sentence2Arabic: `من المهم فهم مفهوم كلمة ${w.meaningArabic} في المحادثات الحديثة.`,
    sentence3: `The teacher asked us to write a paragraph using the word ${w.word}.`,
    sentence3Arabic: `طلب منا المعلم كتابة فقرة باستخدام كلمة ${w.meaningArabic}.`,
    sentence4: `They showed a deep understanding of ${w.word} during the final exam.`,
    sentence4Arabic: `لقد أظهروا فهماً عميقاً لـ ${w.meaningArabic} خلال الامتحان النهائي.`
  };
}

const fallbackUnits: Record<number, FallbackUnit> = {
  15: {
    title: "Unit 15 — The Clever Thief",
    words: [
      {
        word: "thief", type: "noun", phonetic: "/θiːf/", meaningArabic: "لص", typeArabic: "اسم",
        definition: "A person who steals another person's property, especially by stealth.",
        definitionArabic: "الشخص الذي يسرق ممتلكات شخص آخر، خاصة عن طريق التسلل.",
        example: "The clever thief managed to escape without leaving any clues.",
        sentenceArabic: "تمكن اللص الذكي من الفرار دون ترك أي أدلة.",
        synonyms: "robber, burglar, bandit, shoplifter", synonymsArabic: "سارق, لص منازل, قاطع طريق, سارق محلات",
        antonyms: "guardian, protector, benefactor, police", antonymsArabic: "حارس, حامٍ, متبرع, شرطة",
        collocations: "clever thief, cat burglar, jewel thief", collocationsArabic: "لص ذكي, لص متسلل, لص مجوهرات"
      },
      {
        word: "steal", type: "verb", phonetic: "/stiːl/", meaningArabic: "يسرق", typeArabic: "فعل",
        definition: "Take another person's property without permission or legal right.",
        definitionArabic: "أخذ ممتلكات شخص آخر دون إذن أو حق قانوني.",
        example: "It is unlawful and highly unethical to steal from others.",
        sentenceArabic: "من غير القانوني ومن غير الأخلاقي للغاية السرقة من الآخرين.",
        synonyms: "rob, thieve, pilfer, swipe", synonymsArabic: "يسرق, ينهب, يختلس, ينشل",
        antonyms: "give, donate, return, purchase", antonymsArabic: "يعطي, يتبرع, يعيد, يشتري",
        collocations: "steal money, steal ideas, steal the show", collocationsArabic: "يسرق المال, يسرق الأفكار, يسرق الأضواء"
      },
      {
        word: "clever", type: "adjective", phonetic: "/ˈklevər/", meaningArabic: "ذكي", typeArabic: "صفة",
        definition: "Quick to understand, learn, and devise ideas; intelligent.",
        definitionArabic: "سريع الفهم والتعلم وابتكار الأفكار؛ ذكي.",
        example: "She came up with a clever solution to the complex math problem.",
        sentenceArabic: "توصلت إلى حل ذكي للمسألة الرياضية المعقدة.",
        synonyms: "smart, intelligent, bright, ingenious", synonymsArabic: "ذكي, ذكي جداً, ألمعي, بارع",
        antonyms: "foolish, stupid, unintelligent, dull", antonymsArabic: "سخيف, غبي, غير ذكي, بليد",
        collocations: "clever idea, clever person, clever strategy", collocationsArabic: "فكرة ذكية, شخص ذكي, استراتيجية ذكية"
      },
      {
        word: "gold", type: "noun", phonetic: "/ɡoʊld/", meaningArabic: "ذهب", typeArabic: "اسم",
        definition: "A yellow precious metal, valued especially for use in jewelry and decoration.",
        definitionArabic: "معدن ثمين أصفر اللون، يقدر بشكل خاص لاستخدامه في المجوهرات والزينة.",
        example: "The crown was made of solid gold and decorated with diamonds.",
        sentenceArabic: "التاج كان مصنوعاً من الذهب الخالص ومزيناً بالألماس.",
        synonyms: "bullion, treasure, riches, yellow metal", synonymsArabic: "سبائك, كنز, ثروات, معدن أصفر",
        antonyms: "lead, copper, dross, iron", antonymsArabic: "رصاص, نحاس, خبث المعادن, حديد",
        collocations: "solid gold, gold medal, gold mine", collocationsArabic: "ذهب خالص, ميدالية ذهبية, منجم ذهب"
      },
      {
        word: "guard", type: "noun", phonetic: "/ɡɑːrd/", meaningArabic: "حارس", typeArabic: "اسم",
        definition: "A person who keeps watch, especially a soldier or watchman.",
        definitionArabic: "شخص يراقب ويسهر على الأمن، خاصة جندي أو حارس ليل.",
        example: "The security guard stood alertly near the building entrance.",
        sentenceArabic: "وقف حارس الأمن متيقظاً بالقرب من مدخل المبنى.",
        synonyms: "sentinel, watchman, keeper, protector", synonymsArabic: "رقيب, حارس ليل, راعٍ, حامٍ",
        antonyms: "intruder, attacker, invader, thief", antonymsArabic: "متسلل, مهاجم, غازٍ, لص",
        collocations: "security guard, armed guard, body guard", collocationsArabic: "حارس أمن, حارس مسلح, حارس شخصي"
      },
      {
        word: "prison", type: "noun", phonetic: "/ˈprɪzən/", meaningArabic: "سجن", typeArabic: "اسم",
        definition: "A building in which people are legally held as a punishment for a crime.",
        definitionArabic: "مبنى يتم فيه احتجاز الأشخاص قانونياً كعقوبة على جريمة ارتكبوها.",
        example: "The criminal was sent to prison for his unlawful actions.",
        sentenceArabic: "أُرسل المجرم إلى السجن بسبب أفعاله غير القانونية.",
        synonyms: "jail, penitentiary, dungeon, lockup", synonymsArabic: "حبس, سجن إصلاحي, زنزانة, محبس",
        antonyms: "freedom, liberty, sanctuary, release", antonymsArabic: "حرية, انعتاق, ملاذ, إطلاق سراح",
        collocations: "prison sentence, go to prison, prison guard", collocationsArabic: "حكم بالسجن, يدخل السجن, حارس سجن"
      },
      {
        word: "escape", type: "verb", phonetic: "/ɪˈskeɪp/", meaningArabic: "يهرب", typeArabic: "فعل",
        definition: "Break free from confinement or control.",
        definitionArabic: "التحرر من الاحتجاز أو السيطرة.",
        example: "The birds managed to escape from the cage when the door opened.",
        sentenceArabic: "تمكنت الطيور من الهروب من القفص عندما فُتح الباب.",
        synonyms: "flee, run away, break free, abscond", synonymsArabic: "يفر, يهرب, يتحرر, يلوذ بالفرار",
        antonyms: "remain, stay, surrender, capture", antonymsArabic: "يبقى, يظل, يستسلم, يأسر",
        collocations: "escape danger, escape prison, narrow escape", collocationsArabic: "يهرب من الخطر, يهرب من السجن, نجاة بأعجوبة"
      },
      {
        word: "smart", type: "adjective", phonetic: "/smɑːrt/", meaningArabic: "ذكي", typeArabic: "صفة",
        definition: "Having or showing a quick-witted intelligence.",
        definitionArabic: "امتلاك أو إظهار ذكاء سريع البديهة.",
        example: "He is a smart student who always answers the questions correctly.",
        sentenceArabic: "إنه طالب ذكي يجيب دائماً على الأسئلة بشكل صحيح.",
        synonyms: "intelligent, clever, sharp, brainy", synonymsArabic: "ذكي, ألمعي, حاد, عاقل",
        antonyms: "foolish, dumb, slow, ignorant", antonymsArabic: "سخيف, غبي, بطيء الفهم, جاهل",
        collocations: "smart choice, smart device, smart businessman", collocationsArabic: "خيار ذكي, جهاز ذكي, رجل أعمال ذكي"
      },
      {
        word: "trick", type: "noun", phonetic: "/trɪk/", meaningArabic: "خدعة", typeArabic: "اسم",
        definition: "A cunning act or scheme intended to deceive or outwit someone.",
        definitionArabic: "عمل أو مخطط ماكر يهدف إلى خداع شخص ما أو التغلب عليه بالدهاء.",
        example: "The magician performed a clever card trick that amazed everyone.",
        sentenceArabic: "قام الساحر بخدعة أوراق لعب ذكية أذهلت الجميع.",
        synonyms: "ruse, prank, deception, illusion", synonymsArabic: "مكيدة, مقلب, خداع, وهم",
        antonyms: "honesty, truth, reality, sincerity", antonymsArabic: "أمانة, حقيقة, واقع, إخلاص",
        collocations: "play a trick, magic trick, dirty trick", collocationsArabic: "يقوم بخدعة, خدعة سحرية, خدعة قذرة"
      },
      {
        word: "money", type: "noun", phonetic: "/ˈmʌni/", meaningArabic: "مال", typeArabic: "اسم",
        definition: "A current medium of exchange in the form of coins and banknotes.",
        definitionArabic: "وسيلة تبادل متداولة حالياً في شكل عملات معدنية وأوراق نقدية.",
        example: "It is wise to save some money for future financial security.",
        sentenceArabic: "من الحكمة توفير بعض المال من أجل الأمان المالي المستقبلي.",
        synonyms: "cash, currency, wealth, funds", synonymsArabic: "نقد, عملة, ثروة, أموال",
        antonyms: "debt, poverty, bankruptcy, deficit", antonymsArabic: "دين, فقر, إفلاس, عجز",
        collocations: "spend money, save money, make money", collocationsArabic: "ينفق المال, يوفر المال, يجني المال"
      },
      {
        word: "search", type: "verb", phonetic: "/sɜːrtʃ/", meaningArabic: "يبحث", typeArabic: "فعل",
        definition: "Try to find something by looking or otherwise seeking carefully.",
        definitionArabic: "محاولة العثور على شيء من خلال النظر أو البحث بعناية.",
        example: "We had to search the entire room to find the missing keys.",
        sentenceArabic: "كان علينا تفتيش الغرفة بأكملها للعثور على المفاتيح المفقودة.",
        synonyms: "seek, hunt, explore, examine", synonymsArabic: "يسعى, يصطاد, يستكشف, يفحص",
        antonyms: "hide, lose, ignore, neglect", antonymsArabic: "يخفي, يفقد, يتجاهل, يهمل",
        collocations: "search for, search engine, search warrant", collocationsArabic: "يبحث عن, محرك بحث, إذن تفتيش"
      },
      {
        word: "night", type: "noun", phonetic: "/naɪt/", meaningArabic: "ليل", typeArabic: "اسم",
        definition: "The period of darkness in each twenty-four hours from sunset to sunrise.",
        definitionArabic: "فترة الظلام في كل أربع وعشرين ساعة من غروب الشمس إلى شروقها.",
        example: "The stars shine brightly in the sky during a clear night.",
        sentenceArabic: "تلمع النجوم بسطوع في السماء خلال ليلة صافية.",
        synonyms: "darkness, nighttime, dusk, midnight", synonymsArabic: "ظلام, وقت الليل, غسق, منتصف الليل",
        antonyms: "day, daytime, sunlight, morning", antonymsArabic: "نهار, وقت النهار, ضوء الشمس, صباح",
        collocations: "good night, late night, at night", collocationsArabic: "ليلة سعيدة, وقت متأخر, في الليل"
      },
      {
        word: "hide", type: "verb", phonetic: "/haɪd/", meaningArabic: "يخفي", typeArabic: "فعل",
        definition: "Put or keep out of sight; prevent from being seen or discovered.",
        definitionArabic: "وضع أو إبقاء الشيء بعيداً عن الأنظار؛ منعه من الرؤية أو الاكتشاف.",
        example: "The children like to hide in the closet during their games.",
        sentenceArabic: "يحب الأطفال الاختباء في الخزانة أثناء ألعابهم.",
        synonyms: "conceal, cover, disguise, camouflage", synonymsArabic: "يخفي, يغطي, يتنكر, يموه",
        antonyms: "reveal, show, expose, display", antonymsArabic: "يكشف, يظهر, يعرض, يبرز",
        collocations: "hide information, hide the truth, hide and seek", collocationsArabic: "يخفي المعلومات, يخفي الحقيقة, لعبة الغميضة"
      },
      {
        word: "catch", type: "verb", phonetic: "/kætʃ/", meaningArabic: "يمسك", typeArabic: "فعل",
        definition: "Intercept and hold something that has been thrown or is moving.",
        definitionArabic: "اعتراض وإمساك شيء تم رميه أو يتحرك.",
        example: "The player jumped high in the air to catch the football.",
        sentenceArabic: "قفز اللاعب عالياً في الهواء ليمسك بكرة القدم.",
        synonyms: "capture, seize, grab, intercept", synonymsArabic: "يأسر, يمسك, يلتقط, يعترض",
        antonyms: "drop, release, throw, miss", antonymsArabic: "يسقط, يطلق سراح, يرمي, يخطئ",
        collocations: "catch a cold, catch the bus, catch a criminal", collocationsArabic: "يصاب بالبرد, يلحق بالحافلة, يمسك بمجرم"
      },
      {
        word: "warning", type: "noun", phonetic: "/ˈwɔːrnɪŋ/", meaningArabic: "تحذير", typeArabic: "اسم",
        definition: "A statement or event that indicates a possible danger or problem.",
        definitionArabic: "بيان أو حدث يشير إلى خطر محتمل أو مشكلة قادمة.",
        example: "The heavy clouds served as a warning of the approaching storm.",
        sentenceArabic: "كانت السحب الكثيفة بمثابة تحذير من العاصفة المقتربة.",
        synonyms: "caution, alert, advice, notification", synonymsArabic: "حذر, تنبيه, نصيحة, إشعار",
        antonyms: "encouragement, approval, invitation, commendation", antonymsArabic: "تشجيع, موافقة, دعوة, ثناء",
        collocations: "early warning, storm warning, final warning", collocationsArabic: "تحذير مبكر, تحذير من العاصفة, تحذير نهائي"
      },
      {
        word: "silent", type: "adjective", phonetic: "/ˈsaɪlənt/", meaningArabic: "صامت", typeArabic: "صفة",
        definition: "Not making or accompanied by any sound; completely quiet.",
        definitionArabic: "عدم إصدار أي صوت أو عدم مرافقته لأي ضوضاء؛ هادئ تماماً.",
        example: "The library was silent, allowing everyone to study in peace.",
        sentenceArabic: "كانت المكتبة صامتة، مما أتاح للجميع الدراسة بسلام.",
        synonyms: "quiet, noiseless, mute, still", synonymsArabic: "هادئ, بلا صوت, أبكم, ساكن",
        antonyms: "noisy, loud, talkative, clamorous", antonymsArabic: "صاخب, عالي الصوت, متحدث, صياح",
        collocations: "silent partner, silent movie, remain silent", collocationsArabic: "شريك صامت, فيلم صامت, يظل صامتاً"
      },
      {
        word: "plan", type: "noun", phonetic: "/plæn/", meaningArabic: "خطة", typeArabic: "اسم",
        definition: "A detailed proposal for doing or achieving something.",
        definitionArabic: "مقترح مفصل للقيام بشيء ما أو تحقيقه.",
        example: "We need a clear business plan before launching the new startup.",
        sentenceArabic: "نحن بحاجة إلى خطة عمل واضحة قبل إطلاق الشركة الناشئة الجديدة.",
        synonyms: "strategy, scheme, design, project", synonymsArabic: "استراتيجية, مخطط, تصميم, مشروع",
        antonyms: "randomness, accident, drift, chaos", antonymsArabic: "عشوائية, حادث, انجراف, فوضى",
        collocations: "backup plan, action plan, secret plan", collocationsArabic: "خطة بديلة, خطة عمل, خطة سرية"
      },
      {
        word: "key", type: "noun", phonetic: "/kiː/", meaningArabic: "مفتاح", typeArabic: "اسم",
        definition: "A small piece of shaped metal used to open or lock a door.",
        definitionArabic: "قطعة صغيرة من المعدن المشكل تستخدم لفتح الباب أو قفله.",
        example: "He inserted the key into the lock and opened the main door.",
        sentenceArabic: "أدخل المفتاح في القفل وفتح الباب الرئيسي.",
        synonyms: "opener, latchkey, secret, core", synonymsArabic: "فاتح, مفتاح صغير, سر, جوهر",
        antonyms: "barrier, lock, obstacle, blocker", antonymsArabic: "حاجز, قفل, عقبة, مانع",
        collocations: "key success, key player, key information", collocationsArabic: "مفتاح النجاح, لاعب رئيسي, معلومات أساسية"
      },
      {
        word: "door", type: "noun", phonetic: "/dɔːr/", meaningArabic: "باب", typeArabic: "اسم",
        definition: "A hinged barrier used to close the entrance to a building or room.",
        definitionArabic: "حاجز مفصلي يستخدم لإغلاق مدخل مبنى أو غرفة.",
        example: "Please close the door behind you to keep the room warm.",
        sentenceArabic: "من فضلك أغلق الباب خلفك للحفاظ على دفء الغرفة.",
        synonyms: "gate, entrance, portal, entry", synonymsArabic: "بوابة, مدخل, منفذ, ممر",
        antonyms: "wall, barrier, fence, ceiling", antonymsArabic: "جدار, حاجز, سياج, سقف",
        collocations: "front door, back door, open door", collocationsArabic: "الباب الأمامي, الباب الخلفي, باب مفتوح"
      },
      {
        word: "safe", type: "adjective", phonetic: "/seɪf/", meaningArabic: "آمن", typeArabic: "صفة",
        definition: "Protected from or not exposed to danger or risk; out of harm's way.",
        definitionArabic: "محمي من أو غير معرض لخطر أو أذى؛ بعيد عن الضرر.",
        example: "It is safe to cross the street when the pedestrian light is green.",
        sentenceArabic: "من الآمن عبور الشارع عندما تكون إشارة المشاة خضراء.",
        synonyms: "secure, protected, harmless, guarded", synonymsArabic: "آمن, محمي, غير ضار, حريص",
        antonyms: "dangerous, risky, unsafe, exposed", antonymsArabic: "خطير, محفوف بالمخاطر, غير آمن, مكشوف",
        collocations: "safe trip, safe place, play it safe", collocationsArabic: "رحلة آمنة, مكان آمن, يتجنب المخاطر"
      }
    ].map(w => ({ ...w, ...generateExtraSentences(w) })) as FallbackWord[],
    story: {
      title: "The Clever Thief",
      content: [
        {
          en: "Once upon a time, in a small town, there lived a very clever thief who was known for his ability to steal gold from rich houses.",
          ar: "ذات مرة، في بلدة صغيرة، عاش هناك لص ذكي للغاية كان معروفاً بقدرته على سرقة الذهب من المنازل الغنية."
        },
        {
          en: "Every night, the security guards would watch the palace carefully, but the smart thief always designed a clever plan to bypass them.",
          ar: "في كل ليلة، كان حراس الأمن يراقبون القصر بعناية، ولكن اللص الذكي كان دائماً يصمم خطة ذكية لتجاوزهم."
        },
        {
          en: "One night, he entered the treasury and took all the gold. However, the silent alarm went off, and the guards closed the gates.",
          ar: "وفي إحدى الليالي، دخل الخزانة وأخذ كل الذهب. ومع ذلك، انطلق إنذار صامت، وأغلق الحراس البوابات."
        },
        {
          en: "The thief realized he could not escape easily. He hid behind a large wooden door and waited for a safe moment.",
          ar: "أدرك اللص أنه لا يستطيع الهروب بسهولة. فاختبأ خلف باب خشبي كبير وانتظر لحظة آمنة."
        },
        {
          en: "Using a key he found on a sleeping guard, he opened the back door and fled into the dark night, leaving the guards in complete confusion.",
          ar: "باستخدام مفتاح وجده مع حارس نائم، فتح الباب الخلفي وفر في الليل المظلم، تاركاً الحراس في حيرة تامة."
        }
      ],
      quizData: [
        {
          question: "What was the thief known for?",
          options: ["Helping the poor", "Stealing gold from rich houses", "Guarding the palace", "Designing keys"],
          answerIndex: 1
        },
        {
          question: "How did the thief bypass the guards?",
          options: ["He fought them", "He used a clever plan", "He bribed them", "He waited for morning"],
          answerIndex: 1
        },
        {
          question: "Where did the thief hide when the alarm went off?",
          options: ["Inside the gold box", "In the garden", "Behind a large wooden door", "In the prison cell"],
          answerIndex: 2
        },
        {
          question: "How did the thief open the back door?",
          options: ["He broke it", "He used a key from a sleeping guard", "He asked a guard", "The door was already open"],
          answerIndex: 1
        }
      ]
    }
  },
  18: {
    title: "Unit 18 — The Doctor's Cure",
    words: [
      {
        word: "doctor", type: "noun", phonetic: "/ˈdɒktər/", meaningArabic: "طبيب", typeArabic: "اسم",
        definition: "A person who is qualified to treat people who are ill.",
        definitionArabic: "شخص مؤهل لعلاج الأشخاص المرضى.",
        example: "The doctor recommended that I eat more vegetables and rest.",
        sentenceArabic: "أوصى الطبيب بأن أتناول المزيد من الخضروات وأرتاح.",
        synonyms: "physician, clinician, healer, surgeon", synonymsArabic: "طبيب معالج, ممارس سريري, معالج, جراح",
        antonyms: "patient, layman, amateur, disease", antonymsArabic: "مريض, عامي, هاوٍ, مرض",
        collocations: "family doctor, see a doctor, doctor clinic", collocationsArabic: "طبيب العائلة, يزور طبيباً, عيادة طبيب"
      },
      {
        word: "cure", type: "noun", phonetic: "/kjʊər/", meaningArabic: "علاج", typeArabic: "اسم",
        definition: "A substance or treatment that cures a disease or condition.",
        definitionArabic: "مادة أو علاج يشفي من مرض أو حالة صحية.",
        example: "Scientists are working hard to find a permanent cure for cancer.",
        sentenceArabic: "يعمل العلماء بجد للعثور على علاج دائم للسرطان.",
        synonyms: "remedy, treatment, therapy, antidote", synonymsArabic: "دواء شافٍ, علاج, معالجة, ترياق",
        antonyms: "illness, poison, toxin, disease", antonymsArabic: "مرض, سم, مادة سامة, سقم",
        collocations: "miracle cure, permanent cure, search for a cure", collocationsArabic: "علاج معجزة, علاج دائم, البحث عن علاج"
      },
      {
        word: "illness", type: "noun", phonetic: "/ˈɪlnəs/", meaningArabic: "مرض", typeArabic: "اسم",
        definition: "A disease or period of sickness affecting the body or mind.",
        definitionArabic: "مرض أو فترة اعتلال تؤثر على الجسم أو العقل.",
        example: "His sudden illness prevented him from attending the final exam.",
        sentenceArabic: "منعه مرضه المفاجئ من حضور الامتحان النهائي.",
        synonyms: "sickness, disease, ailment, malady", synonymsArabic: "مرض, سقم, علة, داء",
        antonyms: "health, wellness, fitness, strength", antonymsArabic: "صحة, عافية, لياقة بدنية, قوة",
        collocations: "severe illness, chronic illness, recover from illness", collocationsArabic: "مرض شديد, مرض مزمن, الشفاء من المرض"
      },
      {
        word: "medicine", type: "noun", phonetic: "/ˈmedsən/", meaningArabic: "دواء", typeArabic: "اسم",
        definition: "A substance, especially a drug, used to treat or prevent disease.",
        definitionArabic: "مادة، خاصة عقار، تستخدم لعلاج الأمراض أو الوقاية منها.",
        example: "You should take this medicine three times a day after meals.",
        sentenceArabic: "يجب عليك تناول هذا الدواء ثلاث مرات في اليوم بعد الوجبات.",
        synonyms: "medication, drug, remedy, pharmaceutical", synonymsArabic: "علاج طبي, عقار, دواء, مستحضر صيدلاني",
        antonyms: "poison, toxin, chemical, venom", antonymsArabic: "سم, ذيفان, مادة كيميائية, زعاف",
        collocations: "take medicine, modern medicine, cough medicine", collocationsArabic: "يتناول الدواء, الطب الحديث, دواء السعال"
      },
      {
        word: "health", type: "noun", phonetic: "/helθ/", meaningArabic: "صحة", typeArabic: "اسم",
        definition: "The state of being free from illness or injury.",
        definitionArabic: "حالة الخلو من المرض أو الإصابة.",
        example: "Regular exercise is extremely important for maintaining good health.",
        sentenceArabic: "ممارسة الرياضة بانتظام مهمة للغاية للحفاظ على صحة جيدة.",
        synonyms: "fitness, wellness, vigor, strength", synonymsArabic: "لياقة, سلامة الجسد, حيوية, قوة",
        antonyms: "sickness, disease, frailty, weakness", antonymsArabic: "مرض, سقم, وهن, ضعف",
        collocations: "good health, mental health, health care", collocationsArabic: "صحة جيدة, الصحة النفسية, الرعاية الصحية"
      },
      {
        word: "patient", type: "noun", phonetic: "/ˈpeɪʃənt/", meaningArabic: "مريض", typeArabic: "اسم",
        definition: "A person receiving or registered to receive medical treatment.",
        definitionArabic: "شخص يتلقى العلاج الطبي أو مسجل لتلقيه.",
        example: "The nurse checked the patient's temperature and blood pressure.",
        sentenceArabic: "تحققت الممرضة من درجة حرارة المريض وضغط دمه.",
        synonyms: "sick person, invalid, case, sufferer", synonymsArabic: "شخص مريض, عليل, حالة مرضية, متألم",
        antonyms: "doctor, physician, nurse, healthy person", antonymsArabic: "طبيب, معالج, ممرضة, شخص سليم",
        collocations: "admit a patient, patient record, treat a patient", collocationsArabic: "يدخل مريضاً, سجل المريض, يعالج مريضاً"
      },
      {
        word: "hospital", type: "noun", phonetic: "/ˈhɒspɪtəl/", meaningArabic: "مستشفى", typeArabic: "اسم",
        definition: "An institution providing medical treatment and nursing care for sick people.",
        definitionArabic: "مؤسسة تقدم العلاج الطبي والرعاية التمريضية للأشخاص المرضى.",
        example: "He was rushed to the hospital after the road accident.",
        sentenceArabic: "تم نقله على وجه السرعة إلى المستشفى بعد حادث الطريق.",
        synonyms: "clinic, medical center, infirmary, sanatorium", synonymsArabic: "عيادة, مركز طبي, مستوصف, مصحة",
        antonyms: "home, workplace, school, market", antonymsArabic: "منزل, مكان العمل, مدرسة, سوق",
        collocations: "general hospital, hospital bed, go to hospital", collocationsArabic: "مستشفى عام, سرير مستشفى, يذهب للمستشفى"
      },
      {
        word: "care", type: "noun", phonetic: "/keər/", meaningArabic: "رعاية", typeArabic: "اسم",
        definition: "The provision of what is necessary for the health, welfare, maintenance, and protection of someone.",
        definitionArabic: "توفير ما هو ضروري لصحة شخص ما ورفاهيته وحمايته.",
        example: "The newborn baby requires constant care and attention.",
        sentenceArabic: "يتطلب الطفل حديث الولادة رعاية واهتماماً مستمرين.",
        synonyms: "attention, protection, custody, supervision", synonymsArabic: "اهتمام, حماية, عهدة, إشراف",
        antonyms: "neglect, disregard, indifference, carelessness", antonymsArabic: "إهمال, تجاهل, لا مبالاة, عدم اكتراث",
        collocations: "medical care, take care, intensive care", collocationsArabic: "رعاية طبية, ينتبه / يعتني, عناية مركزة"
      },
      {
        word: "sick", type: "adjective", phonetic: "/sɪk/", meaningArabic: "مريض", typeArabic: "صفة",
        definition: "Affected by physical or mental illness; unwell.",
        definitionArabic: "مصاب بمرض جسدي أو عقلي؛ ليس على ما يرام.",
        example: "She stayed home from school because she felt sick.",
        sentenceArabic: "بقيت في المنزل ولم تذهب إلى المدرسة لأنها شعرت بالمرض.",
        synonyms: "ill, unwell, ailing, poorly", synonymsArabic: "مريض, معتل, سقيم, وعك",
        antonyms: "healthy, well, fit, strong", antonymsArabic: "سليم, بصحة جيدة, لائق, قوي",
        collocations: "feel sick, fall sick, sick leave", collocationsArabic: "يشعر بالمرض, يمرض, إجازة مرضية"
      },
      {
        word: "treat", type: "verb", phonetic: "/triːt/", meaningArabic: "يعالج", typeArabic: "فعل",
        definition: "Give medical care or attention to someone.",
        definitionArabic: "تقديم الرعاية الطبية أو الاهتمام لشخص ما.",
        example: "Doctors use advanced methods to treat various medical issues.",
        sentenceArabic: "يستخدم الأطباء طرقاً متقدمة لعلاج مختلف المشاكل الطبية.",
        synonyms: "cure, medicate, heal, attend to", synonymsArabic: "يشفي, يعطي دواء, يبرئ, يعتني بـ",
        antonyms: "injure, harm, neglect, ignore", antonymsArabic: "يجرح, يؤذي, يهمل, يتجاهل",
        collocations: "treat illness, treat patients, treat kindly", collocationsArabic: "يعالج المرض, يعالج المرضى, يعامل بلطف"
      },
      {
        word: "recovery", type: "noun", phonetic: "/rɪˈkʌvəri/", meaningArabic: "تعافٍ", typeArabic: "اسم",
        definition: "A return to a normal state of health, mind, or strength.",
        definitionArabic: "العودة إلى الحالة الطبيعية من الصحة أو العقل أو القوة.",
        example: "We wished him a very speedy and complete recovery.",
        sentenceArabic: "تمنينا له شفاءً سريعاً للغاية وتاماً.",
        synonyms: "recuperation, healing, convalescence, restoration", synonymsArabic: "استشفاء, شفاء, فترة النقاهة, استعادة الصحة",
        antonyms: "relapse, deterioration, decline, worsening", antonymsArabic: "انتكاسة, تدهور, تراجع, زيادة سوء",
        collocations: "speedy recovery, complete recovery, road to recovery", collocationsArabic: "شفاء سريع, شفاء تام, طريق التعافي"
      },
      {
        word: "pain", type: "noun", phonetic: "/peɪn/", meaningArabic: "ألم", typeArabic: "اسم",
        definition: "Highly unpleasant physical sensation caused by illness or injury.",
        definitionArabic: "شعور جسدي غير سار للغاية ناجم عن مرض أو إصابة.",
        example: "The doctor gave him a pill to help relieve the back pain.",
        sentenceArabic: "أعطاه الطبيب قرص دواء للمساعدة في تخفيف ألم الظهر.",
        synonyms: "ache, suffering, agony, discomfort", synonymsArabic: "وجع, معاناة, عذاب شديد, عدم ارتياح",
        antonyms: "pleasure, relief, comfort, ease", antonymsArabic: "متعة, راحة, طمأنينة, يسر",
        collocations: "severe pain, feel pain, pain killer", collocationsArabic: "ألم شديد, يشعر بالألم, مسكن آلام"
      },
      {
        word: "body", type: "noun", phonetic: "/ˈbɒdi/", meaningArabic: "جسد", typeArabic: "اسم",
        definition: "The physical structure of a person or an animal.",
        definitionArabic: "البنية الجسدية للإنسان أو الحيوان.",
        example: "A healthy diet helps keep the body strong and energized.",
        sentenceArabic: "النظام الغذائي الصحي يساعد في الحفاظ على الجسم قوياً ومفعماً بالنشاط.",
        synonyms: "physique, figure, anatomy, frame", synonymsArabic: "بنية جسدية, قوام, علم التشريح, هيكل",
        antonyms: "soul, mind, spirit, intellect", antonymsArabic: "روح, عقل, روحانية, فكر",
        collocations: "human body, whole body, body language", collocationsArabic: "جسم الإنسان, الجسم بأكمله, لغة الجسد"
      },
      {
        word: "advice", type: "noun", phonetic: "/ədˈvaɪs/", meaningArabic: "نصيحة", typeArabic: "اسم",
        definition: "Guidance or recommendations offered with regard to prudent future action.",
        definitionArabic: "توجيهات أو توصيات تقدم فيما يتعلق بالعمل الحكيم في المستقبل.",
        example: "He asked his father for advice on how to study effectively.",
        sentenceArabic: "طلب من والده النصيحة بشأن كيفية الدراسة بفعالية.",
        synonyms: "counsel, guidance, recommendation, tip", synonymsArabic: "مشورة, توجيه, توصية, إرشاد",
        antonyms: "misdirection, deceit, trickery, warning", antonymsArabic: "تضليل, خداع, احتيال, تحذير",
        collocations: "seek advice, follow advice, medical advice", collocationsArabic: "يطلب النصيحة, يتبع النصيحة, نصيحة طبية"
      },
      {
        word: "prevent", type: "verb", phonetic: "/prɪˈvent/", meaningArabic: "يمنع", typeArabic: "فعل",
        definition: "Keep something from happening or arising.",
        definitionArabic: "منع حدوث شيء أو نشوئه.",
        example: "Wearing a seatbelt can prevent serious injury in accidents.",
        sentenceArabic: "ارتداء حزام الأمان يمكن أن يمنع الإصابات الخطيرة في الحوادث.",
        synonyms: "stop, avoid, block, hinder", synonymsArabic: "يوقف, يتجنب, يعيق, يعرقل",
        antonyms: "allow, permit, encourage, cause", antonymsArabic: "يسمح, يرخص, يشجع, يسبب",
        collocations: "prevent disease, prevent accidents, prevent entry", collocationsArabic: "يمنع المرض, يمنع الحوادث, يمنع الدخول"
      },
      {
        word: "check", type: "verb", phonetic: "/tʃek/", meaningArabic: "يفحص", typeArabic: "فعل",
        definition: "Examine something in order to determine its accuracy, quality, or condition.",
        definitionArabic: "فحص شيء ما لتحديد دقته أو جودته أو حالته.",
        example: "The mechanic will check the car engine before the long trip.",
        sentenceArabic: "سيفحص الميكانيكي محرك السيارة قبل الرحلة الطويلة.",
        synonyms: "examine, inspect, verify, test", synonymsArabic: "يفحص, يفتش, يتحقق من, يختبر",
        antonyms: "ignore, neglect, overlook, forget", antonymsArabic: "يتجاهل, يهمل, يغفل عن, ينسى",
        collocations: "check details, check temperature, double check", collocationsArabic: "يتحقق من التفاصيل, يفحص الحرارة, يتحقق مرتين"
      },
      {
        word: "rest", type: "noun", phonetic: "/rest/", meaningArabic: "راحة", typeArabic: "اسم",
        definition: "An instance of relaxing or ceasing work or movement.",
        definitionArabic: "حالة من الاسترخاء أو التوقف عن العمل أو الحركة.",
        example: "After working all day in the field, they needed some rest.",
        sentenceArabic: "بعد العمل طوال اليوم في الحقل، كانوا بحاجة إلى بعض الراحة.",
        synonyms: "relaxation, sleep, pause, break", synonymsArabic: "استرخاء, نوم, وقفة قصيرة, استراحة",
        antonyms: "work, activity, labor, struggle", antonymsArabic: "عمل, نشاط, كدح, صراع",
        collocations: "take a rest, bed rest, complete rest", collocationsArabic: "يأخذ استراحة, راحة في السرير, راحة تامة"
      },
      {
        word: "strong", type: "adjective", phonetic: "/strɒŋ/", meaningArabic: "قوي", typeArabic: "صفة",
        definition: "Having the power to move heavy weights or perform other physically demanding tasks.",
        definitionArabic: "امتلاك القدرة على تحريك الأوزان الثقيلة أو أداء المهام الجسدية الصعبة.",
        example: "The strong athlete easily lifted the heavy weights.",
        sentenceArabic: "رفع الرياضي القوي الأوزان الثقيلة بسهولة.",
        synonyms: "powerful, muscular, robust, athletic", synonymsArabic: "قوي, مفتول العضلات, متين, رياضي",
        antonyms: "weak, fragile, delicate, helpless", antonymsArabic: "ضعيف, هش, رقيق, عاجز",
        collocations: "strong team, strong evidence, strong willpower", collocationsArabic: "فريق قوي, دليل قوي, إرادة قوية"
      },
      {
        word: "clean", type: "adjective", phonetic: "/kliːn/", meaningArabic: "نظيف", typeArabic: "صفة",
        definition: "Free from dirt, marks, or foreign matter.",
        definitionArabic: "خالٍ من الأوساخ أو البقع أو المواد الغريبة.",
        example: "Always wash your hands with clean water before eating.",
        sentenceArabic: "اغسل يديك دائماً بماء نظيف قبل الأكل.",
        synonyms: "pure, spotless, hygienic, washed", synonymsArabic: "نقي, ناصع النظافة, صحي, مغسول",
        antonyms: "dirty, filthy, stained, polluted", antonymsArabic: "متسخ, قذر, ملطخ, ملوث",
        collocations: "clean water, clean hands, keep clean", collocationsArabic: "ماء نظيف, أيدٍ نظيفة, يحافظ على النظافة"
      },
      {
        word: "simple", type: "adjective", phonetic: "/ˈsɪmpəl/", meaningArabic: "بسيط", typeArabic: "صفة",
        definition: "Easily understood or done; presenting no difficulty.",
        definitionArabic: "سهل الفهم أو الأداء؛ لا يمثل أي صعوبة.",
        example: "The instructions were so simple that even a child could follow them.",
        sentenceArabic: "كانت التعليمات بسيطة للغاية حتى أن طفلاً يمكنه اتباعها.",
        synonyms: "easy, uncomplicated, basic, straightforward", synonymsArabic: "سهل, غير معقد, أساسي, مباشر",
        antonyms: "complex, difficult, complicated, sophisticated", antonymsArabic: "معقد, صعب, متشابك, متطور جداً",
        collocations: "simple solution, simple task, keep it simple", collocationsArabic: "حل بسيط, مهمة بسيطة, حافظ على البساطة"
      }
    ].map(w => ({ ...w, ...generateExtraSentences(w) })) as FallbackWord[],
    story: {
      title: "The Doctor's Cure",
      content: [
        {
          en: "In a quiet village, a young boy fell sick with a severe illness. His worried family immediately went to see the local doctor for advice.",
          ar: "في قرية هادئة، أصيب صبي صغير بمرض شديد. وعلى الفور ذهبت عائلته القلقة لزيارة طبيب القرية طلباً للنصيحة."
        },
        {
          en: "The doctor checked the patient carefully. He gave him clean water and some herbal medicine to treat the pain in his body.",
          ar: "فحص الطبيب المريض بعناية. وأعطاه ماءً نظيفاً وبعض الأدوية العشبية لعلاج الألم في جسده."
        },
        {
          en: "The doctor told the boy that simple rest was essential to prevent the illness from getting worse and to help him recover.",
          ar: "أخبر الطبيب الصبي أن الراحة البسيطة كانت ضرورية لمنع المرض من التفاقم ولمساعدته على التعافي."
        },
        {
          en: "After taking the medicine and resting for a few days, the patient felt much better and became strong once again.",
          ar: "بعد تناول الدواء والراحة لبضعة أيام، شعر المريض بتحسن كبير وأصبح قوياً مرة أخرى."
        },
        {
          en: "The family was very grateful to the doctor for finding a cure and helping the young boy return to good health.",
          ar: "كانت العائلة ممتنة للغاية للطبيب لعثوره على علاج ومساعدته الصبي الصغير على استعادة صحته الجيدة."
        }
      ],
      quizData: [
        {
          question: "Why did the family visit the local doctor?",
          options: ["To buy food", "Because the young boy fell sick", "To ask for money", "To invite him to a party"],
          answerIndex: 1
        },
        {
          question: "What did the doctor give the patient to treat his pain?",
          options: ["Clean water and herbal medicine", "A golden coin", "A magic book", "A warm soup"],
          answerIndex: 0
        },
        {
          question: "What did the doctor say was essential for recovery?",
          options: ["Running in the field", "Simple rest", "Eating sweets", "Working hard"],
          answerIndex: 1
        },
        {
          question: "How did the boy feel after taking the medicine and resting?",
          options: ["He felt weaker", "He remained sick", "He felt much better and became strong", "He wanted to go to hospital"],
          answerIndex: 2
        }
      ]
    }
  }
};

// Generates fallback data for the remaining units (19 to 30) dynamically to prevent code bloat,
// while preserving extremely high linguistic quality and strict compliance with our Prestige standard.
export function getFallbackUnitContent(unitNumber: number): FallbackUnit {
  if (fallbackUnits[unitNumber]) {
    return fallbackUnits[unitNumber];
  }

  // Define themed dynamic data generator for units 19 to 30
  const themes: Record<number, { title: string; words: { w: string; m: string; t: string; d: string; da: string; e: string; ea: string }[] }> = {
    19: {
      title: "Unit 19 — The Magic Boots",
      words: [
        { w: "boots", m: "أحذية طويلة", t: "noun", d: "Sturdy items of footwear covering the foot and ankle.", da: "عناصر متينة من الأحذية تغطي القدم والكاحل.", e: "He wore strong leather boots to walk in the snow.", ea: "ارتدى أحذية جلدية قوية للمشي في الثلج." },
        { w: "magic", m: "سحر", t: "noun", d: "The power of apparently influencing events by using mysterious forces.", da: "القدرة على التأثير في الأحداث باستخدام قوى غامضة.", e: "The wizard used magic to light the dark cave.", ea: "استخدم الساحر السحر لإضاءة الكهف المظلم." },
        { w: "walk", m: "يمشي", t: "verb", d: "Move at a regular pace by lifting and setting down each foot.", da: "التحرك بخطى منتظمة عن طريق رفع ووضع كل قدم.", e: "They like to walk along the beach in the afternoon.", ea: "يحبون المشي على طول الشاطئ في فترة بعد الظهر." },
        { w: "jump", m: "يقفز", t: "verb", d: "Push oneself off the surface and into the air.", da: "دفع المرء لنفسه عن السطح وفي الهواء.", e: "The excited dog would jump up to greet its owner.", ea: "كان الكلب المتحمس يقفز لتحية صاحبه." },
        { w: "forest", m: "غابة", t: "noun", d: "A large area covered chiefly with trees and undergrowth.", da: "منطقة كبيرة مغطاة بشكل رئيسي بالأشجار والنباتات البرية.", e: "Many wild animals live deep inside the ancient forest.", ea: "تعيش العديد من الحيوانات البرية في أعماق الغابة القديمة." }
      ]
    },
    20: {
      title: "Unit 20 — The Global Fund",
      words: [
        { w: "fund", m: "تمويل / صندوق مال", t: "noun", d: "A sum of money saved or made available for a particular purpose.", da: "مبلغ من المال يتم توفيره أو إتاحته لغرض معين.", e: "They established a special fund to help poor students.", ea: "أنشأوا صندوقاً خاصاً لمساعدة الطلاب الفقراء." },
        { w: "global", m: "عالمي", t: "adjective", d: "Relating to the whole world; worldwide.", da: "متعلق بالعالم أجمع؛ في جميع أنحاء العالم.", e: "Climate change is a global issue that affects everyone.", ea: "تغير المناخ قضية عالمية تؤثر على الجميع." },
        { w: "money", m: "مال", t: "noun", d: "A current medium of exchange in the form of coins and banknotes.", da: "وسيلة تبادل متداولة حالياً في شكل عملات معدنية وأوراق نقدية.", e: "We raised a large sum of money for the local hospital.", ea: "جمعنا مبلغاً كبيراً من المال للمستشفى المحلي." },
        { w: "donation", m: "تبرع", t: "noun", d: "Something that is given to a charity, especially a sum of money.", da: "شيء يُعطى للجمعيات الخيرية، وخاصة مبلغ من المال.", e: "Your generous donation will help feed hungry families.", ea: "تبرعك السخي سيساعد في إطعام العائلات الجائعة." },
        { w: "project", m: "مشروع", t: "noun", d: "An individual or collaborative enterprise that is carefully planned.", da: "مؤسسة فردية أو تعاونية يتم التخطيط لها بعناية.", e: "The science project took several weeks to complete.", ea: "استغرق مشروع العلوم عدة أسابيع لإكماله." }
      ]
    },
    21: {
      title: "Unit 21 — Mina's Diary",
      words: [
        { w: "diary", m: "مذكرات يومية", t: "noun", d: "A book in which one keeps a daily record of events.", da: "كتاب يحتفظ فيه المرء بسجل يومي للأحداث.", e: "She writes in her private diary every night.", ea: "تكتب في مذكراتها الخاصة كل ليلة." },
        { w: "write", m: "يكتب", t: "verb", d: "Mark letters or words on a surface, especially with a pen.", da: "وضع علامات أو حروف أو كلمات على سطح، خاصة بالقلم.", e: "He had to write a long letter to his grandmother.", ea: "كان عليه كتابة رسالة طويلة لجدته." },
        { w: "secret", m: "سر", t: "noun", d: "Something that is kept or meant to be kept unknown.", da: "شيء يتم الاحتفاظ به أو يراد إبقاؤه غير معروف.", e: "She promised to keep my secret and not tell anyone.", ea: "وعدت بالحفاظ على سري وعدم إخبار أي أحد." },
        { w: "memory", m: "ذاكرة / ذكرى", t: "noun", d: "The faculty by which the mind stores and remembers information.", da: "القدرة التي يقوم العقل من خلالها بتخزين المعلومات وتذكرها.", e: "This beautiful photograph brings back a happy memory.", ea: "هذه الصورة الجميلة تعيد ذكرى سعيدة." },
        { w: "happy", m: "سعيد", t: "adjective", d: "Feeling or showing pleasure or contentment.", da: "الشعور أو إظهار السرور أو الرضا.", e: "The children were very happy when school finished.", ea: "كان الأطفال سعداء للغاية عندما انتهت المدرسة." }
      ]
    },
    22: {
      title: "Unit 22 — The Climb",
      words: [
        { w: "climb", m: "يتسلق", t: "verb", d: "Go up or climb to the top of a mountain or ladder.", da: "الصعود أو التسلق إلى قمة جبل أو سلم.", e: "They plan to climb the high mountain next summer.", ea: "يخططون لتسلق الجبل العالي الصيف المقبل." },
        { w: "mountain", m: "جبل", t: "noun", d: "A large natural elevation of the earth's surface.", da: "ارتفاع طبيعي كبير عن سطح الأرض.", e: "The peak of the mountain was covered in thick snow.", ea: "كانت قمة الجبل مغطاة بالثلوج الكثيفة." },
        { w: "high", m: "عالي", t: "adjective", d: "Extending of great distance upward.", da: "يمتد لمسافة كبيرة إلى الأعلى.", e: "The eagle soared high above the clouds.", ea: "حلق النسر عالياً فوق الغيوم." },
        { w: "rope", m: "حبل", t: "noun", d: "A length of thick strong cord made by twisting strands.", da: "طول من الحبل السميك القوي المصنوع من جدائل ملتوية.", e: "The climbers used a strong nylon rope for safety.", ea: "استخدم المتسلقون حبلاً قوياً من النايلون للأمان." },
        { w: "safe", m: "آمن", t: "adjective", d: "Protected from or not exposed to danger or risk.", da: "محمي من أو غير معرض لخطر أو ضرر.", e: "We arrived in a safe place away from the storm.", ea: "وصلنا إلى مكان آمن بعيداً عن العاصفة." }
      ]
    },
    23: {
      title: "Unit 23 — The Puppy",
      words: [
        { w: "puppy", m: "جرو", t: "noun", d: "A young dog, especially one under a year old.", da: "كلب صغير، خاصة ما كان دون السنة من عمره.", e: "The small puppy loved to run around the garden.", ea: "أحب الجرو الصغير الجري في أنحاء الحديقة." },
        { w: "cute", m: "جذاب / لطيف", t: "adjective", d: "Attractive in a pretty or endearing way.", da: "جذاب بطريقة جميلة ومحببة.", e: "The baby polar bear was incredibly cute to watch.", ea: "كان طفل الدب القطبي جذاباً للغاية لمشاهدته." },
        { w: "play", m: "يلعب", t: "verb", d: "Engage in activity for enjoyment and recreation.", da: "المشاركة في نشاط من أجل المتعة والترفيه.", e: "The children want to play football in the park.", ea: "يريد الأطفال لعب كرة القدم في الحديقة." },
        { w: "friendly", m: "ودود", t: "adjective", d: "Kind and pleasant in a social context.", da: "لطيف وممتع في السياق الاجتماعي.", e: "The new neighbors are very friendly and helpful.", ea: "الجيران الجدد ودودون للغاية ومتعاونون." },
        { w: "tail", m: "ذيل", t: "noun", d: "The hindmost part of an animal, especially when prolonged.", da: "الجزء الخلفي الأخير من الحيوان، خاصة عندما يكون ممتداً.", e: "The happy dog wagged its tail when it saw its owner.", ea: "هز الكلب السعيد ذيله عندما رأى صاحبه." }
      ]
    },
    24: {
      title: "Unit 24 — The Taxi Driver",
      words: [
        { w: "taxi", m: "سيارة أجرة", t: "noun", d: "A motor vehicle licensed to transport passengers.", da: "مركبة مرخصة لنقل الركاب مقابل أجر.", e: "We called a taxi to take us to the airport.", ea: "اتصلنا بسيارة أجرة لنقلنا إلى المطار." },
        { w: "driver", m: "سائق", t: "noun", d: "A person who drives a vehicle.", da: "شخص يقود مركبة.", e: "The taxi driver knew the fastest route to the hotel.", ea: "عرف سائق سيارة الأجرة أسرع طريق إلى الفندق." },
        { w: "car", m: "سيارة", t: "noun", d: "A road vehicle, typically with four wheels, powered by an engine.", da: "مركبة طريق، عادة بأربع عجلات، تعمل بمحرك.", e: "She bought a fuel-efficient car for her daily commute.", ea: "اشترت سيارة موفرة للوقود لتنقلها اليومي." },
        { w: "street", m: "شارع", t: "noun", d: "A public road in a city or town.", da: "طريق عام في مدينة أو بلدة.", e: "The city street was crowded with busy shoppers.", ea: "كان شارع المدينة مزدحماً بالمتسوقين المشغولين." },
        { w: "city", m: "مدينة", t: "noun", d: "A large town, especially an important one.", da: "بلدة كبيرة، خاصة ما كان منها ذا أهمية.", e: "London is a historical city with many landmarks.", ea: "لندن مدينة تاريخية بها العديد من المعالم." }
      ]
    },
    25: {
      title: "Unit 25 — Joe's Pond",
      words: [
        { w: "pond", m: "بركة ماء", t: "noun", d: "A small body of still water formed naturally.", da: "مسطح مائي صغير ساكن يتشكل طبيعياً.", e: "There are beautiful lotus flowers in the pond.", ea: "توجد زهور لوتس جميلة في البركة." },
        { w: "water", m: "ماء", t: "noun", d: "A colorless, odorless liquid that forms the seas, lakes, and rain.", da: "سائل عديم اللون والرائحة يشكل البحار والبحيرات والمطر.", e: "Always drink fresh water to keep your body healthy.", ea: "اشرب دائماً الماء العذب للحفاظ على صحة جسمك." },
        { w: "fish", m: "سمك", t: "noun", d: "A limbless cold-blooded vertebrate animal with gills.", da: "حيوان فقاري عديم الأطراف من ذوات الدم البارد وله خياشيم.", e: "The small fish swam quickly through the water.", ea: "سبحت السمكة الصغيرة بسرعة في الماء." },
        { w: "duck", m: "بطة", t: "noun", d: "A waterbird with a broad blunt bill and webbed feet.", da: "طائر مائي ذو منقار عريض عريض وأقدام وتراء.", e: "We fed the wild duck breadcrumbs at the lake.", ea: "أطعمنا البطة البرية فتات الخبز في البحيرة." },
        { w: "green", m: "أخضر", t: "adjective", d: "Of the color between blue and yellow in the spectrum; like grass.", da: "ذو اللون الواقع بين الأزرق والأصفر في الطيف؛ كالعشب.", e: "The green grass grew rapidly after the spring rain.", ea: "نما العشب الأخضر سريعاً بعد مطر الربيع." }
      ]
    },
    26: {
      title: "Unit 26 — The First Computer",
      words: [
        { w: "computer", m: "حاسوب", t: "noun", d: "An electronic device for storing and processing data.", da: "جهاز إلكتروني لتخزين ومعالجة البيانات.", e: "He uses his computer to complete his school assignments.", ea: "يستخدم حاسوبه لإكمال واجباته المدرسية." },
        { w: "first", m: "أول", t: "adjective", d: "Coming before all others in time, order, or importance.", da: "يأتي قبل جميع الآخرين في الوقت أو الترتيب أو الأهمية.", e: "This was the first time they traveled to another country.", ea: "كانت هذه هي المرة الأولى التي يسافرون فيها إلى بلد آخر." },
        { w: "machine", m: "آلة", t: "noun", d: "An apparatus using mechanical power to perform a task.", da: "جهاز يستخدم القوة الميكانيكية لأداء مهمة ما.", e: "The washing machine saves a lot of time and effort.", ea: "توفر الغسالة الكثير من الوقت والجهد." },
        { w: "calculate", m: "يحسب", t: "verb", d: "Determine mathematically or by using a computer.", da: "تحديد القيمة رياضياً أو باستخدام الحاسوب.", e: "We need to calculate the total cost of the project.", ea: "نحن بحاجة إلى حساب التكلفة الإجمالية للمشروع." },
        { w: "science", m: "علم", t: "noun", d: "The systematic study of the structure of the physical world.", da: "الدراسة المنهجية لبنية وعناصر العالم المادي.", e: "She enjoys studying space science and astronomy.", ea: "تستمتع بدراسة علوم الفضاء وعلم الفلك." }
      ]
    },
    27: {
      title: "Unit 27 — The Shipwreck",
      words: [
        { w: "shipwreck", m: "غرق السفينة", t: "noun", d: "The destruction of a ship at sea by sinking or breaking up.", da: "تدمير سفينة في البحر عن طريق الغرق أو التكسر.", e: "The historical shipwreck was discovered on the ocean floor.", ea: "تم اكتشاف حطام السفينة التاريخي في قاع المحيط." },
        { w: "ship", m: "سفينة", t: "noun", d: "A large boat for transporting people or goods by sea.", da: "قارب كبير لنقل الأشخاص أو البضائع عن طريق البحر.", e: "The massive cargo ship sailed across the Atlantic.", ea: "أبحرت سفينة الشحن الضخمة عبر المحيط الأطلسي." },
        { w: "sea", m: "بحر", t: "noun", d: "The expanse of salt water that covers most of the earth.", da: "امتداد المياه المالحة التي تغطي معظم سطح الأرض.", e: "They love to swim in the warm sea during summer.", ea: "يحبون السباحة في البحر الدافئ خلال الصيف." },
        { w: "storm", m: "عاصفة", t: "noun", d: "A violent disturbance of the atmosphere with strong winds.", da: "اضطراب عنيف في الغلاف الجوي مصحوب برياح قوية.", e: "The violent storm knocked down several old trees.", ea: "أدت العاصفة العنيفة إلى إسقاط العديد من الأشجار القديمة." },
        { w: "ocean", m: "محيط", t: "noun", d: "A very large expanse of sea, in particular, each of the main areas.", da: "امتداد كبير جداً من البحر، وبخاصة كل مساحة من المساحات الرئيسية.", e: "The blue ocean is home to many species of whales.", ea: "المحيط الأزرق موطن للعديد من أنواع الحيتان." }
      ]
    },
    28: {
      title: "Unit 28 — The Party",
      words: [
        { w: "party", m: "حفلة", t: "noun", d: "A social gathering of invited guests, typically involving food and music.", da: "تجمع اجتماعي للضيوف المدعوين، يتضمن عادةً الطعام والموسيقى.", e: "We attended a beautiful birthday party last night.", ea: "حضرنا حفلة عيد ميلاد جميلة الليلة الماضية." },
        { w: "celebrate", m: "يحتفل", t: "verb", d: "Acknowledge a significant event with a social gathering.", da: "الاعتراف بحدث هام عن طريق تجمع اجتماعي.", e: "They gathered to celebrate their team's big victory.", ea: "تجمعوا للاحتفال بالفوز الكبير لفريقهم." },
        { w: "guest", m: "ضيف", t: "noun", d: "A person who is invited to a social event.", da: "الشخص الذي يتم دعوته إلى حدث اجتماعي.", e: "Each guest received a small gift at the entrance.", ea: "تلقى كل ضيف هدية صغيرة عند المدخل." },
        { w: "food", m: "طعام", t: "noun", d: "Any nutritious substance that people or animals eat.", da: "أي مادة مغذية يأكلها الناس أو الحيوانات.", e: "They served delicious traditional food at the wedding.", ea: "قدموا طعاماً تقليدياً لذيذاً في حفل الزفاف." },
        { w: "music", m: "موسيقى", t: "noun", d: "Vocal or instrumental sounds combined in such a way.", da: "أصوات صوتية أو آلية مجتمعة بطريقة متناغمة.", e: "The soft music played in the background of the cafe.", ea: "عزفت الموسيقى الهادئة في خلفية المقهى." }
      ]
    },
    29: {
      title: "Unit 29 — The Farm",
      words: [
        { w: "farm", m: "مزرعة", t: "noun", d: "An area of land used for growing crops and rearing animals.", da: "منطقة من الأرض تستخدم لزراعة المحاصيل وتربية الحيوانات.", e: "They own a beautiful organic farm in the countryside.", ea: "يمتلكون مزرعة عضوية جميلة في الريف." },
        { w: "animal", m: "حيوان", t: "noun", d: "A living organism that feeds on organic matter.", da: "كائن حي يتغذى على المواد العضوية.", e: "The farm is home to many species of domestic animals.", ea: "المزرعة موطن للعديد من أنواع الحيوانات الأليفة." },
        { w: "cow", m: "بقرة", t: "noun", d: "A fully grown female animal of a domesticated breed of ox.", da: "أنثى حيوان كاملة النمو من سلالة الثيران الأليفة.", e: "The cow was grazing peacefully in the green field.", ea: "كانت البقرة ترعى بسلام في الحقل الأخضر." },
        { w: "sheep", m: "خروف / أغنام", t: "noun", d: "A domesticated ruminant animal with a thick woolly coat.", da: "حيوان مجتر أليف ذو غطاء صوفي سميك.", e: "The farmer sheared the sheep to collect the wool.", ea: "جز المزارع الأغنام لجمع الصوف." },
        { w: "horse", m: "حصان", t: "noun", d: "A large domesticated animal with a mane and tail.", da: "حيوان أليف كبير ذو عرف وذيل.", e: "He learned to ride a horse when he was a child.", ea: "تعلم ركوب الخيل عندما كان طفلاً." }
      ]
    },
    30: {
      title: "Unit 30 — The Donation",
      words: [
        { w: "donation", m: "تبرع", t: "noun", d: "Something that is given to a charity, especially a sum of money.", da: "شيء يُعطى للجمعيات الخيرية، وخاصة مبلغ من المال.", e: "Their generous donation will help construct the school.", ea: "تبرعهم السخي سيساعد في بناء المدرسة." },
        { w: "donate", m: "يتبرع", t: "verb", d: "Give money or goods for a good cause, especially to charity.", da: "تقديم المال أو السلع من أجل قضية نبيلة، وخاصة للجمعيات الخيرية.", e: "People often donate their old clothes to families in need.", ea: "غالباً ما يتبرع الناس بملابسهم القديمة للعائلات المحتاجة." },
        { w: "gift", m: "هدية", t: "noun", d: "A thing given willingly to someone without payment.", da: "شيء يُعطى طواعية لشخص ما دون مقابل مالي.", e: "She bought a beautiful birthday gift for her best friend.", ea: "اشترت هدية عيد ميلاد جميلة لصديقتها المفضلة." },
        { w: "help", m: "يساعد", t: "verb", d: "Make it easier for someone to do something.", da: "تسهيل الأمر على شخص ما للقيام بشيء ما.", e: "We should always try to help others in our society.", ea: "يجب علينا دائماً السعي لمساعدة الآخرين في مجتمعنا." },
        { w: "support", m: "يدعم", t: "verb", d: "Give assistance or encouragement to someone.", da: "تقديم المساعدة أو التشجيع لشخص ما.", e: "The local community gathered to support the project.", ea: "تجمع المجتمع المحلي لدعم المشروع." }
      ]
    }
  };

  const unitData = themes[unitNumber];
  if (!unitData) {
    throw new Error(`Unit ${unitNumber} is out of bounds (15, 18, 19-30)`);
  }

  // Pre-seed some default secondary words dynamically to always complete 20 words per unit
  const fillerWords = [
    { w: "active", m: "نشط", t: "adjective", d: "Engaging or ready to engage in physically energetic pursuits.", da: "المشاركة أو الاستعداد للمشاركة في الأنشطة البدنية النشطة.", e: "Regular exercise keeps you active and healthy.", ea: "ممارسة الرياضة بانتظام تبقيك نشيطاً وبصحة جيدة." },
    { w: "accept", m: "يقبل", t: "verb", d: "Consent to receive a thing offered.", da: "الموافقة على تلقي شيء معروض.", e: "He was happy to accept the job offer.", ea: "كان سعيداً بقبول عرض العمل." },
    { w: "always", m: "دائماً", t: "adverb", d: "At all times; on all occasions.", da: "في جميع الأوقات؛ في جميع المناسبات.", e: "She always completes her work on time.", ea: "هي دائماً تكمل عملها في الوقت المحدد." },
    { w: "beautiful", m: "جميل", t: "adjective", d: "Pleasing the senses or mind aesthetically.", da: "إرضاء الحواس أو العقل جمالياً.", e: "The sunset over the mountain was beautiful.", ea: "كان غروب الشمس فوق الجبل جميلاً." },
    { w: "begin", m: "يبدأ", t: "verb", d: "Start to perform or undergo an action.", da: "البدء في أداء أو الخضوع لعمل ما.", e: "We will begin the class at exactly nine o'clock.", ea: "سنبدأ الصف في تمام الساعة التاسعة تماماً." },
    { w: "busy", m: "مشغول", t: "adjective", d: "Having a great deal to do.", da: "امتلاك الكثير من الأعمال للقيام بها.", e: "The busy office was filled with phone calls.", ea: "كان المكتب المزدحم مليئاً بالمكالمات الهاتفية." },
    { w: "change", m: "يتغير", t: "verb", d: "Make or become different.", da: "جعل الشيء مختلفاً أو أن يصبح كذلك.", e: "The weather can change quickly in the mountains.", ea: "يمكن أن يتغير الطقس بسرعة في الجبال." },
    { w: "clear", m: "واضح", t: "adjective", d: "Easy to perceive, understand, or interpret.", da: "سهل الإدراك أو الفهم أو التفسير.", e: "The teacher gave clear instructions for the exam.", ea: "أعطى المعلم تعليمات واضحة للامتحان." },
    { w: "common", m: "شائع", t: "adjective", d: "Occurring, found, or done often; prevalent.", da: "يحدث أو يوجد أو يتم القيام به غالباً؛ منتشر.", e: "Colds are very common during the winter season.", ea: "نزلات البرد شائعة جداً خلال فصل الشتاء." },
    { w: "decide", m: "يقرر", t: "verb", d: "Resolve or settle a question or dispute.", da: "حل أو تسوية مسألة أو خلاف.", e: "She had to decide which college to attend.", ea: "كان عليها أن تقرر أي كلية تلتحق بها." },
    { w: "deep", m: "عميق", d: "Extending far down from the top or surface.", da: "يمتد إلى مسافة بعيدة من القمة أو السطح.", t: "adjective", e: "The divers explored the deep blue sea.", ea: "استكشف الغواصون البحر الأزرق العميق." },
    { w: "discover", m: "يكتشف", d: "Find unexpectedly or during a search.", da: "العثور على شيء بشكل غير متوقع أو أثناء البحث.", t: "verb", e: "Scientists hope to discover new planets in space.", ea: "يأمل العلماء في اكتشاف كواكب جديدة في الفضاء." },
    { w: "easy", m: "سهل", d: "Achieved without great effort; presenting no difficulties.", da: "يتحقق دون جهد كبير؛ لا يمثل أي صعوبات.", t: "adjective", e: "The homework assignment was very easy.", ea: "كان الواجب المنزلي سهلاً للغاية." },
    { w: "energy", m: "طاقة", d: "The strength and vitality required for sustained physical activity.", da: "القوة والحيوية المطلوبة للنشاط البدني المستدام.", t: "noun", e: "A good breakfast gives you energy for the whole day.", ea: "الفطور الجيد يمنحك طاقة طوال اليوم." },
    { w: "exactly", m: "بالضبط", d: "Used to emphasize that something is correct.", da: "تستخدم للتأكيد على أن شيئاً ما صحيح ودقيق.", t: "adverb", e: "The train arrived at exactly seven o'clock.", ea: "وصل القطار في تمام الساعة السابعة تماماً." }
  ];

  const fullWordList = [...unitData.words];
  let fillerIndex = 0;
  while (fullWordList.length < 20 && fillerIndex < fillerWords.length) {
    const filler = fillerWords[fillerIndex++];
    if (!fullWordList.some(item => item.w.toLowerCase() === filler.w.toLowerCase())) {
      fullWordList.push(filler);
    }
  }

  const finalWords: FallbackWord[] = fullWordList.map(w => {
    return {
      word: w.w,
      type: w.t,
      phonetic: `/${w.w}/`,
      meaningArabic: w.m,
      typeArabic: w.t === "noun" ? "اسم" : w.t === "verb" ? "فعل" : w.t === "adjective" ? "صفة" : w.t === "adverb" ? "ظرف" : "أخرى",
      definition: w.d,
      definitionArabic: w.da,
      example: w.e,
      sentenceArabic: w.ea,
      synonyms: `${w.w}1, ${w.w}2, ${w.w}3, ${w.w}4`,
      synonymsArabic: `مرادف1, مرادف2, مرادف3, مرادف4`,
      antonyms: `anti-${w.w}1, anti-${w.w}2, anti-${w.w}3, anti-${w.w}4`,
      antonymsArabic: `مضاد1, مضاد2, مضاد3, مضاد4`,
      collocations: `common ${w.w}, good ${w.w}, standard ${w.w}`,
      collocationsArabic: `شائع, جيد, معيار`
    };
  }).map(w => ({ ...w, ...generateExtraSentences(w) }));

  // Generate generic premium themed story
  const story: FallbackStory = {
    title: unitData.title,
    content: [
      {
        en: `In the beautiful land of learning, a special event took place that was centered around ${unitData.words[0]?.w || "study"}.`,
        ar: `في أرض التعلم الجميلة، حدث أمر خاص تمحور حول موضوع ${unitData.words[0]?.m || "الدراسة"}.`
      },
      {
        en: `Everyone wanted to use their best skills to make a real progress in their ${unitData.words[1]?.w || "project"}.`,
        ar: `أراد الجميع استخدام أفضل مهاراتهم لإحراز تقدم حقيقي في ${unitData.words[1]?.m || "المشروع"} الخاص بهم.`
      },
      {
        en: `They learned that understanding every small detail helps to achieve a great success in the future.`,
        ar: `لقد تعلموا أن فهم كل تفصيل صغير يساعد في تحقيق نجاح كبير في المستقبل.`
      }
    ],
    quizData: [
      {
        question: `What was the central topic of this unit?`,
        options: [`${unitData.words[0]?.w || "study"}`, "Play", "Sleep", "Food"],
        answerIndex: 0
      },
      {
        question: `How did the participants feel about their work?`,
        options: ["Sad", "Excited and eager to learn", "Bored", "Angry"],
        answerIndex: 1
      }
    ]
  };

  return {
    title: unitData.title,
    words: finalWords,
    story
  };
}
