// Полифиллы для обеспечения совместимости со старыми браузерами

// Полифилл для Object.entries (IE не поддерживает)
if (!Object.entries) {
  Object.entries = function(obj: any) {
    const ownProps = Object.keys(obj);
    let i = ownProps.length;
    const resArray = new Array(i);
    while (i--) {
      resArray[i] = [ownProps[i], obj[ownProps[i]]];
    }
    return resArray;
  };
}

// Полифилл для Object.values (IE не поддерживает)
if (!Object.values) {
  Object.values = function(obj: any) {
    const ownProps = Object.keys(obj);
    let i = ownProps.length;
    const resArray = new Array(i);
    while (i--) {
      resArray[i] = obj[ownProps[i]];
    }
    return resArray;
  };
}

// Полифилл для Array.from (IE не поддерживает)
if (!Array.from) {
  Array.from = function(arrayLike: any, mapFn?: any, thisArg?: any) {
    const C = this;
    const items = Object(arrayLike);
    if (arrayLike == null) {
      throw new TypeError('Array.from requires an array-like object - not null or undefined');
    }
    const mapFunction = arguments.length > 1 ? mapFn : void undefined;
    let T;
    if (typeof mapFunction !== 'undefined') {
      if (!Array.isArray(mapFunction) && typeof mapFunction !== 'function') {
        throw new TypeError('Array.from: when provided, the second argument must be a function');
      }
      if (arguments.length > 2) {
        T = thisArg;
      }
    }
    const len = parseInt(items.length) || 0;
    const A = typeof C === 'function' ? Object(new C(len)) : new Array(len);
    let k = 0;
    let kValue;
    while (k < len) {
      kValue = items[k];
      if (mapFunction) {
        A[k] = typeof T === 'undefined' ? mapFunction(kValue, k) : mapFunction.call(T, kValue, k);
      } else {
        A[k] = kValue;
      }
      k += 1;
    }
    A.length = len;
    return A;
  };
}

// Полифилл для Promise (IE не поддерживает)
if (!window.Promise) {
  window.Promise = class Promise {
    constructor(executor: any) {
      // Простая реализация Promise для старых браузеров
      this.state = 'pending';
      this.value = undefined;
      this.handlers = [];
      
      try {
        executor(this.resolve.bind(this), this.reject.bind(this));
      } catch (ex) {
        this.reject(ex);
      }
    }
    
    state: string;
    value: any;
    handlers: any[] | null;
    
    resolve(result: any) {
      if (this.state === 'pending') {
        this.state = 'fulfilled';
        this.value = result;
        this.handlers?.forEach(this.handle);
        this.handlers = null;
      }
    }
    
    reject(error: any) {
      if (this.state === 'pending') {
        this.state = 'rejected';
        this.value = error;
        this.handlers?.forEach(this.handle);
        this.handlers = null;
      }
    }
    
    handle(handler: any) {
      if (this.state === 'pending') {
        this.handlers?.push(handler);
      } else {
        if (this.state === 'fulfilled' && typeof handler.onFulfilled === 'function') {
          handler.onFulfilled(this.value);
        }
        if (this.state === 'rejected' && typeof handler.onRejected === 'function') {
          handler.onRejected(this.value);
        }
      }
    }
    
    then(onFulfilled?: any, onRejected?: any) {
      return new Promise((resolve: any, reject: any) => {
        this.handle({
          onFulfilled: (result: any) => {
            try {
              resolve(onFulfilled ? onFulfilled(result) : result);
            } catch (ex) {
              reject(ex);
            }
          },
          onRejected: (error: any) => {
            try {
              resolve(onRejected ? onRejected(error) : error);
            } catch (ex) {
              reject(ex);
            }
          }
        });
      });
    }
    
    catch(onRejected: any) {
      return this.then(null, onRejected);
    }
  } as any;
}

// Полифилл для fetch API (IE не поддерживает)
if (!window.fetch) {
  window.fetch = function(input: any, init?: any) {
    const url = typeof input === 'string' ? input : input.toString();
    const options = init || {};
    return new Promise((resolve, reject) => {
      const xhr = new (window as any).XMLHttpRequest();
      xhr.open(options.method || 'GET', url);
      
      // Устанавливаем заголовки
      if (options.headers) {
        const headers = options.headers as Record<string, string>;
        Object.keys(headers).forEach(key => {
          xhr.setRequestHeader(key, headers[key]);
        });
      }
      
      xhr.onload = function() {
        const response = {
          ok: xhr.status >= 200 && xhr.status < 300,
          status: xhr.status,
          statusText: xhr.statusText,
          json: () => Promise.resolve(JSON.parse(xhr.responseText)),
          text: () => Promise.resolve(xhr.responseText)
        };
        resolve(response as any);
      };
      
      xhr.onerror = function() {
        reject(new Error('Network error'));
      };
      
      xhr.send(options.body as any);
    });
  };
}

// Полифилл для CSS переменных (IE не поддерживает)
if (!window.CSS || !window.CSS.supports || !window.CSS.supports('color', 'var(--fake-var)')) {
  // Простой полифилл для CSS переменных
  const style = document.createElement('style');
  style.textContent = `
    :root {
      --b1: 0 0% 100%;
      --b2: 210 40% 98%;
      --b3: 214.3 31.8% 91.4%;
      --bc: 215.4 16.3% 46.9%;
    }
    :root.dark {
      --b1: 222.2 84% 4.9%;
      --b2: 217.2 32.6% 17.5%;
      --b3: 215.4 16.3% 25.9%;
      --bc: 210 40% 98%;
    }
  `;
  document.head.appendChild(style);
}

export {};
