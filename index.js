var Trello = require('node-trello')
	,EventEmitter = require('events').EventEmitter
	,extend = require('extend')
	,config,trello,timer,e;

module.exports = function(config){
	var defaults = {
		pollFrequency: 1000*60
		,minId: 0
		,trello: {
			key: ''
			,token: ''
			,boards: []
			// boards: ['WQtuArbW', ...]
		}
	};
	e = new EventEmitter();
	config = extend(true, defaults, config);
	trello = new Trello(config.trello.key, config.trello.token);
	start();

	var self = {
		on: function(event, listener){
			e.on(event, listener);
			return self;
		}
		,start: start
		,stop: stop
		,api: trello
	};
	return self;
};

//=================================================

function start(frequency){
	frequency = frequency || config.pollFrequency;
	timer = setInterval(poll, frequency);
}
function stop(){
	clearInterval(timer);
	timer = null;
}

function poll(){
	config.trello.boards.forEach(function(boardId){
		getBoardActivity(boardId);
	});
}

function getBoardActivity(boardId){
	trello.get('/1/boards/' + boardId + '/actions', function(err, resp){
		if (err) {
			return e.emit('trelloError', err);
		}
		var boardActions = resp.reverse();
		var actionId;
		for (var ix in boardActions){

			//skip seen events
			actionId = parseInt(boardActions[ix].id, 16);
			if (actionId <= config.minId){
				continue;
			}

			var eventType = boardActions[ix].type;
			e.emit(eventType, boardActions[ix], boardId);
		}

		config.maxId = Math.max(config.minId, actionId);
		e.emit('maxId', config.minId);
	});
}
