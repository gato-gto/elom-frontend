import { describe, it, expect, beforeEach, vi } from 'vitest'
import browserSupport from '@/utils/browserSupport'

// Мокаем window объект для тестов
const mockWindow = {
  CSS: {
    supports: vi.fn()
  },
  fetch: vi.fn(),
  Promise: vi.fn(),
  IntersectionObserver: vi.fn(),
  ResizeObserver: vi.fn(),
  navigator: {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  },
  document: {
    createElement: vi.fn((tagName: string) => {
      if (tagName === 'canvas') {
        return {
          width: 1,
          height: 1,
          toDataURL: vi.fn(() => 'data:image/webp;base64,test')
        }
      }
      return {}
    })
  }
}

describe('Browser Compatibility', () => {
  beforeEach(() => {
    // Сбрасываем все моки
    vi.clearAllMocks()
    
    // Устанавливаем мок window
    Object.assign(window, mockWindow)
  })

  describe('CSS Variables Support', () => {
    it('should detect CSS variables support', () => {
      mockWindow.CSS.supports.mockImplementation((prop: string, value: string) => {
        if (prop === 'color' && value === 'var(--fake-var)') {
          return true
        }
        return false
      })

      const support = browserSupport.getSupport()
      expect(support.cssVariables).toBe(true)
    })

    it('should detect lack of CSS variables support', () => {
      mockWindow.CSS.supports.mockImplementation(() => false)

      const support = browserSupport.getSupport()
      expect(support.cssVariables).toBe(false)
    })
  })

  describe('Backdrop Filter Support', () => {
    it('should detect backdrop filter support', () => {
      mockWindow.CSS.supports.mockImplementation((prop: string, value: string) => {
        if (prop === 'backdrop-filter' && value === 'blur(1px)') {
          return true
        }
        return false
      })

      const support = browserSupport.getSupport()
      expect(support.backdropFilter).toBe(true)
    })

    it('should detect webkit backdrop filter support (Safari)', () => {
      mockWindow.CSS.supports.mockImplementation((prop: string, value: string) => {
        if (prop === '-webkit-backdrop-filter' && value === 'blur(1px)') {
          return true
        }
        return false
      })

      const support = browserSupport.getSupport()
      expect(support.backdropFilter).toBe(true)
    })

    it('should detect lack of backdrop filter support', () => {
      mockWindow.CSS.supports.mockImplementation(() => false)

      const support = browserSupport.getSupport()
      expect(support.backdropFilter).toBe(false)
    })
  })

  describe('CSS Grid Support', () => {
    it('should detect CSS grid support', () => {
      mockWindow.CSS.supports.mockImplementation((prop: string, value: string) => {
        if (prop === 'display' && value === 'grid') {
          return true
        }
        return false
      })

      const support = browserSupport.getSupport()
      expect(support.grid).toBe(true)
    })
  })

  describe('Flexbox Support', () => {
    it('should detect flexbox support', () => {
      mockWindow.CSS.supports.mockImplementation((prop: string, value: string) => {
        if (prop === 'display' && value === 'flex') {
          return true
        }
        return false
      })

      const support = browserSupport.getSupport()
      expect(support.flexbox).toBe(true)
    })
  })

  describe('Fetch API Support', () => {
    it('should detect fetch API support', () => {
      mockWindow.fetch = vi.fn()

      const support = browserSupport.getSupport()
      expect(support.fetch).toBe(true)
    })

    it('should detect lack of fetch API support', () => {
      mockWindow.fetch = undefined

      const support = browserSupport.getSupport()
      expect(support.fetch).toBe(false)
    })
  })

  describe('Promise Support', () => {
    it('should detect Promise support', () => {
      mockWindow.Promise = vi.fn()

      const support = browserSupport.getSupport()
      expect(support.promises).toBe(true)
    })

    it('should detect lack of Promise support', () => {
      mockWindow.Promise = undefined

      const support = browserSupport.getSupport()
      expect(support.promises).toBe(false)
    })
  })

  describe('Browser Detection', () => {
    it('should detect Chrome browser', () => {
      mockWindow.navigator.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'

      const browserInfo = browserSupport.getBrowserInfo()
      expect(browserInfo.name).toBe('Chrome')
      expect(browserInfo.version).toBe('91')
    })

    it('should detect Firefox browser', () => {
      mockWindow.navigator.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0'

      const browserInfo = browserSupport.getBrowserInfo()
      expect(browserInfo.name).toBe('Firefox')
      expect(browserInfo.version).toBe('89')
    })

    it('should detect Safari browser', () => {
      mockWindow.navigator.userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15'

      const browserInfo = browserSupport.getBrowserInfo()
      expect(browserInfo.name).toBe('Safari')
      expect(browserInfo.version).toBe('14')
    })

    it('should detect Edge browser', () => {
      mockWindow.navigator.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59'

      const browserInfo = browserSupport.getBrowserInfo()
      expect(browserInfo.name).toBe('Edge')
      expect(browserInfo.version).toBe('91')
    })

    it('should detect Internet Explorer', () => {
      mockWindow.navigator.userAgent = 'Mozilla/5.0 (Windows NT 10.0; WOW64; Trident/7.0; AS; rv:11.0) like Gecko'

      const browserInfo = browserSupport.getBrowserInfo()
      expect(browserInfo.name).toBe('Internet Explorer')
      expect(browserInfo.version).toBe('11')
    })
  })

  describe('ES6 Support', () => {
    it('should detect ES6 support', () => {
      // Мокаем Function constructor для тестирования ES6
      const originalFunction = window.Function
      window.Function = vi.fn().mockImplementation((code: string) => {
        if (code.includes('() => "test"')) {return () => 'test'}
        if (code.includes('const x = 1')) {return () => 1}
        if (code.includes('`test-${1}`')) {return () => 'test-1'}
        return originalFunction(code)
      }) as any

      const support = browserSupport.getSupport()
      expect(support.es6).toBe(true)

      // Восстанавливаем оригинальный Function
      window.Function = originalFunction
    })

    it('should detect lack of ES6 support', () => {
      // Мокаем Function constructor для имитации ошибки
      const originalFunction = window.Function
      window.Function = vi.fn().mockImplementation(() => {
        throw new Error('ES6 not supported')
      }) as any

      const support = browserSupport.getSupport()
      expect(support.es6).toBe(false)

      // Восстанавливаем оригинальный Function
      window.Function = originalFunction
    })
  })

  describe('Full Support Check', () => {
    it('should return true for fully supported browser', () => {
      // Мокаем все необходимые функции
      mockWindow.CSS.supports.mockImplementation(() => true)
      mockWindow.fetch = vi.fn()
      mockWindow.Promise = vi.fn()
      mockWindow.IntersectionObserver = vi.fn()
      mockWindow.ResizeObserver = vi.fn()

      // Мокаем Function для ES6 поддержки
      const originalFunction = window.Function
      window.Function = vi.fn().mockImplementation((code: string) => {
        if (code.includes('() => "test"')) {return () => 'test'}
        if (code.includes('const x = 1')) {return () => 1}
        if (code.includes('`test-${1}`')) {return () => 'test-1'}
        return originalFunction(code)
      }) as any

      const isSupported = browserSupport.isFullySupported()
      expect(isSupported).toBe(true)

      // Восстанавливаем оригинальный Function
      window.Function = originalFunction
    })

    it('should return false for unsupported browser', () => {
      // Мокаем отсутствие поддержки
      mockWindow.CSS.supports.mockImplementation(() => false)
      mockWindow.fetch = undefined
      mockWindow.Promise = undefined

      const isSupported = browserSupport.isFullySupported()
      expect(isSupported).toBe(false)
    })
  })

  describe('Recommendations', () => {
    it('should provide recommendations for unsupported features', () => {
      // Мокаем отсутствие поддержки CSS переменных
      mockWindow.CSS.supports.mockImplementation((prop: string, value: string) => {
        if (prop === 'color' && value === 'var(--fake-var)') {
          return false
        }
        return true
      })

      const recommendations = browserSupport.getRecommendations()
      expect(recommendations).toContain('CSS Variables not supported - some themes may not work correctly')
    })

    it('should NOT show backdrop filter warning for Safari', () => {
      mockWindow.navigator.userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15'
      
      // Эмулируем Safari с webkit-backdrop-filter, но без стандартного backdrop-filter
      mockWindow.CSS.supports.mockImplementation((prop: string, value: string) => {
        if (prop === '-webkit-backdrop-filter' && value === 'blur(1px)') {
          return true
        }
        if (prop === 'backdrop-filter' && value === 'blur(1px)') {
          return false
        }
        return true
      })

      const recommendations = browserSupport.getRecommendations()
      expect(recommendations).not.toContain('Backdrop filter not supported - some visual effects will be disabled')
    })

    it('should provide IE specific recommendations', () => {
      mockWindow.navigator.userAgent = 'Mozilla/5.0 (Windows NT 10.0; WOW64; Trident/7.0; AS; rv:11.0) like Gecko'

      const recommendations = browserSupport.getRecommendations()
      expect(recommendations).toContain('Internet Explorer is not fully supported. Please use a modern browser.')
    })
  })
})
