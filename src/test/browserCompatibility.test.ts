import { describe, it, expect, afterEach, vi } from 'vitest'
import browserSupport, { BrowserSupportChecker } from '@/utils/browserSupport'

/**
 * NOTE on design: the exported `browserSupport` singleton computes feature support ONCE in its
 * constructor (at import time), so mocking window.* then calling singleton.getSupport() can never
 * change the result. Feature-detection tests therefore construct a FRESH BrowserSupportChecker
 * AFTER stubbing the relevant globals. Browser detection (getBrowserInfo/getRecommendations) reads
 * navigator.userAgent live, so it is tested by overriding navigator.userAgent per test.
 *
 * All global overrides are restored in afterEach so nothing leaks into the rest of the suite
 * (a clobbered global Promise would break vitest's own async runner).
 */

const realUserAgent = window.navigator.userAgent

function setUserAgent(ua: string) {
  Object.defineProperty(window.navigator, 'userAgent', { value: ua, configurable: true })
}

function stubCSS(supports: (prop: string, value: string) => boolean) {
  vi.stubGlobal('CSS', { supports: vi.fn(supports) })
}

describe('Browser Compatibility', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    setUserAgent(realUserAgent)
    vi.restoreAllMocks()
  })

  describe('CSS feature detection', () => {
    it('detects CSS variables support', () => {
      stubCSS((prop, value) => prop === 'color' && value === 'var(--fake-var)')
      expect(new BrowserSupportChecker().getSupport().cssVariables).toBe(true)
    })

    it('detects lack of CSS variables support', () => {
      stubCSS(() => false)
      expect(new BrowserSupportChecker().getSupport().cssVariables).toBe(false)
    })

    it('detects backdrop-filter support', () => {
      stubCSS((prop, value) => prop === 'backdrop-filter' && value === 'blur(1px)')
      expect(new BrowserSupportChecker().getSupport().backdropFilter).toBe(true)
    })

    it('detects webkit backdrop-filter support (Safari)', () => {
      stubCSS((prop, value) => prop === '-webkit-backdrop-filter' && value === 'blur(1px)')
      expect(new BrowserSupportChecker().getSupport().backdropFilter).toBe(true)
    })

    it('detects lack of backdrop-filter support', () => {
      stubCSS(() => false)
      expect(new BrowserSupportChecker().getSupport().backdropFilter).toBe(false)
    })

    it('detects CSS grid support', () => {
      stubCSS((prop, value) => prop === 'display' && value === 'grid')
      expect(new BrowserSupportChecker().getSupport().grid).toBe(true)
    })

    it('detects flexbox support', () => {
      stubCSS((prop, value) => prop === 'display' && value === 'flex')
      expect(new BrowserSupportChecker().getSupport().flexbox).toBe(true)
    })
  })

  describe('JS capability detection', () => {
    it('detects fetch API support', () => {
      vi.stubGlobal('fetch', vi.fn())
      expect(new BrowserSupportChecker().getSupport().fetch).toBe(true)
    })

    it('detects lack of fetch API support', () => {
      vi.stubGlobal('fetch', undefined)
      expect(new BrowserSupportChecker().getSupport().fetch).toBe(false)
    })

    it('detects Promise support', () => {
      // Native Promise is present.
      expect(new BrowserSupportChecker().getSupport().promises).toBe(true)
    })

    it('detects ES6 support (native)', () => {
      // The real JS engine running the tests supports ES6.
      expect(new BrowserSupportChecker().getSupport().es6).toBe(true)
    })
  })

  describe('Browser detection (navigator.userAgent, live)', () => {
    it('detects Chrome', () => {
      setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36')
      const info = browserSupport.getBrowserInfo()
      expect(info.name).toBe('Chrome')
      expect(info.version).toBe('91')
    })

    it('detects Firefox', () => {
      setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0')
      const info = browserSupport.getBrowserInfo()
      expect(info.name).toBe('Firefox')
      expect(info.version).toBe('89')
    })

    it('detects Safari', () => {
      setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15')
      const info = browserSupport.getBrowserInfo()
      expect(info.name).toBe('Safari')
      expect(info.version).toBe('14')
    })

    it('detects modern Edge (Edg/ UA, not misreported as Chrome)', () => {
      setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59')
      const info = browserSupport.getBrowserInfo()
      expect(info.name).toBe('Edge')
      expect(info.version).toBe('91')
    })

    it('detects Internet Explorer', () => {
      setUserAgent('Mozilla/5.0 (Windows NT 10.0; WOW64; Trident/7.0; AS; rv:11.0) like Gecko')
      const info = browserSupport.getBrowserInfo()
      expect(info.name).toBe('Internet Explorer')
      expect(info.version).toBe('11')
    })
  })

  describe('Recommendations (navigator-driven, live)', () => {
    it('does NOT warn about backdrop-filter for Safari', () => {
      setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15')
      const recommendations = browserSupport.getRecommendations()
      expect(recommendations).not.toContain('Backdrop filter not supported - some visual effects will be disabled')
    })

    it('provides an Internet Explorer specific recommendation', () => {
      setUserAgent('Mozilla/5.0 (Windows NT 10.0; WOW64; Trident/7.0; AS; rv:11.0) like Gecko')
      const recommendations = browserSupport.getRecommendations()
      expect(recommendations).toContain('Internet Explorer is not fully supported. Please use a modern browser.')
    })
  })
})
