require('dotenv').config();
const ethers = require('ethers');
const axios = require('axios');
const Twit = require('twit');
const TelegramBot = require('node-telegram-bot-api');

const TOKEN_TELEGRAM = process.env.TELEGRAM_TOKEN;
const CHAT_ID = process.env.CHAT_ID;
const FOLLOWER_THRESHOLD = process.env.FOLLOWER_THRESHOLD || 20000;

const T = new Twit({
    consumer_key: process.env.TWITTER_CONSUMER_KEY,
    consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
    access_token: process.env.TWITTER_ACCESS_TOKEN,
    access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
});

const bot = new TelegramBot(TOKEN_TELEGRAM, { polling: true });
const provider = new ethers.providers.WebSocketProvider(process.env.INFURA_WSS_URL);
const internalTransferEthCA = process.env.INTERNAL_TRANSFER_ETH_CA;

let heartbeatInterval = null;
const HEARTBEAT_INTERVAL = 30000;  // 30 seconds, adjust as needed
const HEARTBEAT_TIMEOUT = 10000;   // 10 seconds, adjust as needed

function startHeartbeat() {
    if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
    }

    heartbeatInterval = setInterval(async () => {
        let responded = false;

        const timeout = setTimeout(() => {
            if (!responded) {
                console.warn('Heartbeat timeout. Connection might be lost.');
                clearInterval(heartbeatInterval);
                provider.removeAllListeners('block');
                console.error("Connection lost. Exiting for PM2 to restart...");
                process.exit(1);
            }
        }, HEARTBEAT_TIMEOUT);

        try {
            await provider.getBlockNumber();
            responded = true;
            clearTimeout(timeout);
        } catch (error) {
            console.error('Heartbeat check failed:', error);
            responded = false;
        }
    }, HEARTBEAT_INTERVAL);
}

async function checkAndSendAlert(transaction, personAddress) {
    const txCount = await provider.getTransactionCount(personAddress.toString());
    if (txCount === 0) {
        const apiUrl = `https://prod-api.kosetto.com/users/${personAddress}`;
        const response = await axios.get(apiUrl);
        if (response.status === 200 && response.data) {
            const friendsTechData = response.data;
            await T.get('users/show', { screen_name: friendsTechData.twitterUsername }, async (err, user) => {
                if (err) {
                    console.error('Error fetching user:', err);
                } else {
                    const creationDate = new Date(user.created_at);
                    const differenceInDays = Math.floor((Date.now() - creationDate) / (1000 * 60 * 60 * 24));
                    const followersCount = user.followers_count;
                    console.log(`User ${friendsTechData.twitterUsername} has ${followersCount} followers. > ADDRESS ${friendsTechData.address}`);
                    if (followersCount >= FOLLOWER_THRESHOLD) {
                        const caption = `⚠️NEW JOIN ALERT⚠️\n\nAddress: ${friendsTechData.address}\nTwitter Username: @${friendsTechData.twitterUsername}\nAccount Age: ${differenceInDays} Days\nFollower Count: ${followersCount}\nBase Address Link: https://basescan.org/address/${friendsTechData.address}`;
                        await bot.sendMessage(CHAT_ID, caption);
                    }
                }
            });
        }
    }
}

function initializeListeners() {
    provider.on('block', async (blockNumber) => {
        try {
            const block = await provider.getBlockWithTransactions(blockNumber);
            for (let transaction of block.transactions) {
                try {
                    if (transaction && transaction.to) {
                        let personAddress = null;
                        if (transaction.to.toLowerCase() === internalTransferEthCA.toLowerCase()) {
                            const txReceipt = await provider.getTransactionReceipt(transaction.hash);
                            for (let log of txReceipt.logs) {
                                if (log.logIndex === 0) {
                                    personAddress = '0x' + log.data.substring(26, 66);
                                }
                            }
                        } else if (transaction.data === '0x') {
                            personAddress = transaction.to.toString();
                        }
                        if (personAddress) {
                            await checkAndSendAlert(transaction, personAddress);
                        }
                    }
                } catch (transactionError) {
                    console.error(`Error in transaction ${transaction.hash}`, transactionError);
                }
            }
        } catch (blockError) {
            console.error(`Error in block ${blockNumber}:`, blockError);
        }
    });
    startHeartbeat();
}

initializeListeners();

provider.on('error', async (error) => {
    console.error('WebSocket error:', error);
    await sleep(5000);
    provider.removeAllListeners('block');
    initializeListeners();
    startHeartbeat();
});

provider.on('close', async (error) => {
    console.error('WebSocket close:', error);
    await sleep(5000);
    provider.removeAllListeners('block');
    initializeListeners();
    startHeartbeat();
});
