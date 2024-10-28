import { _LimboModel, LimboModel, LimboNodeParams } from "./LimboModel";

type CreateAndBindResponse<T> = {
  model: LimboModel<T>;
  toBuild: boolean;
};

export const LimboModelFactory = {
  create: <T>(data: LimboNodeParams<T>): CreateAndBindResponse<T> => {
    if (data.model instanceof _LimboModel) {
      if (data.modelReference) {
        data.model.setModelReference(data.modelReference);
      }

      return {
        model: data.model as LimboModel<T>,
        toBuild: false,
      };
    }
    return { model: new _LimboModel(data) as LimboModel<T>, toBuild: true };
  },
};
