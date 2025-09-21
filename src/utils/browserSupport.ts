// Утилиты для проверки поддержки браузеров

interface BrowserSupport {
  cssVariables: boolean;
  backdropFilter: boolean;
  grid: boolean;
  flexbox: boolean;
  fetch: boolean;
  promises: boolean;
  es6: boolean;
  webp: boolean;
  intersectionObserver: boolean;
  resizeObserver: boolean;
}

class BrowserSupportChecker {
  private support: BrowserSupport;

  constructor() {
    this.support = this.checkSupport();
  }

  private checkSupport(): BrowserSupport {
    return {
      cssVariables: this.checkCSSVariables(),
      backdropFilter: this.checkBackdropFilter(),
      grid: this.checkCSSGrid(),
      flexbox: this.checkFlexbox(),
      fetch: this.checkFetch(),
      promises: this.checkPromises(),
      es6: this.checkES6(),
      webp: this.checkWebP(),
      intersectionObserver: this.checkIntersectionObserver(),
      resizeObserver: this.checkResizeObserver()
    };
  }

  private checkCSSVariables(): boolean {
    return window.CSS && window.CSS.supports && window.CSS.supports('color', 'var(--fake-var)');
  }

  private checkBackdropFilter(): boolean {
    return window.CSS && window.CSS.supports && window.CSS.supports('backdrop-filter', 'blur(1px)');
  }

  private checkCSSGrid(): boolean {
    return window.CSS && window.CSS.supports && window.CSS.supports('display', 'grid');
  }

  private checkFlexbox(): boolean {
    return window.CSS && window.CSS.supports && window.CSS.supports('display', 'flex');
  }

  private checkFetch(): boolean {
    return typeof window.fetch === 'function';
  }

  private checkPromises(): boolean {
    return typeof window.Promise === 'function';
  }

  private checkES6(): boolean {
    try {
      // Проверяем поддержку arrow functions, const/let, template literals
      eval('const test = () => `test`; let x = 1; const y = 2;');
      return true;
    } catch {
      return false;
    }
  }

  private checkWebP(): boolean {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      const dataURL = canvas.toDataURL('image/webp');
      return Boolean(dataURL && dataURL.indexOf('data:image/webp') === 0);
    } catch {
      return false;
    }
  }

  private checkIntersectionObserver(): boolean {
    return typeof window.IntersectionObserver === 'function';
  }

  private checkResizeObserver(): boolean {
    return typeof window.ResizeObserver === 'function';
  }

  public getSupport(): BrowserSupport {
    return { ...this.support };
  }

  public isFullySupported(): boolean {
    const required = ['cssVariables', 'backdropFilter', 'grid', 'flexbox', 'fetch', 'promises', 'es6'];
    return required.every(feature => this.support[feature as keyof BrowserSupport]);
  }

  public getBrowserInfo(): { name: string; version: string; isSupported: boolean } {
    const userAgent = navigator.userAgent;
    let name = 'Unknown';
    let version = 'Unknown';

    // Chrome
    if (userAgent.includes('Chrome') && !userAgent.includes('Edge')) {
      name = 'Chrome';
      const match = userAgent.match(/Chrome\/(\d+)/);
      version = match ? match[1] : 'Unknown';
    }
    // Firefox
    else if (userAgent.includes('Firefox')) {
      name = 'Firefox';
      const match = userAgent.match(/Firefox\/(\d+)/);
      version = match ? match[1] : 'Unknown';
    }
    // Safari
    else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
      name = 'Safari';
      const match = userAgent.match(/Version\/(\d+)/);
      version = match ? match[1] : 'Unknown';
    }
    // Edge
    else if (userAgent.includes('Edge')) {
      name = 'Edge';
      const match = userAgent.match(/Edge\/(\d+)/);
      version = match ? match[1] : 'Unknown';
    }
    // IE
    else if (userAgent.includes('Trident') || userAgent.includes('MSIE')) {
      name = 'Internet Explorer';
      const match = userAgent.match(/(?:MSIE |rv:)(\d+)/);
      version = match ? match[1] : 'Unknown';
    }

    const isSupported = this.isFullySupported();

    return { name, version, isSupported };
  }

  public showWarningIfNeeded(): void {
    if (!this.isFullySupported()) {
      const browserInfo = this.getBrowserInfo();
      const missingFeatures = Object.entries(this.support)
        .filter(([_, supported]) => !supported)
        .map(([feature, _]) => feature);

      console.warn(`⚠️ Browser Compatibility Warning:
        Browser: ${browserInfo.name} ${browserInfo.version}
        Missing features: ${missingFeatures.join(', ')}
        Some features may not work correctly. Please update your browser.`);
    }
  }

  public getRecommendations(): string[] {
    const recommendations: string[] = [];
    const browserInfo = this.getBrowserInfo();

    if (!this.support.cssVariables) {
      recommendations.push('CSS Variables not supported - some themes may not work correctly');
    }

    if (!this.support.backdropFilter) {
      recommendations.push('Backdrop filter not supported - some visual effects will be disabled');
    }

    if (!this.support.grid) {
      recommendations.push('CSS Grid not supported - layout may be broken');
    }

    if (!this.support.fetch) {
      recommendations.push('Fetch API not supported - network requests may fail');
    }

    if (!this.support.promises) {
      recommendations.push('Promises not supported - async operations may not work');
    }

    if (browserInfo.name === 'Internet Explorer') {
      recommendations.push('Internet Explorer is not fully supported. Please use a modern browser.');
    }

    return recommendations;
  }
}

// Создаем глобальный экземпляр
export const browserSupport = new BrowserSupportChecker();

// Автоматически показываем предупреждение при загрузке
if (typeof window !== 'undefined') {
  browserSupport.showWarningIfNeeded();
}

export default browserSupport;
