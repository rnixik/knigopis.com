var appServices = angular.module('appServices', []);

appServices.factory('Book', function(){
    
    var Book = Parse.Object.extend("Book");

    var service = function() {
        this._class = Book;
        this._instance = null;
        
        this.id = null;
        this.title = null;
        this.author = null;
        this.readYear = null;
        this.readMonth = null;
        this.readDay = null;
        this.notes = null;
        
        this.wish = null;
    };
    
    service.prototype._afterLoad = function(obj, successCallback) {
        this._instance = obj;
        
        this.id = obj.id;
        this.title = obj.get('title');
        this.author = obj.get('author');
        this.readYear = obj.get('readYear');
        this.readMonth = obj.get('readMonth');
        this.readDay = obj.get('readDay');
        this.notes = obj.get('notes');
        this.createdAt = obj.createdAt;
        this.updatedAt = obj.updatedAt;
        this.user = obj.get('user');
        
        if (successCallback) {
            successCallback();
        }
    };
    
    service.prototype._beforeSave = function() {
        if (this.notes === '') {
            this.notes = null;
        }
        
        this._instance.set('title', this.title);
        this._instance.set('author', this.author);
        this._instance.set('readYear', this.readYear);
        this._instance.set('readMonth', this.readMonth);
        this._instance.set('readDay', this.readDay);
        this._instance.set('notes', this.notes);
    };
    
    service.prototype.load = function (id, successCallback, failCallback) {
        var query = new Parse.Query(Book);
        var self = this;
        return query.get(id, {
            success: function(book){
                self._afterLoad(book, successCallback);
            },
            error: function(error) {
                if (failCallback) {
                    failCallback(error);
                }
            }
        });
    };
    
    service.prototype.loadWithUser = function (id, successCallback, failCallback) {
        var query = new Parse.Query(Book);
        query.include('user');
        var self = this;
        return query.get(id, {
            success: function(book){
                self._afterLoad(book, successCallback);
            },
            error: function(error) {
                if (failCallback) {
                    failCallback(error);
                }
            }
        });
    };
    
    service.prototype.save = function (ownerUser, successCallback, failCallback) {
        if (!this._instance) {
            this._instance = new this._class();
        }
        
        var bookACL = new Parse.ACL(ownerUser);
        bookACL.setPublicReadAccess(true);
        this._instance.setACL(bookACL);
        this._instance.set('user', ownerUser);
        
        this._beforeSave();
        
        var self = this;
        return this._instance.save(null, {
            success: function (book) {
                self._afterLoad(book, successCallback);
            },
            error: function(error) {
                if (failCallback) {
                    failCallback(error);
                }
            }
        });
        
    };
    
    service.prototype.findOwnedByUser = function(user, successCallback, failCallback) {
        var query = new Parse.Query(Book);
        query.equalTo("user", user);
        query.descending("readYear");
        /* @TODO: improve this method to get more than 1000 */
        query.limit(1000);
        
        return query.find({
            success: function(usersBooks) {
                var preparedResult = [];
                for (var i=0; i < usersBooks.length; i++) {
                    var instance = new service();
                    instance._afterLoad(usersBooks[i]);
                    preparedResult.push(instance);
                }
                successCallback(preparedResult);
            },
            error: function(error) {
                if (failCallback) {
                    failCallback(error);
                }
            }
        });
    };
    
    service.prototype.delete = function (successCallback, failCallback) {
        if (!this._instance) {
            return;
        }
        return this._instance.destroy({
            success: function() {
                if (successCallback) {
                    successCallback();
                }
            },
            error: function(error) {
                if (failCallback) {
                    failCallback(error);
                }
            }
        });
    };
    
    
    service.prototype.sortBooksByDate = function(books) {
        function compare(a, b) {
            if (a.readYear > b.readYear) {
                return -1;
            } 
            if (a.readYear < b.readYear) {
                return 1;
            }
            if (!a.readMonth && b.readMonth) {
                return 1;
            }
            if (a.readMonth && !b.readMonth) {
                return -1;
            }
            if (a.readMonth < b.readMonth) {
                return 1;
            }
            if (a.readMonth > b.readMonth) {
                return -1;
            }
            if (a.readDay < b.readDay) {
                return 1;
            }
            if (a.readDay > b.readDay) {
                return -1;
            }
            if (a.createdAt > b.createdAt) {
                return -1;
            }
            if (a.createdAt < b.createdAt) {
                return 1;
            }
            return 0;
        }

        books.sort(compare);
    };
    
    service.prototype.getReadDateForList = function() {
        if (this._instance) {
            var date = '';
            if (this.readYear && this.readMonth) {
                var month = this.readMonth;
                if (month < 10) {
                    month = '0' + month;
                }
                date = this.readYear + '-' + month;
            }
            if (this.readYear && this.readDay) {
                var day = this.readDay;
                if (day < 10) {
                    day = '0' + day;
                }
                date += '-' + day;
            }
            return date;
        }
        
    };

    
    
    return service;

    
});

appServices.factory('Wish', function(){
    
    var Wish = Parse.Object.extend("Wish");

    var service = function() {
        this._instance = null;
        
        this.id = null;
        this.title = null;
        this.author = null;
        this.priority = null;
        this.notes = null;
    };
    
    service.prototype._afterLoad = function(obj, successCallback) {
        this._instance = obj;
        
        this.id = obj.id;
        this.title = obj.get('title');
        this.author = obj.get('author');
        this.priority = obj.get('priority');
        this.notes = obj.get('notes');
        this.user = obj.get('user');
        
        if (successCallback) {
            successCallback();
        }
    };
    
    service.prototype._beforeSave = function() {
        this._instance.set('title', this.title);
        this._instance.set('author', this.author);
        this._instance.set('priority', this.priority);
        this._instance.set('notes', this.notes);
    };
    
    service.prototype.load = function (id, successCallback, failCallback) {
        var query = new Parse.Query(Wish);
        var self = this;
        return query.get(id, {
            success: function(book){
                self._afterLoad(book, successCallback);
            },
            error: function(error) {
                if (failCallback) {
                    failCallback(error);
                }
            }
        });
    };
    
    service.prototype.save = function (ownerUser, successCallback, failCallback) {
        if (!this._instance) {
            this._instance = new Wish;
        }
        
        var bookACL = new Parse.ACL(ownerUser);
        this._instance.setACL(bookACL);
        this._instance.set('user', ownerUser);
        
        this._beforeSave();
        
        var self = this;
        return this._instance.save(null, {
            success: function (book) {
                self._afterLoad(book, successCallback);
            },
            error: function(error) {
                if (failCallback) {
                    failCallback(error);
                }
            }
        });
        
    };
    
    service.prototype.findOwnedByUser = function(user, successCallback, failCallback) {
        var query = new Parse.Query(Wish);
        query.equalTo("user", user);
        query.descending("priority");
        /* @TODO: improve this method to get more than 1000 */
        query.limit(1000);
        
        return query.find({
            success: function(usersBooks) {
                var preparedResult = [];
                for (var i=0; i < usersBooks.length; i++) {
                    var instance = new service();
                    instance._afterLoad(usersBooks[i]);
                    preparedResult.push(instance);
                }
                successCallback(preparedResult);
            },
            error: function(error) {
                if (failCallback) {
                    failCallback(error);
                }
            }
        });
    };
    
    service.prototype.delete = function (successCallback, failCallback) {
        if (!this._instance) {
            return;
        }
        return this._instance.destroy({
            success: function() {
                if (successCallback) {
                    successCallback();
                }
            },
            error: function(error) {
                if (failCallback) {
                    failCallback(error);
                }
            }
        });
    };
    
    return service;

    
});

appServices.factory('Subscriptions', function(){
    
    var Subscription = Parse.Object.extend("Subscription");
    
    var service = function() {
        this.subscriptions = [];
    };
    
    
    
    service.prototype.load = function(user){
        var query = new Parse.Query(Subscription);
        query.equalTo("user", user);
        query.include('subUser');
        var self = this;
        return query.find({
            success: function(subscriptions) {
                self.subscriptions = subscriptions;
                self.sortByUpdate();
            }
        });
    };
    
    service.prototype.sortByUpdate = function () {
        function compareByUpdate(a, b) {
            var dateA = a.get('subUser').updatedAt;
            var dateB = b.get('subUser').updatedAt;
            if (dateA > dateB) {
                return -1;
            }
            if (dateA < dateB) {
                return 1;
            }
            return 0;
        };
        this.subscriptions = this.subscriptions.sort(compareByUpdate);
    };
    
    service.prototype.subscribe = function (user, subUser) {
        var subscription = new Subscription();
        var subACL = new Parse.ACL(user);
        subscription.setACL(subACL);
        subscription.set("user", user);
        subscription.set("subUser", subUser);
        subscription.set("lastBooksCount", subUser.get('booksCount'));
        
        var self = this;
        return subscription.save(null, {
            success: function (subscription) {
                subscription.set("subUser", subUser);
                self.subscriptions.push(subscription);
                self.sortByUpdate();
            }
        });
    };
    
    service.prototype.unsubscribe = function (user, subUser) {        
        var query = new Parse.Query(Subscription);
        query.equalTo("user", user);
        query.equalTo("subUser", subUser);
        
        var self = this;
        return query.first({
            success: function(subscription) {
                var newSubscriptions = [];
                for (var i=0; i < self.subscriptions.length; i++) {
                    if (subscription.id !== self.subscriptions[i].id) {
                        newSubscriptions.push(self.subscriptions[i]);
                    }
                }
                self.subscriptions = newSubscriptions;
                subscription.destroy();
            }
        });
    };
    
    service.prototype.updateBooksInfoBySubUser = function (subUser) {
        for (var i = 0; i < this.subscriptions.length; i++) {
            var subscription = this.subscriptions[i];
            if (subscription.get('subUser').id === subUser.id) {
                subscription.set('lastBooksCount', subUser.get('booksCount'));
                subscription.save();
            }
        }
    };
    
    return service;
});
