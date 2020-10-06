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
  		if(data.status == 403) {
  			// Not authenticated
  			load_login();
  		}
  	})
  	.catch(function(err) {
  		// We can safely ignore this...
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

function check_watch_later() {
	// Get the auth
	var username = localStorage.getItem('username');
	var token = localStorage.getItem('token');
	if(!username || !token) {
		return;
	}

	// TODO: Add Watch Later buttons...

	var list_uuids = [];

	var els = document.getElementsByClassName('film');
	for(var i = 0; i < els.length; i++) {
		list_uuids[i] = els[i].dataset.uuid;
	}

	var url = 'https://sixteenmm.org/get/watchlater/<username>/<token>/json'
		.replace("<username>", username)
		.replace("<token>", token);

	fetch(url, {
		method: 'POST',
		mode: 'cors',
		cache: 'no-cache',
		headers: {'Content-Type': 'application/json', "Accept": "application/json"},
		body: JSON.stringify(list_uuids)
	}).then(response => response.json())
  	.then(function(data) {
  		if(data.status == 200) {
  			for(var i = 0; i < els.length; i++) {
  				if(!!els[i].dataset.uuid) {
  					var watchlater_label = document.createElement('label');
  					watchlater_label.for = 'watchlater_button_' + els[i].dataset.uuid;
  					watchlater_label.textContent = 'Watch Later:'

  					var watchlater_button = document.createElement('input');
  					watchlater_button.type = 'checkbox';
  					watchlater_button.id = 'watchlater_button_' + els[i].dataset.uuid;
  					watchlater_button.classList.add('watchlater_button');

		  			if(data.data[i]) {
		  				watchlater_button.checked = true;
		  			} else {
		  				watchlater_button.checked = false;
		  			}

		  			// TODO: eventlistener

		  			els[i].appendChild(document.createElement('br'));
		  			els[i].appendChild(watchlater_label);
		  			els[i].appendChild(watchlater_button);
  				}
	  		}
  		}
  	})
  	.catch(function(err) {
  		// TODO: Network error
  		console.log(err);
  	})
}

function check_user_expired(username, token) {
	var url = 'https://sixteenmm.org/free/trial/expired/<username>/<token>/json'
		.replace("<username>", username)
		.replace("<token>", token);

	fetch(url, {
		method: 'GET',
		mode: 'cors',
		cache: 'no-cache'}
	).then(response => response.json())
  	.then(function(lockeddata) {
  		// 200 - Locked
  		if(lockeddata.status == 200) {
  			var url = 'https://sixteenmm.org/stripe/<username>/<token>/json'
  			fetch(url, {
  				method: 'GET',
  				mode: 'cors',
  				cache: 'no-cache'}
  			).then(response => response.json())
  			.then(function(data) {
  				// Show subscription/payment signup form.

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

			    // Add some information as to why you're on this page.
			    var info_pre = document.createElement('p');
			    info_pre.textContent = lockeddata.reason;
			    el.appendChild(info_pre);

  				// Add the Stripe payload
  				var stripe_payload = document.createElement('script');
  				stripe_payload.type = "text/javascript";
  				stripe_payload.src = "https://js.stripe.com/v3/";
  				el.appendChild(stripe_payload);

  				// Add the form
  				var form = document.createElement('form')
  				form.method = 'post';
  				form.id='payment-form';

  				var plan_label = document.createElement('label');
  				plan_label.for='plan';
  				plan_label.textContent='Plan:';
  				form.appendChild(plan_label);

  				// Monthly Plan
  				var monthly_container = document.createElement('p');
  				monthly_container.textContent = "$<month>/month AUD"
  					.replace("<month>", data.data.monthly / 100);
  				var monthly_select = document.createElement('input');
  				monthly_select.name = 'plan';
  				monthly_select.type = 'radio';
  				monthly_select.value = 'monthly';
  				monthly_container.appendChild(monthly_select);
  				form.appendChild(monthly_container);

  				// Yearly Plan
  				var yearly_container = document.createElement('p');
  				yearly_container.textContent = "$<year>/year AUD"
  					.replace("<year>", data.data.yearly / 100);
  				var yearly_select = document.createElement('input');
  				yearly_select.name = 'plan';
  				yearly_select.type = 'radio';
  				yearly_select.value = 'yearly';
  				yearly_container.appendChild(yearly_select);
  				form.appendChild(yearly_container);

  				// Lifetime Plan
  				var lifetime_container = document.createElement('p');
  				lifetime_container.textContent = "$<lifetime> AUD"
  					.replace("<lifetime>", data.data.lifetime / 100);
  				var lifetime_select = document.createElement('input');
  				lifetime_select.name = 'plan';
  				lifetime_select.type = 'radio';
  				lifetime_select.value = 'yearly';
  				lifetime_container.appendChild(lifetime_select);
  				form.appendChild(lifetime_container);

  				// Label for card element
  				var card_element_label = document.createElement('label');
  				card_element_label.for = 'card-element';
  				card_element_label.textContent = 'Credit or debit card';
  				form.appendChild(card_element_label);

  				// Card element (Stripe handled)
  				var card_element = document.createElement('div');
  				card_element.id = 'card-element';
  				form.appendChild(card_element);

  				// Card errors (Stripe handled)
  				var card_errors = document.createElement('div');
  				card_errors.id = 'card-errors';
  				card_errors.role = 'alert';
  				form.appendChild(card_errors);

  				// Info
  				form.appendChild(document.createElement('hr'));

  				var info_a = document.createElement('small');
  				info_a.textContent = 'Yearly and Monthly are a "cancel anytime" subscription, with no ongoing commitment required.';
  				form.appendChild(info_a);
  				form.appendChild(document.createElement('br'));

  				var info_b = document.createElement('small');
  				info_b.textContent = 'The lifetime plan is a one-off payment, for the lifetime of the service.';
  				form.appendChild(info_b);
  				form.appendChild(document.createElement('br'));

  				var info_c = document.createElement('small');
  				info_c.textContent = 'The above information is never processed by us, or held by us. It is kept securely by our payment provider.';
  				form.appendChild(info_c);
  				form.appendChild(document.createElement('br'));

  				form.appendChild(document.createElement('hr'));
  				// Powered by Stripe
  				var stripe_powered = document.createElement('small');
  				stripe_powered.textContent = 'Powered by ';
  				var stripe_link = document.createElement('a');
  				stripe_link.href = 'https://stripe.com/';
  				stripe_link.textContent = 'Stripe';
  				stripe_powered.appendChild(stripe_link);
  				form.appendChild(stripe_powered);
  				form.appendChild(document.createElement('hr'));

  				// Submit button
  				var submit_button = document.createElement('button');
  				submit_button.addEventListener('click', function(event) {
					  event.preventDefault();
					  var f = document.getElementById('payment-form');
					  f.submit();
  				});

  				// Main Stripe submission handler...
  				function stripeSourceHandler(token) {
					var username = localStorage.getItem('username');
    				var token = localStorage.getItem('token');

					// Form url...
					var url = "https://sixteenmm.org/user/payment/setup/<username>/<token>/json"
						.replace("<username>", username)
						.replace("<token>", token);

					var dataPayload = new URLSearchParams();
					// Get the Stripe token...
					dataPayload.append('stripeSource', token.id);

					// Get which plan...
					var radios = document.getElementsByName('plan');
					for (var i = 0, length = radios.length; i < length; i++) {
						if (radios[i].checked) {
							dataPayload.append('plan', radios[i].value);
							break;
						}
					}

					// Submit the form...
					fetch(url, {
						headers: {'Content-Type': 'application/x-www-form-urlencoded'},
						method: 'POST',
						cache: 'no-cache',
						mode: 'cors',
						body: data
					}).then(response => response.json())
			  		.then(function(data) {
			  			if(data.status == 200) {
			  				// Success!
			  				// Reload the current API page...
			  				window.history.go(0);
			  			} else {
			  				// Failure!
			  				var err_el = document.getElementById('card-errors');
			  				err_el.textContent = "Error: <error>"
			  					.replace("<error>", data.message);
			  			}
			  		})
			  		.catch(function(err) {
			  			// TODO: Shit.
			  			console.log(err);
			  		});
				}

  				form.addEventListener('submit', function(event) {
					  event.preventDefault();

					  ownerInfo = {owner: {}};

					  stripe.createSource(card, ownerInfo).then(function(result) {
					    if (result.error) {
					      // Inform the customer that there was an error.
					      var errorElement = document.getElementById('card-errors');
					      errorElement.textContent = result.error.message;
					    } else {
					      // Send the token to your server.
					      stripeSourceHandler(result.source);
					    }
					  });
  				})

  				// Set up stripe handler...
  				var stripe = Stripe(data.data.key);
				var elements = stripe.elements();

				var style = {
				  base: {
				    fontSize: '18px',
				    color: "black",
				  }
				};

				var card = elements.create('card', {style: style});
				card.mount('#card-element');

				card.addEventListener('change', function(event) {
				  var displayError = document.getElementById('card-errors');
				  if (event.error) {
				    displayError.textContent = event.error.message;
				  } else {
				    displayError.textContent = '';
				  }
				});

				form.appendChild(submit_button);
  				el.appendChild(form);
  			})
  			.catch(function(err) {
  				// TODO: Network error! Crap.
  				console.log(err);
  			})

  		}
  	})
  	.catch(function(err) {
  		// Network error, ignore it here.
  	})
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
					var net_error = document.createElement('p');
					net_error.textContent = 'Error: An error occurred when trying to fetch a resource.'

					var net_error_internal = document.createElement('a');
					net_error_internal.textContent = 'Click here to try again.'
					net_error_internal.href = location.protocol + '//' + location.hostname + location.search;

					net_error.appendChild(net_error_internal);
					el.appendChild(net_error);

					console.log(err);
				})
			}

		} else {
			load_login('Not logged in.');
		}
	})
	.catch(function(err) {
		var net_error = document.createElement('p');
		net_error.textContent = 'Error: An error occurred when trying to fetch a resource.'

		var net_error_internal = document.createElement('a');
		net_error_internal.textContent = 'Click here to try again.'
		net_error_internal.href = location.protocol + '//' + location.hostname + location.search;

		net_error.appendChild(net_error_internal);
		el.appendChild(net_error);

		console.log(err);
	});
}

function build_search(term) {
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
		var net_error = document.createElement('p');
		net_error.textContent = 'Error: An error occurred when trying to fetch a resource.'

		var net_error_internal = document.createElement('a');
		net_error_internal.textContent = 'Click here to try again.'
		net_error_internal.href = location.protocol + '//' + location.hostname + location.search;

		net_error.appendChild(net_error_internal);
		el.appendChild(net_error);

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

    	// Go back to top of search...
    	document.getElementById('app').scrollIntoView();

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

    	// Weight results
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

    // Generate a video page.
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
			var net_error = document.createElement('p');
			net_error.textContent = 'Error: An error occurred when trying to fetch a resource.'

			var net_error_internal = document.createElement('a');
			net_error_internal.textContent = 'Click here to try again.'
			net_error_internal.href = location.protocol + '//' + location.hostname + location.search;

			net_error.appendChild(net_error_internal);
			el.appendChild(net_error);

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

  				var preview_frame = document.createElement('img');
  				preview_frame.src = 'https://sixteenmm.org/gcover/<uuid>'.replace("<uuid>", uuid);
  				preview_frame.id = 'preview_frame';
  				preview_frame.classList.add('animate__animated', 'video_preview');

  				var video = document.createElement('video');
  				video.classList.add('animate__animated', 'animate__fadeInUp', 'video_watch');
				video.controls = true;
				video.autoplay = true;
				video.cover = 'https://sixteenmm.org/gcover/<uuid>'.replace("<uuid>", uuid);
				video.id = 'playingfilm';
				video.dataset.uuid = uuid;
				video.style.display = 'none';

				// Swap from preview frame to video...
				video.addEventListener('loadeddata', function() {
					video.style.display = 'block';
					document.getElementById('preview_frame').style.display = 'none';
				});

				video.addEventListener('stalled', function() {
					// TODO
					console.log("Video stalled...");
				});

				// Video controls
				document.addEventListener('keyup', document.kbfn=function kbfn(event) {
					var video = document.getElementById('playingfilm');
					if(!!video) {
						switch(event.key) {
							case "f":
								video.requestFullscreen();
								break;
							case "Down":
							case "ArrowDown":
								if(video.volume > 0.1) {
									video.volume -= 0.1;
								} else {
									video.volume = 0;
								}
								break;
							case "Up":
							case "ArrowUp":
								if(video.volume < 0.9) {
									video.volume += 0.1;
								} else {
									video.volume = 1;
								}
								break;
							case "Left":
							case "LeftArrow":
								if(video.currentTime > 10) {
									video.currentTime -= 10;
								} else {
									video.currentTime = 0;
								}
								break;
							case "Right":
							case "RightArrow":
								if(video.currentTime < (video.duration - 10)) {
									video.currentTime += 10;
								}
								break;
						}

					} else {
						// Kill the event listener when it is inappropriate
						document.removeEventListener('keyup', document.kbfn);
					}
				});

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

  				el.appendChild(preview_frame);
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
			var net_error = document.createElement('p');
			net_error.textContent = 'Error: An error occurred when trying to fetch a resource.'

			var net_error_internal = document.createElement('a');
			net_error_internal.textContent = 'Click here to try again.'
			net_error_internal.href = location.protocol + '//' + location.hostname + location.search;

			net_error.appendChild(net_error_internal);
			el.appendChild(net_error);

			console.log(err);
  		});
}

function logout() {
	// Only clear the token, keep the username...
	localStorage.removeItem('token');
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

	// Load the username if we have it...
	var username = localStorage.getItem('username');
	if(!!username) {
		username_input.value = username;
	}

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
			var net_error = document.createElement('p');
			net_error.textContent = 'Error: An error occurred when trying to fetch a resource.'

			var net_error_internal = document.createElement('a');
			net_error_internal.textContent = 'Click here to try again.'
			net_error_internal.href = location.protocol + '//' + location.hostname + location.search;

			net_error.appendChild(net_error_internal);
			el.appendChild(net_error);

			console.log(err);
  		})
	})

	var signup_submit = document.createElement('button');
	signup_submit.id = 'signup_submit';
	signup_submit.textContent = 'Signup';
	signup_submit.addEventListener('click', function() {
		// Allow adding desired username/password from form
		build_signup(document.getElementById('username_input').value, document.getElementById('password_input').value);
	});

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

			sign_up_link.addEventListener('click', function(event) {
				event.preventDefault();
				build_signup();
			});

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
		var net_error = document.createElement('p');
		net_error.textContent = 'Error: An error occurred when trying to fetch a resource.'

		var net_error_internal = document.createElement('a');
		net_error_internal.textContent = 'Click here to try again.'
		net_error_internal.href = location.protocol + '//' + location.hostname + location.search;

		net_error.appendChild(net_error_internal);
		el.appendChild(net_error);

		console.log(err);
	})

	el.textContent = '';
	el.appendChild(username_input_hint);
	el.appendChild(username_input);
	el.appendChild(password_input_hint);
	el.appendChild(password_input);
	el.appendChild(login_submit);
	el.appendChild(signup_submit);
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

				if(category == 'history') {
					// History comes in reverse watch order...
					data.data.reverse();
				}

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
		var net_error = document.createElement('p');
		net_error.textContent = 'Error: An error occurred when trying to fetch a resource.'

		var net_error_internal = document.createElement('a');
		net_error_internal.textContent = 'Click here to try again.'
		net_error_internal.href = location.protocol + '//' + location.hostname + location.search;

		net_error.appendChild(net_error_internal);
		el.appendChild(net_error);

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

    var me_button = document.createElement('button');
    me_button.addEventListener('click', build_userdata);
    me_button.textContent = 'Me';
    nav.appendChild(me_button);

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

			// History comes in reverse order
			data.history.reverse();
			// Extract a shuffled from the most recent...
			data.history = shuffleArray(data.history.slice(1, 6));

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
		var net_error = document.createElement('p');
		net_error.textContent = 'Error: An error occurred when trying to fetch a resource.'

		var net_error_internal = document.createElement('a');
		net_error_internal.textContent = 'Click here to try again.'
		net_error_internal.href = location.protocol + '//' + location.hostname + location.search;

		net_error.appendChild(net_error_internal);
		el.appendChild(net_error);

		console.log(err);
	})

    el.appendChild(video_pack);
    check_watch_later();
}

function build_userdata() {

	var el = document.getElementById('app');
	while(el.firstChild) {
    	el.removeChild(el.firstChild);
    }

    document.body.style.backgroundImage = '';
    document.body.style.backgroundColor = 'black';

    document.title = "<title> | SIXTEENmm".replace("<title>", 'User Data');
    if(history.state.page != 'whoami') {
    	history.pushState({page: "whoami"}, "User Data", "?page=whoami");
    }

    // Generate a minimal navigation
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
	title.textContent = 'User Data';
	title.id = 'site_title';
	title.classList.add('animate__animated', 'animate__flipInX');
	el.appendChild(title);

	var inner_el = document.createElement('div');
	inner_el.classList.add('invertab');
	el.appendChild(inner_el);
	el = inner_el;

	var username = localStorage.getItem('username');
	var token = localStorage.getItem('token');

	// Needs a logged in user...
	if(!username || !token) {
		load_login();
		return;
	}

	var url = "https://sixteenmm.org/user/whoami/<username>/<token>/json"
		.replace("<username>", username)
		.replace("<token>", token);


	fetch(url, {
			method: 'GET',
			cache: 'no-cache',
			mode: 'cors',
		}).then(response => response.json())
  		.then(function(data) {
  			console.log(data);

			if(data.status == 200) {
				// TODO: Make fields editable...

				// TOC
				var toc_title = document.createElement('h2');
				toc_title.textContent = 'Table of Contents';
				toc_title.id = 'toc';
				toc_title.classList.add('animate__animated', 'animate__flipInX');
				el.appendChild(toc_title);

				var toc_container = document.createElement('ul');

				// Metadata link
				var meta_toc = document.createElement('li');
				var meta_toc_link = document.createElement('a');
				meta_toc_link.textContent = 'Metadata';
				meta_toc_link.href = '#metadata';
				meta_toc_link.dataset.id = 'metadata';
				meta_toc_link.addEventListener('click', function(event) {
					event.preventDefault();
					var id = this.dataset.id;
					document.getElementById(id).scrollIntoView();
				});

				meta_toc.appendChild(meta_toc_link);
				toc_container.appendChild(meta_toc);

				// Favourites link
				var fav_toc = document.createElement('li');
				var fav_toc_link = document.createElement('a');
				fav_toc_link.textContent = 'Favourites';
				fav_toc_link.href = '#favorites';
				fav_toc_link.dataset.id = 'favorites';
				fav_toc_link.addEventListener('click', function(event) {
					event.preventDefault();
					var id = this.dataset.id;
					document.getElementById(id).scrollIntoView();
				});

				fav_toc.appendChild(fav_toc_link);
				toc_container.appendChild(fav_toc);

				// Watch History link
				var wh_toc = document.createElement('li');
				var wh_toc_link = document.createElement('a');
				wh_toc_link.textContent = 'Watch History';
				wh_toc_link.href = '#watchhistory';
				wh_toc_link.dataset.id = 'watchhistory';
				wh_toc_link.addEventListener('click', function(event) {
					event.preventDefault();
					var id = this.dataset.id;
					document.getElementById(id).scrollIntoView();
				});

				wh_toc.appendChild(wh_toc_link);
				toc_container.appendChild(wh_toc);

				// Watch Later link
				var wl_toc = document.createElement('li');
				var wl_toc_link = document.createElement('a');
				wl_toc_link.textContent = 'Watch Later';
				wl_toc_link.href = '#watchlater';
				wl_toc_link.dataset.id = 'watchlater';
				wl_toc_link.addEventListener('click', function(event) {
					event.preventDefault();
					var id = this.dataset.id;
					document.getElementById(id).scrollIntoView();
				});

				wl_toc.appendChild(wl_toc_link);
				toc_container.appendChild(wl_toc);

				// Blacklisted Categories link
				var bl_toc = document.createElement('li');
				var bl_toc_link = document.createElement('a');
				bl_toc_link.textContent = 'Blacklisted Categories';
				bl_toc_link.href = '#blacklistedcategories';
				bl_toc_link.dataset.id = 'blacklistedcategories';
				bl_toc_link.addEventListener('click', function(event) {
					event.preventDefault();
					var id = this.dataset.id;
					document.getElementById(id).scrollIntoView();
				});

				bl_toc.appendChild(bl_toc_link);
				toc_container.appendChild(bl_toc);

				// Blacklisted Films link
				var blf_toc = document.createElement('li');
				var blf_toc_link = document.createElement('a');
				blf_toc_link.textContent = 'Blacklisted Films';
				blf_toc_link.href = '#blacklistedfilms';
				blf_toc_link.dataset.id = 'blacklistedfilms';
				blf_toc_link.addEventListener('click', function(event) {
					event.preventDefault();
					var id = this.dataset.id;
					document.getElementById(id).scrollIntoView();
				});

				blf_toc.appendChild(blf_toc_link);
				toc_container.appendChild(blf_toc);

				// Cancel Account link...
				var cancel_toc = document.createElement('li');
				var cancel_toc_link = document.createElement('a');
				cancel_toc_link.textContent = 'Cancel';
				cancel_toc_link.href = '#cancelaccount';
				cancel_toc_link.dataset.id = 'cancelaccount';
				cancel_toc_link.addEventListener('click', function(event) {
					event.preventDefault();
					var id = this.dataset.id;
					document.getElementById(id).scrollIntoView();
				});

				cancel_toc.appendChild(cancel_toc_link);
				toc_container.appendChild(cancel_toc);

				el.appendChild(toc_container);

				// Metadata
				var meta_title = document.createElement('h2');
				meta_title.textContent = 'Metadata';
				meta_title.id = 'metadata';
				meta_title.classList.add('animate__animated', 'animate__flipInX');
				el.appendChild(meta_title);

				// API Token
				// TODO: Click to refresh token...
				var meta_apitoken = document.createElement('p');
				meta_apitoken.textContent = "API Token: <token>"
					.replace("<token>", data.data.metadata.apitoken);
				meta_apitoken.classList.add('animate__animated', 'animate__backInLeft');
				el.appendChild(meta_apitoken);

				var meta_apitoken_warn = document.createElement('small');
				meta_apitoken_warn.textContent = 'Keep the API Token secret!';
				el.appendChild(meta_apitoken_warn);

				el.appendChild(document.createElement('hr'));

				// User Class
				// TODO: Click to go to plan change...
				var meta_class = document.createElement('p');
				meta_class.textContent = "User Class: <class>"
					.replace("<class>", data.data.metadata.class);
				meta_class.classList.add('animate__animated', 'animate__backInLeft');
				el.appendChild(meta_class);
				el.appendChild(document.createElement('hr'));

				// User Locked?
				var meta_locked = document.createElement('p');
				meta_locked.textContent = "Account Locked: <locked>"
					.replace("<locked>", (data.data.metadata.locked ? "true" : "false"));
				meta_locked.classList.add('animate__animated', 'animate__backInLeft');
				el.appendChild(meta_locked);
				el.appendChild(document.createElement('hr'));

				// Email Address
				// TODO: Click to change email...
				var meta_email = document.createElement('p');
				meta_email.textContent = "Email Address: <email>"
					.replace("<email>", data.data.metadata['email[decrypted]']);
				meta_email.classList.add('animate__animated', 'animate__backInLeft');

				var meta_email_info = document.createElement('small');
				meta_email_info.textContent = 'This was decrypted when the request was made. We do not store it in plain text.';

				el.appendChild(meta_email);
				el.appendChild(meta_email_info);
				el.appendChild(document.createElement('hr'));

				// Metadata Billing
				var billing = data.data.metadata['billing[decrypted]'];
				// Legal Name
				// TODO: Click to change...
				var meta_legal = document.createElement('p');
				meta_legal.textContent = "Legal Name: <name>"
					.replace("<name>", billing['legal name']);
				meta_legal.classList.add('animate__animated', 'animate__backInLeft');
				el.appendChild(meta_legal);

				// billing.address
				// TODO: Click to change...
				var meta_address = document.createElement('p');
				meta_address.textContent = "Address: <address>"
					.replace("<address>", billing.address);
				meta_address.classList.add('animate__animated', 'animate__backInLeft');
				el.appendChild(meta_address);

				// billing.city
				// TODO: Click to change...
				var meta_city = document.createElement('p');
				meta_city.textContent = "City or Suburb: <city>"
					.replace("<city>", billing.city);
				meta_city.classList.add('animate__animated', 'animate__backInLeft');
				el.appendChild(meta_city);

				// billing.region
				// TODO: Click to change...
				var meta_region = document.createElement('p');
				meta_region.textContent = "Region: <region>"
					.replace("<region>", billing.region);
				meta_region.classList.add('animate__animated', 'animate__backInLeft');
				el.appendChild(meta_region);

				// billing.country
				// TODO: Click to change...
				var meta_country = document.createElement('p');
				meta_country.textContent = "Country: <country>"
					.replace("<country>", billing.country);
				meta_country.classList.add('animate__animated', 'animate__backInLeft');
				el.appendChild(meta_country);

				// billing['postal code']
				// TODO: Click to change...
				var meta_code = document.createElement('p');
				meta_code.textContent = "Postal: <code>"
					.replace("<code>", billing['postal code']);
				meta_code.classList.add('animate__animated', 'animate__backInLeft');
				el.appendChild(meta_code);

				// Billing info
				var billing_info = document.createElement('small');
				billing_info.textContent = 'This was decrypted when the request was made. We do not store it in plain text.';
				el.appendChild(billing_info);
				el.appendChild(document.createElement('hr'));

				// Favourite Categories
				var favs_title = document.createElement('h2');
				favs_title.textContent = 'Favourites';
				favs_title.id = 'favorites';
				favs_title.classList.add('animate__animated', 'animate__flipInX');
				el.appendChild(favs_title);

				var fav_container = document.createElement('ul');

				for(var ix = 0; ix < data.data.favourite_category.length; ix++) {
					var fav = document.createElement('li');

					var fav_link = document.createElement('a');
					fav_link.href = '?page=category&category=<category>'
						.replace("<category>", data.data.favourite_category[ix]);
					fav_link.textContent = data.data.favourite_category[ix];
					fav.appendChild(fav_link);

					// TODO: Use tickbox to allow removing favourite category...
					
					fav_container.appendChild(fav);
				}
				el.appendChild(fav_container);
				el.appendChild(document.createElement('hr'));

				// Watch History
				var wh_title = document.createElement('h2');
				wh_title.textContent = 'Watch History';
				wh_title.id = 'watchhistory';
				wh_title.classList.add('animate__animated', 'animate__flipInX');
				el.appendChild(wh_title);

				var wh_container = document.createElement('ul');

				for(var ix = 0; ix < data.data['watch history'].length; ix++) {
					var datapack = data.data['watch history'][ix];

					var wh_el = document.createElement('li');

					// Title and link
					var wh_el_title = document.createElement('a');
					wh_el_title.textContent = "<title>, <year>"
						.replace("<title>", datapack.film.title)
						.replace("<year>", datapack.film.year);
					wh_el_title.href = '?page=video&uuid=<uuid>'
						.replace("<uuid>", datapack.film.uuid);

					var wh_progress = document.createElement('small');
					wh_progress.textContent = "  <progress> / <runtime>"
						.replace("<progress>", seconds_to_stamp(datapack.progress))
						.replace("<runtime>", seconds_to_stamp(datapack.film.runtime));

					// TODO: Use tickbox to allow removing from history...

					wh_el.appendChild(wh_el_title);
					wh_el.appendChild(wh_progress);
					wh_container.appendChild(wh_el);

				}
				el.appendChild(wh_container);
				el.appendChild(document.createElement('hr'));

				// Watch Later
				var wl_title = document.createElement('h2');
				wl_title.textContent = 'Watch Later';
				wl_title.id = 'watchlater';
				wl_title.classList.add('animate__animated', 'animate__flipInX');
				el.appendChild(wl_title);

				var wl_container = document.createElement('ul');

				for(var ix = 0; ix < data.data['watch later'].length; ix++) {
					var datapack = data.data['watch later'][ix];

					var wl_el = document.createElement('li');

					// Title and link
					var wl_el_title = document.createElement('a');
					wl_el_title.textContent = "<title>, <year>"
						.replace("<title>", datapack.title)
						.replace("<year>", datapack.year);
					wl_el_title.href = '?page=video&uuid=<uuid>'
						.replace("<uuid>", datapack.uuid);

					var wl_progress = document.createElement('small');
					wl_progress.textContent = "  <runtime>"
						.replace("<runtime>", seconds_to_stamp(datapack.runtime));

					// TODO: Use tickbox to allow removing from list...

					wl_el.appendChild(wl_el_title);
					wl_el.appendChild(wl_progress);
					wl_container.appendChild(wl_el);

				}
				el.appendChild(wl_container);
				el.appendChild(document.createElement('hr'));

				// Blacklisted Categories
				var bl_title = document.createElement('h2');
				bl_title.textContent = 'Blacklisted Categories';
				bl_title.id = 'blacklistedcategories';
				bl_title.classList.add('animate__animated', 'animate__flipInX');
				el.appendChild(bl_title);

				var bl_container = document.createElement('ul');

				for(var ix = 0; ix < data.data.blacklisted_category.length; ix++) {
					var bl_item = document.createElement('li');

					var bl_item_link = document.createElement('a');
					bl_item_link.href = '?page=category&category=<ategory>'
						.replace("<category>", data.data.blacklisted_category[ix]);
					bl_item_link.textContent = data.data.blacklisted_category[ix];
					bl_item.appendChild(bl_item_link);

					// TODO: Use tickbox to allow removing from blacklist...

					bl_container.appendChild(bl_item);
				}
				el.appendChild(bl_container);
				el.appendChild(document.createElement('hr'));

				// Blacklisted Films
				var blf_title = document.createElement('h2');
				blf_title.textContent = 'Blacklisted Films';
				blf_title.id = 'blacklistedfilms';
				blf_title.classList.add('animate__animated', 'animate__flipInX');
				el.appendChild(blf_title);

				var blf_container = document.createElement('ul');

				for(var ix = 0; ix < data.data.blacklisted_film.length; ix++) {
					var datapack = data.data.blacklisted_film[ix];

					var blf_el = document.createElement('li');

					// Title and link
					var blf_el_title = document.createElement('a');
					blf_el_title.textContent = "<title>, <year>"
						.replace("<title>", datapack.title)
						.replace("<year>", datapack.year);
					blf_el_title.href = '?page=video&uuid=<uuid>'
						.replace("<uuid>", datapack.uuid);

					var blf_progress = document.createElement('small');
					blf_progress.textContent = "  <runtime>"
						.replace("<runtime>", seconds_to_stamp(datapack.runtime));

					// TODO: Use tickbox to allow removing from blacklist...

					blf_el.appendChild(blf_el_title);
					blf_el.appendChild(blf_progress);
					blf_container.appendChild(blf_el);
				}
				el.appendChild(blf_container);
				el.appendChild(document.createElement('hr'));

				// Cancel account section...
				var cancel_title = document.createElement('h2');
				cancel_title.textContent = 'Cancel Account';
				cancel_title.id = 'cancelaccount';
				cancel_title.classList.add('animate__animated', 'animate__flipInX');
				el.appendChild(cancel_title);

				el.appendChild(document.createElement('hr'));
				var cancel_info = document.createElement('small');
				cancel_info.textContent = 'This is IRREVERSIBLE.';
				cancel_info.id = 'cancel_info';

				cancel_info.addEventListener('animationend', function() {
					this.classList.remove('animate__animated');
					this.classList.remove('animate__flash');
				})

				el.appendChild(cancel_info);
				el.appendChild(document.createElement('hr'));

				var cancel_payment = document.createElement('a');
				cancel_payment.href="javascript:void(0)";
				cancel_payment.textContent = 'Cancel payment account.';

				cancel_payment.addEventListener('mouseover', function() {
					document.getElementById('cancel_info').classList.add('animate__animated', 'animate__flash');
				});

				cancel_payment.addEventListener('click', function(event) {
					event.preventDefault();

					// Cancel the payment account
					var url = "https://sixteenmm.org/user/payment/cancel/<username>/<token>/json"
						.replace("<username>", username)
						.replace("<token>", token);

					fetch(url, {
						method: 'GET',
						cache: 'no-cache',
						mode: 'cors',
					}).then(response => response.json())
			  		.then(function(data) {
			  			if(data.status == 403) {
			  				// Not logged in
			  				load_login();
			  			}
			  			else if(data.status == 400) {
			  				// TODO: Error, no payment account found.
			  				window.history.go(0);
			  			}
			  			else if(data.status == 200) {
			  				// Success!
			  				window.history.go(0);
			  			}
			  			else {
			  				// TODO: WAT!
			  				console.log(data);
			  			}
			  		})
			  		.catch(function(err) {
			  			// TODO: Network error
			  			console.log(err);
			  		});

				});
				el.appendChild(cancel_payment);

				el.appendChild(document.createElement('hr'));
				var cancel_info = document.createElement('small');
				cancel_info.textContent = 'This is IRREVERSIBLE.';
				cancel_info.id = 'cancel_info2';

				cancel_info.addEventListener('animationend', function() {
					this.classList.remove('animate__animated');
					this.classList.remove('animate__flash');
				})
				el.appendChild(cancel_info);
				el.appendChild(document.createElement('hr'));

				// Delete account
				var cancel_account = document.createElement('a');
				cancel_account.href="javascript:void(0)";
				cancel_account.textContent = 'Delete account, and cancel any existing payment account.';

				cancel_account.addEventListener('mouseover', function() {
					document.getElementById('cancel_info2').classList.add('animate__animated', 'animate__flash');
				});

				cancel_account.addEventListener('click', function(event) {
					event.preventDefault();

					// Cancel the payment account
					var url = "https://sixteenmm.org/user/cancel/<username>/<token>/json"
						.replace("<username>", username)
						.replace("<token>", token);

					fetch(url, {
						method: 'GET',
						cache: 'no-cache',
						mode: 'cors',
					}).then(response => response.json())
			  		.then(function(data) {
			  			if(data.status == 200) {
			  				// Account deleted
			  				localStorage.clear();
			  				load_login();
			  			} else {
			  				// Not logged in
			  				load_login();
			  			}
			  		})
			  		.catch(function(err) {
			  			// TODO: Network error
			  			console.log(err);
			  		});
				});
				el.appendChild(cancel_account);

			} else {
				// User not authorised...
				load_login();
			}
		})
		.catch(function(err) {
			var net_error = document.createElement('p');
			net_error.textContent = 'Error: An error occurred when trying to fetch a resource.'

			var net_error_internal = document.createElement('a');
			net_error_internal.textContent = 'Click here to try again.'
			net_error_internal.href = location.protocol + '//' + location.hostname + location.search;

			net_error.appendChild(net_error_internal);
			el.appendChild(net_error);

			console.log(err);
		})
}

function build_signup(initusername, initpassword) {
	var el = document.getElementById('app');
	while(el.firstChild) {
    	el.removeChild(el.firstChild);
    }

    // A logged in user should login, not sign up.
    (function() {
    	var username = localStorage.getItem('username');
		var token = localStorage.getItem('token');
		if(!!username && !!token) {
			login(username, token);
		}
    })();

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
	var form = document.createElement('form');

	// billing_name
	var billing_name_label = document.createElement('label');
	billing_name_label.for = 'billing_name';
	billing_name_label.textContent = 'Legal Name:';
	var billing_name_el = document.createElement('input');
	billing_name_el.name = 'billing_name';
	billing_name_el.id = 'billing_name';
	billing_name_el.placeholder = 'John Smith';
	billing_name_el.classList.add('animate__animated', 'animate__backInLeft');

	billing_name_hint = document.createElement('small');
	billing_name_hint.id = 'billing_name_hint';

	billing_name_el.addEventListener('change', function() {
		var ele = document.getElementById('billing_name_hint');
		if(ele.textContent != '') {
			ele.textContent = '';
		}
	});

	form.appendChild(billing_name_label);
	form.appendChild(billing_name_el);
	form.appendChild(billing_name_hint);
	form.appendChild(document.createElement('br'));

	// sign_up_email
	var sign_up_email_label = document.createElement('label');
	sign_up_email_label.for = 'sign_up_email';
	sign_up_email_label.textContent = 'Email:';
	var sign_up_email_el = document.createElement('input');
	sign_up_email_el.name = 'sign_up_email';
	sign_up_email_el.id = 'sign_up_email';
	sign_up_email_el.placeholder = 'john.smith@example.com';
	sign_up_email_el.classList.add('animate__animated', 'animate__backInLeft');

	sign_up_email_hint = document.createElement('small');
	sign_up_email_hint.id = 'sign_up_email_hint';

	sign_up_email_el.addEventListener('change', function() {
		var ele = document.getElementById('sign_up_email_hint');
		if(ele.textContent != '') {
			ele.textContent = '';
		}
	});

	form.appendChild(sign_up_email_label);
	form.appendChild(sign_up_email_el);
	form.appendChild(sign_up_email_hint);
	form.appendChild(document.createElement('br'));

	// sign_up_username
	var sign_up_username_label = document.createElement('label');
	sign_up_username_label.for = 'sign_up_username';
	sign_up_username_label.textContent = 'Username:';
	var sign_up_username_el = document.createElement('input');
	sign_up_username_el.name = 'sign_up_username';
	sign_up_username_el.id = 'sign_up_username';
	sign_up_username_el.placeholder = 'myuser';
	sign_up_username_el.autocapitalize='none';
	sign_up_username_el.classList.add('animate__animated', 'animate__backInLeft');

	sign_up_username_hint = document.createElement('small');
	sign_up_username_hint.id = 'sign_up_username_hint';

	sign_up_username_el.addEventListener('change', function() {
		var ele = document.getElementById('sign_up_username_hint');
		if(ele.textContent != '') {
			ele.textContent = '';
		}
	});

	// If we got an initial username, include it
	if(!!initusername) {
		sign_up_username_el.value = initusername;
	}

	form.appendChild(sign_up_username_label);
	form.appendChild(sign_up_username_el);
	form.appendChild(sign_up_username_hint);
	form.appendChild(document.createElement('br'));

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
	sign_up_password_el.classList.add('animate__animated', 'animate__backInLeft');

	sign_up_password_hint = document.createElement('small');
	sign_up_password_hint.id = 'sign_up_password_hint';

	sign_up_password_el.addEventListener('change', function() {
		var ele = document.getElementById('sign_up_password_hint');
		if(ele.textContent != '') {
			ele.textContent = '';
		}
	});

	// If we got an initial password, use it
	if(!!initpassword) {
		sign_up_password_el.value = initpassword;
	}

	form.appendChild(sign_up_password_label);
	form.appendChild(sign_up_password_el);
	form.appendChild(sign_up_password_hint);
	form.appendChild(document.createElement('br'));
	form.appendChild(document.createElement('hr'));

	// billing_address
	var billing_address_label = document.createElement('label');
	billing_address_label.for = 'billing_address';
	billing_address_label.textContent = 'Address:'
	var billing_address_el = document.createElement('input');
	billing_address_el.name = 'billing_address';
	billing_address_el.id = 'billing_address';
	billing_address_el.placeholder="123a Example Street";
	billing_address_el.classList.add('animate__animated', 'animate__backInLeft');
	form.appendChild(billing_address_label);
	form.appendChild(billing_address_el);
	form.appendChild(document.createElement('br'));

	// billing_city
	var billing_city_label = document.createElement('label');
	billing_city_label.for = 'billing_city';
	billing_city_label.textContent = 'City or Suburb:'
	var billing_city_el = document.createElement('input');
	billing_city_el.name = 'billing_city';
	billing_city_el.id = 'billing_city';
	billing_city_el.placeholder="Footscray";
	billing_city_el.classList.add('animate__animated', 'animate__backInLeft');
	form.appendChild(billing_city_label);
	form.appendChild(billing_city_el);
	form.appendChild(document.createElement('br'));
	form.appendChild(document.createElement('hr'));

	// billing_region
	var billing_region_label = document.createElement('label');
	billing_region_label.for = 'billing_region';
	billing_region_label.textContent = 'State or Territory or Region:'
	var billing_region_el = document.createElement('input');
	billing_region_el.name = 'billing_region';
	billing_region_el.id = 'billing_region';
	billing_region_el.placeholder="Victoria";
	billing_region_el.classList.add('animate__animated', 'animate__backInLeft');
	form.appendChild(billing_region_label);
	form.appendChild(billing_region_el);
	form.appendChild(document.createElement('br'));

	// billing_code
	var billing_code_label = document.createElement('label');
	billing_code_label.for = 'billing_code';
	billing_code_label.textContent = 'Postal Code:'
	var billing_code_el = document.createElement('input');
	billing_code_el.name = 'billing_code';
	billing_code_el.id = 'billing_code';
	billing_code_el.placeholder="0000";
	billing_code_el.classList.add('animate__animated', 'animate__backInLeft');
	form.appendChild(billing_code_label);
	form.appendChild(billing_code_el);
	form.appendChild(document.createElement('br'));
	form.appendChild(document.createElement('hr'));

	// billing_country
	var billing_country_label = document.createElement('label');
	billing_country_label.for = 'billing_country';
	billing_country_label.textContent = 'Country:'
	var billing_country_el = document.createElement('input');
	billing_country_el.name = 'billing_country';
	billing_country_el.id = 'billing_country';
	billing_country_el.placeholder="Australia";
	billing_country_el.classList.add('animate__animated', 'animate__backInLeft');
	form.appendChild(billing_country_label);
	form.appendChild(billing_country_el);
	form.appendChild(document.createElement('br'));
	form.appendChild(document.createElement('hr'));

	var pre_text = document.createElement('small');
	pre_text.textContent = 'Signing up gives you free access for 30 days, after which you will be asked to either purchase a lifetime access, or create a subscription.';
	form.appendChild(pre_text);
	form.appendChild(document.createElement('br'));

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
	form.appendChild(pre_text2);
	form.appendChild(document.createElement('br'));
	form.appendChild(document.createElement('hr'));

	var signup_button = document.createElement('button');
	signup_button.textContent = 'Signup';
	signup_button.id = 'signup_button';
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
		  				// Failed login.
		  				// The hell?? (Race condition, that shouldn't be possible...)
		  				console.log(data);

		  				load_login();
		  			}
		  			else {
		  				// Attempt login
		  				var token = data.token;
		  				var username = document.getElementById('sign_up_username').value;
  						login(username, token);
		  			}
		  		})
		  		.catch(function(err) {
					var net_error = document.createElement('p');
					net_error.textContent = 'Error: An error occurred when trying to fetch a resource.'

					var net_error_internal = document.createElement('a');
					net_error_internal.textContent = 'Click here to try again.'
					net_error_internal.href = location.protocol + '//' + location.hostname + location.search;

					net_error.appendChild(net_error_internal);
					el.appendChild(net_error);

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
			var net_error = document.createElement('p');
			net_error.textContent = 'Error: An error occurred when trying to fetch a resource.'

			var net_error_internal = document.createElement('a');
			net_error_internal.textContent = 'Click here to try again.'
			net_error_internal.href = location.protocol + '//' + location.hostname + location.search;

			net_error.appendChild(net_error_internal);
			el.appendChild(net_error);

			console.log(err);
  		})
	});
	form.appendChild(signup_button);

	form.addEventListener('submit', function(event) {
		event.preventDefault();

		document.getElementById('signup_button').click();
	})

	el.appendChild(form);
}

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
	if(!state) {
		var state = QueryStringToJSON();
  		history.pushState(state, "?", location.search + location.hash);
	} else
	if(!('page' in state)) {
  		history.pushState({page: "home"}, "Home", "?page=home");
  	}
  	else if(history.state == null) {
  		var state = QueryStringToJSON();
  		history.pushState(state, "?", location.search + location.hash);
  	}

  	var username = localStorage.getItem('username');
	var token = localStorage.getItem('token');

	if(!username || !token) {
  		load_login();
  	}

  	// Check URI to see if user locked:
  	if(!!username && !!token) {
  		check_user_expired(username, token);
  	}

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
	} else if(state.page == 'whoami') {
		build_userdata();
	} else {
		build_home();
	}
}

window.addEventListener('load', onload);
