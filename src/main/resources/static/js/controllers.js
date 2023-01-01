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
    })