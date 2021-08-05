//      FUNCTIONS TO EXPORT

const emailSearch = (db, email) => {
  for (const user in db) {
    if (email === db[user].email) {
      return db[user];
    }
  }
  return undefined;
};

const generateRandomString = () => {
  let randomString = '';
  randomString += Math.random().toString(20).substr(2, 6);
  return randomString;
};

module.exports = { emailSearch, generateRandomString};