//"use strict";

var camera, step_model, controls, container, scene, renderer, wireframe, bound_x, bound_y, bound_z;
var canvasElement;
function render_parameters(model, data, api_token) {
    
    var windowX = 840;
    var windowY = 740;
    var raycaster, mouse = { x : 0, y : 0 };
    var target = [];
    var ray_points = [];
    var tols_normals = [];
    var face_mat_index = [];
    var tol = 1e-2;
    var current_faces = [];
    var current_faces_tols = [];
    var coloured_faces = [];
    var feature_names = [];
    var tol_dist = '';
    center = '';
    document.getElementById("bbox").innerHTML = '';
    

    data['features']['tolerances'] = []

    var tol_id = 1;

    init();
    animate();
    function init() {
        
        // scene
        scene = new THREE.Scene();
        scene.background = new THREE.Color( 0xe6e6e6 );

        var ambient = new THREE.AmbientLight( 0x0 );
        scene.add( ambient );

        var light1 = new THREE.PointLight(0xc8c8c8);
        light1.position.set( 400, 350, 350 );

        var light2 = new THREE.PointLight(0xc8c8c8);
        light2.position.set( -400, -350, -350 );

        // Load the  STEP file
        var loader = new THREE.BufferGeometryLoader();
        // loader.setRequestHeader('Authorization', api_token);

        // load a resource
        loader.load(
            // resource URL
            model,
            // onLoad callback
            function ( bufferGeometry ) {
                var geom = new THREE.Geometry().fromBufferGeometry( bufferGeometry );
                geom.mergeVertices();

                geometry = faceMatIndex(geom);

                var c = new THREE.Vector3();
                geometry.computeBoundingBox();   
                center = geometry.boundingBox.getCenter(c);

                var material = new THREE.MeshPhongMaterial( { color: 0xbdbdbd, 
                     shininess: 1,
                      emissive: 0x0,
                       transparent: true,
                       shading: THREE.FlatShading,
                        vertexColors: THREE.FaceColors, 
                        polygonOffset: true,
                         polygonOffsetFactor: 1,
                          polygonOffsetUnits: 1
                        } );

                step_model = new THREE.Mesh( geometry, material );
                scene.add( step_model );
                step_model.name = "model";

                // wireframe
                var edges = new THREE.EdgesGeometry( step_model.geometry );
                wireframe = new THREE.LineSegments( edges, new THREE.LineBasicMaterial( { color: (0x000000), linewidth: 1, transparent: true} ));
                wireframe.visible = true;
                wireframe.material.opacity = 0.25;
                wireframe.material.transparent = true;
                scene.add( wireframe ); 

                target.push(step_model);

                // bounding box
                box = new THREE.BoxHelper( step_model, 0xff0000 );
                box.name = "bbox";
                scene.add( box );
                box.visible = false;

                bbox = new THREE.Box3().setFromObject(step_model);
                bound_x = Math.abs(bbox.max.x - bbox.min.x);
                bound_y = Math.abs(bbox.max.y - bbox.min.y);
                bound_z = Math.abs(bbox.max.z - bbox.min.z);

            },

            // onProgress callback
            function ( xhr ) {
                console.log( (xhr.loaded / xhr.total * 100) + '% loaded' );
            },

            // onError callback
            function ( err ) {
                console.log( 'An error happened' );
            }
        );


        canvasElement = document.querySelector("canvas");
        renderer = new THREE.WebGLRenderer({antialias:true, canvas: canvasElement});
        renderer.setPixelRatio( window.devicePixelRatio );
       
        camera = new THREE.OrthographicCamera( windowX / - 2, windowX / 2, windowY / 2, windowY / - 2, 1, 1000 );
        camera.position.set(300,300,300);

        camera.add(light1);
        camera.add(light2);

        scene.add(camera); 

        controls = new THREE.OrthographicTrackballControls( camera );
            controls.rotateSpeed = 3.0;
            controls.zoomSpeed = 1.2;
            controls.panSpeed = 0.8;
            controls.noZoom = false;
            controls.noPan = false;
            controls.staticMoving = true;
            controls.dynamicDampingFactor = 0.3;
            controls.keys = [ 65, 83, 68 ];
       

        canvasElement.onmouseover =function (){
            
            controls.enabled = true;
            controlLoop=setInterval(function() { controls.update();}, 1); };

        canvasElement.onmouseout = function (){ 
            controls.enabled = false;
            clearInterval(controlLoop); } 


        features();
        var features_state = false;
        document.getElementById("#Features").onclick = function(){
            var names_len = feature_names.length;
            if (features_state == true) {
                for (var c = 0; c < names_len; c++) {
                    obj = scene.getObjectByName( feature_names[c] );
                    obj.visible = false;
                }
                step_model.material.opacity = 1.0; 
                features_state = false;
            }
            else {
                for (var c = 0; c < names_len; c++) {
                    obj = scene.getObjectByName( feature_names[c] );
                    obj.visible = true;
                }
                step_model.material.opacity = 0.8; 
                features_state = true;
            }
        }
        
        document.getElementById("#Tols").onclick = function(){
            //if (tol_button_counter % 2 == 1) {
                document.getElementById("tmode").innerHTML = 'ON';
                document.getElementById("close-tols").style.visibility = 'visible';

                $('#Tol-Modal').on('hidden.bs.modal', function (e) {
                    $(this)
                    .find("input,textarea,select")
                        .val('')
                        .end()
                    .find("input[type=checkbox], input[type=radio]")
                        .prop("checked", "")
                        .end();
                })
                if (current_faces.length != 0) {
                    for (var f = 0; f < current_faces.length; f++) {
                        drawFace(current_faces[f], 0xffffff);
                    }
                    current_faces= [];
                }
                raycaster = new THREE.Raycaster();
                document.addEventListener( 'click', raycast_faces_tols, false );

                // disable all other buttons
                document.getElementById("#Features").disabled = true;
                document.getElementById("#BBox").disabled = true;
                document.getElementById("mode-btn").disabled = true;
                
                document.getElementById("close-tols").onclick = function() {
                    document.getElementById("tmode").innerHTML = 'OFF';
                    document.getElementById("close-tols").style.visibility = 'hidden';
                    if (coloured_faces.length != 0) {
                        for (var f = 0; f < coloured_faces.length; f++) {
                            drawFace(coloured_faces[f], 0xffffff);
                        }
                        coloured_faces = [];
                    }
                    ray_points = [];
                    document.removeEventListener( 'click', raycast_faces_tols, false );

                    // enable all other buttons
                    document.getElementById("#Features").disabled = false;
                    document.getElementById("#BBox").disabled = false;
                    document.getElementById("mode-btn").disabled = false;
                };
                
            //}
            //tol_button_counter++;  
        };
        
        document.getElementById("#Solid").onclick = function(){
            var obj = scene.getObjectByName( "model" );
            obj.material.opacity = 1.0;
            wireframe.visible = false;
        };  

        document.getElementById("#Wireframe").onclick = function(){
            step_model.material.opacity = 0.0; 
            wireframe.visible = true;
        };

        document.getElementById("#Transparent").onclick = function(){
            step_model.material.opacity = 0.8; 
            wireframe.visible = false;
        }; 

        var bbox_state = false;
        document.getElementById("#BBox").onclick = function(){
            if (bbox_state == true) {
                obj = scene.getObjectByName("bbox" );
                obj.visible = false;
                bbox_state = false;
                document.getElementById("bbox").innerHTML = '';
            }
            else {
                obj = scene.getObjectByName( "bbox" );
                obj.visible = true;
                bbox_state = true;

                model = scene.getObjectByName( "model" );
                bbox = new THREE.Box3().setFromObject(model);
                xx = Math.abs(bbox.max.x - bbox.min.x);
                yy = Math.abs(bbox.max.y - bbox.min.y);
                zz = Math.abs(bbox.max.z - bbox.min.z);

                document.getElementById("bbox").innerHTML = "<br>" + xx.toFixed(2) + " mm" + ", <br>" + yy.toFixed(2) + " mm" + ", <br>" + zz.toFixed(2) + " mm";
                
            }   
        }; 

    }

    function features() {
        // Show the detected deatures
        holes = data.features.holes;
        for (var i = 0; i < holes.length; i++) {
            position = holes[i].position;
            radius = holes[i].radius;
            depth = holes[i].depth;
            direction = holes[i].direction; 

            var material = new THREE.MeshPhongMaterial({color: 0x0000ff, side:THREE.DoubleSide});
            var geometry = new THREE.CylinderGeometry( radius-0.2, radius-0.2, depth, 50, 50, true );
            //geometry.applyMatrix( new THREE.Matrix4().makeTranslation( 0, depth / 2, 0 ) );
            geometry.applyMatrix( new THREE.Matrix4().makeRotationX( THREE.Math.degToRad( 90 ) ) );
            var mesh = new THREE.Mesh( geometry, material );
            mesh.position.copy( new THREE.Vector3 (position[0], position[1], position[2]));
            mesh.lookAt(new THREE.Vector3 (position[0], position[1], position[2]).add(new THREE.Vector3 (direction[0], direction[1], direction[2])));
            scene.add(mesh);
            mesh.name = data.features.holes[i].type + " " + data.features.holes[i].ID.toString();
            feature_names.push(mesh.name);
            mesh.visible = false;
        }

        bosses = data.features.bosses;
        for (var i = 0; i < bosses.length; i++) {
            position = bosses[i].position;
            radius = bosses[i].radius;
            depth = bosses[i].depth;
            direction = bosses[i].direction;

            var material = new THREE.MeshPhongMaterial({color: 0xff0000, side:THREE.DoubleSide});
            var geometry = new THREE.CylinderGeometry( radius+0.2, radius+0.2, depth, 50, 50, true );
            //geometry.applyMatrix( new THREE.Matrix4().makeTranslation( 0, depth / 2, 0 ) );
            geometry.applyMatrix( new THREE.Matrix4().makeRotationX( THREE.Math.degToRad( 90 ) ) );
            var mesh = new THREE.Mesh( geometry, material );
            mesh.position.copy( new THREE.Vector3 (position[0], position[1], position[2]));
            mesh.lookAt(new THREE.Vector3 (position[0], position[1], position[2]).add(new THREE.Vector3 (direction[0], direction[1], direction[2]))); 
            scene.add(mesh);
            mesh.name = data.features.bosses[i].type + " " + data.features.bosses[i].ID.toString();
            feature_names.push(mesh.name);
            mesh.visible = false;
        }
    }

    function raycast_faces_tols ( e ) {
        //1. sets the mouse position with a coordinate system where the center
        //   of the screen is the origin
        mouse.x = (event.offsetX / renderer.domElement.clientWidth) * 2 - 1;
        mouse.y = - (event.offsetY / renderer.domElement.clientHeight) * 2 + 1;
        //mouse.x = (event.offsetX / windowX) * 2 - 1;
        //mouse.y = - (event.offsetY / windowY) * 2 + 1;
        //var rect = renderer.domElement.getBoundingClientRect();
        //mouse.x = ( ( event.clientX - rect.left ) / ( rect.width - rect.left ) ) * 2 - 1;
        //mouse.y = - ( ( event.clientY - rect.top ) / ( rect.bottom - rect.top) ) * 2 + 1;

        //2. set the picking ray from the camera position and mouse coordinates
        raycaster.setFromCamera( mouse, camera ); 

        //3. compute intersections
        var intersects = raycaster.intersectObjects( target );
        if ( intersects.length > 0 ) {
            // colour the selected surface
            coloured_faces.push(intersects[0]);

            //face_color = Math.floor(Math.random()*16777215).toString(16);

            // compute the distance between two surfaces
            if (ray_points.length == 0) {
                //drawFace(intersects[0],'0x' + face_color);
                drawFace(intersects[0],0xff4949);
                current_faces_tols.push(intersects[0]);
                ray_points = intersects[0].point; 
                tols_normals = intersects[0].face.normal;
                face_mat_index = intersects[0].face.materialIndex;
                // change the colour back to the initial one after selecting another pair of faces
                if (current_faces_tols.length == 3) {
                    //drawFace(current_faces_tols[0], '0x' + fcolor);
                    //drawFace(current_faces_tols[1], '0x' + fcolor);
                    current_faces_tols = [];
                    //document.getElementById("distance").innerHTML = '';
                    current_faces_tols.push(intersects[0]);
                }
                //fcolor = face_color;
            }
            else {
                v = new THREE.Vector3(intersects[0].point.x - ray_points.x, intersects[0].point.y - ray_points.y, intersects[0].point.z - ray_points.z);
                //v.normalize();
                normal = intersects[0].face.normal;
                normal.normalize();
                dist = Math.abs(v.x * normal.x + v.y * normal.y + v.z * normal.z);
                //check for zero thickness
                if (Math.abs(dist - 0) >= 0.001) {
                    prev_point = ray_points;
                    prev_normal = tols_normals;
                    prev_normal.normalize();
                    prev_face_mat_index = face_mat_index;

                    //check if selected surfaces are perpendicular
                    if (normal.dot(prev_normal) != 0) {
                        //drawFace(intersects[0],'0x' + fcolor);
                        drawFace(intersects[0],0xff4949);
                        current_faces_tols.push(intersects[ 0 ]);

                        document.getElementById("distance2").innerHTML = dist.toFixed(3) + " mm";
                        $("#Tol-Modal").modal("show");
                        curr_point = intersects[0].point;
                        document.getElementById("btn-modal").onclick = function() {
                            //tol_dist =  tol_dist + "<br/>" + "<div id='icon' style='background-color:#" + fcolor + "'></div>" + dist.toFixed(2) + " \xb1 " + document.getElementById("tolerance-value").value + " mm ";
                            tol_dist = "<br/>" + dist.toFixed(3) + " \xb1 " + document.getElementById("tolerance-value").value + " mm ";

                            var vec_prev2curr_pnt = new THREE.Vector3(curr_point.x - prev_point.x, curr_point.y - prev_point.y, curr_point.z - prev_point.z);
                            var c = vec_prev2curr_pnt.dot(prev_normal);

                            var wanted_dir = prev_normal.multiplyScalar(c);
                            wanted_dir.normalize();

                            // find the point opposite the 1st selected point 
                            //opposite_point = new THREE.Vector3(prev_point.x + dist * normal.x, prev_point.y + dist * normal.y, prev_point.z + dist * normal.z);
                            opposite_point = new THREE.Vector3(prev_point.x + dist * wanted_dir.x, prev_point.y + dist * wanted_dir.y, prev_point.z + dist * wanted_dir.z);
                            
                            // find the direction that tolerances call offs will be drawn
                            perp_dir = find_direction(prev_point, opposite_point);

                            // Bounding boundaries of the model
                            model = scene.getObjectByName( "model" );
                            bbox = new THREE.Box3().setFromObject(model);
                            xx = Math.abs(bbox.max.x - bbox.min.x);
                            yy = Math.abs(bbox.max.y - bbox.min.y);
                            zz = Math.abs(bbox.max.z - bbox.min.z);

                            //var min_bb =  Math.min(xx,yy,zz);
                            var avg = (xx + yy + zz)/3;
                            var lamvda = 0.5 * avg;

                            //===========================================================================================================
                            //Draw arrows for the dimensions

                            var origin1 = new THREE.Vector3( prev_point.x + lamvda * perp_dir.x, prev_point.y + lamvda * perp_dir.y, prev_point.z + lamvda * perp_dir.z);
                            var length = dist;
                            var hex = 0x000000;

                            var headLength = 0.05 * length;
                            var headWidth = 0.6 * headLength;

                            var arrow1 = new THREE.ArrowHelper( wanted_dir, origin1, length, hex, headLength, headWidth );

                            var origin2 = new THREE.Vector3( opposite_point.x + lamvda * perp_dir.x, opposite_point.y + lamvda * perp_dir.y, opposite_point.z + lamvda * perp_dir.z);
                            var arrow2 = new THREE.ArrowHelper( wanted_dir.negate(), origin2, length, hex, headLength, headWidth );

                            var tol_lines_group = new THREE.Group();
                            tol_lines_group.add( arrow1 );
                            tol_lines_group.add( arrow2 );

                            

                            //===========================================================================================================
                            var vec = new THREE.Vector3(curr_point.x - opposite_point.x, curr_point.y - opposite_point.y, curr_point.z - opposite_point.z);
                            //vec.normalize();
                            var proj_constant = vec.dot(perp_dir);

                            //===========================================================================================================
                            //Draw lines for the dimensions
                            var geometry = new THREE.BufferGeometry();
                            var positions = new Float32Array( [
                                prev_point.x, prev_point.y, prev_point.z,
                                prev_point.x + lamvda * perp_dir.x, prev_point.y + lamvda * perp_dir.y, prev_point.z + lamvda * perp_dir.z,
                            ] );
                                
                            geometry.addAttribute( 'position', new THREE.BufferAttribute( positions, 3 ) );
                            line = new THREE.Line( geometry, new THREE.LineBasicMaterial( { color: 0x000000 } ) );
                            tol_lines_group.add( line );

                            var geometry = new THREE.BufferGeometry();
                            var positions = new Float32Array( [
                                opposite_point.x + proj_constant * perp_dir.x, opposite_point.y + proj_constant * perp_dir.y, opposite_point.z + proj_constant * perp_dir.z,
                                opposite_point.x + lamvda * perp_dir.x, opposite_point.y + lamvda * perp_dir.y, opposite_point.z + lamvda * perp_dir.z,
                            ] );
                                
                            geometry.addAttribute( 'position', new THREE.BufferAttribute( positions, 3 ) );
                            line = new THREE.Line( geometry, new THREE.LineBasicMaterial( { color: 0x000000 } ) );
                            tol_lines_group.add( line ); 

                            //===========================================================================================================

                            x = (opposite_point.x + lamvda * perp_dir.x + prev_point.x + lamvda * perp_dir.x)/2;
                            y = (opposite_point.y + lamvda * perp_dir.y + prev_point.y + lamvda * perp_dir.y)/2;
                            z = (opposite_point.z + lamvda * perp_dir.z + prev_point.z + lamvda * perp_dir.z)/2;
                                
                            message = Math.abs(dist).toFixed(3) + " \xb1 " + document.getElementById("tolerance-value").value + " mm";
                            var myText = new SpriteText(message);
                            myText.color = 'black';
                            //myText.textHeight = Math.min(bound_x, bound_y, bound_z)/10;
                            myText.textHeight = ((bound_x+bound_y+bound_z)/4)/10;

                            var v1 = new THREE.Vector3((prev_point.x + lamvda * perp_dir.x)-prev_point.x, (prev_point.y + lamvda * perp_dir.y)-prev_point.y, (prev_point.z + lamvda * perp_dir.z)-prev_point.z);
                            v1.normalize();
                            var mu = ((bound_x+bound_y+bound_z)/4)/10;
                            myText.position.set(x + mu * v1.x, y + mu * v1.y, z + mu * v1.z)


                            tol_lines_group.add( myText ); 

                            tol_lines_group.name = 'tol-lines-' + tol_id.toString();

                            scene.add( tol_lines_group );

                            //Save inputs in the data json file
                            distance_value = Math.abs(dist).toFixed(2);
                            tol_value = document.getElementById("tolerance-value").value;
                            tol_line_pnts = [
                                    //line1
                                    [prev_point.x, prev_point.y, prev_point.z],
                                    [prev_point.x + lamvda * perp_dir.x, prev_point.y + lamvda * perp_dir.y, prev_point.z + lamvda * perp_dir.z],
                                    //line2
                                    [opposite_point.x + proj_constant * perp_dir.x, opposite_point.y + proj_constant * perp_dir.y, opposite_point.z + proj_constant * perp_dir.z],
                                    [opposite_point.x + lamvda * perp_dir.x, opposite_point.y + lamvda * perp_dir.y, opposite_point.z + lamvda * perp_dir.z],
                                ];
                            data['features']['tolerances'].push({'distance': distance_value, 'tolerance': tol_value, 'line_points': tol_line_pnts});

                            // add view and remove buttons
                            var spanE = document.getElementById("distance");
                            
                            var newEntryElem = document.createElement('div');
                            var buttonView = document.createElement('button');
                            var buttonRemove = document.createElement('button');

                            newEntryElem.setAttribute('id', `entry_${tol_id}`);

                            buttonView.innerText = 'View';
                            buttonRemove.innerText = 'Remove';

                            // View button
                            buttonView.setAttribute('class', 'view-tol-btn');
                            buttonView.setAttribute('id', 'view-tol-btn-' + tol_id.toString());
                            buttonView.setAttribute('data-xyz', x.toString() + " " + y.toString() + " " +  z.toString());
                            buttonView.onclick = function() {viewTol(this)};

                            
                            // Remove button
                            buttonRemove.setAttribute('class', 'remove-tol-btn');
                            buttonRemove.setAttribute('id', 'remove-tol-btn-' + tol_id.toString());
                            buttonRemove.setAttribute('data-name', 'tol-lines-' + tol_id.toString());
                            buttonRemove.onclick = function() {removeTol(this)};

                            // append the tolerance value and the buttons in the new element
                            newEntryElem.innerHTML = tol_dist;
                            newEntryElem.appendChild(buttonRemove);
                            newEntryElem.appendChild(buttonView);
                            
                            // append the new element in the document
                            spanE.appendChild(newEntryElem);

                            tol_id++;
                            
                            //with saving the tols, close the tolerance mode and remove the colour from the selectesd surfaces
                            document.getElementById("tmode").innerHTML = 'OFF';
                            document.getElementById("close-tols").style.visibility = 'hidden';
                            
                            if (coloured_faces.length != 0) {
                                for (var f = 0; f < coloured_faces.length; f++) {
                                    drawFace(coloured_faces[f], 0xffffff);
                                }
                                coloured_faces = [];
                            }
                            document.removeEventListener( 'click', raycast_faces_tols, false );

                            // enable all other buttons
                            document.getElementById("#Features").disabled = false;
                            document.getElementById("#BBox").disabled = false;
                            document.getElementById("mode-btn").disabled = false;
                        }
                        ray_points = [];
                        tols_normals = [];
                    }
                    else {
                        alert("You can't assign tolerance between two perpendicular surfaces! Please select a parallel surface.");
                    }
                } 
                else{
                    alert("You can't assign tolerance between two surfaces with zero thickness!");
                    if (current_faces_tols.length != 0) {
                        for (var f = 0; f < current_faces_tols.length; f++) {
                            drawFace(current_faces_tols[f], 0xffffff);
                        }
                        current_faces_tols = [];
                    }
                    ray_points = [];
                    tols_normals = [];
                } 
            }
        }
            
    }

    function find_direction(point, opp_point) {
        // find the 8 points of the object's boundary box
        // 4 points above center point
        p1 = [center.x + bound_x/2, center.y + bound_y/2, center.z + bound_z/2];
        p2 = [center.x + bound_x/2, center.y + bound_y/2, center.z - bound_z/2];
        p3 = [center.x - bound_x/2, center.y + bound_y/2, center.z - bound_z/2];
        p4 = [center.x - bound_x/2, center.y + bound_y/2, center.z + bound_z/2];
        // 4 points below center point
        p5 = [center.x + bound_x/2, center.y - bound_y/2, center.z + bound_z/2];
        p6 = [center.x + bound_x/2, center.y - bound_y/2, center.z - bound_z/2];
        p7 = [center.x - bound_x/2, center.y - bound_y/2, center.z - bound_z/2];
        p8 = [center.x - bound_x/2, center.y - bound_y/2, center.z + bound_z/2];

        // define the normals of the 6 planes of the bbox
        // x direction
        var Nx_pos = new THREE.Vector3(1,0,0);
        var Nx_neg = new THREE.Vector3(-1,0,0);
        // y direction
        var Ny_pos = new THREE.Vector3(0,1,0);
        var Ny_neg = new THREE.Vector3(0,-1,0);
        // z direction
        var Nz_pos = new THREE.Vector3(0,0,1);
        var Nz_neg = new THREE.Vector3(0,0,-1);

        // define the plane constant of the 6 planes of the bbox
        // x direction
        var const_xpos = dot(p1,Nx_pos);
        var const_xneg = dot(p3,Nx_neg);
        // y direction
        var const_ypos = dot(p3,Ny_pos);
        var const_yneg = dot(p5,Ny_neg);
        // z direction
        var const_zpos = dot(p1,Nz_pos);
        var const_zneg = dot(p3,Nz_neg);

        // split bbox into 8 smaller boxes
        /*
        p12 = [(p1[0]+p2[0])/2, (p1[1]+p2[1])/2, (p1[2]+p2[2])/2];
        p23 = [(p2[0]+p3[0])/2, (p2[1]+p3[1])/2, (p2[2]+p3[2])/2];
        p34 = [(p4[0]+p3[0])/2, (p4[1]+p3[1])/2, (p4[2]+p3[2])/2];
        p41 = [(p4[0]+p1[0])/2, (p4[1]+p1[1])/2, (p4[2]+p1[2])/2];
        p15 = [(p1[0]+p5[0])/2, (p1[1]+p5[1])/2, (p1[2]+p5[2])/2];
        p56 = [(p6[0]+p5[0])/2, (p6[1]+p5[1])/2, (p6[2]+p5[2])/2];
        p62 = [(p6[0]+p2[0])/2, (p6[1]+p2[1])/2, (p6[2]+p2[2])/2];
        p58 = [(p8[0]+p5[0])/2, (p8[1]+p5[1])/2, (p8[2]+p5[2])/2];
        p84 = [(p8[0]+p4[0])/2, (p8[1]+p4[1])/2, (p8[2]+p4[2])/2];
        p67 = [(p6[0]+p7[0])/2, (p6[1]+p7[1])/2, (p6[2]+p7[2])/2];
        p73 = [(p3[0]+p7[0])/2, (p3[1]+p7[1])/2, (p3[2]+p7[2])/2];
        p78 = [(p8[0]+p7[0])/2, (p8[1]+p7[1])/2, (p8[2]+p7[2])/2];
        p12_34 = [(p12[0]+p34[0])/2, (p12[1]+p34[1])/2, (p12[2]+p34[2])/2];
        p12_56 = [(p12[0]+p56[0])/2, (p12[1]+p56[1])/2, (p12[2]+p56[2])/2];
        p56_78 = [(p78[0]+p56[0])/2, (p78[1]+p56[1])/2, (p78[2]+p56[2])/2];
        p78_34 = [(p78[0]+p34[0])/2, (p78[1]+p34[1])/2, (p78[2]+p34[2])/2];
        p41_58 = [(p41[0]+p58[0])/2, (p41[1]+p58[1])/2, (p41[2]+p58[2])/2];
        p23_67 = [(p23[0]+p67[0])/2, (p23[1]+p67[1])/2, (p23[2]+p67[2])/2]; */
        p_center = [center.x, center.y, center.z];

        var boxes_min_values = [];
        var boxes_max_values = [];
        var boxes_normals = [];
        var boxes_constants = [];

        //box1 (x_pos, y_pos, z_pos)
        //b1_points = [p1, p12, p12_34, p41, p15, p12_56, p_center, p41_58];
        b1_normals = [Nx_pos, Ny_pos, Nz_pos];
        b1_max = [p1[0], p1[1], p1[2]];
        b1_min = [p_center[0], p_center[1], p_center[2]];
        boxes_min_values.push(b1_min);
        boxes_max_values.push(b1_max);
        boxes_normals.push(b1_normals);
        boxes_constants.push([const_xpos, const_ypos, const_zpos]);

        //box2 (x_pos, y_pos, z_neg)
        //b2_points = [p12, p2, p23, p12_34, p12_56, p62, p23_67, p_center];
        b2_normals = [Nx_pos, Ny_pos, Nz_neg];
        b2_max = [p2[0], p2[1], p_center[2]];
        b2_min = [p_center[0], p_center[1], p2[2]];
        boxes_min_values.push(b2_min);
        boxes_max_values.push(b2_max);
        boxes_normals.push(b2_normals);
        boxes_constants.push([const_xpos, const_ypos, const_zneg]);

        //box3 (x_neg, y_pos, z_neg)
        //b3_points = [p12_34, p23, p3, p34, p_center, p23_67, p73, p78_34];
        b3_normals = [Nx_neg, Ny_pos, Nz_neg];
        b3_max = [p_center[0], p3[1], p_center[2]];
        b3_min = [p3[0], p_center[1], p3[2]];
        boxes_min_values.push(b3_min);
        boxes_max_values.push(b3_max);
        boxes_normals.push(b3_normals);
        boxes_constants.push([const_xneg, const_ypos, const_zneg]);

        //box4 (x_neg, y_pos, z_pos)
        //b4_points = [p41, p12_34, p34, p4, p41_58, p_center, p78_34, p84];
        b4_normals = [Nx_neg, Ny_pos, Nz_pos];
        b4_max = [p_center[0], p4[1], p4[2]];
        b4_min = [p4[0], p_center[1], p_center[2]];
        boxes_min_values.push(b4_min);
        boxes_max_values.push(b4_max);
        boxes_normals.push(b4_normals);
        boxes_constants.push([const_xneg, const_ypos, const_zpos]);

        //box5 (x_pos, y_neg, z_pos)
        //b5_points = [p15, p12_56, p_center, p41_58, p5, p56, p56_78, p58];
        b5_normals = [Nx_pos, Ny_neg, Nz_pos];
        b5_max = [p5[0], p_center[1], p5[2]];
        b5_min = [p_center[0], p5[1], p_center[2]];
        boxes_min_values.push(b5_min);
        boxes_max_values.push(b5_max);
        boxes_normals.push(b5_normals);
        boxes_constants.push([const_xpos, const_yneg, const_zpos]);

        //box6 (x_pos, y_neg, z_neg)
        //b6_points = [p12_56, p62, p23_67, p_center, p56, p6, p67, p56_78];
        b6_normals = [Nx_pos, Ny_neg, Nz_neg];
        b6_max = [p6[0], p_center[1], p_center[2]];
        b6_min = [p_center[0], p6[1], p6[2]];
        boxes_min_values.push(b6_min);
        boxes_max_values.push(b6_max);
        boxes_normals.push(b6_normals);
        boxes_constants.push([const_xpos, const_yneg, const_zneg]);

        //box7 (x_neg, y_neg, z_neg)
        //b7_points = [p_center, p23_67, p73, p78_34, p56_78, p67, p7, p78];
        b7_normals = [Nx_neg, Ny_neg, Nz_neg];
        b7_max = [p_center[0], p_center[1], p_center[2]];
        b7_min = [p7[0], p7[1], p7[2]];
        boxes_min_values.push(b7_min);
        boxes_max_values.push(b7_max);
        boxes_normals.push(b7_normals);
        boxes_constants.push([const_xneg, const_yneg, const_zneg]);

        //box8 (x_neg, y_neg, z_pos)
        //b8_points = [p41_58, p_center, p78_34, p84, p58, p56_78, p78, p8];
        b8_normals = [Nx_neg, Ny_neg, Nz_pos];
        b8_max = [p_center[0], p_center[1], p8[2]];
        b8_min = [p8[0], p8[1], p_center[2]];
        boxes_min_values.push(b8_min);
        boxes_max_values.push(b8_max);
        boxes_normals.push(b8_normals);
        boxes_constants.push([const_xneg, const_yneg, const_zpos])

        // Find in which bbox the point lies
        for (i = 0; i < boxes_max_values.length; i++) {
            if ((point.x >= boxes_min_values[i][0]) && (point.x <= boxes_max_values[i][0])) {
                if ((point.y >= boxes_min_values[i][1]) && (point.y <= boxes_max_values[i][1])) {
                    if ((point.z >= boxes_min_values[i][2]) && (point.z <= boxes_max_values[i][2])) {
                        selected_box = i;
                    }
                } 
            }
        }

        var direction = new THREE.Vector3(opp_point.x - point.x, opp_point.y - point.y, opp_point.z - point.z);
        direction.normalize();

        // Find the possible directions
        selected_normals = boxes_normals[selected_box];
        selected_constants = boxes_constants[selected_box];

        var possible_directions = [];
        for (i = 0; i < selected_normals.length; i++) {
            if (Math.round(direction.dot(selected_normals[i])) == 0) {
                possible_directions.push(i)
            }
        }

        dist_planes_pnt = []
        for (var i = 0; i < possible_directions.length; i++) {
            result = selected_normals[possible_directions[i]].dot(point);
            dist_planes_pnt.push(Math.abs(result-selected_constants[possible_directions[i]]));
        } 

        var min_ind = dist_planes_pnt.indexOf(Math.min(...dist_planes_pnt));

        return selected_normals[possible_directions[min_ind]];


    }

    function viewTol(tol) {
        var data = tol.getAttribute("data-xyz");
        data = data.split(" ");
        x = parseFloat(data[0]);
        y = parseFloat(data[1]);
        z = parseFloat(data[2]);

        camera.position.x = x;
        camera.position.y = y;
        camera.position.z = z;
        
        camera.lookAt(0,0,0);
        camera.translateZ( 100);

        camera.zoom = 1.5;

    }

    function removeTol(tol) {
        $("#Remove-Tol-Modal").modal("show");
        document.getElementById('yes-btn-modal').onclick = function() {
            var tol_data = tol.getAttribute("data-name");
            var obj = scene.getObjectByName( tol_data );
            scene.remove(obj);
            var id = tol_data.split("-")[2];
            document.getElementById('entry_' + id).remove();
            data['features']['tolerances'].splice(id-1,1);
        }
        

        document.getElementById('no-btn-modal').onclick = function() {
        }

        
    }

    function drawFace(intersect, color) {

        intersects_matInd = intersect.face.materialIndex;

        if (intersects_matInd != 0) {
                
            intersect.face.color.setHex(color);
            
            faces = target[0].geometry.faces;
            faces_num = faces.length;
            
            for (i = 0; i < faces_num; i++) {
                ind = faces[i].materialIndex;
                if (ind == intersects_matInd) {
                    faces[i].color.setHex(color);
                }
            }  

            intersect.object.geometry.colorsNeedUpdate = true;
        } 
    }
    
    function faceMatIndex(geometry) {
        planes = data.features.planes;
        faces = geometry.faces;
        faces_num = faces.length;
        vertices = geometry.vertices;
        for (i = 0; i < planes.length; i++) {
            plane = planes[i];
            normal = plane.normal;
            constant = plane.plane_constant;
            //console.log(constant)
            for (f = 0; f < faces_num; f++) {
                parallel = dot(normal,faces[f].normal);
                if (Math.abs(1-parallel) <= tol) {
                    d1 = dot(normal, vertices[faces[f].a]);
                    d2 = dot(normal, vertices[faces[f].b]);
                    d3 = dot(normal, vertices[faces[f].c]);
                    //console.log(d1,d2,d3)
                    if ((Math.abs(d1-constant) <= tol) && (Math.abs(d2-constant) <= tol) && (Math.abs(d3-constant) <= tol)) {
                        if (faces[f].materialIndex == 0) {
                            faces[f].materialIndex = i+1;
                        }
                    }
                }
            } 
            
       }
        
        return geometry;
    }

    function dot(a,b) {
        return a[0] * b.x + a[1] * b.y + a[2] * b.z;
    }

    function resizeCanvasToDisplaySize() {
        const canvas = renderer.domElement;
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;

        renderer.setSize(width, height, false);
        
        bound_avg = bound_x + bound_y + bound_z;

        camera.left = bound_avg / - 2;
        camera.right = bound_avg  / 2;
        camera.top = ((height * bound_avg )/ width)/ 2;
        camera.bottom = ((height * bound_avg )/ width) / - 2;
        camera.updateProjectionMatrix(); 
    }

    function animate() {
        resizeCanvasToDisplaySize();
        requestAnimationFrame( animate );
        
        render();
    }
    
    function render() {
        renderer.render( scene, camera );
       
    }

    return data

};