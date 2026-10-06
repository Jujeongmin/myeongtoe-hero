// A non-negative number of any size: m × 10^e with 1 ≤ m < 10, or zero. Idle numbers outgrow a
// double (1e308) within a few thousand floors. Immutable; every operation returns a new Big.
// Never negative: subtracting more than there is throws, which is how "not enough gold" stays
// impossible to bypass.
const PRECISION_DIGITS = 17;
const STRING_FORM = /^(\d+(?:\.\d+)?)e(-?\d+)$/;

export class Big {
  static readonly ZERO = new Big(0, 0);

  private constructor(readonly m: number, readonly e: number) {}

  static of(m: number, e = 0): Big {
    if (!Number.isFinite(m) || m < 0 || !Number.isFinite(e)) throw new RangeError(`bad Big ${m}e${e}`);
    if (m === 0) return Big.ZERO;
    const k = Math.floor(Math.log10(m));
    let mm = m / 10 ** k;
    let ee = e + k;
    if (mm >= 10) {
      mm /= 10;
      ee += 1;
    } else if (mm < 1) {
      mm *= 10;
      ee -= 1;
    }
    return new Big(mm, ee);
  }

  static from(v: number | string | Big): Big {
    if (v instanceof Big) return v;
    if (typeof v === "number") return Big.of(v);
    const match = STRING_FORM.exec(v);
    if (match) return Big.of(Number(match[1]), Number(match[2]));
    return Big.of(Number(v));
  }

  static fromLog10(l: number): Big {
    if (l === Number.NEGATIVE_INFINITY) return Big.ZERO;
    if (!Number.isFinite(l)) throw new RangeError(`bad log10 ${l}`);
    const e = Math.floor(l);
    return Big.of(10 ** (l - e), e);
  }

  static pow(base: number, exp: number): Big {
    if (!(base > 0)) throw new RangeError(`bad base ${base}`);
    return Big.fromLog10(exp * Math.log10(base));
  }

  isZero(): boolean {
    return this.m === 0;
  }

  log10(): number {
    return this.m === 0 ? Number.NEGATIVE_INFINITY : Math.log10(this.m) + this.e;
  }

  add(o: Big): Big {
    if (o.isZero()) return this;
    if (this.isZero()) return o;
    if (this.e < o.e) return o.add(this);
    const diff = this.e - o.e;
    if (diff > PRECISION_DIGITS) return this;
    return Big.of(this.m + o.m / 10 ** diff, this.e);
  }

  sub(o: Big): Big {
    if (this.cmp(o) < 0) throw new RangeError("Big would go negative");
    if (o.isZero()) return this;
    const diff = this.e - o.e;
    if (diff > PRECISION_DIGITS) return this;
    return Big.of(Math.max(0, this.m - o.m / 10 ** diff), this.e);
  }

  mul(o: Big): Big {
    if (this.isZero() || o.isZero()) return Big.ZERO;
    return Big.of(this.m * o.m, this.e + o.e);
  }

  mulN(n: number): Big {
    return this.mul(Big.of(n));
  }

  div(o: Big): Big {
    if (o.isZero()) throw new RangeError("Big division by zero");
    if (this.isZero()) return Big.ZERO;
    return Big.of(this.m / o.m, this.e - o.e);
  }

  cmp(o: Big): -1 | 0 | 1 {
    if (this.isZero()) return o.isZero() ? 0 : -1;
    if (o.isZero()) return 1;
    if (this.e !== o.e) return this.e > o.e ? 1 : -1;
    if (this.m === o.m) return 0;
    return this.m > o.m ? 1 : -1;
  }

  gte(o: Big): boolean {
    return this.cmp(o) >= 0;
  }

  lt(o: Big): boolean {
    return this.cmp(o) < 0;
  }

  // Infinity past a double's range, 0 below it.
  toNumber(): number {
    return this.m * 10 ** this.e;
  }

  toString(): string {
    return `${this.m}e${this.e}`;
  }

  toJSON(): string {
    return this.toString();
  }
}
