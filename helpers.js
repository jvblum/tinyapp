const getUserByUsername = (userReq, usersDb) => {
  for (const user in usersDb) {
    if (usersDb[user].username === userReq)
      return usersDb[user]; // return user object
  }
  return false;
};

const getUserByEmail = (emailReq, usersDb) => {
  for (const user in usersDb) {
    if (usersDb[user].email === emailReq)
      return usersDb[user]; // return user object
  }
  return false;
};

const urlsForUser = (userId, urlsDb) => {
  const urls = [];
  for (const url in urlsDb) {
    if (urlsDb[url].userID === userId) urls.push(urlsDb[url].shortURL);
  }
  return urls;
};


const generateRandomString = (length) => {
  let res = '';
  const chars = 'pyfgcrlaoeuidhtnsqjkxbmwvzPYFGCRLAOEUIDHTNSQJKXBMWVZ1234567890';
  for (let i = 0; i < length; i++) {
    const rand = Math.floor(Math.random() * chars.length);
    res += chars[rand];
  }
  return res;
};

const doesThisUrlIdExist = (urlId, urlDb) => {
  for (const url in urlDb) {
    if (url === urlId)
      return true;
  }
  return false;
};

module.exports = {
  getUserByUsername,
  getUserByEmail,
  urlsForUser,
  generateRandomString,
  doesThisUrlIdExist
};