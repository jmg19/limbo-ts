import { LimboArray } from "./LimboArray";
import { LimboNode } from "./LimboNode";
import { ModelBinderNode } from "./ModelBinderNode";
import { ModelBuilderNode } from "./ModelBuilderNode";

export type LimboNodeParams<T> = {
  model?: T;
  alias?: string;
  LimboNodes?: { [key: string]: LimboNode[] };
};

export class _LimboModel<T> {
  private model: T = {} as T;
  private alias: string = "model";
  private limboNodes: { [key: string]: LimboNode[] } = {};

  constructor(params: LimboNodeParams<T>) {
    if (params.model) {
      this.model = params.model;
    }
    this.alias = params.alias || this.alias;
    this.limboNodes = params.LimboNodes || this.limboNodes;

    for (const key in this.model) {
      Object.defineProperty(this, key, {
        get: function () {
          return this.model[key];
        },
        set: function (value) {
          if (Array.isArray(value)) {
            if (value instanceof LimboArray) {
              this.model[key] = value as T[Extract<keyof T, string>];
              value.setAlias(`${this.alias}.${key}`);
              value.setLimboNodes(this.limboNodes);
              value.bindValues();
            } else {
              this.model[key] = new LimboArray(value, { alias: `${this.alias}.${key}`, LimboNodes: this.limboNodes }) as T[Extract<
                keyof T,
                string
              >];
            }
            return;
          }

          if (typeof value === "object") {
            if (value instanceof _LimboModel) {
              this.model[key] = value as T[Extract<keyof T, string>];
              value.setAlias(`${this.alias}.${key}`);
              value.setLimboNodes(this.limboNodes);
              value.bindValues();
            } else {
              const newModel = new _LimboModel({
                model: value,
                alias: `${this.alias}.${key}`,
                LimboNodes: this.limboNodes,
              });

              newModel.buildValues();

              this.model[key] = newModel as T[Extract<keyof T, string>];
            }

            return;
          }

          if (value instanceof Date) {
            this.model[key] = value as T[Extract<keyof T, string>];
            this.updateLimboNodes(`{{${this.alias}.${key}}}`, value.toString());
            return;
          }

          this.model[key] = value;

          this.updateLimboNodes(
            `{{${this.alias}.${key}}}`,
            this.model[key] as number | boolean | string | ((...params: unknown[]) => string | number | boolean),
          );
        },
      } as PropertyDescriptor & ThisType<_LimboModel<T>>);
    }
  }

  private bindModelProperty(key: Extract<keyof T, string>): ModelBinderNode | null {
    if (this.model[key] instanceof Date) {
      this.updateLimboNodes(`{{${this.alias}.${key}}}`, this.model[key].toString());
      return null;
    }

    if (this.model[key] instanceof _LimboModel) {
      return (this.model[key] as LimboModel<unknown>).getModelBinder();
    }

    if (this.model[key] instanceof LimboArray) {
      return (this.model[key] as LimboArray<unknown>).getModelBinder();
    }

    this.updateLimboNodes(
      `{{${this.alias}.${key}}}`,
      this.model[key] as number | boolean | string | ((...params: unknown[]) => string | number | boolean),
    );

    return null;
  }

  private buildModelProperty(key: Extract<keyof T, string>): ModelBuilderNode | null {
    if (this.model[key] instanceof _LimboModel) {
      return null;
    }

    if (this.model[key] instanceof LimboArray) {
      return null;
    }

    if (typeof this.model[key] === "object" && !(this.model[key] instanceof Date) && !Array.isArray(this.model[key])) {
      const model = new _LimboModel({
        model: this.model[key],
        alias: `${this.alias}.${key}`,
        LimboNodes: this.limboNodes,
      });

      this.model[key] = model as T[Extract<keyof T, string>];
      return model.getModelBuilder();
    } else if (Array.isArray(this.model[key])) {
      const array = new LimboArray(this.model[key], { alias: `${this.alias}.${key}`, LimboNodes: this.limboNodes });
      this.model[key] = array as T[Extract<keyof T, string>];
      return array.getModelBuilder();
    }

    return null;
  }

  parseNestedObjects() {
    for (const key in this.model) {
      if (typeof this.model[key] === "object" && !(this.model[key] instanceof Date) && !Array.isArray(this.model[key])) {
        this.model[key] = new _LimboModel({
          model: this.model[key],
          alias: `${this.alias}.${key}`,
          LimboNodes: this.limboNodes,
        }) as T[Extract<keyof T, string>];
      } else if (typeof this.model[key] === "object" && Array.isArray(this.model[key])) {
        this.model[key] = new LimboArray(this.model[key], { alias: `${this.alias}.${key}`, LimboNodes: this.limboNodes }) as T[Extract<
          keyof T,
          string
        >];
      }
    }
  }

  private bind(): ModelBinderNode | null {
    let modelBinderNode: ModelBinderNode | null = null;
    for (const key in this.model) {
      const node = new ModelBinderNode(() => this.bindModelProperty(key));
      modelBinderNode = ModelBinderNode.linkNode(modelBinderNode, node);
    }

    return modelBinderNode;
  }

  getModelBinder(): ModelBinderNode {
    return new ModelBinderNode(() => this.bind());
  }

  getModelBuilder(): ModelBuilderNode {
    return new ModelBuilderNode(() => this.build());
  }

  buildValues() {
    let builderNode: ModelBuilderNode | null = this.getModelBuilder();

    while (builderNode) {
      builderNode.build();
      builderNode = builderNode.next;
    }
  }

  async bindValues() {
    let binderNode: ModelBinderNode | null = this.getModelBinder();

    while (binderNode) {
      binderNode.bind();
      binderNode = binderNode.next;
    }
  }

  private build(): ModelBuilderNode | null {
    let modelBuilderNode: ModelBuilderNode | null = null;

    for (const key in this.model) {
      const node = new ModelBuilderNode(() => this.buildModelProperty(key));
      modelBuilderNode = ModelBuilderNode.linkNode(modelBuilderNode, node);
    }

    return modelBuilderNode;
  }

  private updateLimboNodes(
    modelReference: string,
    value: number | boolean | string | ((...params: unknown[]) => string | number | boolean) | undefined | null,
  ) {
    if (this.limboNodes[modelReference]) {
      this.limboNodes[modelReference].forEach((limboNode) => {
        if (typeof value === "function") {
          limboNode.value = (value as (...params: unknown[]) => string | number | boolean)();
        } else {
          limboNode.value = value === 0 ? value : value || "";
        }
      });
    }
  }

  setAlias(newAlias: string) {
    this.alias = newAlias;
  }

  setLimboNodes(limboNodes: { [key: string]: LimboNode[] }) {
    this.limboNodes = limboNodes;
    for (const key in this.model) {
      if (this.model[key] instanceof _LimboModel) {
        (this.model[key] as _LimboModel<unknown>).setLimboNodes(limboNodes);
      } else if (this.model[key] instanceof LimboArray) {
        (this.model[key] as LimboArray<unknown>).setLimboNodes(limboNodes);
      }
    }
  }

  addChildLimboNodes(limboNodes: { [key: string]: LimboNode[] }) {
    for (const key in limboNodes) {
      const realKey = key.replace("model", this.alias);
      if (!this.limboNodes[realKey]) {
        this.limboNodes[realKey] = [];
      }

      limboNodes[key].forEach((limboNode) => {
        limboNode.setRootReference(this.alias);
        this.limboNodes[realKey].push(limboNode);
      });
    }
  }

  getValueByKey(key: string): unknown {
    return this.model[key as keyof T];
  }

  getModelReference(): string {
    return this.alias;
  }

  getByModelReference(modelReference: string): unknown {
    modelReference = modelReference.replace("{{", "").replace("}}", "");
    const references = modelReference.split(".");
    references.shift();
    let value = null;
    while (references.length > 0) {
      const reference = references.shift();
      const regexIt = reference!.matchAll(/\w+\[(\d+)\]/g);
      const matches = [...regexIt];

      if (matches.length > 0) {
        const arrayReference = matches[0][1];
        const indexReference = parseInt(matches[0][2]);
        if (value === null) {
          for (const key in this.model) {
            if (key === arrayReference) {
              value = (this.model[key] as LimboArray<unknown>)[indexReference];
            }
          }
        } else {
          if (value instanceof _LimboModel) {
            for (const key in value) {
              if (key === arrayReference) {
                value = ((value as _LimboModel<unknown>).getValueByKey(key) as LimboArray<unknown>)[indexReference];
              }
            }
          }
        }
      } else {
        if (value === null) {
          for (const key in this.model) {
            if (key === reference) {
              value = this.model[key];
            }
          }
        } else {
          if (value instanceof _LimboModel) {
            for (const key in value) {
              if (key === reference) {
                value = (value as _LimboModel<unknown>).getValueByKey(key);
              }
            }
          }
        }
      }
    }

    return value;
  }
}

export type LimboModel<T> = _LimboModel<T> & T;
