'use strict';

import { 
    beforeEach, 
    describe as test, 
    it as assert } from 'mocha';
import { expect }  from 'chai';

var Oculo = require('../dist/oculo');

test('SceneManager', function() {
    var sm;

    beforeEach('Instantiate a new scene manager', function() {
        sm = new Oculo.SceneManager();
    });
    
    afterEach('Clean up scene manager', function() {
        sm.destroy();
    });
    
    test('destroy', function() {
        assert('references should be released', function() {
            sm.destroy()
            expect(sm.activeScene).to.be.null;
            expect(sm.view).to.be.null;
            expect(sm._scenes).to.be.empty;
        });
    });
    
    test('add', function() {
        assert('should add a newly instantiated scene', function() {
            sm.add('scene1', new Oculo.Scene(null));
            expect(sm._scenes).to.have.property('scene1');
        });
    });
    
    test('get', function() {
        assert('should return the requested scene', function() {
            var scene;
            sm.add('scene1', new Oculo.Scene(null));
            scene = sm.get('scene1');
            expect(scene).to.be.instanceof(Oculo.Scene);
        });
        
        assert('should not return the requested scene', function() {
            var scene;
            scene = sm.get('scene2');
            expect(scene).to.be.undefined;
        });
    });
    
    test('setActiveScene', function() {
        assert('should set the specified scene to the active scene', function() {
            sm.add('scene1', new Oculo.Scene(null));
            sm.setActiveScene('scene1');
            expect(sm.activeScene).to.be.instanceof(Oculo.Scene);
        });
    });
});