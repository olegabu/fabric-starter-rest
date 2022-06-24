const readline = require('readline').createInterface({input: process.stdin, output: process.stdout});

async function cycle(func) {
    readline.question('Cycle:', async inp => {
        try {
            await func(inp)
        } catch (e) {
            console.log(e)
        }
        await cycle(func)
    })
}

module.exports = {
    cycle: cycle
}