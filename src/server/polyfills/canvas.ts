/**
 * Canvas polyfills for server-side rendering
 * This module provides DOMMatrix, ImageData, and Path2D polyfills required by pdfjs-dist
 * Must be loaded before any module that uses pdfjs-dist
 */

// Only polyfill in Node.js environment
if (typeof global !== 'undefined' && typeof window === 'undefined') {
  // DOMMatrix polyfill
  if (!global.DOMMatrix) {
    global.DOMMatrix = class DOMMatrix {
      a: number = 1;
      b: number = 0;
      c: number = 0;
      d: number = 1;
      e: number = 0;
      f: number = 0;
      m11: number = 1;
      m12: number = 0;
      m13: number = 0;
      m14: number = 0;
      m21: number = 0;
      m22: number = 1;
      m23: number = 0;
      m24: number = 0;
      m31: number = 0;
      m32: number = 0;
      m33: number = 1;
      m34: number = 0;
      m41: number = 0;
      m42: number = 0;
      m43: number = 0;
      m44: number = 1;

      constructor(init?: number[] | string | DOMMatrix) {
        if (Array.isArray(init)) {
          if (init.length >= 6) {
            [this.a, this.b, this.c, this.d, this.e, this.f] = init;
            this.m11 = this.a;
            this.m12 = this.b;
            this.m21 = this.c;
            this.m22 = this.d;
            this.m41 = this.e;
            this.m42 = this.f;
          }
          if (init.length === 16) {
            [
              this.m11,
              this.m12,
              this.m13,
              this.m14,
              this.m21,
              this.m22,
              this.m23,
              this.m24,
              this.m31,
              this.m32,
              this.m33,
              this.m34,
              this.m41,
              this.m42,
              this.m43,
              this.m44,
            ] = init;
            this.a = this.m11;
            this.b = this.m12;
            this.c = this.m21;
            this.d = this.m22;
            this.e = this.m41;
            this.f = this.m42;
          }
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

      translate(tx: number, ty: number, tz: number = 0): DOMMatrix {
        const result = new DOMMatrix([...this.toFloat64Array()]);
        result.m41 += tx;
        result.m42 += ty;
        result.m43 += tz;
        result.e = result.m41;
        result.f = result.m42;
        return result;
      }

      scale(
        sx: number,
        sy?: number,
        sz: number = 1,
        originX: number = 0,
        originY: number = 0,
        originZ: number = 0,
      ): DOMMatrix {
        const scaleY = sy ?? sx;
        const result = new DOMMatrix([...this.toFloat64Array()]);

        if (originX !== 0 || originY !== 0 || originZ !== 0) {
          result.m41 += originX - sx * originX;
          result.m42 += originY - scaleY * originY;
          result.m43 += originZ - sz * originZ;
        }

        result.m11 *= sx;
        result.m12 *= sx;
        result.m13 *= sx;
        result.m14 *= sx;
        result.m21 *= scaleY;
        result.m22 *= scaleY;
        result.m23 *= scaleY;
        result.m24 *= scaleY;
        result.m31 *= sz;
        result.m32 *= sz;
        result.m33 *= sz;
        result.m34 *= sz;

        result.a = result.m11;
        result.b = result.m12;
        result.c = result.m21;
        result.d = result.m22;
        result.e = result.m41;
        result.f = result.m42;

        return result;
      }

      rotate(angle: number, originX: number = 0, originY: number = 0): DOMMatrix {
        const rad = (angle * Math.PI) / 180;
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);

        const result = new DOMMatrix([...this.toFloat64Array()]);

        const m11 = cos;
        const m12 = sin;
        const m21 = -sin;
        const m22 = cos;

        const new_m11 = result.m11 * m11 + result.m21 * m12;
        const new_m12 = result.m12 * m11 + result.m22 * m12;
        const new_m21 = result.m11 * m21 + result.m21 * m22;
        const new_m22 = result.m12 * m21 + result.m22 * m22;

        result.m11 = new_m11;
        result.m12 = new_m12;
        result.m21 = new_m21;
        result.m22 = new_m22;

        if (originX !== 0 || originY !== 0) {
          result.m41 += originX - new_m11 * originX - new_m21 * originY;
          result.m42 += originY - new_m12 * originX - new_m22 * originY;
        }

        result.a = result.m11;
        result.b = result.m12;
        result.c = result.m21;
        result.d = result.m22;
        result.e = result.m41;
        result.f = result.m42;

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

        result.m11 = result.a;
        result.m12 = result.b;
        result.m21 = result.c;
        result.m22 = result.d;
        result.m41 = result.e;
        result.m42 = result.f;

        return result;
      }

      toFloat64Array(): Float64Array {
        return new Float64Array([
          this.m11,
          this.m12,
          this.m13,
          this.m14,
          this.m21,
          this.m22,
          this.m23,
          this.m24,
          this.m31,
          this.m32,
          this.m33,
          this.m34,
          this.m41,
          this.m42,
          this.m43,
          this.m44,
        ]);
      }

      toString(): string {
        return `matrix(${this.a}, ${this.b}, ${this.c}, ${this.d}, ${this.e}, ${this.f})`;
      }
    } as any;
  }

  // ImageData polyfill
  if (!global.ImageData) {
    global.ImageData = class ImageData {
      data: Uint8ClampedArray;
      width: number;
      height: number;

      constructor(width: number, height: number);
      constructor(data: Uint8ClampedArray, width: number, height?: number);
      constructor(arg1: number | Uint8ClampedArray, arg2: number, arg3?: number) {
        if (typeof arg1 === 'number') {
          // new ImageData(width, height)
          this.width = arg1;
          this.height = arg2;
          this.data = new Uint8ClampedArray(this.width * this.height * 4);
        } else {
          // new ImageData(data, width, height?)
          this.data = arg1;
          this.width = arg2;
          if (arg3 !== undefined) {
            this.height = arg3;
          } else {
            this.height = this.data.length / (this.width * 4);
          }
        }
      }
    } as any;
  }

  // Path2D polyfill
  if (!global.Path2D) {
    global.Path2D = class Path2D {
      private _path: string[] = [];

      constructor(path?: Path2D | string) {
        if (path instanceof Path2D) {
          this._path = [...path._path];
        } else if (typeof path === 'string') {
          // Simple SVG path parsing (very basic)
          this._path = [path];
        }
      }

      moveTo(x: number, y: number): void {
        this._path.push(`M ${x} ${y}`);
      }

      lineTo(x: number, y: number): void {
        this._path.push(`L ${x} ${y}`);
      }

      bezierCurveTo(
        cp1x: number,
        cp1y: number,
        cp2x: number,
        cp2y: number,
        x: number,
        y: number,
      ): void {
        this._path.push(`C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x} ${y}`);
      }

      quadraticCurveTo(cpx: number, cpy: number, x: number, y: number): void {
        this._path.push(`Q ${cpx} ${cpy}, ${x} ${y}`);
      }

      arc(
        x: number,
        y: number,
        radius: number,
        startAngle: number,
        endAngle: number,
        anticlockwise?: boolean,
      ): void {
        // Simplified arc implementation
        const start = {
          x: x + radius * Math.cos(startAngle),
          y: y + radius * Math.sin(startAngle),
        };
        const end = { x: x + radius * Math.cos(endAngle), y: y + radius * Math.sin(endAngle) };
        const largeArc = Math.abs(endAngle - startAngle) > Math.PI;
        const sweep = !anticlockwise;
        this._path.push(
          `A ${radius} ${radius} 0 ${largeArc ? 1 : 0} ${sweep ? 1 : 0} ${end.x} ${end.y}`,
        );
      }

      closePath(): void {
        this._path.push('Z');
      }

      addPath(path: Path2D): void {
        this._path.push(...path._path);
      }

      rect(x: number, y: number, width: number, height: number): void {
        this.moveTo(x, y);
        this.lineTo(x + width, y);
        this.lineTo(x + width, y + height);
        this.lineTo(x, y + height);
        this.closePath();
      }
    } as any;
  }

  console.log('Canvas polyfills installed: DOMMatrix, ImageData, Path2D');
}

export {};
