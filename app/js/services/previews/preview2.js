/**
 * Created by Nicolas Buecher on 11/06/2016.
 */

'use strict';

angular.module('WarOfTheRingApp')
    .factory('preview2', function ()
    {
        console.log('preview2');
        return {
            test: function() {
                console.log('ULTRA WIN');
            }
        }
    });