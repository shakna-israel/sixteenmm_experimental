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

function load_video(uuid) {
	// TODO
	console.log("LOAD:", uuid);

	// TODO: Get video name
	history.pushState({page: "video", "uuid": uuid}, "?", "?video=<uuid>".replace("<uuid>", uuid));

	var el = document.getElementById('app');
	while(el.firstChild) {
    	el.removeChild(el.firstChild);
    }

    document.body.style.backgroundImage = '';
    document.body.style.backgroundColor = 'black';

    // TODO: Generate a home page.

    var logout_button = document.createElement('button');
    logout_button.addEventListener('click', logout);
    logout_button.textContent = 'Logout';

    var username = localStorage.getItem('username');
    var token = localStorage.getItem('token');

    el.appendChild(logout_button);
}

function logout() {
	localStorage.clear();
	window.location.reload(false);
}

function load_login() {
	var el = document.getElementById('app');
	while(el.firstChild) {
    	el.removeChild(el.firstChild);
	}

	// Set the background
	if(canUseWebP()) {
		document.body.style.backgroundImage = "url('https://sixteenmm.org/cstatic/img/back.webp')";
	} else {
		document.body.style.backgroundImage = "url('https://sixteenmm.org/cstatic/img/back.jpg')";
	}
	// Get what we need for waiting on the background...
	var bg_url = document.body.style.backgroundImage.match(/\((.*?)\)/)[1].replace(/('|")/g,'');
	var img = new Image();
	img.src = bg_url;

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
			event.preventDefault();
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
  				username_input.value = '';
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
		cache: 'no-cache',
		mode: 'cors'
	}).then(response => response.json())
	.then(function(data) {
		if(data.status != 200) {
			// Shouldn't reach here... But if it does...
			load_login();
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
				pack_link.href="#";
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

	// Once background image has loaded, add elements.
	img.addEventListener('load', function() {
		el.appendChild(username_input_hint);
		el.appendChild(username_input);
		el.appendChild(password_input_hint);
		el.appendChild(password_input);
		el.appendChild(login_submit);
		el.appendChild(title);
		el.appendChild(data_pack);	
	})
}

function build_home() {
	var el = document.getElementById('app');
	while(el.firstChild) {
    	el.removeChild(el.firstChild);
    }

    document.body.style.backgroundImage = '';
    document.body.style.backgroundColor = 'black';

    history.pushState({page: "home"}, "Home", "?page=home");

    // TODO: Generate a home page.

    var logout_button = document.createElement('button');
    logout_button.addEventListener('click', logout);
    logout_button.textContent = 'Logout';

    var username = localStorage.getItem('username');
    var token = localStorage.getItem('token');

    var video_pack = document.createElement('div');

    fetch('https://sixteenmm.org/home/<username>/<token>/json'.replace('<username>', username).replace('<token>', token), {
		headers: {'Content-Type': 'application/x-www-form-urlencoded'},
		cache: 'no-cache',
		mode: 'cors'
	}).then(response => response.json())
	.then(function(data) {
		if(data.status !== 200) {
			// Login failure!
			load_login();
		} else {
			console.log(data);

			// New videos...

			var new_title = document.createElement('h2');
			new_title.textContent = 'New';
			new_title.classList.add('title');
			video_pack.appendChild(new_title);
			// TODO: Make this a link to the new category page.

			var new_collection = document.createElement('ul');
			new_collection.classList.add('horul');
			for(var i = 0; i < data.new.length && i < 8; i++) {
				var tmp = document.createElement('li');
				tmp.classList.add('film', 'animate__animated', 'animate__fadeIn');
				tmp.dataset.uuid = data.new[i].uuid;

				tmp.addEventListener('click', function() {
					load_video(this.dataset.uuid);
				})

				var tmp_img = document.createElement('img');
				tmp_img.src = 'https://sixteenmm.org/cover/<uuid>'.replace('<uuid>', data.new[i].uuid);
				tmp_img.style.display = 'none';
				tmp_img.addEventListener('load', function() {
					this.style.display = 'block';
					this.classList.add('animate__animated', 'animate__fadeIn');
				});
				tmp.appendChild(tmp_img);	

				var tmp_title = document.createElement('p');
				tmp_title.textContent = '<title> (<year>)'.replace("<title>", data.new[i].title).replace("<year>", data.new[i].year);
				tmp.appendChild(tmp_title);

				var tmp_desc = document.createElement('small')
				tmp_desc.textContent = data.new[i].description;
				tmp.appendChild(tmp_desc);

				new_collection.appendChild(tmp);
			}
			video_pack.appendChild(new_collection);

			// Watch Later
			var later_title = document.createElement('h2');
			later_title.textContent = 'Watch Later';
			later_title.classList.add('title');
			video_pack.appendChild(later_title);
			// TODO: Make this a link to the new category page.

			var later_collection = document.createElement('ul');
			later_collection.classList.add('horul');
			for(var i = 0; i < data.later.length && i < 8; i++) {
				var tmp = document.createElement('li');
				tmp.classList.add('film');
				tmp.dataset.uuid = data.later[i].uuid;

				tmp.addEventListener('click', function() {
					load_video(this.dataset.uuid);
				})

				var tmp_img = document.createElement('img');
				tmp_img.src = 'https://sixteenmm.org/cover/<uuid>'.replace('<uuid>', data.later[i].uuid);
				tmp_img.style.display = 'none';
				tmp_img.addEventListener('load', function() {
					this.style.display = 'block';
					this.classList.add('animate__animated', 'animate__fadeIn');
				});
				tmp.appendChild(tmp_img);

				var tmp_title = document.createElement('p');
				tmp_title.textContent = '<title> (<year>)'.replace("<title>", data.later[i].title).replace("<year>", data.later[i].year);
				tmp.appendChild(tmp_title);

				var tmp_desc = document.createElement('small')
				tmp_desc.textContent = data.later[i].description;
				tmp.appendChild(tmp_desc);

				later_collection.appendChild(tmp);
			}
			video_pack.appendChild(later_collection);

			// History
			var history_title = document.createElement('h2');
			history_title.textContent = 'Watch History';
			history_title.classList.add('title');
			video_pack.appendChild(history_title);

			var history_collection = document.createElement('ul');
			history_collection.classList.add('horul');
			for(var i = 0; i < data.history.length && i < 8; i++) {
				var tmp = document.createElement('li');
				tmp.classList.add('film');
				tmp.dataset.uuid = data.history[i].uuid;

				tmp.addEventListener('click', function() {
					load_video(this.dataset.uuid);
				})

				var tmp_img = document.createElement('img');
				tmp_img.src = 'https://sixteenmm.org/cover/<uuid>'.replace('<uuid>', data.history[i].uuid);
				tmp_img.style.display = 'none';
				tmp_img.addEventListener('load', function() {
					this.style.display = 'block';
					this.classList.add('animate__animated', 'animate__fadeIn');
				});
				tmp.appendChild(tmp_img);

				var tmp_title = document.createElement('p');
				tmp_title.textContent = '<title> (<year>)'.replace("<title>", data.history[i].title).replace("<year>", data.history[i].year);
				tmp.appendChild(tmp_title);

				var tmp_desc = document.createElement('small')
				tmp_desc.textContent = data.history[i].description;
				tmp.appendChild(tmp_desc);

				history_collection.appendChild(tmp);
			}
			video_pack.appendChild(history_collection);

			// TODO: Favourites
			// TODO: Categories

		}
	})
	.catch(function(err) {
		// TODO: Crap.
		console.log(err);
	})

    el.appendChild(logout_button);
    el.appendChild(video_pack);
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
  	state = QueryStringToJSON();
  	if(! 'page' in state) {
  		state.page = 'home';
  	}

  	state_router(state);
}

function onload() {
	var username = localStorage.getItem('username');
	var token = localStorage.getItem('token');
	
	if(!username || !token) {
		load_login();
	} else {
		login(username, token);
	}
}

// State router...
window.addEventListener('popstate', function(e) {
	state_router(e.state);
});

function state_router(state) {
	if(state.page == 'home') {
		build_home();
	} else if(state.page == 'video') {
		load_video(state.uuid);
	} else if(state.page == 'login') {
		load_login();
	}
}

window.addEventListener('load', onload);
