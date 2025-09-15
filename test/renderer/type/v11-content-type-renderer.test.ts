import { ContentTypeField } from 'contentful';

import { Project, ScriptTarget, SourceFile } from 'ts-morph';
import {
  CFContentType,
  V11ContentTypeRenderer,
  RenderContext,
  renderTypeGeneric,
} from '../../../src';
import stripIndent = require('strip-indent');

describe('The v11 content type renderer', () => {
  let project: Project;
  let testFile: SourceFile;

  beforeEach(() => {
    project = new Project({
      useInMemoryFileSystem: true,
      compilerOptions: {
        target: ScriptTarget.ES5,
        declaration: true,
      },
    });
    testFile = project.createSourceFile('test.ts');
  });

  it('adds import for entry type', () => {
    const renderer = new V11ContentTypeRenderer();

    const contentType: CFContentType = {
      name: 'unused-name',
      sys: {
        id: 'test',
        type: 'Symbol',
      },
      fields: [
        {
          id: 'linkFieldId',
          name: 'Linked entry Field',
          type: 'Link',
          localized: false,
          required: true,
          validations: [
            {
              linkContentType: ['linkedType'],
            },
          ],
          disabled: false,
          omitted: false,
          linkType: 'Entry',
        },
      ],
    };

    renderer.render(contentType, testFile);

    expect('\n' + testFile.getFullText()).toEqual(
      stripIndent(`
        import type { Entry } from "contentful";
        import type { TypeLinkedTypeSkeleton } from "./TypeLinkedType";
        
        export interface TypeTestFields {
            linkFieldId: Entry<TypeLinkedTypeSkeleton>;
        }
        
        export interface TypeTestSkeleton {
            fields: TypeTestFields;
            contentTypeId: string;
        }
        
        export type TypeTest = Entry<TypeTestSkeleton>;
        `),
    );
  });

  it('can return a custom field type renderer', () => {
    class DerivedContentTypeRenderer extends V11ContentTypeRenderer {
      protected renderField(field: ContentTypeField, _context: RenderContext) {
        return {
          name: field.id,
          hasQuestionToken: field.omitted || !field.required,
          type: 'Test.Symbol',
        };
      }
    }

    const renderer = new DerivedContentTypeRenderer();

    const contentType: CFContentType = {
      name: 'unused-name',
      sys: {
        id: 'test',
        type: 'Symbol',
      },
      fields: [
        {
          id: 'field_id',
          name: 'field_name',
          disabled: false,
          localized: false,
          required: true,
          type: 'Symbol',
          omitted: false,
          validations: [],
        },
      ],
    };

    renderer.render(contentType, testFile);

    expect('\n' + testFile.getFullText()).toEqual(
      stripIndent(`
        import type { Entry } from "contentful";
        
        export interface TypeTestFields {
            field_id: Test.Symbol;
        }
        
        export interface TypeTestSkeleton {
            fields: TypeTestFields;
            contentTypeId: string;
        }
        
        export type TypeTest = Entry<TypeTestSkeleton>;
        `),
    );
  });

  it('can return a custom field renderer with basic types', () => {
    class DerivedContentTypeRenderer extends V11ContentTypeRenderer {
      protected renderField(field: ContentTypeField, context: RenderContext) {
        // Add the EntryFields import manually since we're using a custom type
        context.imports.add({
          moduleSpecifier: 'contentful',
          namedImports: ['EntryFields'],
          isTypeOnly: true,
        });

        return {
          name: field.id,
          hasQuestionToken: field.omitted || !field.required,
          type: 'EntryFields.Symbol',
        };
      }
    }

    const renderer = new DerivedContentTypeRenderer();

    const contentType: CFContentType = {
      name: 'display name',
      sys: {
        id: 'test',
        type: 'Symbol',
      },
      fields: [
        {
          id: 'field_id',
          name: 'field_name',
          disabled: false,
          localized: false,
          required: true,
          type: 'Symbol',
          omitted: false,
          validations: [],
        },
      ],
    };

    renderer.render(contentType, testFile);

    expect('\n' + testFile.getFullText()).toEqual(
      stripIndent(`
        import type { Entry, EntryFields } from "contentful";
        
        export interface TypeTestFields {
            field_id: EntryFields.Symbol;
        }
        
        export interface TypeTestSkeleton {
            fields: TypeTestFields;
            contentTypeId: string;
        }
        
        export type TypeTest = Entry<TypeTestSkeleton>;
        `),
    );
  });

  it('can render custom entries', () => {
    class DerivedContentTypeRenderer extends V11ContentTypeRenderer {
      protected renderEntryType(contentType: CFContentType, context: RenderContext): string {
        context.imports.add({
          moduleSpecifier: '@custom',
          namedImports: ['IdScopedEntry'],
          isTypeOnly: true,
        });

        return renderTypeGeneric(
          'IdScopedEntry',
          `'${contentType.sys.id}'`,
          context.moduleSkeletonName(contentType.sys.id),
        );
      }
    }

    const renderer = new DerivedContentTypeRenderer();

    const contentType: CFContentType = {
      name: 'unused-name',
      sys: {
        id: 'test',
        type: 'Symbol',
      },
      fields: [
        {
          id: 'field_id',
          name: 'field_name',
          disabled: false,
          localized: false,
          required: true,
          type: 'Symbol',
          omitted: false,
          validations: [],
        },
      ],
    };

    renderer.render(contentType, testFile);

    expect('\n' + testFile.getFullText()).toEqual(
      stripIndent(`
        import type { IdScopedEntry } from "@custom";
        import type { EntryFields } from "contentful";
        
        export interface TypeTestFields {
            field_id: EntryFields.Symbol;
        }
        
        export interface TypeTestSkeleton {
            fields: TypeTestFields;
            contentTypeId: string;
        }
        
        export type TypeTest = IdScopedEntry<'test', TypeTestSkeleton>;
        `),
    );
  });
});
