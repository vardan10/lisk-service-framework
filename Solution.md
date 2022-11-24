# Description
This code retrives average amount of transactions done on Lisk mainnet for last N blocks.

# How to run
Open a terminal
```
npm install
npm start
```

Open another terminal
```
node moleculer_client.js svc.averageBalanceTransfer "{\"blocks\":100}"
```

# How it works
A periodic job will run every 10 minutes and fetch blocks one by one from Lisk mainet. Each block will be scanned for transactions and if present it will be counted for calculating the average balance transfer. After every block average balance transfer will be stored in redis. 

averageBalanceTransfer service can be invoked to fetch data from redis.


# Assumtions
1. Job is scheduled to fetch last 10000 transactions and hence user cant query average transactions beyond last 10000 blocks. 

2. I am using BigInt to store the avg and total amount since the amount field returned by the API can be more than 10 digits.
For example in this API (https://mainnet.lisk.com/api/blocks?height=20194981) its 12 digits.
Hence I am retuning string in output instead of integers.

# Further optimizations
1. Right now I run the job periodically for every 10 minutes. Need to find a good tradeoff between server and db load (and hence cost) and better result accuracy. 

2. Its better to save block tranasaction data in redis. Since multiple Jobs can call the same API its better to cache API payload becuase
    a. Assuming we are calling external API (not deployed within same environment), calls will be slower.
    b. Some APIs rate limit after a few requests

3. Unit and integration test cases 

4. Although I write to redis after fetching every block - writing in batch would be a preferable method.