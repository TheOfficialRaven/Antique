// Language manager for Atique Shop
class LanguageManager {
  constructor() {
    this.currentLanguage = localStorage.getItem('language') || 'hu';
    this.translations = {};
    this.initialized = false;
  }

  // Initialize the language manager
  async init() {
    try {
      await this.loadTranslations();
      this.createLanguageSelector();
      this.applyTranslations();
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize language manager:', error);
    }
  }

  // Load translations for all languages
  async loadTranslations() {
    const languages = ['hu', 'en', 'de'];
    
    for (const lang of languages) {
      try {
        const response = await fetch(`lang/${lang}.json`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        this.translations[lang] = await response.json();
      } catch (error) {
        console.error(`Failed to load ${lang} translations:`, error);
      }
    }
  }

  // Create language selector UI
  createLanguageSelector() {
    const headers = document.querySelectorAll('.site-header');
    
    headers.forEach(header => {
      // Check if language selector already exists
      if (header.querySelector('.language-selector')) {
        return;
      }

      const languageSelector = document.createElement('div');
      languageSelector.className = 'language-selector';
      
      const languages = [
        { code: 'hu', name: 'Magyar', flag: '🇭🇺' },
        { code: 'en', name: 'English', flag: '🇬🇧' },
        { code: 'de', name: 'Deutsch', flag: '🇩🇪' }
      ];

      // Create current language display
      const currentLang = languages.find(lang => lang.code === this.currentLanguage) || languages[0];
      
      languageSelector.innerHTML = `
        <div class="language-current">
          <span class="flag">${currentLang.flag}</span>
          <span class="lang-name">${currentLang.code.toUpperCase()}</span>
          <span class="dropdown-arrow">▼</span>
        </div>
        <div class="language-options">
          ${languages.map(lang => `
            <div class="language-option ${lang.code === this.currentLanguage ? 'active' : ''}" data-lang="${lang.code}">
              <span class="flag">${lang.flag}</span>
              <span class="lang-name">${lang.name}</span>
            </div>
          `).join('')}
        </div>
      `;

      // Add event listeners
      const currentLangElement = languageSelector.querySelector('.language-current');
      const optionsElement = languageSelector.querySelector('.language-options');
      
      currentLangElement.addEventListener('click', (e) => {
        e.stopPropagation();
        languageSelector.classList.toggle('active');
      });

      // Close dropdown when clicking outside
      document.addEventListener('click', () => {
        languageSelector.classList.remove('active');
      });

      // Handle language selection
      languageSelector.querySelectorAll('.language-option').forEach(option => {
        option.addEventListener('click', (e) => {
          e.stopPropagation();
          const selectedLang = option.dataset.lang;
          this.changeLanguage(selectedLang);
          languageSelector.classList.remove('active');
        });
      });

      // Insert language selector into header
      const desktopNav = header.querySelector('.desktop-nav');
      if (desktopNav) {
        desktopNav.appendChild(languageSelector);
      } else {
        // For mobile or when desktop nav is not present
        header.appendChild(languageSelector);
      }

      // Also add to mobile navigation if it exists
      const mobileNav = header.querySelector('.nav-overlay');
      if (mobileNav) {
        const mobileLangSelector = languageSelector.cloneNode(true);
        mobileLangSelector.className = 'language-selector mobile';
        
        // Re-add event listeners for mobile selector
        this.addEventListeners(mobileLangSelector);
        
        mobileNav.appendChild(mobileLangSelector);
      }
    });
  }

  // Add event listeners to a language selector element
  addEventListeners(selector) {
    const currentLangElement = selector.querySelector('.language-current');
    
    currentLangElement.addEventListener('click', (e) => {
      e.stopPropagation();
      selector.classList.toggle('active');
    });

    selector.querySelectorAll('.language-option').forEach(option => {
      option.addEventListener('click', (e) => {
        e.stopPropagation();
        const selectedLang = option.dataset.lang;
        this.changeLanguage(selectedLang);
        selector.classList.remove('active');
      });
    });
  }

  // Change language
  async changeLanguage(languageCode) {
    if (languageCode === this.currentLanguage) return;
    
    this.currentLanguage = languageCode;
    localStorage.setItem('language', languageCode);
    
    // Update HTML lang attribute
    document.documentElement.lang = languageCode;
    
    // Update all language selectors
    this.updateLanguageSelectors();
    
    // Apply new translations
    this.applyTranslations();
  }

  // Update language selector displays
  updateLanguageSelectors() {
    const languages = [
      { code: 'hu', name: 'Magyar', flag: '🇭🇺' },
      { code: 'en', name: 'English', flag: '🇬🇧' },
      { code: 'de', name: 'Deutsch', flag: '🇩🇪' }
    ];

    const currentLang = languages.find(lang => lang.code === this.currentLanguage);
    
    document.querySelectorAll('.language-selector').forEach(selector => {
      // Update current language display
      const currentDisplay = selector.querySelector('.language-current');
      if (currentDisplay) {
        currentDisplay.innerHTML = `
          <span class="flag">${currentLang.flag}</span>
          <span class="lang-name">${currentLang.code.toUpperCase()}</span>
          <span class="dropdown-arrow">▼</span>
        `;
      }

      // Update active state in options
      selector.querySelectorAll('.language-option').forEach(option => {
        option.classList.toggle('active', option.dataset.lang === this.currentLanguage);
      });
    });
  }

  // Apply translations to the page
  applyTranslations() {
    if (!this.translations[this.currentLanguage]) {
      console.warn(`Translations for ${this.currentLanguage} not available`);
      return;
    }

    const translations = this.translations[this.currentLanguage];

    // Find all elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(element => {
      const key = element.getAttribute('data-i18n');
      const translation = this.getTranslation(key, translations);
      
      if (translation) {
        // Check if it's a placeholder or input field
        if (element.hasAttribute('placeholder') || key.includes('placeholder')) {
          element.placeholder = translation;
        } else if (element.tagName === 'INPUT' && element.type === 'submit') {
          element.value = translation;
        } else if (element.hasAttribute('aria-label')) {
          element.setAttribute('aria-label', translation);
        } else {
          element.textContent = translation;
        }
      }
    });

    // Update page title
    const titleElement = document.querySelector('title');
    if (titleElement) {
      const pageName = this.getPageName();
      if (pageName && translations.nav && translations.nav[pageName]) {
        titleElement.textContent = `${translations.nav[pageName]} - Atique Shop`;
      }
    }
  }

  // Get translation by nested key (e.g., "nav.home")
  getTranslation(key, translations) {
    const keys = key.split('.');
    let result = translations;
    
    for (const k of keys) {
      if (result && typeof result === 'object' && k in result) {
        result = result[k];
      } else {
        return null;
      }
    }
    
    return result;
  }

  // Get current page name for title updates
  getPageName() {
    const path = window.location.pathname;
    const filename = path.substring(path.lastIndexOf('/') + 1);
    
    switch (filename) {
      case 'index.html':
      case '':
        return 'home';
      case 'regisegek.html':
        return 'antiques';
      case 'rolunk.html':
        return 'about';
      case 'kapcsolat.html':
        return 'contact';
      default:
        return null;
    }
  }

  // Get current language
  getCurrentLanguage() {
    return this.currentLanguage;
  }

  // Check if manager is initialized
  isInitialized() {
    return this.initialized;
  }
}

// Create global instance
window.languageManager = new LanguageManager();

// Auto-initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.languageManager.init();
});

// Export for module usage
export default LanguageManager; 