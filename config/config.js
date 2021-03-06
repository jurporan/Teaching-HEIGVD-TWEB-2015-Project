var path = require('path'),
    rootPath = path.normalize(__dirname + '/..'),
    env = process.env.NODE_ENV || 'development';

var config = {
  development: {
    root: rootPath,
    app: {
      name: 'teaching-heigvd-tweb-2015-project'
    },
    port: 3000,
    db: 'mongodb://localhost/teaching-heigvd-tweb-2015-project-development'
  },

  test: {
    root: rootPath,
    app: {
      name: 'teaching-heigvd-tweb-2015-project'
    },
    port: 3000,
    db: 'mongodb://localhost/teaching-heigvd-tweb-2015-project-test'
  },

  production: {
    root: rootPath,
    app: {
      name: 'teaching-heigvd-tweb-2015-project'
    },
    port: process.env.PORT,
    db: process.env.MONGOLAB_URI
  }
};

module.exports = config[env];
