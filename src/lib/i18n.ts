export type Language = 'en' | 'hi';

const translations = {
  // Landing Page
  'app.name': { en: 'Smart Library Entry', hi: 'स्मार्ट लाइब्रेरी एंट्री' },
  'app.tagline': { en: 'Digital Library Entry Management', hi: 'डिजिटल लाइब्रेरी एंट्री प्रबंधन' },
  'hero.title': { en: 'Manage Your Library Entries with QR Codes', hi: 'QR कोड से अपनी लाइब्रेरी एंट्री प्रबंधित करें' },
  'hero.subtitle': { en: 'A complete cloud-based solution for colleges and libraries to digitize student entry management with unique QR codes.', hi: 'कॉलेजों और लाइब्रेरी के लिए QR कोड से स्टूडेंट एंट्री को डिजिटल बनाने का पूरा क्लाउड-बेस्ड समाधान।' },
  'hero.cta.signup': { en: 'Get Started Free', hi: 'मुफ्त शुरू करें' },
  'hero.cta.login': { en: 'Login', hi: 'लॉगिन' },
  'hero.cta.demo': { en: 'Watch Demo', hi: 'डेमो देखें' },

  // Features
  'features.title': { en: 'Features', hi: 'फीचर्स' },
  'features.qr.title': { en: 'Unique QR Code', hi: 'यूनिक QR कोड' },
  'features.qr.desc': { en: 'Auto-generated QR code for each library. Students scan and register instantly.', hi: 'हर लाइब्रेरी के लिए ऑटो-जनरेटेड QR कोड। स्टूडेंट्स स्कैन करें और तुरंत रजिस्टर करें।' },
  'features.dashboard.title': { en: 'Real-time Dashboard', hi: 'रियल-टाइम डैशबोर्ड' },
  'features.dashboard.desc': { en: 'Track entries, view analytics, and manage student data in real time.', hi: 'रियल-टाइम में एंट्री ट्रैक करें, एनालिटिक्स देखें, और स्टूडेंट डेटा मैनेज करें।' },
  'features.signature.title': { en: 'Digital Signature', hi: 'डिजिटल हस्ताक्षर' },
  'features.signature.desc': { en: 'Students sign digitally on entry form. Secure and verifiable.', hi: 'स्टूडेंट्स एंट्री फॉर्म पर डिजिटल हस्ताक्षर करें। सुरक्षित और सत्यापन योग्य।' },
  'features.reports.title': { en: 'Excel & PDF Reports', hi: 'Excel और PDF रिपोर्ट' },
  'features.reports.desc': { en: 'Download detailed reports in Excel or PDF format anytime.', hi: 'कभी भी Excel या PDF फॉर्मेट में विस्तृत रिपोर्ट डाउनलोड करें।' },
  'features.multi.title': { en: 'Multi-College Platform', hi: 'मल्टी-कॉलेज प्लेटफॉर्म' },
  'features.multi.desc': { en: 'Multiple colleges on one platform. Each college data stays isolated.', hi: 'एक प्लेटफॉर्म पर कई कॉलेज। हर कॉलेज का डेटा अलग रहता है।' },
  'features.mobile.title': { en: 'Mobile Responsive', hi: 'मोबाइल रिस्पॉन्सिव' },
  'features.mobile.desc': { en: 'Works perfectly on mobile, tablet, and desktop devices.', hi: 'मोबाइल, टैबलेट और डेस्कटॉप पर पूरी तरह काम करता है।' },

  // Auth
  'auth.login': { en: 'Login', hi: 'लॉगिन' },
  'auth.signup': { en: 'Sign Up', hi: 'साइन अप' },
  'auth.logout': { en: 'Logout', hi: 'लॉग आउट' },
  'auth.email': { en: 'Email', hi: 'ईमेल' },
  'auth.password': { en: 'Password', hi: 'पासवर्ड' },
  'auth.confirm_password': { en: 'Confirm Password', hi: 'पासवर्ड पुष्टि करें' },
  'auth.forgot_password': { en: 'Forgot Password?', hi: 'पासवर्ड भूल गए?' },
  'auth.reset_password': { en: 'Reset Password', hi: 'पासवर्ड रीसेट करें' },
  'auth.no_account': { en: "Don't have an account?", hi: 'अकाउंट नहीं है?' },
  'auth.have_account': { en: 'Already have an account?', hi: 'पहले से अकाउंट है?' },
  'auth.library_name': { en: 'Library Name', hi: 'लाइब्रेरी का नाम' },
  'auth.college_name': { en: 'College Name', hi: 'कॉलेज का नाम' },
  'auth.admin_name': { en: 'Admin Name', hi: 'एडमिन का नाम' },
  'auth.phone': { en: 'Phone Number', hi: 'फोन नंबर' },
  'auth.signup_library': { en: 'Register Your Library', hi: 'अपनी लाइब्रेरी रजिस्टर करें' },

  // Dashboard
  'dashboard.title': { en: 'Dashboard', hi: 'डैशबोर्ड' },
  'dashboard.total_students': { en: 'Total Students', hi: 'कुल छात्र' },
  'dashboard.today_entries': { en: "Today's Entries", hi: 'आज की एंट्री' },
  'dashboard.weekly_entries': { en: 'Weekly Entries', hi: 'साप्ताहिक एंट्री' },
  'dashboard.monthly_entries': { en: 'Monthly Entries', hi: 'मासिक एंट्री' },

  // Student Entry Form
  'entry.title': { en: 'Library Entry Form', hi: 'लाइब्रेरी एंट्री फॉर्म' },
  'entry.student_name': { en: 'Student Name', hi: 'छात्र का नाम' },
  'entry.department': { en: 'Department', hi: 'विभाग' },
  'entry.year': { en: 'Year', hi: 'वर्ष' },
  'entry.roll_number': { en: 'Roll Number', hi: 'रोल नंबर' },
  'entry.mobile': { en: 'Mobile Number', hi: 'मोबाइल नंबर' },
  'entry.email': { en: 'Email (Optional)', hi: 'ईमेल (वैकल्पिक)' },
  'entry.id_card': { en: 'ID Card Number (Optional)', hi: 'आईडी कार्ड नंबर (वैकल्पिक)' },
  'entry.signature': { en: 'Digital Signature', hi: 'डिजिटल हस्ताक्षर' },
  'entry.submit': { en: 'Submit Entry', hi: 'एंट्री जमा करें' },
  'entry.success': { en: 'Entry submitted successfully!', hi: 'एंट्री सफलतापूर्वक जमा हो गई!' },
  'entry.sign_here': { en: 'Sign here', hi: 'यहां हस्ताक्षर करें' },
  'entry.clear_signature': { en: 'Clear', hi: 'मिटाएं' },

  // Navigation
  'nav.dashboard': { en: 'Dashboard', hi: 'डैशबोर्ड' },
  'nav.students': { en: 'Students', hi: 'छात्र' },
  'nav.qr_code': { en: 'QR Code', hi: 'QR कोड' },
  'nav.reports': { en: 'Reports', hi: 'रिपोर्ट' },
  'nav.settings': { en: 'Settings', hi: 'सेटिंग्स' },
  'nav.super_admin': { en: 'Admin Panel', hi: 'एडमिन पैनल' },

  // Common
  'common.search': { en: 'Search...', hi: 'खोजें...' },
  'common.filter': { en: 'Filter', hi: 'फ़िल्टर' },
  'common.export': { en: 'Export', hi: 'एक्सपोर्ट' },
  'common.delete': { en: 'Delete', hi: 'हटाएं' },
  'common.edit': { en: 'Edit', hi: 'संपादित करें' },
  'common.save': { en: 'Save', hi: 'सेव करें' },
  'common.cancel': { en: 'Cancel', hi: 'रद्द करें' },
  'common.loading': { en: 'Loading...', hi: 'लोड हो रहा है...' },
  'common.language': { en: 'हिंदी', hi: 'English' },
} as const;

export type TranslationKey = keyof typeof translations;

export function t(key: TranslationKey, lang: Language): string {
  return translations[key]?.[lang] ?? key;
}

export { translations };
