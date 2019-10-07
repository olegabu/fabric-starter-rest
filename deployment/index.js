
const StartRaft_N_Nodes = require('./tasks/StartRaft_N_Nodes');

module.exports = function(app) {

    app.post('/deploy', (req, res)=>{
        new StartRaft_N_Nodes().run(req.body);
    })
};