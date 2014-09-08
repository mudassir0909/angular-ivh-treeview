
/**
 * Treeview tree node directive
 *
 * Handles filtering.
 *
 * @private
 * @package ivh.treeview
 * @copyright 2014 iVantage Health Analytics, Inc.
 */

angular.module('ivh.treeview').directive('ivhTreeviewNode', ['$compile', function($compile) {
  'use strict';
  return {
    restrict: 'A',
    scope: {
      node: '=ivhTreeviewNode'
    },
    require: '^ivhTreeview',
    link: function(scope, element, attrs, ctrl) {
      var opts = ctrl.opts()
        , filterAttr = opts.ivhTreeviewFilter
        , visibleAttr = opts.ivhTreeviewNodeVisibleAttribute
        , node = scope.$eval(attrs.ivhTreeviewNode);

      scope.ctrl = ctrl;

      // Nothing to do if we don't have a filter
      if(!filterAttr || filterAttr === 'undefined') {
        node[visibleAttr] = true;
        return;
      }
      
      var map = Array.prototype.map || function(fn) {
        var mapped = [];
        angular.forEach(this, function(item) {
          mapped.push(fn(item));
        });
        return mapped;
      };
      
      var filters = map.call(filterAttr.split('|'), function(filterStr) {
        var parts = filterStr.split(':');
        return parts;
      });
      
      var filterVars = [];
      angular.forEach(filters, function(f) {
        Array.prototype.push.apply(filterVars, f.slice(1));
      });
      
      var filterString = '[' + nodeAttr + '] | ' + filterAttr;
      var applyFilters = function() {
        var filtered = scope.$eval(filterString);
        node[visibleAttr] = filtered.length > 0;
      };
      
      angular.forEach(filterVars, function(f) {
        scope.$watch(f, applyFilters);
      });
    },
    template: [
      <div>
        <div title="{{ctrl.label(node)}}">
          (x)
          <input
            type="checkbox"
            ng-if="ctrl.useCheckboxes()"
            ivh-treeview-checkbox="node"/>
          <span class="ivh-treeview-node-label">
            {{ctrl.label(node)}}
          </span>
        </div>
        <ul class="ivh-treeview">
          <li ng-repeat="node in ctrl.children(node)">
          </li>
        </ul>
      </div>
    ].join('\n')
  };
}]);

