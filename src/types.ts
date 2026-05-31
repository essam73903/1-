export interface Service {
  id: string;
  name: string;
  description: string;
  govFee: number; // State fee (الرسوم الحكومية)
  officeFee: number; // Office fee (أتعاب المكتب)
  category: string;
  icon: string; // Lucide icon name or indicator
  additionalFees?: { id: string; name: string; amount: number }[];
}

export interface AttachedFile {
  name: string;
  data: string; // Base64 data URI
  size: string;
}

export interface BookingRequest {
  id: string;
  clientName: string;
  phoneNumber: string;
  serviceId: string;
  serviceName: string;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  notes: string;
  date: string; // ISO format
  attachedFileName?: string;
  attachedFileData?: string; // Base64 data URI or indicator
  attachedFileSize?: string;
  attachedFiles?: AttachedFile[];
  paymentMethod?: 'mada' | 'visa' | 'applepay' | 'stcpay' | 'bank_transfer' | 'cash';
  paymentStatus?: 'unpaid' | 'paid' | 'processing_transfer';
  paymentDetails?: {
    cardEnding?: string;
    transactionId?: string;
    stcPhone?: string;
    bankName?: string;
    transferReceiptName?: string;
  };
  totalAmount?: number;
}

export interface Transaction {
  id: string;
  clientName: string;
  serviceName: string;
  govFee: number;
  officeFee: number;
  tax: number; // 15% of officeFee
  total: number; // gov + office + tax
  date: string; // ISO format
  notes?: string;
  invoiceNumber: string; // e.g., INV-2026-001
}

// Default dynamic services list based on user's requirements
export const DEFAULT_SERVICES: Service[] = [
  {
    id: 'srv-1',
    name: 'تأشيرة عمل',
    description: 'تسهيل كافة إجراءات الاستقدام وتفويض وإصدار تأشيرات العمل للأفراد والمؤسسات بسرية وسرعة فائقة.',
    govFee: 2200,
    officeFee: 550,
    category: 'visa',
    icon: 'Briefcase'
  },
  {
    id: 'srv-2',
    name: 'تأشيرة عمرة وحج',
    description: 'إصدار تأشيرات المعتمرين والزوار وتنسيق السكن والتنقل بأسعار متميزة تخدم ضيوف الرحمن.',
    govFee: 330,
    officeFee: 165,
    category: 'visa',
    icon: 'Moon'
  },
  {
    id: 'srv-3',
    name: 'تأشيرة زيارة',
    description: 'إجراءات تأشيرات الزيارة العائلية، الشخصية، التجارية، والسياحية مع متابعة القبول والتأشير.',
    govFee: 550,
    officeFee: 220,
    category: 'visa',
    icon: 'Users'
  },
  {
    id: 'srv-4',
    name: 'خدمات تعقيب',
    description: 'متابعة وإنجاز كافة المعاملات لدى الدوائر الحكومية، مكاتب العمل، الجوازات، والبلديات بكفاءة عالية.',
    govFee: 0,
    officeFee: 300,
    category: 'gov',
    icon: 'Building'
  },
  {
    id: 'srv-5',
    name: 'نقل بري',
    description: 'توفير خدمات النقل البري الجماعي والشحن للبضائع والطرود والسيارات بين كافة مدن المملكة ودول الخليج.',
    govFee: 100,
    officeFee: 80,
    category: 'transport',
    icon: 'Truck'
  },
  {
    id: 'srv-6',
    name: 'نقل جوي',
    description: 'حجز ومتابعة تذاكر السفر وإصدار بوالص الشحن الجوي وتسهيل معاملات المطارات والاستقبال.',
    govFee: 800,
    officeFee: 120,
    category: 'transport',
    icon: 'Plane'
  }
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx-1',
    clientName: 'عبد الله بن محمد العتيبي',
    serviceName: 'تأشيرة عمل',
    govFee: 2200,
    officeFee: 550,
    tax: 82.5,
    total: 2832.5,
    date: '2026-05-18T10:30:00Z',
    invoiceNumber: 'SM-2605-001',
    notes: 'استقدام سائق خاص - جاهز للتسليم'
  },
  {
    id: 'tx-2',
    clientName: 'أحمد صالح المهدي',
    serviceName: 'تأشيرة عمرة وحج',
    govFee: 330,
    officeFee: 165,
    tax: 24.75,
    total: 519.75,
    date: '2026-05-19T08:15:00Z',
    invoiceNumber: 'SM-2605-002',
    notes: 'تأشيرة ذكية لعدد ٣ أفراد عائلة قطري'
  },
  {
    id: 'tx-3',
    clientName: 'مؤسسة الرياض للتوريدات',
    serviceName: 'خدمات تعقيب',
    govFee: 0,
    officeFee: 1200,
    tax: 180,
    total: 1380,
    date: '2026-05-19T14:45:00Z',
    invoiceNumber: 'SM-2605-003',
    notes: 'تحديث السجل التجاري ونقل كفالة عمالة موحدة'
  },
  {
    id: 'tx-4',
    clientName: 'خالد بن الوليد الشمري',
    serviceName: 'نقل بري',
    govFee: 100,
    officeFee: 80,
    tax: 12,
    total: 192,
    date: '2026-05-19T17:20:00Z',
    invoiceNumber: 'SM-2605-004',
    notes: 'شحن بري للدمام مبرد'
  }
];

export const INITIAL_BOOKINGS: BookingRequest[] = [
  {
    id: 'bk-1',
    clientName: 'سفيان عبد الرحمن الحارثي',
    phoneNumber: '0501234567',
    serviceId: 'srv-1',
    serviceName: 'تأشيرة عمل',
    status: 'pending',
    notes: 'طلب تأشيرة مهندس تكنولوجيا معلومات لمؤسسة تقنية برمجيات',
    date: '2026-05-19T11:00:00Z'
  },
  {
    id: 'bk-2',
    clientName: 'فاطمة عمر الزهراني',
    phoneNumber: '0559876543',
    serviceId: 'srv-3',
    serviceName: 'تأشيرة زيارة',
    status: 'processing',
    notes: 'زيارة عائلية للوالدين بالتعاون مع وزارة الخارجية للوفود الدولية',
    date: '2026-05-19T12:30:00Z'
  },
  {
    id: 'bk-3',
    clientName: 'شركة النخب التجارية',
    phoneNumber: '0543210987',
    serviceId: 'srv-4',
    serviceName: 'خدمات تعقيب',
    status: 'completed',
    notes: 'رخصة بلدي وإصدار شهادة الدفاع المدني للمستودع الجديد',
    date: '2026-05-18T09:00:00Z'
  }
];

export interface Job {
  id: string;
  title: string;
  department: string;
  location: string;
  type: 'full-time' | 'part-time' | 'contract';
  salary: string;
  description: string;
  requirements: string[];
  date: string;
  status: 'active' | 'closed';
  shares?: number;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  category: 'alert' | 'offer' | 'news' | 'holiday';
  isPinned?: boolean;
}

export interface JobApplication {
  id: string;
  jobId: string;
  jobTitle: string;
  applicantName: string;
  applicantPhone: string;
  applicantEmail?: string;
  coverLetter?: string;
  cvFileName?: string;
  cvFileData?: string;
  date: string;
  status: 'pending' | 'reviewed' | 'accepted' | 'rejected';
}

export const INITIAL_JOBS: Job[] = [
  {
    id: 'job-1',
    title: 'معقب معاملات ميداني',
    department: 'قسم التعقيب والخدمات الحكومية',
    location: 'الرياض',
    type: 'full-time',
    salary: '٥,٥٠٠ - ٧,٠٠٠ ر.س',
    description: 'مطلوب معقب ذو خبرة لا تقل عن سنتين في إنهاء وتخليص المعاملات لدى الدوائر الحكومية والبلديات ومكتب العمل والجوازات والوزارات المختلفة مع مهارات قيادة جيدة وسيارة خاصة.',
    requirements: [
      'خبرة عملية مثبتة في التعقيب والتعامل مع منصات (قوى، أبشر أعمال، رخصة بلدي، سلامة).',
      'معرفة ممتازة بكافة اللوائح والأنظمة الحكومية للمنشآت في المملكة.',
      'امتلاك سيارة ورخصة قيادة سارية المفعول.',
      'مهارات جيدة في التواصل وحل المشكلات واللباقة مع الموظفين.'
    ],
    date: '2026-05-28T08:00:00Z',
    status: 'active',
    shares: 14
  },
  {
    id: 'job-2',
    title: 'موظف خدمة عملاء واستقبال',
    department: 'الإدارة العامة والموارد البشرية',
    location: 'جدة',
    type: 'full-time',
    salary: '٤,٠٠٠ - ٥,٠٠٠ ر.س',
    description: 'نبحث عن ممثل خدمة عملاء متميز لفرعنا الجديد في جدة ليرحب بالعملاء، ويجيب على الاستفسارات الهاتفية والمباشرة بشأن خدمات التأشيرات والتعقيب، ويسجل طلباتهم على النظام الإلكتروني للمكتب.',
    requirements: [
      'شهادة دبلوم أو ثانوية عامة كحد أدنى مع مهارات استخدام الحاسب الآلي.',
      'اللباقة والقدرة العالية على التعامل مع الجمهور وتوجيههم وتسهيل معاملاتهم.',
      'سرعة في الكتابة وإدخال البيانات ومتابعة تذاكر الدعم والطلبات المعلقة.',
      'مقيم بمدينة جدة ولديه شغف لتقديم أرقى مستويات الخدمة للعملاء.'
    ],
    date: '2026-05-30T10:00:00Z',
    status: 'active',
    shares: 8
  },
  {
    id: 'job-3',
    title: 'مستشار تطوير أعمال ومبيعات خدمات',
    department: 'قسم التسويق وتطوير الأعمال',
    location: 'الرياض',
    type: 'contract',
    salary: 'عمولات عالية + راتب أساسي',
    description: 'العمل على استقطاب وتوقيع اتفاقيات خدمات التعقيب واللوجستيات مع الشركات والمنشآت التجارية الكبرى والناشئة لتولي كافة شؤونهم في وزارة العمل والمنافذ الحدودية.',
    requirements: [
      'خبرة سابقة في مبيعات وعقود الـ B2B للخدمات القانونية أو خدمات التعقيب والاستقدام.',
      'شبكة علاقات عامة واسعة مع مديري الموارد البشرية والمديرين التنفيذيين بالرياض.',
      'القدرة على إعداد وتقديم العروض التجارية والتفاوض وإبرام الصفقات بنجاح.',
      'مرونة عالية في العمل وروح المبادرة والبيع الاستباقي.'
    ],
    date: '2026-05-31T12:00:00Z',
    status: 'active',
    shares: 5
  }
];

export const INITIAL_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann-1',
    title: 'تنويه هام: بدء استقبال طلبات التعاقد لخدمات حجاج بيت الله الحرام لموسم ١٤٤٧هـ',
    content: 'يعلن مكتب سما المملكة عن تدشين قسم خدمة ضيوف الرحمن وفتح باب التسجيل المسبق للشركات والمجموعات الراغبة في حجز باقات تأشيرات وتصاريح الحج وتأشيرات العمل المؤقت للموسم القادم. يرجى التواصل مع إدارة العمليات لضمان أولوية التخصيص والمتابعة الإدارية الفورية.',
    date: '2026-05-25T09:00:00Z',
    category: 'offer',
    isPinned: true
  },
  {
    id: 'ann-2',
    title: 'تهنئة وتبريكات بمناسبة تحقيق جائزة المكتب الأكثر تميزاً في خدمات استقدام التأشيرات والتعقيب بالمنطقة الوسطى',
    content: 'يسرنا في مكتب سما المملكة أن نشارككم فخرنا واعتزازنا بالحصول على درع الموثوقية والتميز الرقمي لعام ٢٠٢٦ من الهيئة المانحة لجودة الخدمات العامة. ونعد عملائنا الكرام بمواصلة بذل أقصى الجهود والالتزام بتسريع دورات تسليم المعاملات والشفافية التامة.',
    date: '2026-05-29T11:30:00Z',
    category: 'news',
    isPinned: false
  },
  {
    id: 'ann-3',
    title: 'إعلان ساعات العمل الرسمية خلال إجازة عيد الأضحى المبارك',
    content: 'نود إحاطة عملائنا الكرام ورجال الأعمال المتعاقدين معنا، بأن عطلة العيد ستبدأ إن شاء الله من يوم الأحد ٩ ذي الحجة وتستمر حتى نهاية يوم الأربعاء ١٢ ذي الحجة. على أن يستأنف العمل بشكل طبيعي وتلقي طلبات المتابعة الطارئة عبر الخط الساخن ومنصة المعاملات الإلكترونية الذكية على مدار الساعة.',
    date: '2026-05-31T14:00:00Z',
    category: 'holiday',
    isPinned: false
  }
];

