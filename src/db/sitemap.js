const path = require('path')
const fs = require('fs')
const htmlEncodeLib = require('js-htmlencode')

const htmlEncode = htmlEncodeLib.htmlEncode

const projectionForList = { title: 1 }
const sortCriteria = { title: 1 }
const basicCondition = { specialStatus: { $ne: 'homebrew' } }

const HOST = 'https://vbase.games/'

const header = '<?xml version="1.0" encoding="UTF-8"?>' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" ' +
  'xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">'
const footer = '</urlset>'
const urlsInitial = [
  { loc: HOST + 'all-games', changefreq: 'weekly', images: [], priority: '0.8' },
  { loc: HOST + 'todos-os-jogos', changefreq: 'weekly', images: [], priority: '0.8' },
  { loc: HOST + 'contact', changefreq: 'yearly', images: [], priority: '0.1' },
  { loc: HOST + 'contato', changefreq: 'yearly', images: [], priority: '0.1' }
]
const changefreq = 'monthly'

const sitemap = async db => {
  const urls = [...urlsInitial]
  let games
  try {
    games = await db.collection('games').find(basicCondition, projectionForList)
      .sort(sortCriteria).toArray()
  } catch (error) {
    return { error }
  }
  const priority = '0.7'
  for (const g of games) {
    const id = g._id
    const images = []
    const imgPath = path.join(__dirname, `../static/images/games/gameplay/${id}/1.png`)
    const fileExists = fs.existsSync(imgPath)
    if (fileExists) {
      images.push({ url: HOST + `image-gameplay/${id}.1.png`, title: htmlEncode(g.title) })
    }
    urls.push({ loc: HOST + 'game/' + id, changefreq, images, priority })
    urls.push({ loc: HOST + 'jogo/' + id, changefreq, images, priority })
  }
  const { results } = await Promise.all([
    db.collection('addons').distinct('_id'),
    db.collection('companies').distinct('_id'),
    db.collection('genres').distinct('_id'),
    db.collection('series').distinct('_id')
  ])
  const types = ['addons', 'companies', 'genres', 'series']
  const priorities = ['0.5', '0.4', '0.3', '0.5']
  for (const i in results) {
    for (const entry of results[i]) {
      let images = []
      const imgPath = path.join(__dirname, `../static/images/${types[i]}/${entry}/1.png`)
      const fileExists = fs.existsSync(imgPath)
      if (fileExists) {
        images = [{ url: HOST + `image-info/${types[i]}/${entry}.png` }]
      }
      urls.push({ loc: HOST + `info/${types[i]}/${entry}`, changefreq, images, priority: priorities[i] })
      urls.push({ loc: HOST + `informacao/${types[i]}/${entry}`, changefreq, images, priority: priorities[i] })
    }
  }
  const tags = []
  for (const u of urls) {
    let image = ''
    if (u.images.length) {
      let title = ''
      if (u.images[0].title) {
        title = `<image:title>${u.images[0].title}</image:title>`
      }
      image = `<image:image><image:loc>${u.images[0].url}</image:loc>${title}</image:image>`
    }
    tags.push(
      '<url>' +
      `<loc>${u.loc}</loc>` +
      `<changefreq>${u.changefreq}</changefreq>` +
      `<priority>${u.priority}</priority>` +
      image +
      '</url>'
    )
  }
  const xml = header + tags.join('') + footer
  fs.writeFileSync(path.join(__dirname, '../static/sitemap.xml'), xml)
  return { data: { done: true, tagsWritten: tags.length } }
}

module.exports = sitemap
