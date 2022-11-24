
const { HTTP, CacheRedis, Logger } = require('lisk-service-framework');
const logger = Logger();
const config = require('../config');
const HttpStatus = HTTP.StatusCodes;

// Initialize redis cache
const cacheRedisTxDataAggregated = CacheRedis('AvgTxDataAggregated', config.endpoints.REDIS);

async function fetchLatestBlocksForBalanceTransfer(){

    // Get last block height from this API
    logger.info(`Getting recent block height`);
    let nodeInfoAPIResponse = await HTTP.get(config.endpoints.NODE_INFO);

    if(nodeInfoAPIResponse.status != HttpStatus.OK){
        logger.error("Could not fetch latest block height");
        throw new Error('Could not fetch latest block height');
    }

    let latestBlockheight = nodeInfoAPIResponse.data.data.height;



    // Just query last 10000 blocks if not present in redis
    let blocksToQuery = latestBlockheight - config.BLOCKS_TO_FETCH;



    // Fetch previous 10000 blocks and aggrigate data and store in redis
    logger.info(`Quering blocks from ` + blocksToQuery + ` to ` + latestBlockheight);
    let totaltransactions = 0;
    let currSum = BigInt(0);
    let counter = 0;

    for(let height=latestBlockheight; height>=blocksToQuery; height--){
        counter++;
        
        // Query block data 
        let blockDataResponse = await HTTP.get(config.endpoints.BLOCK_DATA + "?height=" + height);

        if(blockDataResponse.status == HttpStatus.OK){
            let txs = blockDataResponse.data.data;

            for (let i in txs) {
                let payload = txs[i].payload;
    
                for(let j in payload){
                    if(payload[j].assetID == 0 && payload[j].moduleID == 2){
                        logger.info("Fee for block of height " + height + " is: " + payload[j].asset.amount);

                        currSum += BigInt(payload[j].asset.amount);
                        totaltransactions++;
                    }
                }
            }
        } else {
            logger.error("Could not fetch transaction data for block ID " + height);
            continue;   // Ignore this block
        }

        if(totaltransactions == 0){
            // Save average for last n blocks to redis
            logger.info("Setting avg tx fee as 0 for last  " + counter + " blocks");
            storeDataToRedis(counter, 0, currSum.toString(), totaltransactions);
        } else {
            let currBlockAvgTxData = currSum / BigInt(totaltransactions);

            // Save average for last n blocks to redis
            logger.info("Setting avg tx fee as " + currBlockAvgTxData.toString() + " for last  " + counter + " blocks");
            storeDataToRedis(counter, currBlockAvgTxData.toString(), currSum.toString(), totaltransactions)
        }
    }
}

function storeDataToRedis(key, average, total, count){

    cacheRedisTxDataAggregated.set(key, {
        "average": average,
        "total": total,
        "count": count
    });

}


module.exports = {
    fetchLatestBlocksForBalanceTransfer
}