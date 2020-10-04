function seconds_to_stamp(duration)
{   
    // Hours, minutes and seconds
    var hrs = ~~(duration / 3600);
    var mins = ~~((duration % 3600) / 60);
    var secs = ~~duration % 60;

    // Output like "1:01" or "4:03:59" or "123:03:59"
    var ret = "";

    if (hrs > 0) {
        ret += "" + hrs + ":" + (mins < 10 ? "0" : "");
    }

    ret += "" + mins + ":" + (secs < 10 ? "0" : "");
    ret += "" + secs;
    return ret;
}

function shuffleArray(array) { 
   for (var i = array.length - 1; i > 0; i--) {  
    
       // Generate random number  
       var j = Math.floor(Math.random() * (i + 1)); 
                    
       var temp = array[i]; 
       array[i] = array[j]; 
       array[j] = temp; 
   } 
        
   return array; 
}

function titleCase(str) {
	str = str.split(' ');
	for (var i = 0; i < str.length; i++) {
		str[i] = str[i].charAt(0).toUpperCase() + str[i].slice(1);
	}
	return str.join(' ');
}

function canUseWebP() {
	// BUG: This doesn't work for Firefox...

    var elem = document.createElement('canvas');

    if (!!(elem.getContext && elem.getContext('2d'))) {
        // was able or not to get WebP representation
        return elem.toDataURL('image/webp').indexOf('data:image/webp') == 0;
    }

    // very old browser like IE 8, canvas not supported
    return false;
}

function record_progress(username, token, uuid, timestamp) {
	var url = 'https://sixteenmm.org/progress/<username>/<token>/<uuid>/<timestamp>/json'
	.replace("<username>", username)
	.replace("<token>", token)
	.replace("<uuid>", uuid)
	.replace("<timestamp>", timestamp)

	fetch(url, {
		method: 'GET',
		mode: 'cors'}
	).then(response => response.json())
  	.then(function(data) {
  		// TODO: Check status code
  		console.log(data);
  	})
  	.catch(function(err) {
  		// TODO: Shit
  		console.log(err);
  	})
}

function video_tick() {
	var username = localStorage.getItem('username');
    var token = localStorage.getItem('token');

    if(!username || !token) {
    	return;
    }

    var el = document.getElementById('playingfilm');
    if(!!el) {
    	if(!el.paused) {
			record_progress(username, token, el.dataset.uuid, el.currentTime);

			var history_list = localStorage.getItem('history');
			if(!history_list) {
				history_list = [];
			} else {
				history_list = JSON.parse(history_list);
			}
			if(history_list[history_list.length - 1] != el.dataset.uuid) {
				history_list.push(el.dataset.uuid);
			}

			// Max history length
			while(history_list.length > 10) {
				history_list.shift();
			}

			localStorage.setItem('history', JSON.stringify(history_list));
		}
    }
}

function build_categories() {
	var username = localStorage.getItem('username');
    var token = localStorage.getItem('token');

    var el = document.getElementById('app');
	while(el.firstChild) {
    	el.removeChild(el.firstChild);
    }

    document.body.style.backgroundImage = '';
    document.body.style.backgroundColor = 'black';

    var nav = document.getElementById('nav');
    while(nav.firstChild) {
    	nav.removeChild(nav.firstChild);
    }

	var logout_button = document.createElement('button');
    logout_button.addEventListener('click', logout);
    logout_button.id = 'logout_button';
    logout_button.textContent = 'Logout';
    nav.appendChild(logout_button);

    var home_button = document.createElement('button');
    home_button.addEventListener('click', build_home);
    home_button.textContent = 'Home';
    nav.appendChild(home_button);

    document.title = "<title> | SIXTEENmm".replace("<title>", 'Categories');
    if(history.state.page != 'categories') {
    	history.pushState({page: "categories"}, 'Categories', "?page=categories");
    }

    fetch("https://sixteenmm.org/categories/json", {
    	mode: 'cors'
    }).then(response => response.json())
	.then(function(data) {
		if(data.status == 200) {
			var cats = data.categories;
			cats.sort();

			for(var cat_i = 0; cat_i < cats.length; cat_i++) {
				var category = cats[cat_i];
				var title = document.createElement('h1');
			    if(category == 'later') {
			    	title.textContent = 'Watch Later';
			    }
			    else if(category == 'history') {
			    	title.textContent = 'Watch History';
			    }
			    else {
			    	title.textContent = titleCase(category);
			    }
			    title.classList.add('title');
			    title.dataset.category = category;

			    title.addEventListener('click', function() {
			    	
			    	load_category(this.dataset.category);
			    });

			    var cat_results = document.createElement('ul');
    			cat_results.classList.add('horul');
    			cat_results.id = category.replace(" ", "_");

			    el.appendChild(title);
			    el.appendChild(cat_results);

			    // Fetch
			    fetch("https://sixteenmm.org/category/<category>/<username>/<token>/json"
				.replace("<category>", category)
				.replace("<username>", username)
				.replace("<token>", token), {
					mode: 'cors',
					cache: 'default'
				}).then(response => response.json())
				.then(function(data) {
					if(data.status == 200) {
						// Find our horul...
						var el = document.getElementById(data.category.replace(" ", "_"));

						// Change order
						data.data = shuffleArray(data.data);
						
						for(var ix = 0; ix < data.data.length && ix < 4; ix++) {
							var tmp = document.createElement('li');
							tmp.classList.add('film');
							tmp.dataset.uuid = data.data[ix].uuid;
							tmp.style.opacity = 0;

							tmp.addEventListener('click', function() {
								
								load_video(this.dataset.uuid);
							})

							var tmp_img = document.createElement('img');
							tmp_img.src = 'https://sixteenmm.org/cover/<uuid>'.replace('<uuid>', data.data[ix].uuid);
							tmp_img.style.display = 'none';
							tmp_img.addEventListener('load', function() {
								this.parentElement.style.opacity = 1;
								this.parentElement.classList.add('film', 'animate__animated', 'animate__fadeIn');

								this.style.display = 'block';
								this.classList.add('animate__animated', 'animate__fadeIn');
							});
							tmp.appendChild(tmp_img);

							var tmp_title = document.createElement('a');
							tmp_title.href = "?page=video&uuid=<uuid>".replace("<uuid>", data.data[ix].uuid);
							tmp_title.textContent = '<title> (<year>)'
							.replace("<title>", data.data[ix]['title'])
							.replace("<year>", data.data[ix].year);

							var tmp_title_wrapper = document.createElement('p');
							tmp_title_wrapper.appendChild(tmp_title);

							tmp.appendChild(tmp_title_wrapper);

							var tmp_desc = document.createElement('small')
							tmp_desc.textContent = data.data[ix].description;
							tmp.appendChild(tmp_desc);

							if(!!data.data[ix].progress) {
								var tmp_time = document.createElement('small');
								tmp_time.textContent = "<progress> / <runtime>"
								.replace("<progress>", seconds_to_stamp(data.data[ix].progress))
								.replace("<runtime>", seconds_to_stamp(data.data[ix].runtime));
							} else {
								var tmp_time = document.createElement('small');
								tmp_time.textContent = "<runtime>"
								.replace("<runtime>", seconds_to_stamp(data.data[ix].runtime));
							}
							tmp.appendChild(document.createElement('br'));
							tmp.appendChild(tmp_time);

							el.appendChild(tmp);
						}


						// Add a category view button...
						var tmp_empty = document.createElement('li');
						tmp_empty.textContent = 'More';
						tmp_empty.dataset.category = data.category;
						tmp_empty.classList.add('film', 'animate__animated', 'animate__fadeIn');
						tmp_empty.addEventListener('click', function() {
							
							load_category(this.dataset.category);
						})
						el.appendChild(tmp_empty);
					}
				})
				.catch(function(err) {
					// TODO: Err
					console.log(err);
				})
			}

		} else {
			load_login('Not logged in.');
		}
	})
	.catch(function(err) {
		// TODO: Crap
		console.log(err);
	});
}

function build_search(term) {
	// TODO: Default structure...
	term = term || '';

	var username = localStorage.getItem('username');
    var token = localStorage.getItem('token');

	fetch("https://sixteenmm.org/all/<username>/<token>/json"
	.replace("<username>", username)
	.replace("<token>", token), {
		mode: 'cors'
	}).then(response => response.json())
	.then(function(data) {
		if(data.status == 200) {
			localStorage.setItem("searchdata", JSON.stringify(data.all));
		} else {
			load_login('Not logged in.');
		}
	})
	.catch(function(err) {
		// TODO: Crap
		console.log(err);
	});

	// Build a live-updating search page

	var el = document.getElementById('app');
	while(el.firstChild) {
    	el.removeChild(el.firstChild);
    }

    document.body.style.backgroundImage = '';
    document.body.style.backgroundColor = 'black';

    var nav = document.getElementById('nav');
    while(nav.firstChild) {
    	nav.removeChild(nav.firstChild);
    }

	var logout_button = document.createElement('button');
    logout_button.addEventListener('click', logout);
    logout_button.id = 'logout_button';
    logout_button.textContent = 'Logout';
    nav.appendChild(logout_button);

    var home_button = document.createElement('button');
    home_button.addEventListener('click', build_home);
    home_button.textContent = 'Home';
    nav.appendChild(home_button);

    var input_search = document.createElement('input');
    input_search.value = term;
    input_search.id = 'input_search';

    var change_event = function() {
    	document.title = "<title> | SIXTEENmm".replace("<title>", 'Search - <term>'.replace("<term>", this.value));
    	history.replaceState({page: "search", "term": this.value}, "Search", "?page=search&term=<term>".replace("<term>", this.value));

    	var data = JSON.parse(localStorage.getItem("searchdata")) || [];

    	// Break into terms...
    	var terms = this.value.replace(/\W/g, ' ').toLowerCase().split(' ');

    	// Remove empty elements...
    	terms = terms.filter(Boolean);

    	// Remove duplicate terms...
    	var seen = {};
	    terms = terms.filter(function(item) {
	        return seen.hasOwnProperty(item) ? false : (seen[item] = true);
	    });

    	var results = [];

    	// Gather results
    	for(var term_i = 0; term_i < terms.length; term_i++) {
    		for(var search_i = 0; search_i < data.length; search_i++) {

    			var current_term = terms[term_i];

    			// Check if we have a year...
    			if(!isNaN(current_term)) {
    				if(parseInt(current_term) == data[search_i].year) {
    					results.push(data[search_i]);
    				}
    			}

    			// Search the title
    			if(data[search_i].title.toLowerCase().indexOf(current_term) !== -1) {
    				results.push(data[search_i]);
    			}

    			// Search UUID for sociopaths
    			if(data[search_i].uuid.toLowerCase().indexOf(current_term) !== -1) {
    				results.push(data[search_i]);
    			}

	    		// Search genres
	    		for(var genre_i = 0; genre_i < data[search_i].genres.length; genre_i++) {
	    			var current_genre = data[search_i].genres[genre_i];
	    			if(current_genre.toLowerCase().indexOf(current_term) !== -1) {
	    				results.push(data[search_i]);
	    			}
	    		}

	    		// Search the description
    			if(data[search_i].description.toLowerCase().indexOf(current_term) !== -1) {
    				results.push(data[search_i]);
    			}
	    	}
    	}

    	// TODO: Weight results
    	var weighted_results = results.reduce(function(count, item){
		    if(typeof count[item.uuid] !== "undefined"){
		      count[item.uuid]++; 
		      return count;
		    } else {
		        count[item.uuid] = 1; 
		        return count;
		    }
		}, {});

		var new_results = []

		for(var key in weighted_results) {
			new_results.push(key);
		}

		// Remove duplicate terms...
    	var seen = {};
	    new_results = new_results.filter(function(item) {
	        return seen.hasOwnProperty(item) ? false : (seen[item] = true);
	    });

	    // Sort UUIDs by weight...
	    new_results.sort(function(a, b) {
			return weighted_results[a] < weighted_results[b];
		});

		// Build the final array of results...
		var final_results = [];
		for(var res_i = 0; res_i < new_results.length; res_i++) {
			for(var act_i = 0; act_i < results.length; act_i++) {
				if(new_results[res_i] == results[act_i].uuid) {
					final_results.push(results[act_i]);
				}
			}
		}

		// Remove duplicate terms...
    	var seen = {};
	    final_results = final_results.filter(function(item) {
	        return seen.hasOwnProperty(item.uuid) ? false : (seen[item.uuid] = true);
	    });
		
		results = final_results;

    	var res_el = document.getElementById('search_results');
    	while(res_el.firstChild) {
    		res_el.removeChild(res_el.firstChild);
    	}

    	for(var item_i = 0; item_i < results.length; item_i++) {
			// Create children cards...
			var tmp = document.createElement('li');
			tmp.classList.add('film');
			tmp.dataset.uuid = results[item_i].uuid;
			tmp.style.opacity = 0;

			tmp.addEventListener('click', function() {
				
				load_video(this.dataset.uuid);
			})

			var tmp_img = document.createElement('img');
			tmp_img.src = 'https://sixteenmm.org/cover/<uuid>'.replace('<uuid>', results[item_i].uuid);
			tmp_img.style.display = 'none';
			tmp_img.addEventListener('load', function() {
				this.parentElement.style.opacity = 1;
				this.parentElement.classList.add('film', 'animate__animated', 'animate__fadeIn');

				this.style.display = 'block';
				this.classList.add('animate__animated', 'animate__fadeIn');
			});
			tmp.appendChild(tmp_img);

			var tmp_title = document.createElement('a');
			tmp_title.href = "?page=video&uuid=<uuid>".replace("<uuid>", results[item_i].uuid);
			tmp_title.textContent = '<title> (<year>)'
			.replace("<title>", results[item_i]['title'])
			.replace("<year>", results[item_i].year);

			var tmp_title_wrapper = document.createElement('p');
			tmp_title_wrapper.appendChild(tmp_title);

			tmp.appendChild(tmp_title_wrapper);

			var tmp_desc = document.createElement('small')
			tmp_desc.textContent = results[item_i].description;
			tmp.appendChild(tmp_desc);

			if(!!results[item_i].progress) {
				var tmp_time = document.createElement('small');
				tmp_time.textContent = "<progress> / <runtime>"
				.replace("<progress>", seconds_to_stamp(results[item_i].progress))
				.replace("<runtime>", seconds_to_stamp(results[item_i].runtime));

				tmp.appendChild(tmp_time);
			}

			res_el.appendChild(tmp);
    	}
    }

    input_search.addEventListener('change', change_event);

    input_search.dataset.typing_timer;
    input_search.dataset.value = '';
    input_search.addEventListener('keyup', function() {
    	clearTimeout(this.dataset.typing_timer);
    	this.dataset.typing_timer = setTimeout(function() {
    		var el = document.getElementById('input_search');
    		if ("createEvent" in document) {
				var evt = document.createEvent("HTMLEvents");
					evt.initEvent("change", false, true);
					el.dispatchEvent(evt);
				} else {
					el.fireEvent("onchange");
				}
    	}, 700);
    });

    el.appendChild(input_search);

    var search_results = document.createElement('ul');
    search_results.classList.add('horul');
    search_results.id = 'search_results';
    el.appendChild(search_results);

    // Fire initial event
    if ("createEvent" in document) {
    	var evt = document.createEvent("HTMLEvents");
    	evt.initEvent("change", false, true);
    	input_search.dispatchEvent(evt);
	} else {
		input_search.fireEvent("onchange");
	}
}

function load_series(uuid) {
	var username = localStorage.getItem('username');
    var token = localStorage.getItem('token');

	var el = document.getElementById('app');
	while(el.firstChild) {
    	el.removeChild(el.firstChild);
    }

    document.body.style.backgroundImage = '';
    document.body.style.backgroundColor = 'black';

    // TODO: Generate a video page.
    var nav = document.getElementById('nav');
    while(nav.firstChild) {
    	nav.removeChild(nav.firstChild);
    }

    var logout_button = document.createElement('button');
    logout_button.addEventListener('click', logout);
    logout_button.id = 'logout_button';
    logout_button.textContent = 'Logout';
    nav.appendChild(logout_button);

    var home_button = document.createElement('button');
    home_button.addEventListener('click', build_home);
    home_button.textContent = 'Home';
    nav.appendChild(home_button);

    fetch('https://sixteenmm.org/getuuid/<username>/<token>/<uuid>/json'.replace("<username>", username)
		.replace("<token>", token)
		.replace("<uuid>", uuid), {
			method: 'GET',
			mode: 'cors'
		}).then(response => response.json())
  		.then(function(data) {
  			if(data.status == 403) {
  				load_login('Not logged in.');
  			} else if(data.status == 404) {
  				// Video not found
  				return build_home();
  			} else {
  				var title = data.title;
  				var description = data.description;
  				var subtitles = data.subs;
  				document.title = "<title> | SIXTEENmm".replace("<title>", title);
  				if(history.state.page != 'series' && history.state.uuid != 'uuid') {
  					history.pushState({page: "series", "uuid": uuid}, title, "?page=series&uuid=<uuid>".replace("<uuid>", uuid));
  				}

				var collection = document.createElement('ul');
				collection.classList.add('horul');
  				for(var i = 0; i < data.children.length; i++) {
  					// Create children cards...
  					var tmp = document.createElement('li');
					tmp.classList.add('film');
					tmp.dataset.uuid = data.children[i].uuid;
					tmp.style.opacity = 0;

					tmp.addEventListener('click', function() {
						
						load_video(this.dataset.uuid);
					})

					var tmp_img = document.createElement('img');
					tmp_img.src = 'https://sixteenmm.org/cover/<uuid>'.replace('<uuid>', data.children[i].uuid);
					tmp_img.style.display = 'none';
					tmp_img.addEventListener('load', function() {
						this.parentElement.style.opacity = 1;
						this.parentElement.classList.add('film', 'animate__animated', 'animate__fadeIn');

						this.style.display = 'block';
						this.classList.add('animate__animated', 'animate__fadeIn');
					});
					tmp.appendChild(tmp_img);

					var tmp_title = document.createElement('a');
					tmp_title.href = "?page=video&uuid=<uuid>".replace("<uuid>", data.children[i].uuid);
					tmp_title.textContent = '(<episode>) <title> (<year>)'.replace("<title>", data.children[i]['episode title'])
					.replace("<year>", data.children[i].year)
					.replace("<episode>", data.children[i].episode);

					var tmp_title_wrapper = document.createElement('p');
					tmp_title_wrapper.appendChild(tmp_title);

					tmp.appendChild(tmp_title_wrapper);

					var tmp_desc = document.createElement('small')
					tmp_desc.textContent = data.children[i].description;
					tmp.appendChild(tmp_desc);

					if(!!data.children[i].progress) {
						var tmp_time = document.createElement('small');
						tmp_time.textContent = "<progress> / <runtime>"
						.replace("<progress>", seconds_to_stamp(data.children[i].progress))
						.replace("<runtime>", seconds_to_stamp(data.children[i].runtime));

						tmp.appendChild(tmp_time);
					}

					collection.appendChild(tmp);
  				}

  				document.getElementById('app').appendChild(collection);
  			}
  		})
  		.catch(function(err){
  			// TODO: Crap.
  			console.log(err);
  		});
}

function load_video(uuid) {
	var username = localStorage.getItem('username');
    var token = localStorage.getItem('token');

	var el = document.getElementById('app');
	while(el.firstChild) {
    	el.removeChild(el.firstChild);
    }

    document.body.style.backgroundImage = '';
    document.body.style.backgroundColor = 'black';

    var nav = document.getElementById('nav');
    while(nav.firstChild) {
    	nav.removeChild(nav.firstChild);
    }

    var logout_button = document.createElement('button');
    logout_button.addEventListener('click', logout);
    logout_button.id = 'logout_button';
    logout_button.textContent = 'Logout';
    nav.appendChild(logout_button);

    var home_button = document.createElement('button');
    home_button.addEventListener('click', build_home);
    home_button.textContent = 'Home';
    nav.appendChild(home_button);

	fetch('https://sixteenmm.org/getuuid/<username>/<token>/<uuid>/json'.replace("<username>", username)
		.replace("<token>", token)
		.replace("<uuid>", uuid), {
			method: 'GET',
			cache: "default",
			mode: 'cors'
		}).then(response => response.json())
  		.then(function(data) {
  			if(data.status == 403) {
  				load_login('Not logged in.');
  			} else if(data.status == 404) {
  				// Video not found
  				return build_home();
  			} else {
  				var title = data.title;
  				var description = data.description;
  				var subtitles = data.subs;

  				// Check if series!
  				if(data.genres.includes('series')) {
  					load_series(uuid);
  					return;
  				} else {
  					document.title = "<title> | SIXTEENmm".replace("<title>", title);
  					if(history.state.page != 'video' && history.state.uuid != uuid) {
  						history.pushState({page: "video", "uuid": uuid}, title, "?page=video&uuid=<uuid>".replace("<uuid>", uuid));
  					}
  				}

  				var video = document.createElement('video');
  				video.classList.add('animate__animated', 'animate__fadeInUp', 'video_watch');
				video.controls = true;
				video.autoplay = true;
				video.cover = 'https://sixteenmm.org/gcover/<uuid>'.replace("<uuid>", uuid);
				video.id = 'playingfilm';
				video.dataset.uuid = uuid;

				// Set up to record playback history
				setInterval(video_tick, 30000);

				// Check for starting time
				var progress = data.progress || 0;
				var total_time = data.runtime;
				if(progress / total_time < 0.9) {
					video.currentTime = progress;	
				}

				var source1 = document.createElement("source");
				source1.src = "https://sixteenmm.org/video/<username>/<token>/<uuid>.webm".replace("<uuid>", uuid)
				.replace("<username>", username)
				.replace("<token>", token);
				var source2 = document.createElement("source");
				source2.src = "https://sixteenmm.org/video/<username>/<token>/<uuid>.mp4".replace("<uuid>", uuid)
				.replace("<username>", username)
				.replace("<token>", token);
				var source3 = document.createElement("source");
				source3.src = "https://sixteenmm.org/video/<username>/<token>/<uuid>.ogv".replace("<uuid>", uuid)
				.replace("<username>", username)
				.replace("<token>", token);

				// Add them so they _may_ begin loading before we're done making the video element
				video.appendChild(source1);
				video.appendChild(source2);
				video.appendChild(source3);

				// Add any subtitle tracks
				if(!!subtitles) {
					for(ix = 0; ix < subtitles.length; ix++) {
						var subtitle_track = document.createElement("track");
						subtitle_track.src = 'https://sixteenmm.org/subtitles/<uuid>/<lang>'
						.replace("<uuid>", uuid)
						.replace("<lang>", subtitles[ix]);
						video.appendChild(subtitle_track);
					}
				}

				// Check for next/previous episodes and/or history
				    var next_ep = data['next episode'];
				    var prev_ep = data['previous episode'];

				    if(!!prev_ep) {
				    	// Add Previous Episode button
				    	video.dataset.prev = prev_ep;

				    	var previous_button = document.createElement('button');
				    	previous_button.dataset.uuid = prev_ep;
				    	previous_button.addEventListener('click', function() {
				    		
				    		load_video(this.dataset.uuid);
				    	});
				    	previous_button.textContent = 'Previous';
				    	nav.appendChild(previous_button);
				    } else {
				    	var previous_button = document.createElement('button');
				    	previous_button.textContent = '-----';

				    	// Check local history and add last watched here...
				    	var history_list = localStorage.getItem('history');
						if(!history_list) {
							history_list = [];
						} else {
							history_list = JSON.parse(history_list);
						}
						if(!!history_list[history_list.length - 2] && history_list[history_list.length - 2] != uuid) {
							previous_button.dataset.uuid = history_list[history_list.length - 2];
							previous_button.addEventListener('click', function() {
				    			load_video(this.dataset.uuid);
				    		});
				    		previous_button.textContent = 'Previous';
						}

						nav.appendChild(previous_button);
				    }

				    if(!!next_ep) {
				    	video.dataset.next = next_ep;

				    	// Allow disabling autoplay
				    	video.addEventListener('ended', function() {
				    		if(document.getElementById('autoplay_button').checked) {
				    			load_video(this.dataset.next);
				    		}
				    	});

				    	// Add Next Episode button
				    	var next_button = document.createElement('button');
				    	next_button.dataset.uuid = next_ep;
				    	next_button.addEventListener('click', function() {
				    		
				    		load_video(this.dataset.uuid);
				    	});
				    	next_button.textContent = 'Next';
				    	nav.appendChild(next_button);
				    } else {
				    	var next_button = document.createElement('button');
				    	next_button.textContent = '---';

				    	// Check local history and add last watched here...
				    	var history_list = localStorage.getItem('history');
						if(!history_list) {
							history_list = [];
						} else {
							history_list = JSON.parse(history_list);
						}
						if(!!history_list[history_list.length - 1] && history_list[history_list.length - 1] != uuid) {
							next_button.dataset.uuid = history_list[history_list.length - 1];
							next_button.addEventListener('click', function() {
				    			load_video(this.dataset.uuid);
				    		});
				    		next_button.textContent = 'Next';
						}

				    	nav.appendChild(next_button);
				    }

				if(data.kind == 'episode') {
					// Add a button to go back to episode listing...
					var series_button = document.createElement('button');
				    series_button.addEventListener('click', function() {
				    	
				    	load_series(data['series uuid']);
				    });
				    series_button.textContent = 'Episodes';
				    nav.appendChild(series_button);
				}

				// Allow restoring volume
				var vol = localStorage.getItem('volume') || 1;
				video.volume = vol;

				// Allow saving volume
				video.addEventListener('volumechange', function() {
					localStorage.setItem('volume', this.volume);
				});

				video.addEventListener('animationend', function() {
  					this.scrollIntoView();
  				});

  				// TODO: Add any more info we want to the page...

  				el.appendChild(video);

  				// Set up autoplay control
  				var autoplay_label = document.createElement('label');
  				autoplay_label.for = 'autoplay_button';
  				autoplay_label.textContent = 'Autoplay Next:';

  				var autoplay_button = document.createElement('input');
  				autoplay_button.type = 'checkbox';
  				autoplay_button.id = 'autoplay_button';
  				// Set checked according to a localStorage value...
  				if(localStorage.getItem('autoplay') == 'true') {
  					autoplay_button.checked = true;
  				}

  				// Anytime autoplay changes, store it...
  				autoplay_button.addEventListener('change', function() {
  					if(this.checked) {
  						localStorage.setItem('autoplay', true);
  					} else {
  						localStorage.setItem('autoplay', false);
  					}
  				});

  				el.appendChild(autoplay_label);
  				el.appendChild(autoplay_button);

  				// Download button
  				var download_button = document.createElement('button');
  				download_button.id = 'download_button';
  				download_button.textContent = 'Download';
  				download_button.dataset.uuid = uuid;
  				download_button.dataset.title = title;
  				download_button.addEventListener('click', function() {
  					var username = localStorage.getItem('username');
    				var token = localStorage.getItem('token');

  					var uri = 'https://sixteenmm.org/download/<username>/<token>/<uuid>'
  					.replace('<username>', username)
  					.replace('<token>', token)
  					.replace('<uuid>', this.dataset.uuid);

  					var tmp_item = document.createElement('a');
  					tmp_item.href = uri;
  					tmp_item.download = this.dataset.title + '.mp4';
  					// FF requires adding to body before simulating click:
  					document.body.appendChild(tmp_item);
					tmp_item.click();
					document.body.removeChild(tmp_item);
  				});

  				el.appendChild(download_button);
  			}
  		})
  		.catch(function(err){
  			// TODO: Crap.
  			console.log(err);
  		});
}

function logout() {
	localStorage.clear();
	window.location.reload(false);
}

function load_login(err) {
	var nav = document.getElementById('nav');
    while(nav.firstChild) {
    	nav.removeChild(nav.firstChild);
    }

	var el = document.getElementById('app');
	while(el.firstChild) {
    	el.removeChild(el.firstChild);
	}
	el.textContent = 'Loading...';

	// Set the background
	if(canUseWebP()) {
		document.body.style.backgroundImage = "url('https://sixteenmm.org/cstatic/img/back.webp')";
	} else {
		document.body.style.backgroundImage = "url('https://sixteenmm.org/cstatic/img/back.jpg')";
	}
	// Get what we need for waiting on the background...
	var bg_url = document.body.style.backgroundImage.match(/\((.*?)\)/)[1].replace(/('|")/g,'');

	document.title = "SIXTEENmm";
	if(history.state.page != 'login') {
		history.pushState({page: "login"}, document.title, "?page=login");
	}

	if(!!err) {
		var err_message = document.createElement('small');
		err_message.textContent = "Error: <error>"
		.replace("<error>", err);
		el.appendChild(err_message);
	}

	// Generate login form
	var username_input_hint = document.createElement('label');
	username_input_hint.for = 'username_input';
	username_input_hint.textContent = 'Username:';

	var username_input = document.createElement('input');
	username_input.id = 'username_input';
	username_input.name = 'username_input';

	var password_input_hint = document.createElement('label');
	password_input_hint.for = 'password_input';
	password_input_hint.textContent = 'Password:';

	var password_input = document.createElement('input');
	password_input.type = 'password';
	password_input.id = 'password_input';
	password_input.name = 'password_input';
	password_input.addEventListener("keyup", function(event) {
		if(event.keyCode === 13) {
			document.getElementById('login_submit').click();
		}
	});

	var login_submit = document.createElement('button');
	login_submit.id = 'login_submit';
	login_submit.textContent = 'Login';

	login_submit.addEventListener('click', function() {
		var username = document.getElementById('username_input').value;
		var password = document.getElementById('password_input').value;

		var data = new URLSearchParams();
		data.append('user', username);
		data.append('passw', password);

		fetch('https://sixteenmm.org/login/json', {
			headers: {'Content-Type': 'application/x-www-form-urlencoded'},
			method: 'POST',
			cache: 'no-cache',
			mode: 'cors',
			body: data
		}).then(response => response.json())
  		.then(function(data) {
  			if(data.status != 200) {
  				// Failed login.
  				login_submit.setAttributeNS(null, 'class', '');
  				login_submit.classList.add('animate__animated', 'animate__flash', 'error');
  				login_submit.addEventListener('animationend', function() {
  					login_submit.setAttributeNS(null, 'class', '');
  				});

  				var username_input = document.getElementById('username_input');
				username_input.setAttributeNS(null, 'class', '');
  				username_input.classList.add('animate__animated', 'animate__shakeX', 'error');
  				username_input.addEventListener('animationend', function() {
  					username_input.setAttributeNS(null, 'class', '');
  				});

  				var password_input = document.getElementById('password_input');
  				password_input.setAttributeNS(null, 'class', '');
  				password_input.classList.add('animate__animated', 'animate__shakeX', 'error');
  				password_input.value = '';
  				password_input.addEventListener('animationend', function() {
  					password_input.setAttributeNS(null, 'class', '');
  				});
  			} else {
  				var token = data.token;
  				login(username, token);
  			}
  		})
  		.catch(function(err) {
  			// TODO: Oh, shit.
  			console.log(err);
  		})
	})

	// Make the title
	var title = document.createElement('h1');
	title.textContent = 'SIXTEENmm';
	title.id = 'site_title';
	title.classList.add('animate__animated', 'animate__flipInX');

	// Fetch some preview tiles
	var data_pack = document.createElement('div');
	fetch('https://sixteenmm.org/preview/json', {
		cache: "default",
		mode: 'cors'
	}).then(response => response.json())
	.then(function(data) {
		if(data.status != 200) {
			// Shouldn't reach here... But if it does...
			load_login('Not logged in.');
		} else {
			var inject_text = document.createElement('small');
			inject_text.textContent = 'Enjoy this full film from our collection as a preview.';
			inject_text.classList.add('inject_text');
			data_pack.appendChild(inject_text);

			var example_video = document.createElement('video');
			example_video.classList.add('animate__animated', 'animate__fadeInUp');
			example_video.controls = true;
			example_video.cover = 'https://sixteenmm.org/gcover/<uuid>'.replace("<uuid>", data.example.uuid);

			var source1 = document.createElement("source");
			source1.src = "https://sixteenmm.org/preview/<uuid>/webm".replace("<uuid>", data.example.uuid);
			var source2 = document.createElement("source");
			source2.src = "https://sixteenmm.org/preview/<uuid>/mp4".replace("<uuid>", data.example.uuid);
			var source3 = document.createElement("source");
			source3.src = "https://sixteenmm.org/preview/<uuid>/ogv".replace("<uuid>", data.example.uuid);

			example_video.appendChild(source1);
			example_video.appendChild(source2);
			example_video.appendChild(source3);

			data_pack.appendChild(example_video);

			// Visible metadata for the example video

			var example_video_title = document.createElement('h3');
			example_video_title.textContent = "<title> (<year>)".replace("<title>", data.example.title).replace("<year>", data.example.year);
			example_video_title.classList.add('title');
			data_pack.appendChild(example_video_title);

			var example_video_description = document.createElement('p');
			example_video_description.textContent = data.example.description;
			example_video_description.classList.add('video_description');
			data_pack.appendChild(example_video_description);

			var sign_up_link = document.createElement('a');
			sign_up_link.textContent = 'Signup';
			sign_up_link.href = 'https://sixteenmm.org/signup';
			sign_up_link.style.textAlign = 'center';
			sign_up_link.style.display = 'block';
			data_pack.appendChild(sign_up_link)

			// Add a title for the preview tiles
			var preview_title = document.createElement('h2');
			preview_title.textContent = "From our <category> category:".replace("<category>", titleCase(data.preview_title));
			data_pack.appendChild(preview_title);

			var preview_items = document.createElement('ul');
			preview_items.classList.add('horul');
			preview_items.classList.add('preview_panel');
			
			for(var i = 0; i < data.preview.length; i++) {
				var pack = document.createElement('li');

				var pack_title = document.createElement('h4');
				pack_title.textContent = '<title> (<year>)'.replace("<title>", data.preview[i].title).replace("<year>", data.preview[i].year);

				var pack_link = document.createElement('a');
				pack_link.href="?page=video&uuid=<uuid>".replace("<uuid>", data.preview[i].uuid);
				pack_link.dataset.uuid = data.preview[i].uuid;
				
				pack_link.addEventListener('click', function() {
					
					load_video(this.dataset.uuid);
				});

				var pack_img = document.createElement('img');
				pack_img.src = 'https://sixteenmm.org/cover/<uuid>'.replace('<uuid>', data.preview[i].uuid);

				pack_link.appendChild(pack_img);

				pack.appendChild(pack_title);
				pack.appendChild(pack_link);
				preview_items.appendChild(pack);
			}
			data_pack.appendChild(preview_items);
		}
	})
	.catch(function(err) {
		// TODO: Oh, shit.
		console.log(err);
	})

	el.textContent = '';
	el.appendChild(username_input_hint);
	el.appendChild(username_input);
	el.appendChild(password_input_hint);
	el.appendChild(password_input);
	el.appendChild(login_submit);
	el.appendChild(title);
	el.appendChild(data_pack);
}

function load_category(category) {
	var username = localStorage.getItem('username');
    var token = localStorage.getItem('token');

	var el = document.getElementById('app');
	while(el.firstChild) {
    	el.removeChild(el.firstChild);
    }

    document.body.style.backgroundImage = '';
    document.body.style.backgroundColor = 'black';

    var nav = document.getElementById('nav');
    while(nav.firstChild) {
    	nav.removeChild(nav.firstChild);
    }

	var logout_button = document.createElement('button');
    logout_button.addEventListener('click', logout);
    logout_button.id = 'logout_button';
    logout_button.textContent = 'Logout';
    nav.appendChild(logout_button);

    var home_button = document.createElement('button');
    home_button.addEventListener('click', build_home);
    home_button.textContent = 'Home';
    nav.appendChild(home_button);

    var title = document.createElement('h1');
    if(category == 'later') {
    	title.textContent = 'Watch Later';
    }
    else if(category == 'history') {
    	title.textContent = 'Watch History';
    }
    else {
    	title.textContent = titleCase(category);
    }
    title.classList.add('title');
    nav.appendChild(title);
    
    fetch("https://sixteenmm.org/category/<category>/<username>/<token>/json"
	.replace("<category>", category)
	.replace("<username>", username)
	.replace("<token>", token), {
		mode: 'cors'
	}).then(response => response.json())
	.then(function(data) {

		if(data.status != 200) {
			load_login('Not logged in.');
		} else {
			if(!!data.data && data.data.length != 0) {
				var data_pack = document.createElement('ul');
				data_pack.classList.add('horul');

				for(var i = 0; i < data.data.length; i++) {
					var tmp = document.createElement('li');

					tmp.style.opacity = 0;
					tmp.dataset.uuid = data.data[i].uuid;

					tmp.addEventListener('click', function() {
						
						load_video(this.dataset.uuid);
					})

					var tmp_img = document.createElement('img');
					tmp_img.src = 'https://sixteenmm.org/cover/<uuid>'.replace('<uuid>', data.data[i].uuid);
					tmp_img.style.display = 'none';
					tmp_img.addEventListener('load', function() {
						this.parentElement.style.opacity = 1;
						this.parentElement.classList.add('film', 'animate__animated', 'animate__fadeIn');

						this.style.display = 'block';
						this.classList.add('animate__animated', 'animate__fadeIn');
					});
					tmp.appendChild(tmp_img);	

					var tmp_title = document.createElement('a');
					tmp_title.href = "?page=video&uuid=<uuid>".replace("<uuid>", data.data[i].uuid);
					tmp_title.textContent = '<title> (<year>)'
					.replace("<title>", data.data[i].title)
					.replace("<year>", data.data[i].year);

					var tmp_title_wrapper = document.createElement('p');
					tmp_title_wrapper.appendChild(tmp_title);

					tmp.appendChild(tmp_title_wrapper);

					var tmp_desc = document.createElement('small')
					tmp_desc.textContent = data.data[i].description;
					tmp.appendChild(tmp_desc);

					tmp.appendChild(document.createElement('br'));
					if(!!data.data[i].progress) {
						var tmp_time = document.createElement('small');
						tmp_time.textContent = "<progress> / <runtime>"
						.replace("<progress>", seconds_to_stamp(data.data[i].progress))
						.replace("<runtime>", seconds_to_stamp(data.data[i].runtime));

						tmp.appendChild(tmp_time);
					} else {
						var tmp_time = document.createElement('small');
						tmp_time.textContent = "<runtime>"
						.replace("<runtime>", seconds_to_stamp(data.data[i].runtime));
						tmp.appendChild(tmp_time);
					}

					data_pack.appendChild(tmp);
				}

				el.appendChild(data_pack);
			} else {
				var inform = document.createElement('p');
				inform.textContent = "No films found for category: <category>".replace("<category>", category);
				el.appendChild(inform);
			}
		}
	})
	.catch(function(err) {
		// TODO: Shit
		console.log(err);
	})

	var title = titleCase(category);
	document.title = "<title> | SIXTEENmm".replace("<title>", title);
	if(history.state.page != 'category' && history.state.category != category) {
		history.pushState({page: "category", "category": category}, title, "?page=category&category=<category>".replace("<category>", category));
	}
}

function build_home() {
	var el = document.getElementById('app');
	while(el.firstChild) {
    	el.removeChild(el.firstChild);
    }

    document.body.style.backgroundImage = '';
    document.body.style.backgroundColor = 'black';

    document.title = "<title> | SIXTEENmm".replace("<title>", 'Home');
    if(history.state.page != 'home') {
    	history.pushState({page: "home"}, "Home", "?page=home");
    }

    // Generate a home page.
    var nav = document.getElementById('nav');
    while(nav.firstChild) {
    	nav.removeChild(nav.firstChild);
    }

    var logout_button = document.createElement('button');
    logout_button.addEventListener('click', logout);
    logout_button.id = 'logout_button';
    logout_button.textContent = 'Logout';
    nav.appendChild(logout_button);

    var home_button = document.createElement('button');
    home_button.addEventListener('click', build_home);
    home_button.textContent = 'Home';
    nav.appendChild(home_button);

    var new_button = document.createElement('button');
    new_button.addEventListener('click', function() {
    	
    	load_category('new');
    });
    new_button.textContent = 'New';
    nav.appendChild(new_button);

    var later_button = document.createElement('button');
    later_button.addEventListener('click', function() {
    	
    	load_category('later');
    });
    later_button.textContent = 'Watch Later';
    nav.appendChild(later_button);

    var history_button = document.createElement('button');
    history_button.addEventListener('click', function() {
    	
    	load_category('history');
    });
    history_button.textContent = 'Watch History';
    nav.appendChild(history_button);

    var search_button = document.createElement('button');
    search_button.addEventListener('click', function() {
    	
    	build_search();
    });
    search_button.textContent = 'Search';
    nav.appendChild(search_button);

    var username = localStorage.getItem('username');
    var token = localStorage.getItem('token');

    var video_pack = document.createElement('div');

    fetch('https://sixteenmm.org/home/<username>/<token>/json'.replace('<username>', username).replace('<token>', token), {
		headers: {'Content-Type': 'application/x-www-form-urlencoded'},
		mode: 'cors'
	}).then(response => response.json())
	.then(function(data) {
		if(data.status !== 200) {
			// Login failure!
			load_login('Not logged in.');
		} else {

			// New videos...
			data.new = shuffleArray(data.new);

			var new_title = document.createElement('h2');
			new_title.textContent = 'New';
			new_title.classList.add('title');
			new_title.dataset.category = 'new';
			new_title.addEventListener('click', function() {
				
				return load_category(this.dataset.category);
			})
			video_pack.appendChild(new_title);

			var new_collection = document.createElement('ul');
			new_collection.classList.add('horul');
			for(var i = 0; i < data.new.length && i < 4; i++) {
				var tmp = document.createElement('li');
				tmp.style.opacity = 0;
				tmp.dataset.uuid = data.new[i].uuid;

				tmp.addEventListener('click', function() {
					
					load_video(this.dataset.uuid);
				})

				var tmp_img = document.createElement('img');
				tmp_img.src = 'https://sixteenmm.org/cover/<uuid>'.replace('<uuid>', data.new[i].uuid);
				tmp_img.style.display = 'none';
				tmp_img.addEventListener('load', function() {
					this.parentElement.style.opacity = 1;
					this.parentElement.classList.add('film', 'animate__animated', 'animate__fadeIn');

					this.style.display = 'block';
					this.classList.add('animate__animated', 'animate__fadeIn');
				});

				tmp.appendChild(tmp_img);	

				var tmp_title = document.createElement('a');
				tmp_title.href = "?page=video&uuid=<uuid>".replace("<uuid>", data.new[i].uuid);
				tmp_title.textContent = '<title> (<year>)'
				.replace("<title>", data.new[i].title)
				.replace("<year>", data.new[i].year);

				var tmp_title_wrapper = document.createElement('p');
				tmp_title_wrapper.appendChild(tmp_title);

				tmp.appendChild(tmp_title_wrapper);

				var tmp_desc = document.createElement('small')
				tmp_desc.textContent = data.new[i].description;
				tmp.appendChild(tmp_desc);

				tmp.appendChild(document.createElement('br'));
				if(!!data.new[i].progress) {
					var tmp_time = document.createElement('small');
					tmp_time.textContent = "<progress> / <runtime>"
					.replace("<progress>", seconds_to_stamp(data.new[i].progress))
					.replace("<runtime>", seconds_to_stamp(data.new[i].runtime));

					tmp.appendChild(tmp_time);
				} else {
					var tmp_time = document.createElement('small');
					tmp_time.textContent = "<runtime>"
					.replace("<runtime>", seconds_to_stamp(data.new[i].runtime));
					tmp.appendChild(tmp_time);
				}

				new_collection.appendChild(tmp);
			}

			// Add a link to more
			var tmp_empty = document.createElement('li');
			tmp_empty.textContent = 'More';
			tmp_empty.classList.add('film', 'animate__animated', 'animate__fadeIn');
			tmp_empty.addEventListener('click', function() {
				
				load_category('new');
			})
			new_collection.appendChild(tmp_empty);

			video_pack.appendChild(new_collection);

			// Watch Later
			data.later = shuffleArray(data.later);

			var later_title = document.createElement('h2');
			later_title.textContent = 'Watch Later';
			later_title.classList.add('title');

			later_title.dataset.category = 'later';
			later_title.addEventListener('click', function() {
				
				return load_category(this.dataset.category);
			})

			video_pack.appendChild(later_title);

			var later_collection = document.createElement('ul');
			later_collection.classList.add('horul');
			for(var i = 0; i < data.later.length && i < 4; i++) {
				var tmp = document.createElement('li');
				tmp.classList.add('film');
				tmp.style.opacity = 0;
				tmp.dataset.uuid = data.later[i].uuid;

				tmp.addEventListener('click', function() {
					
					load_video(this.dataset.uuid);
				})

				var tmp_img = document.createElement('img');
				tmp_img.src = 'https://sixteenmm.org/cover/<uuid>'.replace('<uuid>', data.later[i].uuid);
				tmp_img.style.display = 'none';
				tmp_img.addEventListener('load', function() {
					this.parentElement.style.opacity = 1;
					this.parentElement.classList.add('film', 'animate__animated', 'animate__fadeIn');

					this.style.display = 'block';
					this.classList.add('animate__animated', 'animate__fadeIn');
				});
				tmp.appendChild(tmp_img);

				var tmp_title = document.createElement('a');
				tmp_title.href = "?page=video&uuid=<uuid>".replace("<uuid>", data.later[i].uuid);
				tmp_title.textContent = '<title> (<year>)'
				.replace("<title>", data.later[i].title)
				.replace("<year>", data.later[i].year);

				var tmp_title_wrapper = document.createElement('p');
				tmp_title_wrapper.appendChild(tmp_title);

				tmp.appendChild(tmp_title_wrapper);


				var tmp_desc = document.createElement('small')
				tmp_desc.textContent = data.later[i].description;
				tmp.appendChild(tmp_desc);

				tmp.appendChild(document.createElement('br'));
				if(!!data.later[i].progress) {
					var tmp_time = document.createElement('small');
					tmp_time.textContent = "<progress> / <runtime>"
					.replace("<progress>", seconds_to_stamp(data.later[i].progress))
					.replace("<runtime>", seconds_to_stamp(data.later[i].runtime));

					tmp.appendChild(tmp_time);
				} else {
					var tmp_time = document.createElement('small');
					tmp_time.textContent = "<runtime>"
					.replace("<runtime>", seconds_to_stamp(data.later[i].runtime));
					tmp.appendChild(tmp_time);
				}

				later_collection.appendChild(tmp);
			}

			// Add a link to more
			var tmp_empty = document.createElement('li');
			tmp_empty.textContent = 'More';
			tmp_empty.classList.add('film', 'animate__animated', 'animate__fadeIn');
			tmp_empty.addEventListener('click', function() {
				
				load_category('later');
			})
			later_collection.appendChild(tmp_empty);

			video_pack.appendChild(later_collection);

			// History
			data.history = shuffleArray(data.history);

			var history_title = document.createElement('h2');
			history_title.textContent = 'Watch History';
			history_title.classList.add('title');
			history_title.dataset.category = 'history';
			history_title.addEventListener('click', function() {
				
				return load_category(this.dataset.category);
			})

			video_pack.appendChild(history_title);

			var history_collection = document.createElement('ul');
			history_collection.classList.add('horul');
			for(var i = 0; i < data.history.length && i < 4; i++) {
				var tmp = document.createElement('li');
				tmp.classList.add('film');
				tmp.style.opacity = 0;
				tmp.dataset.uuid = data.history[i].uuid;

				tmp.addEventListener('click', function() {
					
					load_video(this.dataset.uuid);
				})

				var tmp_img = document.createElement('img');
				tmp_img.src = 'https://sixteenmm.org/cover/<uuid>'.replace('<uuid>', data.history[i].uuid);
				tmp_img.style.display = 'none';
				tmp_img.addEventListener('load', function() {
					this.parentElement.style.opacity = 1;
					this.parentElement.classList.add('film', 'animate__animated', 'animate__fadeIn');

					this.style.display = 'block';
					this.classList.add('animate__animated', 'animate__fadeIn');
				});
				tmp.appendChild(tmp_img);

				var tmp_title = document.createElement('a');
				tmp_title.href = "?page=video&uuid=<uuid>".replace("<uuid>", data.history[i].uuid);
				tmp_title.textContent = '<title> (<year>)'
				.replace("<title>", data.history[i].title)
				.replace("<year>", data.history[i].year);

				var tmp_title_wrapper = document.createElement('p');
				tmp_title_wrapper.appendChild(tmp_title);

				tmp.appendChild(tmp_title_wrapper);

				var tmp_desc = document.createElement('small')
				tmp_desc.textContent = data.history[i].description;
				tmp.appendChild(tmp_desc);

				tmp.appendChild(document.createElement('br'));
				if(!!data.history[i].progress) {
					var tmp_time = document.createElement('small');
					tmp_time.textContent = "<progress> / <runtime>"
					.replace("<progress>", seconds_to_stamp(data.history[i].progress))
					.replace("<runtime>", seconds_to_stamp(data.history[i].runtime));

					tmp.appendChild(tmp_time);
				} else {
					var tmp_time = document.createElement('small');
					tmp_time.textContent = "<runtime>"
					.replace("<runtime>", seconds_to_stamp(data.history[i].runtime));
					tmp.appendChild(tmp_time);
				}

				history_collection.appendChild(tmp);
			}

			// Add a link to more
			var tmp_empty = document.createElement('li');
			tmp_empty.textContent = 'More';
			tmp_empty.classList.add('film', 'animate__animated', 'animate__fadeIn');
			tmp_empty.addEventListener('click', function() {
				
				load_category('history');
			})
			history_collection.appendChild(tmp_empty);

			video_pack.appendChild(history_collection);

			// Favourites
			for (var key in data.favourites) {
				// Random order
				data.favourites[key] = shuffleArray(data.favourites[key]);

				var item_title = document.createElement('h2');
				item_title.textContent = titleCase(key);
				item_title.classList.add('title');
				item_title.dataset.category = key;
				item_title.addEventListener('click', function() {
					
					return load_category(this.dataset.category);
				});

				var item_collection = document.createElement('ul');
				item_collection.classList.add('horul');
				for(var i = 0; i < data.favourites[key].length && i < 4; i++) {
					var tmp = document.createElement('li');
					tmp.classList.add('film');
					tmp.style.opacity = 0;
					tmp.dataset.uuid = data.favourites[key][i].uuid;

					tmp.addEventListener('click', function() {
						
						load_video(this.dataset.uuid);
					})

					var tmp_img = document.createElement('img');
					tmp_img.src = 'https://sixteenmm.org/cover/<uuid>'.replace('<uuid>', data.favourites[key][i].uuid);
					tmp_img.style.display = 'none';
					tmp_img.addEventListener('load', function() {
						this.parentElement.style.opacity = 1;
						this.parentElement.classList.add('film', 'animate__animated', 'animate__fadeIn');

						this.style.display = 'block';
						this.classList.add('animate__animated', 'animate__fadeIn');
					});
					tmp.appendChild(tmp_img);

					var tmp_title = document.createElement('a');
					tmp_title.href = "?page=video&uuid=<uuid>".replace("<uuid>", data.favourites[key][i].uuid);
					tmp_title.textContent = '<title> (<year>)'
					.replace("<title>", data.favourites[key][i].title)
					.replace("<year>", data.favourites[key][i].year);

					var tmp_title_wrapper = document.createElement('p');
					tmp_title_wrapper.appendChild(tmp_title);

					tmp.appendChild(tmp_title_wrapper);

					var tmp_desc = document.createElement('small')
					tmp_desc.textContent = data.favourites[key][i].description;
					tmp.appendChild(tmp_desc);

					tmp.appendChild(document.createElement('br'));
					if(!!data.favourites[key][i].progress) {
						var tmp_time = document.createElement('small');
						tmp_time.textContent = "<progress> / <runtime>"
						.replace("<progress>", seconds_to_stamp(data.favourites[key][i].progress))
						.replace("<runtime>", seconds_to_stamp(data.favourites[key][i].runtime));

						tmp.appendChild(tmp_time);
					} else {
						var tmp_time = document.createElement('small');
						tmp_time.textContent = "<runtime>"
						.replace("<runtime>", seconds_to_stamp(data.favourites[key][i].runtime));
						tmp.appendChild(tmp_time);
					}

					item_collection.appendChild(tmp);
				}

				// Add a link to more
				var tmp_empty = document.createElement('li');
				tmp_empty.textContent = 'More';
				tmp_empty.classList.add('film', 'animate__animated', 'animate__fadeIn');
				tmp_empty.dataset.category = key;
				tmp_empty.addEventListener('click', function() {
					
					load_category(this.dataset.category);
				})
				item_collection.appendChild(tmp_empty);

				video_pack.appendChild(item_title);
				video_pack.appendChild(item_collection);
			}

			// Categories
			for (var key in data.categories) {
				// Random order
				data.categories[key] = shuffleArray(data.categories[key]);

				var item_title = document.createElement('h2');
				item_title.textContent = titleCase(key);
				item_title.classList.add('title');
				item_title.dataset.category = key;
				item_title.addEventListener('click', function() {
					
					return load_category(this.dataset.category);
				});

				var item_collection = document.createElement('ul');
				item_collection.classList.add('horul');
				for(var i = 0; i < data.categories[key].length && i < 4; i++) {
					var tmp = document.createElement('li');
					tmp.classList.add('film');
					tmp.style.opacity = 0;
					tmp.dataset.uuid = data.categories[key][i].uuid;

					tmp.addEventListener('click', function() {
						
						load_video(this.dataset.uuid);
					})

					var tmp_img = document.createElement('img');
					tmp_img.src = 'https://sixteenmm.org/cover/<uuid>'.replace('<uuid>', data.categories[key][i].uuid);
					tmp_img.style.display = 'none';
					tmp_img.addEventListener('load', function() {
						this.parentElement.style.opacity = 1;
						this.parentElement.classList.add('film', 'animate__animated', 'animate__fadeIn');

						this.style.display = 'block';
						this.classList.add('animate__animated', 'animate__fadeIn');
					});
					tmp.appendChild(tmp_img);

					var tmp_title = document.createElement('a');
					tmp_title.href = "?page=video&uuid=<uuid>".replace("<uuid>", data.categories[key][i].uuid);
					tmp_title.textContent = '<title> (<year>)'
					.replace("<title>", data.categories[key][i].title)
					.replace("<year>", data.categories[key][i].year);

					var tmp_title_wrapper = document.createElement('p');
					tmp_title_wrapper.appendChild(tmp_title);

					tmp.appendChild(tmp_title_wrapper);

					var tmp_desc = document.createElement('small')
					tmp_desc.textContent = data.categories[key][i].description;
					tmp.appendChild(tmp_desc);

					tmp.appendChild(document.createElement('br'));
					if(!!data.categories[key][i].progress) {
						var tmp_time = document.createElement('small');
						tmp_time.textContent = "<progress> / <runtime>"
						.replace("<progress>", seconds_to_stamp(data.categories[key][i].progress))
						.replace("<runtime>", seconds_to_stamp(data.categories[key][i].runtime));

						tmp.appendChild(tmp_time);
					} else {
						var tmp_time = document.createElement('small');
						tmp_time.textContent = "<runtime>"
						.replace("<runtime>", seconds_to_stamp(data.categories[key][i].runtime));
						tmp.appendChild(tmp_time);
					}

					item_collection.appendChild(tmp);
				}

				// Add a link to more
				var tmp_empty = document.createElement('li');
				tmp_empty.textContent = 'More';
				tmp_empty.classList.add('film', 'animate__animated', 'animate__fadeIn');
				tmp_empty.dataset.category = key;
				tmp_empty.addEventListener('click', function() {
					
					load_category(this.dataset.category);
				})
				item_collection.appendChild(tmp_empty);

				video_pack.appendChild(item_title);
				video_pack.appendChild(item_collection);
			}

		}
	})
	.catch(function(err) {
		// TODO: Crap.
		console.log(err);
	})

    el.appendChild(video_pack);
}

function build_signup() {
	var el = document.getElementById('app');
	while(el.firstChild) {
    	el.removeChild(el.firstChild);
    }

    document.body.style.backgroundImage = '';
    document.body.style.backgroundColor = 'black';

    document.title = "<title> | SIXTEENmm".replace("<title>", 'Sign Up');
    if(history.state.page != 'signup') {
    	history.pushState({page: "signup"}, "Signup", "?page=signup");
    }

    // Generate a minimal navigation
    var nav = document.getElementById('nav');
    while(nav.firstChild) {
    	nav.removeChild(nav.firstChild);
    }

    var home_button = document.createElement('button');
    home_button.addEventListener('click', build_home);
    home_button.textContent = 'Home';
    nav.appendChild(home_button);

    var title = document.createElement('h1');
	title.textContent = 'Sign Up';
	title.id = 'site_title';
	title.classList.add('animate__animated', 'animate__flipInX');
	el.appendChild(title);

	var global_hint = document.createElement('small');
	global_hint.id = 'global_hint';
	el.appendChild(global_hint);

	// Form expects:

	// billing_name
	var billing_name_label = document.createElement('label');
	billing_name_label.for = 'billing_name';
	billing_name_label.textContent = 'Legal Name:';
	var billing_name_el = document.createElement('input');
	billing_name_el.name = 'billing_name';
	billing_name_el.id = 'billing_name';
	billing_name_el.placeholder = 'John Smith';

	billing_name_hint = document.createElement('small');
	billing_name_hint.id = 'billing_name_hint';

	billing_name_el.addEventListener('change', function() {
		var ele = document.getElementById('billing_name_hint');
		if(ele.textContent != '') {
			ele.textContent = '';
		}
	});

	el.appendChild(billing_name_label);
	el.appendChild(billing_name_el);
	el.appendChild(billing_name_hint);
	el.appendChild(document.createElement('br'));

	// sign_up_email
	var sign_up_email_label = document.createElement('label');
	sign_up_email_label.for = 'sign_up_email';
	sign_up_email_label.textContent = 'Email:';
	var sign_up_email_el = document.createElement('input');
	sign_up_email_el.name = 'sign_up_email';
	sign_up_email_el.id = 'sign_up_email';
	sign_up_email_el.placeholder = 'john.smith@example.com';

	sign_up_email_hint = document.createElement('small');
	sign_up_email_hint.id = 'sign_up_email_hint';

	sign_up_email_el.addEventListener('change', function() {
		var ele = document.getElementById('sign_up_email_hint');
		if(ele.textContent != '') {
			ele.textContent = '';
		}
	});

	el.appendChild(sign_up_email_label);
	el.appendChild(sign_up_email_el);
	el.appendChild(sign_up_email_hint);
	el.appendChild(document.createElement('br'));

	// sign_up_username
	var sign_up_username_label = document.createElement('label');
	sign_up_username_label.for = 'sign_up_username';
	sign_up_username_label.textContent = 'Username:';
	var sign_up_username_el = document.createElement('input');
	sign_up_username_el.name = 'sign_up_username';
	sign_up_username_el.id = 'sign_up_username';
	sign_up_username_el.placeholder = 'myuser';
	sign_up_username_el.autocapitalize='none';

	sign_up_username_hint = document.createElement('small');
	sign_up_username_hint.id = 'sign_up_username_hint';

	sign_up_username_el.addEventListener('change', function() {
		var ele = document.getElementById('sign_up_username_hint');
		if(ele.textContent != '') {
			ele.textContent = '';
		}
	});

	el.appendChild(sign_up_username_label);
	el.appendChild(sign_up_username_el);
	el.appendChild(sign_up_username_hint);
	el.appendChild(document.createElement('br'));

	// sign_up_password
	var sign_up_password_label = document.createElement('label');
	sign_up_password_label.for = 'sign_up_password';
	sign_up_password_label.textContent = 'Password:';
	var sign_up_password_el = document.createElement('input');
	sign_up_password_el.name = 'sign_up_password';
	sign_up_password_el.id = 'sign_up_password';
	sign_up_password_el.placeholder = '*****';
	sign_up_password_el.autocapitalize='none';
	sign_up_password_el.type='password';

	sign_up_password_hint = document.createElement('small');
	sign_up_password_hint.id = 'sign_up_password_hint';

	sign_up_password_el.addEventListener('change', function() {
		var ele = document.getElementById('sign_up_password_hint');
		if(ele.textContent != '') {
			ele.textContent = '';
		}
	});

	el.appendChild(sign_up_password_label);
	el.appendChild(sign_up_password_el);
	el.appendChild(sign_up_password_hint);
	el.appendChild(document.createElement('br'));
	el.appendChild(document.createElement('hr'));

	// billing_address
	var billing_address_label = document.createElement('label');
	billing_address_label.for = 'billing_address';
	billing_address_label.textContent = 'Address:'
	var billing_address_el = document.createElement('input');
	billing_address_el.name = 'billing_address';
	billing_address_el.id = 'billing_address';
	billing_address_el.placeholder="123a Example Street";
	el.appendChild(billing_address_label);
	el.appendChild(billing_address_el);
	el.appendChild(document.createElement('br'));

	// billing_city
	var billing_city_label = document.createElement('label');
	billing_city_label.for = 'billing_city';
	billing_city_label.textContent = 'City or Suburb:'
	var billing_city_el = document.createElement('input');
	billing_city_el.name = 'billing_city';
	billing_city_el.id = 'billing_city';
	billing_city_el.placeholder="Footscray";
	el.appendChild(billing_city_label);
	el.appendChild(billing_city_el);
	el.appendChild(document.createElement('br'));
	el.appendChild(document.createElement('hr'));

	// billing_region
	var billing_region_label = document.createElement('label');
	billing_region_label.for = 'billing_region';
	billing_region_label.textContent = 'State or Territory or Region:'
	var billing_region_el = document.createElement('input');
	billing_region_el.name = 'billing_region';
	billing_region_el.id = 'billing_region';
	billing_region_el.placeholder="Victoria";
	el.appendChild(billing_region_label);
	el.appendChild(billing_region_el);
	el.appendChild(document.createElement('br'));

	// billing_code
	var billing_code_label = document.createElement('label');
	billing_code_label.for = 'billing_code';
	billing_code_label.textContent = 'Postal Code:'
	var billing_code_el = document.createElement('input');
	billing_code_el.name = 'billing_code';
	billing_code_el.id = 'billing_code';
	billing_code_el.placeholder="0000";
	el.appendChild(billing_code_label);
	el.appendChild(billing_code_el);
	el.appendChild(document.createElement('br'));
	el.appendChild(document.createElement('hr'));

	// billing_country
	var billing_country_label = document.createElement('label');
	billing_country_label.for = 'billing_country';
	billing_country_label.textContent = 'Country:'
	var billing_country_el = document.createElement('input');
	billing_country_el.name = 'billing_country';
	billing_country_el.id = 'billing_country';
	billing_country_el.placeholder="Australia";
	el.appendChild(billing_country_label);
	el.appendChild(billing_country_el);
	el.appendChild(document.createElement('br'));
	el.appendChild(document.createElement('hr'));

	var pre_text = document.createElement('small');
	pre_text.textContent = 'Signing up gives you free access for 30 days, after which you will be asked to either purchase a lifetime access, or create a subscription.';
	el.appendChild(pre_text);
	el.appendChild(document.createElement('br'));

	var pre_text2 = document.createElement('small');
	pre_text2.textContent = 'Take a moment to review our: '
	var pre_text2_link = document.createElement('a');
	pre_text2_link.textContent = 'Privacy Policy';
	pre_text2_link.href = 'https://sixteenmm.org/policy/privacy';
	pre_text2_link.target="_blank";
	pre_text2_link.rel="noreferrer noopener";

	var nbsp = document.createElement('small');
	nbsp.textContent = ' ';
	var nbsp2 = document.createElement('small');
	nbsp2.textContent = ' ';

	var pre_text2_link2 = document.createElement('a');
	pre_text2_link2.textContent = 'Security Policy';
	pre_text2_link2.href = 'https://sixteenmm.org/policy/security';
	pre_text2_link2.target="_blank";
	pre_text2_link2.rel="noreferrer noopener";

	pre_text2.appendChild(pre_text2_link);
	pre_text2.appendChild(nbsp);
	pre_text2.appendChild(pre_text2_link2);
	pre_text2.appendChild(nbsp2);
	el.appendChild(pre_text2);
	el.appendChild(document.createElement('br'));

	var signup_button = document.createElement('button');
	signup_button.textContent = 'Signup';
	signup_button.classList.add('animate__animated', 'animate__swing', 'signupButton');
	signup_button.addEventListener('click', function() {
		// Create our payload
		var data = new URLSearchParams();
		data.append('billing_name', document.getElementById('billing_name').value);
		data.append('billing_city', document.getElementById('billing_city').value);
		data.append('billing_region', document.getElementById('billing_region').value);
		data.append('billing_code', document.getElementById('billing_code').value);
		data.append('billing_country', document.getElementById('billing_country').value);
		data.append('billing_address', document.getElementById('billing_address').value);
		data.append('sign_up_email', document.getElementById('sign_up_email').value);
		data.append('sign_up_username', document.getElementById('sign_up_username').value);
		data.append('sign_up_password', document.getElementById('sign_up_password').value);

		// Process our payload
		fetch('https://sixteenmm.org/signup/json/', {
			headers: {'Content-Type': 'application/x-www-form-urlencoded'},
			method: 'POST',
			cache: 'no-cache',
			mode: 'cors',
			body: data
		}).then(response => response.json())
  		.then(function(data) {
			if(data.status == 200) {
				// 200 - Success! Trigger a login
				var data = new URLSearchParams();
				data.append('user', document.getElementById('sign_up_username').value);
				data.append('passw', document.getElementById('sign_up_password').value);

				fetch('https://sixteenmm.org/login/json', {
					headers: {'Content-Type': 'application/x-www-form-urlencoded'},
					method: 'POST',
					cache: 'no-cache',
					mode: 'cors',
					body: data
				}).then(response => response.json())
		  		.then(function(data) {
		  			if(data.status != 200) {
		  				// TODO: Failed login.
		  				// The hell??
		  				console.log(data.status);
		  			}
		  			else {
		  				// Attempt login
		  				var token = data.token;
		  				var username = document.getElementById('sign_up_username').value;
  						login(username, token);
		  			}
		  		})
		  		.catch(function(err) {
		  			// TODO: Crap
		  			console.log(err);
		  		});
			} else
			if(data.status == 401) {
				// 401 - Bad Password
				var password_input = document.getElementById('sign_up_password');
				password_input.setAttributeNS(null, 'class', '');
  				password_input.classList.add('animate__animated', 'animate__shakeX', 'error');
  				password_input.scrollIntoView();

  				var password_hint = document.getElementById('sign_up_password_hint');
  				password_hint.textContent = 'Sorry, you cannot use that password. It is probably insecure or has been stolen several times.';

  				password_input.addEventListener('animationend', function() {
  					password_input.setAttributeNS(null, 'class', '');
  					password_input.value = '';
  				});
			} else
			if(data.status == 403) {
				// 403 - Existing email/username
				var username_input = document.getElementById('sign_up_username');
				username_input.setAttributeNS(null, 'class', '');
  				username_input.classList.add('animate__animated', 'animate__shakeX', 'error');
  				username_input.scrollIntoView();

  				var username_hint = document.getElementById('sign_up_username_hint');
  				username_hint.textContent = 'Sorry, you cannot use that username.';

  				username_input.addEventListener('animationend', function() {
  					username_input.setAttributeNS(null, 'class', '');
  					username_input.value = '';
  				});
			} else
			if(data.status == 500) {
				// 500 - Something went wrong at the server side (Display message field).
				var hint = document.getElementById('global_hint');
				hint.setAttributeNS(null, 'class', '');
				hint.classList.add('animate__animated', 'animate__shakeX', 'error');
				hint.scrollIntoView();
				hint.textContent = data.message;
			}
			else {
				// Something unknown went wrong, treat as serverside error.
				var hint = document.getElementById('global_hint');
				hint.setAttributeNS(null, 'class', '');
				hint.classList.add('animate__animated', 'animate__shakeX', 'error');
				hint.scrollIntoView();
				hint.textContent = 'Sorry, something went wrong with that request.';
			}
  		})
  		.catch(function(err) {
  			// TODO: Crap
  			console.log(err);
  		})
	});
	el.appendChild(signup_button);
}

// TODO: Function to replicate our stripe.html template file...

function QueryStringToJSON() {            
    var pairs = location.search.slice(1).split('&');
    
    var result = {};
    pairs.forEach(function(pair) {
        pair = pair.split('=');
        result[pair[0]] = decodeURIComponent(pair[1] || '');
    });

    return JSON.parse(JSON.stringify(result));
}

function login(username, token) {
	localStorage.setItem('username', username);
  	localStorage.setItem('token', token);

  	// Check query string and route...
  	var state = QueryStringToJSON();

  	if(state.page == 'login') {
  		state.page = 'home';
  	}

  	state_router(state);
}

function onload() {
	if(location.protocol != 'https:' && location.port != '8010') {
		location.replace('https://' + location.hostname + location.search);
	}

	var username = localStorage.getItem('username');
	var token = localStorage.getItem('token');

	var state = QueryStringToJSON();
  	state_router(state);
}

// State router...
window.addEventListener('popstate', function(e) {
	state_router(e.state);
});

function state_router(state) {
	if(!('page' in state)) {
  		history.pushState({page: "home"}, "Home", "?page=home");
  	}
  	else if(history.state == null) {
  		var state = QueryStringToJSON();
  		history.pushState(state, "?", location.search);
  	}

  	var username = localStorage.getItem('username');
	var token = localStorage.getItem('token');

	if(!username || !token) {
  		load_login();
  	}

  	// TODO: Check URI to see if user locked:
  	// /free/trial/expired/<username>/<token>/json

  	// Clear the nav bar
  	var nav = document.getElementById('nav');
    while(nav.firstChild) {
    	nav.removeChild(nav.firstChild);
    }

	if(state.page == 'home') {
		build_home();
	} else if(state.page == 'video') {
		load_video(state.uuid);
	} else if(state.page == 'series') {
		load_series(state.uuid);
	} else if(state.page == 'login') {
		load_login();
	} else if(state.page == 'logout') {
		logout();
	} else if(state.page == 'category') {
		load_category(state.category);
	} else if(state.page == 'search') {
		build_search(state.term);
	} else if(state.page == 'categories') {
		build_categories();
	} else if(state.page == 'signup') {
		build_signup();
	} else {
		build_home();
	}
}

window.addEventListener('load', onload);
