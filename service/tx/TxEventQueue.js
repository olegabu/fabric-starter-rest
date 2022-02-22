const EventEmitter = require('events')
const _ = require('lodash');
const logger = require('../../util/log/log4js-configured').getLogger('TxEventQueue');

class TxEventQueue {
    constructor(cfg) {
        this.cfg = cfg || (function(){throw new Error("cfg is requried")})()
        this.eventBus = new EventEmitter()
        this.registeredTx = {}
        this.turnOnTransactionListener()
    }

    emit(eventName, data) {
        this.eventBus.emit(eventName, data)
    }

    emitChainblock(block, eventName = "chainblock") {
        this.eventBus.emit(eventName, block)
    }

    turnOnTransactionListener() {
        if (this.cfg.DISABLE_TX_ID_LISTENER) {
            this.eventBus.on('chainblock', (block) => {
                logger.debug(`CHAINBLOCK. Count of registeredTx in queue: ${_.size(this.registeredTx)}`)
                _.each(_transactions(block), tx => {
                    if (tx) {
                        logger.debug(`event from block of committed transaction  ${tx.txid} as ${tx.status || tx.tx_validation_code} in block ${_blockNumber(block)}`);
                        const handler = this.registeredTx[tx.txid]
                        delete this.registeredTx[tx.txid]
                        handler && handler({
                            txid: tx.txid,
                            status: tx.tx_validation_code,
                            blockNumber: _blockNumber(block)
                        });
                    }

                })
            })
        }

    }

    waitForTransaction(key, handler) {
        this.registeredTx[key] = handler
    }


}

function _blockNumber(block) { //TODO: move to Block object
    return block.number || _.get(block, "header.number");
}

function _transactions(block) {
    return block.filtered_transactions || _.map(_.get(block, 'data.data'), d => {
        const {tx_id, ...rest} = _.get(d, 'payload.header.channel_header');
        const {status, ...rest1} = _.get(d, 'payload.data.actions[0].payload.action.proposal_response_payload.extension.response')
        return {txid: tx_id, tx_validation_code: status}
    })
}

module.exports = TxEventQueue