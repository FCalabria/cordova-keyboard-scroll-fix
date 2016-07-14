/// <reference path="typings/globals/angular/index.d.ts" />
/// <reference path="typings/globals/jquery/index.d.ts" />

module moduleName {
  'use strict';

  interface ICordovaKeyboardEvent extends Event {
    keyboardHeight: number;
  }

  /**
   * Disables cordova ionic keyboard auto scroll (push the view upwards and go to the focused element)
   * and emulates this behavior it with javascript (shrinks the element instead of "pushing")
   */
  export function CordovaKeyboardScrollFix($timeout: ng.ITimeoutService, $log: ng.ILogService): ng.IDirective {
    return {
      restrict: 'A',
      link: ($scope: ng.IScope, element: JQuery) => {
        const originalHeight = element.height();
        // Disable cordova keyboard scroll.
        cordova.plugins.Keyboard.disableScroll(true);

        // On request open keyboard, shorten the container to fit the keyboard and scroll to the focused element
        (<any>window).addEventListener('native.keyboardshow', (e: ICordovaKeyboardEvent) => {
          element.height(originalHeight - e.keyboardHeight);
          let focusedElement = undefined;

          if (element.find('input:focus').length > 0) {
            focusedElement = element.find('input:focus');
          } else if (element.find('textarea:focus').length > 0) {
            focusedElement = element.find('textarea:focus');
          };
          const closestForm = focusedElement.closest('form');
          if (focusedElement && !closestForm) {
            throw new Error('Autoscroll functionality in fix-keyboard-scroll directive needs the input to be embedded in a form');
          }

          // Avoid selecting small divs with scroll set to auto/scroll inside the form (bc the property is inherited from the parent)
          const scrollableContainer = $(closestForm.parents().filter(function () {
            return $(this).css('overflow-y') === 'auto' || $(this).css('overflow-y') === 'scroll';
          })[0]);
          if (focusedElement && isFullyVisible(focusedElement, scrollableContainer)) {
            // scroll the focused element to align its bottom to the top of the keyboard + 10px margin (just for aestethics)
            scrollableContainer.scrollTop(focusedElement.offset().top + scrollableContainer.scrollTop() - element.outerHeight() + focusedElement.outerHeight() + 10);
          }
        });

        // On close keyboard reset height
        (<any>window).addEventListener('native.keyboardhide', () => {
          element.height(originalHeight);
        });

        // Remove listener and restore cordova keyboard scroll
        $scope.$on('$destroy', () => {
          cordova.plugins.Keyboard.disableScroll(false);
          (<any>window).removeEventListener('native.keyboardshow');
        });

        function isFullyVisible(elementToCheck: JQuery, container: JQuery): boolean {
          return (elementToCheck.offset().top + elementToCheck.outerHeight() > container.height() - container.scrollTop());
        }
      }
    };
  };
}
