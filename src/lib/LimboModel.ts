import Limbo from "./Limbo";
import { LimboArray } from "./LimboArray";
import { ModelBinderNode } from "./ModelBinderNode";
import { ModelBuilderNode } from "./ModelBuilderNode";

export type LimboNodeParams<T> = {
  model?: T;
  alias?: string;
};

export class _LimboModel<T> {
  private model: T = {} as T;
  private alias: string = "model";

  constructor(params: LimboNodeParams<T>) {
    if (params.model) {
      this.model = params.model;
    }
    this.alias = params.alias || this.alias;

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
              value.bindValues();
            } else {
              const limboArray = new LimboArray(value, {
                alias: `${this.alias}.${key}`,
              });

              limboArray.buildValues();
              Limbo.attachArrayToLoops(limboArray);

              this.model[key] = limboArray as T[Extract<keyof T, string>];
            }
            return;
          }

          if (typeof value === "object" && value !== null) {
            if (value instanceof _LimboModel) {
              this.model[key] = value as T[Extract<keyof T, string>];
              value.setAlias(`${this.alias}.${key}`);
              value.bindValues();
            } else {
              const newModel = new _LimboModel({
                model: value,
                alias: `${this.alias}.${key}`,
              });

              newModel.buildValues();
              Limbo.attachModelToComponents(newModel);
              Limbo.attachParentModelToConditions(newModel);
              Limbo.attachParentModelToSwitches(newModel);
              newModel.bindValues();

              this.model[key] = newModel as T[Extract<keyof T, string>];
            }

            return;
          }

          if (value instanceof Date) {
            this.model[key] = value as T[Extract<keyof T, string>];
            Limbo.updateLimboNodes(`{{${this.alias}.${key}}}`, value.toString());
            return;
          }

          this.model[key] = value;

          Limbo.updateLimboNodes(
            `{{${this.alias}.${key}}}`,
            this.model[key] as number | boolean | string | ((...params: unknown[]) => string | number | boolean),
          );

          Limbo.refreshConditions(`${this.alias}.${key}`, value);
          Limbo.refreshSwitches(`${this.alias}.${key}`, value);
        },
      } as PropertyDescriptor & ThisType<_LimboModel<T>>);
    }
  }

  private bindModelProperty(key: Extract<keyof T, string>): ModelBinderNode | null {
    if (this.model[key] instanceof Date) {
      Limbo.updateLimboNodes(`{{${this.alias}.${key}}}`, this.model[key].toString());
      return null;
    }

    if (this.model[key] instanceof _LimboModel) {
      return (this.model[key] as LimboModel<unknown>).getModelBinder();
    }

    if (this.model[key] instanceof LimboArray) {
      return (this.model[key] as LimboArray<unknown>).getModelBinder();
    }

    Limbo.updateLimboNodes(
      `{{${this.alias}.${key}}}`,
      this.model[key] as number | boolean | string | ((...params: unknown[]) => string | number | boolean),
    );

    if (typeof this.model[key] === "boolean") {
      Limbo.refreshConditions(`${this.alias}.${key}`, this.model[key] as boolean);
    }

    if (typeof this.model[key] === "number" || typeof this.model[key] === "string") {
      Limbo.refreshSwitches(`${this.alias}.${key}`, this.model[key] as number | string);
    }

    return null;
  }

  private buildModelProperty(key: Extract<keyof T, string>): ModelBuilderNode | null {
    if (!this.model[key]) {
      return null;
    }

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
      });

      Limbo.pushPendingLogic(() => {
        Limbo.attachModelToComponents(model);
        Limbo.attachParentModelToConditions(model);
        Limbo.attachParentModelToSwitches(model);
      });

      this.model[key] = model as T[Extract<keyof T, string>];
      return model.getModelBuilder();
    } else if (Array.isArray(this.model[key])) {
      const array = new LimboArray(this.model[key], { alias: `${this.alias}.${key}` });

      Limbo.pushPendingLogic(() => {
        Limbo.attachArrayToLoops(array);
      });

      this.model[key] = array as T[Extract<keyof T, string>];
      return array.getModelBuilder();
    }

    return null;
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

    Limbo.runPendingLogic();
  }

  bindValues() {
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

  setAlias(newAlias: string) {
    this.alias = newAlias;
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

    if (references.length === 1) {
      if (this.alias.startsWith(references[0])) {
        return this;
      } else {
        return null;
      }
    }

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

  toObject(): T {
    const object: T = {} as T;
    for (const key in this.model) {
      if (typeof this.model[key] !== "function" && key !== "model" && key !== "alias") {
        if (this.model[key] instanceof _LimboModel) {
          object[key] = (this.model[key] as _LimboModel<unknown>).toObject() as T[Extract<keyof T, string>];
        } else if (this.model[key] instanceof LimboArray) {
          object[key] = (this.model[key] as LimboArray<unknown>).toArray() as T[Extract<keyof T, string>];
        } else {
          object[key] = this.model[key];
        }
      }
    }
    return object;
  }
}

export type LimboModel<T> = _LimboModel<T> & T;
