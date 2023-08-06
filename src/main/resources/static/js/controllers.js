var ppurl = "https://www.professorperson.app/"
var lukemindurl = "https://www.lukemind.com/"

var userId;
var editLog = false

var app = angular.module('app', [
    'ngRoute'
])
var loginApp = angular.module('loginApp', [])

app.config( function($routeProvider, $locationProvider) {
    $locationProvider.html5Mode(true)
    $routeProvider
    .when("/", {
        templateUrl : "welcome.html",
        controller : "homeController"
    })
    .when("/blackboard", {
        templateUrl : "wiki.html",
        controller : "logController"
    })
    .when("/journal", {
             templateUrl : "journal.html",
             controller : "journalController"
         })
    .when("/contact", {
        templateUrl : "contact.html",
        controller : "contactController"
    })
})

app.run(function($http) {
    $http.get(ppurl+"api/csrf").then((response) => {
       $http.defaults.headers.common[response.data.headerName] = response.data.token
    })
    $http.defaults.headers.common['Content-type'] = "application/json"
})

app.factory('loginFactory', function($http) {
    var login = function(callback) {
        $http.post(lukemindurl+"api/v1/auth/authenticate", {"username":$("#username").val(), "password":$("#password").val()}).then((response) => {
            $http.defaults.headers.common.Authorization = 'Bearer ' + response.data.token
            $(".ui-dialog-content").remove()
            userId = response.data.userId
            if (callback != null) {
                callback(response.data.id)
            }
        })
    }

    var register = function(callback) {
        $http.post(lukemindurl+"api/v1/auth/register", {"username":$("#username").val(), "password":$("#password").val()}).then((response) => {
            $http.defaults.headers.common.Authorization = 'Bearer ' + response.data.token
            $(".ui-dialog-content").remove()
            userId = response.data.userId
            if (callback != null) {
                callback()
            }
        })
    }

    var logout = function(callback) {
        $http.post(lukemindurl+"api/v1/auth/logout", $http.defaults.headers.common.Authorization.substring(7)).then((response) => {
            delete $http.defaults.headers.common["Authorization"]
            $(".ui-dialog-content").remove()
            userId = response.data.userId
            if (callback != null) {
                callback()
            }
        })
    }

    return {
        login,
        register,
        logout
    }
})

app.controller("loginController", function($scope, loginFactory) {
    $scope.edit = editLog

    $scope.login = function() {
        loginFactory.login(() => {
            $scope.edit = true
        })
    }

    $scope.register = function() {
        loginFactory.register(() => {
            $scope.edit = true;
        })
    }

    $scope.logout = function() {
        loginFactory.logout(() => {
            $scope.edit = false
        })
    }

    $scope.$watch("edit", (n, o) => {
        let logScope = angular.element($(".controller")).scope()
        if (logScope == null) {
            return
        }

        if (n === true) {
            logScope.edit = true
        } else {
            logScope.edit = false
        }
    })
})

app.controller("homeController", function($scope) {

})

app.controller("journalController", function($scope) {

})

app.controller("contactController", function($scope) {

})


app.controller("logController", function($scope, $http) {
    let loginScope = angular.element("#loginController").scope()
    $scope.edit = loginScope.edit

    $scope.$watch("log", (newValue, oldValue) => {
        if (newValue === undefined) {
            return
        }
        $http.put(ppurl+"api/log/", $scope.log)
    }, true)

    $scope.$watch("edit", (n, o) => {
        if (n === true) {
            $("#logText").removeAttr("disabled")
        } else {
            $("#logText").attr("disabled", "")
        }
        $scope.getLogs()
    })

    $scope.getLogs = function() {
        let id = userId != null ? userId : 1

        $http.get(ppurl+"api/logs/"+id).then((response) => {
            $scope.logs = response.data
            if ($scope.logs != null || $scope.logs.length > 0) {
                $scope.logs = $scope.logs.sort(function(a,b){
                  console.log(Date(a.dateModified))
                  return new Date(b.dateModified) - new Date(a.dateModified);
                });
                $scope.log = $scope.logs[0];
            }
        })
    }

    $scope.addLog = function() {
        $http.post(ppurl+"api/log/"+userId, {"logTitle": $scope.newLogTitle, "userId": userId}).then((response) => {
            $scope.log = response.data
            $scope.logs.push($scope.log)
        })
    }

    $scope.deleteLog = function() {
        $http.delete(ppurl+"api/log/"+$scope.log.id+"/"+userId).then((response) => {
            $scope.logs = response.data
            $scope.log = $scope.logs[$scope.logs.length - 1]
        })
    }

    $scope.selectLog = function(title) {
        $http.post(ppurl+"api/logbytitle/"+userId, {"title": title, "userId": userId}).then((response) => {
            $scope.log = response.data
            for (var i = 0; i < $scope.logs.length; i++) {
                let log = $scope.logs[i]
                if (log.id == $scope.log.id) {
                    $scope.logs.splice(i, 1);
                }
            }
            $scope.logs.unshift($scope.log)
        })
    }
})

function signIn() {
    var scope = angular.element($("#loginController")).scope()
    editLog = true
    scope.login()
}

function register() {
    var scope = angular.element($("#loginController")).scope()
    editLog = true
    scope.register()
}

function showPassword() {
    $("#showPasswordWrapper").empty()
    $("#showPasswordWrapper").append($("<ion-icon id='showPasswordBtn' name='eye-outline' onclick='hidePassword()' tabindex='3'>"))
    $("#password").attr("type", "text")
}

function hidePassword() {
    $("#showPasswordWrapper").empty()
    $("#showPasswordWrapper").append($("<ion-icon id='showPasswordBtn' name='eye-off-outline' onclick='showPassword()' tabindex='3'>"))
    $("#password").attr("type", "password")
}

function showLoginDialog() {
    $("<div onkeydown='onEnter()'><p>Enter your credentials</p> <input placeholder='Username...' id='username' tabindex='1'/> <input type='password' placeholder='Password...' id='password' tabindex='2'/> <div id='showPasswordWrapper'><ion-icon id='showPasswordBtn' name='eye-off-outline' onclick='showPassword()' tabindex='3'></ion-icon></div> <input onclick='signIn()' type='button' value='Sign in' tabindex='4'/> <input onclick='register()' type='button' value='Register' tabindex='5'/> </div>").dialog()
}

function onEnter() {
    //if enter pressed
    if (event.keyCode == 13) {
        signIn()
    }
}