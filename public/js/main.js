Parse.initialize("xyLDoOd7fB5J4gKKJYlYRzx0mlo1w6FUsfzCgwEX", "KL0bUmfH1JBBq86gqB6aAgoy1dr2cINUQTgPgNsG");

window.authCallback = function(){};
window.showLoginLoading = function(){};
window.hideLoginLoading = function(){};

uLogin.setStateListener("uLogin", "open", function(){
    window.showLoginLoading();
});
uLogin.setStateListener("uLogin", "close", function(){
    window.hideLoginLoading();
});

var listApp = angular.module('listApp', ['ui.router', 'appServices', 'appControllers']);
listApp.directive('bookForm', function(){
    return {
        templateUrl: "templates/directives/book-form.html"
    };
});

listApp.directive('wishForm', function(){
    return {
        templateUrl: "templates/directives/wish-form.html"
    };
});

listApp.directive('updateTitle', ['$rootScope', '$timeout', '$stateParams',
  function($rootScope, $timeout, $stateParams) {
    return {
      link: function(scope, element) {

        var listener = function(event, toState) {

          $timeout(function() {
            var title = (toState.data && toState.data.pageTitle) 
            ? toState.data.pageTitle  + ' - Книгопись'
            : 'Книгопись';
            
            for (var param in $stateParams) {
                var regExp = new RegExp('%' + param + '%', 'ig');
                title = title.replace(regExp, $stateParams[param]);
            }
            
            element.text(title);
          });
        };

        $rootScope.$on('$stateChangeSuccess', listener);
      }
    };
  }
]);

listApp.config(function ($stateProvider, $urlRouterProvider) {
    //
    // For any unmatched url, redirect to /state1
    //$urlRouterProvider.otherwise("/state1");
    //
    // Now set up the states
    $stateProvider
    
            .state('index', {
                url: '',
                template: ''
            })
            
            .state('settings', {
                url: '/settings',
                templateUrl: 'templates/states/settings.html',
                controller: 'SettingsController',
                data: { pageTitle: 'Настройки' }
            })
    
            .state('book', {
                url: '/book',
                abstract: true,
                template: '<ui-view/>'
            })

            .state('book.add', {
                url: '/add?w&ob',
                templateUrl: 'templates/states/book.add.html',
                controller: 'BookAddController',
                data: { pageTitle: 'Добавление книги' }
            })

            .state('book.edit', {
                url: '/edit/:bookId',
                templateUrl: 'templates/states/book.edit.html',
                controller: 'BookEditController',
                data: { pageTitle: 'Редактирование книги' }
            })
            
            .state('user_books', {
                url: '/:nickname/books?u&y',
                templateUrl: 'templates/states/user_books.html',
                controller: 'UserBooksController',
                data: { pageTitle: '%nickname% - Список прочитанных книг' }
            })
            
            .state('wish', {
                url: '/wish',
                abstract: true,
                controller: 'WishController',
                template: '<ui-view/>'
            })
            .state('wish.add', {
                url: '/add?ob',
                templateUrl: 'templates/states/wish.add.html',
                controller: 'WishAddController',
                data: {pageTitle: 'Добавление книги в "Прочитать позже"'}
            })
            .state('wish.edit', {
                url: '/edit/:id',
                templateUrl: 'templates/states/wish.edit.html',
                controller: 'WishEditController',
                data: { pageTitle: 'Редактирование книги из "Прочитать позже"' }
            })
            .state('wish.list', {
                url: '/list',
                templateUrl: 'templates/states/wish.list.html',
                controller: 'WishListController',
                data: {pageTitle: 'Прочитать позже'}
            });
});

