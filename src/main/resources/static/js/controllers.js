var ppurl = "https://www.professorperson.app/"
var lukemindurl = "https://www.lukemind.com/"

var userId;
var editLog = false

var app = angular.module('app', [
    'ngRoute'
])

app.config( function($routeProvider, $locationProvider) {
    $locationProvider.html5Mode(true)
    $routeProvider
    .when("/", {
        templateUrl : "welcome.html",
        controller : "homeController"
    })
    .when("/wiki", {
        templateUrl : "wiki.html",
        controller : "logController"
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
        $http.post("http://localhost:8080/api/v1/auth/register", {"username":$("#username").val(), "password":$("#password").val()}).then((response) => {
            $http.defaults.headers.common.Authorization = 'Bearer ' + response.data.token
            $(".ui-dialog-content").remove()
            userId = response.data.userId
            if (callback != null) {
                callback()
            }
        })
    }

    return {
        login,
        register
    }
})

app.controller("homeController", function($scope, loginFactory) {
    $("html").css("overflow", "scroll")

    $scope.login = function() {
        loginFactory.login(null)
    }

    $scope.register = function() {
        loginFactory.register(null)
    }
})

app.controller("contactController", function($scope, loginFactory) {
    $("html").css("overflow", "scroll")

    $scope.login = function() {
        loginFactory.login(null)
    }

    $scope.register = function() {
        loginFactory.register(null)
    }
})


app.controller("logController", function($scope, $http, loginFactory) {
    $scope.edit = editLog
    //$("html").css("overflow", "hidden")

    $scope.$watch("log", (newValue, oldValue) => {
        if (oldValue == undefined || newValue.id != oldValue.id) {
            return
        }
        $http.put(ppurl+"api/log/", $scope.log)
    }, true)

    $scope.$watch("edit", (n, o) => {
        if (n === true || editLog) {
            editLog = true
            $("#logText").removeAttr("disabled")
        } else {
            $("#logText").attr("disabled", "")
        }
    })

    $scope.login = function() {
        loginFactory.login(() => {
            $scope.edit = true
            $http.get(ppurl+"api/logs/"+userId).then((response) => {
                $scope.logs = response.data
                if ($scope.logs != null || $scope.logs.length > 0) {
                    $scope.log = $scope.logs[0];
                }
            })
        })
    }

    $scope.register = function() {
        loginFactory.register(() => {
            $scope.edit = true
            $http.get(ppurl+"api/logs/"+userId).then((response) => {
            $scope.logs = response.data
                if ($scope.logs != null || $scope.logs.length > 0) {
                    $scope.log = $scope.logs[0];
                }
            })
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
        })
    }
})

function signIn() {
    var scope = angular.element($(".controller")).scope()
    editLog = true
    scope.login()
}

function register() {
    var scope = angular.element($(".controller")).scope()
    editLog = true
    scope.register()
}

function showLoginDialog() {
    $("<div><p>Enter your credentials</p> <input placeholder='Username...' id='username'/> <input type='password' placeholder='Password...' id='password'/> <input onclick='signIn()' type='button' value='Sign in'/> <input onclick='register()' type='button' value='Register'/> </div>").dialog()
}