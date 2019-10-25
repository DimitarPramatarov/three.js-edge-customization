
(function () {

	var pdf_files_length = 0;
	var api_token = "";

	function init(){
		// console.log("button listener set");
		// $('#uploadForm').on('change','#fileObject' , function(){ submitButtonHandler(); });
		// $('.post-results-container').hide();

		$.ajax({
			url: 'features.json',
			type: 'GET',
			method: 'get',
			contentType: false,
			processData: false,
			headers: {'Authorization': api_token},
			success: getDataSuccessHandler
		});

		function getDataSuccessHandler (jsonData) {
			var $data = $('#post-results-container .data');
			
			//reset the UI
			$data.html('');
	
			//jsonObj = JSON.parse(jsonData);
			jsonObj = jsonData;
			jsonObj['features']['thread_inputs'] = [];
			
			var output = ""
			
			for (var key in jsonObj) {
				switch (key) {
					case "features":
						output += "<h2 class='features'>FEATURES</h2>";
						output +=  "<div id='accordion'>";
						//Run through each feature
						for (var prop in jsonObj[key]) {
							var out = "";
							var hid = "header-" + prop;
							var cid = "collapse-" + prop;
	
							out += "<div class='card'>";
							out += "<div class='card-header' id='" + hid + "'>";
							out += "<h5 class='mb-0'>";
							out += "<button class='btn btn-link' data-toggle='collapse' data-target='#" + cid + "'aria-expanded='true' aria-controls='" + cid +"' id='btn-card'>";
							var feat_len = jsonObj[key][prop].length;
							if ((feat_len != 0) && (prop != "planes" && prop != "lines" && prop != "min_radius" && prop != "thin_walls" && prop != "round_slots" && prop != "square_slots" && prop != "pockets")) {
								out += prop + " - " + feat_len.toString();
								out += "</button>";
								out += "</h5>";
								out += "</div>";
	
								
								out += "<div id='" + cid + "' class='collapse' aria-labelledby='" + hid + "' data-parent='#accordion'>";
								out += "<div class='card-body'>";
	
								output += out;
	
								for (var f in jsonObj[key][prop]) {
									
									var obj_name = jsonObj[key][prop][f].type + " " + jsonObj[key][prop][f].ID.toString();
									var x = jsonObj[key][prop][f].position[0];
									var y = jsonObj[key][prop][f].position[1];
									var z = jsonObj[key][prop][f].position[2]; 
									var dx = jsonObj[key][prop][f].direction[0];
									var dy = jsonObj[key][prop][f].direction[1];
									var dz = jsonObj[key][prop][f].direction[2]; 
	
									output += "<div class='feature-container'>";
	
									output += "<button class='view-btn' onclick = 'View("+x+","+y+","+z+","+dx+","+dy+","+dz+",\"" + obj_name + "\")'>View</button>";
	
									if (prop == "holes") {
										output += "<div class='feature-name'>" + jsonObj[key][prop][f].ID + " - " + jsonObj[key][prop][f].type + "</div>";
										output += "<div class='feature-style'>Radius: <span id='fs'>" + jsonObj[key][prop][f].radius.toFixed(2) +" mm</span></div>";
										output += "<div class='feature-style2'>Depth: <span id='fs'>" + jsonObj[key][prop][f].depth.toFixed(2) +" mm</span></div>";
	
										// hole threading sizes
										var found_threads = jsonObj[key][prop][f].threads;
										var num_of_threads = found_threads.thread_size.length;
	
										if (num_of_threads != 0) {
											output +="<select id='hole-thread-selection-" + jsonObj[key][prop][f].ID + "' class='hole-thread' onchange='saveSelectionHole(" + jsonObj[key][prop][f].ID + ")'>";
											output += "<option value='" + jsonObj[key][prop][f].ID + "-No threads specified'>No threads specified</option>";
											for (th = 0; th < num_of_threads; th++) {
												if (jsonObj[key][prop][f].type == "step hole") {
													var value = found_threads.thread_size[th] + " (Max depth: " + found_threads.max_depth[th] + ")";
												}
												else if (jsonObj[key][prop][f].type == "through hole") {
													var value = found_threads.thread_size[th];
												}
												output +="<option value='" + jsonObj[key][prop][f].ID + "-" + value + "'>" + value + "</option>";
											}
											output +="</select>";
										}

	
									}
									else if (prop == "bosses") {
										output += "<div class='feature-name'>" + jsonObj[key][prop][f].ID + " - " + jsonObj[key][prop][f].type + "</div>";
										output += "<div class='feature-style'>Radius: <span id='fs'>" + jsonObj[key][prop][f].radius.toFixed(2) +" mm</span></div>";
										output += "<div class='feature-style2'>Depth: <span id='fs'>" + jsonObj[key][prop][f].depth.toFixed(2) +" mm</span></div>";

										// hole threading sizes
										var found_threads = jsonObj[key][prop][f].threads;
										var num_of_threads = found_threads.thread_size.length;
	
										if (num_of_threads != 0) {
											output +="<select id='boss-thread-selection-" + jsonObj[key][prop][f].ID + "' class='hole-thread' onchange='saveSelectionBoss(" + jsonObj[key][prop][f].ID + ")'>";
											output += "<option value='" + jsonObj[key][prop][f].ID + "-No threads specified'>No threads specified</option>";
											for (th = 0; th < num_of_threads; th++) {
												var value = found_threads.thread_size[th] + " (Max depth: " + found_threads.max_depth[th] + ")";
												output +="<option value='" + jsonObj[key][prop][f].ID + "-" + value + "'>" + value + "</option>";
											}
											output +="</select>";
										}

									}
	
			
									output += "</div>";
									
									output += "<br/>";
								}
								output += "</div>";
								output += "</div>";
							}
							output += "</div>";
						}
						output += "</div>";
				}
			}
				
			output += `<script>
			function View(x,y,z,dx,dy,dz,name) {
				var obj = scene.getObjectByName( name );
				if (feature_state == true) {
					camera.position.set(300,300,300); 
					camera.zoom = 1;
					camera.lookAt(0,0,0);
					camera.updateProjectionMatrix(); 
					obj.visible = false;
					step_model.material.opacity = 1.0;
					feature_state = false;
				}
				else {
					obj.visible = true; 
					step_model.material.opacity = 0.8;
					feature_state = true;
					
					/*camera.position.x = x;
					camera.position.y = y;
					camera.position.z = z; */
					
					var c = new THREE.Vector3();
					obj.geometry.computeBoundingBox();   
					center = geometry.boundingBox.getCenter(c);
	
					camera.position.x = center.x + 100 * dx;
					camera.position.y = center.y + 100 * (dy * Math.cos(0.523599) - dz * Math.sin(0.523599));
					camera.position.z = center.z + 100 * (dy * Math.sin(0.523599) + dz * Math.cos(0.523599)); 
					camera.lookAt(0,0,0);
					camera.translateZ( 100);
					camera.zoom = 1.5;
					camera.updateProjectionMatrix(); 
				} 
			}
			</script>`; 
	
			output += `<script>
			function saveSelectionHole(ID) {
				var x = document.getElementById("hole-thread-selection-" + ID.toString()).value;
				x = x.split('-')
				var hole_ID = x[0];
				var thread = x.slice(1).join('-');

				var curr_hole = jsonObj.features.holes[ID-1];

				var point = curr_hole.position;
				var dir = curr_hole.direction;
				var depth = curr_hole.depth;
				var xdir = curr_hole.xdirection;
				var radius = curr_hole.radius;

				if (depth < 5) {
					lamvda = 3*depth;
				}
				else if (depth < 15) {
					lamvda = 2*depth;
				}
				else {
					lamvda = depth;
				}

				var start_pnt = [point[0] + radius * xdir[0], point[1] + radius * xdir[1], point[2] + radius * xdir[2]];
				//var start_pnt = point;

				var geometry = new THREE.BufferGeometry();
				var positions = new Float32Array( [
					start_pnt[0], start_pnt[1], start_pnt[2],
					start_pnt[0] + lamvda * dir[0], start_pnt[1] + lamvda * dir[1], start_pnt[2] + lamvda * dir[2],
				] );
					
				geometry.addAttribute( 'position', new THREE.BufferAttribute( positions, 3 ) );
				line = new THREE.Line( geometry, new THREE.LineBasicMaterial( { color: 0x000000 } ) );
				scene.add(line);

				message = thread.split("(Max")[0];
				var thread_txt = new SpriteText(message);
				thread_txt.color = 'black';
				thread_txt.textHeight = ((bound_x+bound_y+bound_z)/4)/10;
				d = lamvda + ((bound_x+bound_y+bound_z)/4)/10;
				thread_txt.position.set(start_pnt[0] + d * dir[0], start_pnt[1] + d * dir[1], start_pnt[2] + d * dir[2]);
				scene.add(thread_txt);

				line_pnts = [
					[point[0], point[1], point[2]],
					[point[0] + lamvda * dir[0], point[1] + lamvda * dir[1], point[2] + lamvda * dir[2]],
				];
				jsonObj['features']['thread_inputs'].push({'hole_ID': hole_ID, 'thread_size': message, 'line_points': line_pnts, 'thread_dir': dir, 'text_position': [point[0] + d * dir[0], point[1] + d * dir[1], point[2] + d * dir[2]]});
					
			}
			</script>`; 

			output += `<script>
			function saveSelectionBoss(ID) {
				var x = document.getElementById("boss-thread-selection-" + ID.toString()).value;
				x = x.split('-')
				var boss_ID = x[0];
				var thread = x.slice(1).join('-');

				var numHoles = jsonObj.features.holes.length

				var curr_boss = jsonObj.features.bosses[ID-numHoles-1];

				var point = curr_boss.position;
				var dir = curr_boss.direction;
				var depth = curr_boss.depth;
				var xdir = curr_boss.xdirection;
				var radius = curr_boss.radius;

				if (depth < 5) {
					lamvda = 3*depth;
				}
				else if (depth < 15) {
					lamvda = 2*depth;
				}
				else {
					lamvda = depth;
				}

				var start_pnt = [point[0] + radius * xdir[0], point[1] + radius * xdir[1], point[2] + radius * xdir[2]];
				//var start_pnt = point;

				var geometry = new THREE.BufferGeometry();
				var positions = new Float32Array( [
					start_pnt[0], start_pnt[1], start_pnt[2],
					start_pnt[0] + lamvda * dir[0], start_pnt[1] + lamvda * dir[1], start_pnt[2] + lamvda * dir[2],
				] );
					
				geometry.addAttribute( 'position', new THREE.BufferAttribute( positions, 3 ) );
				line = new THREE.Line( geometry, new THREE.LineBasicMaterial( { color: 0x000000 } ) );
				scene.add(line);

				message = thread.split("(Max")[0];
				var thread_txt = new SpriteText(message);
				thread_txt.color = 'black';
				thread_txt.textHeight = ((bound_x+bound_y+bound_z)/4)/10;
				d = lamvda + ((bound_x+bound_y+bound_z)/4)/10;
				thread_txt.position.set(start_pnt[0] + d * dir[0], start_pnt[1] + d * dir[1], start_pnt[2] + d * dir[2]);
				scene.add(thread_txt);

				line_pnts = [
					[point[0], point[1], point[2]],
					[point[0] + lamvda * dir[0], point[1] + lamvda * dir[1], point[2] + lamvda * dir[2]],
				];
				jsonObj['features']['thread_inputs'].push({'boss_ID': boss_ID, 'thread_size': message, 'line_points': line_pnts, 'thread_dir': dir, 'text_position': [point[0] + d * dir[0], point[1] + d * dir[1], point[2] + d * dir[2]]});
					
			}
			</script>`; 

	
			//update display with data
			$data.append(output);
	
			render_parameters('preview.json', jsonObj, "api_token");
			// new_data = render_parameters(url_name + 'api/gserve/1/file/preview/' + uuid, jsonObj, api_token);

			// document.getElementById( 'save_inputs' ).addEventListener( 'click', function () {
			// 	$.ajax({
			// 		url: url_name + 'api/gserve/1/file/specification/' + uuid,
			// 		type: 'POST',
			// 		method: 'post',
			// 		data: JSON.stringify(new_data, null, 2),
			// 		contentType: false,
			// 		processData: false,
			// 		headers: {'Authorization': api_token},
			// 		success: getSpecSuccessHandler
			// 	});

			// 	function getSpecSuccessHandler() {
			// 		$.ajax({
			// 			url: url_name + 'api/gserve/1/file/specification/' + uuid,
			// 			type: 'GET',
			// 			method: 'get',
			// 			contentType: false,
			// 			headers: {'Authorization': api_token},
			// 			processData: false,
			// 		});
			// 	}
			   
				
			// } );

			// pdf_data = {"part_name":"test_file_000",
			// "revision":"A",
			// "id":"Q04579",
			// "date":"08/07/2019",
			// "material":"Metal - Aluminium - 6082 (Best for anodising)",
			// "surface_finish":"As Machined ",
			// "hole_threading":"",
			// "max_roughness":"Ra 3.2 (+5% fee)",
			// "min_tolerance":"+/- 0.127mm",
			// "accreditation_req":"Not required",
			// "notes":"","job_file":"https://app.geomiq.com/panel/vendor/job/detail?id=3236"}


			// document.getElementById( 'pdf' ).addEventListener( 'click', function () {
			// 	//obj_data = exportToObj( step_model );
			// 	if(window.location.hostname == "localhost") {
			// 		url_pdf = 'http://localhost/pdf/';
			// 	}
			// 	else if(window.location.hostname == "g-serve-test.geomiq.com") {
			// 		url_pdf = 'https://g-serve-test.geomiq.com/pdf/';
			// 	}
			// 	else if(window.location.hostname == "g-serve-2.geomiq.com") {
			// 		url_pdf = 'https://g-serve-2.geomiq.com/pdf/';
			// 	}
			// 	else {
			// 		url_pdf = 'https://' + window.location.hostname + '/pdf/';
			// 	}

			// 	$.ajax({
			// 		url: url_pdf + 'api/gserve/1/file/generate-pdf/' + uuid,
			// 		type: 'POST',
			// 		method: 'post',
			// 		data: JSON.stringify(pdf_data),
			// 		contentType: false,
			// 		headers: {'Authorization': api_token},
			// 		processData: false,
			// 	});

			// } );

			// // generate thumbnail
			// $.ajax({
			// 	url: url_name + 'api/gserve/1/file/thumbnail/' + uuid,
			// 	type: 'GET',
			// 	method: 'get',
			// 	contentType: false,
			// 	headers: {'Authorization': api_token},
			// 	processData: false,
			// });

			// /*

			// $.ajax({
			// 	url: url_name + 'api/gserve/1/file/status/' + 9000,
			// 	type: 'GET',
			// 	method: 'get',
			// 	contentType: false,
			// 	processData: false,
			// });

			// $.ajax({
			// 	url: url_name + 'api/gserve/1/file/status/' + 9001,
			// 	type: 'GET',
			// 	method: 'get',
			// 	contentType: false,
			// 	processData: false,
			// }); */
			
			// //show the display
			$('.post-results-container').fadeIn();
		};
	}
	/*
	function exportToObj(scene) {
		var exporter = new THREE.OBJExporter();
		var result = exporter.parse( scene );
		return result
	}*/

	function postErrorHandler () {
		//alert('Multi-body parts are not accepted!');
	}
   

	//init on document ready
	$(document).ready(init);
})();