require('dotenv').config()
const Discord = require('discord.js')
const fetch = require('isomorphic-fetch')

function numberWithCommas(x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

const fetchFeed = async () => {
  const response = await fetch(process.env.ENDPOINT, {
    method: 'GET', // *GET, POST, PUT, DELETE, etc.
  })
  const data = await response.json()
  return data.asset_events
}

let buffer = []

const client = new Discord.Client()

client.on('ready', async function () {
  /// First load:
  buffer = await fetchFeed()

  setInterval(async () => {
    console.log('Fetching Data')
    const rawData = await fetchFeed()
    const oldData = JSON.parse(JSON.stringify(buffer))
    buffer = rawData

    const newData = rawData.filter(
      (v, i) =>
        !oldData.some(
          (t) =>
            t.transaction.transaction_hash === v.transaction.transaction_hash
        )
    )
    // console.log("Filtered Data", newData)
    if (newData.length === 0) return

    newData.map(async (item, i) => {
      const embed = new Discord.MessageEmbed()
        .setColor('#0099ff')
        .setTitle(`SALE: APE #${item.asset.token_id}`)
        .setURL(item.asset.permalink)
        .setAuthor('Bored Ape Yacht Club')
        .setThumbnail(item.asset.image_url)
        .setTimestamp()
        .addFields(
          {
            name: 'USD price',
            value: `$${numberWithCommas(
              (
                (item.total_price / eval(`1e` + item.payment_token.decimals)) *
                item.payment_token.usd_price
              ).toFixed(2)
            )}`,
            inline: true,
          },
          {
            name: 'Token price',
            value: `${numberWithCommas(
              (
                item.total_price / eval(`1e` + item.payment_token.decimals)
              ).toFixed(2)
            )} ${item.payment_token.symbol}`,
            inline: true,
          },
          {
            name: '\u200B',
            value: '\u200B',
            inline: true,
          }
        )
        .addFields(
          {
            name: 'Seller',
            value: !item.seller.user
              ? item.seller.address.slice(0, 5) + '...'
              : item.seller.user.username,
            inline: true,
          },
          {
            name: 'Buyer',
            value: !item.winner_account.user
              ? item.winner_account.address.slice(0, 5) + '...'
              : item.winner_account.user.username,
            inline: true,
          },
          {
            name: '\u200B',
            value: '\u200B',
            inline: true,
          }
        )
      client.channels.cache.get(process.env.APE).send({ embed: embed })
    })
  }, 10000)
})

client.login(process.env.TOKEN)
