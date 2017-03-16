// Create password from uLogin identity
Parse.Cloud.define("getCredentials", function(request, response) {
 
    var config = Parse.Config.current();
    var secret = config.get('authSecretSalt');
 
    Parse.Cloud.useMasterKey();
 
    if (request.params.token) {
        getUserDataFromSocialNetwork(request.params.token);
    } else {
        response.error("token is empty");
    }
 
    function getUserDataFromSocialNetwork(token) {
 
        Parse.Cloud.httpRequest({
            url: 'https://ulogin.ru/token.php',
            params: {
                token: token
            },
            headers: {
                'Content-Type': 'application/json;charset=utf-8'
            },
            success: function(httpResponse) {
                var data = JSON.parse(httpResponse.text);
                checkAndRegUser(data, token);
                 
            },
            error: function(httpResponse) {
                console.error('Request failed with response code ' + httpResponse.status);
            }
        });
 
    };
 
 
    function checkAndRegUser(userData, token) {
        var userLogin = userData.network + '-' + userData.uid;

        var md5 = require("cloud/md5.js").md5;
        var userPassword = md5(userData.identity + token + secret);

        var query = new Parse.Query(Parse.User);
        query.equalTo("username", userLogin);
        query.first({
            success: function(user) {
                if (result.length) {
                    updateUser(user);
                } else {
                    signUp();
                }
            }
        });
 
        function updateUser(user) {
            populateUserData(user);
 
            user.save(null, {
                success: function() {
                    onSuccessLogin();
                },
                error: function(user, error) {
                    response.error("Error save: " + error.code + " " + error.message);
                }
            });
        };
 
        function signUp() {
            var user = new Parse.User();
            user.set("username", userLogin);
            user.set('nickname', userData.nickname);
            user.set('profile', userData.profile);
            user.set('booksCount', 0);
            populateUserData(user);
 
            user.signUp(null, {
                success: function() {
                    onSuccessLogin();
                },
                error: function(user, error) {
                    response.error("Error sign up: " + error.code + " " + error.message);
                }
            });
        };

 
        function populateUserData(user) {
            user.set("password", userPassword);
            user.set('identity', userData.identity);
            user.set('network', userData.network);
            user.set('uid', userData.uid);
            user.set('loginProvider', 'uLogin');
            if (userData.photo) {
                user.set('photo', userData.photo);
            }
        };
 
        

        function onSuccessLogin() {
            response.success({'username': userLogin, 'password': userPassword});
        };

    };
 
 });

Parse.Cloud.beforeDelete("Book", function (request, response) {
    var user = request.object.get('user');
    user.increment('booksCount', -1);
    user.save(null, {
        success: function () {
            response.success();
        },
        error: function (user, error) {
            response.error("Error save beforeDelete: " + error.code + " " + error.message);
        }
    });
});

Parse.Cloud.beforeSave("Book", function (request, response) {
    if (request.object.get('title') && request.object.get('title').length > 140) {
        response.error("Title can't be more than 140 symbols");
        return;
    }
    if (request.object.get('author') && request.object.get('author').length > 140) {
        response.error("Author can't be more than 140 symbols");
        return;
    }
    
    if (request.object.get('notes') && request.object.get('notes').length > 1000) {
        response.error("Notes can't be more than 1000 symbols");
        return;
    }
    
    for (var f in ['readYear', 'readMonth', 'readDay']) {
        if (request.object.get(f) && request.object.get(f).length > 4) {
            response.error("Wrong read date value (" + f + ")");
            return;
        }
    }
    
    if (request.object.id) {
        response.success();
        return;
    }
    /* Only on new objects */
    
    var user = request.object.get('user');
    user.increment('booksCount');

    user.save(null, {
        success: function () {
            response.success();
        },
        error: function (user, error) {
            response.error("Error save beforeSave: " + error.code + " " + error.message);
        }
    });
});

Parse.Cloud.beforeSave("Wish", function (request, response) {    
    if (request.object.get('title') && request.object.get('title').length > 140) {
        response.error("Title can't be more than 140 symbols");
        return;
    }
    if (request.object.get('author') && request.object.get('author').length > 140) {
        response.error("Author can't be more than 140 symbols");
        return;
    }
    
    if (request.object.get('notes') && request.object.get('notes').length > 1000) {
        response.error("Notes can't be more than 1000 symbols");
        return;
    }
    
    if (request.object.get('priority') && (request.object.get('priority') < 1 || request.object.get('priority') > 100)) {
        response.error("Priority should be in range 1..100");
        return;
    }
    
    response.success();
});

Parse.Cloud.beforeSave(Parse.User, function (request, response) {
    if (request.object.get('nickname').length === 0) {
        response.error("Nickname can't be empty");
        return;
    }
    if (request.object.get('nickname') && request.object.get('nickname').length > 140) {
        response.error("Nickname can't be more than 140 symbols");
        return;
    }
    if (request.object.get('photo') && request.object.get('photo').length > 500) {
        response.error("Photo can't be more than 500 symbols");
        return;
    }
    
    if (request.object.get('profile') && request.object.get('profile').length > 500) {
        response.error("Profile' url can't be more than 500 symbols");
        return;
    }
    
    if (request.object.get('profile') && request.object.get('profile').indexOf('http') !== 0) {
        var url = 'http://' + request.object.get('profile');
        request.object.set('profile', url);
    }
    
    response.success();
});

/**
 * Makes and returns CSV file with user's books
 */
Parse.Cloud.define("getBooksAsFile", function(request, response) {
    
    //response.error("This feature is not available now.");
    
    var encodeBase64 = require("cloud/base64.js").encode;
    var convertToCsvFile = require("cloud/csv.js").convertToCsvFile;
    
    var userId = request.params.userId;
    
    var user;
    
    var query = new Parse.Query(Parse.User);
    query.get(userId).done(function (u) {
        user = u;

        var Book = Parse.Object.extend("Book");
        var query = new Parse.Query(Book);
        query.equalTo("user", user);
        query.descending("readYear,readMonth,readDay");
        query.limit(1000);
        
        return query.find();
        
    }).done(function(usersBooks){
        var preparedResult = [];
        for (var i = 0; i < usersBooks.length; i++) {
            var book = usersBooks[i];
            var row = [book.id, book.get('title'), book.get('author'), book.get('readYear'), book.get('readMonth'),  book.get('readDay'), book.get('notes')];
            preparedResult.push(row);
        }
        
        var data = convertToCsvFile(preparedResult);
        var file = new Parse.File("books.csv", { base64: encodeBase64(data) }, "text/csv");
        user.set('file', file);
        
        Parse.Cloud.useMasterKey();
        return user.save(null, {
            success: function () {
                response.success(file);
            }
        });
    }).fail(function(){
        response.error("Error getting data for user");
    });
    
   
    
});
