import { _LimboModel, LimboModel } from "./LimboModel";
import { LimboNode } from "./LimboNode";
import { ModelBinderNode } from "./ModelBinderNode";
import { ModelBuilderNode } from "./ModelBuilderNode";

type LimboArrayOptions = {
  alias?: string;
  LimboNodes?: { [key: string]: LimboNode[] };
};

export class LimboArray<T> implements Array<T> {
  private array: T[] = [];
  private lastIndex: number = -1;
  private alias: string = "model";
  private limboNodes: { [key: string]: LimboNode[] };

  constructor(items: T[] = [], options: LimboArrayOptions = {}) {
    this.alias = options.alias || this.alias;
    this.limboNodes = options.LimboNodes || {};
    if (items.length > 0) {
      this.array.push(...items);
      this.bindIndexes();
    }
  }

  private redefineAlias(startIndex: number = 0) {
    this.array.forEach((item, index) => {
      if (item instanceof _LimboModel) {
        (item as _LimboModel<T>).setAlias(`${this.alias}[${startIndex + index}]`);
      }

      if (item instanceof LimboArray) {
        (item as LimboArray<unknown>).setAlias(`${this.alias}[${startIndex + index}]`);
      }
    });
  }

  private bindItem(index: number): ModelBinderNode | null {
    if (this.array[index] instanceof _LimboModel) {
      return (this.array[index] as _LimboModel<T>).getModelBinder();
    } else if (this.array[index] instanceof LimboArray) {
      return (this.array[index] as LimboArray<unknown>).getModelBinder();
    } else if (this.array[index] instanceof Date) {
      this.updateLimboNodes(`{{${this.alias}[${index}]}}`, (this.array[index] as Date).toISOString());
    } else {
      this.updateLimboNodes(
        `{{${this.alias}[${index}]}}`,
        this.array[index] as number | boolean | string | ((...params: unknown[]) => string | number | boolean),
      );
    }

    return null;
  }

  private buildItem(index: number): ModelBuilderNode | null {
    if (typeof this.array[index] === "object" && !(this.array[index] instanceof Date)) {
      if (Array.isArray(this.array[index])) {
        const limboArray = new LimboArray<unknown>(this.array[index] as unknown[], {
          alias: `${this.alias}[${index}]`,
          LimboNodes: this.limboNodes,
        });
        this.array[index] = limboArray as T;
        return limboArray.getModelBuilder();
      } else {
        const model = new _LimboModel({
          model: this.array[index] as Required<unknown>,
          alias: `${this.alias}[${index}]`,
          LimboNodes: this.limboNodes,
        });

        return model.getModelBuilder();
      }
    }

    return null;
  }

  private bind(): ModelBinderNode | null {
    let modelBinderNode: ModelBinderNode | null = null;
    for (let index = 0; index < this.array.length; index++) {
      const node = new ModelBinderNode(() => this.bindItem(index));
      modelBinderNode = ModelBinderNode.linkNode(modelBinderNode, node);
    }

    return modelBinderNode;
  }

  private build(): ModelBuilderNode | null {
    let modelBuilderNode: ModelBuilderNode | null = null;

    for (let i = 0; i < this.array.length; i++) {
      const node = new ModelBuilderNode(() => this.buildItem(i));
      modelBuilderNode = ModelBuilderNode.linkNode(modelBuilderNode, node);
    }

    return modelBuilderNode;
  }

  setAlias(alias: string) {
    this.alias = alias;
    this.redefineAlias();
  }

  private parseToLimbo<S>(value: S, index: number): S | LimboModel<S> | LimboArray<S> {
    if (value instanceof _LimboModel) {
      (value as _LimboModel<S>).setAlias(`${this.alias}[${index}]`);
      (value as _LimboModel<S>).setLimboNodes(this.limboNodes);
      return value;
    }

    if (value instanceof LimboArray) {
      (value as LimboArray<S>).setAlias(`${this.alias}[${index}]`);
      (value as LimboArray<S>).setLimboNodes(this.limboNodes);
      return value;
    }

    if (typeof value === "object" && !(value instanceof Date)) {
      if (Array.isArray(value)) {
        return new LimboArray(value, { alias: `${this.alias}[${index}]`, LimboNodes: this.limboNodes });
      } else {
        const model = new _LimboModel<S>({
          model: value as Required<S>,
          alias: `${this.alias}[${index}]`,
          LimboNodes: this.limboNodes,
        });

        let builderNode: ModelBuilderNode | null = model.getModelBuilder();
        while (builderNode) {
          builderNode.build();
          builderNode = builderNode.next;
        }

        let binderNode: ModelBinderNode | null = model.getModelBinder();
        while (binderNode) {
          binderNode.bind();
          binderNode = binderNode.next;
        }

        return model as LimboModel<S>;
      }
    } else {
      return value;
    }
  }

  private updateLimboNodes(
    modelReference: string,
    value: number | boolean | string | ((...params: unknown[]) => string | number | boolean),
  ) {
    if (this.limboNodes[modelReference]) {
      this.limboNodes[modelReference].forEach((limboNode) => {
        if (typeof value === "function") {
          limboNode.value = (value as (...params: unknown[]) => string | number | boolean)();
        } else {
          limboNode.value = value;
        }
      });
    }
  }

  private bindIndexes() {
    this.array.forEach((_, index) => {
      if (index > this.lastIndex) {
        Object.defineProperty(this, index, {
          get: function () {
            return this.array[index];
          },
          set: function (value) {
            this.array[index] = this.parseToLimbo(value, index);

            if (this.array[index] instanceof Date) {
              this.updateLimboNodes(`{{${this.alias}[${index}]}}`, (this.array[index] as Date).toISOString());
            }

            if (typeof this.array[index] !== "object" && !Array.isArray(this.array[index])) {
              this.updateLimboNodes(
                `{{${this.alias}[${index}]}}`,
                this.array[index] as number | boolean | string | ((...params: unknown[]) => string | number | boolean),
              );
            }
          },
        } as PropertyDescriptor & ThisType<LimboArray<T>>);

        this.lastIndex = index;
      }
    });
  }

  private setLimboArray(array: T[]) {
    this.array = array;
    this.bindIndexes();
  }

  getModelBinder(): ModelBinderNode {
    return new ModelBinderNode(() => this.bind());
  }

  getModelBuilder(): ModelBuilderNode {
    return new ModelBuilderNode(() => this.build());
  }

  [n: number]: T;

  [Symbol.iterator](): IterableIterator<T> {
    return this.array[Symbol.iterator]();
  }

  [Symbol.unscopables]: {
    [x: number]: boolean | undefined;
    length?: boolean | undefined;
    toString?: boolean | undefined;
    toLocaleString?: boolean | undefined;
    pop?: boolean | undefined;
    push?: boolean | undefined;
    concat?: boolean | undefined;
    join?: boolean | undefined;
    reverse?: boolean | undefined;
    shift?: boolean | undefined;
    slice?: boolean | undefined;
    sort?: boolean | undefined;
    splice?: boolean | undefined;
    unshift?: boolean | undefined;
    indexOf?: boolean | undefined;
    lastIndexOf?: boolean | undefined;
    every?: boolean | undefined;
    some?: boolean | undefined;
    forEach?: boolean | undefined;
    map?: boolean | undefined;
    filter?: boolean | undefined;
    reduce?: boolean | undefined;
    reduceRight?: boolean | undefined;
    find?: boolean | undefined;
    findIndex?: boolean | undefined;
    fill?: boolean | undefined;
    copyWithin?: boolean | undefined;
    entries?: boolean | undefined;
    keys?: boolean | undefined;
    values?: boolean | undefined;
    includes?: boolean | undefined;
    flatMap?: boolean | undefined;
    flat?: boolean | undefined;
    [Symbol.iterator]?: boolean | undefined;
    readonly [Symbol.unscopables]?: boolean | undefined;
  } = {
    ...Array.prototype[Symbol.unscopables],
    flatMap: false,
    flat: false,
  };

  get length(): number {
    return this.array.length;
  }

  setLimboNodes(limboNodes: { [key: string]: LimboNode[] }) {
    this.array.forEach((item) => {
      if (item instanceof _LimboModel) {
        (item as _LimboModel<T>).setLimboNodes(limboNodes);
      } else if (item instanceof LimboArray) {
        (item as LimboArray<unknown>).setLimboNodes(limboNodes);
      }
    });
  }

  toString(): string {
    return this.array.toString();
  }

  toLocaleString(): string;
  toLocaleString(locales: string | string[], options?: Intl.NumberFormatOptions & Intl.DateTimeFormatOptions): string;
  toLocaleString(locales?: string | string[], options?: Intl.NumberFormatOptions & Intl.DateTimeFormatOptions): string {
    if (locales) {
      return this.array.toLocaleString(locales, options);
    }
    return this.array.toLocaleString();
  }

  pop(): T | undefined {
    return this.array.pop();
  }

  push(...items: T[]): number {
    const limboParsedItems = items.map((item, index) => this.parseToLimbo(item, this.length + index));
    const result = this.array.push(...(limboParsedItems as T[]));
    this.bindIndexes();
    return result;
  }

  concat(...items: ConcatArray<T>[]): T[];
  concat(...items: (T | ConcatArray<T>)[]): T[] {
    const limboParsedItems = items.map((item, index) => this.parseToLimbo(item, this.length + index));
    this.array = this.array.concat(...(limboParsedItems as T[]));
    this.bindIndexes();
    return this;
  }

  join(separator?: string): string {
    return this.array.join(separator);
  }

  reverse(): T[] {
    this.array.reverse();
    this.redefineAlias();

    return this;
  }

  shift(): T | undefined {
    const result = this.array.shift();
    this.redefineAlias();
    return result;
  }

  slice(start?: number, end?: number): T[] {
    const slice = this.array.slice(start, end);
    const slicedLimboArray = new LimboArray<T>([], { alias: this.alias, LimboNodes: this.limboNodes });
    slicedLimboArray.setLimboArray(slice);
    return slicedLimboArray;
  }

  sort(compareFn?: ((a: T, b: T) => number) | undefined): this {
    this.array.sort(compareFn);
    this.redefineAlias();
    return this;
  }

  splice(start: number, deleteCount?: number): T[];
  splice(start: number, deleteCount: number, ...items: T[]): T[];
  splice(start: number, deleteCount?: number, ...items: T[]): T[] {
    const limboParsedItems = items.map((item, index) => this.parseToLimbo(item, start + index));
    this.array.splice(start as number, deleteCount as number, ...(limboParsedItems as T[]));
    this.bindIndexes();
    return this;
  }

  unshift(...items: T[]): number {
    const limboParsedItems = items.map((item, index) => this.parseToLimbo(item, index));
    this.redefineAlias(limboParsedItems.length);
    const result = this.array.unshift(...(limboParsedItems as T[]));
    this.bindIndexes();
    return result;
  }

  indexOf(searchElement: T, fromIndex?: number): number {
    return this.array.indexOf(searchElement, fromIndex);
  }

  lastIndexOf(searchElement: T, fromIndex?: number): number {
    return this.array.lastIndexOf(searchElement, fromIndex);
  }

  every<S extends T>(predicate: (value: T, index: number, array: T[]) => value is S, thisArg?: unknown): this is S[];
  every(predicate: (value: T, index: number, array: T[]) => unknown, thisArg?: unknown): boolean {
    return this.array.every(predicate, thisArg);
  }

  some(predicate: (value: T, index: number, array: T[]) => unknown, thisArg?: unknown): boolean {
    return this.array.some(predicate, thisArg);
  }

  forEach(callbackfn: (value: T, index: number, array: T[]) => void, thisArg?: unknown): void {
    return this.array.forEach(callbackfn, thisArg);
  }

  map<U>(callbackfn: (value: T, index: number, array: T[]) => U, thisArg?: unknown): U[] {
    return this.array.map(callbackfn, thisArg);
  }

  filter<S extends T>(predicate: (value: T, index: number, array: T[]) => value is S, thisArg?: unknown): S[];
  filter(predicate: (value: T, index: number, array: T[]) => unknown, thisArg?: unknown): T[] {
    return this.array.filter(predicate, thisArg);
  }

  reduce(callbackfn: (previousValue: T, currentValue: T, currentIndex: number, array: T[]) => T): T;
  reduce(callbackfn: (previousValue: T, currentValue: T, currentIndex: number, array: T[]) => T, initialValue: T): T;
  reduce<U>(callbackfn: (previousValue: U, currentValue: T, currentIndex: number, array: T[]) => U, initialValue: U): U;
  reduce<U>(callbackfn: (previousValue: T | U, currentValue: T, currentIndex: number, array: T[]) => T | U, initialValue?: T | U): T | U {
    if (!initialValue) {
      return this.array.reduce(callbackfn as (previousValue: T, currentValue: T, currentIndex: number, array: T[]) => T);
    }
    return this.array.reduce(callbackfn, initialValue);
  }

  reduceRight(callbackfn: (previousValue: T, currentValue: T, currentIndex: number, array: T[]) => T): T;
  reduceRight(callbackfn: (previousValue: T, currentValue: T, currentIndex: number, array: T[]) => T, initialValue: T): T;
  reduceRight<U>(callbackfn: (previousValue: U, currentValue: T, currentIndex: number, array: T[]) => U, initialValue: U): U;
  reduceRight<U>(
    callbackfn: (previousValue: T | U, currentValue: T, currentIndex: number, array: T[]) => T | U,
    initialValue?: T | U,
  ): T | U {
    if (!initialValue) {
      return this.array.reduceRight(callbackfn as (previousValue: T, currentValue: T, currentIndex: number, array: T[]) => T);
    }
    return this.array.reduceRight(callbackfn, initialValue);
  }

  find<S extends T>(predicate: (value: T, index: number, obj: T[]) => value is S, thisArg?: unknown): S | undefined;
  find(predicate: (value: T, index: number, obj: T[]) => unknown, thisArg?: unknown): T | undefined {
    return this.array.find(predicate as (value: T, index: number, obj: T[]) => unknown, thisArg);
  }

  findIndex(predicate: (value: T, index: number, obj: T[]) => unknown, thisArg?: unknown): number {
    return this.array.findIndex(predicate, thisArg);
  }

  fill(value: T, start?: number, end?: number): this {
    const limboValue = this.parseToLimbo(value, 0);
    this.array.fill(limboValue as T, start, end);
    this.redefineAlias();
    return this;
  }

  copyWithin(target: number, start: number, end?: number): this {
    this.array.copyWithin(target, start, end);
    this.redefineAlias();
    return this;
  }

  entries(): IterableIterator<[number, T]> {
    return this.array.entries();
  }

  keys(): IterableIterator<number> {
    return this.array.keys();
  }

  values(): IterableIterator<T> {
    return this.array.values();
  }

  includes(searchElement: T, fromIndex?: number): boolean {
    return this.array.includes(searchElement, fromIndex);
  }

  flatMap<U, This = undefined>(
    callback: (this: This, value: T, index: number, array: T[]) => U | readonly U[],
    thisArg?: This | undefined,
  ): U[] {
    return this.array.flatMap(callback, thisArg);
  }

  flat<A, D extends number = 1>(this: A, depth?: D): FlatArray<A, D>[] {
    const thisArray = (this as LimboArray<T>).array;
    return thisArray.flat(depth) as FlatArray<A, D>[];
  }
}
