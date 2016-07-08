/**
 * Created by Nicolas Buecher on 07/06/2016.
 */

'use strict';

angular.module('WarOfTheRingApp')
    .factory('previewManager', function ($q, $injector, fileChecker)
    {

        // Initialize a dictionary to store the previews as 'id: Preview'
        var previews = {};

        var isPreview = function(id)
        {
            return previews.hasOwnProperty(id);
        };


        // Return an instance of Preview object created in the javascript file requested
        var loadPreview = function(id) {

            // Create deferred to handle asynchronous operations
            var deferred = $q.defer();

            // Notify progress of the operation (doesn't work when called just after deferred instantiation)
            deferred.notify("About to load javascript file 'Preview" + id + ".js'");

            // Check if the file has already been downloaded
            if (previews.hasOwnProperty(id))
            {
                console.log("Warning : Multiple queries for the preview " + id);
                deferred.resolve(previews[id]);
            }
            else
            {
                
                var script = document.createElement('script');
                script.type = 'text\/javascript';
                script.src = 'js/services/previews/Preview' + id + '.js';
                script.async = true;

                script.onload = script.onreadystatechange = function() {
                    //setTimeout(function(){$injector.get('preview' + id).test();}, 5000);
                    $injector.get('preview2').test();
                    console.log("Preview " + id + " has been successfully loaded.");
                    deferred.resolve(previews[id]);
                };

                script.onerror = script.onabort = deferred.reject();

                var header = document.getElementsByTagName("head")[0];
                header.appendChild(script);
            }

            // Return promise
            return deferred.promise;

        };

        return {

            test: function(id)
            {
                console.log("test");
                $injector.get('preview'+id).test();
            },
            
            load: function(id)
            {
                if (id)
                {
                    if (!previews.hasOwnProperty(id))
                    {
                        loadPreview(id);
                    }
                }
            },

            //isPreview: function (id) {
/*
                var response = false;

                if (previews[id] === undefined)
                {
                    if (wrongIds[id] === undefined)
                    {
                        // Check for file or false ?
                        // If false, wrongId ne sert à rien
                        // If check, le fichier n'est pas chargé...
                    }
                    else
                    {
                        response = false;
                    }
                }
                else
                {
                    response = true;
                }

                return response;*/
                /*return previews[id] !== undefined;
            },*/
            doesExist: function(id) {
/*
                if (id)
                {
                    if (wrongIds[id] === undefined){}//C'est pas un mauvais
                    if (previews[id] === undefined){}//C'est pas un bon non plus => Check file
                    if (!this.isPreview(id))
                    {
                        // Id rencontré pour la 1ere fois, check file
                        console.log('test');
                        previews[id] = {};
                    }
                    // Sinon, id déjà rencontré, check status property
                    if (previews[id].status === undefined)
                    {
                        // Check file
                        console.log("blob");
                    }
                    else
                    {
                        // Analyze status
                        console.log("plop");
                    }
                }
                // Check if id is defined
                // Don't check if previews[id] is defined because, if not, it will create it
                // Check if previews[id].status === undefined
                // If yes, fileChecker
                // If not, check if it's equal to 404 or 200
                // Return a boolean
*/
                var deferred = $q.defer();

                fileChecker.checkURL('js/services/previews/Preview' + id + '.js')
                    .then(
                        function()
                        {
                            console.log('success');
                            // previews[id].status = 200;
                        },
                        function()
                        {
                            console.log('error');
                            // previews[id].status = 404;
                        }
                    );
                
                return fileChecker.checkURL('js/services/previews/Preview' + id + '.js');

            },
            getHTML: function (id) {
                //previews[id].init();
                //previews[id].getHTML();
/*
                if (this.isPreview(id))
                {
                    console.log(this);
                    console.log('win');
                }
                else {
                    console.log(this);

                }
                */

                $injector.get('preview' + id).test(); // usecase

                var html = document.createElement('div');
                html.innerHTML = "COUCOU";
                return html;
            },
            injectPreview: function(id)
            {
                if (previews.hasOwnProperty(id))
                {
                    console.log("Warning: Preview " + id + " is already injected.")
                }
                else
                {
                    previews[id] = $injector.get('preview' + id);
                }
            },
            needElement: function(id)
            {
                var response = false;

                if (isPreview(id))
                {
                    response = previews[id].needElement;
                }
                else
                {
                    response = false;
                }

                return response;
            },
            setElement: function(id, elem)
            {
                if (isPreview(id))
                {
                    previews[id].setElement(elem);
                }
                else
                {
                    console.log("Aie aie aie");
                }
            },/*
            addPreview: function(id, preview, overwrite)
            {
                var success = false;

                if (overwrite)
                {
                    previews[id] = preview;
                    success = true;
                }
                else
                {
                    if (previews[id] === undefined)
                    {
                        previews[id] = preview;
                        success = true;
                    }
                    else
                    {
                        console.log("This id is already taken, put the third argument to true if you want to overwrite the preview.");
                        success = false;
                    }
                }

                return success;
            },*/
            
            init: function(id)
            {
                // Initialize camera and scene
                var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 2000);
                camera.position.set(0, 0, 100);
                var scene = new THREE.Scene();

                // Create and start the renderer
                var renderer = new THREE.WebGLRenderer();
                renderer.setSize(window.innerWidth, window.innerHeight);
                elem[0].appendChild(renderer.domElement);


                // Add events
                window.addEventListener('resize', onWindowResize, false);

                // Finally initialize the controls
                // Has to be done AFTER the appendChild(renderer.domElement) call
                // otherwise, you will lose the pan and rotate controls
                //controls = new THREE.TrackballControls(camera, elem[0]);
            }
        }
    });