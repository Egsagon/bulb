// Download script

const re_segment = /(^[^#\n].+)$/gm
const re_flash = /var (flashvars_\d*) = ({.*});\n/g
const root = 'https://www.pornhub.com/view_video.php?viewkey='

const headers = new Headers()

headers.append('Accept', '*/*')
headers.append('Accept-Encoding', 'gzip, deflate, br')
headers.append('Accept-Language', 'en,en-US')
headers.append('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/114.0')
headers.append('Samesite', 'None; Secure')

// TODO - steal cookies and other headers from the page to make it more legit + support premium features (i think)
//      - Would also fix language const

var queue = []

greq = async (url) => {
    let req = new Request(url, {method: 'GET', headers: headers})
    let res = await fetch(req)

    if (!res.ok) 'Error: ' + url
    return await res.text()
}

download = async (key, responder) => {
    // Fetch a video M3U file

    let pool = await browser.storage.local.get()
    let quality = pool.quality || 'best'

    // Get video media data
    console.log('[ BULB ] Fetching playlist', key)
    let page = await greq(root + key)
    let flash = JSON.parse(re_flash.exec(page)[2])
    
    // Select appropriate quality
    let qualities = []
    flash.mediaDefinitions.forEach(qual => {
        let value = qual.quality
        if (/^\d+$/.test(value)) qualities.push([Number(value), qual.videoUrl])
    })

    let [qual, source] = qualities.sort().slice(quality === 'best' ? 0 : -1)
    let cdn = source.split('master.m3u8')[0]
    
    // Fetch segments
    let master = await greq(source)
    let playlist = await greq(cdn + re_segment.exec(master)[1])
    let segments = re_segment.exec(playlist)

    console.log('Fetched URLS', segments)


    // Temp test with download API
    let blob = new Blob(segments)

    await browser.downloads.download({
        url: URL.createObjectURL(blob),
        filename: key + '.txt'
    })

    return responder(true)
}


browser.runtime.onMessage.addListener((msg, sender, responder) => {

    // sender.tab.id
    download(msg.key, responder)

    // Allow async return
    return true
})