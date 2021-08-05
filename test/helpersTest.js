const { assert } = require('chai');

const { emailSearch } = require('../helpers.js');

const testUsers = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

describe('emailSearch', function() {
  it('should return a user with valid email', function() {
    assert.equal(emailSearch(testUsers, 'user@example.com'), testUsers["userRandomID"]);
  });
  it('should return false if a user doesn\'t exist', function() {
    assert.notEqual(emailSearch(testUsers, 'user@example.com'), testUsers["user3RandomID"]);
  });
  it('should return undefined if a users email does not exist', function() {
    assert.equal(emailSearch(testUsers, 'user3@example.com'), undefined);
  });
});