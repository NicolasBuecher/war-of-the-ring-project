/**
 * Created by Nicolas Buecher on 17/05/2016.
 */

'use strict'

/**
 * Filter Capitalize
 *
 * Capitalize the first letter of a string
 */
angular.module("capitalize", [])
    .filter(
        "capitalize",
        function() {
            return function(input, space, lowercase) {

                // Avoid null input
                input = input || '';

                // If true, look for capitalized letters and add a space before them
                if (space)
                {
                    // Look for capitalized letters and add a space before them
                    var spacedInput = input;
                    var count=0;

                    // Iterate on each character of the input
                    for (var i = 1; i < input.length; i++)
                    {
                        // Check if the letter is uppercase
                        if (input[i] === input[i].toUpperCase())
                        {
                            // Add a space before the capitalized letter
                            spacedInput = spacedInput.slice(0,i+count) + ' ' + input.slice(i);
                            count++;
                        }
                    }

                    // Update input with its new version
                    input = spacedInput;
                }

                // If true, lowercase all the capitalized letters
                if (lowercase)
                {
                    input = input.toLowerCase();
                }

                // Finally capitalize the first letter
                return input.substring(0,1).toUpperCase() + input.substring(1);

            }
        }
    );

