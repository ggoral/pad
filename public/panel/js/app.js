(function() {
  'use strict';
  var padpanelApp;

  padpanelApp = angular.module('panelApp', ['ngRoute', 'padpanelFactory', 'padpanelDirective', 'padpanelControllers', 'padpanelServices']);

  padpanelApp.config([
    '$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {
      $locationProvider.html5Mode(false);
      return $routeProvider.when('/packages/:reponame?', {
        templateUrl: '/panel/partials/package-list.html',
        controller: 'PackageListCtrl'
      }).when('/package/:id', {
        templateUrl: '/panel/partials/package-detail.html',
        controller: 'PackageDetailCtrl'
      }).when('/share', {
        templateUrl: '/panel/partials/share.html',
        controller: 'ShareCtrl'
      }).when('/repository/add', {
        templateUrl: '/panel/partials/repository-add.html',
        controller: 'RepositoryAddCtrl'
      }).otherwise({
        redirectTo: '/packages'
      });
    }
  ]);

}).call(this);

(function() {
  'use strict';
  var padpanelDirective;

  padpanelDirective = angular.module('padpanelDirective', []);

  padpanelDirective.directive('qr', function($parse) {
    return {
      restrict: "EA",
      replace: true,
      link: function(scope, element, attrs) {
        return scope.$watch(attrs.qr, function(newValue, oldValue) {
          if (!newValue) {
            return;
          }
          return element.qrcode({
            "width": 100,
            "height": 100,
            "text": newValue
          });
        });
      }
    };
  });

}).call(this);

(function() {
  'use strict';
  var padpanelFactory;

  padpanelFactory = angular.module('padpanelFactory', []);

  padpanelFactory.factory('RepositoryInfo', function($q) {
    var getAddress;
    getAddress = function(reponame) {
      var def;
      def = $q.defer();
      $.getJSON('/panel/ipaddress', function(data) {
        var a;
        a = "http://" + data.ipaddress + ":" + data.port + "/" + reponame + ".epm";
        return def.resolve(a);
      });
      return def.promise;
    };
    return {
      getAddress: getAddress
    };
  });

}).call(this);

(function() {
  'use strict';
  var padpanelControllers;

  padpanelControllers = angular.module('padpanelControllers', []);

  padpanelControllers.controller('RepoListCtrl', [
    '$scope', '$location', 'Repo', function($scope, $location, Repo) {
      var repo;
      repo = $location.search().repo;
      if (repo) {
        $scope.selectedRepo = repo;
      } else {
        repo = 'local';
      }
      Repo.get(function(info) {
        return $scope.repos = info.repos;
      });
      $scope.selectedRepo = repo;
      $scope.searchText = '';
      return $scope.changeRepo = function(item) {
        $scope.selectedRepo = item;
        return $location.search({
          repo: item
        });
      };
    }
  ]);

  padpanelControllers.controller('PackageListCtrl', [
    '$scope', '$location', 'Package', function($scope, $location, Package) {
      var repo;
      repo = $location.search().repo;
      if (!repo) {
        repo = 'local';
      }
      $scope.selectedRepo = repo;
      return $scope.packages = Package.query({
        repo: repo
      });
    }
  ]);

  padpanelControllers.controller('ShareCtrl', [
    '$scope', '$location', 'Package', 'RepositoryInfo', function($scope, $location, Package, RepositoryInfo) {
      var repo;
      repo = $location.search().repo;
      if (!repo) {
        repo = 'local';
      }
      return RepositoryInfo.getAddress(repo).then(function(ad) {
        return $scope.address = ad;
      });
    }
  ]);

  padpanelControllers.controller('RepositoryAddCtrl', [
    '$scope', '$location', 'RepositoryInfo', function($scope, $location, RepositoryInfo) {
      var repo;
      repo = $location.search().repo;
      if (!repo) {
        repo = 'local';
      }
      $scope.packages = [];
      $scope.selectedRepo = repo;
      $scope.readingQr = false;
      $scope.epmUri = '';
      $scope.isScanning = true;
      $scope.isFinding = false;
      $scope.loadingMessage = 'Buscando paquetes, espere por favor ...';
      $scope.hasFinded = false;
      $scope.find = function(uri) {
        var url;
        $scope.isScanning = false;
        $scope.isFinding = true;
        url = "" + uri + "?expand=content";
        return $.getJSON("/request?uri=" + url).done(function(data) {
          var pkgs;
          pkgs = _.map(data, function(p) {
            return {
              uid: p.uid,
              title: p.content.title,
              img: "/request?uri=" + encodeURIComponent("" + uri + "?uid=" + p.uid + "&asset=front")
            };
          });
          return $scope.$apply(function() {
            $scope.packages = pkgs;
            $scope.isFinding = false;
            return $scope.hasFinded = true;
          });
        });
      };
      return $('#reader').html5_qrcode(function(data) {
        return $scope.$apply(function() {
          $scope.epmUri = data;
          $('#reader').attr('data-qr-remove', '');
          return $scope.find(data);
        });
      }, function(error) {}, function(videoError) {});
    }
  ]);

}).call(this);

(function() {
  'use strict';
  var padpanelServices;

  padpanelServices = angular.module('padpanelServices', ['ngResource']);

  padpanelServices.factory('Repo', [
    '$resource', function($resource) {
      return $resource('/repository', {});
    }
  ]);

  padpanelServices.factory('Package', [
    '$resource', function($resource) {
      return $resource('/package', {}, {
        query: {
          method: 'GET',
          isArray: true,
          params: {
            repo: '@repo'
          }
        }
      });
    }
  ]);

}).call(this);