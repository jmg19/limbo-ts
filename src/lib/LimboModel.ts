import { LimboArray } from "./LimboArray";
import { LimboNode } from "./LimboNode";
import { ModelBinderNode } from "./ModelBinderNode";
import { ModelBuilderNode } from "./ModelBuilderNode";

type LimboNodeParams<T> = {
  model: Required<T>;
  alias?: string;
  LimboNodes?: { [key: string]: LimboNode[] };
};

export class _LimboModel<T> {
  private model: Required<T> = {} as Required<T>;
  private alias: string = "model";
  private limboNodes: { [key: string]: LimboNode[] } = {};

  constructor(params: LimboNodeParams<T>) {
    this.model = params.model;
    this.alias = params.alias || this.alias;
    this.limboNodes = params.LimboNodes || this.limboNodes;

    for (const key in this.model) {
      Object.defineProperty(this, key, {
        get: function () {
          return this.model[key];
        },
        set: function (value) {
          if (typeof this.model[key] === "object" && !(this.model[key] instanceof Date) && !Array.isArray(this.model[key])) {
            throw new Error(`Only Dates or primitive types are allowed to be set`);
          }

          if (typeof value !== typeof this.model[key]) {
            if (this.model[key] instanceof Date) {
              throw new Error(`Value '${value}' is expected to be a Date`);
            }

            throw new Error(`Value '${value}' is expected to be a ${typeof this.model[key]}`);
          }

          if (Array.isArray(value)) {
            this.model[key] = new LimboArray(...value) as T[Extract<keyof T, string>];
          } else {
            this.model[key] = value;
          }

          if (this.model[key] instanceof Date) {
            this.updateLimboNodes(`{{${this.alias}.${key}}}`, this.model[key].toString());
          }

          if (!Array.isArray(this.model[key])) {
            this.updateLimboNodes(
              `{{${this.alias}.${key}}}`,
              this.model[key] as number | boolean | string | ((...params: unknown[]) => string | number | boolean),
            );
          }
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
        model: this.model[key] as Required<T[Extract<keyof T, string>]>,
        alias: `${this.alias}.${key}`,
        LimboNodes: this.limboNodes,
      });

      this.model[key] = model as T[Extract<keyof T, string>];
      return model.getModelBuilder();
    } else if (Array.isArray(this.model[key])) {
      const array = new LimboArray(...this.model[key]);
      this.model[key] = array as T[Extract<keyof T, string>];
      return array.getModelBuilder();
    }

    return null;
  }

  parseNestedObjects() {
    for (const key in this.model) {
      if (typeof this.model[key] === "object" && !(this.model[key] instanceof Date) && !Array.isArray(this.model[key])) {
        this.model[key] = new _LimboModel({
          model: this.model[key] as Required<T[Extract<keyof T, string>]>,
          alias: `${this.alias}.${key}`,
          LimboNodes: this.limboNodes,
        }) as T[Extract<keyof T, string>];
      } else if (typeof this.model[key] === "object" && Array.isArray(this.model[key])) {
        this.model[key] = new LimboArray(...this.model[key]) as T[Extract<keyof T, string>];
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

type CreateAndBindResponse<T> = {
  model: LimboModel<T>;
  toBuild: boolean;
};

export const LimboModelFactory = {
  createAndBind: <T>(data: LimboNodeParams<T>): CreateAndBindResponse<T> => {
    if (data.model instanceof _LimboModel) {
      if (data.alias) {
        data.model.setAlias(data.alias);
      }

      if (data.LimboNodes) {
        data.model.addChildLimboNodes(data.LimboNodes);
      }

      return {
        model: data.model as LimboModel<T>,
        toBuild: false,
      };
    }
    return { model: new _LimboModel(data) as LimboModel<T>, toBuild: true };
  },
};
