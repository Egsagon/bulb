/*
    BULB Download background script
*/

const re_segment = /(^[^#\n].+)$/gm
const re_flash = /var (flashvars_\d*) = ({.*});\n/g
const root = 'https://www.pornhub.com/view_video.php?viewkey='

// TODO - Get headers from target page for hidden/paywalled videos
const headers = new Headers({
    'Accept': '*/*', 'Samesite': 'None; Secure', 'Accept-Language': 'en,en-US',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/114.0'
})

const greq = async (url, text = true) => {
    let req = new Request(url, {method: 'GET', headers: headers})
    let res = await fetch(req)

    if (!res.ok) 'Error: ' + url

    if (text)
        return await res.text()
    return await res
}

const download = async (key, responder) => {
    // Download a single video

    let pool = await browser.storage.local.get()
    let quality = pool.quality || 'best'
    
    // Get video media data
    console.log(`[ ${key} ] Starting download`)

    try {
        let page = await greq(root + key)
        let flash = JSON.parse(re_flash.exec(page)[2])
        
        // Select appropriate quality
        let qualities = []
        flash.mediaDefinitions.forEach(qual => {
            let value = qual.quality
            if (/^\d+$/.test(value)) qualities.push([Number(value), qual.videoUrl])
        })

        let [qual, source] = qualities.sort().slice(quality === 'best' ? 0 : -1)[0]
        let cdn = source.split('master.m3u8')[0]
        
        // Fetch segments
        let master = await greq(source)
        let playlist = await greq(cdn + re_segment.exec(master)[1])
        let segments = playlist.match(re_segment)
    
    }
    catch (error) {
        responder({'message': 'Error: Invalid video'})
        throw error
    }

    // Start download
    let buffer = []
    let blob = new Blob([ buffer ])

    for (let index = 0; index < segments.length; index++) {
        let url = cdn + segments[index]

        // Add each segment to buffer
        console.debug(`[ ${key} ] Downloading ${index}/${segments.length}`)
        res = await greq(url, false)
        
        raw = await res.blob()
        blob = new Blob([blob, raw])
        buffer.push(raw)
    }

    console.log(`[ ${key} ] Saving file`)
    responder({ 'message': 'Success' })

    await browser.downloads.download({
        url: URL.createObjectURL(blob),
        filename: key + '.mp4'
    })
}

browser.runtime.onMessage.addListener((msg, sender, responder) => {
    // Receive messages from injection scripts

    // TODO - Queue
    download(msg.key, responder)
    
    // Allow async return
    return true
})

// EOF