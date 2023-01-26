var ppurl = "https://www.professorperson.app/"
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
    .when("/log", {
        templateUrl : "log.html",
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

app.controller("homeController", function($scope) {})
app.controller("contactController", function($scope) {})

var editLog = false
app.controller("logController", function($scope, $http) {
    $http.get(ppurl+"api/logs/").then((response) => {
        $scope.logs = response.data
        if ($scope.logs != null || $scope.logs.length > 0) {
            $scope.log = $scope.logs[0];
        }
    })

    $scope.$watch("log", (newValue, oldValue) => {
        if (oldValue == undefined || newValue.id != oldValue.id) {
            return
        }
        $http.put(ppurl+"api/log/", $scope.log)
    }, true)

    $("#logTitle").autocomplete({
        source: function(req, res) {
            $http.get(ppurl+"api/logtitles/").then((response) => {
                res(response.data)
            })
        },
        select: function(event, ui) {
            const d = {"title": ui.item.label, "userId": $("#userID").val()}
            console.log(d)
            $http.post(ppurl+"api/logbytitle", {"title": ui.item.label, "userId": $("#userID").val()}).then((response) => {
                $scope.log = response.data
            })
        }
    })

    $scope.titleClick = function() {
        $("#logTitle").autocomplete("search", " ")
    }

    $scope.login = function() {
        $("<div><p>Enter your credentials</p> <input placeholder='Username...' id='username'/> <input type='password' placeholder='Password...' id='password'/> <input onclick='signIn()' type='button' value='Sign in'/> </div>").dialog()
    }

    $scope.signIn = function() {
        $http.post("https://www.lukemind.com/api/v1/auth/authenticate", {"username":$("#username").val(), "password":$("#password").val()}).then((response) => {

            $http.defaults.headers.common.Authorization = 'Bearer ' + response.data.token
            $(".ui-dialog-content").dialog("close")
            $scope.edit = true

            $http.get(ppurl+"api/logs/").then((response) => {
                $scope.logs = response.data
                if ($scope.logs != null || $scope.logs.length > 0) {
                    $scope.log = $scope.logs[0];
                }
            })
        })
    }

    $scope.$watch("edit", (n, o) => {
        if (n === true || editLog) {
            editLog = true
            $("#logText").removeAttr("disabled")
        } else {
            $("#logText").attr("disabled", "")
        }
    })
})

function signIn() {
    var scope = angular.element($(".logwrapper")).scope()
    scope.signIn()
}
