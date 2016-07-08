/**
 * Created by Nicolas Buecher on 08/06/2016.
 */

'use strict';

angular.module('WarOfTheRingApp')
    .factory('preview1', function ()
    {

        var element = null;

        // Initialize camera and scene
        var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 2000);
        camera.position.set(0, 0, 100);
        var scene = new THREE.Scene();

        // Create and start the renderer
        var renderer = new THREE.WebGLRenderer();
        renderer.setSize(window.innerWidth, window.innerHeight);
        //elem[0].appendChild(renderer.domElement);


        // Add events
        //window.addEventListener('resize', onWindowResize, false);


        // Finally initialize the controls
        // Has to be done AFTER the appendChild(renderer.domElement) call
        // otherwise, you will lose the pan and rotate controls
        var controls;//= new THREE.TrackballControls(camera, elem[0]);

        return {
            test: function() {
                console.log('ULTRA WIN');
            },
            html: function() {
                return renderer.domElement;
            },
            needElement: true,
            setElement: function(elem)
            {
                element = elem;
                controls = new THREE.TrackballControls(camera, elem);
            }
        }

    });

