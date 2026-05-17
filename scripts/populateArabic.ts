// =====================================================================
//  scripts/populateArabic.ts
//  Pre-populates meaningArabic and typeArabic fields from fallback.ts
//  Run: npx ts-node --project tsconfig.seed.json scripts/populateArabic.ts
//  Designed by Ali Jitam ❤️
// =====================================================================

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const TYPE_ARABIC: Record<string, string> = {
  noun: "اسم", verb: "فعل", adjective: "صفة", adverb: "ظرف",
  preposition: "حرف جر", pronoun: "ضمير", conjunction: "حرف عطف",
  phrase: "عبارة", other: "أخرى",
};

const KNOWN_TRANSLATIONS: Record<string, string> = {
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
  better:"أحسن",between:"بين",beyond:"ما وراء",blood:"دم",board:"لوحة",
  body:"جسم",book:"كتاب",born:"مولود",both:"كلا",break:"يكسر",
  bring:"يحضر",brother:"أخ",build:"يبني",business:"عمل تجاري",busy:"مشغول",
  buy:"يشتري",call:"يتصل",capital:"عاصمة",care:"يهتم",carry:"يحمل",
  case:"حالة",catch:"يمسك",cause:"يسبب",center:"مركز",certain:"مؤكد",
  chance:"فرصة",change:"يتغير",character:"شخصية",check:"يتحقق",child:"طفل",
  choice:"اختيار",choose:"يختار",city:"مدينة",claim:"يدّعي",class:"صف",
  clear:"واضح",close:"يغلق",collect:"يجمع",color:"لون",come:"يأتي",
  common:"شائع",community:"مجتمع",company:"شركة",compare:"يقارن",complete:"يكمل",
  concern:"قلق",condition:"حالة",consider:"يعتبر",contain:"يحتوي",continue:"يستمر",
  control:"يتحكم",cost:"تكلفة",country:"بلد",couple:"زوج",course:"دورة",
  cover:"يغطي",create:"يخلق",culture:"ثقافة",current:"حالي",cut:"يقطع",
  danger:"خطر",dark:"مظلم",data:"بيانات",daughter:"ابنة",deal:"صفقة",
  death:"موت",decide:"يقرر",deep:"عميق",degree:"درجة",demand:"طلب",
  describe:"يصف",design:"تصميم",detail:"تفصيل",develop:"يطور",different:"مختلف",
  difficult:"صعب",direction:"اتجاه",discover:"يكتشف",discuss:"يناقش",disease:"مرض",
  doctor:"طبيب",door:"باب",draw:"يرسم",dream:"حلم",drive:"يقود",
  drop:"يسقط",during:"خلال",early:"مبكر",earth:"أرض",easy:"سهل",
  economy:"اقتصاد",education:"تعليم",effect:"تأثير",effort:"جهد",either:"أيضاً",
  employ:"يوظف",encourage:"يشجع",energy:"طاقة",enjoy:"يستمتع",enough:"كافي",
  enter:"يدخل",entire:"كامل",environment:"بيئة",especially:"خاصةً",establish:"يؤسس",
  even:"حتى",event:"حدث",ever:"أبداً",every:"كل",evidence:"دليل",
  exactly:"بالضبط",example:"مثال",except:"ماعدا",exist:"يوجد",expect:"يتوقع",
  experience:"تجربة",explain:"يشرح",express:"يعبر",face:"وجه",fact:"حقيقة",
  fail:"يفشل",fall:"يسقط",family:"عائلة",far:"بعيد",fast:"سريع",
  father:"أب",fear:"خوف",feel:"يشعر",field:"حقل",fight:"يقاتل",
  figure:"شكل",fill:"يملأ",final:"نهائي",finally:"أخيراً",find:"يجد",
  fine:"جيد",finger:"إصبع",finish:"ينهي",fire:"نار",first:"أول",
  fish:"سمكة",floor:"أرضية",fly:"يطير",follow:"يتبع",food:"طعام",
  force:"قوة",foreign:"أجنبي",forget:"ينسى",form:"شكل",free:"حر",
  friend:"صديق",front:"أمام",full:"ممتلئ",future:"مستقبل",garden:"حديقة",
  general:"عام",girl:"فتاة",give:"يعطي",glass:"زجاج",goal:"هدف",
  good:"جيد",government:"حكومة",great:"عظيم",green:"أخضر",ground:"أرض",
  group:"مجموعة",grow:"ينمو",growth:"نمو",guide:"دليل",hair:"شعر",
  half:"نصف",hand:"يد",happen:"يحدث",happy:"سعيد",hard:"صعب",
  head:"رأس",health:"صحة",hear:"يسمع",heart:"قلب",heavy:"ثقيل",
  help:"يساعد",high:"عالي",history:"تاريخ",hold:"يمسك",home:"منزل",
  hope:"أمل",hot:"حار",hour:"ساعة",house:"بيت",human:"إنسان",
  idea:"فكرة",image:"صورة",imagine:"يتخيل",impact:"تأثير",important:"مهم",
  improve:"يحسن",include:"يشمل",increase:"يزيد",indeed:"بالفعل",indicate:"يشير",
  individual:"فرد",industry:"صناعة",inform:"يبلغ",inside:"داخل",instead:"بدلاً من",
  interest:"اهتمام",international:"دولي",involve:"يشمل",issue:"قضية",item:"عنصر",
  join:"ينضم",just:"فقط",keep:"يبقي",key:"مفتاح",kill:"يقتل",
  kind:"نوع",king:"ملك",know:"يعرف",knowledge:"معرفة",land:"أرض",
  language:"لغة",large:"كبير",last:"أخير",late:"متأخر",law:"قانون",
  lead:"يقود",learn:"يتعلم",leave:"يغادر",less:"أقل",letter:"رسالة",
  level:"مستوى",life:"حياة",light:"ضوء",line:"خط",list:"قائمة",
  listen:"يستمع",little:"صغير",live:"يعيش",long:"طويل",look:"ينظر",
  lose:"يخسر",love:"حب",low:"منخفض",
};

async function main() {
  console.log("🔄  Pre-populating Arabic fields from fallback dictionary...\n");

  const words = await prisma.word.findMany({
    where: { OR: [{ meaningArabic: null }, { typeArabic: null }] },
    select: { id: true, word: true, type: true },
  });

  console.log(`📚  Found ${words.length} words needing Arabic data`);

  let updated = 0;
  for (const w of words) {
    const meaningArabic = KNOWN_TRANSLATIONS[w.word.toLowerCase()] ?? null;
    const typeArabic = TYPE_ARABIC[w.type.toLowerCase()] ?? TYPE_ARABIC.other;

    if (meaningArabic || typeArabic) {
      await prisma.word.update({
        where: { id: w.id },
        data: {
          ...(meaningArabic && { meaningArabic }),
          ...(typeArabic && { typeArabic }),
        },
      });
      updated++;
    }
  }

  console.log(`✅  Updated ${updated} words with Arabic data`);
  console.log("🎉  Pre-population complete!\n");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
