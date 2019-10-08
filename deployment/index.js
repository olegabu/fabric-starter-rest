
const StartRaft_N_Nodes = require('./tasks/StartRaft_N_Nodes');

module.exports = function(app, fabricStarterClient) {

    app.post('/deploy', async (req, res)=>{
        res.json(await new StartRaft_N_Nodes(fabricStarterClient).run(req.body));

    })
};



/*
function convertKVArrayToMap(keyValueArray) {
    return _.reduce(keyValueArray, (item, result)=>{
        return {[item.key]:item.value};
    }, {})
}

const currHostsLines = fs.readFileSync(file, 'utf-8').split('\n');
const currHosts = _.map(currHostsLines, line => {
    const ipsNames = _.split(line, ' ', 1);
    return {key: ipsNames[0], value: ipsNames[1]}
});

let hostsMap=convertKVArrayToMap(currHosts);
let listMap=convertKVArrayToMap(list);
_.merge(listMap, hostsMap);

let h = `# replaced by dns listener on ${channel}\n`;
_.forOwn(listMap, (value, key)=> {
    h = h.concat(key, ' ', _.join(_.keys(val)))
});

fs.writeFileSync(file, hostsFileContent);
*/
