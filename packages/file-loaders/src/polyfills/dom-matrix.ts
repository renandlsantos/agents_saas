/**
 * DOMMatrix polyfill for Node.js environments
 * This module provides DOMMatrix functionality required by pdfjs-dist
 */

// Check if we're in a Node.js environment that needs the polyfill
const needsPolyfill = typeof global !== 'undefined' && !global.DOMMatrix;

let DOMMatrixImpl: any;

if (needsPolyfill) {
  try {
    // Try to load @napi-rs/canvas which provides a proper DOMMatrix implementation
    const canvas = require('@napi-rs/canvas');
    DOMMatrixImpl = canvas.DOMMatrix;
  } catch {
    // If @napi-rs/canvas is not available, provide a minimal implementation
    console.warn('@napi-rs/canvas not available, using minimal DOMMatrix implementation');

    // Minimal DOMMatrix implementation for pdfjs-dist
    DOMMatrixImpl = class DOMMatrix {
      a: number = 1;
      b: number = 0;
      c: number = 0;
      d: number = 1;
      e: number = 0;
      f: number = 0;

      constructor(init?: number[] | string) {
        if (Array.isArray(init) && init.length >= 6) {
          [this.a, this.b, this.c, this.d, this.e, this.f] = init;
        }
      }

      multiply(other: DOMMatrix): DOMMatrix {
        const result = new DOMMatrix();
        result.a = this.a * other.a + this.c * other.b;
        result.b = this.b * other.a + this.d * other.b;
        result.c = this.a * other.c + this.c * other.d;
        result.d = this.b * other.c + this.d * other.d;
        result.e = this.a * other.e + this.c * other.f + this.e;
        result.f = this.b * other.e + this.d * other.f + this.f;
        return result;
      }

      translate(tx: number, ty: number): DOMMatrix {
        const result = new DOMMatrix();
        result.a = this.a;
        result.b = this.b;
        result.c = this.c;
        result.d = this.d;
        result.e = this.e + tx;
        result.f = this.f + ty;
        return result;
      }

      scale(sx: number, sy?: number): DOMMatrix {
        const scaleY = sy ?? sx;
        const result = new DOMMatrix();
        result.a = this.a * sx;
        result.b = this.b * sx;
        result.c = this.c * scaleY;
        result.d = this.d * scaleY;
        result.e = this.e;
        result.f = this.f;
        return result;
      }

      inverse(): DOMMatrix {
        const det = this.a * this.d - this.b * this.c;
        if (det === 0) {
          throw new Error('Matrix is not invertible');
        }

        const result = new DOMMatrix();
        result.a = this.d / det;
        result.b = -this.b / det;
        result.c = -this.c / det;
        result.d = this.a / det;
        result.e = (this.c * this.f - this.d * this.e) / det;
        result.f = (this.b * this.e - this.a * this.f) / det;
        return result;
      }
    };
  }
}

/**
 * Install DOMMatrix polyfill globally if needed
 */
export function installDOMMatrixPolyfill(): void {
  if (needsPolyfill && DOMMatrixImpl) {
    // @ts-ignore
    global.DOMMatrix = DOMMatrixImpl;
  }
}

/**
 * Get the DOMMatrix implementation
 */
export function getDOMMatrix(): typeof DOMMatrix {
  if (typeof DOMMatrix !== 'undefined') {
    return DOMMatrix;
  }

  if (DOMMatrixImpl) {
    return DOMMatrixImpl;
  }

  throw new Error('DOMMatrix is not available');
}

// Auto-install polyfill when module is imported
if (needsPolyfill) {
  installDOMMatrixPolyfill();
}
