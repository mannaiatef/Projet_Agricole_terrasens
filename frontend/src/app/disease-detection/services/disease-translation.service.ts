import { Injectable } from '@angular/core';

/**
 * DiseaseTranslationService
 * Provides multilingual support for disease names and recommendations
 * Bonus: EN, FR, AR support
 */
@Injectable({
  providedIn: 'root'
})
export class DiseaseTranslationService {
  private currentLanguage = 'en';

  private translations = {
    en: {
      // UI Texts
      'upload_button': 'Upload Image',
      'analyzing': 'Analyzing image...',
      'select_image': 'Select Image',
      'or_drag': 'or drag and drop',
      'preview': 'Image Preview',
      'results': 'Analysis Results',
      'disease_name': 'Disease',
      'confidence': 'Confidence',
      'recommendation': 'Recommendation',
      'history': 'Analysis History',
      'no_results': 'No analysis results yet',
      'delete': 'Delete',
      'loading': 'Loading...',
      'error': 'Error',
      'success': 'Success',

      // Disease Names
      'Tomato Early Blight': 'Tomato Early Blight',
      'Tomato Late Blight': 'Tomato Late Blight',
      'Powdery Mildew': 'Powdery Mildew',
      'Leaf Rust': 'Leaf Rust',
      'Leaf Spot': 'Leaf Spot',
      'Wilt': 'Wilt',
      'Healthy': 'Healthy Plant'
    },
    fr: {
      // UI Texts
      'upload_button': 'Télécharger une image',
      'analyzing': 'Analyse de l\'image en cours...',
      'select_image': 'Sélectionner une image',
      'or_drag': 'ou glisser-déposer',
      'preview': 'Aperçu de l\'image',
      'results': 'Résultats de l\'analyse',
      'disease_name': 'Maladie',
      'confidence': 'Certitude',
      'recommendation': 'Recommandation',
      'history': 'Historique des analyses',
      'no_results': 'Aucun résultat d\'analyse',
      'delete': 'Supprimer',
      'loading': 'Chargement...',
      'error': 'Erreur',
      'success': 'Succès',

      // Disease Names
      'Tomato Early Blight': 'Alternariose précoce',
      'Tomato Late Blight': 'Mildiou de la tomate',
      'Powdery Mildew': 'Oïdium',
      'Leaf Rust': 'Rouille des feuilles',
      'Leaf Spot': 'Tache foliaire',
      'Wilt': 'Flétrissement',
      'Healthy': 'Plante saine'
    },
    ar: {
      // UI Texts
      'upload_button': 'تحميل صورة',
      'analyzing': 'جاري تحليل الصورة...',
      'select_image': 'اختر صورة',
      'or_drag': 'أو اسحب وأفلت',
      'preview': 'معاينة الصورة',
      'results': 'نتائج التحليل',
      'disease_name': 'المرض',
      'confidence': 'درجة الثقة',
      'recommendation': 'التوصية',
      'history': 'سجل التحليل',
      'no_results': 'لا توجد نتائج تحليل حتى الآن',
      'delete': 'حذف',
      'loading': 'جاري التحميل...',
      'error': 'خطأ',
      'success': 'نجح',

      // Disease Names
      'Tomato Early Blight': 'اللفحة المبكرة للطماطم',
      'Tomato Late Blight': 'اللفحة المتأخرة للطماطم',
      'Powdery Mildew': 'البياض الدقيقي',
      'Leaf Rust': 'صدأ الأوراق',
      'Leaf Spot': 'بقع الأوراق',
      'Wilt': 'الذبول',
      'Healthy': 'نبات صحي'
    }
  };

  setLanguage(lang: 'en' | 'fr' | 'ar') {
    this.currentLanguage = lang;
    document.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }

  getLanguage(): string {
    return this.currentLanguage;
  }

  translate(key: string): string {
    return this.translations[this.currentLanguage]?.[key] || this.translations['en']?.[key] || key;
  }
}
