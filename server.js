const mongo = require('mongodb').MongoClient;
const client = require('socket.io').listen(4000).sockets;

// Connect to mongodb
mongo.connect('mongodb://127.0.0.1/mongochat',function(err, db){
  if(err){
    throw err;
  }

  console.log('MongoDB connected.......');

  //connect to socket.io
  client.on('connetcion', function(socket){
    let chat = db.collection('chats');

    // create function to send status
    sendStatus = function(s){
      socket.emit('status', s);
    }

    //Get chats from mongo collection
    chat.find().limit(100).sort({_id:1}).toArray(function(err, res){
      if(err){
        throw err;
      }

      //emit the message
      socket.emit('output', res);
    });

    //Handle input events
    socket.on('input', function(data){
      let name = data.name;
      let message = data.message;

      // Check if name and message are empty
      if(name == '' || message == ''){
        // send error status
        sendStatus('Please enter a name and a message');
      } else {
        //Insert message
        chat.insert({name: name, message: message}, function(){
          client.emit('output', [data]);

          // Send status object
          sendStatus({
            message: 'Message sent',
            clear: true
          });
        });
      }
    });

    //Handle clear
    socket.on('clear', function(data){
      //Remove all chats from collection
      chat.remove({}, function(){
        //Emit cleared
        socket.emit('cleared');
      });
    });
  });
});
