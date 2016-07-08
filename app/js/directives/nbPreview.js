/**
 * Created by Nicolas Buecher on 07/06/2016.
 */

/**
 * Directive nbPreview
 *
 * Initialize the Three.js Scene associated to the preview id bound, and render it
 */
angular.module("nbPreview", [])
    .directive(
        "nbPreview",
        [
            'previewManager',
            function (previewManager) {
                return {

                    // Directive has to be used as an attribute
                    restrict: "A",          // When used as an element, pan doesn't work as it should, so use it as an attribute

                    // Create an isolate scope for this directive
                    scope: {
                        'previewId': '=previewId'  // Pay attention to the FUCKING NORMALIZATION : some-thing becomes someThing !
                                            // 'isolateProperty': '=normalizedProperty' and in the DOM future-normalized-property="parentProperty"
                    },

                    // This isolate scope will use its own controller
                    controller: function ($scope) {

                    },

                    // Function called for each instance of the directive, manipulate DOM here
                    link: function (scope, elem, attr) {

                        if (previewManager.needElement(scope.previewId))
                        {
                            previewManager.setElement(elem[0]);
                        }

                        var html = previewManager.getHTML(scope.previewId);
                        elem[0].appendChild(html);

                    }
                }
            }
        ]
    );