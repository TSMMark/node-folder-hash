﻿
var folderHash = require('../index');

var helper = require('./helper/helper.js');

var fs = require('fs');
var path = require('path');
var Q = require('q');

var assert = require('assert');
var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);
chai.should();


var sampleFolder = 'sample-folder';

/**
 * structure created:
 * sample-folder
 * - file1
 * - file2
 * - subfolder1
 *   - file1
 *   - file2
 * - f2
 *   - afile
 *   - subfolder1
 *     - file1
 *     - file2
 */



// two files with same name and same content should have the same hash
// two folders with same name and same content should have the same hash
// two 

before(helper.createTestFolderStructure(sampleFolder));


describe('Should generate hashes', function () {
    it('when called as a promise', function () {
        return folderHash.hashElement('file1', sampleFolder).should.eventually.have.property('hash');
    });
    
    it('when executed with an error-first callback', function (done) {
        folderHash.hashElement('file1', sampleFolder, function (err, hash) {
            if (err) throw err;
            else {
                assert.ok(hash.hash);
                done();
            }
        });
    });
});


describe('Generating hashes over files, it', function () {
    var hash1;
    before(function (done) {
        return folderHash.hashElement('file1', sampleFolder).then(function (hash) {
            hash1 = hash;
            done();
        });
    });
    
    it('should return the same hash if a file was not changed', function () {
        return folderHash.hashElement('file1', sampleFolder).then(function (hash2) {
            return assert.equal(hash1.hash, hash2.hash);
        });
    });
    
    it('should return the same hash if a file has the same name and content, but exists in a different folder', function () {
        return folderHash.hashElement('file1', path.join(sampleFolder, 'subfolder1')).then(function (hash2) {
            return assert.equal(hash1.hash, hash2.hash);
        });
    });
    
    it('should return a different hash if the file has the same name but a different content', function () {
        return folderHash.hashElement('file1', path.join(sampleFolder, 'f2')).then(function (hash2) {
            return assert.notEqual(hash1.hash, hash2.hash);
        });
    });

    it('should return a different hash if the file has the same content but a different name', function () {
        return folderHash.hashElement('file2', sampleFolder).then(function (hash2) {
            return assert.notEqual(hash1.hash, hash2.hash);
        });
    });
});

describe('Generating a hash over a folder, it', function () {
    function recAssertHash(hash) {
        assert.ok(hash.hash);
        if (hash.children && hash.children.length > 0) {
            hash.children.forEach(recAssertHash);
        }
    }
    
    it('generates a hash over the folder name and over the combination hashes of all its children', function () {
        return folderHash.hashElement('f2', sampleFolder).then(recAssertHash);
    });
    
    it('generates different hashes if the folders have the same content but different names', function () {
        return Q.all([
            folderHash.hashElement('subfolder2', path.join(sampleFolder, 'f2')), 
            folderHash.hashElement('subfolder1', sampleFolder)
        ]).then(function (hashes) {
            assert.ok(hashes.length > 1, 'should have returned at least two hashes');
            assert.notEqual(hashes[0].hash, hashes[1].hash);
        });
    });
    
    it('generates different hashes if the folders have the same name but different content (one file content changed)', function () {
        return Q.all([
            folderHash.hashElement('subfolder1', path.join(sampleFolder, 'f3')), 
            folderHash.hashElement('subfolder1', sampleFolder)
        ]).then(function (hashes) {
            assert.ok(hashes.length > 1, 'should have returned at least two hashes');
            assert.notEqual(hashes[0].hash, hashes[1].hash);
        });
    });

    it('generates the same hash if the folders have the same name and the same content', function () {
        return Q.all([
            folderHash.hashElement('subfolder1', path.join(sampleFolder, 'f2')), 
            folderHash.hashElement('subfolder1', sampleFolder)
        ]).then(function (hashes) {
            assert.ok(hashes.length > 1, 'should have returned at least two hashes');
            assert.equal(hashes[0].hash, hashes[1].hash);
        });
    });
});