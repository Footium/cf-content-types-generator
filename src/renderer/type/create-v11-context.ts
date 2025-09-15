import { ContentTypeFieldType } from 'contentful';
import { moduleFieldsName, moduleName, moduleSkeletonName } from '../../module-name';
import { defaultRenderers, FieldRenderer } from '../field';
import { RenderContext } from './create-default-context';

export const createV11Context = (): RenderContext => {
  return {
    moduleName,
    moduleFieldsName,
    moduleSkeletonName,
    moduleReferenceName: moduleFieldsName,
    getFieldRenderer: <FType extends ContentTypeFieldType>(fieldType: FType) =>
      defaultRenderers[fieldType] as FieldRenderer<FType>,
    imports: new Set(),
  };
};
