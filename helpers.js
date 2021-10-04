// takes email & user database; returns user object or false;
const getUserByEmail = (emailReq, usersDb) => {
  for (const user in usersDb) {
    if (usersDb[user].email === emailReq)
      return usersDb[user]; 
  }
  return false;
};

// takes userId & urls database; returns array of shortURL that corresponds with userId

const urlsForUser = (userId, urlsDb) => {
  const urls = [];
  for (const url in urlsDb) {
    if (urlsDb[url].userID === userId) urls.push(urlsDb[url].shortURL);
  }
  return urls;
};

// takes number; returns string with the number as its length; 
// used for generating shortURL and userId;
const generateRandomString = (length) => {
  let res = '';
  const chars = 'pyfgcrlaoeuidhtnsqjkxbmwvzPYFGCRLAOEUIDHTNSQJKXBMWVZ1234567890';
  for (let i = 0; i < length; i++) {
    const rand = Math.floor(Math.random() * chars.length);
    res += chars[rand];
  }
  return res;
};

// takes urlId and urls database; checks if url is in database;
const doesThisUrlIdExist = (urlId, urlDb) => {
  for (const url in urlDb) {
    if (url === urlId)
      return true;
  }
  return false;
};

module.exports = {
  getUserByEmail,
  urlsForUser,
  generateRandomString,
  doesThisUrlIdExist
};