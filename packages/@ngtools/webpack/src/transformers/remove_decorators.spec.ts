import { oneLine, stripIndent } from 'common-tags';
import { createTypescriptContext, transformTypescript } from './ast_helpers';
import { removeDecorators } from './remove_decorators';

describe('@ngtools/webpack transformers', () => {
  describe('decorator_remover', () => {
    it('should remove Angular decorators', () => {
      const input = stripIndent`
        import { Component } from '@angular/core';

        @Component({
          selector: 'app-root',
          templateUrl: './app.component.html',
          styleUrls: ['./app.component.css']
        })
        export class AppComponent {
          title = 'app';
        }
      `;
      const output = stripIndent`
        export class AppComponent {
          constructor() {
            this.title = 'app';
          }
        }
      `;

      const { program, compilerHost } = createTypescriptContext(input);
      const transformer = removeDecorators(
        () => true,
        () => program.getTypeChecker(),
      );
      const result = transformTypescript(undefined, [transformer], program, compilerHost);

      expect(oneLine`${result}`).toEqual(oneLine`${output}`);
    });

    it('should not remove non-Angular decorators', () => {
      const input = stripIndent`
        import { Component } from 'another-lib';

        @Component({
          selector: 'app-root',
          templateUrl: './app.component.html',
          styleUrls: ['./app.component.css']
        })
        export class AppComponent {
          title = 'app';
        }
      `;
      const output = `
        import * as tslib_1 from "tslib";
        import { Component } from 'another-lib';
        let AppComponent = class AppComponent {
            constructor() {
                this.title = 'app';
            }
        };
        AppComponent = tslib_1.__decorate([
            Component({
                selector: 'app-root',
                templateUrl: './app.component.html',
                styleUrls: ['./app.component.css']
            })
        ], AppComponent);
        export { AppComponent };
      `;

      const { program, compilerHost } = createTypescriptContext(input);
      const transformer = removeDecorators(
        () => true,
        () => program.getTypeChecker(),
      );
      const result = transformTypescript(undefined, [transformer], program, compilerHost);

      expect(oneLine`${result}`).toEqual(oneLine`${output}`);
    });

    it('should remove imports for identifiers within the decorator', () => {
      const input = stripIndent`
        import { Component } from '@angular/core';
        import { ChangeDetectionStrategy } from '@angular/core';

        @Component({
          selector: 'app-root',
          changeDetection: ChangeDetectionStrategy.OnPush,
          templateUrl: './app.component.html',
          styleUrls: ['./app.component.css']
        })
        export class AppComponent {
          title = 'app';
        }
      `;
      const output = stripIndent`
        export class AppComponent {
          constructor() {
            this.title = 'app';
          }
        }
      `;

      const { program, compilerHost } = createTypescriptContext(input);
      const transformer = removeDecorators(
        () => true,
        () => program.getTypeChecker(),
      );
      const result = transformTypescript(undefined, [transformer], program, compilerHost);

      expect(oneLine`${result}`).toEqual(oneLine`${output}`);
    });

    it('should not remove imports from types that are still used', () => {
      const input = stripIndent`
        import { Component, EventEmitter } from '@angular/core';

        @Component({
          selector: 'app-root',
          changeDetection: ChangeDetectionStrategy.OnPush,
          templateUrl: './app.component.html',
          styleUrls: ['./app.component.css']
        })
        export class AppComponent {
          notify: EventEmitter<string> = new EventEmitter<string>();
          title = 'app';
        }
      `;
      const output = stripIndent`
        import { EventEmitter } from '@angular/core';

        export class AppComponent {
          constructor() {
            this.notify = new EventEmitter();
            this.title = 'app';
          }
        }
      `;

      const { program, compilerHost } = createTypescriptContext(input);
      const transformer = removeDecorators(
        () => true,
        () => program.getTypeChecker(),
      );
      const result = transformTypescript(undefined, [transformer], program, compilerHost);

      expect(oneLine`${result}`).toEqual(oneLine`${output}`);
    });
  });
});
