const fs = require('fs')

const lastDomainPath = 'var/domain.last'

async function getFeed(url) {
  const fetch = (await import('node-fetch')).default
  const response = await fetch(url)
  return await response.json()
}

function mapData(data) {
  return data.map(item => {
    return [
      item.domain + item.extension,
      item.price,
      item.venue,
      item.closed
    ]
  })
}

async function getCsv(data) {

  const createCsvStringifier = (await import('csv-writer')).default.createArrayCsvStringifier
  const csv = createCsvStringifier({header: ['Domain', 'Price']})
  return csv.stringifyRecords(data)
}

function updateLastDomain(domain) {
  fs.writeFileSync(lastDomainPath, domain, 'utf8')
}

function getLastDomain() {
  return fs.existsSync(lastDomainPath) ? fs.readFileSync(lastDomainPath, 'utf8') : null
}

(async () => {
  const url = 'https://namebio.com/live-feed'
  const path = 'var/domains.csv'
  const varPath = 'var'

  !fs.existsSync(varPath) && fs.mkdirSync(varPath)

  console.log(`Requesting ${url}...`)
  const feed = await getFeed(url)
  console.log('Success:', feed && feed.status, `- ${feed.message.length} items`)
  let data = mapData(feed.message)

  if (data.length) {
    const lastDomain = getLastDomain()
    if (lastDomain) {
      const lastDomainIndex = data.findIndex(item => item[0] === lastDomain)

      if (lastDomainIndex >= 0) {
        data = data.slice(lastDomainIndex + 1)
      }
    }
  }

  if (data.length) {
    console.log(`${data.length} new domains found`)
    console.log('Convert to CSV...')
    const csv = await getCsv(data, path)
    console.log(`Writing data to ${path}...`)
    fs.appendFileSync(path, csv)
    console.log(`Updating last domain...`)
    const lastDomain = data[data.length - 1][0]
    updateLastDomain(lastDomain)
    console.log('Done')
  } else {
    console.log('No new domains')
  }

})()




