/********************************************
 * DO NOT EDIT THIS FILE
 * the verification process may break
 *******************************************/
"use strict"

var express = require('express');
var app = express();
try{
  var mongoose = require('mongoose');
} catch (e) {
  console.log(e);
}
var fs = require('fs');
var path = require('path');
var bodyParser = require('body-parser');
var router = express.Router();

var enableCORS = function(req, res, next) {
  if (!process.env.DISABLE_XORIGIN) {
    var allowedOrigins = ['https://marsh-glazer.gomix.me','https://narrow-plane.gomix.me', 'https://www.freecodecamp.com'];
    var origin = req.headers.origin;
    if(!process.env.XORIGIN_RESTRICT || allowedOrigins.indexOf(origin) > -1) {
      console.log(req.method);
      res.set({
        "Access-Control-Allow-Origin" : origin,
        "Access-Control-Allow-Methods" : "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers" : "Origin, X-Requested-With, Content-Type, Accept"
      });
    }
  }
  next();
};

// global setting for safety timeouts to handle possible
// wrong callbacks that will never be called
var timeout = 10000;

app.use(bodyParser.urlencoded({extended: 'false'}));
app.use(bodyParser.json());

app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

router.get('/file/*?', function(req, res, next) {
  if(req.params[0] === '.env') { return next({status: 401, message: 'ACCESS DENIED'}) }
  fs.readFile(path.join(__dirname, req.params[0]), function(err, data){
    if(err) { return next(err) }
    res.type('txt').send(data.toString());
  });
});

router.get('/is-mongoose-ok', function(req, res) {
  if (mongoose) {
    res.json({isMongooseOk: !!mongoose.connection.readyState})
  } else {
    res.json({isMongooseOk: false})
  }
});

var Person = require('./myApp.js').PersonModel;

router.use(function(req, res, next) {
  if(req.method !== 'OPTIONS' && Person.modelName !== 'Person') {
    return next({message: 'Person Model is not correct'});
  }
  next();
});

router.post('/mongoose-model', function(req, res, next) {
  // try to create a new instance based on their model
  // verify it's correctly defined in some way
  var p;
  p = new Person(req.body);
  res.json(p);
});

var createPerson = require('./myApp.js').createAndSavePerson;
router.get('/create-and-save-person', function(req, res, next) {
  // in case of incorrect function use wait timeout then respond
  var t = setTimeout(() => { next({message: 'timeout'}) }, timeout);
  createPerson(function(err, data) {
    clearTimeout(t);
    if(err) { return (next(err)); }
    if(!data) {
      console.log('Missing `done()` argument');
      return next({message: 'Missing callback argument'});
    }
     Person.findById(data._id, function(err, pers) {
       if(err) { return (next(err)); }
       res.json(pers);
       pers.remove();
     });
  });
});

var createPeople = require('./myApp.js').createManyPeople;
router.post('/create-many-people', function(req, res, next) {
  Person.remove({}, function(err) {
    if(err) { return (next(err)); }
    // in case of incorrect function use wait timeout then respond
    var t = setTimeout(() => { next({message: 'timeout'}) }, timeout);
    createPeople(req.body, function(err, data) {
      clearTimeout(t);
      if(err) { return (next(err)); }
      if(!data) {
        console.log('Missing `done()` argument');
        return next({message: 'Missing callback argument'});
      }
       Person.find({}, function(err, pers){
         if(err) { return (next(err)); }
         res.json(pers);
         Person.remove().exec();
       });
    });
  });
});

var findByName = require('./myApp.js').findPeopleByName;
router.post('/find-all-by-name', function(req, res, next) {
  var t = setTimeout(() => { next({message: 'timeout'}) }, timeout);
  Person.create(req.body, function(err, pers) {
    if(err) { return next(err) }
    findByName(pers.name, function(err, data) {
      clearTimeout(t);
      if(err) { return next(err) }
      if(!data) {
        console.log('Missing `done()` argument');
        return next({message: 'Missing callback argument'});
      }
      res.json(data);
      Person.remove().exec();
    });
  });
});

var findByFood = require('./myApp.js').findOneByFood;
router.post('/find-one-by-food', function(req, res, next) {
  var t = setTimeout(() => { next({message: 'timeout'}) }, timeout);
  var p = new Person(req.body);
  p.save(function(err, pers) {
    if(err) { return next(err) }
    findByFood(pers.favoriteFoods[0], function(err, data) {
      clearTimeout(t);
      if(err) { return next(err) }
      if(!data) {
        console.log('Missing `done()` argument');
        return next({message: 'Missing callback argument'});
      }
      res.json(data);
      p.remove();
    });
  });
});

var findById = require('./myApp.js').findPersonById;
router.get('/find-by-id', function(req, res, next) {
  var t = setTimeout(() => { next({message: 'timeout'}) }, timeout);
  var p = new Person({name: 'test', age: 0, favoriteFoods: ['none']});
  p.save(function(err, pers) {
    if(err) { return next(err) }
    findById(pers._id, function(err, data) {
      clearTimeout(t);
      if(err) { return next(err) }
      if(!data) {
        console.log('Missing `done()` argument');
        return next({message: 'Missing callback argument'});
      }
      res.json(data);
      p.remove();
    });
  });
});

var findEdit = require('./myApp.js').findEditThenSave;
router.post('/find-edit-save', function(req, res, next) {
  var t = setTimeout(() => { next({message: 'timeout'}) }, timeout);
  var p = new Person(req.body);
  p.save(function(err, pers) {
    if(err) { return next(err) }
    try {
      findEdit(pers._id, function(err, data) {
        clearTimeout(t);
        if(err) { return next(err) }
        if(!data) {
          console.log('Missing `done()` argument');
          return next({message: 'Missing callback argument'});
        }
        res.json(data);
        p.remove();
      });
    } catch (e) {
      console.log(e);
      return next(e);
    }
  });
});

var update = require('./myApp.js').findAndUpdate;
router.post('/find-one-update', function(req, res, next) {
  var t = setTimeout(() => { next({message: 'timeout'}) }, timeout);
  var p = new Person(req.body);
  p.save(function(err, pers) {
    if(err) { return next(err) }
    try {
      update(pers.name, function(err, data) {
        clearTimeout(t);
        if(err) { return next(err) }
        if (!data) {
          console.log('Missing `done()` argument');
          return next({ message: 'Missing callback argument' });
        }
        res.json(data);
        p.remove();
      });
    } catch (e) {
      console.log(e);
      return next(e);
    }
  });
});

var removeOne = require('./myApp.js').removeById;
router.post('/remove-one-person', function(req, res, next) {
  Person.remove({}, function(err) {
    if(err) { return next(err) }
    var t = setTimeout(() => { next({message: 'timeout'}) }, timeout);
    var p = new Person(req.body);
    p.save(function(err, pers) {
      if(err) { return next(err) }
      try {
        removeOne(pers._id, function(err, data) {
          clearTimeout(t);
          if(err) { return next(err) }
          if(!data) {
            console.log('Missing `done()` argument');
            return next({message: 'Missing callback argument'});
          }
          console.log(data)
          Person.count(function(err, cnt) {
            if(err) { return next(err) }
            data = data.toObject();
            data.count = cnt;
            console.log(data)
            res.json(data);
          })
        });
      } catch (e) {
        console.log(e);
        return next(e);
      }
    });
  });
});

var removeMany = require('./myApp.js').removeManyPeople;
router.post('/remove-many-people', function(req, res, next) {
  Person.remove({}, function(err) {
    if(err) { return next(err) }
    var t = setTimeout(() => { next({message: 'timeout'}) }, timeout);
    Person.create(req.body, function(err, pers) {
      if(err) { return next(err) }
      try {
        removeMany(function(err, data) {
          clearTimeout(t);
          if(err) { return next(err) }
          if(!data) {
            console.log('Missing `done()` argument');
            return next({message: 'Missing callback argument'});
          }
          Person.count(function(err, cnt) {
            if(err) { return next(err) }
            if (data.ok === undefined) {
              // for mongoose v4
               try {
                data = JSON.parse(data);
              } catch (e) {
                console.log(e);
                return next(e);
              }
            }
            res.json({
              n: data.n,
              count: cnt,
              ok: data.ok
            });
          })
        });
      } catch (e) {
        console.log(e);
        return next(e);
      }
    });
  })
});

var chain = require('./myApp.js').queryChain;
router.post('/query-tools', function(req, res, next) {
  var t = setTimeout(() => { next({message: 'timeout'}) }, timeout);
  Person.remove({}, function(err) {
    if(err) { return next(err) }
    Person.create(req.body, function(err, pers) {
      if(err) { return next(err) }
      try {
        chain(function(err, data) {
          clearTimeout(t);
          if(err) { return next(err) }
          if (!data) {
            console.log('Missing `done()` argument');
            return next({ message: 'Missing callback argument' });
          }
          res.json(data);
        });
      } catch (e) {
        console.log(e);
        return next(e);
      }
    });
  })
});

app.use('/_api', enableCORS, router);

// Error handler
app.use(function(err, req, res, next) {
  if(err) {
    res.status(err.status || 500)
      .type('txt')
      .send(err.message || 'SERVER ERROR');
  }
});

// Unmatched routes handler
app.use(function(req, res){
  if(req.method.toLowerCase() === 'options') {
    res.end();
  } else {
    res.status(404).type('txt').send('Not Found');
  }
})

var listener = app.listen(process.env.PORT || 3000 , function () {
  console.log('Your app is listening on port ' + listener.address().port);
});

/********************************************
 * DO NOT EDIT THIS FILE
 * the verification process may break
 *******************************************/
