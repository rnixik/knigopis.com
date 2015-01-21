var appControllers = angular.module('appControllers', []);

appControllers.controller('MainController', ['$rootScope', '$scope', 'Book', 'Subscriptions', '$state', '$interval', '$timeout',
    function ($rootScope, $scope, Book, Subscriptions, $state, $interval, $timeout) {

    $scope.feedbackEmail = 'info' + '@' + 'knigopis' + '.com';

    $scope.user = Parse.User.current();
    $scope.viewUser = null;
    $scope.loginLoading = 0;
    
    $scope.state = $state;
    $scope.loading = 0;

    $scope.authCallback = function (token) {
        $scope.loginLoading++;
        $scope.$apply();
        Parse.Cloud.run('getCredentials', {token: token}, {
            success: function (data) {
                Parse.User.logIn(data.username, data.password, {
                    success: function () {
                        $scope.user = Parse.User.current();
                        $scope.loginLoading = 0;
                        $scope.$apply();
                    },
                    error: function (user, error) {
                        $scope.loginLoading = 0;
                        $scope.showParseError(error);
                        $scope.$apply();
                    }
                });


            }
        });
    };
    window.authCallback = $scope.authCallback;

    $scope.showLoginLoading = function () {
        $scope.loginLoading++;
        $scope.$apply();
    };
    window.showLoginLoading = $scope.showLoginLoading;

    $scope.hideLoginLoading = function () {
        $scope.loginLoading--;
        $scope.$apply();
    };
    window.hideLoginLoading = $scope.hideLoginLoading;
    
    var subscriptionsService = new Subscriptions();

    $scope.logout = function () {
        Parse.User.logOut();
        $scope.user = null;
    };
    
    $scope.goToCurrentUserBooks = function(){
        $state.go("user_books", {nickname: $scope.user.get('nickname'), u: $scope.user.id});
    };
    
    $scope.loadUserData = function(userId) {
        $scope.showLoading();
        var query = new Parse.Query(Parse.User);
        return query.get(userId, {
            success: function(user) {
                $scope.viewUser = user;
                user.isInSubscriptions = isUserInSubscriptions(user);
                if ($scope.user && subscriptionsService.subscriptions.length) {
                    subscriptionsService.updateBooksInfoBySubUser($scope.viewUser);
                }
            },
            error: function() {
                $scope.viewUser = null;
            }
        }).fail($scope.showParseError).always(function(){
            $scope.hideLoading();
            $scope.$apply();
        });
    };
    
    $scope.hideLoading = function () {
        $scope.loading--;
    };
    
    $scope.showLoading = function () {
        $scope.loading++;
    };
    
    $scope.showParseError = function (error) {
        var message = error.message;
        if (error.code == 101) {
            message = 'Объект не найден';
        }
        $scope.errorMessage = message;
        
        $timeout(function(){
            $scope.errorMessage = null;
        }, 4000);
    };
    
    $scope.hideError = function(){
        $scope.errorMessage = null;
    };
    
    $scope.$on('$stateChangeStart', function(e, to) {
        $scope.hideError();
    });
    
    $scope.showIndexContent = true;
    $scope.$on('$stateChangeSuccess', function(e, to) {
        if (to.name === 'index') {
            $scope.showIndexContent = true;
        } else {
            $scope.showIndexContent = false;
        }
    });
    
    $scope.lastUsers = [];
    function loadLastUsers (){
        $scope.showLoading();
        var query = new Parse.Query(Parse.User);
        query.greaterThan("booksCount", 0);
        query.descending("updatedAt");
        query.limit(10);
        return query.find({
            success: function(result) {
                $scope.lastUsers = result;
            }
        }).fail($scope.showParseError).always(function(){
            $scope.hideLoading();
            $scope.$apply();
        });
    };
    loadLastUsers();
    
    /* subscriptions */
    
    $scope.subscriptions = [];
    function loadSubscriptions(){
            if ($scope.user) {
                $scope.showLoading();
                subscriptionsService.load($scope.user).done(function(){
                    $scope.subscriptions = subscriptionsService.subscriptions;
                }).fail($scope.showParseError).always(function () {
                    $scope.hideLoading();
                    $scope.$apply();
                });
            }
    };
    loadSubscriptions();
    
    $scope.subscribe = function (user, subUser) {
            $scope.showLoading();
            subscriptionsService.subscribe(user, subUser).done(function () {
                $scope.subscriptions = subscriptionsService.subscriptions;
                subUser.isInSubscriptions = true;
            }).fail($scope.showParseError).always(function () {
                $scope.hideLoading();
                $scope.$apply();
            });
     };
     
     $scope.unsubscribe = function (user, subUser) {
            $scope.showLoading();
            subscriptionsService.unsubscribe(user, subUser).done(function () {
                $scope.subscriptions = subscriptionsService.subscriptions;
                subUser.isInSubscriptions = false;
            }).fail($scope.showParseError).always(function () {
                $scope.hideLoading();
                $scope.$apply();
            });
     };
     
     var isUserInSubscriptions = function(subUser){
         if (!$scope.user || $scope.subscriptions.length === 0) {
             return false;
         }
         for (var i=0; i < $scope.subscriptions.length; i++) {
             if ($scope.subscriptions[i].get('subUser').id === subUser.id) {
                 return true;
             }
         }
         return false;
     };
     
     $scope.getSubscriptionBookCountDif = function(subscription){
         var dif = subscription.get('subUser').get('booksCount') - subscription.get('lastBooksCount');
         if (dif > 0) {
             return dif;
         }
     };
     /* end of subscriptions */
    
}]);


appControllers.controller('BookFormController', ['$scope', 'Book', function($scope, Book) {
        $scope.bookSaved = 0;

        $scope.saveBookAndReturn = function() {
            if (!$scope.form.$valid) {
                return;
            }
            $scope.showLoading();
            $scope.book.save($scope.user, function() {
                afterSave();
                $scope.bookSaved = 1;
                $scope.form.$setPristine();
                $scope.goToCurrentUserBooks();
            }).fail($scope.showParseError).always(function(){
                $scope.hideLoading(); 
                $scope.$apply();
            });
        };

        $scope.saveBookAndContinue = function() {
            if (!$scope.form.$valid) {
                return;
            }
            $scope.showLoading();
            $scope.book.save($scope.user, function() {
                afterSave();
                $scope.bookSaved = 1;
                var savedReadYear = $scope.book.readYear;
                $scope.book = new Book();
                $scope.book.readYear = savedReadYear;
                $scope.form.$setPristine();
            }).fail($scope.showParseError).always(function(){
                $scope.hideLoading(); 
                $scope.$apply();
            });
        };
        
        $scope.deleteBook = function() {
            $scope.showLoading();
            $scope.book.delete(function(){
                $scope.goToCurrentUserBooks();
            }).fail($scope.showParseError).always(function(){
                $scope.hideLoading(); 
                $scope.$apply();
            });
        };
        
        function afterSave() {
            if ($scope.book.wish) {
                $scope.book.wish.delete();
            }
        }
}]);

appControllers.controller('BookAddController', ['$scope', 'Book', 'Wish', '$stateParams', function($scope, Book, Wish, $stateParams) {
        $scope.book = new Book;
        $scope.book.readYear = (new Date()).getFullYear();
        
        if ($stateParams.w) {
            $scope.showLoading();
            var wish = new Wish;
            wish.load($stateParams.w, function(){
                $scope.book.title = wish.title;
                $scope.book.author = wish.author;
                var today = new Date();
                $scope.book.readYear = today.getFullYear();
                $scope.book.readMonth = today.getMonth()+1;
                $scope.book.readDay = today.getDate();
                
                $scope.book.wish = wish;
            }).fail($scope.showParseError).always(function() {
                $scope.hideLoading();
                $scope.$apply();
            });
        }
        
        if ($stateParams.ob) {
            $scope.showLoading();
            var otherBook = new Book;
            otherBook.load($stateParams.ob, function(){
                $scope.book.title = otherBook.title;
                $scope.book.author = otherBook.author;
            }).fail($scope.showParseError).always(function() {
                $scope.hideLoading();
                $scope.$apply();
            });
        }
}]);


appControllers.controller('BookEditController', ['$scope', 'Book', '$stateParams', function($scope, Book, $stateParams) {
        if ($stateParams.bookId) {
            $scope.showLoading();
            $scope.book = new Book;
            $scope.book.load($stateParams.bookId).fail($scope.showParseError).always(function() {
                $scope.hideLoading();
                $scope.$apply();
            });
        }
}]);


appControllers.controller('UserBooksController', ['$rootScope', '$scope', 'Book', '$stateParams', '$interval', '$state',
    function($rootScope, $scope, Book, $stateParams, $interval, $state) {
        $scope.loaded = false;
        if ($stateParams.u) {
            $scope.showLoading();
            var book = new Book;
            var user = new Parse.User();
            user.id = $stateParams.u;
            book.findOwnedByUser(user, function(books) {
                book.sortBooksByDate(books);
                $scope.booksDividedByYear = divideByYears(books);
                $scope.populateSideNavigation();
                $scope.loaded = true;
                
                if ($stateParams.y) {
                    $scope.scrollToYear($stateParams.y);
                }
            }, $scope.showParseError).always(function(){
                $scope.hideLoading(); 
                $scope.$apply();
            });
            $scope.loadUserData($stateParams.u);
        }
        
        function divideByYears(books) {
            var divided = {};
            
            var i, book, group;
            for (i in books) {
                book = books[i];
                if (book.readYear) {
                    group = book.readYear;
                } else {
                    group = 'other';
                }
                
                if (typeof divided[group] === 'undefined') {
                    divided[group] = [];
                }
                divided[group].push(book);
            }
            
            divided = sortObjectByKeys(divided);
            return divided;
        }
        
        function sortObjectByKeys(o) {
            var sorted = [],
                    key, a = [];

            for (key in o) {
                if (o.hasOwnProperty(key)) {
                    a.push(key);
                }
            }
            
            a.sort(function(a, b){
                if (a === 'other' && b !== 'other') {
                    return 1;
                }
                if (a !== 'other' && b === 'other') {
                    return -1;
                }
                if (a < b) {
                    return 1;
                }
                if (a > b) {
                    return -1;
                }
                return 0;
            });

            for (key = 0; key < a.length; key++) {
                sorted.push({'group': a[key], 'books': o[a[key]]});
            }
            return sorted;
        }
        
        $scope.populateSideNavigation = function(){
            $scope.navBookYears = [];
            for (var i in $scope.booksDividedByYear) {
                $scope.navBookYears.push($scope.booksDividedByYear[i].group);
            }
        };
        
        $scope.scrollToYear = function (year) {
            var scrolled = false;
            var intervalId = $interval(function () {
                if (scrolled) {
                    $interval.cancel(intervalId);
                    return;
                }
                var $elem = $('#year-' + year);
                if ($elem.length) {
                    window.scrollTo(0, $elem.offset().top - 80);
                    $('.sidenav-years > li.active').removeClass('active');
                    $('.sidenav-year-' + year).addClass('active');
                    scrolled = true;
                }
            }, 100);
        };
        $scope.goToYear = function (year) {
            $state.transitionTo('user_books', {nickname: $scope.viewUser.get('nickname'), u: $scope.viewUser.id, y: year}, {location: 'replace', inherit: false, notify: false});
            $scope.scrollToYear(year);
        };
        
        $scope.downloadCsv = function(){
            $scope.showLoading();
            Parse.Cloud.run('getBooksAsFile', {userId: $scope.viewUser.id}).done(function(file){
                location.href = file.url();
            }).fail($scope.showParseError).always(function(){
                $scope.hideLoading(); 
                $scope.$apply();
            });
        };

    
}]);

/* Wish */

appControllers.controller('WishController', ['$scope', 'Wish', '$stateParams', '$state',
    function($scope, Wish, $stateParams, $state) {
        
}]);
appControllers.controller('WishFormController', ['$scope', 'Wish', '$state', function($scope, Wish, $state) {
        $scope.bookSaved = 0;

        $scope.saveBookAndReturn = function() {
            if (!$scope.form.$valid) {
                return;
            }
            $scope.showLoading();
            $scope.book.save($scope.user, function() {
                $scope.bookSaved = 1;
                $scope.form.$setPristine();
                $state.go("wish.list");
            }).fail($scope.showParseError).always(function(){
                $scope.hideLoading(); 
                $scope.$apply();
            });
        };

        $scope.saveBookAndContinue = function() {
            if (!$scope.form.$valid) {
                return;
            }
            $scope.showLoading();
            $scope.book.save($scope.user, function() {
                $scope.bookSaved = 1;
                $scope.book = new Wish();
                $scope.book.priority = 50;
                $scope.form.$setPristine();
            }).fail($scope.showParseError).always(function(){
                $scope.hideLoading(); 
                $scope.$apply();
            });
        };
        
        $scope.deleteBook = function() {
            $scope.showLoading();
            $scope.book.delete(function(){
                $state.go("wish.list");
            }).fail($scope.showParseError).always(function(){
                $scope.hideLoading(); 
                $scope.$apply();
            });
        };
}]);

appControllers.controller('WishListController', ['$scope', 'Wish', '$stateParams', '$state',
    function($scope, Wish, $stateParams, $state) {
        $scope.wishList = [];
        $scope.loaded = false;
        $scope.showLoading();
            var book = new Wish;
            book.findOwnedByUser($scope.user, function(books) {
                $scope.wishList = books;
            }, $scope.showParseError).always(function(){
                $scope.loaded = true;
                $scope.hideLoading(); 
                $scope.$apply();
            });
}]);

appControllers.controller('WishAddController', ['$scope', 'Wish', 'Book', '$stateParams', function($scope, Wish, Book, $stateParams) {
        $scope.book = new Wish;
        $scope.book.priority = 50;
        
        if ($stateParams.ob) {
            $scope.showLoading();
            var otherBook = new Book;
            otherBook.loadWithUser($stateParams.ob, function(){
                $scope.book.title = otherBook.title;
                $scope.book.author = otherBook.author;
                $scope.book.notes = 'Увидел у ' + otherBook.user.get('nickname');
                if (otherBook.notes) {
                    $scope.book.notes += " с примечанием: " + otherBook.notes;
                }
            }).fail($scope.showParseError).always(function() {
                $scope.hideLoading();
                $scope.$apply();
            });
        }
}]);

appControllers.controller('WishEditController', ['$scope', 'Wish', '$stateParams', function($scope, Wish, $stateParams) {
        if ($stateParams.id) {
            $scope.showLoading();
            $scope.book = new Wish;
            $scope.book.load($stateParams.id).fail($scope.showParseError).always(function() {
                $scope.hideLoading();
                $scope.$apply();
            });
        }
}]);

/* End of Wish */

appControllers.controller('SettingsController', ['$scope', '$state', function($scope, $state) {
        $scope.settings = {
            nickname: $scope.user.get('nickname'),
            profile: $scope.user.get('profile')
        };
        $scope.saveUserSettings = function(){
            if (!$scope.settingsForm.$valid) {
                return;
            }
            $scope.showLoading();
            
            $scope.user.set('nickname', $scope.settings.nickname);
            $scope.user.set('profile', $scope.settings.profile);
            $scope.user.save().done(function(){
                $state.go("index");
            }).fail($scope.showParseError).always(function() {
                $scope.hideLoading();
                $scope.$apply();
            });;
        };
}]);

