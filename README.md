# Friend.Tech Alert Bot

## Description

Friend.Tech Alert Bot is a bot that pings new joins on friend.tech in a Telegram channel if their Twitter follower count exceeds a specified threshold. The bot listens to the Base blockchain for new transactions and checks for new wallets joining friend.tech.

## Features

- Detects new joins on friend.tech.
- Checks Twitter follower count.
- Sends alerts to a Telegram channel if the follower count exceeds the specified threshold.

## Prerequisites

- Node.js installed
- npm installed

## Installation

1. Clone the repository:
    ```bash
    git clone https://github.com/greyspace-eth/friend-tech-alert-bot.git
    cd friend-tech-alert-bot
    ```

2. Install dependencies:
    ```bash
    npm install
    ```

3. Create a `.env` file in the root directory and add the necessary environment variables:
    ```env
    TELEGRAM_TOKEN=your_telegram_token
    CHAT_ID=your_chat_id
    TWITTER_CONSUMER_KEY=your_twitter_consumer_key
    TWITTER_CONSUMER_SECRET=your_twitter_consumer_secret
    TWITTER_ACCESS_TOKEN=your_twitter_access_token
    TWITTER_ACCESS_TOKEN_SECRET=your_twitter_access_token_secret
    INFURA_WSS_URL=wss://your_wss_provider_url
    INTERNAL_TRANSFER_ETH_CA=0x4200000000000000000000000000000000000007
    FOLLOWER_THRESHOLD=20000
    ```

4. Start the bot:
    ```bash
    npm start
    ```

## Usage

- The bot listens to new blocks on the Base blockchain and processes each transaction to check for new wallets joining friend.tech.
- If a new wallet is detected and the Twitter follower count exceeds the specified threshold, it sends an alert to the configured Telegram channel.

## License

This project is licensed under the MIT License.
