const { CacheRedis } = require('lisk-service-framework');
const config = require('../config');
const cacheRedisTxDataAggregated = CacheRedis('AvgTxDataAggregated', config.endpoints.REDIS);

module.exports = [
	{
		name: 'averageBalanceTransfer',
		description: 'Average balance transfered for the last n blocks',
		params: {
			blocks: { type: 'number', optional: false },
		},
		controller: async param => {


            if(param.blocks == undefined){
                throw new Error('Blocks parameter required.');
            } else if(param.blocks < 1 || param.blocks > 10000) {
                throw new Error('Blocks parameter should be between 1 and 10000.');
            } else {
                let avgTransferTx = await cacheRedisTxDataAggregated.get(param.blocks);

                if(avgTransferTx == undefined){
                    throw new Error('No data found. Please check after sometime.');
                } else {
                    return avgTransferTx;
                }
            }
			
		},
	}
];
