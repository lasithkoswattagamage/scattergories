const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http, {
	pingInterval: 10000,
	pingTimeout: 30000
});
var bodyParser = require('body-parser')
var mongo = require('mongodb');
var assert = require('assert');
var roomCode = require('./components/roomCode');
var gradient = require('./components/gradient');
var util = require('./components/util');


// Way to access socketID externally
// io.sockets.sockets["Sv92ZNxGMlin4OSBAAAD"]

//console.log(gradient.get());

//var url = "mongodb://scattergories:5e9ki65dia7l237cl5re9eostn@ds063177.mlab.com:63177/scattergories";
 var url = 'mongodb://127.0.0.1:27017';
// Wait time between priming the Play State and then players seeing all the data is 3 seconds (3000 ms)
// We do not want the user to immediately expect answers after they decide as this may make them feel uncomfortable
// with the speed of the game. I have allocated 3 secs of priming time for user
const waitTimeLobbyPlay = 3000
const waitTimeLobbyInGame = 5000
const playerLimit = 15;

// Setting Render Engine
app.set('view engine', 'ejs');

// // Middleware Software (POST)
app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
})); 
app.use(express.json());       // to support JSON-encoded bodies
app.use(express.urlencoded()); // to support URL-encoded bodies

app.use("/",express.static('views')) // Create static directory for the css files

app.get('/', function (req, res) {
  res.render('index.ejs');
})

app.get('/get-data',function(req,res,next) {
  var resultArray = [];

  mongo.connect(url, function(err, client) {
    assert.equal(null,err);
    var db = client.db("scattergories"); // Connect to test database
    var cursor = db.collection('gameStates').find({name: {$ne: "Lasith"}}).limit(1); // Connect to gameStates collection

    cursor.forEach(function(doc, err) {
      assert.equal(null,err);
      resultArray.push(doc);
    }, function() {
      // These functions must be placed in the find-end-callback since
      // resultArray.push is async and therefore the connection would be 
      // prematurely closed
      client.close();
      //console.log(resultArray);
      res.redirect('/')
    });
  }
  )
})

app.post('/insert',function(req,res,next) {
  var item = {
    name: req.body.name,
    room: req.body.room
  }
  mongo.connect(url, function(err, client) {
    // Raise error if err is not null
    assert.equal(null,err);
    var db = client.db("scattergories");
    db.collection('gameStates').insertOne(item, function(err,result) {
      // Callback function to execute after item has been inserted
      assert.equal(null,err);
      //console.log("Item Added");
      client.close();
    });
  })
  res.redirect('/');
})

app.post('/update',function(req,res,next) {

})

app.post('/delete',function(req,res,next) {

})

app.get('/generate-room-code', function(req,res,next) {
  var newRoomCode = roomCode.get();
  res.json({roomCode: newRoomCode});
})

////////////////////////
//SOCKET FUNCTIONS START
////////////////////////

io.on('connect', function(socket) {
  //console.log("New Socket Connected");

  socket.on('login--create-room',function(data, acknowledge) {
    let roomCode = data.roomCode;
    let userName = data.userName;
    let role = data.role;
    let socketID = socket.id;

    // Socket Joining Room
    socket.join(roomCode,function(){
      // Adding details to Socket once we successfuly join room
      socket.userName = userName;
      socket.role = role;
      socket.roomCode = roomCode;

      // DEBUG
      let rooms = Object.keys(socket.rooms);
      //console.log(rooms); // [ <socket.id>, 'room 237' ]
      //console.log(socket.userName);

      admin__mongo_createRoom(roomCode, {role, userName, socketID}, function(){
        acknowledge(null,"Successly Joined Room And Created Entry in Database: "+roomCode);
      })

    })
  })

  socket.on('login--room-exists',function(data,callback) {
    let roomCode = socket.roomCode;
    if (!socket.roomCode) {
      roomCode = data.roomCode;
    }
    mongo__isRoomInLobby(roomCode,function(inLobby){
      if (inLobby) {
          callback(null,"Room Exists");
      } else {
          callback("Room is currently playing a game",null);
      }
    })
  })

  socket.on('login--join-room',function(data, acknowledge) {
    let roomCode = data.roomCode;
    let userName = data.userName;
    let role = data.role;
    let socketID = socket.id;

    //Socket Joining Room
    socket.join(roomCode,function(){
      // Adding details to Socket once we successfuly join room
      socket.userName = userName;
      socket.role = role;
      socket.roomCode = roomCode;

      // DEBUG
      let rooms = Object.keys(socket.rooms);
      //console.log(rooms); // [ <socket.id>, 'room 237' ]
      //console.log(socket.userName);
      let pos = io.sockets.adapter.rooms[roomCode].length;

      user_mongo_joinRoom(roomCode, {role, userName, socketID, pos}, function(){
        acknowledge(null, "Successly Joined Room And Created Entry in Database: "+roomCode);
      })
     
    })
  })

  socket.on('disconnect',function(reason) {
    let socketID = socket.id;
    let socketRoomCode = socket.roomCode;
    let socketRole = socket.role;

    // A user may not have entered a room so their is no need to remove their db entry (since it does not exist)
    if (util.isdefined(typeof(socketRoomCode))) {
      if (socketRole==="user") {
        // LeaveRoom function for users
        user_mongo_leaveRoom(socketRoomCode, socketID, function(msg){
          // Generate Scoreboard and send to all sockets in the room that the socket left from
          mongo__generateScoreBoard(socketRoomCode, function(scoreboard) {
            // Prevent Lobby Rebuild if game is not in lobby. This is to prevent unexpected behaviour mid game
            mongo__isRoomInLobby(socketRoomCode,function(inLobby){
              if (inLobby) {
                io.in(socket.roomCode).emit('lobby--build', scoreboard, playerLimit);
              }
            })
          });
        })
      } else if(socketRole==="admin") {
        // LeaveRoom function for admin
        admin__mongo_leaveRoom(socketRoomCode, socketID, function(msg){
          // Generate Scoreboard and send to all sockets in the room that the socket left from
          mongo__generateScoreBoard(socketRoomCode, function(scoreboard) {
                        // Prevent Lobby Rebuild if game is not in lobby. This is to prevent unexpected behaviour mid game
            mongo__isRoomInLobby(socketRoomCode,function(inLobby){
              if (inLobby) {
                io.in(socket.roomCode).emit('lobby--build', scoreboard, playerLimit);
              }
            })
          });
        })
      }
      

    }
  })

  socket.on('isAdmin',function(acknowledge) {
    acknowledge(socket.role==="admin");
  })


  socket.on('getRoomCode',function(acknowledge) {
    acknowledge(socket.roomCode);
  })

  socket.on('lobby--joined', function() {
    // Tell Client To Build
    // Tell Everyonelse to Rebuild
    let roomCode = socket.roomCode;
    mongo__generateScoreBoard(roomCode, function(scoreboard) {
      io.in(socket.roomCode).emit('lobby--build', scoreboard, playerLimit);
    });
    
  })

  socket.on('lobby--start-game', function(data) {
    let roomCode = socket.roomCode;
    let roundTime = data.roundTime;
    console.log(data);
    // data
    //   data.numberOfRounds
    //   data.roundTime
    // Update thr game rules with the ones provided by admin

    // Change status of game from "LOBBY" to "IN-GAME" to prevent users from joining in
    admin__mongo_updateLobbyStatus(roomCode,"INGAME");
    admin__mongo_updateRules(roomCode,data,()=>{
        // Set Timeout for moving the player from the primed state to the actually answering state waitTimeLobbyPlay
        // Function That When Provided a Room Code will provide game Data object. Must do neccessary alterations to db
        mongo__roundData(roomCode,function(gameData) {
          // Must chain the following setTimeouts to ensure they are released at the same Time (as close as possible due to nature of event loop)
          // Prime The Play State immediately 
          console.log(gameData);
          io.in(socket.roomCode).emit('play--prime');

          setTimeout(function(){
            io.in(socket.roomCode).emit('play--build',gameData);
          }, waitTimeLobbyPlay);


          // Set Timeout For Moving Players from "PLAY" to "DECIDE" roundTime*1000 + waitTimeLobbyPlay
          // waitTimeLobbyPlay must be added since we need to account for the time taken to prime the Play State.
          setTimeout(function(){
            io.in(socket.roomCode).emit('decide--prime');
          }, gameData.roundTime*1000 + waitTimeLobbyPlay)
      })
    });
  })

  socket.on('play--submitted',function(response){
    let socketID = socket.id;
    let socketName = socket.userName;
    let roomCode = socket.roomCode;
    //console.log(response)

    mongo__insertResponse(socketID,socketName,socket.roomCode,response).then((insertRes)=>{
      //console.log(insertRes)
        if (insertRes) {
          // Fetch All Responses
          //console.log("All Users Have Responded")
          mongo_fetchAllResponsesAndCategories(roomCode,function(allResponses,allCategories){
            io.in(socket.roomCode).emit("decide--build",allResponses,allCategories)
          })
        }
 
    })
  })

  socket.on("decide--submitted",function(response){
    // response
    // A-B => Index
    // players[A] and response[B]
    let roomCode = socket.roomCode;
 
    // Reduce the number of rounds remaning by 1 (This does not need to placed inside the Promise.all([]))
    // This information is not relevant for the player while they are in the Play State
    mongo_deincrementRoundCount(roomCode)

    mongo_fetchAllResponsesAndCategories(roomCode,function(allResponses){
      //console.log(response)
      //console.log(allResponses)
      let pointsGained = {};

      allResponses.forEach((userResponse,i)=>{
        let socketID = userResponse.socketID;
        // The database stores points for a user in the following way
        // players.[socketID].points.
        // If we preallocate this object to fit into the database design. It makes incrementing
        // the points a breeze. Of course this design methodology is prone to failure if the structure of the
        // database changes. Be weary!!!!
        pointsGained["players."+socketID+".points"] = 0;

        userResponse.response.forEach((answer,j)=>{
          let categoryResponse = response[i+"-"+j];
          if (categoryResponse==="unique") {
            pointsGained["players."+socketID+".points"] += 2
          } else if(categoryResponse==="same") {
            pointsGained["players."+socketID+".points"] += 1
          }

        })
      })

      admin__mongo_updateScores(roomCode,pointsGained,function(){
        mongo__generateScoreBoard(roomCode,function(newScoreBoard,roundsRemaining){
          mongo_fetchRoundCount(roomCode,function(roundsRemaining){
            // Conduct Next Round procedures if there are still rounds remaining
            if (roundsRemaining>0) {
              io.in(roomCode).emit('lobby--ingame-build', newScoreBoard, roundsRemaining);
              // Set Timeout for moving the player from the primed state to the actually answering state waitTimeLobbyPlay
              // Function That When Provided a Room Code will provide game Data object. Must do neccessary alterations to db
              mongo__roundData(roomCode,function(gameData) {                
                // Must chain the following setTimeouts to ensure they are released at the same Time (as close as possible due to nature of event loop)
                setTimeout(function(){
                io.in(socket.roomCode).emit('play--build',gameData);
                }, waitTimeLobbyInGame);
    
    
                // Set Timeout For Moving Players from "PLAY" to "DECIDE" roundTime*1000 + waitTimeLobbyPlay
                // waitTimeLobbyPlay must be added since we need to account for the time taken to prime the Play State.
                setTimeout(function(){
                io.in(socket.roomCode).emit('decide--prime');
                }, gameData.roundTime*1000 + waitTimeLobbyInGame)
              })  
            } else {
              admin__mongo_updateLobbyStatus(roomCode,"FINISHED");
              io.in(roomCode).emit('lobby--finished', newScoreBoard);
            }
   
          })
        })
      })
    })



  })



})
////////////////////////
//SOCKET FUNCTIONS END
////////////////////////

////////////////////////
//MONGO FUNCTIONS START
////////////////////////

////////////////
// Admin
////////////////
function admin__mongo_createRoom(roomCode, userData, callback) {
  //roomCode 
  let userName = userData.userName;
  let userSocketID = userData.socketID;
  let userRole = userData.role;
  // Creating gameStates-document that will be inserted into db
  let doc = {
    _id: roomCode,
    gameData: {
      availableLetters: "abcdefghijklmnopqrstuvwyxz".split(""),
      roundsRemaining: 10,
      roundTime: 30,
      status: "LOBBY"
    },
    players: {
      [userSocketID]: {
        points: 0,
        name: userName,
        role: userRole,
        pos: 1
      }
    },
    responses: [],
    categories: []
  }

  mongo.connect(url,function(err,client) {
    assert.equal(null,err);
    var db = client.db("scattergories");
    db.collection('gameStates').insertOne(doc, function(err,result) {
      assert.equal(null,err);
      //console.log(result);
      client.close(); // Close connection
      callback();
    });

  })
}

function admin__mongo_leaveRoom(roomCode,socketID, callback) {
    // First Remove Admin Entry (via unset)

    mongo.connect(url,function(err,client){
      assert.equal(null,err);
      var db = client.db("scattergories");

      db.collection('gameStates').update({_id: roomCode}, {$unset: {["players."+socketID]: ""}}, function(err,result) {
        assert.equal(null,err);
        
        db.collection('gameStates').findOne({_id: roomCode}, function(err,result) {
          assert.equal(null,err);
          // DEBUG
          //console.log(result);
  
          // We extract the first socketID and make it the new ADMIN
          let newAdminSocketId = Object.keys(result.players)[0];
  
          // Make one random user an admin through the database
          // ~ If newAdminSocketID is not defined then all the sockets have left the room. Time to destroy
          // ~ the document corresponding to the room code from the database
          if (util.isdefined(typeof(newAdminSocketId))) {
            db.collection('gameStates').update({_id: roomCode}, {$set: {["players."+newAdminSocketId+".role"]: "admin"}},function(err,result) {
              assert.equal(null,err);
  
              // Make one random user an admin through the socket interface
              io.sockets.connected[newAdminSocketId].role = "admin";
  
              client.close()
              callback('Admin has left and a new user has been allocated admin');
              
            }) 
          } else {
            db.collection('gameStates').deleteOne({_id: roomCode}, function(err,result){
              client.close()
              callback('All players have left and the room has been removed from the db');
            })
          }


        })
      })
    })

     // and through the io.sockets.sockets[socketID]
}


function admin__mongo_updateRules(roomCode,rules,callback) {
  console.log(rules);
  let db_rounds = rules.numberOfRounds;
  let db_round_time = rules.roundTime;
  mongo.connect(url, function(err,client) {
    var db = client.db("scattergories");
    db.collection('gameStates').updateOne({_id: roomCode},{$set: {"gameData.roundsRemaining": db_rounds, "gameData.roundTime": db_round_time}}, function(err,result) {
      assert.equal(null,err);
      client.close(); // Close connection
      callback();
    })
  })
}

function admin__mongo_updateLobbyStatus(roomCode,status) {
  mongo.connect(url, function(err,client) {
    var db = client.db("scattergories");
    db.collection('gameStates').updateOne({_id: roomCode},{$set: {"gameData.status": status}}, function(err,result) {
      assert.equal(null,err);
      client.close(); // Close connection
    })
  })
}

function admin__mongo_updateScores(roomCode, incObj, callback) {
  mongo.connect(url, function(err,client){
    assert.equal(null,err);
    var db = client.db("scattergories");
    db.collection('gameStates').updateOne({_id: roomCode}, {$inc: incObj}, function(err,result) {
      assert.equal(null,err);
      client.close();
      callback();
    })
  })
}

////////////////
// User
////////////////

function user_mongo_joinRoom(roomCode, userData, callback) {
    //roomCode 
    let userName = userData.userName;
    let userSocketID = userData.socketID;
    let userRole = userData.role;
    let userPos = userData.pos;
    // Creating gameStates-document that will be inserted into db
    let subDoc = {
      points: 0,
      name: userName,
      role: userRole,
      pos: userPos
    }
  
    mongo.connect(url,function(err,client) {
      assert.equal(null,err);
      var db = client.db("scattergories");
      db.collection('gameStates').update({_id: roomCode}, {$set: {["players."+userSocketID]: subDoc}},function(err,result) {
        assert.equal(null,err);
        //console.log(result);
        client.close(); // Close connection
        callback();
      });
  
    })
}

function user_mongo_leaveRoom(roomCode, socketID, callback) {
  mongo.connect(url,function(err,client){
    assert.equal(null,err);
    var db = client.db("scattergories");
    db.collection('gameStates').update({_id: roomCode}, {$unset: {["players."+socketID]: ""}}, function(err,result) {
      assert.equal(null,err);
      //console.log(result);
      client.close();
      callback("Socket has been removed from db");
    })
  })
} 

////////////////
// Utility
////////////////

// After we confirm that the room exists on the server memory, we need to determine whether the room
// is in the lobby state. This is to prevent users from joining midgame
function mongo__isRoomInLobby(roomCode,callback) {
  mongo.connect(url,function(err,client) {
    var db = client.db("scattergories");
    db.collection('gameStates').findOne({_id: roomCode}, function(err,result) {
      if (result) {
        assert.equal(null,err);
        var gameStatus = result.gameData.status;
        var playerCount = Object.keys(result.players).length
        client.close();
        // Verify that the game is in the LOBBY mode and that the player count is less than the playerLimit
        callback(gameStatus === "LOBBY" && playerCount < playerLimit);
      } else {
        // If result == null then room does not even exist
        callback(false);
      }

    })
  })

}

function mongo__generateScoreBoard(roomCode,callback) {
  mongo.connect(url,function(err,client) {
    assert.equal(null,err);
    var db = client.db("scattergories");
    db.collection('gameStates').findOne({_id: roomCode}, function(err,result) {
      // Only return scoreboard if room exists. This is to prevent generating a scoreboard for a room that does not exist
      if (result) {
        var playersPointsArray = Object.keys(result.players).map((key)=>{
          return {name: result.players[key].name, points: result.players[key].points, pos: result.players[key].pos};
        })
        let roundsRemaining = result.gameData.roundsRemaining;
        callback(playersPointsArray,roundsRemaining)
      }
      client.close();
    })
  })
}

function mongo__roundData(roomCode,callback) {
  // Clear reponses and categories before fetching new ones
  mongo_clearResponsesAndCategories(roomCode)

  let fetchRoundData = new Promise((resolve,reject)=>{
    mongo.connect(url,function(err,client) {
      assert.equal(null,err);
      var db = client.db("scattergories");
      db.collection('gameStates').findOne({_id: roomCode}, function(err,result) {
        assert.equal(null,err);
	console.log(result);
        let roundTime = result.gameData.roundTime;
        let availableLetters = result.gameData.availableLetters;
        let randomIndex = Math.floor(Math.random()*availableLetters.length);
        let randomLetter = availableLetters.splice(randomIndex, 1)[0];
        // .splice is a destructive operation. So now availableLetters is ready to be reinserted into the database
        db.collection('gameStates').updateOne({_id: roomCode}, {$set: {"gameData.availableLetters": availableLetters}},function(err,result) {
          assert.equal(null,err);
          client.close();
          //console.log("round Data fetched")
          resolve({letter: randomLetter, roundTime})
        })
      })
    })
  })

  let fetchCategoriesAndInsert = new Promise((resolve,reject)=>{
    mongo.connect(url,function(err,client) {
      assert.equal(null,err);
      var db = client.db("scattergories");
      db.collection('categories').aggregate([{$sample: { size: 4}}]).toArray(function(err,result){
        assert.equal(null,err);
        // Mapping title of the category to a seperate variable (for clean purposes)
        let categories = result.map((foo)=>{
          return foo.title;
        })
        db.collection('gameStates').updateOne({_id: roomCode},{$push: {"categories":{$each: categories}}},function(err,result){
            assert.equal(null,err);
            client.close()
            resolve(categories);
        })
      })
    })
  })

  // Promise.all is used since fetching 4 random categories and updating the letters on a game State are two
  // seperate asynchronous processes. Chaining them together would be ineffecitive as these two operations do not
  // rely on one another. Therefore we can use Promise.all to send the combined data from these two operations
  // when it is appropriate 
  Promise.all([fetchCategoriesAndInsert,fetchRoundData]).then(function(values) {
    //console.log("Promise All")
    let gameData = values[1]
    let categoriesData = values[0]

    // Appending the categories data to the round data and then calling the callback function on the data
    let roundData = gameData;
    roundData.categories = categoriesData
    callback(roundData)
  })
}

function mongo__insertResponse(socketID,userName,roomCode,response) {
  return new Promise((resolve,reject)=>{
    mongo.connect(url, function(err,client){
      assert.equal(null,err);
      var db = client.db("scattergories");
      //console.log(`${socketID} Inserted Executed`)
      db.collection('gameStates').findOneAndUpdate({_id: roomCode}, {$push: {"responses": {socketID, userName, response}}}, {returnOriginal:false}, function(err,doc){
        //console.log(`${socketID} Inserted`)
        assert.equal(null,err);
        client.close();
        //console.log(Object.keys(doc.value.players).length===doc.value.responses.length)
        resolve(Object.keys(doc.value.players).length===doc.value.responses.length);
      })
    })
  })
}

function mongo__responseTally(socketID, roomCode) {
  return new Promise((resolve,reject)=>{
    mongo.connect(url, function(err,client){
      assert.equal(null,err);
      var db = client.db("scattergories");
      //console.log(`${socketID} Checked Response Tally Executed`)
      db.collection('gameStates').aggregate([
        {$match: {_id: roomCode}},
        {$group: {
            _id: "$_id",
            playerCount: {$sum: {$size: {$objectToArray: '$players'}}},
            playerResponses: {$sum: {$size: '$responses'}}
        }}
      ]).toArray(function(err,result){
        //console.log(`${socketID} Checked Response Tally`)
        client.close()
        resolve(result);
      })
    })
  })
}

function mongo_fetchAllResponsesAndCategories(roomCode,callback) {
  mongo.connect(url,function(err,client) {
    assert.equal(null,err);
    var db = client.db("scattergories");
    db.collection('gameStates').findOne({_id: roomCode}, function(err,result) {
      // Only return scoreboard if room exists. This is to prevent generating a scoreboard for a room that does not exist
      assert.equal(null,err);
      let allResponses = []
      let allCategories = result.categories;
      // We have to ensure that the game remains functional when a player leaves the game midgame. When a user leaves the game 
      // while in the decide mode, their player object is removed however their response is still there. Therefore we only push
      // the reponses into the allResponses array if their socketID is a key for the result.players Objecy
      result.responses.forEach(function(obj){
        if (result.players[obj.socketID]) {
          obj.pos = result.players[obj.socketID].pos
          allResponses.push(obj);
        }
      })
      callback(allResponses,allCategories);
      client.close();
    })
  })
}

function mongo_clearResponsesAndCategories(roomCode) {
  mongo.connect(url, function(err,client){
    assert.equal(null,err);
    var db = client.db("scattergories");
    db.collection('gameStates').updateOne({_id: roomCode}, {$set: {"responses": [],"categories": []}}, function(err,result) {
      assert.equal(null,err);
      client.close();
    })
  })
}

function mongo_deincrementRoundCount(roomCode) {
  mongo.connect(url, function(err,client){
    assert.equal(null,err);
    var db = client.db("scattergories");
    db.collection('gameStates').updateOne({_id: roomCode}, {$inc: {"gameData.roundsRemaining": -1}}, function(err,result) {
      assert.equal(null,err);
      client.close();
    })
  })
}

function mongo_fetchRoundCount(roomCode,callback) {
  mongo.connect(url,function(err,client){
    assert.equal(null,err);
    var db = client.db("scattergories");
    db.collection('gameStates').findOne({_id: roomCode}, function(err,result){
      assert.equal(null,err);
      client.close();
      callback(result.gameData.roundsRemaining);
    })
  })
}



////////////////////////
//MONGO FUNCTIONS END
////////////////////////
var server_port = process.env.PORT || 80;
var server_host = process.env.YOUR_HOST || '0.0.0.0';

const server = http.listen(server_port, function() {
    //console.log('listening on *'+server_port);
})

// db.gameStates.aggregate([
//   // Duplicate the docs, one per modules array element
//   {$match: {_id: "IJV794"}},
//   // Regroup on _id, summing up the size of each doc's documents array
//   {$group: {
//       _id: "$_id",
//       playerCount: {$sum: {$size: {$objectToArray: '$players'}}},
// playerResponses: {$sum: {$size: '$responses'}}
//   }}
// ])

