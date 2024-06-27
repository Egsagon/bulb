/*
    BULB Download background script
*/

console.log('[ BACKGROUND SCRIPT RUNNING ]')

const re_segment = /(^[^#\n].+)$/gm
const re_flash = /var (flashvars_\d*) = ({.*});\n/g
const root = 'https://www.pornhub.com/view_video.php?viewkey='

// TODO - Get headers & cookies from target page for hidden/paywalled videos
const headers = new Headers({
    'Accept': '*/*', 'Samesite': 'None; Secure', 'Accept-Language': 'en,en-US',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/114.0'
})

const send_request = async (url, text = true) => {
    let req = new Request(url, {method: 'GET', headers: headers})
    let res = await fetch(req)

    if (!res.ok) 'Error: ' + url

    if (text)
        return await res.text()
    return await res
}

const download = async (key, tab, responder) => {
    // Download a single video

    let pool = await browser.storage.local.get()
    let quality = pool.quality || 'best'
    
    // Get video media data
    console.log(`[ ${key} ] Starting download`)

    try {
        let page = await send_request(root + key)
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
        let master = await send_request(source)
        let playlist = await send_request(cdn + re_segment.exec(master)[1])
        let segments = playlist.match(re_segment)

        // Start download
        let buffer = []
        let blob = new Blob([ buffer ])

        for (let index = 0; index < segments.length; index++) {
            let url = cdn + segments[index]

            // Add each segment to buffer
            console.debug(`[ ${key} ] Downloading ${index}/${segments.length}`)
            let res = await send_request(url, false)
            
            let raw = await res.blob()
            blob = new Blob([blob, raw])
            buffer.push(raw)

            // Send progress to content script
            let percentage = index / segments.length * 100
            await browser.tabs.sendMessage(tab, {'key': key, 'progress': percentage})
        }

        console.log(`[ ${key} ] Saving file`)
        responder({'type': 'success', 'message': 'Downloaded'})

        await browser.downloads.download({
            url: URL.createObjectURL(blob),
            filename: key + '.mp4'
        })
    
    }
    catch (error) {
        // responder({'type': 'error', 'message': `Error: ${error}`})
        responder({'type': 'error', 'message': `Error`})
        console.error(error)
    }
}

browser.runtime.onMessage.addListener((msg, sender, responder) => {
    // Receive messages from injection scripts

    download(msg.key, sender.tab.id, responder)
    
    // Allow async return
    return true
})

// EOF