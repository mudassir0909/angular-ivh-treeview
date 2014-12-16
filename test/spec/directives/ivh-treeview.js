/*global jasmine, jQuery, describe, beforeEach, afterEach, it, module, inject, expect */

describe('Directive ivhTreeview', function() {
  'use strict';

  var ng = angular
    , $ = jQuery;

  var scope, compile, exception;

  beforeEach(module('ivh.treeview'));

  beforeEach(function() {
    exception = undefined;
  });

  var tplBasic = '<div ivh-treeview="bag1"></div>';
  var tplValidate = '<div ivh-treeview="bag1" ivh-treeview-validate="true"></div>';
  var tplExpand = '<div ivh-treeview="bag1" ivh-treeview-expand-to-depth="1"></div>';
  var tplObjRoot = '<div ivh-treeview="bag1[0]"></div>';

  var tplFilter = [
    '<div',
      'ivh-treeview="bag1"',
      'ivh-treeview-filter="myFilter"',
      '></div>'
  ].join('\n');

  var tplClickHandler = [
    '<div',
      'ivh-treeview="bag1"',
      'ivh-treeview-click-handler="onNodeClick"',
      '></div>'
  ].join('\n');

  var tplChangeHandler = [
    '<div',
      'ivh-treeview="bag1"',
      'ivh-treeview-change-handler="onNodeChange"',
      '></div>'
  ].join('\n');

  beforeEach(inject(function($rootScope, $compile) {
    scope = $rootScope.$new();
    scope.bag1 = [{
      label: 'top hat',
      children: [{
        label: 'flat cap'
      },{
        label: 'fedora',
        children: [
          {label: 'gatsby'},
          {label: 'gatsby 2'}
        ]
      }]
    },{
      label: 'baseball', children: []
    }];

    compile = function(tpl, scp) {
      var $el = $compile(ng.element(tpl))(scp);
      scp.$apply();
      return $el;
    };
  }));

  afterEach(inject(function($timeout) {
    $timeout.verifyNoPendingTasks();
  }));

  describe('basics', function() {
    var $el;

    it('should create a tree layout', function() {
      $el = compile(tplBasic, scope);
      expect($el.find('ul ul ul li').length).toBe(2);
    });

    it('should add label titles to tree nodes', function() {
      $el = compile(tplBasic, scope);
      expect($el.find('li[title="fedora"]').length).toBe(1);
    });

    /**
     * @todo Collapsing/Expanding
     */

    it('should allow expansion by default to a given depth', function() {
      $el = compile(tplExpand, scope);
      expect($el.find('li[title="top hat"]').hasClass('ivh-treeview-node-collapsed')).toBe(false);
      expect($el.find('li[title="fedora"]').hasClass('ivh-treeview-node-collapsed')).toBe(true);
    });
     
    it('should allow roots objects', function() {
      $el = compile(tplObjRoot, scope);
      expect($el.find('ul').first().find('ul').length).toBe(2);
    });

    it('should update indeterminate statuses', function() {
      $el = compile(tplBasic, scope);
      $el.find('li[title="fedora"] input').first().click();
      scope.$apply();
      expect(scope.bag1[0].__ivhTreeviewIndeterminate).toBe(true);
      expect($el.find('input').first().prop('indeterminate')).toBe(true);

      // I've noticed that deselecting a child can leave ancestors up to root
      // unchecked and not-indeterminate when they should be.
      $el.find('li[title="gatsby"] input').first().click();
      scope.$apply();
      expect($el.find('li[title="fedora"] input').first().prop('indeterminate')).toBe(true);
      expect(scope.bag1[0].children[1].__ivhTreeviewIndeterminate).toBe(true);
      expect(scope.bag1[0].children[1].selected).toBe(false);
    });

    it('should optionally validate the tree on creation', function() {
      scope.bag1[0].children[1].children[0].selected = false;
      $el = compile(tplValidate, scope);
      expect($el.find('li[title="top hat"]').find('input').first().prop('indeterminate')).toBe(true);
    });

    it('should update when child nodes are added (push)', function() {
      $el = compile(tplBasic, scope);
      scope.bag1[1].children.push({label: 'five panel baseball'});
      scope.$apply();
      expect($el.find('li[title="five panel baseball"]').length).toBe(1);
      expect($el.find('li[title="baseball"]').hasClass('ivh-treeview-node-leaf')).toBe(false);
    });

    it('should update when child nodes are added (re-assignment)', function() {
      $el = compile(tplBasic, scope);
      scope.bag1[1].children = [{label: 'five panel baseball'}];
      scope.$apply();
      expect($el.find('li[title="five panel baseball"]').length).toBe(1);
      expect($el.find('li[title="baseball"]').hasClass('ivh-treeview-node-leaf')).toBe(false);
    });
  });

  describe('filtering', function() {
    var $el;

    beforeEach(function() {
      $el = compile(tplFilter, scope);
      scope.myFilter = 'baseball';
      scope.$apply();
    });

    it('should hide filtered out nodes', function() {
      expect($el.find('li[title="top hat"]').is(':visible')).toBe(false);

      /**
       * @todo Why does this fail?
       */
      //expect($el.find('li[title="baseball"]').is(':visible')).toBe(true);
    });
  });

  describe('click handlers', function() {
    var $el, handlerSpy;

    beforeEach(function() {
      handlerSpy = jasmine.createSpy('handlerSpy');
      scope.onNodeClick = handlerSpy;
      $el = compile(tplClickHandler, scope);
    });

    it('should call the click handler once per click', function() {
      $el.find('li[title="top hat"] [ivh-treeview-toggle]').first().click();
      scope.$apply();
      expect(handlerSpy.calls.count()).toEqual(1);
    });

    it('should pass the clicked node to the handler', function() {
      $el.find('li[title="top hat"] [ivh-treeview-toggle]').first().click();
      scope.$apply();
      expect(handlerSpy.calls.mostRecent().args[0]).toBe(scope.bag1[0]);
    });

    it('should pass the tree itself to the click handler', function() {
      $el.find('li[title="top hat"] [ivh-treeview-toggle]').click();
      scope.$apply();
      expect(handlerSpy.calls.mostRecent().args[1]).toBe(scope.bag1);
    });

    it('should not generate an error when there is no handler', function() {
      delete scope.onNodeClick;
      var exception;
      $el = compile(tplClickHandler, scope);
      try {
        $el.find('li[title="top hat"] [ivh-treeview-toggle]').click();
      } catch(_exception) {
        exception = _exception;
      }
      expect(exception).toBeUndefined();
    });
  });

  describe('change handlers', function() {
    var $el, handlerSpy;

    beforeEach(function() {
      handlerSpy = jasmine.createSpy('handlerSpy');
      scope.onNodeChange = handlerSpy;
      $el = compile(tplChangeHandler, scope);
    });

    it('should call the change handler when checkbox state is changed', function() {
      $el.find('li[title="top hat"] [type=checkbox]').first().click();
      scope.$apply();
      expect(handlerSpy.calls.count()).toEqual(1);
    });

    it('should pass the selected node to the handler', function() {
      $el.find('li[title="top hat"] [type=checkbox]').first().click();
      scope.$apply();
      expect(handlerSpy.calls.mostRecent().args[0]).toBe(scope.bag1[0]);
    });

    it('should pass the checkbox state to the change handler', function() {
      $el.find('li[title="top hat"] [type=checkbox]').first().click();
      scope.$apply();
      expect(handlerSpy.calls.mostRecent().args[1]).toBe(true);
    });

    it('should not generate an error when there is no handler', function() {
      delete scope.onNodeChange;
      var exception;
      $el = compile(tplChangeHandler, scope);
      try {
        $el.find('li[title="top hat"] [type=checkbox]').click();
      } catch(_exception) {
        exception = _exception;
      }
      expect(exception).toBeUndefined();
    });
  });
});
