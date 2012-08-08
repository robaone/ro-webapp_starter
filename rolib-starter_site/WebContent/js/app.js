/***********
 * Site Application Code
 ***********/
var App = Ember.Application.create({
	ready: function(){
		$.logger('ready');
		(function(){
		crossroads.addRoute('',function(){
			App.StateManager.goToState('home');
		});
		crossroads.addRoute('home',function(){
			App.StateManager.goToState('home');
		});
		crossroads.addRoute('about',function(){
			App.StateManager.goToState('about');
		});
		crossroads.addRoute('contact',function(){
			App.StateManager.goToState('contact');
		});
		crossroads.addRoute('login',function(){
			App.StateManager.goToState('login');
		});
		crossroads.addRoute('profile',function(){
			App.StateManager.goToState('profile');
		});
		hasher.changed.add(App.parseHash); //add hash change listener
		hasher.init(); //initialize hasher (start listening for history changes)
		
		})();
	}
});
$.logger = function(log){
	try{
		console.log(log);
	}catch(err){}
};
App.started = false;
/**
 * Controllers:
 */

/***********
 * Login Status
 ***********/
App.isLoggedIn = Ember.Object.create({
	profile: null,
	getProfile: function(handler){
		$.getJSON('data/profile.json',function(data){
			App.isLoggedIn.set('profile',data);
			try{
				if(data){
					if(data.response.data[0].active == 1){
						App.isLoggedIn.set('loggedin', true);
					}else{
						App.isLoggedIn.set('loggedin',false);
					}
				}else{
					App.isLoggedIn.set('loggedin',false);
				}
				handler.handleSuccess();
			}catch(err){
				handler.handleSuccess();
			}
		});
	},
	loggedin: false
});

App.profile = Ember.Object.create({
	loggedinBinding: 'App.isLoggedIn.loggedin',
	username: null
});

App.parseHash = function(newHash, oldHash){
	crossroads.parse(newHash);
};
/*
 * Classes:
 */
 
App.PasswordTextField = Ember.TextField.extend({
	type: 'password'
});
/*
 * Objects:
 * This is the name of the site
 */
App.Title = Ember.Object.create({
	name: 'Test Application'
});
App.Book = Ember.Object.extend({
	title:null,
	author:null,
	genre:null
});
App.booksController = Ember.ArrayController.create({
	content: [],
	loadBooks: function(){
		var self = this;
		$.getJSON('data/books.json',function(data){
			data.forEach(function(item){
				self.pushObject(App.Book.create(item));
			});
		});
	}
});
/*
 * The Web site title is changed based on the state of the application
 */
App.setTitle = function(state){
	document.title = App.Title.name + ' - ' + state;
};
/***
 * Views:
 * Navigation view information
*/
App.navView = Ember.Object.create({
	home: '', //Display activation status
	about: '', //Display activation status
	contact: '' //Display activation status
});

/*
Welcome view
*/
App.WelcomeView = Ember.View.create({
	templateName: 'home'
});

/*
Dashboard view
*/
App.DashboardView = Ember.View.create({
	templateName: 'dashboard',
	submitLogout: function(){
		App.profile.set('username',null);
		App.profile.set('loggedin',false);
		App.StateManager.transitionTo('home.welcome');
	}
});

/*
Login view
*/
App.LoginView = Ember.View.create({
	templateName: 'login'
});
/*
About view
*/
App.AboutView = Ember.View.create({
	templateName: 'about'
});

/*
Contact view
*/
App.ContactView = Ember.View.create({
	templateName: 'contact'
});

/*
Profile view
*/
App.ProfileView = Ember.View.create({
	templateName: 'profile',
	loginView: Ember.View.extend({
		templateName: 'login'
	})
});

/*
Login Form view
*/
App.LoginFormView = Ember.View.extend({
	username: null,
	password: null,
	passwordField: App.PasswordTextField.extend({
		keyPress: function(key){
			if(key.charCode == 13){
				this._parentView.submitLogin();
			}
		}
	}),
	submitLogin: function(){
		var username = this.get('username');
		var password = this.get('password');
		$.logger('Username: ' + username + ' Password: ' + password);
		App.profile.set('username',username);
		App.profile.set('loggedin',true);
		try{
		var current_state = App.StateManager.currentState.name;
		if(current_state){
			if(current_state == 'login'){
				hasher.setHash('home');
			}
		}
		}catch(err){}
	},
	
	
});

App.StateManager = Ember.StateManager.create({
	initialState: 'loading',
	loading: Ember.State.create({
		enter: function(stateManager, transition){
			$.logger("loading profile");
			var handler = {};
			handler.handleSuccess = function(){
				hasher.initialized.add(App.parseHash); //add initialized listener (to grab initial value in case it is already set)
			}
			//App.isLoggedIn.getProfile(handler);
			handler.handleSuccess();
		}
	}),
	home: Ember.State.create({
		initialState: function(){
			if(App.profile.get('loggedin')){
				return 'dashboard';
			}else{
				return 'welcome';
			}
		}.property(),
		welcome: Ember.State.create({
			enter: function(stateManager, transition){
				$.logger("entering welcome state.  Hello!");
				App.navView.set('home','active');
				App.setTitle('Welcome');
				App.WelcomeView.appendTo('#container');
			},
			exit: function(stateManager, transition){
				App.navView.set('home', '');
				App.WelcomeView.remove();
			}
		}),
		dashboard: Ember.State.create({
			enter: function(stateManager, transition){
				$.logger("entering dashboard state. This is your domain!");
				App.navView.set('home','active');
				App.setTitle('Dashboard');
				App.DashboardView.appendTo('#container');
			},
			exit: function(stateManager, transition){
				App.navView.set('home','');
				App.DashboardView.remove();
			}
		})
	}),
	about: Ember.State.create({
		enter: function(stateManager, transition){
			App.navView.set('about','active');
			App.setTitle('About');
			App.AboutView.appendTo('#container');
		},
		exit: function(stateManager, transition){
			App.navView.set('about','');
			App.AboutView.remove();
		}
	}),
	contact: Ember.State.create({
		enter: function(stateManager, transition){
			App.navView.set('contact','active');
			App.setTitle('Contact');
			App.ContactView.appendTo('#container');
		},
		exit: function(stateManager, transition){
			App.navView.set('contact','');
			App.ContactView.remove();
		}
	}),
	login: Ember.State.create({
		enter: function(stateManager, transition){
			$.logger("entering login state");
			App.setTitle('Login');
			App.LoginView.appendTo('#container');
		},
		exit: function(stateManager, transition){
			App.LoginView.remove();
		}
	}),
	profile: Ember.State.create({
		enter: function(stateManager, transition){
			$.logger("entering profile state");
			App.setTitle('Profile');
			App.ProfileView.appendTo('#container');
		},
		exit: function(stateManager, transition){
			App.ProfileView.remove();
		}
	})
});

